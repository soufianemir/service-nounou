import { requireMembership } from "@/lib/app-data";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteEmployeeCard } from "@/components/app/InviteEmployeeCard";

export default async function ParametresPage() {
  const { membership, household, user } = await requireMembership();

  const employees =
    membership.role === "PARENT"
      ? await prisma.membership.findMany({
          where: { householdId: household.id, role: "EMPLOYEE" },
          include: { user: { select: { email: true } } },
          orderBy: { displayName: "asc" }
        })
      : [];

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
        <>
          <Card>
            <CardHeader>
              <CardTitle>Nounou</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-mutedForeground">
              {employees.length === 0 ? (
                <div>Aucune nounou rattachee pour le moment.</div>
              ) : (
                employees.map((m) => (
                  <div key={m.id}>
                    {m.displayName || "Nounou"} — {m.user.email}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <InviteEmployeeCard />
        </>
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
