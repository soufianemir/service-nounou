"use client";

import * as React from "react";

export function FlashToast() {
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get("toast");
    if (m) {
      setMsg(m);
      url.searchParams.delete("toast");
      window.history.replaceState({}, "", url.toString());
      const t = window.setTimeout(() => setMsg(null), 3500);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (!msg) return null;
  return (
    <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-border bg-card/90 px-4 py-2 text-sm text-foreground backdrop-blur shadow-card">
      {msg}
    </div>
  );
}
