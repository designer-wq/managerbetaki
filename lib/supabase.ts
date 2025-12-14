import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_KEY_KEY = 'supabase_key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    if (supabaseUrl && supabaseKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
        return supabaseInstance;
    }
    console.error('Missing Supabase credentials in .env');
    return null;
};
