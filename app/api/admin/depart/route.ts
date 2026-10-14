import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Remet en quarantaine les fiches de départ observées le 8 octobre 2026. */
export async function POST(req: Request) {
  try {
    const rows = await sql`
      UPDATE entry
      SET statut = 'quarantaine', updated_at = now()
      WHERE statut = 'active' AND observed_at::date = DATE '2026-10-08'
      RETURNING id
    `;

    for (const row of rows) {
      const id = (row as { id: string }).id;
      try {
        await sql`
          INSERT INTO audit_log (actor, action, target_id, detail)
          VALUES ('admin', 'statut', ${id}, '{"statut":"quarantaine","lot":"depart"}'::jsonb)
        `;
      } catch (err) {
        console.error("audit depart ignoré", err);
      }
    }

    return NextResponse.redirect(new URL("/admin?remis=" + rows.length, req.url), 303);
  } catch (err) {
    console.error("POST /api/admin/depart failed", err);
    return NextResponse.json({ ok: false, error: "remise en quarantaine échouée" }, { status: 500 });
  }
}
