import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/app/:path*"]
};

function getKey() {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? "cm_session";
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
