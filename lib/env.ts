import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().min(1),

  // Auth
  SESSION_JWT_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().default("cn_session"),
  SESSION_COOKIE_SECURE: z
    .string()
    .optional()
    // Important: keep `undefined` when unset so the fallback logic in `lib/auth.ts`
    // (`env.SESSION_COOKIE_SECURE ?? env.NODE_ENV === "production"`) remains correct.
    // If we returned `false` when `SESSION_COOKIE_SECURE` is unset, cookies would be
    // *non-secure* even in production.
    .transform((v) => (v === undefined ? undefined : v === "true")),

  // App
  NEXT_PUBLIC_BASE_URL: z.string().optional().default("http://localhost:3000"),

  // Storage (disabled by default in serverless)
  FILE_STORAGE_DIR: z.string().optional(),

  // Cron / inbound verification
});

export const env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,

  SESSION_JWT_SECRET: process.env.SESSION_JWT_SECRET,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE,

  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,

  FILE_STORAGE_DIR: process.env.FILE_STORAGE_DIR,
});
