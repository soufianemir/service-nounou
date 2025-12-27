import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseExceptions, isValidTime, ScheduleException } from "@/lib/schedule";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function normalizeKind(kind: unknown): "ADD" | "REPLACE" | "OFF" {
  const k = String(kind ?? "").toUpperCase();
  if (k === "ADD" || k === "REPLACE" || k === "OFF") return k;
  return "REPLACE";
}

function validatePayload(p: any) {
  const dateYmd = String(p.dateYmd ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    return { ok: false as const, error: "invalid_date" };
  }
  const kind = normalizeKind(p.kind);
  const note = p.note ? String(p.note) : undefined;
  const start = p.start ? String(p.start) : undefined;
  const end = p.end ? String(p.end) : undefined;

  if (kind === "OFF") {
    return { ok: true as const, value: { dateYmd, kind, note } };
  }
  if (!start || !end || !isValidTime(start) || !isValidTime(end)) {
    return { ok: false as const, error: "invalid_time" };
  }
  return { ok: true as const, value: { dateYmd, kind, start, end, note } };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { workScheduleExceptions: true }
  });
  const exceptions = parseExceptions(household?.workScheduleExceptions);
  return NextResponse.json({ ok: true, exceptions });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const v = validatePayload(body ?? {});
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { workScheduleExceptions: true }
  });
  const current = parseExceptions(household?.workScheduleExceptions);

  const created: ScheduleException = {
    id: newId(),
    dateYmd: v.value.dateYmd,
    kind: v.value.kind,
    start: (v.value as any).start,
    end: (v.value as any).end,
    off: v.value.kind === "OFF" ? true : undefined,
    note: v.value.note
  };

  const next = [...current, created];
  await prisma.household.update({
    where: { id: session.householdId },
    data: { workScheduleExceptions: next }
  });

  return NextResponse.json({ ok: true, exception: created });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const v = validatePayload(body ?? {});
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { workScheduleExceptions: true }
  });
  const current = parseExceptions(household?.workScheduleExceptions);
  const next = current.map((e) =>
    e.id === id
      ? {
          ...e,
          dateYmd: v.value.dateYmd,
          kind: v.value.kind,
          start: (v.value as any).start,
          end: (v.value as any).end,
          off: v.value.kind === "OFF" ? true : undefined,
          note: v.value.note
        }
      : e
  );

  await prisma.household.update({
    where: { id: session.householdId },
    data: { workScheduleExceptions: next }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    select: { workScheduleExceptions: true }
  });
  const current = parseExceptions(household?.workScheduleExceptions);
  const next = current.filter((e) => e.id !== id);
  await prisma.household.update({
    where: { id: session.householdId },
    data: { workScheduleExceptions: next }
  });
  return NextResponse.json({ ok: true });
}
