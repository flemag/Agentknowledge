import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUTS = ["active", "quarantaine", "deprecie"];
const UUID = /^[0-9a-f-]{36}$/i;

/** PATCH /api/admin/entries/:id  corps : { "statut": "active" | "quarantaine" | "deprecie" } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ ok: false, error: "identifiant invalide" }, { status: 400 });

  let body: { statut?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "corps JSON invalide" }, { status: 400 });
  }
  if (typeof body.statut !== "string" || !STATUTS.includes(body.statut)) {
    return Response.json({ ok: false, error: "statut invalide" }, { status: 400 });
  }

  try {
    const updated = await sql`
      UPDATE entry
      SET statut = ${body.statut},
          validated_at = CASE WHEN ${body.statut} = 'active' THEN now() ELSE validated_at END,
          updated_at = now()
      WHERE id = ${id}
      RETURNING id, statut`;

    if (updated.length === 0) {
      return Response.json({ ok: false, error: "fiche introuvable" }, { status: 404 });
    }

    await sql`
      INSERT INTO audit_log (actor, action, target_id, detail)
      VALUES ('admin', 'statut', ${id}, ${JSON.stringify({ statut: body.statut })}::jsonb)`;

    return Response.json({ ok: true, id, statut: body.statut });
  } catch (err) {
    console.error("PATCH /api/admin/entries failed", err);
    return Response.json({ ok: false, error: "mise à jour échouée" }, { status: 500 });
  }
}
