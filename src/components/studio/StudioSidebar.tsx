import { useNavigate, useLocation } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO SIDEBAR
// Clean, icon+label nav. No clutter.
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  section?: string;
}

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    section: "Studio",
    path: "/studio/dashboard",
    label: "Home",
    icon: <Icon d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" />,
  },
  {
    path: "/studio/work/new",
    label: "Work",
    icon: <Icon d="M8 2V8M8 8L5 5M8 8L11 5M3 12H13M3 14H13" />,
  },
  {
    path: "/studio/watch",
    label: "Sentinel",
    icon: <Icon d="M8 2C4.5 2 2 4.5 2 8C2 11.5 4.5 14 8 14C11.5 14 14 11.5 14 8C14 4.5 11.5 2 8 2ZM8 5V9M8 11V11.5" />,
    badge: "11",
  },
  {
    path: "/studio/outputs",
    label: "Outputs",
    icon: <Icon d="M4 2H10L14 6V14H4V2ZM10 2V6H14M7 9H11M7 11H9" />,
  },
  {
    section: "Studio",
    path: "/studio/projects",
    label: "Projects",
    icon: <Icon d="M2 4H8L10 2H14V12H2V4ZM2 8H14" />,
  },
  {
    path: "/studio/resources",
    label: "Resources",
    icon: <Icon d="M3 3H13V5H3V3ZM3 7H9V9H3V7ZM3 11H11V13H3V11Z" />,
  },
  {
    path: "/studio/settings",
    label: "Settings",
    icon: <Icon d="M8 5.5A2.5 2.5 0 1 0 8 10.5A2.5 2.5 0 0 0 8 5.5ZM8 2V3.5M8 12.5V14M3.5 3.5L4.6 4.6M11.4 11.4L12.5 12.5M2 8H3.5M12.5 8H14M3.5 12.5L4.6 11.4M11.4 4.6L12.5 3.5" />,
  },
];

export default function StudioSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/studio/work/new") return location.pathname.startsWith("/studio/work");
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside style={{
      width: 200, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      background: "var(--sidebar)", borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "var(--font)",
    }}>
      {/* Logo */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: "1px solid var(--line)",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, padding: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #2535c8 0%, #4A90D9 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>EW</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)", letterSpacing: "-.02em", lineHeight: 1 }}>EVERYWHERE</div>
            <div style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 2 }}>Studio</div>
          </div>
        </button>
      </div>

      {/* Project selector */}
      <div style={{ padding: "12px 10px", borderBottom: "1px solid var(--line)" }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 8, padding: "8px 10px", cursor: "pointer",
          fontFamily: "var(--font)", transition: "border-color .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line-2)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
        >
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>M</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mark's Studio</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: .4, flexShrink: 0 }}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item.path);
          return (
            <button key={i} onClick={() => navigate(item.path)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              background: active ? "var(--bg-3)" : "transparent",
              border: "none", borderRadius: 7, padding: "8px 10px",
              cursor: "pointer", fontFamily: "var(--font)",
              color: active ? "var(--fg)" : "var(--fg-3)",
              transition: "all .12s", marginBottom: 1,
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = active ? "var(--fg)" : "var(--fg-3)"; }}
              title={item.label}
            >
              <span style={{ width: 16, flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700, background: "#4A90D9",
                  color: "#fff", padding: "1px 5px", borderRadius: 10, flexShrink: 0,
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user pill */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid var(--line)" }}>
        <button onClick={() => navigate("/studio/settings")} style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%",
          background: "transparent", border: "none", borderRadius: 8, padding: "8px 10px",
          cursor: "pointer", fontFamily: "var(--font)", transition: "background .12s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%", background: "#F0B429",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>M</div>
          <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mark Sylvester</p>
            <p style={{ fontSize: 10, color: "var(--fg-3)", lineHeight: 1.2 }}>Founding Member</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
