import { createClient } from "@supabase/supabase-js";

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY"
  );
}

// Create and configure Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
