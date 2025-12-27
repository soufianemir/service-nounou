import { LegalLayout } from "@/components/app/LegalLayout";

export default function CguPage() {
  return (
    <LegalLayout title="Conditions Générales d’Utilisation">
      <p>
        (MVP) Ce document est un gabarit. Avant une mise en production réelle, faites valider vos CGU
        par un conseil juridique.
      </p>
      <p>
        Le service fournit des fonctionnalités d’organisation (planning, journal, tâches, alertes).
        Vous restez responsables de l’exactitude des informations saisies et de vos obligations.
      </p>
      <p>
        En utilisant l’app, vous acceptez de l’utiliser de bonne foi et de ne pas tenter d’en perturber
        le fonctionnement.
      </p>
    </LegalLayout>
  );
}
