import { sql } from "@/lib/db";
import { authenticateAgent, debitCredits } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FORMATS = ["fait_source", "serie_temporelle", "comparatif", "definition", "liste_datee"] as const;
const MAX_TAGS_AUTH = 10;
const MAX_TAGS_ANON = 2;
const DEFAULT_LIMIT_AUTH = 20;
const DEFAULT_LIMIT_ANON = 5;
const MAX_LIMIT_AUTH = 100;
const MAX_LIMIT_ANON = 5;
const COST_PER_QUERY = 1;

function badRequest(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * GET /api/entries?format=&tags=a,b&q=&limit=
 * Ne renvoie que les fiches au statut "active".
 *
 * Anonyme (freemium) :
 *   - limit max 5
 *   - pas de recherche plein texte (q)
 *   - max 2 tags
 * Authentifié (Bearer) :
 *   - limit max 100
 *   - q autorisé
 *   - 1 crédit débité, solde renvoyé
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const format = searchParams.get("format");
  const tagsParam = searchParams.get("tags");
  const q = searchParams.get("q")?.trim() ?? "";
  const limitRaw = searchParams.get("limit");

  if (format !== null && !(FORMATS as readonly string[]).includes(format)) {
    return badRequest(`format invalide. Valeurs admises : ${FORMATS.join(", ")}`);
  }

  const agent = await authenticateAgent(req);
  const authenticated = agent !== null;

  if (!authenticated && q) {
    return badRequest(
      "la recherche plein texte (q) nécessite une clé API. Inscris-toi via POST /api/agents",
      401,
    );
  }

  if (q.length > 200) {
    return badRequest("requête trop longue (maximum 200 caractères)");
  }

  const maxTags = authenticated ? MAX_TAGS_AUTH : MAX_TAGS_ANON;
  const tags = (tagsParam ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length > maxTags) {
    return badRequest(
      authenticated
        ? `trop de tags (maximum ${maxTags})`
        : `trop de tags en lecture anonyme (maximum ${maxTags}). Authentifie-toi pour jusqu'à ${MAX_TAGS_AUTH} tags`,
    );
  }

  const maxLimit = authenticated ? MAX_LIMIT_AUTH : MAX_LIMIT_ANON;
  const defaultLimit = authenticated ? DEFAULT_LIMIT_AUTH : DEFAULT_LIMIT_ANON;
  const limitParam = limitRaw !== null ? Number(limitRaw) : defaultLimit;
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), maxLimit)
    : defaultLimit;

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
      access: authenticated ? "authenticated" : "anonymous",
    };
    if (!authenticated) {
      body.notice =
        "Lecture anonyme limitée (max 5 résultats, pas de q). POST /api/agents pour une clé.";
    }
    if (creditsRemaining !== undefined) {
      body.credits = creditsRemaining;
    }

    return Response.json(body);
  } catch (err) {
    console.error("GET /api/entries failed", err);
    return Response.json({ ok: false, error: "requête échouée" }, { status: 500 });
  }
}
