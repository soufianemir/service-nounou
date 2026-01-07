"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CsvImportPanel } from "@/components/app/CsvImportPanel";
import { formatDateTimeFr } from "@/lib/timezone";

type ShoppingItemLite = {
  id: string;
  label: string;
  qty?: string | null;
  status: string;
  createdAt: string;
};

export function CoursesClient(props: {
  role: "PARENT" | "EMPLOYEE";
  timezone: string;
  initialItems: ShoppingItemLite[];
}) {
  const [items, setItems] = useState<ShoppingItemLite[]>(props.initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ label: "", qty: "" });
  const [editForm, setEditForm] = useState({ label: "", qty: "" });
  const canEdit = props.role === "PARENT";

  async function refresh() {
    const res = await fetch("/api/app/courses", { headers: { Accept: "application/json" } });
    const json = await res.json().catch(() => ({ items: [] }));
    setItems(Array.isArray(json?.items) ? json.items : []);
    setSelectedIds(new Set());
    setEditingId(null);
  }

  async function createItem() {
    const label = form.label.trim();
    if (!label) {
      setError("Libelle requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/app/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, qty: form.qty.trim() || undefined })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Erreur creation");
        return;
      }
      setForm({ label: "", qty: "" });
      setCreating(false);
      await refresh();
    } finally {
      setSaving(false);
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
    if (!confirm(`Supprimer ${ids.length} item(s) ?`)) return;
    const res = await fetch("/api/app/courses/bulk-delete", {
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
    if (!confirm("Supprimer cet item ?")) return;
    const res = await fetch(`/api/app/courses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error || "Erreur suppression");
      return;
    }
    await refresh();
  }

  function startEdit(item: ShoppingItemLite) {
    setEditingId(item.id);
    setEditForm({ label: item.label, qty: item.qty ?? "" });
  }

  async function saveEdit() {
    if (!editingId) return;
    const label = editForm.label.trim();
    if (!label) {
      setError("Libelle requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/app/courses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, qty: editForm.qty.trim() || null })
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

  async function toggleStatus(item: ShoppingItemLite) {
    const next = item.status === "DONE" ? "OPEN" : "DONE";
    const res = await fetch(`/api/app/courses/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    if (res.ok) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: next } : x)));
    }
  }

  const allIds = items.map((x) => x.id);
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
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
            <Button onClick={() => setCreating((v) => !v)}>{creating ? "Fermer" : "Ajouter un item"}</Button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <CsvImportPanel
          title="Importer des courses (CSV)"
          description="Colonnes: libelle, qty, status."
          endpoint="/api/app/courses/import"
          sampleHref="/templates/courses.csv"
          onSuccess={refresh}
        />
      ) : null}

      {canEdit && creating ? (
        <Card className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Libelle</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Lait, couches..."
              />
            </div>
            <div>
              <Label>Quantite</Label>
              <Input
                value={form.qty}
                onChange={(e) => setForm((prev) => ({ ...prev, qty: e.target.value }))}
                placeholder="Ex: 2 packs"
              />
            </div>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex justify-end">
            <Button disabled={saving} onClick={createItem}>
              {saving ? "Creation..." : "Creer"}
            </Button>
          </div>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <div className="text-sm text-mutedForeground">Aucune course pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {canEdit ? (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={isSelected(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Selectionner ${item.label}`}
                    />
                  ) : null}
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    {item.qty ? <div className="text-xs text-mutedForeground">Qte: {item.qty}</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(item)}>
                      {item.status === "DONE" ? "Rouvrir" : "Fait"}
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                      Modifier
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button variant="destructive" size="sm" onClick={() => deleteOne(item.id)}>
                      Supprimer
                    </Button>
                  ) : null}
                  <Badge variant={item.status === "DONE" ? "outline" : "muted"}>{item.status}</Badge>
                </div>
              </div>

              {canEdit && editingId === item.id ? (
                <Card className="mt-3 space-y-3 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Libelle</Label>
                      <Input
                        value={editForm.label}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, label: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Quantite</Label>
                      <Input
                        value={editForm.qty}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, qty: e.target.value }))}
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
                {formatDateTimeFr(new Date(item.createdAt), props.timezone)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
