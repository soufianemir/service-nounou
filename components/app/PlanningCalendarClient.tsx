"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduleException, WeeklySlot } from "@/lib/schedule";
import { computeWorkSegmentsForDate, isValidTime } from "@/lib/schedule";

type ViewMode = "day" | "week" | "month";

type TaskLite = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt?: string | null;
};

function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(ymd: string, delta: number) {
  const d = ymdToDate(ymd);
  d.setDate(d.getDate() + delta);
  return formatYmd(d);
}

function startOfWeekMonday(ymd: string) {
  const d = ymdToDate(ymd);
  const js = d.getDay(); // 0=Sun
  const mondayOffset = (js + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return formatYmd(d);
}

function monthGrid(ymd: string) {
  const d = ymdToDate(ymd);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstYmd = formatYmd(first);
  const gridStart = startOfWeekMonday(firstYmd);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
  return {
    month: d.getMonth(),
    year: d.getFullYear(),
    days
  };
}

function bucketForTime(hhmm?: string) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "aprem" as const;
  const h = Number(hhmm.slice(0, 2));
  if (h < 12) return "matin" as const;
  if (h < 18) return "aprem" as const;
  return "soir" as const;
}

function hhmmFromIso(iso?: string | null) {
  if (!iso) return undefined;
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function PlanningCalendarClient(props: {
  // Backward compatible: older server pages may pass tz/initialDateYmd.
  tz?: string;
  timezone?: string;
  role: "PARENT" | "EMPLOYEE";
  initialDateYmd?: string;
  initialYmd?: string;
  initialView: ViewMode;
  weekly: WeeklySlot[];
  exceptions: ScheduleException[];
}) {
  const timezone = props.tz ?? props.timezone ?? "Europe/Paris";
  const initialYmd = props.initialDateYmd ?? props.initialYmd ?? formatYmd(new Date());
  const router = useRouter();
  const [view, setView] = useState<ViewMode>(props.initialView);
  const [ymd, setYmd] = useState(initialYmd);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const range = useMemo(() => {
    if (view === "day") return { from: ymd, to: ymd };
    if (view === "week") {
      const s = startOfWeekMonday(ymd);
      return { from: s, to: addDays(s, 6) };
    }
    const g = monthGrid(ymd);
    const from = g.days[0];
    const to = g.days[g.days.length - 1];
    return { from, to };
  }, [view, ymd]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTasksLoading(true);
      try {
        const u = new URL("/api/app/tasks", window.location.origin);
        u.searchParams.set("fromYmd", range.from);
        u.searchParams.set("toYmd", range.to);
        const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
        const json = await res.json().catch(() => ({ tasks: [] }));
        if (cancelled) return;
        setTasks(Array.isArray(json?.tasks) ? json.tasks : []);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskLite[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const dt = new Date(t.dueAt);
      const key = formatYmd(dt);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  function pushUrl(next: { ymd: string; view: ViewMode }) {
    const u = new URL(window.location.href);
    // Keep both keys for backward compatibility (some server pages read date=...).
    u.searchParams.set("ymd", next.ymd);
    u.searchParams.set("date", next.ymd);
    u.searchParams.set("view", next.view);
    window.history.replaceState(null, "", u.toString());
  }

  function go(delta: number) {
    const next = addDays(ymd, delta);
    setYmd(next);
    pushUrl({ ymd: next, view });
  }

  function setMode(next: ViewMode) {
    setView(next);
    pushUrl({ ymd, view: next });
  }

  const daySegments = useMemo(() => {
    return computeWorkSegmentsForDate({ ymd, weekly: props.weekly, exceptions: props.exceptions }).segments;
  }, [ymd, props.weekly, props.exceptions]);

  const dayTasks = useMemo(() => {
    const list = tasksByDay.get(ymd) ?? [];
    const buckets = { matin: [] as TaskLite[], aprem: [] as TaskLite[], soir: [] as TaskLite[] };
    for (const t of list) {
      const hh = hhmmFromIso(t.dueAt);
      buckets[bucketForTime(hh)]!.push(t);
    }
    return buckets;
  }, [tasksByDay, ymd]);

  const canEdit = props.role === "PARENT";

  // ---- Base weekly schedule editor (simple: 1 slot per weekday) ----
  const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const [showBase, setShowBase] = useState(false);
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklySlot[]>(() => props.weekly);
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [weeklyErr, setWeeklyErr] = useState<string | null>(null);

  useEffect(() => {
    setWeeklyDraft(props.weekly);
  }, [props.weekly]);

  function updateWeeklySlot(weekday: number, patch: Partial<WeeklySlot>) {
    setWeeklyDraft((prev) =>
      prev
        .map((s) => (s.weekday === weekday ? { ...s, ...patch } : s))
        .sort((a, b) => a.weekday - b.weekday)
    );
  }

  async function saveWeekly() {
    setWeeklyErr(null);
    // Basic validation (HH:MM) only for enabled days.
    for (const s of weeklyDraft) {
      if (!s.enabled) continue;
      if (!isValidTime(s.start) || !isValidTime(s.end)) {
        setWeeklyErr("Heures invalides dans l'hebdo (HH:MM)." );
        return;
      }
    }
    setWeeklySaving(true);
    try {
      const res = await fetch("/api/app/schedule/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weeklyDraft)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setWeeklyErr(j?.error || "Erreur lors de l'enregistrement");
        return;
      }
      router.refresh();
      setShowBase(false);
    } finally {
      setWeeklySaving(false);
    }
  }

  // ---- Task status + creation (with optional description) ----
  const [taskModal, setTaskModal] = useState<
    | null
    | { title: string; description: string; time: string; bucket: "matin" | "aprem" | "soir" }
  >(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskErr, setTaskErr] = useState<string | null>(null);

  function openTask(bucket: "matin" | "aprem" | "soir" = "aprem") {
    const defaults = bucket === "matin" ? "09:00" : bucket === "soir" ? "19:00" : "14:00";
    setTaskModal({ title: "", description: "", time: defaults, bucket });
  }

  async function createTask() {
    if (!taskModal) return;
    setTaskErr(null);
    const title = taskModal.title.trim();
    if (!title) {
      setTaskErr("Titre obligatoire.");
      return;
    }
    if (!isValidTime(taskModal.time)) {
      setTaskErr("Heure invalide (HH:MM).");
      return;
    }
    setTaskSaving(true);
    try {
      const res = await fetch("/api/app/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: taskModal.description.trim() || undefined,
          dueYmd: ymd,
          dueTime: taskModal.time
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setTaskErr(j?.error || "Erreur lors de la création");
        return;
      }
      setTaskModal(null);
      // Re-fetch tasks for the current range (keeps UI responsive without full refresh).
      const u = new URL("/api/app/tasks", window.location.origin);
      u.searchParams.set("fromYmd", range.from);
      u.searchParams.set("toYmd", range.to);
      const r2 = await fetch(u.toString(), { headers: { Accept: "application/json" } });
      const j2 = await r2.json().catch(() => ({ tasks: [] }));
      setTasks(Array.isArray(j2?.tasks) ? j2.tasks : []);
    } finally {
      setTaskSaving(false);
    }
  }

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

  // ---- Exception editing (MVP) ----
  const [modal, setModal] = useState<
    | null
    | { mode: "ADD" | "REPLACE" | "OFF"; dateYmd: string; id?: string; start?: string; end?: string; note?: string }
  >(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveException() {
    if (!modal) return;
    setErr(null);
    if (modal.mode !== "OFF") {
      if (!isValidTime(modal.start || "") || !isValidTime(modal.end || "")) {
        setErr("Heures invalides (HH:MM).");
        return;
      }
    }
    setSaving(true);
    try {
      const payload: any = {
        dateYmd: modal.dateYmd,
        kind: modal.mode === "OFF" ? "OFF" : modal.mode === "REPLACE" ? "REPLACE" : "ADD",
        start: modal.mode === "OFF" ? undefined : modal.start,
        end: modal.mode === "OFF" ? undefined : modal.end,
        note: modal.note || undefined
      };
      const res = await fetch("/api/app/schedule/exceptions", {
        method: modal.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal.id ? { ...payload, id: modal.id } : payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErr(j?.error || "Erreur inconnue");
        return;
      }
      setModal(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteException(id: string) {
    if (!confirm("Supprimer cette exception ?")) return;
    const u = new URL("/api/app/schedule/exceptions", window.location.origin);
    u.searchParams.set("id", id);
    const res = await fetch(u.toString(), { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  function openAdd() {
    setModal({ mode: "ADD", dateYmd: ymd, start: "19:00", end: "21:00", note: "" });
  }

  function openReplace() {
    const base = daySegments.find((s) => s.kind === "BASE");
    setModal({
      mode: "REPLACE",
      dateYmd: ymd,
      start: base?.start || "09:00",
      end: base?.end || "18:00",
      note: base?.note || ""
    });
  }

  function openOff(existingId?: string) {
    setModal({ mode: "OFF", dateYmd: ymd, id: existingId });
  }

  const dayExceptions = useMemo(() => {
    return props.exceptions.filter((e) => e.dateYmd === ymd);
  }, [props.exceptions, ymd]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            aria-label="Previous period"
            onClick={() => go(view === "month" ? -30 : view === "week" ? -7 : -1)}
          >
            ←
          </Button>
          <Button
            variant="outline"
            aria-label="Next period"
            onClick={() => go(view === "month" ? 30 : view === "week" ? 7 : 1)}
          >
            →
          </Button>
          <div className="ml-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold">{ymd}</div>
              <Input
                type="date"
                value={ymd}
                className="h-9 w-[160px]"
                onChange={(e) => {
                  const next = e.target.value;
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
                  setYmd(next);
                  pushUrl({ ymd: next, view });
                }}
              />
            </div>
            <div className="text-sm text-mutedForeground">Fuseau : {timezone}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={view === "day" ? "default" : "outline"} onClick={() => setMode("day")}
            >Jour</Button
          >
          <Button variant={view === "week" ? "default" : "outline"} onClick={() => setMode("week")}
            >Semaine</Button
          >
          <Button variant={view === "month" ? "default" : "outline"} onClick={() => setMode("month")}
            >Mois</Button
          >
        </div>
      </div>

      {canEdit && (
        <Card className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Horaires de base (hebdo)</div>
              <div className="text-sm text-mutedForeground">
                Le plus simple : 1 plage par jour (modifiable ici). Pour ajouter des gardes ponctuelles, utilisez les
                exceptions sur une date.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={showBase ? "default" : "outline"} onClick={() => setShowBase((v) => !v)}>
                {showBase ? "Fermer" : "Configurer"}
              </Button>
              {showBase ? (
                <Button disabled={weeklySaving} onClick={saveWeekly}>
                  {weeklySaving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              ) : null}
            </div>
          </div>

          {showBase ? (
            <div className="mt-4 space-y-3">
              {weeklyErr ? <div className="text-sm text-red-600">{weeklyErr}</div> : null}
              <div className="space-y-2">
                {weeklyDraft
                  .slice()
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((s) => (
                    <div key={s.weekday} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-5 sm:items-center">
                      <div className="text-sm font-medium">{weekdayLabels[s.weekday]}</div>
                      <div className="flex items-center gap-2 sm:col-span-1">
                        <input
                          type="checkbox"
                          checked={!!s.enabled}
                          onChange={(e) => updateWeeklySlot(s.weekday, { enabled: e.target.checked })}
                        />
                        <span className="text-sm text-mutedForeground">Actif</span>
                      </div>
                      <div>
                        <Label>Début</Label>
                        <Input
                          value={s.start}
                          disabled={!s.enabled}
                          onChange={(e) => updateWeeklySlot(s.weekday, { start: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Fin</Label>
                        <Input
                          value={s.end}
                          disabled={!s.enabled}
                          onChange={(e) => updateWeeklySlot(s.weekday, { end: e.target.value })}
                        />
                      </div>
                      <div className="text-xs text-mutedForeground sm:text-right">(HH:MM)</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {view === "day" && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-mutedForeground">Plages de garde</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {daySegments.length === 0 && <Badge>OFF</Badge>}
                {daySegments.map((s, idx) => (
                  <Badge key={`${s.kind}-${idx}`}>
                    {s.start}–{s.end}
                    {s.kind !== "BASE" ? ` (${s.kind})` : ""}
                  </Badge>
                ))}
              </div>
              {daySegments.some((s) => s.note) && (
                <div className="mt-2 text-sm text-mutedForeground">{daySegments.find((s) => s.note)?.note}</div>
              )}
            </div>

            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={openAdd}>Ajouter une plage</Button>
                <Button variant="outline" onClick={openReplace}>
                  Modifier la journée
                </Button>
                <Button variant="outline" onClick={() => openOff(dayExceptions.find((e) => (e.kind || (e.off ? "OFF" : "")) === "OFF")?.id)}>
                  Jour OFF
                </Button>
              </div>
            )}
          </div>

          {canEdit && dayExceptions.length > 0 && (
            <div className="mt-4">
              <Separator className="my-3" />
              <div className="text-sm font-medium">Exceptions sur cette date</div>
              <div className="mt-2 space-y-2">
                {dayExceptions.map((e, idx) => (
                  <div key={e.id || idx} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">{e.kind || (e.off ? "OFF" : "REPLACE")}</span>
                        {e.start && e.end ? ` · ${e.start}–${e.end}` : ""}
                      </div>
                      {e.note ? <div className="text-mutedForeground">{e.note}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setModal({
                            mode: (e.kind || (e.off ? "OFF" : "REPLACE")) as any,
                            id: e.id,
                            dateYmd: e.dateYmd,
                            start: e.start || "09:00",
                            end: e.end || "18:00",
                            note: e.note || ""
                          })
                        }
                      >
                        Modifier
                      </Button>
                      {e.id ? (
                        <Button variant="outline" onClick={() => deleteException(e.id!)}>
                          Supprimer
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Matin</div>
                {canEdit ? (
                  <Button variant="outline" size="sm" onClick={() => openTask("matin")}>
                    + Tâche
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                {dayTasks.matin.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => toggleTaskStatus(t)} />
                ))}
                {dayTasks.matin.length === 0 && <div className="text-sm text-mutedForeground">Rien</div>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Après-midi</div>
                {canEdit ? (
                  <Button variant="outline" size="sm" onClick={() => openTask("aprem")}>
                    + Tâche
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                {dayTasks.aprem.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => toggleTaskStatus(t)} />
                ))}
                {dayTasks.aprem.length === 0 && <div className="text-sm text-mutedForeground">Rien</div>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Soir</div>
                {canEdit ? (
                  <Button variant="outline" size="sm" onClick={() => openTask("soir")}>
                    + Tâche
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                {dayTasks.soir.map((t) => (
                  <TaskRow key={t.id} t={t} onToggle={() => toggleTaskStatus(t)} />
                ))}
                {dayTasks.soir.length === 0 && <div className="text-sm text-mutedForeground">Rien</div>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {view === "week" && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-mutedForeground">Vue semaine (agrégée)</div>
            {tasksLoading ? <div className="text-sm text-mutedForeground">Chargement…</div> : null}
          </div>
          <Separator className="my-3" />
          <div className="grid gap-3 md:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeekMonday(ymd), i)).map((d) => {
              const segs = computeWorkSegmentsForDate({
                ymd: d,
                weekly: props.weekly,
                exceptions: props.exceptions
              }).segments;
              const dayList = tasksByDay.get(d) ?? [];
              return (
                <button
                  key={d}
                  className={cn(
                    "rounded-xl border p-3 text-left transition hover:shadow-sm",
                    d === ymd ? "border-primary" : "border-border"
                  )}
                  onClick={() => {
                    setYmd(d);
                    pushUrl({ ymd: d, view });
                  }}
                >
                  <div className="text-sm font-semibold">{d.slice(-2)}</div>
                  <div className="mt-2 space-y-1 text-xs text-mutedForeground">
                    {segs.length === 0 ? (
                      <div>OFF</div>
                    ) : (
                      segs.slice(0, 2).map((s, idx) => (
                        <div key={idx}>
                          {s.start}–{s.end}
                          {s.kind !== "BASE" ? ` (${s.kind})` : ""}
                        </div>
                      ))
                    )}
                    {segs.length > 2 ? <div>+{segs.length - 2} plage(s)</div> : null}
                    {dayList.length ? <div className="mt-1">{dayList.length} tâche(s)</div> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "month" && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-mutedForeground">Vue mois (jours travaillés mis en avant)</div>
            {tasksLoading ? <div className="text-sm text-mutedForeground">Chargement…</div> : null}
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-7 gap-2">
            {monthGrid(ymd).days.map((d) => {
              const inMonth = ymdToDate(d).getMonth() === ymdToDate(ymd).getMonth();
              const segs = computeWorkSegmentsForDate({
                ymd: d,
                weekly: props.weekly,
                exceptions: props.exceptions
              }).segments;
              const worked = segs.length > 0;
              const dayList = tasksByDay.get(d) ?? [];
              return (
                <button
                  key={d}
                  className={cn(
                    "h-20 rounded-xl border p-2 text-left transition hover:shadow-sm",
                    d === ymd ? "border-primary" : "border-border",
                    !inMonth && "opacity-50",
                    worked ? "bg-card" : "bg-muted"
                  )}
                  onClick={() => {
                    setYmd(d);
                    setView("day");
                    pushUrl({ ymd: d, view: "day" });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">{d.slice(-2)}</div>
                    {dayList.length ? <Badge>{dayList.length}</Badge> : null}
                  </div>
                  {worked ? (
                    <div className="mt-2 text-xs text-mutedForeground">
                      {segs[0].start}–{segs[0].end}
                      {segs.length > 1 ? ` +${segs.length - 1}` : ""}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-mutedForeground">OFF</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Ajouter une tâche</div>
              <Button variant="outline" onClick={() => setTaskModal(null)}>
                Fermer
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm text-mutedForeground">
                Date : {ymd} · Fuseau : {timezone}
              </div>
              <div>
                <Label>Titre</Label>
                <Input
                  value={taskModal.title}
                  onChange={(e) => setTaskModal({ ...taskModal, title: e.target.value })}
                  placeholder="Ex : Devoirs, bain, lecture…"
                />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Input
                  value={taskModal.description}
                  onChange={(e) => setTaskModal({ ...taskModal, description: e.target.value })}
                  placeholder="Ex : prendre le manteau bleu, donner le yaourt…"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Moment</Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2"
                    value={taskModal.bucket}
                    onChange={(e) => {
                      const bucket = e.target.value as any;
                      const defaults = bucket === "matin" ? "09:00" : bucket === "soir" ? "19:00" : "14:00";
                      setTaskModal({ ...taskModal, bucket, time: defaults });
                    }}
                  >
                    <option value="matin">Matin</option>
                    <option value="aprem">Après-midi</option>
                    <option value="soir">Soir</option>
                  </select>
                </div>
                <div>
                  <Label>Heure (HH:MM)</Label>
                  <Input
                    value={taskModal.time}
                    onChange={(e) => setTaskModal({ ...taskModal, time: e.target.value })}
                    placeholder="14:00"
                  />
                </div>
              </div>

              {taskErr ? <div className="text-sm text-red-600">{taskErr}</div> : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={taskSaving} onClick={() => setTaskModal(null)}>
                  Annuler
                </Button>
                <Button disabled={taskSaving} onClick={createTask}>
                  {taskSaving ? "Création…" : "Créer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                {modal.mode === "ADD" ? "Ajouter une plage" : modal.mode === "REPLACE" ? "Modifier la journée" : "Marquer OFF"}
              </div>
              <Button variant="outline" onClick={() => setModal(null)}>
                Fermer
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm text-mutedForeground">Date : {modal.dateYmd}</div>
              {modal.mode !== "OFF" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Début</Label>
                    <Input value={modal.start || ""} onChange={(e) => setModal({ ...modal, start: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fin</Label>
                    <Input value={modal.end || ""} onChange={(e) => setModal({ ...modal, end: e.target.value })} />
                  </div>
                </div>
              ) : null}
              <div>
                <Label>Note</Label>
                <Input value={modal.note || ""} onChange={(e) => setModal({ ...modal, note: e.target.value })} />
              </div>
              {err ? <div className="text-sm text-red-600">{err}</div> : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={saving} onClick={() => setModal(null)}>
                  Annuler
                </Button>
                <Button disabled={saving} onClick={saveException}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
          <Badge variant={done ? "outline" : "muted"}>{done ? "Fait" : "À faire"}</Badge>
        </div>
      </div>
      {t.description ? <div className="mt-1 text-xs text-mutedForeground">{t.description}</div> : null}
    </div>
  );
}
