import { createHash } from "crypto";
import { sql } from "@/lib/db";

/** Empreinte SHA-256 d'une clé API. Seule l'empreinte est stockée en base, jamais la clé. */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Lit "Authorization: Bearer <clé>" et renvoie l'agent correspondant, ou null.
 */
export async function authenticateAgent(req: Request): Promise<{ id: string; nom: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  const rows = await sql`SELECT id, nom FROM agent WHERE cle_api_hash = ${hashKey(match[1])} LIMIT 1`;
    return (rows[0] as { id: string; nom: string } | undefined) ?? null;
}
