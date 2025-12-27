import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/app/PublicHeader";
import { PublicFooter } from "@/components/app/PublicFooter";
import { HeroBackground } from "@/components/app/hero-background";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <HeroBackground src="/care-hero.webp" alt="Carnet de liaison" />

        <div className="container relative py-20 md:py-28">
          <Reveal as="div">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Le carnet de liaison
              <span className="block">moderne entre famille et nounou</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-mutedForeground">
              Planning clair, horaires, journal, tâches, courses et alertes — tout au même endroit.
              Simple comme une app iPhone : un écran = une décision.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inscription">
                <Button size="lg">Commencer</Button>
              </Link>
              <Link href="/connexion">
                <Button size="lg" variant="secondary">
                  Se connecter
                </Button>
              </Link>
              <Link href="/app">
                <Button size="lg" variant="ghost">
                  Aller à l’app
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal as="div" delayMs={120} className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
              <div className="text-sm font-semibold">Planning & horaires</div>
              <p className="mt-2 text-sm text-mutedForeground">
                Vue calendrier (jour / semaine / mois) + exceptions : jours fériés, sorties, garde supplémentaire.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
              <div className="text-sm font-semibold">Tâches & validations</div>
              <p className="mt-2 text-sm text-mutedForeground">
                Les parents créent les tâches. La nounou coche et ajoute une note. Historique clair.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
              <div className="text-sm font-semibold">Installable sur iOS</div>
              <p className="mt-2 text-sm text-mutedForeground">
                Ajoutez l’app sur l’écran d’accueil (PWA) : plein écran, rapide, pratique.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 flex items-center gap-4 text-sm text-mutedForeground">
            <Image src="/care-hero.webp" alt="" width={56} height={56} className="rounded-2xl border border-border" />
            <div>
              <div className="font-medium text-foreground">MVP premium</div>
              <div>Conçu pour être lisible, fiable et agréable au quotidien.</div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
