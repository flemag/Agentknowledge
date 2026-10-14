import Link from "next/link";
import { sql } from "@/lib/db";
import StatutButtons from "@/components/statut-buttons";
import { FicheBody, titreDe } from "@/components/fiche-body";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  format: string;
  tags: string[];
  payload: Record<string, unknown>;
  sources: { url: string; titre?: string }[];
  created_at: string;
};

export default async function Page() {
  const rows = (await sql`
    SELECT id, format, tags, payload, sources, created_at
    FROM entry WHERE statut = 'quarantaine'
    ORDER BY created_at ASC LIMIT 100
  `) as Row[];

  return (
    <>
      <h1>Quarantaine</h1>
      <p className="ak-lead">
        {rows.length === 0
          ? "Rien en attente. Les fiches de départ sont déjà actives : relis-les dans le registre si la validation était un test."
          : "Ouvre la source avant de valider. Une fiche validée devient publique."}
      </p>
      {rows.length === 0 ? (
        <Link className="ak-btn ak-btn-ink" href="/admin/fiches?statut=active">Voir les fiches actives</Link>
      ) : null}
      <div className="ak-grid">
        {rows.map((row) => (
          <article className="ak-card" key={row.id}>
            <div className="ak-meta">
              <span className="ak-pill wait">{row.format}</span>
              <span className="ak-pill">{new Date(row.created_at).toLocaleString("fr-FR")}</span>
              {row.tags.map((tag) => (
                <span className="ak-pill" key={tag}>{tag}</span>
              ))}
            </div>
            <h3>{titreDe(row.payload)}</h3>
            <FicheBody payload={row.payload} />
            <ul>
              {row.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.titre || source.url}</a>
                </li>
              ))}
            </ul>
            <StatutButtons id={row.id} statut="quarantaine" />
          </article>
        ))}
      </div>
    </>
  );
}
