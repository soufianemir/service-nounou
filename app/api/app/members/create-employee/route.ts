import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

function randomPassword() {
  // Simple & practical for a beta: 12 chars base36.
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const displayName = String(body.displayName ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = randomPassword();
    const passwordHash = await hashPassword(tempPassword);
    user = await prisma.user.create({ data: { email, passwordHash } });
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, householdId: session.householdId }
  });
  if (existingMembership) {
    return NextResponse.json({ ok: false, error: "already_member" }, { status: 409 });
  }

  await prisma.membership.create({
    data: {
      householdId: session.householdId,
      userId: user.id,
      role: "EMPLOYEE",
      displayName
    }
  });

  // If the user already existed, we do not overwrite password.
  // Return null -> the parent can ask the employee to use "mot de passe oublié" later (future).
  return NextResponse.json({ ok: true, tempPassword });
}
