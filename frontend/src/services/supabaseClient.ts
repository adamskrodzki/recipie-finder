import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase'; // Assuming types are generated here

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set. Check your .env file.');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set. Check your .env file.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true, // Crucial for anonymous user ID persistence
      detectSessionInUrl: true,
    },
  },
); 