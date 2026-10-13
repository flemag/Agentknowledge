import { sql } from "@/lib/db";
import StatutButtons from "@/components/statut-buttons";

export const dynamic = "force-dynamic";

const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 };

export default async function Page() {
  const rows = await sql`
    SELECT id, format, tags, payload, sources, observed_at, created_at
    FROM entry WHERE statut = 'quarantaine'
    ORDER BY created_at ASC LIMIT 100`;

  return (
    <>
      <h1>Quarantaine ({rows.length})</h1>
      <p>Ouvre chaque source avant de valider une fiche.</p>
      {rows.length === 0 && <p>Aucune fiche en attente.</p>}
      {rows.map((r: any) => (
        <article key={r.id} style={card}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            <code>{r.format}</code> · {(r.tags as string[]).join(", ")} · soumise le{" "}
            {new Date(r.created_at).toLocaleString("fr-FR")}
          </div>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
            {JSON.stringify(r.payload, null, 2)}
          </pre>
          <ul>
            {(r.sources as { url: string; titre?: string }[]).map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.titre ?? s.url}</a>
              </li>
            ))}
          </ul>
          <StatutButtons id={r.id} />
        </article>
      ))}
    </>
  );
}
