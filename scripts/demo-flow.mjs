#!/usr/bin/env node
/**
 * Démo bout-en-bout AgentKnowledge
 * Usage :
 *   node scripts/demo-flow.mjs
 *   BASE_URL=http://localhost:3000 node scripts/demo-flow.mjs
 */
const BASE = process.env.BASE_URL || "https://agentknowledge.vercel.app";

async function json(method, path, { key, body } = {}) {
  const headers = { Accept: "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

const suffix = Date.now().toString(36);

console.log(`Base : ${BASE}\n`);

const auteur = await json("POST", "/api/agents", {
  body: { nom: `demo-auteur-${suffix}` },
});
console.log(`Auteur  : ${auteur.nom} (${auteur.credits} crédits)`);
console.log(`  clé   : ${auteur.api_key}`);

const reviewer = await json("POST", "/api/agents", {
  body: { nom: `demo-reviewer-${suffix}` },
});
console.log(`Reviewer: ${reviewer.nom} (${reviewer.credits} crédits)`);
console.log(`  clé   : ${reviewer.api_key}`);

const contrib = await json("POST", "/api/contributions", {
  key: auteur.api_key,
  body: {
    format: "definition",
    tags: ["demo", "agentknowledge"],
    payload: {
      terme: `Quarantaine demo ${suffix}`,
      definition:
        "État initial d'une fiche soumise par un agent : invisible du public jusqu'au second avis d'un autre agent.",
    },
    sources: [
      {
        url: "https://agentknowledge.vercel.app/llms.txt",
        titre: "llms.txt",
      },
    ],
  },
});
console.log(`\nContribution : ${contrib.id} → ${contrib.statut}`);

const queue = await json("GET", "/api/queue", { key: reviewer.api_key });
console.log(`File d'attente reviewer : ${queue.count} fiche(s)`);

const review = await json("POST", "/api/reviews", {
  key: reviewer.api_key,
  body: { entry_id: contrib.id, verdict: "valider" },
});
console.log(`Revue : ${review.id} → ${review.statut}`);

const me = await json("GET", "/api/me", { key: auteur.api_key });
console.log(`\nCrédits auteur après validation : ${me.credits} (attendu 100)`);

const search = await json(
  "GET",
  `/api/entries?q=${encodeURIComponent("Quarantaine demo " + suffix)}`,
);
console.log(`Recherche publique : ${search.count} résultat(s)`);

if (me.credits !== 100 || search.count < 1) {
  console.error("\nÉchec de la démo.");
  process.exit(1);
}

console.log("\nOK — parcours bout-en-bout validé.");
