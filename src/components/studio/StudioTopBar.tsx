import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useShell } from "./StudioShell";
import { useState } from "react";
import { useWorkStageFromShell } from "../../hooks/useWorkStageBridge";

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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.3 }}>
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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.25, margin: "0 1px" }}>
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
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--fg)" : "var(--fg-3)",
                opacity: isActive || isDone ? 1 : 0.42,
                transition: "color 0.15s ease, opacity 0.15s ease",
              }}
              onMouseEnter={e => { if (!isActive) (e.target as HTMLElement).style.color = "var(--fg-2)"; }}
              onMouseLeave={e => { if (!isActive) (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
            >
              {s}
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

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  return (
    <>
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(200,169,110,0.1)",
          border: "1px solid rgba(200,169,110,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "var(--gold-dark)",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 290 }} />
          <div className="liquid-glass-menu" style={{
            position: "absolute", top: 36, right: 0,
            zIndex: 300,
            width: 220,
            overflow: "hidden",
          }}>
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
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>EVERYWHERE Studio</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Alpha 3.021</div>
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
                  onClick={item.action}
                  style={{ padding: "7px 10px", fontSize: 12, color: "rgba(255,255,255,0.75)", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {item.label}
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
              <div
                onClick={handleSignOut}
                style={{ padding: "7px 10px", fontSize: 12, color: "#e85d75", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Logout
              </div>
            </div>
          </div>
        </>
      )}
    </div>
      {activeModal === "system" && (
        <div onClick={() => setActiveModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 12, width: 420, maxHeight: 480, padding: "20px 24px", boxShadow: "0 16px 48px rgba(0,0,0,0.14)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>System Settings</span>
              <button onClick={() => setActiveModal(null)} aria-label="Close dialog" style={{ background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            {[
              { label: "Default AI Model", value: "Claude Opus 4" },
              { label: "Session Timeout", value: "30 minutes" },
              { label: "Data Region", value: "US East" },
            ].map(field => (
              <div key={field.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{field.label}</span>
                <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500 }}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeModal === "admin" && (
        <div onClick={() => setActiveModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 12, width: 420, maxHeight: 480, padding: "20px 24px", boxShadow: "0 16px 48px rgba(0,0,0,0.14)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>Admin Panel</span>
              <button onClick={() => setActiveModal(null)} aria-label="Close dialog" style={{ background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            {[
              { label: "Organization", value: "Mixed Grill, LLC" },
              { label: "Plan", value: "Alpha" },
              { label: "Users", value: "1" },
            ].map(field => (
              <div key={field.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{field.label}</span>
                <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500 }}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
          className="liquid-glass-btn-gold"
          onClick={() => {
            sessionStorage.setItem("ew-new-session", "1");
            nav("/studio/work");
          }}
          style={{ fontSize: 11, padding: "5px 12px" }}
        >
          + New Session
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
