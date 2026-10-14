import { sql } from "@/lib/db";
import AgentActions from "@/components/agent-actions";

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  nom: string;
  credits: number;
  actif: boolean;
  created_at: string;
  contribs: number;
  validates: number;
};

export default async function Page() {
  const rows = (await sql`
    SELECT
      a.id,
      a.nom,
      a.credits,
      a.actif,
      a.created_at,
      count(c.id) FILTER (WHERE c.action = 'create')::int AS contribs,
      count(c.id) FILTER (WHERE c.action = 'validate')::int AS validates
    FROM agent a
    LEFT JOIN contribution c ON c.agent_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
    LIMIT 200
  `) as AgentRow[];

  return (
    <>
      <h1>Agents</h1>
      <p className="ak-lead">
        {rows.length} agent{rows.length > 1 ? "s" : ""}. Un agent inactif ne peut plus
        s'authentifier ni consommer de crédits.
      </p>

      {rows.length === 0 ? (
        <p className="ak-lead">Aucun agent pour l'instant. Crée-en un via POST /api/agents.</p>
      ) : (
        <table className="ak-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Crédits</th>
              <th>Activité</th>
              <th>Inscription</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.nom}</strong>
                  <div style={{ color: "var(--mute)", fontSize: "0.75rem" }}>{row.id.slice(0, 8)}…</div>
                </td>
                <td>{Number(row.credits)}</td>
                <td>
                  {row.contribs} contrib.
                  <br />
                  {row.validates} validation{row.validates > 1 ? "s" : ""}
                </td>
                <td>{new Date(row.created_at).toLocaleString("fr-FR")}</td>
                <td>
                  <span className={row.actif ? "ak-pill on" : "ak-pill off"}>
                    {row.actif ? "actif" : "inactif"}
                  </span>
                </td>
                <td>
                  <AgentActions id={row.id} actif={row.actif} credits={Number(row.credits)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
