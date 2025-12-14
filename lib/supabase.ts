import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_KEY_KEY = 'supabase_key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const getSupabase = () => {
    if (supabaseUrl && supabaseKey) {
        return createClient(supabaseUrl, supabaseKey);
    }
    console.error('Missing Supabase credentials in .env');
    return null;
};
