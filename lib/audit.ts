import { prisma } from "@/lib/prisma";

type AuditInput = {
  householdId: string;
  actorMembershipId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any | null;
  after?: any | null;
};

export async function auditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      householdId: input.householdId,
      actorMembershipId: input.actorMembershipId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ?? null,
      after: input.after ?? null
    }
  });
}
