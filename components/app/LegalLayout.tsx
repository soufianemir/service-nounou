import { PublicHeader } from "@/components/app/PublicHeader";
import { PublicFooter } from "@/components/app/PublicFooter";

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="container max-w-3xl py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-mutedForeground">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
