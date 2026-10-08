import { sql } from "@/lib/db";
import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FORMATS = ["fait_source", "serie_temporelle", "comparatif", "definition", "liste_datee"];
const MAX_TAGS = 10;
const MAX_SOURCES = 10;
const MAX_PAYLOAD_BYTES = 20_000;
const MAX_CONTRIBUTIONS_PER_DAY = 50;

function bad(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * POST /api/contributions
 * En-tête : Authorization: Bearer <clé API>
 * Corps JSON : { format, tags[], payload{}, sources[{url, titre?}], observed_at? }
 * La fiche est créée en quarantaine : elle ne devient visible qu'après validation.
 */
export async function POST(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) return bad("clé API manquante ou invalide", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("corps JSON invalide");
  }

  const { format, tags, payload, sources, observed_at } = body as {
    format?: unknown;
    tags?: unknown;
    payload?: unknown;
    sources?: unknown;
    observed_at?: unknown;
  };

  if (typeof format !== "string" || !FORMATS.includes(format)) {
    return bad(`format invalide. Valeurs admises : ${FORMATS.join(", ")}`);
  }

  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > MAX_TAGS ||
    !tags.every((t) => typeof t === "string" && t.trim().length > 0 && t.length <= 50)
  ) {
    return bad(`tags : entre 1 et ${MAX_TAGS} chaînes non vides de 50 caractères au maximum`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return bad("payload : objet JSON requis");
  }
  const payloadJson = JSON.stringify(payload);
  if (new TextEncoder().encode(payloadJson).length > MAX_PAYLOAD_BYTES) {
    return bad("payload trop volumineux (20 Ko maximum)");
  }

  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    sources.length > MAX_SOURCES ||
    !sources.every(
      (s) =>
        s &&
        typeof s === "object" &&
        typeof (s as { url?: unknown }).url === "string" &&
        /^https:\/\//.test((s as { url: string }).url) &&
        (s as { url: string }).url.length <= 500,
    )
  ) {
    return bad(`sources : entre 1 et ${MAX_SOURCES} éléments, chacun avec une url https`);
  }
  const sourcesJson = JSON.stringify(sources);

  let observed: string | null = null;
  if (observed_at !== undefined && observed_at !== null) {
    const d = new Date(String(observed_at));
    if (Number.isNaN(d.getTime())) return bad("observed_at : date invalide");
    observed = d.toISOString();
  }

  try {
    const recent = await sql`
      SELECT count(*)::int AS n FROM contribution
      WHERE agent_id = ${agent.id} AND action = 'create' AND created_at > now() - interval '24 hours'
    `;
    if (recent[0].n >= MAX_CONTRIBUTIONS_PER_DAY) {
      return bad("limite quotidienne de contributions atteinte", 429);
    }

    const inserted = await sql`
      INSERT INTO entry (format, tags, payload, sources, observed_at, statut)
      VALUES (${format}, ${tags as string[]}, ${payloadJson}::jsonb, ${sourcesJson}::jsonb, ${observed}, 'quarantaine')
      RETURNING id
    `;
    const entryId = inserted[0].id;

    await sql`
      INSERT INTO contribution (agent_id, entry_id, action, verdict)
      VALUES (${agent.id}, ${entryId}, 'create', 'en_attente')
    `;

    return Response.json({ ok: true, id: entryId, statut: "quarantaine" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/contributions failed", err);
    return Response.json({ ok: false, error: "enregistrement échoué" }, { status: 500 });
  }
}
