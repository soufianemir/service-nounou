import { LegalLayout } from "@/components/app/LegalLayout";

export default function TarifsPage() {
  return (
    <LegalLayout title="Tarifs">
      <p>
        Le produit est en <strong>bêta</strong>. Les tarifs définitifs ne sont pas annoncés ici.
      </p>
      <p>
        Si vous souhaitez être informé(e) du lancement et des conditions de la bêta, utilisez la page Contact.
      </p>
      <p className="text-mutedForeground">
        Note : nous n’affichons pas de “prix inventés”. Les conditions seront communiquées au moment opportun.
      </p>
    </LegalLayout>
  );
}
