import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthPage = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [reveal, setReveal] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReveal(true)));
    return () => cancelAnimationFrame(id);
  }, [mode]);

  const switchMode = () => {
    setReveal(false);
    setSubmitError("");
    setMode(m => m === "signin" ? "signup" : "signin");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (mode === "signup" && password !== confirmPassword) {
      setSubmitError("Passwords don't match.");
      return;
    }

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setSubmitError(error.message); return; }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) { setSubmitError(error.message); return; }
        setSubmitError("Check your email to confirm your account.");
        return;
      }
      // After successful sign-in, route based on onboarding completion
      const { data: authed } = await supabase.auth.getUser();
      const authedUser = authed.user;
      if (!authedUser) { navigate("/auth"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", authedUser.id)
        .single();

      if (!profile?.onboarding_complete) navigate("/onboarding");
      else navigate("/studio/dashboard");
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/studio/dashboard` }
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Afacad Flux', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(200,150,26,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(58,123,213,0.04) 0%, transparent 50%)",
        }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        body { background: #07090f; }
        .auth-input {
          width: 100%;
          background: #0e1117;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #ffffff;
          outline: none;
          font-family: 'Afacad Flux', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          transition: border-color 0.2s ease, box-shadow 0.25s ease;
        }
        .auth-input::placeholder {
          color: rgba(255,255,255,0.35);
        }
        .auth-input:focus {
          border-color: #C8961A;
          box-shadow: 0 0 0 3px rgba(200,150,26,0.12), 0 0 20px rgba(200,150,26,0.08);
        }
        .auth-input:focus-visible {
          outline: 2px solid #C8961A;
          outline-offset: 2px;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Brand wordmark */}
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.16em", color: "#C8961A" }}>
                EVERY
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.16em", color: "#ffffff" }}>
                WHERE
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(232,232,230,0.4)",
                }}
              >
                Studio
              </span>
            </div>
          </div>
        </button>

        {/* Tagline */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(232,232,230,0.45)",
            }}
          >
            Ideas to Impact
          </span>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "#0e1117",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 40,
          }}
        >
          <div
            key={mode}
            style={{
              opacity: reveal ? 1 : 0,
              transform: reveal ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <p
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(232,232,230,0.45)",
                  fontWeight: 500,
                }}
              >
                {mode === "signin" ? "Welcome back" : "Create your studio"}
              </p>
              <h1
                style={{
                  fontSize: "clamp(22px,3vw,28px)",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.04em",
                  margin: 0,
                }}
              >
                {mode === "signin" ? "Sign in to EVERYWHERE" : "Join EVERYWHERE Studio"}
              </h1>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "signup" && (
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.55)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Email
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Password
                </label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {mode === "signup" && (
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.55)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                style={{
                  marginTop: 10,
                  width: "100%",
                  background: "#C8961A",
                  color: "#0A0A0A",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {mode === "signin" ? "Sign In" : "Create Studio"}
              </button>
              {submitError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#e85d75",
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  {submitError}
                </p>
              )}
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "22px 0 16px",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(232,232,230,0.5)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: "transparent",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                padding: "11px 14px",
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Toggle */}
            <p
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 13,
                color: "rgba(232,232,230,0.65)",
              }}
            >
              {mode === "signin" ? "Don't have a studio? " : "Already have a studio? "}
              <button
                type="button"
                onClick={switchMode}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#C8961A",
                  textDecoration: "none",
                }}
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
