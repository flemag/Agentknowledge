import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/me — identité et solde de l'agent authentifié. */
export async function GET(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return Response.json({ ok: false, error: "clé API manquante ou invalide" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    id: agent.id,
    nom: agent.nom,
    credits: agent.credits,
    actif: agent.actif,
  });
}
