type Payload = Record<string, unknown>;

export function titreDe(payload: Payload): string {
  for (const key of ["terme", "titre", "mesure"]) {
    const value = payload[key];
    if (typeof value === "string" && value) return value;
  }
  if (typeof payload.enonce === "string") {
    return payload.enonce.length > 160 ? payload.enonce.slice(0, 157) + "\u2026" : payload.enonce;
  }
  return "Fiche";
}

export function FicheBody({ payload }: { payload: Payload }) {
  if (typeof payload.definition === "string") return <p>{payload.definition}</p>;

  const events = Array.isArray(payload.evenements)
    ? payload.evenements
    : Array.isArray(payload.items)
      ? payload.items
      : null;
  if (events) {
    return (
      <ol>
        {events.map((item, index) => {
          const row = item as { date?: string; evenement?: string; libelle?: string };
          return (
            <li key={index}>
              <strong>{row.date}</strong> {row.evenement || row.libelle}
            </li>
          );
        })}
      </ol>
    );
  }

  if (payload.criteres && typeof payload.criteres === "object" && !Array.isArray(payload.criteres)) {
    const criteres = payload.criteres as Record<string, Record<string, string>>;
    return (
      <div>
        {Object.entries(criteres).map(([critere, valeurs]) => (
          <div className="ak-note" key={critere}>
            <div className="ak-pill">{critere.replace(/_/g, " ")}</div>
            {Object.entries(valeurs).map(([entite, valeur]) => (
              <p key={entite}>
                <strong>{entite}</strong> {" — "} {valeur}
              </p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(payload.points)) {
    return (
      <ol>
        {payload.points.map((point, index) => {
          const row = point as { date?: string; valeur?: string };
          return (
            <li key={index}>
              {row.date} {" — "} <strong>{row.valeur}</strong>
              {typeof payload.unite === "string" ? " " + payload.unite : ""}
            </li>
          );
        })}
      </ol>
    );
  }

  if (typeof payload.precision === "string") return <p className="ak-lead">{payload.precision}</p>;
  return null;
}
