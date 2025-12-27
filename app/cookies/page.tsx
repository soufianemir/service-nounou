import { LegalLayout } from "@/components/app/LegalLayout";

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookies">
      <p>
        L’app utilise un cookie <strong>strictement nécessaire</strong> : votre session de connexion.
      </p>
      <p>
        Aucun cookie publicitaire ou de tracking n’est utilisé dans ce MVP.
      </p>
    </LegalLayout>
  );
}
