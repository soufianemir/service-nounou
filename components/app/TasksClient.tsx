"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CsvImportPanel } from "@/components/app/CsvImportPanel";
import { cn } from "@/lib/utils";
import { formatDateTimeFr, ymdInTimeZone } from "@/lib/timezone";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: todayYmd(),
    time: "14:30"
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    date: todayYmd(),
    time: "14:30"
  });

  const canEdit = props.role === "PARENT";

  async function refresh() {
    const res = await fetch("/api/app/tasks", { headers: { Accept: "application/json" } });
    const json = await res.json().catch(() => ({ tasks: [] }));
    setTasks(Array.isArray(json?.tasks) ? json.tasks : []);
    setSelectedIds(new Set());
    setEditingId(null);
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

  function isSelected(id: string): boolean {
    return selectedIds.has(id);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Supprimer ${ids.length} tache(s) ?`)) return;
    const res = await fetch("/api/app/tasks/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error || "Erreur suppression");
      return;
    }
    await refresh();
  }

  async function deleteOne(id: string) {
    if (!confirm("Supprimer cette tache ?")) return;
    const res = await fetch(`/api/app/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error || "Erreur suppression");
      return;
    }
    await refresh();
  }

  function hhmmInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("hour")}:${get("minute")}`;
  }

  function startEdit(task: TaskLite) {
    const due = task.dueAt ? new Date(task.dueAt) : new Date();
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      date: ymdInTimeZone(due, props.timezone),
      time: hhmmInTimeZone(due, props.timezone)
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    const title = editForm.title.trim();
    if (!title) {
      setError("Titre requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/app/tasks/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: editForm.description.trim() || null,
          dueYmd: editForm.date,
          dueTime: editForm.time
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Erreur modification");
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const byStatus = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "TODO" ? -1 : 1;
    });
  }, [tasks]);

  const allIds = byStatus.map((t) => t.id);
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Taches</h1>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              disabled={selectedCount === 0}
              onClick={deleteSelected}
            >
              Supprimer ({selectedCount})
            </Button>
            <Button variant="outline" onClick={() => selectAll(selectedCount === allIds.length ? [] : allIds)}>
              {selectedCount === allIds.length ? "Deselectionner tout" : "Tout selectionner"}
            </Button>
            <Button onClick={() => setCreating((v) => !v)}>{creating ? "Fermer" : "Ajouter une tache"}</Button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <CsvImportPanel
          title="Importer des taches (CSV)"
          description="Colonnes: titre, description, date (YYYY-MM-DD ou 15/01/2025), heure (HH:MM ou 14h30), status."
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
                <div className="flex items-start gap-2">
                  {canEdit ? (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={isSelected(t.id)}
                      onChange={() => toggleSelected(t.id)}
                      aria-label={`Selectionner ${t.title}`}
                    />
                  ) : null}
                  <div>
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        t.status === "DONE" && "line-through text-mutedForeground"
                      )}
                    >
                      {t.title}
                    </div>
                    {t.description ? <div className="text-xs text-mutedForeground">{t.description}</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(t)}>
                      {t.status === "DONE" ? "Rouvrir" : "Fait"}
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => startEdit(t)}>
                      Modifier
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button variant="destructive" size="sm" onClick={() => deleteOne(t.id)}>
                      Supprimer
                    </Button>
                  ) : null}
                  <Badge variant={t.status === "DONE" ? "outline" : "muted"}>{t.status}</Badge>
                </div>
              </div>

              {canEdit && editingId === t.id ? (
                <Card className="mt-3 space-y-3 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Titre</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Heure</Label>
                      <Input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Annuler
                    </Button>
                    <Button disabled={saving} onClick={saveEdit}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </Card>
              ) : null}

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
