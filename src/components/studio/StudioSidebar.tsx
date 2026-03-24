import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import Logo from "../Logo";
import { PenLine, Eye, Bookmark, BookOpen, FolderOpen, Settings, LogOut, Package, Archive, Loader2, Shield, Home } from "lucide-react";

// ── Nav structure: Home > Watch > Work > Wrap (primary), then utility at bottom ──
const PRIMARY_NAV = [
  { path: "/studio/dashboard", label: "Home",  icon: Home, tooltip: "Your command center. Overview of all activity.", primary: true },
  { path: "/studio/watch",   label: "Watch",       icon: Eye,        tooltip: "Intelligence monitoring. What's happening in your category.", primary: true },
  { path: "/studio/lot",     label: "The Lot",     icon: Bookmark,   tooltip: "Parked ideas. Right idea, wrong time.", sub: true },
  { path: "/studio/work",    label: "Work",        icon: PenLine,    tooltip: "Start a Watson session to produce content.", primary: true },
  { path: "/studio/outputs?view=in_progress", label: "In Progress", icon: Loader2,  tooltip: "Content you've started but haven't finished.", sub: true },
  { path: "/studio/wrap",    label: "Wrap",        icon: Package,    tooltip: "Final polish and delivery.", primary: true },
  { path: "/studio/outputs", label: "The Vault",   icon: Archive,    tooltip: "Published archive. Everything you've shipped.", sub: true },
];

const UTILITY_NAV = [
  { path: "/studio/resources",      label: "Resources", icon: BookOpen,   tooltip: "Voice DNA, Brand DNA, Method DNA, and references." },
  { path: "/studio/projects",       label: "Projects",  icon: FolderOpen, tooltip: "Organize work by client or topic." },
  { path: "/studio/settings",       label: "Settings",  icon: Settings,   tooltip: "Account and preferences." },
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
  const { user, signOut, displayName } = useAuth();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setOnboardingComplete(null);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_complete, is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setOnboardingComplete(data?.onboarding_complete ?? false);
        setIsAdmin(!!data?.is_admin);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings") return loc.pathname === p || loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    // In Progress: active when on outputs page with view=in_progress
    if (p.includes("?view=in_progress")) return loc.pathname === "/studio/outputs" && loc.search.includes("view=in_progress");
    // The Vault: active when on outputs page without in_progress filter
    if (p === "/studio/outputs") return loc.pathname === "/studio/outputs" && !loc.search.includes("view=in_progress");
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  return (
    <aside style={{
      width: collapsed ? 60 : 240,
      flexShrink: 0,
      height: "100vh",
      background: "var(--sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "sticky",
      top: 0,
      fontFamily: "'Afacad Flux', sans-serif",
      transition: "width 0.2s ease",
    }}>

      <div
        style={{
          padding: collapsed ? "14px 8px" : "14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
        }}
      >
        <button
          onClick={() => nav("/studio/dashboard")}
          title="Go to dashboard"
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
            background: "linear-gradient(135deg, #4A90D9 0%, #1B263B 100%)",
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
            <Logo size={16} />
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
      </div>
      {collapsed && onToggleCollapsed && (
        <div style={{ padding: "0 8px 8px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 6,
              width: 40,
              height: 28,
              cursor: "pointer",
              fontSize: 12,
              color: "var(--fg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        </div>
      )}

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
      <nav style={{ flex: 1, padding: collapsed ? "6px 4px" : "6px 10px", overflowY: "auto" }} aria-label="Studio navigation">
        <div style={{ paddingBottom: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {(onMobileClose
            ? PRIMARY_NAV.filter(item => item.sub) // Mobile: only sub-items (The Lot, In Progress, The Vault)
            : PRIMARY_NAV
          ).map(({ path, label, icon: Icon, tooltip, primary, sub }) => {
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
                  justifyContent: collapsed ? "center" : "space-between",
                  padding: collapsed ? "10px 0" : primary ? "12px 16px" : "8px 16px 8px 36px",
                  minHeight: collapsed ? 40 : undefined,
                  border: "none",
                  borderRadius: 8,
                  borderLeft: collapsed ? "none" : active ? "3px solid var(--gold-dark)" : "3px solid transparent",
                  background: active ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: primary ? 16 : 14,
                  fontWeight: primary ? 600 : 400,
                  textAlign: collapsed ? "center" : "left",
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
          {(onMobileClose
            ? UTILITY_NAV.filter(item => item.path !== "/studio/settings") // Settings is in bottom nav
            : UTILITY_NAV
          ).map(({ path, label, icon: Icon, tooltip }) => {
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
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: "left",
                  color: active ? "var(--fg)" : "var(--fg-2)",
                  transition: "background 0.15s ease, color 0.15s ease, opacity 0.15s ease",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                    e.currentTarget.style.color = "var(--fg)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--fg-2)";
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
          {isAdmin && (
            <button
              onClick={() => nav("/studio/admin")}
              title="Admin panel"
              className={`nav-item ${isActive("/studio/admin") ? "active" : ""}`}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                padding: "8px 16px", border: "none", borderRadius: 8,
                borderLeft: isActive("/studio/admin") ? "3px solid var(--gold-dark)" : "3px solid transparent",
                background: isActive("/studio/admin") ? "rgba(0,0,0,0.04)" : "transparent",
                cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, fontWeight: 400,
                textAlign: "left", color: "var(--gold)",
                transition: "background 0.15s ease, color 0.15s ease",
                marginTop: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={16} strokeWidth={2} />
                </span>
                {!collapsed && <span>Admin</span>}
              </div>
            </button>
          )}
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
            {(displayName || user?.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {!collapsed && (displayName || "Signed in")}
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
