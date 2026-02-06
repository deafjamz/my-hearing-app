import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Clean env vars - remove newlines, whitespace that can break HTTP headers
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/[\n\r\s]+/g, '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/[\n\r\s]+/g, '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables');
}

// Create typed Supabase client (v5 schema with condition_snr)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
