import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY environment variables');
}

// Note: Database generic removed — postgrest-js v2.97 requires Relationships[]
// on all table types, which is incompatible with the current generated types.
// Re-add Database generic after regenerating types with `supabase gen types`.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
