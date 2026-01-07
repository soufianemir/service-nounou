import { addDaysYmd } from "@/lib/timezone";

export type WeeklySlot = {
  weekday: number; // 0=Monday .. 6=Sunday (ISO-like for UI)
  enabled: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type ScheduleException = {
  dateYmd: string; // "YYYY-MM-DD" in household timezone
  /** Unique id for edits (added in V1.1). */
  id?: string;
  /** OFF removes the base day; REPLACE overrides base hours; ADD adds an extra slot. */
  kind?: "OFF" | "REPLACE" | "ADD";
  off?: boolean;
  start?: string;
  end?: string;
  note?: string;
};

export function isValidTime(hhmm: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;
  const h = Number(hhmm.slice(0, 2));
  const m = Number(hhmm.slice(3, 5));
  if (!Number.isInteger(h) || !Number.isInteger(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function minutes(hhmm: string): number {
  const h = Number(hhmm.slice(0, 2));
  const m = Number(hhmm.slice(3, 5));
  return h * 60 + m;
}

function compareTime(a: string, b: string): number {
  return minutes(a) - minutes(b);
}

export function defaultWeeklySchedule(): WeeklySlot[] {
  // Mon..Fri 14:30-19:30, weekend off.
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    enabled: weekday <= 4,
    start: "14:30",
    end: "19:30"
  }));
}

export function parseWeeklySchedule(raw: unknown): WeeklySlot[] {
  if (!Array.isArray(raw)) return defaultWeeklySchedule();
  const byDay = new Map<number, WeeklySlot>();
  for (const v of raw) {
    const o = v as any;
    const weekday = Number(o?.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
    const enabled = Boolean(o?.enabled);
    const start = typeof o?.start === "string" ? o.start : "14:30";
    const end = typeof o?.end === "string" ? o.end : "19:30";
    byDay.set(weekday, { weekday, enabled, start, end });
  }
  const out = [0, 1, 2, 3, 4, 5, 6].map((d) => byDay.get(d) ?? defaultWeeklySchedule()[d]);
  return out;
}

export function parseExceptions(raw: unknown): ScheduleException[] {
  // Keep order as stored in DB (append = newest last). This is important when multiple exceptions exist on the same date.
  if (!Array.isArray(raw)) return [];
  const out: ScheduleException[] = [];
  for (const v of raw) {
    const o = v as any;
    const dateYmd = typeof o?.dateYmd === "string" ? o.dateYmd : null;
    if (!dateYmd || !/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) continue;
    const kind = typeof o?.kind === "string" ? o.kind : undefined;
    out.push({
      id: typeof o?.id === "string" ? o.id : undefined,
      dateYmd,
      kind: kind === "OFF" || kind === "REPLACE" || kind === "ADD" ? (kind as any) : undefined,
      off: o?.off === true ? true : undefined,
      start: typeof o?.start === "string" ? o.start : undefined,
      end: typeof o?.end === "string" ? o.end : undefined,
      note: typeof o?.note === "string" ? o.note : undefined
    });
  }
  return out;
}

type NormalizedException = Required<Pick<ScheduleException, "dateYmd" | "kind">> &
  Omit<ScheduleException, "kind" | "dateYmd">;

function normalizeException(ex: ScheduleException): NormalizedException | null {
  const inferred: NormalizedException["kind"] = ex.kind
    ? ex.kind
    : ex.off
      ? "OFF"
      : ex.start && ex.end
        ? "REPLACE"
        : "ADD";

  if (inferred === "OFF") {
    return { ...ex, kind: "OFF", off: true };
  }

  if (!ex.start || !ex.end) return null;
  if (!isValidTime(ex.start) || !isValidTime(ex.end)) return null;
  if (compareTime(ex.start, ex.end) >= 0) return null;
  return { ...ex, kind: inferred };
}

export type DayWorkSegment = {
  id: string;
  source: "weekly" | "exception";
  kind: "BASE" | "ADD";
  start: string;
  end: string;
  note?: string;
};

export function computeWorkSegmentsForDate(input: {
  ymd: string;
  weekly: WeeklySlot[];
  exceptions: ScheduleException[];
}): { segments: DayWorkSegment[]; off: boolean } {
  // Weekday from YYYY-MM-DD without relying on runtime timezone.
  const [yy, mm, dd] = input.ymd.split("-").map((x) => Number(x));
  const js = new Date(Date.UTC(yy, (mm ?? 1) - 1, dd ?? 1, 12, 0, 0)).getUTCDay(); // Sun=0..Sat=6
  const weeklyIdx = (js + 6) % 7; // Mon=0..Sun=6
  const baseWeekly = input.weekly[weeklyIdx];

  const dayExceptions = input.exceptions
    .filter((e) => e.dateYmd === input.ymd)
    .map(normalizeException)
    .filter(Boolean) as NormalizedException[];

  const hasOff = dayExceptions.some((e) => e.kind === "OFF");
  const replace = [...dayExceptions].reverse().find((e) => e.kind === "REPLACE");
  const add = dayExceptions.filter((e) => e.kind === "ADD");

  const segments: DayWorkSegment[] = [];

  if (!hasOff) {
    if (replace) {
      segments.push({
        id: replace.id ?? `${input.ymd}:replace`,
        source: "exception",
        kind: "BASE",
        start: replace.start!,
        end: replace.end!,
        note: replace.note
      });
    } else if (baseWeekly?.enabled) {
      segments.push({
        id: `${input.ymd}:weekly`,
        source: "weekly",
        kind: "BASE",
        start: baseWeekly.start,
        end: baseWeekly.end,
        note: undefined
      });
    }
  }

  for (const ex of add) {
    segments.push({
      id: ex.id ?? `${input.ymd}:add:${segments.length}`,
      source: "exception",
      kind: "ADD",
      start: ex.start!,
      end: ex.end!,
      note: ex.note
    });
  }

  return { segments, off: segments.length === 0 };
}

export function weekdayLabel(weekday: number): string {
  return ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][weekday] ?? String(weekday);
}

export function computeNextDays(input: {
  startYmd: string;
  days: number;
  weekly: WeeklySlot[];
  exceptions: ScheduleException[];
}): Array<{ ymd: string; label: string; off: boolean; start?: string; end?: string; note?: string; source: "exception" | "weekly" }> {
  const { startYmd, days, weekly, exceptions } = input;
  const res: Array<{ ymd: string; label: string; off: boolean; start?: string; end?: string; note?: string; source: "exception" | "weekly" }> = [];
  for (let i = 0; i < days; i++) {
    const ymd = addDaysYmd(startYmd, i);
    // Convert to a weekday index (0..6) using UTC noon (timezone-free). This maps Mon=0.
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const js = dt.getUTCDay(); // Sun=0..Sat=6
    const weekday = (js + 6) % 7; // Mon=0..Sun=6

    const { segments, off } = computeWorkSegmentsForDate({ ymd, weekly, exceptions });
    const primary = segments.find((s) => s.kind === "BASE") ?? segments[0];
    res.push({
      ymd,
      label: weekdayLabel(weekday),
      off,
      start: primary?.start,
      end: primary?.end,
      note: primary?.note,
      source: primary?.source ?? "weekly"
    });
  }
  return res;
}
