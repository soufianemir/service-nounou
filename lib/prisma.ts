import { PrismaClient } from "@prisma/client";

function sanitizeDatabaseUrl(input: string | undefined) {
  if (!input) return undefined;

  let url = input.trim();

  // Common copy/paste mistakes: including key name and/or quotes from ".env".
  if (/^DATABASE_URL\s*=/i.test(url)) {
    url = url.replace(/^DATABASE_URL\s*=\s*/i, "");
  }
  url = url.trim();
  url = url.replace(/^['"]+/, "").replace(/['"]+$/, "");

  // If protocol is present later in the string, keep only the URL part.
  const p1 = url.indexOf("postgresql://");
  const p2 = url.indexOf("postgres://");
  const start = p1 >= 0 ? p1 : p2 >= 0 ? p2 : -1;
  if (start > 0) {
    url = url.slice(start).trim();
    url = url.replace(/^['"]+/, "").replace(/['"]+$/, "");
  }

  // If user pasted a Supabase host/DSN without protocol, try to recover.
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    const normalized = url.toLowerCase();
    const looksLikeSupabase =
      normalized.includes(".supabase.co") || normalized.includes("pooler.supabase.com");
    if (looksLikeSupabase && !normalized.includes("://")) {
      url = `postgresql://${url}`;
    }
  }

  return url;
}

function withPgBouncerSettings(url: string | undefined) {
  const cleaned = sanitizeDatabaseUrl(url);
  if (!cleaned) return undefined;

  const normalized = cleaned.toLowerCase();
  const isSupabase = normalized.includes(".supabase.co") || normalized.includes("supabase.com");
  const usePgBouncer =
    normalized.includes("pooler.supabase.com") || normalized.includes("pgbouncer=true");

  try {
    const u = new URL(cleaned);

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
    if (!usePgBouncer) return cleaned;
    const [base, query] = cleaned.split("?", 2);
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
