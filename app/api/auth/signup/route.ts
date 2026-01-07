import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionJwt, setSessionCookie } from "@/lib/auth";
import { signUpSchema } from "@/lib/validations";
import { defaultWeeklySchedule } from "@/lib/schedule";

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? "")
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/inscription?error=invalid", req.url));
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.redirect(new URL("/inscription?error=exists", req.url));
  }

  const passwordHash = await hashPassword(password);

  const household = await prisma.household.create({
    data: {
      name: `Famille de ${name}`,
      timezone: "Europe/Paris",
      notificationsEnabled: true,
      // Planning fixe (hebdo) : modifiable ensuite depuis Paramètres.
      workScheduleWeekly: defaultWeeklySchedule(),
      workScheduleExceptions: []
    }
  });

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash
    }
  });

  const membership = await prisma.membership.create({
    data: {
      householdId: household.id,
      userId: user.id,
      role: "PARENT",
      displayName: name
    }
  });

  const token = await signSessionJwt({
    sub: user.id,
    email: user.email,
    householdId: household.id,
    membershipId: membership.id,
    role: "PARENT"
  });
  await setSessionCookie(token);

  return NextResponse.redirect(new URL("/app", req.url));
}
