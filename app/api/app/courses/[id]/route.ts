import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function normalizeStatus(value: unknown): "OPEN" | "DONE" | null {
  if (value === undefined || value === null) return null;
  const v = String(value).trim().toUpperCase();
  if (v === "OPEN" || v === "DONE") return v as "OPEN" | "DONE";
  if (["FAIT", "TERMINE", "OK"].includes(v)) return "DONE";
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const item = await prisma.shoppingItem.findFirst({
    where: { id, householdId: session.householdId }
  });
  if (!item) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatus = normalizeStatus(body.status);

  const data: { status?: string; label?: string; qty?: string | null } = {};
  if (nextStatus) data.status = nextStatus;
  if (body.label !== undefined) data.label = String(body.label || "").trim();
  if (body.qty !== undefined) data.qty = String(body.qty || "").trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 400 });
  }

  const updated = await prisma.shoppingItem.update({
    where: { id: item.id },
    data,
    select: { id: true, label: true, qty: true, status: true, createdAt: true }
  });

  return NextResponse.json({ ok: true, item: updated });
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
  await prisma.shoppingItem.deleteMany({
    where: { id, householdId: session.householdId }
  });
  return NextResponse.json({ ok: true });
}
