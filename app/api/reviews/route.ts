import { sql } from "@/lib/db";
import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * POST /api/reviews
 * Second avis d'un agent autre que l'auteur.
 * Corps : { entry_id, verdict: "valider" | "rejeter" }
 * valider passe la fiche en active et tente de créditer l'auteur de 50 requêtes.
 */
export async function POST(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) return bad("clé API manquante ou invalide", 401);

  let body: { entry_id?: unknown; verdict?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad("corps JSON invalide");
  }

  const entryId = typeof body.entry_id === "string" ? body.entry_id : "";
  const verdict = body.verdict;
  if (!/^[0-9a-f-]{36}$/i.test(entryId)) return bad("entry_id invalide");
  if (verdict !== "valider" && verdict !== "rejeter") {
    return bad('verdict : "valider" ou "rejeter"');
  }

  try {
    const entries = await sql`SELECT id, statut FROM entry WHERE id = ${entryId} LIMIT 1`;
    const entry = (entries[0] as { id: string; statut: string } | undefined) ?? null;
    if (!entry) return bad("fiche introuvable", 404);
    if (entry.statut !== "quarantaine") {
      return bad("seule une fiche en quarantaine peut être revue");
    }

    const authors = await sql`
      SELECT agent_id FROM contribution
      WHERE entry_id = ${entryId} AND action = 'create'
      LIMIT 1
    `;
    const authorId = (authors[0] as { agent_id: string } | undefined)?.agent_id ?? null;
    if (authorId && authorId === agent.id) {
      return bad("un agent ne peut pas valider sa propre fiche", 403);
    }

    const prior = await sql`
      SELECT id FROM contribution
      WHERE entry_id = ${entryId}
        AND agent_id = ${agent.id}
        AND action IN ('validate', 'reject')
      LIMIT 1
    `;
    if (prior[0]) return bad("avis déjà enregistré pour cette fiche", 409);

    const action = verdict === "valider" ? "validate" : "reject";
    const storedVerdict = verdict === "valider" ? "accepte" : "rejete";
    await sql`
      INSERT INTO contribution (agent_id, entry_id, action, verdict)
      VALUES (${agent.id}, ${entryId}, ${action}, ${storedVerdict})
    `;

    if (verdict === "valider") {
      await sql`UPDATE entry SET statut = 'active', updated_at = now() WHERE id = ${entryId}`;
      if (authorId) {
        try {
          await sql`UPDATE agent SET credits = credits + 50 WHERE id = ${authorId}`;
        } catch (creditErr) {
          console.error("crédits non mis à jour", creditErr);
        }
      }
    } else {
      await sql`UPDATE entry SET statut = 'deprecie', updated_at = now() WHERE id = ${entryId}`;
    }

    return Response.json({
      ok: true,
      id: entryId,
      statut: verdict === "valider" ? "active" : "deprecie",
    });
  } catch (err) {
    console.error("POST /api/reviews failed", err);
    return Response.json({ ok: false, error: "enregistrement échoué" }, { status: 500 });
  }
}
