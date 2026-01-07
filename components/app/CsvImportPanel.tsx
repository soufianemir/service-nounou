"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ImportResult = {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  errors?: Array<{ row: number; error: string }>;
  error?: string;
};

export function CsvImportPanel(props: {
  title: string;
  description?: string;
  endpoint: string;
  sampleHref?: string;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(props.endpoint, {
        method: "POST",
        body: form
      });
      const json = (await res.json().catch(() => ({}))) as ImportResult;
      if (!res.ok) {
        setResult({ ok: false, error: json.error || "import_failed", errors: json.errors });
        return;
      }
      setResult(json);
      setFile(null);
      if (props.onSuccess) props.onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">{props.title}</div>
          {props.description ? <div className="text-xs text-mutedForeground">{props.description}</div> : null}
        </div>
        {props.sampleHref ? (
          <Link className="text-xs text-primary underline" href={props.sampleHref} target="_blank">
            Telecharger le modele CSV
          </Link>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label>Fichier CSV</Label>
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button disabled={!file || loading} onClick={submit}>
          {loading ? "Import..." : "Importer"}
        </Button>
      </div>

      {result ? (
        <div className="space-y-1 text-xs">
          {result.ok === false ? (
            <div className="text-red-600">Erreur: {result.error}</div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Importes: {result.imported ?? 0}</Badge>
              <Badge variant="muted">Ignores: {result.skipped ?? 0}</Badge>
            </div>
          )}
          {result.errors && result.errors.length > 0 ? (
            <div className="text-mutedForeground">
              {result.errors.slice(0, 5).map((e) => (
                <div key={`${e.row}-${e.error}`}>Ligne {e.row}: {e.error}</div>
              ))}
              {result.errors.length > 5 ? <div>...{result.errors.length - 5} autres erreurs</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
