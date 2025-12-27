import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function requireMembership() {
  const session = await requireSession();
  const membership = await prisma.membership.findFirst({
    where: { userId: session.sub },
    include: { household: true, user: true }
  });
  if (!membership) {
    // Should not happen in normal flow; redirect to signup.
    throw new Error("Membership introuvable pour cet utilisateur");
  }
  return { session, membership, household: membership.household, user: membership.user };
}
