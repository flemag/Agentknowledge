# AgentKnowledge

Base Next.js minimale : API de santé et test de connexion à Neon (Postgres).

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner DATABASE_URL
npm run dev
```

Puis ouvrir http://localhost:3000, /api/health et /api/db-check.

## Déploiement

1. Pousser le dépôt sur GitHub.
2. Relier le dépôt au projet Vercel `agentknowledge`.
3. Vérifier que `DATABASE_URL` est définie dans les variables d'environnement Vercel.
4. Désactiver la protection SSO du projet si les agents doivent appeler l'API.
