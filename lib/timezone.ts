type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function toParts(date: Date, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second"))
  };
}

/** Returns YYYY-MM-DD for a Date, interpreted in the provided IANA timezone. */
export function ymdInTimeZone(date: Date, timeZone: string): string {
  const p = toParts(date, timeZone);
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
}

// Backward-compatible aliases used by some pages/components.
export function getNowInTz(_timeZone: string): Date {
  // We only need "now"; ymdInTz is responsible for timezone interpretation.
  return new Date();
}

export function ymdInTz(date: Date, timeZone: string): string {
  return ymdInTimeZone(date, timeZone);
}

/** Calendar-add days to a YYYY-MM-DD string (timezone-free). */
export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // noon UTC avoids DST edges
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Convert a local time (in an IANA timezone) to a UTC Date.
 *
 * Why: serverless runtimes are often UTC; we must not rely on server timezone.
 */
export function zonedTimeToUtcDate(input: {
  timeZone: string;
  ymd: string; // YYYY-MM-DD
  hour?: number;
  minute?: number;
  second?: number;
}): Date {
  const { timeZone, ymd, hour = 0, minute = 0, second = 0 } = input;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));

  // First guess: treat local components as if they were UTC.
  let utc = new Date(Date.UTC(y, m - 1, d, hour, minute, second));

  // Two iterations handle most DST anomalies.
  for (let i = 0; i < 2; i++) {
    const p = toParts(utc, timeZone);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const diffMs = asUTC - utc.getTime();
    utc = new Date(utc.getTime() - diffMs);
  }

  return utc;
}

export function dayRangeUtcFromYmd(timeZone: string, ymd: string): { start: Date; end: Date } {
  const start = zonedTimeToUtcDate({ timeZone, ymd, hour: 0, minute: 0, second: 0 });
  const nextStart = zonedTimeToUtcDate({ timeZone, ymd: addDaysYmd(ymd, 1), hour: 0, minute: 0, second: 0 });
  return { start, end: new Date(nextStart.getTime() - 1) };
}

export function todayRangeUtc(timeZone: string, now = new Date()): { start: Date; end: Date; ymd: string } {
  const ymd = ymdInTimeZone(now, timeZone);
  const { start, end } = dayRangeUtcFromYmd(timeZone, ymd);
  return { start, end, ymd };
}

export function formatDateFr(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, dateStyle: "medium" }).format(date);
}

export function formatDateTimeFr(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
