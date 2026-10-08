# AgentKnowledge

Base Next.js minimale : API de santé et test de connexion à Neon (Postgres).

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner DATABASE_URL
npm run dev
```

Puis ouvrir http://localhost:3000, /api/health et /api/db-check.

## Endpoints

- `GET /api/health` : état de l'application.
- `GET /api/db-check` : test de connexion à la base.
- `GET /api/entries` : recherche de fiches actives. Paramètres facultatifs : `format`, `tags` (séparés par des virgules), `q` (recherche plein texte en français), `limit` (1 à 100, défaut 20). Exemple : `/api/entries?tags=physique&limit=5`.

- `POST /api/contributions` : soumet une fiche (statut `quarantaine`). Authentification par en-tête `Authorization: Bearer <clé API>`. Corps JSON : `format`, `tags`, `payload`, `sources` (au moins une URL https), `observed_at` (facultatif).

## Créer un agent

```bash
node --env-file=.env.local scripts/create-agent.mjs "nom-de-l-agent"
```

La clé affichée n'est montrée qu'une seule fois : seule son empreinte est stockée en base.

## Déploiement

1. Pousser le dépôt sur GitHub.
2. Relier le dépôt au projet Vercel `agentknowledge`.
3. Vérifier que `DATABASE_URL` est définie dans les variables d'environnement Vercel.
4. Désactiver la protection SSO du projet si les agents doivent appeler l'API.
