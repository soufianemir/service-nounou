import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">CarnetNounou</div>
            <p className="mt-3 text-sm text-mutedForeground">
              Le carnet de liaison moderne : planning, horaires, journal, tâches, courses et alertes internes — pour une relation claire entre famille et nounou.
            </p>
          </div>

          <div className="text-sm">
            <div className="font-semibold">Pages</div>
            <ul className="mt-3 space-y-2 text-mutedForeground">
              <li><Link className="hover:text-foreground transition" href="/notre-role">Notre rôle</Link></li>
              <li><Link className="hover:text-foreground transition" href="/tarifs">Tarifs</Link></li>
              <li><Link className="hover:text-foreground transition" href="/cgu">CGU</Link></li>
              <li><Link className="hover:text-foreground transition" href="/mentions-legales">Mentions légales</Link></li>
              <li><Link className="hover:text-foreground transition" href="/politique-confidentialite">Confidentialité</Link></li>
              <li><Link className="hover:text-foreground transition" href="/cookies">Cookies</Link></li>
              <li><Link className="hover:text-foreground transition" href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <div className="font-semibold">Important</div>
            <p className="mt-3 text-mutedForeground">
              L’app vous aide à vous organiser. Elle ne remplace ni un contrat, ni la loi, ni un professionnel.
            </p>
          </div>
        </div>

        <div className="mt-10 text-xs text-mutedForeground">
          © {new Date().getFullYear()} — CarnetNounou • Vous restez décisionnaire et responsable de vos obligations.
        </div>
      </div>
    </footer>
  );
}
