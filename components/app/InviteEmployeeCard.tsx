"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiOk = { ok: true; tempPassword: string };
type ApiErr = { ok: false; error: string };

export function InviteEmployeeCard() {
  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ApiOk | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/app/members/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName })
      });

      const json = (await res.json()) as ApiOk | ApiErr;
      if (!res.ok || !json.ok) {
        setError((json as ApiErr).error ?? "Erreur");
        return;
      }

      setResult(json as ApiOk);
      setEmail("");
      setDisplayName("");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding nounou (MVP)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-mutedForeground">
        <p>
          Créez un compte nounou (rôle <span className="font-medium">EMPLOYEE</span>) pour cette famille.
          Le mot de passe temporaire est affiché <span className="font-medium">une seule fois</span>.
        </p>

        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email nounou</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nounou@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Nom affiché</Label>
            <Input
              id="invite-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Ex. Sarah"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer le compte nounou"}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="rounded-2xl border border-border bg-card/60 p-3 text-sm text-foreground">
            ❗ {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-2xl border border-border bg-card/60 p-3">
            <div className="text-sm font-medium text-foreground">Mot de passe temporaire</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-muted px-2 py-1 text-sm">{result.tempPassword}</code>
              <Button type="button" variant="secondary" onClick={() => copy(result.tempPassword)}>
                Copier
              </Button>
            </div>
            <p className="mt-2 text-xs text-mutedForeground">
              Conseil : demandez à la nounou de changer ce mot de passe dès la première connexion (fonction à venir).
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
