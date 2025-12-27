import { LegalLayout } from "@/components/app/LegalLayout";
import { LEGAL, displayOrDash } from "@/lib/legal";

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <p><strong>Éditeur :</strong> {displayOrDash(LEGAL.publisherName)}</p>
      <p><strong>Statut :</strong> {displayOrDash(LEGAL.publisherStatus)}</p>
      <p><strong>Adresse :</strong> {displayOrDash(LEGAL.publisherAddress)}</p>
      <p><strong>Contact :</strong> {displayOrDash(LEGAL.contactEmail)}</p>
      <p><strong>Hébergeur :</strong> {displayOrDash(LEGAL.hostName)}</p>
      <p><strong>Adresse hébergeur :</strong> {displayOrDash(LEGAL.hostAddress)}</p>
    </LegalLayout>
  );
}
