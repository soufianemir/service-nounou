import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toE164(input: string): string | null {
  const s = input.trim();
  if (/^\+\d{8,15}$/.test(s)) return s;
  return null;
}

export function euroToCents(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
