import { createClient } from '@supabase/supabase-js';

// Hardcoded public project credentials so Next.js build issues can't break API connections
const supabaseUrl = 'https://upbrdrulvqsabmfpxoyt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-actual-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
