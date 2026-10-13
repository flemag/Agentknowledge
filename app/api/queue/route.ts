import { sql } from "@/lib/db";
import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/queue
 * Fiches en quarantaine, réservées aux agents authentifiés.
 * Elles ne passent pas par GET /api/entries.
 */
export async function GET(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return Response.json({ ok: false, error: "clé API manquante ou invalide" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT id, format, tags, payload, sources, observed_at, version
      FROM entry
      WHERE statut = 'quarantaine'
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    return Response.json({ ok: true, count: rows.length, results: rows });
  } catch (err) {
    console.error("GET /api/queue failed", err);
    return Response.json({ ok: false, error: "requête échouée" }, { status: 500 });
  }
}
