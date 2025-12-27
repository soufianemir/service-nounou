import Link from "next/link";
import { LegalLayout } from "@/components/app/LegalLayout";

export default function NotreRolePage() {
  return (
    <LegalLayout title="Notre rôle">
      <p>
        CarnetNounou est un <strong>carnet de liaison</strong> : il aide la famille et la nounou à
        partager la même information (planning, tâches, journal, courses…).
      </p>
      <p>
        L’app ne remplace ni un contrat de travail, ni la loi, ni des conseils professionnels. Vous
        restez responsables de vos décisions et obligations.
      </p>
      <p>
        Pour démarrer : créez un compte famille, configurez les horaires hebdomadaires, puis invitez
        la nounou depuis <Link href="/app/parametres" className="underline">Paramètres</Link>.
      </p>
    </LegalLayout>
  );
}
