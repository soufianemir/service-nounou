import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
        <h1 className="text-xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm text-mutedForeground">
          Cette adresse n’existe pas (ou n’est plus disponible).
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium"
          >
            Retour à l’app
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-transparent px-4 py-2 text-sm"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
