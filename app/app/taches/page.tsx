import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { TasksClient } from "@/components/app/TasksClient";

export default async function TachesPage() {
  const { household, membership } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const tasks = await prisma.task.findMany({
    where: { householdId: household.id },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, title: true, description: true, status: true, dueAt: true }
  });

  return (
    <TasksClient
      role={membership.role}
      timezone={tz}
      initialTasks={tasks.map((t) => ({ ...t, dueAt: t.dueAt ? t.dueAt.toISOString() : null }))}
    />
  );
}
