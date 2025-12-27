import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          CarnetNounou
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-mutedForeground md:flex">
          <Link className="hover:text-foreground transition" href="/notre-role">Notre rôle</Link>
          <Link className="hover:text-foreground transition" href="/tarifs">Tarifs</Link>
          <Link className="hover:text-foreground transition" href="/contact">Contact</Link>
          <Link className="hover:text-foreground transition" href="/cgu">CGU</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:inline-flex" />
          <Link href="/connexion"><Button variant="secondary">Connexion</Button></Link>
          <Link href="/inscription"><Button>Commencer</Button></Link>
        </div>
      </div>
    </header>
  );
}
