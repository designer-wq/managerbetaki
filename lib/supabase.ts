import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_KEY_KEY = 'supabase_key';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_URL_KEY) || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_KEY_KEY) || '' : '';
const supabaseUrl = envUrl || storedUrl;
const supabaseKey = envKey || storedKey;
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    if (supabaseUrl && supabaseKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
        return supabaseInstance;
    }
    console.error('Missing Supabase credentials. Configure em Configurações > Integração Supabase.');
    return null;
};
