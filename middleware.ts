import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "ak_admin";
const PUBLIC_ADMIN_PATHS = ["/admin-login", "/api/admin/login"];

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Protège /admin et /api/admin : seul un cookie issu du mot de passe admin est accepté. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("ADMIN_PASSWORD n'est pas configuré", { status: 500 });
  }

  const expected = await sha256Hex("admin:" + password);
  if (req.cookies.get(COOKIE)?.value === expected) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ ok: false, error: "non autorisé" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin-login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
