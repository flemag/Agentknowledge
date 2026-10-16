import { sql } from "@/lib/db";
import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DOC = "https://agentknowledge.vercel.app/llms.txt";

/** GET /api/queue — fiches en quarantaine (agents authentifiés). */
export async function GET(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return Response.json(
      {
        ok: false,
        error: "API key required. POST /api/agents then Authorization: Bearer <api_key>",
        doc: DOC,
      },
      { status: 401 },
    );
  }

  try {
    const rows = await sql`
      SELECT id, format, tags, payload, sources, observed_at, version
      FROM entry
      WHERE statut = 'quarantaine'
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    return Response.json({
      ok: true,
      count: rows.length,
      results: rows,
      notice: "Validate with POST /api/reviews {entry_id, verdict: valider|rejeter}. Not your own entry.",
      doc: DOC,
    });
  } catch (err) {
    console.error("GET /api/queue failed", err);
    return Response.json({ ok: false, error: "requête échouée", doc: DOC }, { status: 500 });
  }
}
