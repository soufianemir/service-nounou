import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionJwt, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? "")
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/connexion?error=invalid", req.url));
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(new URL("/connexion?error=auth", req.url));
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.redirect(new URL("/connexion?error=auth", req.url));
  }

  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (!membership) {
    return NextResponse.redirect(new URL("/connexion?error=nomembership", req.url));
  }

  const token = await signSessionJwt({
    sub: user.id,
    email: user.email,
    householdId: membership.householdId,
    membershipId: membership.id,
    role: membership.role
  });
  await setSessionCookie(token);

  return NextResponse.redirect(new URL("/app", req.url));
}
