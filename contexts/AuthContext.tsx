import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

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
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let authSubscription: { unsubscribe: () => void } | null = null;

    const updateProfile = async (session: any) => {
      setUser(session?.user || null);

      if (session?.user) {
        // Fetch profile data from database - this is the source of truth for role
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*, job_titles(name)")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("[Auth] Error fetching profile:", error);
        }

        const pd: any = profileData || {};
        const metadata = session.user.user_metadata || {};

        // IMPORTANT: Database profile is the source of truth for role
        // Metadata is only used for display name fallback
        const finalRole = pd.role || metadata.role || "designer"; // Default to designer (restricted)

        console.log(`[Auth] User role from DB: ${pd.role}, from metadata: ${metadata.role}, final: ${finalRole}`);

        setProfile({
          ...pd,
          id: session.user.id,
          email: session.user.email || "",
          name: metadata.name || pd.name || session.user.email?.split("@")[0] || "User",
          role: finalRole.toLowerCase(), // Always lowercase for consistency
          permission_level: pd.permission_level || metadata.permission_level || "1",
          origin: pd.origin || metadata.origin || "",
          job_titles: pd.job_titles,
        });
      } else {
        setProfile(null);
      }
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await updateProfile(session);

      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        updateProfile(session);
      });
      authSubscription = data.subscription;
    };

    initAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // isAdmin is ONLY true for admin, administrador, or master roles
  const roleKey = profile?.role?.toLowerCase() || '';
  const isAdmin = ['admin', 'administrador', 'master'].includes(roleKey);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

