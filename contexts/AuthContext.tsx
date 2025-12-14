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
            } else {
                // FALLBACK: Check localStorage for legacy login (Initial Load)
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    try {
                        const parsed = JSON.parse(savedUser);
                        setUser({ id: parsed.id, email: parsed.email });
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', parsed.id)
                            .single();

                        if (profileData) {
                            setProfile(profileData);
                        } else {
                            setProfile(parsed);
                        }
                    } catch (e) {
                        // ignore
                    }
                }
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
                    // FALLBACK: Check localStorage for legacy login
                    const savedUser = localStorage.getItem('currentUser');
                    if (savedUser) {
                        try {
                            const parsed = JSON.parse(savedUser);
                            setUser({ id: parsed.id, email: parsed.email }); // Mock Supabase user object
                            // Profile might be incomplete in localStorage, so we fetch it again or use what we have
                            // Ideally fetch fresh profile from DB using ID
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', parsed.id)
                                .single();

                            if (profileData) {
                                setProfile(profileData);
                            } else {
                                // If fetch fails, use local storage data as profile
                                setProfile(parsed);
                            }
                        } catch (e) {
                            console.error("AuthContext: Failed to parse local user");
                            setProfile(null);
                        }
                    } else {
                        setProfile(null);
                    }
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
