"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  once?: boolean;
  as?: React.ElementType;
};

export function Reveal({ children, className, delayMs = 0, once = true, as = "div" }: Props) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  const Tag = as as any;

  return (
    <Tag
      ref={ref as any}
      className={cn("will-change-transform", shown ? "animate-fade-up" : "opacity-0 translate-y-3", className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
