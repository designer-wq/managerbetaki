import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_KEY_KEY = 'supabase_key';

export const getSupabase = () => {
    const supabaseUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const supabaseKey = localStorage.getItem(SUPABASE_KEY_KEY);

    if (supabaseUrl && supabaseKey) {
        return createClient(supabaseUrl, supabaseKey);
    }

    return null;
};
