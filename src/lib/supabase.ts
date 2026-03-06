import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// the anon key used by the public client. some projects use
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY instead of ANON_KEY.
// try both so the env can use whichever name the dashboard shows.
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables (URL or anon key not set)'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
