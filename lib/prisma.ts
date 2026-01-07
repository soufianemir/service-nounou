import { PrismaClient } from "@prisma/client";

function withPgBouncerSettings(url: string | undefined) {
  if (!url) return undefined;
  const normalized = url.toLowerCase();
  const usePgBouncer =
    normalized.includes("pooler.supabase.com") || normalized.includes("pgbouncer=true");
  if (!usePgBouncer) return url;

  const [base, query] = url.split("?", 2);
  const params = new URLSearchParams(query ?? "");
  if (!params.has("pgbouncer")) params.set("pgbouncer", "true");
  if (!params.has("statement_cache_size")) params.set("statement_cache_size", "0");
  if (!params.has("connection_limit")) params.set("connection_limit", "1");
  const nextQuery = params.toString();
  return nextQuery ? `${base}?${nextQuery}` : base;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const datasourceUrl = withPgBouncerSettings(process.env.DATABASE_URL);

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: [],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {})
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
