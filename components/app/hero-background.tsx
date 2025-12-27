"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  lightOpacityClassName?: string;
  darkOpacityClassName?: string;
};

export function HeroBackground({
  src,
  alt,
  className,
  imageClassName,
  // Intention: keep the photo visible enough to feel “premium”,
  // while staying subtle (text readability comes first).
  lightOpacityClassName = "opacity-[0.16]",
  darkOpacityClassName = "dark:opacity-[0.22]"
}: Props) {
  const imgWrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const wrap = imgWrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf: number | null = null;

    const tick = () => {
      raf = null;
      const y = window.scrollY || 0;
      const t = Math.max(-28, Math.min(28, y * 0.06));
      wrap.style.transform = `translate3d(0, ${t}px, 0) scale(1.02)`;
    };

    const onScroll = () => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div ref={imgWrapRef} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className={cn(
            "object-cover object-center",
            "transition-opacity duration-300",
            lightOpacityClassName,
            darkOpacityClassName,
            imageClassName
          )}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
      <div className="absolute inset-0 bg-grid opacity-[0.25] dark:opacity-[0.18]" />
      <div className="absolute inset-0 mask-fade bg-[radial-gradient(ellipse_at_50%_20%,hsl(var(--foreground)_/_0.10),transparent_65%)]" />
    </div>
  );
}
