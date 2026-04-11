import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useShell } from "./StudioShellContext";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWorkStageFromShell } from "../../hooks/useWorkStageBridge";
import { useStudioProject } from "../../context/ProjectContext";
import { supabase } from "../../lib/supabase";
import { StudioUserAccountMenu } from "./StudioUserAccountMenu";

const PROJECT_MENU_Z = 10120;

// ── Route to breadcrumb config ──────────────────────────────────
function useBreadcrumbs(): { left: React.ReactNode } {
  const loc = useLocation();
  const nav = useNavigate();

  const path = loc.pathname;

  if (path.startsWith("/studio/work")) {
    return { left: <WorkBreadcrumb /> };
  }

  const labelMap: Record<string, string> = {
    "/studio/dashboard": "Home",
    "/studio/watch": "Watch",
    "/studio/wrap": "Wrap",
    "/studio/lot": "The Lot",
    "/studio/outputs": "The Catalog",
    "/studio/projects": "Projects",
    "/studio/resources": "Resources",
    "/studio/settings": "Settings",
    "/studio/workbench": "Workbench",
  };

  const label = labelMap[path] || "Studio";

  return {
    left: (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          onClick={() => nav("/studio/dashboard")}
          style={{ fontSize: 11, color: "var(--fg-3)", cursor: "pointer", transition: "color 0.1s" }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--fg-2)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
        >
          Home
        </span>
        {label !== "Home" && (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--fg-3)", opacity: 0.85 }}>
              <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)", padding: "3px 8px", borderRadius: 6, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.18)" }}>
              {label}
            </span>
          </>
        )}
      </div>
    ),
  };
}

// ── Work Pipeline Breadcrumb ────────────────────────────────────
const WORK_STAGES = ["Intake", "Outline", "Edit", "Review"] as const;
type WorkStage = typeof WORK_STAGES[number];

