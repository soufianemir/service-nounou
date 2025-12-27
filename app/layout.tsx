import type { Metadata } from "next";
import { ThemeScript } from "@/components/ui/theme";
import { FlashToast } from "@/components/ui/toast";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CarnetNounou",
    template: "%s · CarnetNounou"
  },
  description: "Planning, horaires, journal, tâches, courses et alertes — le carnet de liaison simple entre famille et nounou.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CarnetNounou",
    statusBarStyle: "default"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <FlashToast />
        {children}
      </body>
    </html>
  );
}
