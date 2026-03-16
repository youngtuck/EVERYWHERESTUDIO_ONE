import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import Logo from "../Logo";
import { PenLine, Eye, Bookmark, BookOpen, FolderOpen, Settings, Plus, ChevronDown, LogOut, Package, Archive, Loader2 } from "lucide-react";

// ── Nav structure: Watch > Work > Wrap (primary), then utility at bottom ──
const PRIMARY_NAV = [
  { path: "/studio/watch",   label: "Watch",       icon: Eye,        tooltip: "Intelligence monitoring. What's happening in your category.", primary: true },
  { path: "/studio/lot",     label: "The Lot",     icon: Bookmark,   tooltip: "Parked ideas. Right idea, wrong time.", sub: true },
  { path: "/studio/work",    label: "Work",        icon: PenLine,    tooltip: "Start a Watson session to produce content.", primary: true },
  { path: "/studio/dashboard", label: "In Progress", icon: Loader2,  tooltip: "Content you've started but haven't finished.", sub: true },
  { path: "/studio/wrap",    label: "Wrap",        icon: Package,    tooltip: "Final polish and delivery.", primary: true },
  { path: "/studio/outputs", label: "The Vault",   icon: Archive,    tooltip: "Published archive. Everything you've shipped.", sub: true },
];

const UTILITY_NAV = [
  { path: "/studio/resources",      label: "Resources", icon: BookOpen,   tooltip: "Voice DNA, Brand DNA, Method DNA, and references." },
  { path: "/studio/projects",       label: "Projects",  icon: FolderOpen, tooltip: "Organize work by client or topic." },
  { path: "/studio/settings/voice", label: "Settings",  icon: Settings,   tooltip: "Account and preferences." },
];

function titleCase(str: string) {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMobileClose?: () => void;
}

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboardingComplete(null);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setOnboardingComplete(data?.onboarding_complete ?? false));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings/voice") return loc.pathname === p || loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  return (
    <aside style={{
      width: collapsed ? 68 : "var(--studio-sidebar-width)",
      flexShrink: 0,
      height: "100vh",
      background: "#fff",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "sticky",
      top: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      <div
        style={{
          padding: "14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
        }}
      >
        <button
          onClick={() => nav("/studio")}
          title="Go to studio home"
          style={{
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: 0,
          }}
          aria-label="Go to studio"
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "linear-gradient(135deg, #4A90D9 0%, #6b4dd4 100%)",
            flexShrink: 0,
            boxShadow: "0 1px 6px rgba(74,144,217,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
            }} />
          </div>
          {!collapsed && (
            <Logo size={18} variant="light" />
          )}
        </button>
        {!collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--fg-3)",
              transition: "all 0.15s ease",
            }}
            aria-label="Collapse sidebar"
          >
            ◀
          </button>
        )}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            title="Close menu"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--fg-2)",
              fontFamily: "var(--font)",
              transition: "all 0.15s ease",
            }}
            aria-label="Close menu"
          >
            Close
          </button>
        )}
        {collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            style={{
              position: "absolute",
              right: 8,
              top: 12,
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "2px 4px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--fg-3)",
              transition: "all 0.15s ease",
            }}
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        )}
      </div>

      {/* ── Project selector ────────────────────── */}
      <div style={{ padding: "14px 14px 0" }}>
        <button title="Switch project" style={{
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
          transition: "all 0.15s ease",
        }}>
          {!collapsed && (
            <>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>My Studio</div>
              </div>
              <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            </>
          )}
          {collapsed && (
            <div style={{ width: "100%", textAlign: "center", fontSize: 14, fontWeight: 500, color: "var(--fg-3)" }}>
              My
            </div>
          )}
        </button>
      </div>

      {/* ── New Session ──────────────────────────── */}
      <div style={{ padding: "12px 14px 10px" }}>
        <button
          onClick={() => nav("/studio/work")}
          title="Start a new Watson session"
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
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Session
        </button>
      </div>

      {/* Onboarding progress */}
      {onboardingComplete === false && !collapsed && (
        <div style={{ padding: "0 14px 12px" }}>
          <button
            onClick={() => nav("/onboarding")}
            title="Complete your studio setup"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(200,150,26,0.1)",
              border: "1px solid rgba(200,150,26,0.25)",
              borderRadius: "var(--studio-radius)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--gold-dark)",
              cursor: "pointer",
              fontFamily: "var(--font)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            Finish setup
            <span style={{ fontSize: 13 }}>→</span>
          </button>
        </div>
      )}

      {/* ── Primary nav: Watch, Work, Wrap ─────── */}
      <nav style={{ flex: 1, padding: "6px 10px", overflowY: "auto" }} aria-label="Studio navigation">
        <div style={{ paddingBottom: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {PRIMARY_NAV.map(({ path, label, icon: Icon, tooltip, primary, sub }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                title={tooltip}
                className={`nav-item ${active ? "active" : ""}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: primary ? "12px 16px" : "8px 16px 8px 36px",
                  border: "none",
                  borderRadius: 8,
                  borderLeft: active ? "3px solid var(--gold-dark)" : "3px solid transparent",
                  background: active ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: primary ? 15 : 13,
                  fontWeight: primary ? 600 : 400,
                  textAlign: "left",
                  opacity: active ? 1 : 0.7,
                  transition: "background 0.15s ease, color 0.15s ease, opacity 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.opacity = "0.7";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      color: active ? "var(--fg)" : "var(--fg-3)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={primary ? 18 : 16} strokeWidth={2} />
                  </span>
                  {!collapsed && (
                    <span style={{ color: active ? "var(--fg)" : "var(--fg-3)" }}>{label}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Utility divider + items ──────────── */}
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
          {UTILITY_NAV.map(({ path, label, icon: Icon, tooltip }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                title={tooltip}
                className={`nav-item ${active ? "active" : ""}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 8,
                  borderLeft: active ? "3px solid var(--gold-dark)" : "3px solid transparent",
                  background: active ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: 13,
                  fontWeight: 400,
                  textAlign: "left",
                  color: "rgba(0,0,0,0.45)",
                  transition: "background 0.15s ease, color 0.15s ease, opacity 0.15s ease",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                    e.currentTarget.style.color = "rgba(0,0,0,0.65)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(0,0,0,0.45)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  {!collapsed && <span>{label}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <div style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 4px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--surface-elevated)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 600, color: "var(--fg)",
          }}>
            {(user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {!collapsed && (user?.user_metadata?.full_name
                ? titleCase(user.user_metadata.full_name as string)
                : user?.email
                  ? titleCase(user.email.split("@")[0])
                  : "Signed in")}
            </div>
            {!collapsed && <div style={{ fontSize: 13, color: "var(--fg-3)" }}>{user?.email || ""}</div>}
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 6,
              color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; }}
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
