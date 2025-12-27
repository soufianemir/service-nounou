import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavMobileClient } from "@/components/app/NavMobileClient";

export async function NavMobile() {
  const session = await getSession();
  const unreadCount = session
    ? await prisma.inAppNotification.count({
        where: {
          householdId: session.householdId,
          OR: [{ membershipId: session.membershipId }, { membershipId: null }],
          readAt: null
        }
      })
    : 0;

  return <NavMobileClient unreadCount={unreadCount} />;
}
