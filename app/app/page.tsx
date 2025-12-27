import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { parseWeeklySchedule, parseExceptions, computeWorkSegmentsForDate } from "@/lib/schedule";
import { getNowInTz, ymdInTz, dayRangeUtcFromYmd } from "@/lib/timezone";
import { TodayDashboardClient } from "@/components/app/TodayDashboardClient";

export default async function AppIndexPage() {
  const { membership, household } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const ymd = ymdInTz(getNowInTz(tz), tz);
  const weekly = parseWeeklySchedule(household.workScheduleWeekly);
  const exceptions = parseExceptions(household.workScheduleExceptions);
  const segments = computeWorkSegmentsForDate({ ymd, weekly, exceptions }).segments;
  const { start, end } = dayRangeUtcFromYmd(tz, ymd);

  const tasks = await prisma.task.findMany({
    where: { householdId: household.id, dueAt: { gte: start, lte: end } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, description: true, status: true, dueAt: true }
  });

  const shoppingItems = await prisma.shoppingItem.findMany({
    where: { householdId: household.id, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, qty: true, status: true }
  });

  return (
    <TodayDashboardClient
      ymd={ymd}
      timezone={tz}
      role={membership.role}
      segments={segments}
      initialTasks={tasks.map((t) => ({ ...t, dueAt: t.dueAt?.toISOString() ?? null }))}
      shoppingItems={shoppingItems}
    />
  );
}
