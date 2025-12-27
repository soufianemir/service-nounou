import Link from "next/link";
import { PublicHeader } from "@/components/app/PublicHeader";
import { PublicFooter } from "@/components/app/PublicFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function InscriptionPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="container max-w-md py-16">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Créer un compte famille</h1>
          <p className="mt-1 text-sm text-mutedForeground">
            Vous pourrez ensuite inviter la nounou (compte employé).
          </p>

          <form className="mt-6 space-y-4" action="/api/auth/signup" method="post">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </div>
            <Button className="w-full" type="submit">Créer le compte</Button>
          </form>

          <p className="mt-4 text-sm text-mutedForeground">
            Déjà un compte ?{" "}
            <Link className="underline" href="/connexion">Se connecter</Link>
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
