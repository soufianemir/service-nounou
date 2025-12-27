import Link from "next/link";
import { NavMobile } from "@/components/app/NavMobile";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Link href="/app" className="text-sm font-semibold tracking-tight">
            CarnetNounou
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden md:inline-flex" />
            <form action="/api/auth/logout" method="post">
              <button className="rounded-xl px-3 py-2 text-sm text-mutedForeground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-ring/15" type="submit">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 pb-28">{children}</main>

      <NavMobile />
    </div>
  );
}
