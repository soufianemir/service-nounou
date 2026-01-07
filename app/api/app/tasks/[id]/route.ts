import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isValidTime } from "@/lib/schedule";
import { zonedTimeToUtcDate } from "@/lib/timezone";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  const { id } = await ctx.params;
  const task = await prisma.task.findFirst({ where: { id, householdId: session.householdId } });
  if (!task) return NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 });

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { timezone: true }
  });
  const tz = household?.timezone || "Europe/Paris";

  const nextStatus = body.status ? String(body.status) : null;

  const data: any = {};
  if (nextStatus && (nextStatus === "TODO" || nextStatus === "DONE")) {
    data.status = nextStatus;
  }
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined) data.description = String(body.description).trim() || null;

  if (body.dueYmd !== undefined || body.dueTime !== undefined) {
    const dueYmd = body.dueYmd ? String(body.dueYmd) : "";
    const dueTime = body.dueTime ? String(body.dueTime) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueYmd)) {
      return NextResponse.json({ ok: false, error: "invalid_dueYmd" }, { status: 400 });
    }
    const time = dueTime && isValidTime(dueTime) ? dueTime : "14:30";
    const hour = Number(time.slice(0, 2));
    const minute = Number(time.slice(3, 5));
    data.dueAt = zonedTimeToUtcDate({ timeZone: tz, ymd: dueYmd, hour, minute, second: 0 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data,
    select: { id: true, title: true, description: true, status: true, dueAt: true }
  });

  return NextResponse.json({ ok: true, task: updated });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await prisma.task.deleteMany({ where: { id, householdId: session.householdId } });
  return NextResponse.json({ ok: true });
}
