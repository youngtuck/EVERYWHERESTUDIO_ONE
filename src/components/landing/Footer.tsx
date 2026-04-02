import Logo from "../Logo";
import { useNavigate } from "react-router-dom";

const CTA_MAILTO = "mailto:mark@coastalintelligence.ai?subject=EVERYWHERE%20Studio%3A%20Let's%20Talk";
const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  color: "#64748B",
  fontFamily: "'Afacad Flux', sans-serif",
  transition: "color 0.15s",
  letterSpacing: "-0.01em",
  padding: 0,
};

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: "#F7F9FC", borderTop: "1px solid #E2E8F0", padding: "28px 40px 0" }}>
      {/* Top row */}
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingBottom: 20 }}>
        <Logo size="sm" variant="light" />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[["Studio", "/studio/dashboard"], ["Sign in", "/auth"]].map(([l, p]) => (
            <button
              key={l}
              onClick={() => navigate(p!)}
              style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = "#111111"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; }}
            >
              {l}
            </button>
          ))}
          <a
            href="mailto:mark@coastalintelligence.ai"
            style={{ ...linkStyle, textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#111111"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; }}
          >
            mark@coastalintelligence.ai
          </a>
          <a
            href={CTA_MAILTO}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#FFFFFF",
              background: "#4A90D9",
              border: "none",
              borderRadius: 6,
              padding: "8px 20px",
              fontFamily: "'Afacad Flux', sans-serif",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Let's Talk
          </a>
        </div>
      </div>
      {/* Bottom row */}
      <div style={{ maxWidth: 1120, margin: "0 auto", borderTop: "1px solid #E2E8F0", padding: "16px 0" }}>
        <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'Afacad Flux', sans-serif", margin: 0 }}>
          2026 Mixed Grill, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
