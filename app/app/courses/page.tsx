import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { formatDateTimeFr } from "@/lib/timezone";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function CoursesPage() {
  const { household } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const items = await prisma.shoppingItem.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, label: true, qty: true, status: true, createdAt: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Courses</h1>
      {items.length === 0 ? (
        <EmptyState
          title="Aucune course"
          subtitle="Les courses partagees apparaissent ici."
          ctaHref="/app"
          ctaLabel="Retour a aujourd'hui"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.qty ? <div className="text-xs text-mutedForeground">Qte: {item.qty}</div> : null}
                </div>
                <Badge variant={item.status === "DONE" ? "outline" : "muted"}>{item.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-mutedForeground">{formatDateTimeFr(item.createdAt, tz)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
