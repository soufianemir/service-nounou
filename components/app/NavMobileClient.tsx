"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Home, NotebookPen, ShoppingCart, SquareCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Aujourd’hui", Icon: Home },
  { href: "/app/planning", label: "Planning", Icon: CalendarDays },
  { href: "/app/taches", label: "Tâches", Icon: SquareCheck },
  { href: "/app/journal", label: "Journal", Icon: NotebookPen },
  { href: "/app/courses", label: "Courses", Icon: ShoppingCart },
  { href: "/app/notifications", label: "Alertes", Icon: Bell },
  { href: "/app/parametres", label: "Réglages", Icon: Settings }
];

export function NavMobileClient({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur">
      <div className="container grid max-w-4xl grid-cols-7 gap-1 px-1 py-2">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition",
                active
                  ? "bg-muted/70 text-foreground"
                  : "text-mutedForeground hover:bg-muted/60 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon size={18} />
                {href === "/app/notifications" && unreadCount > 0 ? (
                  <span className="absolute -right-2 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-4 text-background">
                    {unreadCount}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
