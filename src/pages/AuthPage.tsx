import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

type Mode = "login" | "signup";

const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const inputStyle = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    background: "#f9fafb",
    padding: "11px 16px",
    fontSize: 14,
    color: "#0D1B2A",
    fontFamily: "'Afacad Flux', sans-serif",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "#9ca3af",
    display: "block" as const,
    marginBottom: 8,
    fontFamily: "'Afacad Flux', sans-serif",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Simulate auth — wire to Supabase in production
    setTimeout(() => {
      setLoading(false);
      // navigate("/studio/dashboard");
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#0D1B2A",
              border: "none",
              cursor: "pointer",
              padding: "14px 24px",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            <Logo size="md" />
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "40px 36px",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0D1B2A",
              letterSpacing: "-0.5px",
              marginBottom: 6,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            {mode === "login" ? "Welcome back." : "Get started."}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
              marginBottom: 32,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            {mode === "login"
              ? "Sign in to your studio."
              : "Create your EVERYWHERE Studio account."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mark Sylvester"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D1B2A"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0D1B2A"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0D1B2A"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#F5C642",
                color: "#0D1B2A",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "14px",
                borderRadius: 6,
                fontFamily: "'Afacad Flux', sans-serif",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s ease",
                marginTop: 4,
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 24,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            {mode === "login" ? "No account? " : "Already have one? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#0D1B2A",
                fontWeight: 700,
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 13,
                textDecoration: "underline",
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#9ca3af",
              fontFamily: "'Afacad Flux', sans-serif",
              letterSpacing: "0.5px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
