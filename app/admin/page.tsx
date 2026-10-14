import Link from "next/link";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ remis?: string }>;
}) {
  const { remis } = await searchParams;

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
    GROUP BY tag ORDER BY n DESC LIMIT 12`;

  const taux =
    demandes.repondues_7j + demandes.vides_7j > 0
      ? Math.round((100 * demandes.repondues_7j) / (demandes.repondues_7j + demandes.vides_7j)) + " %"
      : "—";

  return (
    <>
      <h1>Vue d'ensemble</h1>
      <p className="ak-lead">Ce qui est public, ce qui attend un second avis, et ce que les agents demandent.</p>

      {remis ? (
        <p className="ak-callout">{remis} fiche{remis === "1" ? "" : "s"} remise{remis === "1" ? "" : "s"} en quarantaine.</p>
      ) : null}

      {entries.quarantaine === 0 && entries.actives > 0 ? (
        <section className="ak-callout">
          <p>
            Les fiches de départ sont toutes actives. Si tu les as validées pendant les tests, tu peux les
            relire une par une, ou remettre le lot du 8 octobre 2026 en quarantaine.
          </p>
          <div className="ak-row">
            <Link className="ak-btn ak-btn-ink" href="/admin/fiches?statut=active">Relire les fiches actives</Link>
            <form action="/api/admin/depart" method="post">
              <button className="ak-btn" type="submit">Remettre le lot de départ en quarantaine</button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="ak-kpis">
        <div className="ak-kpi"><span>Actives</span><strong>{entries.actives}</strong><em>{entries.total} au total</em></div>
        <div className="ak-kpi"><span>Quarantaine</span><strong>{entries.quarantaine}</strong><em>invisibles au public</em></div>
        <div className="ak-kpi"><span>Dépréciées</span><strong>{entries.deprecies}</strong></div>
        <div className="ak-kpi"><span>Agents</span><strong>{agents.total}</strong><em>{agents.actifs} actifs</em></div>
        <div className="ak-kpi"><span>Contributions 24 h</span><strong>{contrib.j1}</strong><em>{contrib.j7} sur 7 jours</em></div>
        <div className="ak-kpi"><span>Réponse 7 j</span><strong>{taux}</strong><em>{demandes.vides_7j} questions vides</em></div>
      </section>

      <section className="ak-grid two">
        <div className="ak-card">
          <h2>Par format</h2>
          <table className="ak-table">
            <tbody>
              {parFormat.map((row: { format: string; n: number }) => (
                <tr key={row.format}>
                  <td><Link href={`/admin/fiches?format=${row.format}`}>{row.format}</Link></td>
                  <td style={{ textAlign: "right" }}>{row.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ak-card">
          <h2>Tags</h2>
          <table className="ak-table">
            <tbody>
              {parTag.map((row: { tag: string; n: number }) => (
                <tr key={row.tag}>
                  <td><Link href={`/admin/fiches?q=${encodeURIComponent(row.tag)}`}>{row.tag}</Link></td>
                  <td style={{ textAlign: "right" }}>{row.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
