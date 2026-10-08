export default function Home() {
  return (
    <main>
      <h1>AgentKnowledge</h1>
      <p>Base de connaissances en construction.</p>
      <ul>
        <li><a href="/api/health">/api/health</a> : vérifie que l'application répond</li>
        <li><a href="/api/db-check">/api/db-check</a> : vérifie la connexion à la base</li>
      </ul>
    </main>
  );
}
