import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

// ── Nav items ───────────────────────────────────────────────────────────────
const NAV = [
  { path: "/studio/dashboard", abbr: "DS", label: "Dashboard" },
  { path: "/studio/work",      abbr: "WK", label: "Work" },
  { path: "/studio/watch",     abbr: "WT", label: "Watch",    badge: "11" },
  { path: "/studio/outputs",   abbr: "OP", label: "Outputs" },
  { path: "/studio/projects",  abbr: "PJ", label: "Projects" },
];
const NAV_BOTTOM = [
  { path: "/studio/resources", abbr: "RS", label: "Resources" },
  { path: "/studio/settings",  abbr: "ST", label: "Settings" },
];

export default function StudioSidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (p: string) =>
    p === "/studio/work"
      ? loc.pathname === p || loc.pathname.startsWith("/studio/work/")
      : loc.pathname === p;

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      background: "var(--sidebar)",
      borderRight: "1px solid var(--line)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "sticky",
      top: 0,
    }}>

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 18px 16px",
        borderBottom: "1px solid var(--line)",
      }}>
        <button
          onClick={() => nav("/")}
          style={{
            background: "none", border: "none",
            display: "flex", alignItems: "center", gap: 10,
            width: "100%",
          }}
        >
          {/* Orb indicator */}
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "linear-gradient(135deg, #4a90f5 0%, #6b4dd4 100%)",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(74,144,245,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "rgba(255,255,255,0.90)",
            }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em",
              color: "var(--fg)", lineHeight: 1.1,
            }}>
              <span>EVERY</span>
              <span style={{ color: "var(--fg-3)" }}>WHERE</span>
            </div>
            <div style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.16em",
              color: "var(--fg-3)", textTransform: "uppercase",
            }}>Studio™</div>
          </div>
        </button>
      </div>

      {/* ── Project switcher ─────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 0" }}>
        <button style={{
          width: "100%",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 8,
          padding: "9px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.04em", marginBottom: 2 }}>Project</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>Thought Leadership</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5.5L7 9L11 5.5" stroke="var(--fg-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── New session ──────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 8px" }}>
        <button
          onClick={() => nav("/studio/work")}
          style={{
            width: "100%",
            background: "var(--fg)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 8,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.01em",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Session
        </button>
      </div>

      {/* ── Main nav ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
        <div style={{ paddingBottom: 4 }}>
          <div className="nav-section-label" style={{ paddingTop: 10 }}>Studio</div>
          {NAV.map(({ path, abbr, label, badge }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`nav-item ${active ? "active" : ""}`}
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 26, height: 22, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.06em", borderRadius: 5,
                    background: active ? "var(--bg)" : "var(--bg-3)",
                    color: active ? "var(--fg)" : "var(--fg-3)",
                    flexShrink: 0,
                    border: active ? "1px solid var(--line-2)" : "1px solid transparent",
                    fontFamily: "var(--font)",
                    transition: "background 0.15s, color 0.15s",
                  }}>{abbr}</span>
                  <span>{label}</span>
                </div>
                {badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    background: "rgba(200,150,26,0.12)",
                    color: "var(--gold)",
                    border: "1px solid rgba(200,150,26,0.22)",
                    borderRadius: 100, padding: "1px 7px",
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          <div className="nav-section-label">More</div>
          {NAV_BOTTOM.map(({ path, abbr, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <span style={{
                  width: 26, height: 22, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.06em", borderRadius: 5,
                  background: active ? "var(--bg)" : "var(--bg-3)",
                  color: active ? "var(--fg)" : "var(--fg-3)",
                  flexShrink: 0,
                  border: active ? "1px solid var(--line-2)" : "1px solid transparent",
                  fontFamily: "var(--font)",
                }}>{abbr}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom: theme + user ─────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--line)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-2)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "8px 12px", width: "100%",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {theme === "light" ? "Light Mode" : "Dark Mode"}
          </span>
          <div style={{
            width: 30, height: 16, borderRadius: 100,
            background: theme === "dark" ? "var(--fg)" : "var(--bg-3)",
            border: "1px solid var(--line-2)",
            position: "relative", transition: "background 0.2s",
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: theme === "dark" ? 14 : 2,
              width: 10, height: 10, borderRadius: "50%",
              background: theme === "dark" ? "var(--bg)" : "var(--fg-3)",
              transition: "left 0.2s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </button>

        {/* User pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "6px 4px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #C8961A, #F0B429)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#0A0A0A",
          }}>M</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mark Sylvester</div>
            <div style={{ fontSize: 10, color: "var(--fg-3)" }}>Founding Member</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
