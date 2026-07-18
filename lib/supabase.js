import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_LIVE;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LIVE;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        eq: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) })
      })
    };
