import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Fallback configuration prevents the Next.js compiler from crashing on early import evaluation
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
