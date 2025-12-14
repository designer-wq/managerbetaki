import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: any | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const supabase = getSupabase();
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);

            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setProfile(profileData);
            }

            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    setProfile(profileData);
                } else {
                    setProfile(null);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        fetchSession();
    }, []);

    const isAdmin = profile?.role === 'Administrador';

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
