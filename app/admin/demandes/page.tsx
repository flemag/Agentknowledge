import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Gap = { question: string; n: number; dernier: string };

export default async function Page() {
  const rows = (await sql`
    SELECT question, count(*)::int AS n, max(created_at) AS dernier
    FROM demande
    WHERE resultat = 'vide' AND created_at > now() - interval '30 days'
    GROUP BY question
    ORDER BY n DESC, dernier DESC
    LIMIT 50`) as Gap[];

  return (
    <>
      <h1>Lacunes</h1>
      <p className="ak-lead">Questions restées sans fiche active sur 30 jours. C'est l'ordre de remplissage.</p>
      {rows.length === 0 ? (
        <p className="ak-card">Aucune question vide. Le corpus répond à ce qui a été cherché.</p>
      ) : (
        <table className="ak-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Fois</th>
              <th>Dernière</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.question}>
                <td>{row.question}</td>
                <td>{row.n}</td>
                <td>{new Date(row.dernier).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
