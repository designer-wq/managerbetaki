
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const email = 'admin@manager.com';
    const password = 'f3l1p3';

    console.log('Creating user...');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'Administrador', // User metadata
                name: 'Master Admin'
            }
        }
    });

    if (error) {
        console.error('Error creating auth user:', error);
    } else {
        console.log('Auth user created:', data.user?.id);

        // Now ensure profile exists and is active (trigger might handle it, or we do manual)
        // We can't insert into profiles via Client API if RLS blocks 'insert' for anon.
        // Ideally we rely on the `auth.users` -> `profiles` trigger if it exists.
        // If not, I will run a SQL update after this to ensure profile is set.
    }
}

seed();
