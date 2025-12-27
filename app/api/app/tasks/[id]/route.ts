import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const { id } = await ctx.params;
  const task = await prisma.task.findFirst({ where: { id, householdId: session.householdId } });
  if (!task) return NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 });

  const nextStatus = body.status ? String(body.status) : null;
  const canEditMetadata = session.role === "PARENT";

  const data: any = {};
  if (nextStatus && (nextStatus === "TODO" || nextStatus === "DONE")) {
    data.status = nextStatus;
  }
  if (canEditMetadata) {
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) data.description = String(body.description).trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Rien à mettre à jour" }, { status: 400 });
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
