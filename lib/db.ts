import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL manquant : ajoute-le dans les variables d'environnement.");
}

// Requête SQL taggée : sql`select ... where id = ${id}`
export const sql = neon(url);
