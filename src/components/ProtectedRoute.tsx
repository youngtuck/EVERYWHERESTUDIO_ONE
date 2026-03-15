import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Wraps studio/onboarding routes; redirects to /auth when not signed in, and gates onboarding correctly. Uses profile from AuthContext (refreshed by onboarding before redirect). */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const path = useLocation().pathname;

  const profileReady = user && profile !== null;
  const onboardingDone = !!profile?.voice_dna_completed || !!profile?.onboarding_complete;

  if (loading || (user && !profileReady)) {
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
