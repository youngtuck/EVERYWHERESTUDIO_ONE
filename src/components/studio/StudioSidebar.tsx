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
        desc: "Your daily intelligence briefing. Signals, competitors, opportunities.",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        path: "/studio/work",
        label: "Work",
        desc: "Talk to Reed, build outlines, write drafts, run checkpoints.",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        ),
      },
      {
        path: "/studio/wrap",
        label: "Wrap",
        desc: "Turn drafts into formatted deliverables for every channel.",
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
        label: "Catalog",
        desc: "Every piece you have published or exported lives here.",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        path: "/studio/lot",
        label: "Pipeline",
        desc: "Ideas parked for later. Resurfaces when timing is right.",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        path: "/studio/resources",
        label: "Files",
        desc: "Uploaded reference docs, brand assets, research materials.",
        icon: (
          <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Outputs",
    items: [
      { path: "/studio/outputs/content", label: "Content", desc: "Essays, podcasts, video scripts, emails.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
      { path: "/studio/outputs/business", label: "Business", desc: "Presentations, proposals, case studies, SOWs.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
      { path: "/studio/outputs/social", label: "Social", desc: "Social media content across platforms.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg> },
      { path: "/studio/outputs/extended", label: "Extended", desc: "Books, websites, newsletters, social media projects.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> },
      { path: "/studio/outputs/templates", label: "Templates", desc: "System and custom output templates.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
    ],
  },
  {
    group: "You",
    items: [
      {
        path: "/studio/settings",
        label: "Preferences",
        desc: "Voice DNA, display settings, Watch sources, defaults.",
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

interface Project { id: string; name: string; is_default: boolean; }

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose, simplified = false }: SidebarProps & { simplified?: boolean }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, displayName } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? projects.find(p => p.is_default) ?? projects[0];

  useEffect(() => {
    if (!user) return;
    // Load admin status
    supabase.from("profiles").select("is_admin").eq("id", user.id).single().then(({ data }) => {
      setIsAdmin(!!data?.is_admin);
    });
    // Load projects
    supabase
      .from("projects")
      .select("id, name, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProjects(data as Project[]);
          const def = data.find((p: Project) => p.is_default);
          setActiveProjectId(def?.id ?? data[0].id);
        } else {
          // Fallback: show display name as project
          setProjects([{ id: "default", name: displayName?.split(" ")[0] ? `${displayName.split(" ")[0]}'s Studio` : "My Studio", is_default: true }]);
          setActiveProjectId("default");
        }
      });
  }, [user, displayName]);

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
        {/* Expanded: project block + collapse button */}
        {!collapsed && !onMobileClose && (
          <>
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0, position: "relative" }}>
              <div
                onClick={() => projects.length > 1 && setShowProjectMenu(m => !m)}
                style={{
                  display: "flex", alignItems: "flex-start", flexDirection: "column",
                  gap: 1, background: "rgba(0,0,0,0.05)", borderRadius: 5,
                  padding: "5px 8px", cursor: projects.length > 1 ? "pointer" : "default",
                }}
              >
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>Project</span>
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {activeProject?.name ?? "Loading..."}
                  </span>
                  {projects.length > 1 && (
                    <svg style={{ width: 11, height: 11, stroke: "var(--fg-3)", strokeWidth: 2, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </div>
              </div>
              {showProjectMenu && projects.length > 1 && (
                <>
                  <div onClick={() => setShowProjectMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 7, boxShadow: "var(--shadow-md)", zIndex: 100, overflow: "hidden" }}>
                    {projects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setActiveProjectId(p.id); setShowProjectMenu(false); }}
                        style={{
                          padding: "8px 10px", fontSize: 12, cursor: "pointer",
                          color: p.id === activeProjectId ? "var(--fg)" : "var(--fg-2)",
                          fontWeight: p.id === activeProjectId ? 600 : 400,
                          background: p.id === activeProjectId ? "rgba(245,198,66,0.08)" : "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => { if (p.id !== activeProjectId) e.currentTarget.style.background = "var(--bg)"; }}
                        onMouseLeave={e => { if (p.id !== activeProjectId) e.currentTarget.style.background = "transparent"; }}
                      >
                        {p.name}
                        {p.is_default && <span style={{ fontSize: 9, color: "var(--fg-3)", marginLeft: 6 }}>default</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Collapse button — expanded state */}
            <button
              onClick={onToggleCollapsed}
              title="Collapse sidebar"
              style={{
                width: 28, height: 28, borderRadius: 5,
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
              <svg style={{ width: 13, height: 13, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </>
        )}

        {/* Collapsed: entire header is the expand button */}
        {collapsed && !onMobileClose && (
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            style={{
              width: "100%", height: "100%",
              background: "transparent", border: "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 0,
              color: "var(--fg-3)",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Mobile close */}
        {onMobileClose && (
          <div style={{ flex: 1, overflow: "hidden", minWidth: 0, position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "flex-start", flexDirection: "column",
              gap: 1, background: "rgba(0,0,0,0.05)", borderRadius: 5, padding: "5px 8px",
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>Project</span>
              <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeProject?.name ?? "Loading..."}
              </span>
            </div>
          </div>
        )}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 16, padding: 4, flexShrink: 0 }}
            aria-label="Close menu"
          >✕</button>
        )}
      </div>

      {/* Navigation body */}
      <nav style={{ flex: 1, padding: "6px 5px", overflowY: "auto" }}>
        {NAV.filter(group => !simplified || group.group === "Studio" || group.group === "You").map((group, gi) => {
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
                  fontSize: 9, color: "var(--fg-2)",
                  letterSpacing: "0.1em", textTransform: "uppercase" as const,
                  padding: "10px 6px 3px", whiteSpace: "nowrap",
                  fontWeight: 600,
                }}>
                  {group.group}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: 1, background: "var(--line)", margin: "8px 6px", opacity: 0.5 }} />
              )}

              {items.map(({ path, label, icon, desc }) => {
                const active = isActive(path);
                return (
                  <NavItem
                    key={path}
                    label={label}
                    desc={desc}
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
              <div style={{ fontSize: 9, color: "var(--fg-2)", letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "10px 6px 3px", fontWeight: 600 }}>
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
  desc,
  icon,
  active,
  collapsed,
  onClick,
}: {
  label: string;
  desc?: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
        setShowTooltip(true);
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = "transparent";
        setShowTooltip(false);
      }}
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
    >
      {/* Icon */}
      <div style={{
        width: 20, height: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        opacity: active ? 1 : 0.55,
        color: "var(--fg)",
        transition: "opacity 0.1s",
      }}>
        {icon}
      </div>

      {/* Label */}
      {!collapsed && (
        <span style={{
          fontSize: 12,
          color: active ? "var(--fg)" : "var(--fg-2)",
          fontWeight: active ? 600 : 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          flex: 1,
          transition: "color 0.1s",
        }}>
          {label}
        </span>
      )}

      {/* Super tooltip: shows on hover for both expanded and collapsed modes */}
      {showTooltip && desc && (
        <div
          style={{
            position: "absolute",
            left: collapsed ? 52 : 220,
            top: "50%",
            transform: "translateY(-50%)",
            background: "var(--fg)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: "rgba(255,255,255,0.92)",
            whiteSpace: "normal",
            width: 180,
            lineHeight: 1.4,
            zIndex: 200,
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ opacity: 0.75, fontSize: 10 }}>{desc}</div>
        </div>
      )}
    </div>
  );
}


