"use client";

export default function DepartForm() {
  return (
    <form
      action="/api/admin/depart"
      method="post"
      onSubmit={(event) => {
        const ok = window.confirm(
          "Remettre les fiches du 8 octobre 2026 en quarantaine ? Elles disparaîtront de la recherche publique jusqu'à un nouveau second avis.",
        );
        if (!ok) event.preventDefault();
      }}
    >
      <button className="ak-btn" type="submit">
        Remettre le lot de départ en quarantaine
      </button>
    </form>
  );
}
