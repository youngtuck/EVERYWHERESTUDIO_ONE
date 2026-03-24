import Logo from "../Logo";
import { useNavigate } from "react-router-dom";

const CTA_MAILTO = "mailto:mark@mixedgrill.studio?subject=EVERYWHERE%20Studio%3A%20Let's%20Talk";
const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  color: "rgba(255,255,255,0.5)",
  fontFamily: "'Afacad Flux', sans-serif",
  transition: "color 0.15s",
  letterSpacing: "-0.01em",
  padding: 0,
};

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: "#0D1B2A", borderTop: "3px solid #F5C642", padding: "28px 40px 0" }}>
      {/* Top row */}
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingBottom: 20 }}>
        <Logo size="sm" variant="dark" />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[["Studio", "/studio/dashboard"], ["Sign in", "/auth"]].map(([l, p]) => (
            <button
              key={l}
              onClick={() => navigate(p!)}
              style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              {l}
            </button>
          ))}
          <a
            href="mailto:mark@mixedgrill.studio"
            style={{ ...linkStyle, textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            mark@mixedgrill.studio
          </a>
          <a
            href={CTA_MAILTO}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--gold)",
              border: "1px solid rgba(245,198,66,0.3)",
              borderRadius: 6,
              padding: "6px 16px",
              fontFamily: "'Afacad Flux', sans-serif",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,198,66,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,198,66,0.3)"; }}
          >
            Let's Talk
          </a>
        </div>
      </div>
      {/* Bottom row */}
      <div style={{ maxWidth: 1120, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 0" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Afacad Flux', sans-serif", margin: 0 }}>
          {/* v6.5 Alpha */}
          2026 Mixed Grill, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
