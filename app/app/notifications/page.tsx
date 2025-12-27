import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { formatDateTimeFr } from "@/lib/timezone";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function NotificationsPage() {
  const { household } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const notifications = await prisma.inAppNotification.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, body: true, href: true, level: true, createdAt: true, readAt: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          subtitle="Les alertes importantes du foyer apparaitront ici."
          ctaHref="/app"
          ctaLabel="Retour a aujourd'hui"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">
                    {n.href ? <Link href={n.href}>{n.title}</Link> : n.title}
                  </div>
                  <div className="mt-1 text-sm text-mutedForeground">{n.body}</div>
                </div>
                <Badge variant={n.level === "WARNING" ? "outline" : "muted"}>{n.level}</Badge>
              </div>
              <div className="mt-2 text-xs text-mutedForeground">
                {formatDateTimeFr(n.createdAt, tz)} {n.readAt ? "• Lu" : "• Non lu"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
