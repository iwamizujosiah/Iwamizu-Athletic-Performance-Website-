import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder strings during build-time static generation
// so Next.js doesn't crash if Vercel environment variables are missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
