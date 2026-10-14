import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/activate-quarantine
 * Passe toutes les fiches en quarantaine au statut active.
 * Utile pour démarrer avec un premier jeu de données public.
 */
export async function POST(req: Request) {
  try {
    const rows = await sql`
      UPDATE entry
      SET statut = 'active',
          validated_at = COALESCE(validated_at, now()),
          updated_at = now()
      WHERE statut = 'quarantaine'
      RETURNING id
    `;

    for (const row of rows) {
      const id = (row as { id: string }).id;
      try {
        await sql`
          INSERT INTO audit_log (actor, action, target_id, detail)
          VALUES ('admin', 'statut', ${id}, '{"statut":"active","lot":"activate-quarantine"}'::jsonb)
        `;
      } catch (err) {
        console.error("audit activate ignoré", err);
      }
    }

    return NextResponse.redirect(
      new URL("/admin?activees=" + rows.length, req.url),
      303,
    );
  } catch (err) {
    console.error("POST /api/admin/activate-quarantine failed", err);
    return NextResponse.json(
      { ok: false, error: "activation échouée" },
      { status: 500 },
    );
  }
}
