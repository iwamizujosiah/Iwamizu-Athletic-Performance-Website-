import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Hardcoding the public anonymous credentials so Next.js guarantees they are baked in.
const supabaseUrl = 'https://upbrdrulvqsabmfpxoyt.supabase.co';
const supabaseAnonKey = 'PASTE_YOUR_ACTUAL_LONG_ANON_KEY_HERE_STARTING_WITH_ey';

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
