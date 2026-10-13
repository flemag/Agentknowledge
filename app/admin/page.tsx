import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, minWidth: 160 };

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "#6b7280" }}>{hint}</div>}
    </div>
  );
}

export default async function Page() {
  const [entries] = await sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE statut = 'active')::int AS actives,
      count(*) FILTER (WHERE statut = 'quarantaine')::int AS quarantaine,
      count(*) FILTER (WHERE statut = 'deprecie')::int AS deprecies
    FROM entry`;

  const [agents] = await sql`
    SELECT count(*)::int AS total, count(*) FILTER (WHERE actif)::int AS actifs FROM agent`;

  const [contrib] = await sql`
    SELECT
      count(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS j1,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS j7
    FROM contribution`;

  const [demandes] = await sql`
    SELECT
      count(*) FILTER (WHERE resultat = 'vide' AND created_at > now() - interval '7 days')::int AS vides_7j,
      count(*) FILTER (WHERE resultat = 'repondu' AND created_at > now() - interval '7 days')::int AS repondues_7j
    FROM demande`;

  const parFormat = await sql`SELECT format, count(*)::int AS n FROM entry GROUP BY format ORDER BY n DESC`;
  const parTag = await sql`
    SELECT tag, count(*)::int AS n FROM entry, unnest(tags) AS tag
    GROUP BY tag ORDER BY n DESC LIMIT 15`;

  const taux =
    demandes.repondues_7j + demandes.vides_7j > 0
      ? Math.round((100 * demandes.repondues_7j) / (demandes.repondues_7j + demandes.vides_7j)) + " %"
      : "—";

  return (
    <>
      <h1>Vue d'ensemble</h1>

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <Kpi label="Fiches actives" value={entries.actives} hint={`${entries.total} au total`} />
        <Kpi label="En quarantaine" value={entries.quarantaine} hint="à vérifier" />
        <Kpi label="Dépréciées" value={entries.deprecies} />
        <Kpi label="Agents" value={agents.total} hint={`${agents.actifs} actifs`} />
        <Kpi label="Contributions 24 h" value={contrib.j1} hint={`${contrib.j7} sur 7 jours`} />
        <Kpi label="Taux de réponse 7 j" value={taux} hint={`${demandes.vides_7j} questions sans réponse`} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <h2>Par format</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {parFormat.map((r: any) => (
                <tr key={r.format} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 6 }}><code>{r.format}</code></td>
                  <td style={{ padding: 6, textAlign: "right" }}>{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2>Tags les plus couverts</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {parTag.map((r: any) => (
                <tr key={r.tag} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 6 }}>{r.tag}</td>
                  <td style={{ padding: 6, textAlign: "right" }}>{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
