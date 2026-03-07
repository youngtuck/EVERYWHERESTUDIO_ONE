import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)", WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)", pointerEvents: "none" }} />

      <button onClick={() => navigate("/")} style={{ position: "absolute", top: 24, left: 28, background: "none", border: "none", cursor: "pointer" }}>
        <Logo size="sm" />
      </button>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-1px", marginBottom: 6, fontFamily: "'Afacad Flux', sans-serif" }}>
          {mode === "login" ? "Welcome back." : "Start here."}
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 36, fontFamily: "'Afacad Flux', sans-serif" }}>
          {mode === "login" ? "Sign in to your Studio." : "Extract your Voice DNA — free."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "14px 16px", fontSize: 14, color: "#ffffff", fontFamily: "'Afacad Flux', sans-serif", outline: "none" }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "14px 16px", fontSize: 14, color: "#ffffff", fontFamily: "'Afacad Flux', sans-serif", outline: "none" }} />
        </div>

        <button style={{ width: "100%", background: "#ffffff", color: "#0A0A0A", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "15px", borderRadius: 5, fontFamily: "'Afacad Flux', sans-serif", transition: "opacity 0.2s ease" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >{mode === "login" ? "Sign In" : "Create Account"}</button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'Afacad Flux', sans-serif" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Afacad Flux', sans-serif", textDecoration: "underline" }}>
            {mode === "login" ? "Start free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
