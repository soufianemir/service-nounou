"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { cn } from "@/lib/utils";
import type { DayWorkSegment } from "@/lib/schedule";

type TaskLite = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt?: string | null;
};

type ShoppingItemLite = {
  id: string;
  label: string;
  qty?: string | null;
  status: string;
};

function hhmmInTz(iso: string, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = fmt.formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

function bucketForTime(hhmm?: string) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "aprem" as const;
  const h = Number(hhmm.slice(0, 2));
  if (h < 12) return "matin" as const;
  if (h < 18) return "aprem" as const;
  return "soir" as const;
}

export function TodayDashboardClient(props: {
  ymd: string;
  timezone: string;
  role: "PARENT" | "EMPLOYEE";
  segments: DayWorkSegment[];
  initialTasks: TaskLite[];
  shoppingItems: ShoppingItemLite[];
}) {
  const [tasks, setTasks] = useState<TaskLite[]>(props.initialTasks);

  const tasksByBucket = useMemo(() => {
    const buckets = { matin: [] as TaskLite[], aprem: [] as TaskLite[], soir: [] as TaskLite[] };
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const hh = hhmmInTz(t.dueAt, props.timezone);
      buckets[bucketForTime(hh)]!.push(t);
    }
    return buckets;
  }, [tasks, props.timezone]);

  async function toggleTaskStatus(t: TaskLite) {
    const next = t.status === "DONE" ? "TODO" : "DONE";
    const res = await fetch(`/api/app/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    if (res.ok) {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aujourd'hui</h1>
          <div className="text-sm text-mutedForeground">Date: {props.ymd}</div>
        </div>
        <Link href="/app/planning">
          <Button variant="secondary">Voir le planning</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold">Planning du jour</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.segments.length === 0 ? <Badge>OFF</Badge> : null}
          {props.segments.map((s, idx) => (
            <Badge key={`${s.kind}-${idx}`}>
              {s.start}-{s.end}
              {s.kind !== "BASE" ? ` (${s.kind})` : ""}
            </Badge>
          ))}
        </div>
        {props.segments.some((s) => s.note) ? (
          <div className="mt-2 text-sm text-mutedForeground">{props.segments.find((s) => s.note)?.note}</div>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold">Taches du jour</div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {(["matin", "aprem", "soir"] as const).map((bucket) => (
            <div key={bucket}>
              <div className="text-sm font-semibold">
                {bucket === "matin" ? "Matin" : bucket === "aprem" ? "Apres-midi" : "Soir"}
              </div>
              <div className="mt-2 space-y-2">
                {tasksByBucket[bucket].map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => toggleTaskStatus(t)} />
                ))}
                {tasksByBucket[bucket].length === 0 ? (
                  <div className="text-sm text-mutedForeground">Rien</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold">Courses du jour</div>
        <div className="mt-3 space-y-2">
          {props.shoppingItems.length === 0 ? (
            <EmptyState
              title="Aucune course pour aujourd'hui"
              subtitle="Ajoutez vos besoins de courses pour les partager avec la nounou."
              ctaHref="/app/courses"
              ctaLabel="Voir les courses"
            />
          ) : (
            props.shoppingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                <div className="text-sm">
                  <div className="font-medium">{item.label}</div>
                  {item.qty ? <div className="text-xs text-mutedForeground">Qté: {item.qty}</div> : null}
                </div>
                <Badge variant={item.status === "DONE" ? "outline" : "muted"}>{item.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function TaskRow({ t, onToggle }: { t: TaskLite; onToggle?: () => void }) {
  const done = t.status === "DONE";
  return (
    <div className="rounded-lg border p-2">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-sm font-medium", done && "line-through text-mutedForeground")}>{t.title}</div>
        <div className="flex items-center gap-2">
          {onToggle ? (
            <Button variant="outline" size="sm" onClick={onToggle}>
              {done ? "Rouvrir" : "Fait"}
            </Button>
          ) : null}
          <Badge variant={done ? "outline" : "muted"}>{done ? "Fait" : "A faire"}</Badge>
        </div>
      </div>
      {t.description ? <div className="mt-1 text-xs text-mutedForeground">{t.description}</div> : null}
    </div>
  );
}
