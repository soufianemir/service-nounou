import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { dayRangeUtcFromYmd, zonedTimeToUtcDate } from "@/lib/timezone";
import { isValidTime } from "@/lib/schedule";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { timezone: true }
  });
  const tz = household?.timezone || "Europe/Paris";
  const { searchParams } = new URL(req.url);
  const fromYmd = searchParams.get("fromYmd");
  const toYmd = searchParams.get("toYmd");

  let dueAtFilter: any = undefined;
  if (fromYmd && toYmd) {
    const start = zonedTimeToUtcDate({ timeZone: tz, ymd: fromYmd, hour: 0, minute: 0, second: 0 });
    const { end } = dayRangeUtcFromYmd(tz, toYmd);
    dueAtFilter = { gte: start, lte: end };
  }

  const tasks = await prisma.task.findMany({
    where: {
      householdId: session.householdId,
      ...(dueAtFilter ? { dueAt: dueAtFilter } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueAt: true,
      assignedToId: true,
      createdAt: true
    }
  });

  return NextResponse.json({ ok: true, tasks });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { timezone: true }
  });
  const tz = household?.timezone || "Europe/Paris";
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = body.description ? String(body.description).trim() : null;

  // Optional scheduling
  const dueYmd = body.dueYmd ? String(body.dueYmd) : null;
  const dueTime = body.dueTime ? String(body.dueTime) : null;
  let dueAt: Date | null = null;
  if (dueYmd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueYmd)) {
      return NextResponse.json({ ok: false, error: "invalid_dueYmd" }, { status: 400 });
    }
    const time = dueTime && isValidTime(dueTime) ? dueTime : "14:30";
    const hour = Number(time.slice(0, 2));
    const minute = Number(time.slice(3, 5));
    dueAt = zonedTimeToUtcDate({ timeZone: tz, ymd: dueYmd, hour, minute, second: 0 });
  }

  if (!title) {
    return NextResponse.json({ ok: false, error: "Titre requis" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      householdId: session.householdId,
      title,
      description: description || null,
      status: "TODO",
      dueAt
    },
    select: { id: true, title: true, description: true, status: true, dueAt: true }
  });

  return NextResponse.json({ ok: true, task }, { status: 201 });
}
