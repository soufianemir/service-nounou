import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/app/:path*", "/connexion", "/inscription"]
};

function getKey() {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  // Safety-net for stale cached/PWA clients that might POST to public pages.
  if (req.method === "POST" && req.nextUrl.pathname === "/connexion") {
    return NextResponse.redirect(new URL("/api/auth/login", req.url), 307);
  }
  if (req.method === "POST" && req.nextUrl.pathname === "/inscription") {
    return NextResponse.redirect(new URL("/api/auth/signup", req.url), 307);
  }

  if (!req.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const cookieName = process.env.SESSION_COOKIE_NAME ?? "cn_session";
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const key = getKey();
  if (!key) {
    // Misconfiguration: treat as unauthenticated
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/connexion", req.url));
    res.cookies.set(cookieName, "", { maxAge: 0, path: "/" });
    return res;
  }
}
