import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This will show up in your Vercel build/runtime logs or browser console
  throw new Error("Supabase environment variables are missing! Check your Vercel configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
