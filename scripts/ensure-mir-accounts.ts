/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { defaultWeeklySchedule } from "../lib/schedule";

const parent = {
  name: "Mir",
  email: "soufiane.mir@gmail.com",
  password: "Constance2026!",
  role: "PARENT" as const
};

const nanny = {
  name: "Aurore",
  email: "aurore@nounou.com",
  password: "Constance1!",
  role: "EMPLOYEE" as const
};

async function upsertUser(email: string, passwordHash: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash }
    });
  }
  return prisma.user.create({
    data: { email, passwordHash }
  });
}

async function ensureMembership(params: {
  householdId: string;
  userId: string;
  role: "PARENT" | "EMPLOYEE";
  displayName: string;
}) {
  const { householdId, userId, role, displayName } = params;
  const existing = await prisma.membership.findFirst({
    where: { householdId, userId }
  });
  if (existing) {
    return prisma.membership.update({
      where: { id: existing.id },
      data: { role, displayName }
    });
  }
  return prisma.membership.create({
    data: { householdId, userId, role, displayName }
  });
}

async function main() {
  const parentEmail = parent.email.trim().toLowerCase();
  const nannyEmail = nanny.email.trim().toLowerCase();

  const parentHash = await bcrypt.hash(parent.password, 10);
  const nannyHash = await bcrypt.hash(nanny.password, 10);

  const parentUser = await upsertUser(parentEmail, parentHash);

  let householdId: string | null = null;
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: parentUser.id },
    select: { householdId: true }
  });
  if (existingMembership) {
    householdId = existingMembership.householdId;
  }

  if (!householdId) {
    const household = await prisma.household.create({
      data: {
        name: "Famille Mir",
        timezone: "Europe/Paris",
        notificationsEnabled: true,
        workScheduleWeekly: defaultWeeklySchedule(),
        workScheduleExceptions: []
      }
    });
    householdId = household.id;
  }

  await ensureMembership({
    householdId,
    userId: parentUser.id,
    role: parent.role,
    displayName: parent.name
  });

  const nannyUser = await upsertUser(nannyEmail, nannyHash);
  await ensureMembership({
    householdId,
    userId: nannyUser.id,
    role: nanny.role,
    displayName: nanny.name
  });

  console.log("OK: comptes creees / mis a jour.");
  console.log(`Parent: ${parent.email}`);
  console.log(`Nounou: ${nanny.email}`);
  console.log(`Household: ${householdId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
