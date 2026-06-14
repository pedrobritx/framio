import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional for the MVP: Browse runs against the live Met API with no
 * config. These helpers return `null` when env is absent so the app degrades
 * gracefully until a project is connected (see docs/ARCHITECTURE.md).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

/** Browser client (anon key, RLS-enforced). Returns null if unconfigured. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

/** Server client (service role — server only). Returns null if unconfigured. */
export function getServerSupabase(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
