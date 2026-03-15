import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type ProfileOnboarding = {
  voice_dna_completed: boolean;
  onboarding_complete: boolean;
} | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: ProfileOnboarding;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileOnboarding>(null);
  const hasRoutedRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("voice_dna_completed, onboarding_complete")
      .eq("id", user.id)
      .single();
    setProfile(
      data
        ? {
            voice_dna_completed: !!data.voice_dna_completed,
            onboarding_complete: !!data.onboarding_complete,
          }
        : null
    );
  }, [user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Only route once per session, on initial sign-in. Do not redirect away from /onboarding mid-flow.
      if (event === "SIGNED_IN" && session?.user && !hasRoutedRef.current) {
        const pathname = window.location.pathname;
        const retrainParam = new URLSearchParams(window.location.search).get("retrain");
        if (retrainParam && pathname === "/onboarding") {
          return; // Never redirect away from /onboarding when retrain param is present
        }
        hasRoutedRef.current = true;
        if (pathname === "/auth") {
          (async () => {
            const { data } = await supabase
              .from("profiles")
              .select("voice_dna_completed, onboarding_complete")
              .eq("id", session.user.id)
              .single();

            if (!data?.voice_dna_completed && !data?.onboarding_complete) {
              window.location.href = "/onboarding";
            } else {
              window.location.href = "/studio/dashboard";
            }
          })();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user is set (initial load and after sign-in)
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    refreshProfile();
  }, [user?.id, refreshProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    hasRoutedRef.current = false;
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
