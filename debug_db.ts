import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use ANON key to simulate frontend

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreation() {
    console.log("Testing creation with text credentials...");

    // 1. Login as the user (You said you are logged in, but here I test purely DB RLS with a test user or just Anon if policies allow Anon?)
    // Actually, RLS blocks Anon insert. I need a token.
    // Since I cannot login as the user easily without their password, checking RLS via this script is hard unless I use the Service Role Key.
    // BUT, I can check if the TABLES EXIST.

    const { data: origins, error: originError } = await supabase.from('origins').select('*').limit(1);
    if (originError) console.error("Error reading demand_origins:", originError);
    else console.log("Read demand_origins success:", origins);

    const { data: types, error: typeError } = await supabase.from('demand_types').select('*').limit(1);
    if (typeError) console.error("Error reading demand_types:", typeError);
    else console.log("Read demand_types success:", types);
}

testCreation();
