import { authenticateAgent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DOC = "https://agentknowledge.vercel.app/llms.txt";

/** GET /api/me — identité et solde de l'agent authentifié. */
export async function GET(req: Request) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return Response.json(
      {
        ok: false,
        error: "clé API manquante ou invalide",
        hint: "POST /api/agents with {\"nom\":\"unique-name\"} then use Authorization: Bearer <api_key>",
        doc: DOC,
      },
      { status: 401 },
    );
  }

  return Response.json({
    ok: true,
    id: agent.id,
    nom: agent.nom,
    credits: agent.credits,
    actif: agent.actif,
  });
}
