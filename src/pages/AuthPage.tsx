// NOTE: Public signup is gated by access code "OneIdea" (case-insensitive).
// To fully disable public signup at the infrastructure level:
// Supabase Dashboard > Authentication > Settings > Disable "Enable email signup"
// This is recommended before any public launch.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

const AuthPage = () => {
  const [mode, setMode] = useState<"signin" | "signup">(() =>
    new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin"
  );
  const [reveal, setReveal] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReveal(true)));
    return () => cancelAnimationFrame(id);
  }, [mode]);

  const switchMode = () => {
    setReveal(false);
    setSubmitError("");
    setResetSent(false);
    setMode(m => m === "signin" ? "signup" : "signin");
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setSubmitError("Enter your email above first.");
      return;
    }
    setSubmitError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setResetSent(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (mode === "signup") {
      try {
        const codeRes = await fetch(`${API_BASE}/api/validate-access-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: accessCode.trim(), email: email.trim() }),
        });
        const codeData = await codeRes.json();
        if (!codeData.valid) {
          setSubmitError(codeData.error || "Invalid access code.");
          return;
        }
        (window as any).__ewCodeId = codeData.codeId;
      } catch {
        if (accessCode.trim().toLowerCase() !== "oneidea") {
          setSubmitError("Invalid access code.");
          return;
        }
      }
      if (password !== confirmPassword) {
        setSubmitError("Passwords don't match.");
        return;
      }
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
        // Redeem the access code
        const codeId = (window as any).__ewCodeId;
        if (codeId) {
          fetch(`${API_BASE}/api/redeem-access-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codeId }),
          });
          delete (window as any).__ewCodeId;
        }
        setSubmitError("Check your email to confirm your account.");
        return;
      }
      // After successful sign-in, route based on onboarding completion
      const { data: authed } = await supabase.auth.getUser();
      const authedUser = authed.user;
      if (!authedUser) { navigate("/auth"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("voice_dna_completed, onboarding_complete")
        .eq("id", authedUser.id)
        .single();

      if (!profile?.voice_dna_completed && !profile?.onboarding_complete) navigate("/onboarding");
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
        background: "#0D1B2A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Afacad Flux', sans-serif",
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
          background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(245,198,66,0.06) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(74,144,217,0.04) 0%, transparent 50%)",
        }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..1000&display=swap');
        body { background: #0D1B2A; }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #ffffff;
          outline: none;
          font-family: 'Afacad Flux', sans-serif;
          transition: border-color 0.2s ease, box-shadow 0.25s ease;
        }
        .auth-input::placeholder {
          color: rgba(255,255,255,0.35);
        }
        .auth-input:focus {
          border-color: #F5C642;
          box-shadow: 0 0 0 3px rgba(245,198,66,0.12), 0 0 20px rgba(245,198,66,0.08);
        }
        .auth-input:focus-visible {
          outline: 2px solid #F5C642;
          outline-offset: 2px;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Brand wordmark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={18} variant="dark" onClick={() => navigate("/studio")} />
        </div>

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
            background: "#1B263B",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* Tabs: Sign In | Create Account */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              onClick={() => { setReveal(false); setSubmitError(""); setResetSent(false); setMode("signin"); }}
              style={{
                flex: 1,
                padding: "14px 16px",
                background: mode === "signin" ? "rgba(255,255,255,0.04)" : "transparent",
                border: "none",
                borderBottom: mode === "signin" ? "2px solid #F5C642" : "2px solid transparent",
                color: mode === "signin" ? "#ffffff" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setReveal(false); setSubmitError(""); setMode("signup"); }}
              style={{
                flex: 1,
                padding: "14px 16px",
                background: mode === "signup" ? "rgba(255,255,255,0.04)" : "transparent",
                border: "none",
                borderBottom: mode === "signup" ? "2px solid #F5C642" : "2px solid transparent",
                color: mode === "signup" ? "#ffffff" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Create Account
            </button>
          </div>

          <div
            style={{ padding: 40 }}
            key={mode}
          >
            <div
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
                  {mode === "signin" ? "Sign in" : "Join the Studio"}
                </h1>
              </div>

              {resetSent && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#F5C642",
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  Check your email for a reset link.
                </p>
              )}

              {/* Google OAuth above form for signup mode */}
              {mode === "signup" && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#1B263B", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", padding: "11px 14px", cursor: "pointer", marginBottom: 0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Sign up with Google
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    <span style={{ fontSize: 14, color: "rgba(232,232,230,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  </div>
                </>
              )}

              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mode === "signup" && (
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.6)",
                        letterSpacing: "2px",
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
                {mode === "signup" && (
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.6)",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      ACCESS CODE
                    </label>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="Enter your access code"
                      value={accessCode}
                      onChange={e => setAccessCode(e.target.value)}
                      required
                    />
                    <p style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 4,
                      marginBottom: 0,
                      lineHeight: 1.5,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}>
                      Access codes are provided during onboarding.{" "}
                      <a
                        href="mailto:mark@mixedgrill.studio?subject=EVERYWHERE%20Studio%20Access%20Code%20Request"
                        style={{ color: "#F5C642", textDecoration: "none" }}
                      >
                        Request one here.
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "2px",
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
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      className="auth-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: 10,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.5)",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {mode === "signup" && (
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.6)",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Confirm Password
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        className="auth-input"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        style={{
                          position: "absolute",
                          right: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.5)",
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
                {mode === "signin" && (
                  <div style={{ marginTop: -4 }}>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#F5C642",
                        padding: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

              <button
                type="submit"
                style={{
                  marginTop: 10,
                  width: "100%",
                  background: "#F5C642",
                  color: "#0D1B2A",
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

            {mode === "signup" && (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  textAlign: "center",
                  marginTop: 20,
                  lineHeight: 1.6,
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                <Logo size={13} variant="dark" /> is in private Alpha.
                <br />
                Contact mark@mixedgrill.studio for access.
              </p>
            )}

            {/* Google OAuth + Divider (rendered below form for signin, above form for signup via separate block) */}
            {mode === "signin" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ fontSize: 14, color: "rgba(232,232,230,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#1B263B", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", padding: "11px 14px", cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
              </>
            )}

            {/* Toggle - only show on Create Account (Sign In tab is visible at top) */}
            {mode === "signup" && (
              <p
                style={{
                  textAlign: "center",
                  marginTop: 24,
                  fontSize: 13,
                  color: "rgba(232,232,230,0.65)",
                }}
              >
                Already have a studio?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#F5C642",
                    textDecoration: "none",
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
