"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIONS = [
  { statut: "active", label: "Valider", tone: "ak-btn ak-btn-pine" },
  { statut: "quarantaine", label: "Remettre en quarantaine", tone: "ak-btn" },
  { statut: "deprecie", label: "Déprécier", tone: "ak-btn ak-btn-danger" },
] as const;

export default function StatutButtons({ id, statut }: { id: string; statut: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(next: "active" | "quarantaine" | "deprecie") {
    setBusy(true);
    setErreur(null);
    const res = await fetch(`/api/admin/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErreur(body.error ?? "échec de la mise à jour");
      return;
    }
    router.refresh();
  }

  return (
    <div className="ak-row" style={{ marginTop: 12 }}>
      {ACTIONS.filter((action) => action.statut !== statut).map((action) => (
        <button key={action.statut} className={action.tone} disabled={busy} onClick={() => changer(action.statut)} type="button">
          {action.label}
        </button>
      ))}
      {erreur && <span className="ak-error">{erreur}</span>}
    </div>
  );
}
