import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseCsv, buildHeaderIndex, getCell } from "@/lib/csv";
import { isValidTime } from "@/lib/schedule";
import { zonedTimeToUtcDate } from "@/lib/timezone";

const TASK_HEADERS: Record<string, string[]> = {
  title: ["title", "titre", "tache", "task", "libelle", "name"],
  description: ["description", "desc", "details", "detail"],
  date: ["date", "jour", "due_date", "due date", "due", "ymd", "due_ymd"],
  time: ["time", "heure", "hour", "due_time", "due time", "time_hhmm"],
  status: ["status", "etat", "state"],
  bucket: ["moment", "bucket", "periode", "creneau"]
};

function normalizeStatus(value: string): "TODO" | "DONE" {
  const v = value.trim().toLowerCase();
  if (!v) return "TODO";
  if (["done", "fait", "termine", "ok", "completed"].includes(v)) return "DONE";
  return "TODO";
}

function defaultTimeFromBucket(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (["matin", "am", "morning"].includes(v)) return "09:00";
  if (["aprem", "apresmidi", "apres-midi", "pm", "afternoon"].includes(v)) return "14:00";
  if (["soir", "evening", "night"].includes(v)) return "19:00";
  return null;
}

function isValidYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

  const headerIndex = buildHeaderIndex(parsed.headers, TASK_HEADERS);
  if (headerIndex.title === undefined) {
    return NextResponse.json({ ok: false, error: "missing_title_column" }, { status: 400 });
  }

  const created: Array<{
    householdId: string;
    title: string;
    description?: string | null;
    status: "TODO" | "DONE";
    dueAt?: Date | null;
  }> = [];
  const errors: Array<{ row: number; error: string }> = [];
  const MAX_ROWS = 1000;

  parsed.rows.slice(0, MAX_ROWS).forEach((row, idx) => {
    const line = idx + 2; // header + 1-based
    const title = getCell(row, headerIndex.title).trim();
    if (!title) {
      errors.push({ row: line, error: "missing_title" });
      return;
    }

    const description = getCell(row, headerIndex.description) || undefined;
    const status = normalizeStatus(getCell(row, headerIndex.status));
    const dateValue = getCell(row, headerIndex.date);
    const timeValue = getCell(row, headerIndex.time);
    const bucketValue = getCell(row, headerIndex.bucket);

    let dueAt: Date | null = null;
    if (dateValue) {
      if (!isValidYmd(dateValue)) {
        errors.push({ row: line, error: "invalid_date" });
        return;
      }
      let time = "09:00";
      const bucketDefault = bucketValue ? defaultTimeFromBucket(bucketValue) : null;
      if (timeValue && isValidTime(timeValue)) {
        time = timeValue;
      } else if (bucketDefault) {
        time = bucketDefault;
      }
      const hour = Number(time.slice(0, 2));
      const minute = Number(time.slice(3, 5));
      dueAt = zonedTimeToUtcDate({ timeZone: tz, ymd: dateValue, hour, minute, second: 0 });
    }

    created.push({
      householdId: session.householdId,
      title,
      description: description || null,
      status,
      dueAt
    });
  });

  if (created.length === 0) {
    return NextResponse.json({ ok: false, error: "no_valid_rows", errors }, { status: 400 });
  }

  await prisma.task.createMany({ data: created });

  return NextResponse.json({
    ok: true,
    imported: created.length,
    skipped: errors.length,
    errors
  });
}
