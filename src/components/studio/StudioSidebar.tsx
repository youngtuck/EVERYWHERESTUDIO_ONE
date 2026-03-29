import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import Logo from "../Logo";
import { APP_VERSION } from "../../lib/constants";
import EverywhereMarkIcon from "./EverywhereMarkIcon";
import { clearSession } from "../../lib/sessionPersistence";

// ── Nav structure matching wireframe ───────────────────────────
const NAV = [
  {
    group: "Studio",
    items: [
      {
        path: "/studio/watch",
        label: "Watch",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        path: "/studio/work",
        label: "Work",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        ),
      },
      {
        path: "/studio/wrap",
        label: "Wrap",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Library",
    items: [
      {
        path: "/studio/outputs",
        label: "The Catalog",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        path: "/studio/lot",
        label: "The Pipeline",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Project",
    items: [
      {
        path: "/studio/resources",
        label: "Project Files",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "You",
    items: [
      {
        path: "/studio/settings",
        label: "Preferences",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="11" y2="18" />
          </svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMobileClose?: () => void;
}

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, displayName } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [project, setProject] = useState("Default Project");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("is_admin, project_name").eq("id", user.id).single().then(({ data }) => {
      setIsAdmin(!!data?.is_admin);
      if (data?.project_name) setProject(data.project_name);
    });
  }, [user]);

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings") return loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    if (p === "/studio/outputs") return loc.pathname === "/studio/outputs";
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  return (
    <aside style={{
      width: collapsed ? 52 : 220,
      height: "100vh",
      background: "var(--bg-2)",
      borderRight: "1px solid var(--line)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "var(--font)",
      transition: "width 0.18s ease",
      flexShrink: 0,
    }}>

      {/* Rail top: project selector + collapse button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 8px",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
        height: 50,
      }}>
        {/* Project block */}
        {!collapsed && (
          <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <div style={{
              display: "flex", alignItems: "flex-start", flexDirection: "column",
              gap: 1, background: "rgba(0,0,0,0.05)", borderRadius: 5,
              padding: "5px 8px", cursor: "pointer",
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>Project</span>
              <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 4 }}>
                <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {project}
                </span>
                <svg style={{ width: 11, height: 11, stroke: "var(--fg-3)", strokeWidth: 2, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed: just the logo */}
        {collapsed && (
          <div
            onClick={() => nav("/studio/dashboard")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", cursor: "pointer" }}
            title="Home"
          >
            <EverywhereMarkIcon size={20} />
          </div>
        )}

        {/* Collapse toggle */}
        {!onMobileClose && (
          <button
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              width: 32, height: 32, borderRadius: 5,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--fg-3)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Mobile close */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 16, padding: 4 }}
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation body */}
      <nav style={{ flex: 1, padding: "6px 5px", overflowY: "auto" }}>
        {NAV.map((group, gi) => {
          // On mobile, skip items already in bottom nav
          const items = onMobileClose
            ? group.items.filter(i => !["/studio/dashboard", "/studio/watch", "/studio/work", "/studio/wrap", "/studio/settings"].includes(i.path))
            : group.items;
          if (items.length === 0) return null;

          return (
            <div key={gi}>
              {/* Group label */}
              {!collapsed && (
                <div style={{
                  fontSize: 9, color: "var(--fg-3)",
                  letterSpacing: "0.1em", textTransform: "uppercase" as const,
                  padding: "10px 6px 3px", whiteSpace: "nowrap",
                }}>
                  {group.group}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: 1, background: "var(--line)", margin: "8px 6px", opacity: 0.5 }} />
              )}

              {items.map(({ path, label, icon }) => {
                const active = isActive(path);
                return (
                  <NavItem
                    key={path}
                    label={label}
                    icon={icon}
                    active={active}
                    collapsed={collapsed}
                    onClick={() => { nav(path); onMobileClose?.(); }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Admin */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "10px 6px 3px" }}>
                Admin
              </div>
            )}
            {collapsed && <div style={{ height: 1, background: "var(--line)", margin: "8px 6px", opacity: 0.5 }} />}
            <NavItem
              label="Admin Panel"
              active={loc.pathname === "/studio/admin"}
              collapsed={collapsed}
              onClick={() => nav("/studio/admin")}
              icon={
                <svg style={{ width: 16, height: 16, stroke: "var(--gold)", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
          </>
        )}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div style={{ padding: "4px 14px 10px", fontSize: 10, color: "var(--fg-3)", opacity: 0.4, borderTop: "1px solid var(--line)" }}>
          v{APP_VERSION}
        </div>
      )}
    </aside>
  );
}

// ── Nav Item ────────────────────────────────────────────────────
function NavItem({
  label,
  icon,
  active,
  collapsed,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 8px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.1s",
        position: "relative",
        marginBottom: 1,
        background: active ? "rgba(245,198,66,0.12)" : "transparent",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Icon */}
      <div style={{
        width: 20, height: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        opacity: active ? 1 : 0.35,
        color: "var(--fg)",
        transition: "opacity 0.1s",
      }}>
        {icon}
      </div>

      {/* Label */}
      {!collapsed && (
        <span style={{
          fontSize: 12,
          color: active ? "var(--fg)" : "var(--fg-3)",
          fontWeight: active ? 600 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          flex: 1,
          transition: "color 0.1s",
        }}>
          {label}
        </span>
      )}

      {/* Tooltip in collapsed mode */}
      {collapsed && (
        <TooltipLabel label={label} />
      )}
    </div>
  );
}

function TooltipLabel({ label }: { label: string }) {
  return (
    <div
      className="nav-tooltip"
      style={{
        display: "none",
        position: "absolute",
        left: 46,
        top: "50%",
        transform: "translateY(-50%)",
        background: "var(--fg)",
        borderRadius: 4,
        padding: "4px 9px",
        fontSize: 11,
        color: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}
