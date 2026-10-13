import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await sql`
    SELECT question, count(*)::int AS n, max(created_at) AS dernier
    FROM demande
    WHERE resultat = 'vide' AND created_at > now() - interval '30 days'
    GROUP BY question
    ORDER BY n DESC, dernier DESC
    LIMIT 50`;

  return (
    <>
      <h1>Questions sans réponse (30 jours)</h1>
      <p>Ce sont les sujets à remplir en priorité.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: 8 }}>Question</th>
            <th style={{ padding: 8 }}>Occurrences</th>
            <th style={{ padding: 8 }}>Dernière fois</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.question} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: 8 }}>{r.question}</td>
              <td style={{ padding: 8 }}>{r.n}</td>
              <td style={{ padding: 8 }}>{new Date(r.dernier).toLocaleString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p>Aucune question sans réponse sur les 30 derniers jours.</p>}
    </>
  );
}
