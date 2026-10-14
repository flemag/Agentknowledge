import { sql } from "@/lib/db";
import { authenticateAgent, debitCredits } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FORMATS = ["fait_source", "serie_temporelle", "comparatif", "definition", "liste_datee"] as const;
const MAX_TAGS = 10;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const COST_PER_QUERY = 1;

function badRequest(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * GET /api/entries?format=&tags=a,b&q=&limit=
 * Ne renvoie que les fiches au statut "active".
 * Sans clé : lecture libre (limite standard).
 * Avec clé Bearer : 1 crédit débité, solde renvoyé dans la réponse.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const format = searchParams.get("format");
  const tagsParam = searchParams.get("tags");
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);

  if (format !== null && !(FORMATS as readonly string[]).includes(format)) {
    return badRequest(`format invalide. Valeurs admises : ${FORMATS.join(", ")}`);
  }

  const tags = (tagsParam ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length > MAX_TAGS) {
    return badRequest(`trop de tags (maximum ${MAX_TAGS})`);
  }

  if (q.length > 200) {
    return badRequest("requête trop longue (maximum 200 caractères)");
  }

  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Authentification optionnelle : si clé fournie, on débite 1 crédit.
  const agent = await authenticateAgent(req);
  let creditsRemaining: number | undefined;

  if (agent) {
    const newBalance = await debitCredits(agent.id, COST_PER_QUERY);
    if (newBalance === null) {
      return badRequest("crédits insuffisants", 402);
    }
    creditsRemaining = newBalance;
  }

  const conditions: string[] = ["statut = 'active'"];
  const params: unknown[] = [];

  if (format) {
    params.push(format);
    conditions.push(`format = $${params.length}`);
  }

  if (tags.length > 0) {
    params.push(tags);
    conditions.push(`tags && $${params.length}::text[]`);
  }

  if (q) {
    params.push(q);
    conditions.push(
      `to_tsvector('french', payload::text) @@ websearch_to_tsquery('french', $${params.length})`,
    );
  }

  params.push(limit);
  const limitPlaceholder = `$${params.length}`;

  const text = `
    SELECT id, format, tags, payload, sources, observed_at, version
    FROM entry
    WHERE ${conditions.join(" AND ")}
    ORDER BY updated_at DESC
    LIMIT ${limitPlaceholder}
  `;

  try {
    const rows = await sql(text, params);
    const question = q || tags.join(" ");
    if (question) {
      try {
        const resultat = rows.length > 0 ? "repondu" : "vide";
        await sql`INSERT INTO demande (question, tags, resultat) VALUES (${question}, ${tags}, ${resultat})`;
      } catch (err) {
        console.error("journalisation de la demande échouée", err);
      }
    }

    const body: Record<string, unknown> = {
      ok: true,
      count: rows.length,
      results: rows,
    };
    if (creditsRemaining !== undefined) {
      body.credits = creditsRemaining;
    }

    return Response.json(body);
  } catch (err) {
    console.error("GET /api/entries failed", err);
    return Response.json({ ok: false, error: "requête échouée" }, { status: 500 });
  }
}
