import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { formatDateFr } from "@/lib/timezone";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function JournalPage() {
  const { household } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const entries = await prisma.journalEntry.findMany({
    where: { householdId: household.id },
    orderBy: { date: "desc" },
    take: 30,
    select: { id: true, date: true, summary: true, blockers: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Journal</h1>
      {entries.length === 0 ? (
        <EmptyState
          title="Aucune entree de journal"
          subtitle="Les resumes de journee apparaissent ici."
          ctaHref="/app"
          ctaLabel="Retour a aujourd'hui"
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{formatDateFr(entry.date, tz)}</div>
                {entry.blockers ? <Badge variant="outline">Attention</Badge> : null}
              </div>
              <div className="mt-2 text-sm text-mutedForeground">{entry.summary}</div>
              {entry.blockers ? (
                <div className="mt-2 text-xs text-mutedForeground">Bloquant: {entry.blockers}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
