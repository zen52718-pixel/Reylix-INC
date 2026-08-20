import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetEnv,
  adminEmails,
  allowedRedirectHosts,
  getStorageBackend,
  loadEnv,
  supabaseConfig,
} from '@/src/config/env';

const snapshot = { ...process.env };

afterEach(() => {
  process.env = { ...snapshot };
  __resetEnv();
});

/** Put a complete, valid Supabase configuration in the environment. */
function withSupabaseEnv(): void {
  process.env.STORAGE_BACKEND = 'supabase';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
}

describe('env validation', () => {
  it('defaults to the memory backend with no configuration', () => {
    delete process.env.STORAGE_BACKEND;
    __resetEnv();
    const env = loadEnv();
    expect(env.STORAGE_BACKEND).toBe('memory');
    expect(env.ATTRIBUTION_WINDOW_DAYS).toBe(30);
    expect(env.CLICK_DEDUP_MINUTES).toBe(30);
  });

  it('requires Supabase credentials when STORAGE_BACKEND=supabase', () => {
    process.env.STORAGE_BACKEND = 'supabase';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    __resetEnv();
    expect(() => loadEnv()).toThrow(/STORAGE_BACKEND=supabase/);
  });

  it('names every missing Supabase key, not just the first', () => {
    process.env.STORAGE_BACKEND = 'supabase';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    __resetEnv();
    expect(() => loadEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    __resetEnv();
    expect(() => loadEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('accepts a complete Supabase configuration', () => {
    withSupabaseEnv();
    __resetEnv();
    expect(loadEnv().STORAGE_BACKEND).toBe('supabase');
    expect(supabaseConfig().serviceRoleKey).toBe('service-role-key');
  });

  it('parses the open-redirect allowlist', () => {
    process.env.STORAGE_BACKEND = 'memory';
    process.env.ALLOWED_REDIRECT_HOSTS = 'lawcaseconnect.com, reylix.com';
    __resetEnv();
    expect(allowedRedirectHosts()).toEqual(['lawcaseconnect.com', 'reylix.com']);
  });

  it('parses and lower-cases the admin allowlist', () => {
    process.env.STORAGE_BACKEND = 'memory';
    process.env.ADMIN_EMAILS = 'Admin@Reylix.com, ops@reylix.com ';
    __resetEnv();
    expect(adminEmails()).toEqual(['admin@reylix.com', 'ops@reylix.com']);
  });

  it('reads the backend without forcing full validation', () => {
    process.env.STORAGE_BACKEND = 'supabase';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    __resetEnv();
    // getStorageBackend must NOT throw even though the Supabase keys are absent.
    expect(getStorageBackend()).toBe('supabase');
  });
});
