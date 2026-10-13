export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h1>AgentKnowledge · Administration</h1>
      <form action="/api/admin/login" method="post">
        <label>
          Mot de passe
          <input name="password" type="password" required autoFocus style={{ display: "block", width: "100%", padding: 8, margin: "8px 0 16px" }} />
        </label>
        <button type="submit" style={{ padding: "8px 16px" }}>Entrer</button>
      </form>
      {erreur && <p style={{ color: "crimson" }}>Mot de passe incorrect.</p>}
    </main>
  );
}
