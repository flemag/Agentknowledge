"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AgentActions({
  id,
  actif,
  credits,
}: {
  id: string;
  actif: boolean;
  credits: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setErreur(null);
    const res = await fetch(`/api/admin/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "échec");
      return;
    }
    router.refresh();
  }

  return (
    <div className="ak-row">
      <button
        className={actif ? "ak-btn ak-btn-danger" : "ak-btn ak-btn-pine"}
        disabled={busy}
        type="button"
        onClick={() => patch({ actif: !actif })}
      >
        {actif ? "Désactiver" : "Réactiver"}
      </button>
      <button
        className="ak-btn"
        disabled={busy}
        type="button"
        onClick={() => patch({ credits_delta: 50 })}
        title={`Solde actuel : ${credits}`}
      >
        +50 crédits
      </button>
      {erreur && <span className="ak-error">{erreur}</span>}
    </div>
  );
}
