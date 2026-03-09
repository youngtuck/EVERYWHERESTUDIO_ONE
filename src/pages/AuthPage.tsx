import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

const AuthPage = () => {
  const [mode, setMode] = useState<"signin"|"signup">("signin");
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (mode === "signup" && password !== confirmPassword) {
      setSubmitError("Passwords don't match.");
      return;
    }
    // Stubbed — wires to Supabase in plumbing phase
    navigate("/studio/dashboard");
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-primary)", display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 28px", borderBottom:"1px solid var(--border)" }}>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
          <Logo size="sm" />
        </button>
        <ThemeToggle />
      </div>

      {/* Centered card */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          {/* Dot grid decoration */}
          <div style={{ position:"absolute", top:80, left:0, right:0, bottom:0, backgroundImage:"radial-gradient(circle, var(--border) 1px, transparent 1px)", backgroundSize:"24px 24px", opacity:0.4, pointerEvents:"none", zIndex:0 }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div
              key={mode}
              style={{
                opacity: reveal ? 1 : 0,
                transform: reveal ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <p className="eyebrow" style={{ marginBottom:12 }}>
                {mode === "signin" ? "Welcome Back" : "Get Started"}
              </p>
              <h1 style={{ fontSize:"clamp(24px,3vw,30px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px", fontFamily:"'Afacad Flux',sans-serif" }}>
                {mode === "signin" ? "Sign in to your studio" : "Create your studio"}
              </h1>
            </div>

            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {mode === "signup" && (
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase", display:"block", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif" }}>Full Name</label>
                  <input className="input-field" type="text" placeholder="Mark Sylvester" value={name} onChange={e=>setName(e.target.value)} required />
                </div>
              )}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase", display:"block", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif" }}>Email</label>
                <input className="input-field" type="email" placeholder="you@yourcompany.com" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase", display:"block", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif" }}>Password</label>
                <input className="input-field" type="password" placeholder="••••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              {mode === "signup" && (
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"1.5px", textTransform:"uppercase", display:"block", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif" }}>Confirm Password</label>
                  <input className="input-field" type="password" placeholder="••••••••••" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop:8, width:"100%" }}>
                {mode === "signin" ? "Sign In" : "Create Studio"}
              </button>
              {submitError && (
                <p style={{ fontSize:12, color:"var(--error, #e85d75)", marginTop:4, marginBottom:0 }}>{submitError}</p>
              )}
            </form>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>or</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>

            {/* Google OAuth — stubbed */}
            <button type="button" className="btn-ghost" style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }} title="Google OAuth — wires in plumbing phase">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle */}
            <p style={{ textAlign:"center", marginTop:24, fontSize:13, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>
              {mode === "signin" ? "Don't have a studio? " : "Already have a studio? "}
              <button type="button" onClick={switchMode}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--text-primary)", textDecoration:"underline", fontFamily:"'Afacad Flux',sans-serif" }}>
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
