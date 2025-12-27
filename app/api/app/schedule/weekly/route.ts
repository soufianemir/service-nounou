import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseWeeklySchedule } from "@/lib/schedule";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseWeeklySchedule(body);

  await prisma.household.update({
    where: { id: session.householdId },
    data: { workScheduleWeekly: parsed }
  });

  return NextResponse.json({ ok: true });
}
