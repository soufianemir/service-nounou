import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export type Session = {
  sub: string; // userId
  email: string;
  householdId: string;
  membershipId: string;
  role: "PARENT" | "EMPLOYEE";
};

function getKey() {
  return new TextEncoder().encode(env.SESSION_JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionJwt(session: Session): Promise<string> {
  const jwt = await new SignJWT({
    email: session.email,
    householdId: session.householdId,
    membershipId: session.membershipId,
    role: session.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(session.sub)
    .setExpirationTime("7d")
    .sign(getKey());

  return jwt;
}

export async function setSessionCookie(token: string) {
  const secure = env.SESSION_COOKIE_SECURE ?? env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/"
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  // Ensure cookie is cleared reliably across environments (path must match).
  const secure = env.SESSION_COOKIE_SECURE ?? env.NODE_ENV === "production";
  cookieStore.set(env.SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(0)
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getKey());
    const session: Session = {
      sub: String(payload.sub),
      email: String(payload.email),
      householdId: String(payload.householdId),
      membershipId: String(payload.membershipId),
      role: (payload.role as any) ?? "EMPLOYEE"
    };
    if (!session.sub || !session.householdId || !session.membershipId) return null;
    return session;
  } catch {
    return null;
  }
}

/** Convenience helper used by Server Components. API routes should prefer getSession() + 401/403 responses. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("unauthenticated");
  }
  return session;
}
