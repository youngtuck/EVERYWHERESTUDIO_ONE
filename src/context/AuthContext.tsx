import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user) {
        (async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("voice_dna_completed, onboarding_complete")
            .eq("id", session.user.id)
            .single();

          const path = window.location.pathname;
          const hasLegacyOnboarding = profile?.onboarding_complete;
          const hasVoiceDna = profile?.voice_dna_completed;

          // Only redirect when the user is on auth or onboarding already.
          // Never redirect away from marketing pages like "/" or "/explore".
          if (path === "/auth") {
            if (!hasVoiceDna && !hasLegacyOnboarding) {
              window.location.href = "/onboarding";
            } else {
              window.location.href = "/studio/dashboard";
            }
          } else if (path === "/onboarding") {
            if (hasVoiceDna || hasLegacyOnboarding) {
              window.location.href = "/studio/dashboard";
            }
          }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
