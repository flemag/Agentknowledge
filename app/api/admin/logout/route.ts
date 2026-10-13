import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin-login", req.url), 303);
  res.cookies.set("ak_admin", "", { path: "/", maxAge: 0 });
  return res;
}
