import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useShell } from "./StudioShell";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWorkStageFromShell } from "../../hooks/useWorkStageBridge";

const USER_MENU_OVERLAY_Z = 10050;
/** Above account menu; portaled to document.body so #root zoom does not clip dialogs */
const STUDIO_CENTER_MODAL_Z = 10100;

// ── Route to breadcrumb config ──────────────────────────────────
function useBreadcrumbs(): {
  left: React.ReactNode;
  showAdvisors: boolean;
} {
  const loc = useLocation();
  const nav = useNavigate();

  const path = loc.pathname;

  // Work pipeline gets special breadcrumb treatment
  if (path.startsWith("/studio/work")) {
    return { left: <WorkBreadcrumb />, showAdvisors: true };
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
    showAdvisors: false,
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

// ── Avatar + user menu ──────────────────────────────────────────
function UserAvatar() {
  const { user, displayName, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

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
        right: Math.max(8, window.innerWidth - r.right),
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
    if (!activeModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModal]);

  const menuPortal = open && menuPos && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: USER_MENU_OVERLAY_Z,
              border: "none", padding: 0, margin: 0, cursor: "default",
              background: "transparent",
            }}
          />
          <div
            className="liquid-glass-menu"
            role="menu"
            aria-label="Account menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
              zIndex: USER_MENU_OVERLAY_Z + 1,
              width: 220,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(245,198,66,0.2)",
                  border: "1px solid rgba(245,198,66,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#F5C642", flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{displayName || "User"}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)" }}>EVERYWHERE Studio</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)" }}>Alpha 3.021</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: 6 }}>
              {[
                { label: "System Settings", action: () => { setActiveModal("system"); setOpen(false); } },
                { label: "Preferences", action: () => { nav("/studio/settings"); setOpen(false); } },
                { label: "Admin Panel", action: () => { setActiveModal("admin"); setOpen(false); } },
              ].map(item => (
                <div
                  key={item.label}
                  role="menuitem"
                  onClick={item.action}
                  style={{ padding: "7px 10px", fontSize: 12, color: "rgba(255,255,255,0.88)", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {item.label}
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
              <div
                role="menuitem"
                onClick={handleSignOut}
                style={{ padding: "7px 10px", fontSize: 12, color: "#e85d75", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Logout
              </div>
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  const centerModalShell = (
    id: string,
    title: string,
    rows: { label: string; value: string }[],
  ) => (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onClick={() => setActiveModal(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: STUDIO_CENTER_MODAL_Z,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        background: "rgba(13,27,42,0.45)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="liquid-glass-card"
        style={{
          width: "min(440px, calc(100vw - 48px))",
          maxHeight: "min(560px, calc(100vh - 48px))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
          borderRadius: 16,
          boxShadow: "0 24px 80px rgba(0,0,0,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 22px",
            flexShrink: 0,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span id={id} style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{title}</span>
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            aria-label="Close dialog"
            style={{ background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "8px 22px 22px", overflowY: "auto", minHeight: 0 }}>
          {rows.map(field => (
            <div
              key={field.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{field.label}</span>
              <span style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, textAlign: "right" as const }}>{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const systemModalPortal = activeModal === "system" && typeof document !== "undefined"
    ? createPortal(
        centerModalShell("studio-system-settings-title", "System Settings", [
          { label: "Default AI Model", value: "Claude Opus 4" },
          { label: "Session Timeout", value: "30 minutes" },
          { label: "Data Region", value: "US East" },
        ]),
        document.body,
      )
    : null;

  const adminModalPortal = activeModal === "admin" && typeof document !== "undefined"
    ? createPortal(
        centerModalShell("studio-admin-panel-title", "Admin Panel", [
          { label: "Organization", value: "Mixed Grill, LLC" },
          { label: "Plan", value: "Alpha" },
          { label: "Users", value: "1" },
        ]),
        document.body,
      )
    : null;

  return (
    <>
    <div style={{ position: "relative" }}>
      <button
        type="button"
        ref={anchorRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(200,169,110,0.1)",
          border: "1px solid rgba(200,169,110,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "var(--gold-dark)",
          cursor: "pointer", flexShrink: 0,
          padding: 0, fontFamily: "inherit",
        }}
      >
        {initials}
      </button>
    </div>
    {menuPortal}
    {systemModalPortal}
    {adminModalPortal}
    </>
  );
}

// ── Main TopBar ─────────────────────────────────────────────────
export default function StudioTopBar() {
  const nav = useNavigate();
  const { setAdvisorsOpen, setDiscoverOpen } = useShell();
  const { left, showAdvisors } = useBreadcrumbs();

  return (
    <div className="liquid-glass" style={{
      height: 50,
      borderRadius: 0,
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 8,
      flexShrink: 0,
    }}>
      {/* Left: breadcrumbs */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center" }}>
        {left}
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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

        {showAdvisors && (
          <>
            <button
              onClick={() => setAdvisorsOpen(true)}
              style={{
                fontSize: 11, color: "var(--fg-3)", cursor: "pointer",
                fontWeight: 500, background: "none", border: "none",
                fontFamily: "var(--font)", padding: 0, transition: "color 0.12s",
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--fg)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
            >
              Advisors
            </button>
            <Divider />
          </>
        )}

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

        <UserAvatar />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="studio-topbar-divider" aria-hidden />;
}
