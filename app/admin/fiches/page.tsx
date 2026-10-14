import { sql } from "@/lib/db";
import StatutButtons from "@/components/statut-buttons";
import { FicheBody, titreDe } from "@/components/fiche-body";

export const dynamic = "force-dynamic";

const STATUTS = ["", "active", "quarantaine", "deprecie"];
const FORMATS = ["", "fait_source", "serie_temporelle", "comparatif", "definition", "liste_datee"];

type Row = {
  id: string;
  format: string;
  tags: string[];
  payload: Record<string, unknown>;
  sources: { url: string; titre?: string }[];
  statut: string;
  observed_at: string | null;
  updated_at: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; format?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const statut = STATUTS.includes(sp.statut ?? "") ? sp.statut ?? "" : "";
  const format = FORMATS.includes(sp.format ?? "") ? sp.format ?? "" : "";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const like = q ? "%" + q + "%" : null;

  const rows = (await sql`
    SELECT id, format, tags, payload, sources, statut, observed_at, updated_at
    FROM entry
    WHERE (${statut} = '' OR statut = ${statut})
      AND (${format} = '' OR format = ${format})
      AND (
        ${like}::text IS NULL
        OR payload::text ILIKE ${like}
        OR array_to_string(tags, ' ') ILIKE ${like}
      )
    ORDER BY updated_at DESC
    LIMIT 100
  `) as Row[];

  return (
    <>
      <h1>Toutes les fiches</h1>
      <p className="ak-lead">{rows.length} fiche{rows.length > 1 ? "s" : ""} affichée{rows.length > 1 ? "s" : ""}. Le public ne voit que le statut active.</p>
      <form className="ak-filters" action="/admin/fiches">
        <input name="q" defaultValue={q} placeholder="Rechercher un énoncé ou un tag" />
        <select name="statut" defaultValue={statut}>
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="quarantaine">Quarantaine</option>
          <option value="deprecie">Dépréciées</option>
        </select>
        <select name="format" defaultValue={format}>
          <option value="">Tous les formats</option>
          {FORMATS.filter(Boolean).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className="ak-btn ak-btn-ink" type="submit">Filtrer</button>
      </form>
      <div className="ak-grid">
        {rows.length === 0 ? <p className="ak-lead">Aucune fiche pour ce filtre.</p> : null}
        {rows.map((row) => (
          <article className="ak-card" key={row.id}>
            <div className="ak-meta">
              <span className="ak-pill">{row.format}</span>
              <span className={row.statut === "active" ? "ak-pill on" : row.statut === "quarantaine" ? "ak-pill wait" : "ak-pill off"}>
                {row.statut}
              </span>
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
            <StatutButtons id={row.id} statut={row.statut} />
          </article>
        ))}
      </div>
    </>
  );
}
