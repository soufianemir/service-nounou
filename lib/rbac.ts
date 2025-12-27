import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type Role = "PARENT" | "EMPLOYEE";

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Vous devez être connecté.");
  return session;
}

export async function requireMembership() {
  const session = await requireSession();
  const membership = await prisma.membership.findUnique({ where: { id: session.membershipId } });
  if (!membership) throw new Error("Accès refusé.");
  return { session, membership };
}

export function canSeeFinance(role: Role): boolean {
  return role === "PARENT";
}

export function canApprove(role: Role): boolean {
  return role === "PARENT";
}
