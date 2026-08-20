/**
 * Typed environment loading + validation.
 *
 * SERVER-ONLY. Never import this into client components — it reads secrets.
 * Validation is conditional on STORAGE_BACKEND so local dev on the in-memory adapter
 * boots with zero configuration, while `supabase` requires its credentials.
 */
import { z } from 'zod';

export const STORAGE_BACKENDS = ['memory', 'supabase'] as const;
export type StorageBackend = (typeof STORAGE_BACKENDS)[number];

const EnvSchema = z
  .object({
    // storage
    STORAGE_BACKEND: z.enum(STORAGE_BACKENDS).default('memory'),

    // Supabase (Postgres + Auth). The URL and anon key are safe to expose to the browser;
    // the service-role key is SERVER-ONLY and must never be prefixed with NEXT_PUBLIC_.
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

    // tracking
    REDIRECT_COOKIE_DOMAIN: z.string().default('.reylix.com'),
    REDIRECT_BASE_URL: z.string().url().default('https://go.reylix.com'),
    ATTRIBUTION_WINDOW_DAYS: z.coerce.number().int().positive().default(30),
    CLICK_DEDUP_MINUTES: z.coerce.number().int().positive().default(30),
    ALLOWED_REDIRECT_HOSTS: z.string().default(''),

    // admin access (Supabase Auth account must ALSO be on this allow-list)
    SESSION_SECRET: z.string().min(1).default('dev-insecure-session-secret-change-me'),
    ADMIN_EMAILS: z.string().default(''), // comma-separated admin emails
    ADMIN_PASSWORD: z.string().optional(),

    // email
    EMAIL_PROVIDER_API_KEY: z.string().min(1).optional(),
    ADMIN_NOTIFY_EMAIL: z.string().email().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.STORAGE_BACKEND === 'supabase') {
      for (const key of [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ] as const) {
        if (!val[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_BACKEND=supabase`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Validate and cache `process.env`. Throws an aggregated error on misconfiguration. */
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * Lightweight read of the storage backend that does NOT force full validation.
 * Used by the health probe so it stays green before secrets are configured.
 */
export function getStorageBackend(): StorageBackend {
  const parsed = z.enum(STORAGE_BACKENDS).safeParse(process.env.STORAGE_BACKEND ?? 'memory');
  return parsed.success ? parsed.data : 'memory';
}

/** Parsed open-redirect allowlist. */
export function allowedRedirectHosts(): string[] {
  return loadEnv()
    .ALLOWED_REDIRECT_HOSTS.split(',')
    .map((h) => h.trim())
    .filter(Boolean);
}

/** Base URL of the redirect host (e.g. https://go.reylix.com), no trailing slash. */
export function redirectBaseUrl(): string {
  return loadEnv().REDIRECT_BASE_URL.replace(/\/$/, '');
}

/** Parsed admin allowlist (emails permitted to hold an admin session). */
export function adminEmails(): string[] {
  return loadEnv()
    .ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Shared admin password (server-only). When set, admin login also requires it. */
export function adminPassword(): string | undefined {
  return loadEnv().ADMIN_PASSWORD;
}

/** Supabase connection settings. Throws unless STORAGE_BACKEND=supabase is fully configured. */
export function supabaseConfig(): { url: string; anonKey: string; serviceRoleKey: string } {
  const env = loadEnv();
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = env;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Supabase is not configured; set STORAGE_BACKEND=supabase and its keys.');
  }
  return { url, anonKey, serviceRoleKey };
}

/** Test-only: clear the cached env so the next `loadEnv()` re-reads `process.env`. */
export function __resetEnv(): void {
  cached = null;
}
