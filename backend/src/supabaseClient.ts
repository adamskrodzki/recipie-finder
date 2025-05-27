import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Create Supabase client with service role key for backend operations
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log('Supabase admin client initialized successfully'); 