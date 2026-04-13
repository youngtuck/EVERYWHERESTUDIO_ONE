import { useState, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { APP_VERSION, OUTPUT_TYPES_FULL } from "../../lib/constants";
import {
  hasPersistedWorkSession,
  loadSession,
  patchPersistedSessionOutputTypeId,
} from "../../lib/sessionPersistence";
import OutputTypePicker, { type OutputCategory } from "./OutputTypePicker";
import { StudioUserAccountMenu } from "./StudioUserAccountMenu";

type NavItemDef = {
  path: string;
  label: string;
  desc: string;
  icon: ReactNode;
};

type NavGroupDef = {
  group: string;
  collapsible?: boolean;
  items: NavItemDef[];
};

// ── Nav structure matching wireframe ───────────────────────────
const NAV: NavGroupDef[] = [
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
    collapsible: true,
    items: [
      { path: "/studio/outputs/content", label: "Content", desc: "Essays, podcasts, video scripts, emails.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
      { path: "/studio/outputs/business", label: "Business", desc: "Presentations, proposals, case studies, SOWs.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
      { path: "/studio/outputs/social", label: "Social", desc: "Social media content across platforms.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg> },
      { path: "/studio/outputs/extended", label: "Extended", desc: "Books, websites, newsletters, social media projects.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> },
      { path: "/studio/outputs/templates", label: "Templates", desc: "System and custom output templates.", icon: <svg style={{ width: 16, height: 16, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMobileClose?: () => void;
}

const STORAGE_OUTPUTS_OPEN = "ew-sidebar-outputs-open";

type OutputNavOverlayConfig =
  | { mode: "picker"; initialCategory: OutputCategory; title: string }
  | { mode: "social"; title: string };

/** Sidebar catalog links that share the full-page library; guarded when a Work session exists in sessionStorage. */
const GUARDED_OUTPUT_NAV: Record<string, OutputNavOverlayConfig> = {
  "/studio/outputs/content": { mode: "picker", initialCategory: "Content", title: "Content output types" },
  "/studio/outputs/business": { mode: "picker", initialCategory: "Business", title: "Business output types" },
  "/studio/outputs/extended": { mode: "picker", initialCategory: "Extended", title: "Extended output types" },
  "/studio/outputs/social": { mode: "social", title: "Social output types" },
};

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const [outputOverlay, setOutputOverlay] = useState<OutputNavOverlayConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [outputsOpen, setOutputsOpen] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_OUTPUTS_OPEN);
      if (v === "0") return false;
      if (v === "1") return true;
    } catch { /* ignore */ }
    return true;
  });

  const toggleOutputsOpen = useCallback(() => {
    setOutputsOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_OUTPUTS_OPEN, next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    if (loc.pathname.startsWith("/studio/outputs")) {
      setOutputsOpen(true);
    }
  }, [loc.pathname]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("is_admin").eq("id", user.id).single().then(({ data }) => {
      setIsAdmin(!!data?.is_admin);
    });
  }, [user]);

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings") return loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    if (p === "/studio/outputs") return loc.pathname.startsWith("/studio/outputs");
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  const navigateOrOutputOverlay = useCallback((path: string) => {
    const guard = GUARDED_OUTPUT_NAV[path];
    if (guard && hasPersistedWorkSession()) {
      setOutputOverlay(guard);
      onMobileClose?.();
      return;
    }
    nav(path);
    onMobileClose?.();
  }, [nav, onMobileClose]);

  return (
    <aside
      className={`studio-sidebar-rail ${collapsed ? "studio-sidebar-rail--collapsed" : ""}`}
      style={{ width: collapsed ? 52 : 220 }}
    >
      <div className="studio-sidebar-glass">
        <div className="studio-sidebar-glass-inner">
          {/* Rail top: project selector + collapse / mobile close */}
          <div className="studio-sidebar-header">
            {!collapsed && !onMobileClose && (
              <>
                <div style={{ flex: 1, minWidth: 0 }} />
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  title="Collapse sidebar"
                  className="studio-sidebar-icon-btn"
                >
                  <svg style={{ width: 13, height: 13, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </>
            )}

            {collapsed && !onMobileClose && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                title="Expand sidebar"
                className="studio-sidebar-icon-btn"
                style={{ width: "100%", height: 36, borderRadius: 12 }}
              >
                <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {onMobileClose && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.55)" }}>
                  Navigation
                </span>
              </div>
            )}
            {onMobileClose && (
              <button type="button" onClick={onMobileClose} className="studio-sidebar-icon-btn" aria-label="Close menu">
                <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 300 }}>×</span>
              </button>
            )}
          </div>

          <nav className="studio-sidebar-nav">
        {NAV.map((group, gi) => {
          // On mobile, skip items already in bottom nav
          const items = onMobileClose
            ? group.items.filter(i => !["/studio/dashboard", "/studio/watch", "/studio/work", "/studio/wrap", "/studio/settings"].includes(i.path))
            : group.items;
          if (items.length === 0) return null;

          const isOutputsCollapsible = Boolean(group.collapsible && group.group === "Outputs");
          const showOutputNavItems = !isOutputsCollapsible || collapsed || outputsOpen;

          return (
            <div key={group.group}>
              {!collapsed && !isOutputsCollapsible && (
                <div className="studio-sidebar-group-label">
                  {group.group}
                </div>
              )}
              {!collapsed && isOutputsCollapsible && (
                <button
                  type="button"
                  className="studio-sidebar-outputs-toggle"
                  onClick={toggleOutputsOpen}
                  aria-expanded={outputsOpen}
                >
                  <span>Outputs</span>
                  <svg className={`studio-sidebar-outputs-chevron ${outputsOpen ? "is-open" : ""}`} viewBox="0 0 24 24" aria-hidden>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              {collapsed && gi > 0 && (
                <div className="studio-sidebar-group-rule" />
              )}

              {showOutputNavItems && items.map(({ path, label, icon, desc }) => {
                const active = isActive(path);
                return (
                  <NavItem
                    key={path}
                    label={label}
                    desc={desc}
                    icon={icon}
                    active={active}
                    collapsed={collapsed}
                    onClick={() => navigateOrOutputOverlay(path)}
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
              <div className="studio-sidebar-group-label">
                Admin
              </div>
            )}
            {collapsed && <div className="studio-sidebar-group-rule" />}
            <NavItem
              label="Admin Panel"
              active={loc.pathname === "/studio/admin"}
              collapsed={collapsed}
              onClick={() => { nav("/studio/admin"); onMobileClose?.(); }}
              icon={
                <svg style={{ width: 16, height: 16, stroke: "var(--gold)", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
          </>
        )}
      </nav>

      {user && (
        <div
          style={{
            flexShrink: 0,
            padding: collapsed ? "6px 6px 4px" : "8px 8px 6px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <StudioUserAccountMenu variant="sidebar" collapsed={collapsed} />
        </div>
      )}

      {!collapsed && (
        <div className="studio-sidebar-footer">
          v{APP_VERSION}
        </div>
      )}
        </div>
      </div>

      {outputOverlay && (
        <WorkSessionOutputTypeOverlay
          config={outputOverlay}
          userId={user?.id}
          onClose={() => setOutputOverlay(null)}
        />
      )}
    </aside>
  );
}

function WorkSessionOutputTypeOverlay({
  config,
  userId,
  onClose,
}: {
  config: OutputNavOverlayConfig;
  userId?: string;
  onClose: () => void;
}) {
  const selected = loadSession()?.outputTypeId ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const applyType = (id: string) => {
    patchPersistedSessionOutputTypeId(id, { userId });
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ew-sidebar-output-picker-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 280,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "max(24px, env(safe-area-inset-top)) 16px 24px",
        fontFamily: "var(--font)",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          margin: 0,
          padding: 0,
          cursor: "pointer",
          background: "rgba(12, 26, 41, 0.52)",
        }}
      />
      <div
        className="liquid-glass-card"
        style={{
          position: "relative",
          width: "min(440px, 100%)",
          marginTop: "max(48px, 10vh)",
          padding: "18px 18px 16px",
          borderRadius: 14,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          maxHeight: "min(78vh, 640px)",
          overflow: "auto",
          boxSizing: "border-box",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          id="ew-sidebar-output-picker-title"
          style={{
            margin: "0 0 6px",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--fg)",
            letterSpacing: "-0.02em",
          }}
        >
          {config.title}
        </h2>
        <p style={{ margin: "0 0 14px", fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}>
          You have an active Work session. Pick a format here to update the session without leaving this page.
        </p>
        {config.mode === "picker" ? (
          <OutputTypePicker
            key={config.initialCategory}
            selected={selected}
            onSelect={applyType}
            compact
            initialCategory={config.initialCategory}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {OUTPUT_TYPES_FULL.social.types.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyType(t.id)}
                style={{
                  textAlign: "left" as const,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: selected === t.id ? "2px solid var(--gold-bright)" : "1px solid var(--glass-border)",
                  background: selected === t.id ? "rgba(245,198,66,0.08)" : "var(--glass-card)",
                  fontSize: 12,
                  fontWeight: selected === t.id ? 600 : 500,
                  color: "var(--fg)",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "var(--fg-2)",
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
  icon: ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`studio-sidebar-nav-row ${active ? "is-active" : ""}`}
      style={{
        justifyContent: collapsed ? "center" : "flex-start",
        textAlign: collapsed ? "center" as const : "left",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 20, height: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        opacity: active ? 1 : 0.88,
        color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)",
        transition: "opacity 0.1s",
      }}>
        {icon}
      </div>

      {/* Label */}
      {!collapsed && (
        <span style={{
          fontSize: 12,
          color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)",
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
          className="studio-sidebar-tooltip"
          style={{
            position: "absolute",
            left: collapsed ? 52 : 220,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "8px 11px",
            fontSize: 11,
            color: "rgba(255,255,255,0.92)",
            whiteSpace: "normal",
            width: 188,
            lineHeight: 1.45,
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ opacity: 0.9, fontSize: 10 }}>{desc}</div>
        </div>
      )}
    </button>
  );
}


