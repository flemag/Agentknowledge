// Crée un agent et affiche sa clé API une seule fois.
// Usage : node --env-file=.env.local scripts/create-agent.mjs "nom-de-l-agent"
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (voir .env.local)");
  process.exit(1);
}

const nom = process.argv[2];
if (!nom) {
  console.error('Usage : node --env-file=.env.local scripts/create-agent.mjs "nom-de-l-agent"');
  process.exit(1);
}

const sql = neon(url);
const key = "ak_" + randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(key).digest("hex");

await sql`INSERT INTO agent (nom, cle_api_hash) VALUES (${nom}, ${hash})`;

console.log(`Agent "${nom}" créé.`);
console.log(`Clé API (affichée une seule fois, à conserver en lieu sûr) : ${key}`);
