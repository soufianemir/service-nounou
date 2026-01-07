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
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ label: "", qty: "" });
  const canEdit = props.role === "PARENT";

  async function refresh() {
    const res = await fetch("/api/app/courses", { headers: { Accept: "application/json" } });
    const json = await res.json().catch(() => ({ items: [] }));
    setItems(Array.isArray(json?.items) ? json.items : []);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {canEdit ? (
          <Button onClick={() => setCreating((v) => !v)}>{creating ? "Fermer" : "Ajouter un item"}</Button>
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
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.qty ? <div className="text-xs text-mutedForeground">Qte: {item.qty}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(item)}>
                    {item.status === "DONE" ? "Rouvrir" : "Fait"}
                  </Button>
                  <Badge variant={item.status === "DONE" ? "outline" : "muted"}>{item.status}</Badge>
                </div>
              </div>
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
