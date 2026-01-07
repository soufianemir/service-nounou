import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const items = await prisma.shoppingItem.findMany({
    where: { householdId: session.householdId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, label: true, qty: true, status: true, createdAt: true }
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const label = String(body.label || "").trim();
  if (!label) {
    return NextResponse.json({ ok: false, error: "label_required" }, { status: 400 });
  }
  const qty = body.qty ? String(body.qty).trim() : null;

  const item = await prisma.shoppingItem.create({
    data: {
      householdId: session.householdId,
      label,
      qty: qty || null,
      status: "OPEN"
    },
    select: { id: true, label: true, qty: true, status: true, createdAt: true }
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
