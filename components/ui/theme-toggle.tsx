"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "@/components/ui/theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) {}
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/70 backdrop-blur transition hover:bg-muted/60",
        "focus:outline-none focus:ring-4 focus:ring-ring/15",
        className
      )}
      aria-label={isDark ? "Passer en mode jour" : "Passer en mode nuit"}
      title={isDark ? "Mode jour" : "Mode nuit"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
