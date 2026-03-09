import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { LayoutDashboard, PenLine, Eye, FileText, FolderOpen, Folder, Settings, Plus, ChevronDown } from "lucide-react";

// ── Nav items (with icons, reference style) ─────────────────────────────────
const NAV = [
  { path: "/studio/dashboard", label: "My Studio", icon: LayoutDashboard },
  { path: "/studio/work",      label: "Work",      icon: PenLine },
  { path: "/studio/watch",     label: "Watch",     icon: Eye,    badge: "11" },
  { path: "/studio/outputs",   label: "Outputs",   icon: FileText },
  { path: "/studio/projects",  label: "Projects",  icon: FolderOpen },
];
const NAV_BOTTOM = [
  { path: "/studio/resources", label: "Resources", icon: Folder },
  { path: "/studio/settings/voice",   label: "Settings",  icon: Settings },
];

export default function StudioSidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (p: string) =>
    p === "/studio/work"
      ? loc.pathname === p || loc.pathname.startsWith("/studio/work/")
      : p === "/studio/settings/voice"
        ? loc.pathname === p || loc.pathname.startsWith("/studio/settings")
        : loc.pathname === p;

  return (
    <aside style={{
      width: "var(--studio-sidebar-width)",
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
        padding: "20px 16px 18px",
        borderBottom: "1px solid var(--line)",
      }}>
        <button
          onClick={() => nav("/")}
          style={{
            background: "none", border: "none",
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", cursor: "pointer",
          }}
          aria-label="Back to home"
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "linear-gradient(135deg, #4a90f5 0%, #6b4dd4 100%)",
            flexShrink: 0,
            boxShadow: "0 1px 6px rgba(74,144,245,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
            }} />
          </div>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, letterSpacing: "-0.02em",
              color: "var(--fg)", lineHeight: 1.2,
            }}>
              <span>EVERY</span>
              <span style={{ color: "var(--fg-3)" }}>WHERE</span>
            </div>
            <div style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.14em",
              color: "var(--fg-3)", textTransform: "uppercase",
            }}>Studio</div>
          </div>
        </button>
      </div>

      {/* ── Project (reference: "My Studio" with dropdown) ────────────────── */}
      <div style={{ padding: "14px 14px 0" }}>
        <button style={{
          width: "100%",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--studio-radius)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "var(--font)",
        }}>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>My Studio</div>
          </div>
          <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
        </button>
      </div>

      {/* ── New Session ──────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 10px" }}>
        <button
          onClick={() => nav("/studio/work")}
          style={{
            width: "100%",
            background: "var(--fg)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "var(--studio-radius)",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "-0.02em",
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Session
        </button>
      </div>

      {/* ── Main nav (with icons) ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "6px 10px", overflowY: "auto" }} aria-label="Studio navigation">
        <div style={{ paddingBottom: 4 }}>
          {NAV.map(({ path, label, icon: Icon, badge }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`nav-item ${active ? "active" : ""}`}
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 24, height: 22, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 6,
                    background: active ? "var(--bg)" : "transparent",
                    color: active ? "var(--fg)" : "var(--fg-3)",
                    flexShrink: 0,
                    border: active ? "1px solid var(--line-2)" : "1px solid var(--line)",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}>
                    <Icon size={12} strokeWidth={2} />
                  </span>
                  <span>{label}</span>
                </div>
                {badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    background: "rgba(200,150,26,0.12)",
                    color: "var(--gold)",
                    border: "1px solid rgba(200,150,26,0.2)",
                    borderRadius: 100, padding: "2px 6px",
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conversations (reference: CONVERSATIONS + New conversation) ───────── */}
        <div style={{ paddingTop: 8, paddingBottom: 4 }}>
          <div className="nav-section-label">Conversations</div>
          <button
            onClick={() => nav("/studio/work")}
            className="nav-item"
            style={{ gap: 10 }}
          >
            <Plus size={12} strokeWidth={2} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            <span>New conversation</span>
          </button>
        </div>

        <div>
          <div className="nav-section-label">More</div>
          {NAV_BOTTOM.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <span style={{
                  width: 24, height: 22, display: "flex", alignItems: "center",
                  justifyContent: "center", borderRadius: 6,
                  background: active ? "var(--bg)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-3)",
                  flexShrink: 0,
                  border: active ? "1px solid var(--line-2)" : "1px solid var(--line)",
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                }}>
                  <Icon size={12} strokeWidth={2} />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom: theme + user ─────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--line)",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <button
          onClick={toggleTheme}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-2)", border: "1px solid var(--line)",
            borderRadius: "var(--studio-radius)", padding: "9px 12px", width: "100%",
            cursor: "pointer", fontFamily: "var(--font)",
          }}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {theme === "light" ? "Light" : "Dark"}
          </span>
          <div style={{
            width: 28, height: 16, borderRadius: 100,
            background: theme === "dark" ? "var(--fg)" : "var(--bg-3)",
            border: "1px solid var(--line-2)",
            position: "relative", transition: "background 0.2s",
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: theme === "dark" ? 12 : 2,
              width: 12, height: 12, borderRadius: "50%",
              background: theme === "dark" ? "var(--bg)" : "var(--fg-3)",
              transition: "left 0.2s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 4px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #C8961A, #F0B429)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#0A0A0A",
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
