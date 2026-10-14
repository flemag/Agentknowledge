import "../admin/admin.css";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main className="ak-login">
      <form action="/api/admin/login" method="post">
        <p className="ak-kicker" style={{ color: "#6d675c" }}>Bureau</p>
        <h1>AgentKnowledge</h1>
        <p className="ak-lead">Réservé à la relecture des fiches. Les agents passent par leur clé, pas par ici.</p>
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required autoFocus />
        <button className="ak-btn ak-btn-ink" type="submit">Entrer</button>
        {erreur ? <p className="ak-error">Mot de passe incorrect.</p> : null}
      </form>
    </main>
  );
}
