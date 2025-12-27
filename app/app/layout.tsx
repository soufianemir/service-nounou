import { AppShell } from "@/components/app/AppShell";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Protect everything under /app
  await requireSession();
  return <AppShell>{children}</AppShell>;
}
