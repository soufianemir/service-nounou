import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray((body as any)?.ids)
    ? (body as any).ids.map((x: unknown) => String(x))
    : [];
  const uniqueIds = Array.from(new Set<string>(ids)).filter((x) => x.length > 0);
  if (uniqueIds.length === 0) {
    return NextResponse.json({ ok: false, error: "ids_required" }, { status: 400 });
  }
  if (uniqueIds.length > 200) {
    return NextResponse.json({ ok: false, error: "too_many_ids" }, { status: 400 });
  }

  const res = await prisma.shoppingItem.deleteMany({
    where: { householdId: session.householdId, id: { in: uniqueIds } }
  });

  return NextResponse.json({ ok: true, deleted: res.count });
}
