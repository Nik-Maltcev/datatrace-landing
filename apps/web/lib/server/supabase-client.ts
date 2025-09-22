import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabase;
}

export function assertSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase credentials are not configured.');
  }

  return client;
}
