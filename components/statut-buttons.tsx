"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StatutButtons({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(statut: "active" | "deprecie") {
    setBusy(true);
    setErreur(null);
    const res = await fetch(`/api/admin/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErreur(j.error ?? "échec de la mise à jour");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button disabled={busy} onClick={() => changer("active")} style={{ padding: "6px 12px" }}>
        Valider
      </button>
      <button disabled={busy} onClick={() => changer("deprecie")} style={{ padding: "6px 12px" }}>
        Rejeter
      </button>
      {erreur && <span style={{ color: "crimson" }}>{erreur}</span>}
    </div>
  );
}
