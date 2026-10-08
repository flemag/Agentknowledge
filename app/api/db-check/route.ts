import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await sql`select count(*)::int as entries from entry`;
    return Response.json({ ok: true, entries: rows[0].entries });
  } catch (err) {
    console.error("db-check failed", err);
    return Response.json({ ok: false, error: "connexion ou requête échouée" }, { status: 500 });
  }
}
