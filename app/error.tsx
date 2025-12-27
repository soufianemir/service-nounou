"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Oups, un problème est survenu</h1>
          <p className="text-sm text-mutedForeground mt-1">
            Vous pouvez réessayer, ou revenir à l’accueil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium"
          >
            Réessayer
          </button>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-transparent px-4 py-2 text-sm"
          >
            Accueil
          </Link>
        </div>

        {process.env.NODE_ENV === "development" ? (
          <p className="text-xs text-mutedForeground break-words">{error.message}</p>
        ) : null}
      </div>
    </main>
  );
}
