import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  subtitle,
  ctaHref,
  ctaLabel
}: {
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 backdrop-blur">
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <div className="mt-2 text-sm text-mutedForeground">{subtitle}</div>
      <div className="mt-5">
        <Link href={ctaHref}>
          <Button variant="secondary">{ctaLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
