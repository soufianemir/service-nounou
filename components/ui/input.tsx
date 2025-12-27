import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-background/70 px-3 text-sm outline-none backdrop-blur transition",
        "placeholder:text-mutedForeground/80",
        "focus:ring-4 focus:ring-ring/15",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}
