import { LegalLayout } from "@/components/app/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        CarnetNounou stocke les données nécessaires au fonctionnement : comptes, planning, tâches,
        journal et éventuels justificatifs (MVP).
      </p>
      <p>
        Vous pouvez supprimer vos données en supprimant le compte (fonctionnalité à venir) ou en nous
        contactant.
      </p>
      <p className="text-mutedForeground">
        (MVP) Ce texte est indicatif. Ajoutez vos clauses (RGPD) avant production.
      </p>
    </LegalLayout>
  );
}
