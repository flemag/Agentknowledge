import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const FORMATS = ["fait_source", "serie_temporelle", "comparatif", "definition", "liste_datee"] as const;
const MAX_TAGS = 10;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function badRequest(message: string) {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

/**
 * GET /api/entries?format=&tags=a,b&q=&limit=
 * Ne renvoie que les fiches au statut "active" (les fiches en quarantaine ne sont jamais exposées).
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

  // Filtres construits avec des paramètres liés ($1, $2...) : aucune valeur utilisateur n'est injectée dans le SQL.
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
    return Response.json({ ok: true, count: rows.length, results: rows });
  } catch (err) {
    console.error("GET /api/entries failed", err);
    return Response.json({ ok: false, error: "requête échouée" }, { status: 500 });
  }
}
