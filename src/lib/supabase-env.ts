/** Shared Supabase env resolution for server + SSR (Vercel often only has VITE_* at build). */
export function getSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL ||
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  );
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
