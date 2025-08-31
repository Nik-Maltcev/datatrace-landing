const { createClient } = require('@supabase/supabase-js');

// Lazy initialization to avoid build-time errors
let supabaseClient = null;
let supabaseAdmin = null;
let initialized = false;

function initializeSupabase() {
  if (initialized) return;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase configuration missing. Authentication features will be disabled.');
    initialized = true;
    return;
  }
  
  // Client for frontend/public operations
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Admin client for server-side operations
  if (supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  initialized = true;
}

// Getter functions that initialize on first access
function getSupabaseClient() {
  initializeSupabase();
  return supabaseClient;
}

function getSupabaseAdmin() {
  initializeSupabase();
  return supabaseAdmin;
}

function isConfigured() {
  initializeSupabase();
  return !!(supabaseClient);
}

module.exports = {
  supabaseClient: getSupabaseClient,
  supabaseAdmin: getSupabaseAdmin,
  isConfigured
};