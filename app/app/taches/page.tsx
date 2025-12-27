import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { formatDateTimeFr } from "@/lib/timezone";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function TachesPage() {
  const { household } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const tasks = await prisma.task.findMany({
    where: { householdId: household.id },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, title: true, description: true, status: true, dueAt: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Taches</h1>
      {tasks.length === 0 ? (
        <EmptyState
          title="Aucune tache"
          subtitle="Les taches du foyer apparaissent ici des qu'elles sont planifiees."
          ctaHref="/app/planning"
          ctaLabel="Voir le planning"
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{t.title}</div>
                  {t.description ? <div className="text-xs text-mutedForeground">{t.description}</div> : null}
                </div>
                <Badge variant={t.status === "DONE" ? "outline" : "muted"}>{t.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-mutedForeground">
                {t.dueAt ? formatDateTimeFr(t.dueAt, tz) : "Sans date"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
