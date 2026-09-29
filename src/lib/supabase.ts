import { createClient } from '@supabase/supabase-js';

// Optional backend. The platform runs entirely on the local store without it;
// set both variables in .env.local (and in Vercel) to switch to Supabase.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url!, key!)
  : null;
