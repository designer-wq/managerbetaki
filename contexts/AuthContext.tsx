import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Route, useNavigate } from 'react-router-dom';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    permission_level: string;
    origin?: string;
    avatar_url?: string;
    job_titles?: {
        name: string;
    };
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
const navigate = useNavigate();
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
                // Fetch extra data (Job Title Name) that might not be in metadata
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, job_titles(name)')
                    .eq('id', session.user.id)
                    .single();

                // Merge: Metadata takes precedence for core fields (Source of Truth)
                const metadata = session.user.user_metadata || {};
                const pd: any = profileData || {};

                // Safe merge
                setProfile({
                    ...(pd),
                    id: session.user.id,
                    email: session.user.email || '',
                    name: metadata.name || pd.name || session.user.email?.split('@')[0] || 'User',
                    role: metadata.role || pd.role || 'Colaborador',
                    permission_level: metadata.permission_level || pd.permission_level || '1',
                    origin: metadata.origin || pd.origin || '',
                    job_titles: pd.job_titles
                });
            } else {
                setProfile(null);
                navigate('/login'); 
                return;
            }

            setLoading(false);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                setUser(session?.user || null);
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*, job_titles(name)')
                        .eq('id', session.user.id)
                        .single();

                    const metadata = session.user.user_metadata || {};
                    const pd: any = profileData || {};

                    setProfile({
                        ...(pd),
                        id: session.user.id,
                        email: session.user.email || '',
                        name: metadata.name || pd.name || session.user.email?.split('@')[0] || 'User',
                        role: metadata.role || pd.role || 'Colaborador',
                        permission_level: metadata.permission_level || pd.permission_level || '1',
                        origin: metadata.origin || pd.origin || '',
                        job_titles: pd.job_titles
                    });
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

    const isAdmin = profile?.permission_level === '4';

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
