import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/** Wraps studio/onboarding routes; redirects to /auth when not signed in, and gates onboarding correctly. */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasVoiceDna, setHasVoiceDna] = useState<boolean | null>(null);
  const [hasLegacyOnboarding, setHasLegacyOnboarding] = useState<boolean | null>(null);

  const path = location.pathname;

  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    if (!user) return;
    setProfileChecked(false);

    const fetchProfile = () =>
      supabase
        .from("profiles")
        .select("voice_dna_completed, onboarding_complete")
        .eq("id", user.id)
        .single();

    fetchProfile()
      .then(({ data }) => {
        if (cancelled) return;
        const done = !!(data?.voice_dna_completed || data?.onboarding_complete);
        setHasVoiceDna(!!data?.voice_dna_completed);
        setHasLegacyOnboarding(!!data?.onboarding_complete);
        setProfileChecked(true);
        // On studio, if first fetch says not done, retry once after a short delay (replication/cache lag)
        if (path.startsWith("/studio") && !done) {
          retryTimeoutId = window.setTimeout(() => {
            if (cancelled) return;
            fetchProfile().then(({ data: retryData }) => {
              if (cancelled) return;
              if (!!retryData?.voice_dna_completed || !!retryData?.onboarding_complete) {
                setHasVoiceDna(!!retryData?.voice_dna_completed);
                setHasLegacyOnboarding(!!retryData?.onboarding_complete);
              }
            });
          }, 600);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setProfileChecked(true);
      });

    return () => {
      cancelled = true;
      if (retryTimeoutId !== undefined) window.clearTimeout(retryTimeoutId);
    };
  }, [user, path]);

  if (loading || (user && !profileChecked)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F2ED",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid #C8961A",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const onboardingDone = !!hasVoiceDna || !!hasLegacyOnboarding;

  if (path.startsWith("/studio")) {
    if (!onboardingDone) {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  }

  if (path === "/onboarding") {
    if (onboardingDone) {
      return <Navigate to="/studio/dashboard" replace />;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}
