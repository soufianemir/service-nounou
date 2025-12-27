import { LegalLayout } from "@/components/app/LegalLayout";
import { LEGAL, displayOrDash } from "@/lib/legal";

export default function ContactPage() {
  return (
    <LegalLayout title="Contact">
      <p>
        Pour toute demande : <strong>{displayOrDash(LEGAL.contactEmail)}</strong>
      </p>
      <p className="text-mutedForeground">
        (MVP) Le formulaire de contact arrive bientôt. Pour l’instant, un email suffit.
      </p>
    </LegalLayout>
  );
}
