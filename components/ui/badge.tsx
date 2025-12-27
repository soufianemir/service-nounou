import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "muted" | "outline";
};

export function Badge({ className, variant = "muted", ...props }: Props) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";
  const styles = {
    muted: "bg-muted text-mutedForeground",
    outline: "border border-border bg-transparent text-foreground"
  };
  return <span className={cn(base, styles[variant], className)} {...props} />;
}
