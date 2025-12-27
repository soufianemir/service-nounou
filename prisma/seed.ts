/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Demo accounts (local / staging)
// Parent   : parent@demo.nounou / Demo1234!
// Nounou   : nounou@demo.nounou / Demo1234!
// (Optional) Second parent : parent2@demo.nounou / Demo1234!

const DEMO_PASSWORD = "Demo1234!";

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

async function main() {
  console.log("\n========================================");
  console.log("CARNETNOUNOU - DB SEED (demo)");
  console.log("========================================\n");

  // Reset (demo-only). Order matters because of FK constraints.
  await prisma.inAppNotification.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.shoppingItem.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.household.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const household = await prisma.household.create({
    data: {
      name: "Famille Martin Demo",
      timezone: "Europe/Paris",
      notificationsEnabled: true
    }
  });

  const parentUser = await prisma.user.create({
    data: {
      email: "parent@demo.nounou",
      passwordHash
    }
  });

  const parent2User = await prisma.user.create({
    data: {
      email: "parent2@demo.nounou",
      passwordHash
    }
  });

  const nounouUser = await prisma.user.create({
    data: {
      email: "nounou@demo.nounou",
      passwordHash
    }
  });

  const parentMembership = await prisma.membership.create({
    data: {
      householdId: household.id,
      userId: parentUser.id,
      role: "PARENT",
      displayName: "Parent (demo)"
    }
  });

  await prisma.membership.create({
    data: {
      householdId: household.id,
      userId: parent2User.id,
      role: "PARENT",
      displayName: "Parent 2 (demo)"
    }
  });

  const nounouMembership = await prisma.membership.create({
    data: {
      householdId: household.id,
      userId: nounouUser.id,
      role: "EMPLOYEE",
      displayName: "Clara nounou",
      permissions: {
        journal: true,
        tasks: true,
        shopping: true
      }
    }
  });

  // Dates demo
  const now = new Date();
  const today = startOfDayUtc(now);
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 3600 * 1000);

  // Tasks (assign to nounou)
  await prisma.task.createMany({
    data: [
      {
        householdId: household.id,
        title: "Gouter : fruit + compote",
        status: "TODO",
        dueAt: new Date(today.getTime() + 15 * 3600 * 1000),
        assignedToId: nounouMembership.id
      },
      {
        householdId: household.id,
        title: "Sortie au parc (30 min)",
        status: "TODO",
        dueAt: new Date(today.getTime() + 10 * 3600 * 1000),
        assignedToId: nounouMembership.id
      },
      {
        householdId: household.id,
        title: "Bain + pyjama",
        status: "TODO",
        dueAt: new Date(today.getTime() + 18 * 3600 * 1000),
        assignedToId: nounouMembership.id
      },
      {
        householdId: household.id,
        title: "Preparer le sac (doudou + tenue de rechange)",
        status: "DONE",
        dueAt: yesterday
      },
      {
        householdId: household.id,
        title: "Lecture calme avant sieste",
        status: "SKIPPED",
        dueAt: twoDaysAgo
      }
    ]
  });

  // Shopping list
  await prisma.shoppingItem.createMany({
    data: [
      { householdId: household.id, label: "Yaourts nature", qty: "x6", status: "OPEN" },
      { householdId: household.id, label: "Compotes", qty: "x4", status: "OPEN" },
      { householdId: household.id, label: "Couches", qty: "T4", status: "BOUGHT" },
      { householdId: household.id, label: "Creme solaire", qty: "SPF 50", status: "UNAVAILABLE" }
    ]
  });

  // Journal entries (summary + meals)
  await prisma.journalEntry.createMany({
    data: [
      {
        householdId: household.id,
        authorId: nounouMembership.id,
        date: twoDaysAgo,
        summary: "Matinee au parc. Belle humeur.",
        breakfast: "Yaourt nature + banane",
        lunch: "Pates + legumes",
        dinner: "Leger"
      },
      {
        householdId: household.id,
        authorId: nounouMembership.id,
        date: yesterday,
        summary: "Peinture + musique.",
        breakfast: "Cereales",
        lunch: "Riz + poulet",
        dinner: "Leger",
        blockers: "Leger retard de 10 min a la sortie (metro)."
      },
      {
        householdId: household.id,
        authorId: nounouMembership.id,
        date: today,
        summary: "Lecture + jeux calmes.",
        breakfast: "Yaourt",
        lunch: "Puree + jambon",
        dinner: "Leger",
        substitutions: "Yaourt -> compote (plus de yaourt)"
      }
    ]
  });

  // Expense + approval (visible for parent)
  const expense = await prisma.expense.create({
    data: {
      householdId: household.id,
      amountCents: 1450,
      currency: "EUR",
      note: "Gouter (fruits)"
    }
  });

  await prisma.approval.create({
    data: {
      householdId: household.id,
      type: "EXPENSE",
      targetId: expense.id,
      status: "PENDING",
      requestedById: nounouMembership.id
    }
  });

  // Notifications (parents + nounou)
  await prisma.inAppNotification.createMany({
    data: [
      {
        householdId: household.id,
        membershipId: parentMembership.id,
        level: "INFO",
        title: "Demo prete",
        body: "Donnees de demonstration chargees : taches, journal, courses et une validation.",
        href: "/app"
      },
      {
        householdId: household.id,
        membershipId: nounouMembership.id,
        level: "INFO",
        title: "A faire aujourd'hui",
        body: "3 taches ouvertes dans le planning.",
        href: "/app"
      }
    ]
  });

  console.log("OK. Demo household created:", household.name);
  console.log("OK. Demo accounts:");
  console.log("   Parent  : parent@demo.nounou  /", DEMO_PASSWORD);
  console.log("   Parent2 : parent2@demo.nounou /", DEMO_PASSWORD);
  console.log("   Nounou  : nounou@demo.nounou  /", DEMO_PASSWORD);
  console.log("\nRun: npm run dev  (or npm run one-shot on Windows)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
