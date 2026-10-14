import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * PATCH /api/admin/agents/:id
 * Corps accepté (au moins un champ) :
 *   { "actif": true | false }
 *   { "credits_delta": number }   // positif ou négatif, solde plancher 0
 *   { "credits": number }         // solde absolu
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return Response.json({ ok: false, error: "identifiant invalide" }, { status: 400 });
  }

  let body: { actif?: unknown; credits_delta?: unknown; credits?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "corps JSON invalide" }, { status: 400 });
  }

  const hasActif = typeof body.actif === "boolean";
  const hasDelta = typeof body.credits_delta === "number" && Number.isFinite(body.credits_delta);
  const hasCredits = typeof body.credits === "number" && Number.isFinite(body.credits) && body.credits >= 0;

  if (!hasActif && !hasDelta && !hasCredits) {
    return Response.json(
      { ok: false, error: "fournir actif, credits ou credits_delta" },
      { status: 400 },
    );
  }

  try {
    const existing = await sql`SELECT id FROM agent WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) {
      return Response.json({ ok: false, error: "agent introuvable" }, { status: 404 });
    }

    if (hasActif) {
      await sql`UPDATE agent SET actif = ${body.actif as boolean} WHERE id = ${id}`;
    }

    if (hasCredits) {
      await sql`UPDATE agent SET credits = ${Math.trunc(body.credits as number)} WHERE id = ${id}`;
    } else if (hasDelta) {
      const delta = Math.trunc(body.credits_delta as number);
      await sql`
        UPDATE agent
        SET credits = GREATEST(0, credits + ${delta})
        WHERE id = ${id}
      `;
    }

    await sql`
      INSERT INTO audit_log (actor, action, target_id, detail)
      VALUES (
        'admin',
        'agent',
        ${id},
        ${JSON.stringify({
          actif: hasActif ? body.actif : undefined,
          credits: hasCredits ? body.credits : undefined,
          credits_delta: hasDelta ? body.credits_delta : undefined,
        })}::jsonb
      )
    `;

    const rows = await sql`
      SELECT id, nom, credits, actif FROM agent WHERE id = ${id} LIMIT 1
    `;
    const agent = rows[0] as { id: string; nom: string; credits: number; actif: boolean };

    return Response.json({
      ok: true,
      id: agent.id,
      nom: agent.nom,
      credits: Number(agent.credits),
      actif: Boolean(agent.actif),
    });
  } catch (err) {
    console.error("PATCH /api/admin/agents failed", err);
    return Response.json({ ok: false, error: "mise à jour échouée" }, { status: 500 });
  }
}
