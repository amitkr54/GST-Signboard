import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder').trim();

if (supabaseUrl.includes('placeholder')) {
    console.warn('⚠️ WARNING: Supabase URL is not set in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