function WorkBreadcrumb() {
  const stageRaw = useWorkStageFromShell();
  const stage: WorkStage = WORK_STAGES.includes(stageRaw as WorkStage)
    ? (stageRaw as WorkStage)
    : "Review";

  const stages = WORK_STAGES;
  const activeIdx = stages.indexOf(stage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {stages.map((s, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        const canClick = i <= activeIdx;

        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--fg-3)", opacity: 0.8, margin: "0 1px" }}>
                <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span
              onClick={() => {
                if (canClick) {
                  window.__ewSetWorkStage?.(s);
                }
              }}
              className={isActive ? "liquid-glass-pill" : ""}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                cursor: canClick ? "pointer" : "default",
                transition: "color 0.15s ease, opacity 0.15s ease",
                opacity: isActive || isDone ? 1 : 0.78,
              }}
              onMouseEnter={e => {
                const label = e.currentTarget.querySelector(".work-stage-pill-label");
                if (!isActive && label) (label as HTMLElement).style.color = "var(--fg-2)";
              }}
              onMouseLeave={e => {
                const label = e.currentTarget.querySelector(".work-stage-pill-label");
                if (!isActive && label) (label as HTMLElement).style.color = "var(--fg-3)";
              }}
            >
              <span
                className="work-stage-pill-label"
                style={{
                  position: "relative",
                  zIndex: 3,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--fg)" : "var(--fg-3)",
                }}
              >
                {s}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Project dropdown (Supabase, matches StudioSidebar query) ──
function ProjectSwitcher() {
  const { user } = useAuth();
  const { projects, activeProject, activeProjectId, setActiveProjectId, refreshProjects, loading } = useStudioProject();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const el = anchorRef.current;
    if (!el) return;
    const place = () => {
      const r = el.getBoundingClientRect();
      setMenuPos({
        top: r.bottom + 6,
        left: r.left,
        width: Math.max(240, r.width),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewName("");
      setCreateErr(null);
    }
  }, [open]);

  const displayName = activeProject?.name ?? (loading ? "Loading…" : "Project");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreateBusy(true);
    setCreateErr(null);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          description: "",
        })
        .select("id")
        .single();
      if (error) throw error;
      await refreshProjects();
      if (data?.id) setActiveProjectId(data.id);
      setNewName("");
      setCreating(false);
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create project.";
      setCreateErr(msg);
    } finally {
      setCreateBusy(false);
    }
  };

  const menuPortal = open && menuPos && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            type="button"
            aria-label="Close project menu"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: PROJECT_MENU_Z - 1,
              border: "none", padding: 0, margin: 0, cursor: "default",
              background: "transparent",
            }}
          />
          <div
            className="liquid-glass-menu"
            role="menu"
            aria-label="Projects"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: PROJECT_MENU_Z,
              overflow: "hidden",
              maxHeight: "min(360px, calc(100vh - 80px))",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {projects.map(p => (
                <button
                  type="button"
                  key={p.id}
                  role="menuitem"
                  onClick={() => { setActiveProjectId(p.id); setOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    padding: "9px 12px", fontSize: 12, cursor: "pointer",
                    color: p.id === activeProjectId ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.82)",
                    fontWeight: p.id === activeProjectId ? 600 : 400,
                    background: p.id === activeProjectId ? "rgba(245,198,66,0.12)" : "transparent",
                    border: "none", fontFamily: "inherit",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (p.id !== activeProjectId) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { if (p.id !== activeProjectId) e.currentTarget.style.background = "transparent"; }}
                >
                  {p.name}
                  {p.is_default && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.62)", marginLeft: 6 }}>default</span>}
                </button>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              {!creating ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setCreating(true); setCreateErr(null); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    padding: "10px 12px", fontSize: 12, fontWeight: 600,
                    color: "#F5C642", cursor: "pointer", background: "rgba(245,198,66,0.06)",
                    border: "none", fontFamily: "inherit",
                  }}
                >
                  + New Project
                </button>
              ) : (
                <form onSubmit={onCreate} style={{ padding: 10 }} onClick={e => e.stopPropagation()}>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Project name"
                    autoFocus
                    style={{
                      width: "100%", boxSizing: "border-box", marginBottom: 8,
                      padding: "8px 10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit",
                      border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)",
                      color: "rgba(255,255,255,0.92)", outline: "none",
                    }}
                  />
                  {createErr && (
                    <div style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{createErr}</div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      disabled={createBusy || !newName.trim()}
                      style={{
                        flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        border: "none", cursor: createBusy || !newName.trim() ? "default" : "pointer",
                        background: "rgba(245,198,66,0.25)", color: "rgba(255,255,255,0.95)",
                        opacity: createBusy || !newName.trim() ? 0.5 : 1,
                      }}
                    >
                      {createBusy ? "Creating…" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewName(""); setCreateErr(null); }}
                      style={{
                        padding: "7px 10px", borderRadius: 8, fontSize: 11,
                        border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
                        color: "rgba(255,255,255,0.75)", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        ref={anchorRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          maxWidth: 200, padding: "5px 10px", borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.45)",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{
          fontSize: 12, fontWeight: 600, color: "var(--fg)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0,
        }}>
          {displayName}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--fg-3)", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {menuPortal}
    </div>
  );
}

function SearchIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Search (⌘K)"
      aria-label="Open search"
      style={{
        background: "transparent", border: "none",
        color: "var(--fg-3)", cursor: "pointer", padding: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, transition: "color 0.12s, background 0.12s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = "var(--fg)";
        e.currentTarget.style.background = "rgba(0,0,0,0.04)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = "var(--fg-3)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
  );
}

// ── Main TopBar ─────────────────────────────────────────────────
export default function StudioTopBar() {
  const nav = useNavigate();
  const { setDiscoverOpen, setSearchOpen } = useShell();
  const { left } = useBreadcrumbs();

  return (
    <div className="liquid-glass" style={{
      height: 50,
      borderRadius: 0,
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 12,
      flexShrink: 0,
    }}>
      <ProjectSwitcher />

      {/* Breadcrumbs */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", minWidth: 0 }}>
        {left}
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* +New Session button */}
        <button
          type="button"
          className="liquid-glass-btn-gold"
          onClick={() => {
            sessionStorage.setItem("ew-new-session", "1");
            nav("/studio/work");
          }}
          style={{ fontSize: 11, padding: "6px 14px" }}
        >
          <span className="liquid-glass-btn-gold-label">+ New Session</span>
        </button>

        <Divider />

        <SearchIconButton onClick={() => setSearchOpen(true)} />

        <button
          onClick={() => setDiscoverOpen(true)}
          style={{
            background: "transparent", border: "none",
            color: "var(--fg-3)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", padding: "4px", lineHeight: 1,
            fontFamily: "var(--font)", transition: "color 0.12s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--fg)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
          title="Discover"
        >
          ?
        </button>

        <StudioUserAccountMenu variant="topbar" />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="studio-topbar-divider" aria-hidden />;
}
