import { PrismaClient } from "@prisma/client";

function withPgBouncerSettings(url: string | undefined) {
  if (!url) return undefined;
  const normalized = url.toLowerCase();
  const isSupabase = normalized.includes(".supabase.co") || normalized.includes("supabase.com");
  const usePgBouncer =
    normalized.includes("pooler.supabase.com") || normalized.includes("pgbouncer=true");

  try {
    const u = new URL(url);

    // Defensive fix: some misconfigured env vars miss the DB name (e.g. "...:6543?schema=public...").
    // On Supabase, the database is typically named "postgres".
    if (isSupabase && (u.pathname === "" || u.pathname === "/")) {
      u.pathname = "/postgres";
    }

    if (isSupabase) {
      if (!u.searchParams.has("schema")) u.searchParams.set("schema", "public");
      if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
      if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
    }

    if (usePgBouncer) {
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("statement_cache_size")) u.searchParams.set("statement_cache_size", "0");
    }

    return u.toString();
  } catch {
    if (!usePgBouncer) return url;
    const [base, query] = url.split("?", 2);
    const params = new URLSearchParams(query ?? "");
    if (!params.has("pgbouncer")) params.set("pgbouncer", "true");
    if (!params.has("statement_cache_size")) params.set("statement_cache_size", "0");
    if (!params.has("connection_limit")) params.set("connection_limit", "1");
    const nextQuery = params.toString();
    return nextQuery ? `${base}?${nextQuery}` : base;
  }
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
