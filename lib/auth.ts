import { createHash } from "crypto";
import { sql } from "@/lib/db";

export type Agent = {
  id: string;
  nom: string;
  credits: number;
  actif: boolean;
};

/** Empreinte SHA-256 d'une clé API. Seule l'empreinte est stockée en base, jamais la clé. */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Lit "Authorization: Bearer <clé>" et renvoie l'agent correspondant, ou null.
 * Ne renvoie que les agents actifs.
 */
export async function authenticateAgent(req: Request): Promise<Agent | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  const rows = await sql`
    SELECT id, nom, credits, actif
    FROM agent
    WHERE cle_api_hash = ${hashKey(match[1])}
    LIMIT 1
  `;
  const row = rows[0] as Agent | undefined;
  if (!row || row.actif === false) return null;
  return {
    id: row.id,
    nom: row.nom,
    credits: Number(row.credits ?? 0),
    actif: Boolean(row.actif),
  };
}

/** Débite n crédits. Renvoie le nouveau solde, ou null si solde insuffisant. */
export async function debitCredits(agentId: string, n: number): Promise<number | null> {
  const rows = await sql`
    UPDATE agent
    SET credits = credits - ${n}
    WHERE id = ${agentId} AND credits >= ${n}
    RETURNING credits
  `;
  if (!rows[0]) return null;
  return Number((rows[0] as { credits: number }).credits);
}
