import Link from "next/link";
import { PublicHeader } from "@/components/app/PublicHeader";
import { PublicFooter } from "@/components/app/PublicFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ConnexionPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="container max-w-md py-16">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Connexion</h1>
          <p className="mt-1 text-sm text-mutedForeground">Accédez à votre carnet de liaison.</p>

          <form className="mt-6 space-y-4" action="/api/auth/login" method="post">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button className="w-full" type="submit">Se connecter</Button>
          </form>

          <p className="mt-4 text-sm text-mutedForeground">
            Pas de compte ?{" "}
            <Link className="underline" href="/inscription">Créer un compte</Link>
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
