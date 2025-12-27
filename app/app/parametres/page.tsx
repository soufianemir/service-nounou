import { requireMembership } from "@/lib/app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteEmployeeCard } from "@/components/app/InviteEmployeeCard";

export default async function ParametresPage() {
  const { membership, household, user } = await requireMembership();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Parametres</h1>
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-mutedForeground">
          <div>Utilisateur: {user.email}</div>
          <div>Role: {membership.role}</div>
          <div>Fuseau horaire: {household.timezone || "Europe/Paris"}</div>
        </CardContent>
      </Card>

      {membership.role === "PARENT" ? (
        <InviteEmployeeCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Acces limite</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-mutedForeground">
            Les reglages avances sont reserves au parent.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
