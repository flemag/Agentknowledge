import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json({ ok: false, error: "ADMIN_PASSWORD non configuré" }, { status: 500 });
  }

  const form = await req.formData();
  const given = Buffer.from(String(form.get("password") ?? ""));
  const expected = Buffer.from(password);
  const valid = given.length === expected.length && timingSafeEqual(given, expected);

  if (!valid) {
    return NextResponse.redirect(new URL("/admin-login?erreur=1", req.url), 303);
  }

  const token = createHash("sha256").update("admin:" + password).digest("hex");
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set("ak_admin", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
