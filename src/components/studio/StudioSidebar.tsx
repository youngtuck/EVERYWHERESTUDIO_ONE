import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import Tooltip from "../Tooltip";
import { LayoutDashboard, PenLine, Eye, FileText, FolderOpen, Folder, Settings, Plus, ChevronDown, Bookmark, LogOut, Hammer, Package, BookOpen, Wrench, Archive } from "lucide-react";

// ── Nav items (exact order: My Studio → Work → Watch → The Lot → Resources → Projects → The Workbench → Wrap → The Vault → Settings) ──
const NAV = [
  { path: "/studio/dashboard",       label: "My Studio",     icon: LayoutDashboard, tooltip: "Your command center. Overview of all activity." },
  { path: "/studio/work",            label: "Work",         icon: PenLine,           tooltip: "Start a Watson session to produce content." },
  { path: "/studio/watch",           label: "Watch",        icon: Eye,               badge: "11", tooltip: "Sentinel intelligence. What's happening in your category." },
  { path: "/studio/lot",             label: "The Lot",      icon: Bookmark,          tooltip: "Parked ideas. Right idea, wrong time." },
  { path: "/studio/resources",       label: "Resources",    icon: BookOpen,          tooltip: "Voice DNA, Brand DNA, Method DNA, and references." },
  { path: "/studio/projects",        label: "Projects",     icon: FolderOpen,        tooltip: "Organize work by client, topic, or project." },
  { path: "/studio/workbench",       label: "The Workbench", icon: Wrench,           tooltip: "In-progress work. Started but not shipped." },
  { path: "/studio/wrap",            label: "Wrap",         icon: Package,           tooltip: "Final polish before publishing." },
  { path: "/studio/outputs",         label: "The Vault",    icon: Archive,          tooltip: "Everything you've published. Permanent archive." },
  { path: "/studio/settings/voice",  label: "Settings",     icon: Settings,           tooltip: "Account, preferences, and configuration." },
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
    if (p === "/studio/workbench") return loc.pathname === p || loc.pathname.startsWith("/studio/workbench/");
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

      <div style={{
        padding: "14px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 8,
      }}>
        <button
          onClick={() => nav("/")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: 0,
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
          {!collapsed && (
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
          )}
        </button>
        {!collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 10,
              color: "var(--fg-3)",
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
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--fg-2)",
              fontFamily: "var(--font)",
            }}
            aria-label="Close menu"
          >
            Close
          </button>
        )}
        {collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              position: "absolute",
              right: 8,
              top: 12,
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "2px 4px",
              cursor: "pointer",
              fontSize: 10,
              color: "var(--fg-3)",
            }}
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        )}
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
          {!collapsed && (
            <>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>My Studio</div>
              </div>
              <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            </>
          )}
          {collapsed && (
            <div style={{ width: "100%", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--fg-3)" }}>
              My
            </div>
          )}
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

      {/* Onboarding progress: show when not complete */}
      {onboardingComplete === false && !collapsed && (
        <div style={{ padding: "0 14px 12px" }}>
          <button
            onClick={() => nav("/onboarding")}
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
            }}
          >
            Finish setup
            <span style={{ fontSize: 10 }}>→</span>
          </button>
        </div>
      )}

      {/* ── Main nav ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "6px 10px", overflowY: "auto" }} aria-label="Studio navigation">
        <div style={{ paddingBottom: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ path, label, icon: Icon, badge, tooltip }) => {
            const active = isActive(path);
            return (
              <Tooltip key={path} text={tooltip} position="right">
                <button
                  onClick={() => nav(path)}
                  className={`nav-item ${active ? "active" : ""}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: 8,
                    borderLeft: active ? "3px solid var(--gold-dark)" : "3px solid transparent",
                    background: active ? "rgba(0,0,0,0.04)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    fontSize: 14,
                    fontWeight: 500,
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
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    {!collapsed && (
                      <span style={{ color: active ? "var(--fg)" : "var(--fg-3)" }}>{label}</span>
                    )}
                  </div>
                  {badge && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: "var(--surface-elevated)",
                      color: "var(--fg-3)",
                      border: "1px solid var(--line)",
                      borderRadius: 100,
                      padding: "2px 6px",
                    }}>{badge}</span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Conversations */}
        <div style={{ paddingTop: 8, paddingBottom: 4 }}>
          {!collapsed && <div className="nav-section-label">Conversations</div>}
          <button
            onClick={() => nav("/studio/work")}
            className="nav-item"
            style={{ gap: 10, cursor: "pointer", transition: "color 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--fg)"; }}
          >
            <Plus size={12} strokeWidth={2} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            <span>New conversation</span>
          </button>
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
            fontSize: 11, fontWeight: 600, color: "var(--fg)",
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
            {!collapsed && <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{user?.email || ""}</div>}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 6,
              color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
