import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to read current environment variables dynamically
function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    // SERVER-ONLY SECRET: Never prefix with NEXT_PUBLIC_ or expose to the browser bundle
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

/**
 * Validate whether Supabase credentials are configured and not placeholders
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();

  return (
    Boolean(url) &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('YOUR_PROJECT_REF') &&
    Boolean(serviceRoleKey || anonKey) &&
    !(
      anonKey.includes('your-supabase') ||
      serviceRoleKey.includes('your-supabase') ||
      anonKey.includes('YOUR_SUPABASE') ||
      serviceRoleKey.includes('YOUR_SUPABASE')
    )
  );
}

/**
 * Server-Side Privileged Supabase Client Factory
 *
 * ARCHITECTURAL SECURITY CONTRACT:
 * 1. This function executes exclusively on the server (Next.js Route Handlers & Server Components).
 * 2. It prioritizes SUPABASE_SERVICE_ROLE_KEY to perform authoritative operations while bypassing RLS.
 * 3. The service-role key is NEVER exposed to the browser, NEVER prefixed with NEXT_PUBLIC_,
 *    and NEVER sent across API responses.
 * 4. Direct anonymous browser access to the PostgreSQL database is blocked by RLS policies.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  // Defensive guard against accidental client-side invocation
  if (typeof window !== 'undefined') {
    throw new Error('Database client cannot be imported or executed in client-side code');
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();

  // Prioritize privileged service-role key for server operations; fallback to anon key if service role is absent
  const key = serviceRoleKey || anonKey;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

