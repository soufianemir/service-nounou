"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CsvImportPanel } from "@/components/app/CsvImportPanel";
import { cn } from "@/lib/utils";
import { formatDateTimeFr } from "@/lib/timezone";

type TaskLite = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt?: string | null;
};

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TasksClient(props: {
  role: "PARENT" | "EMPLOYEE";
  timezone: string;
  initialTasks: TaskLite[];
}) {
  const [tasks, setTasks] = useState<TaskLite[]>(props.initialTasks);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: todayYmd(),
    time: "09:00"
  });

  const canEdit = props.role === "PARENT";

  async function refresh() {
    const res = await fetch("/api/app/tasks", { headers: { Accept: "application/json" } });
    const json = await res.json().catch(() => ({ tasks: [] }));
    setTasks(Array.isArray(json?.tasks) ? json.tasks : []);
  }

  async function createTask() {
    const title = form.title.trim();
    if (!title) {
      setError("Titre requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/app/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: form.description.trim() || undefined,
          dueYmd: form.date || undefined,
          dueTime: form.time || undefined
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Erreur creation");
        return;
      }
      setForm({ title: "", description: "", date: form.date, time: form.time });
      setCreating(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(task: TaskLite) {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    const res = await fetch(`/api/app/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    }
  }

  const byStatus = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "TODO" ? -1 : 1;
    });
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Taches</h1>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreating((v) => !v)}>{creating ? "Fermer" : "Ajouter une tache"}</Button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <CsvImportPanel
          title="Importer des taches (CSV)"
          description="Colonnes: titre, description, date (YYYY-MM-DD), heure (HH:MM), status."
          endpoint="/api/app/tasks/import"
          sampleHref="/templates/tasks.csv"
          onSuccess={refresh}
        />
      ) : null}

      {canEdit && creating ? (
        <Card className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Titre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Preparer et donner le dejeuner"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Entree, plat, dessert..."
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Heure</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end">
            <Button disabled={saving} onClick={createTask}>
              {saving ? "Creation..." : "Creer"}
            </Button>
          </div>
        </Card>
      ) : null}

      {byStatus.length === 0 ? (
        <div className="text-sm text-mutedForeground">Aucune tache pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {byStatus.map((t) => (
            <div key={t.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={cn("text-sm font-semibold", t.status === "DONE" && "line-through text-mutedForeground")}>
                    {t.title}
                  </div>
                  {t.description ? <div className="text-xs text-mutedForeground">{t.description}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(t)}>
                    {t.status === "DONE" ? "Rouvrir" : "Fait"}
                  </Button>
                  <Badge variant={t.status === "DONE" ? "outline" : "muted"}>{t.status}</Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-mutedForeground">
                {t.dueAt ? formatDateTimeFr(new Date(t.dueAt), props.timezone) : "Sans date"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
