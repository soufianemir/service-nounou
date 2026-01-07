import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseCsv, buildHeaderIndex, getCell } from "@/lib/csv";

const COURSE_HEADERS: Record<string, string[]> = {
  label: ["label", "libelle", "produit", "item", "article", "course"],
  qty: ["qty", "quantite", "qte", "quantity"],
  status: ["status", "etat", "state"]
};

function normalizeStatus(value: string): "OPEN" | "DONE" {
  const v = value.trim().toLowerCase();
  if (!v) return "OPEN";
  if (["done", "fait", "termine", "ok", "achete", "achetee", "achetes"].includes(v)) return "DONE";
  return "OPEN";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (session.role !== "PARENT") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let csvText = "";
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    csvText = await req.text();
  }

  const parsed = parseCsv(csvText);
  if (parsed.headers.length === 0) {
    return NextResponse.json({ ok: false, error: "empty_csv" }, { status: 400 });
  }

  const headerIndex = buildHeaderIndex(parsed.headers, COURSE_HEADERS);
  if (headerIndex.label === undefined) {
    return NextResponse.json({ ok: false, error: "missing_label_column" }, { status: 400 });
  }

  const created: Array<{
    householdId: string;
    label: string;
    qty?: string | null;
    status: string;
  }> = [];
  const errors: Array<{ row: number; error: string }> = [];
  const MAX_ROWS = 1000;

  parsed.rows.slice(0, MAX_ROWS).forEach((row, idx) => {
    const line = idx + 2;
    const label = getCell(row, headerIndex.label).trim();
    if (!label) {
      errors.push({ row: line, error: "missing_label" });
      return;
    }
    const qty = getCell(row, headerIndex.qty);
    const status = normalizeStatus(getCell(row, headerIndex.status));
    created.push({
      householdId: session.householdId,
      label,
      qty: qty || null,
      status
    });
  });

  if (created.length === 0) {
    return NextResponse.json({ ok: false, error: "no_valid_rows", errors }, { status: 400 });
  }

  await prisma.shoppingItem.createMany({ data: created });

  return NextResponse.json({
    ok: true,
    imported: created.length,
    skipped: errors.length,
    errors
  });
}
