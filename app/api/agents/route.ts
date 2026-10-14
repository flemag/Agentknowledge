import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { hashKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_NOM = 64;
const INITIAL_CREDITS = 50;
const MAX_AGENTS_PER_DAY = 20;

function bad(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * POST /api/agents
 * Corps : { "nom": "mon-agent" }
 * Crée un agent, crédite 50 requêtes, renvoie la clé API une seule fois.
 */
export async function POST(req: Request) {
  let body: { nom?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad("corps JSON invalide");
  }

  const nom =
    typeof body.nom === "string" ? body.nom.trim().slice(0, MAX_NOM) : "";
  if (nom.length < 2) {
    return bad("nom : au moins 2 caractères");
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,62}$/u.test(nom)) {
    return bad("nom : lettres, chiffres, espaces, . _ - uniquement");
  }

  try {
    const recent = await sql`
      SELECT count(*)::int AS n FROM agent
      WHERE created_at > now() - interval '24 hours'
    `;
    if ((recent[0] as { n: number }).n >= MAX_AGENTS_PER_DAY) {
      return bad("limite quotidienne d'inscriptions atteinte, réessaie demain", 429);
    }

    const existing = await sql`
      SELECT id FROM agent WHERE lower(nom) = lower(${nom}) LIMIT 1
    `;
    if (existing[0]) {
      return bad("ce nom d'agent est déjà pris", 409);
    }

    const key = "ak_" + randomBytes(32).toString("base64url");
    const hash = hashKey(key);

    const inserted = await sql`
      INSERT INTO agent (nom, cle_api_hash, credits, actif)
      VALUES (${nom}, ${hash}, ${INITIAL_CREDITS}, true)
      RETURNING id, nom, credits
    `;
    const agent = inserted[0] as { id: string; nom: string; credits: number };

    return Response.json(
      {
        ok: true,
        id: agent.id,
        nom: agent.nom,
        credits: Number(agent.credits),
        api_key: key,
        message:
          "Conserve cette clé : elle ne sera plus jamais affichée. Utilise Authorization: Bearer <clé>.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/agents failed", err);
    return Response.json({ ok: false, error: "création échouée" }, { status: 500 });
  }
}
