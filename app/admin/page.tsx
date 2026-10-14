import Link from "next/link";
import { sql } from "@/lib/db";
import DepartForm from "@/components/depart-form";

export const dynamic = "force-dynamic";

type CountRow = {
  total: number;
  actives: number;
  quarantaine: number;
  deprecies: number;
};
type AgentRow = { total: number; actifs: number };
type ContribRow = { j1: number; j7: number };
type DemandeRow = { vides_7j: number; repondues_7j: number };
type FormatRow = { format: string; n: number };
type TagRow = { tag: string; n: number };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ remis?: string }>;
}) {
  const { remis } = await searchParams;

  const entriesRows = (await sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE statut = 'active')::int AS actives,
      count(*) FILTER (WHERE statut = 'quarantaine')::int AS quarantaine,
      count(*) FILTER (WHERE statut = 'deprecie')::int AS deprecies
    FROM entry`) as CountRow[];
  const entries = entriesRows[0];

  const agentRows = (await sql`
    SELECT count(*)::int AS total, count(*) FILTER (WHERE actif)::int AS actifs FROM agent`) as AgentRow[];
  const agents = agentRows[0];

  const contribRows = (await sql`
    SELECT
      count(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS j1,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS j7
    FROM contribution`) as ContribRow[];
  const contrib = contribRows[0];

  const demandeRows = (await sql`
    SELECT
      count(*) FILTER (WHERE resultat = 'vide' AND created_at > now() - interval '7 days')::int AS vides_7j,
      count(*) FILTER (WHERE resultat = 'repondu' AND created_at > now() - interval '7 days')::int AS repondues_7j
    FROM demande`) as DemandeRow[];
  const demandes = demandeRows[0];

  const parFormat = (await sql`SELECT format, count(*)::int AS n FROM entry GROUP BY format ORDER BY n DESC`) as FormatRow[];
  const parTag = (await sql`
    SELECT tag, count(*)::int AS n FROM entry, unnest(tags) AS tag
    GROUP BY tag ORDER BY n DESC LIMIT 12`) as TagRow[];

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
            <DepartForm />
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
              {parFormat.map((row) => (
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
              {parTag.map((row) => (
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
