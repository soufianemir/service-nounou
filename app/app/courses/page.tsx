import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/app-data";
import { CoursesClient } from "@/components/app/CoursesClient";

export default async function CoursesPage() {
  const { household, membership } = await requireMembership();
  const tz = household.timezone || "Europe/Paris";
  const items = await prisma.shoppingItem.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, label: true, qty: true, status: true, createdAt: true }
  });

  return (
    <CoursesClient role={membership.role} timezone={tz} initialItems={items} />
  );
}
