import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useShell } from "./StudioShell";
import ThemeToggle from "../ThemeToggle";
import { useState } from "react";

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
            <span style={{ fontSize: 11, fontWeight: 600, color: "#0D1B2A", padding: "3px 8px", borderRadius: 4, background: "var(--gold-bright)" }}>
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
const WORK_STAGES = ["Intake", "Outline", "Edit", "Review", "Export"] as const;
type WorkStage = typeof WORK_STAGES[number];

function WorkBreadcrumb() {
  // The active stage is driven by WorkSession's internal state.
  // We expose a global event for now so WorkSession can set it.
  // For the breadcrumb, we just show the stages.
  const stage: WorkStage = (window as any).__ewWorkStage || "Intake";

  const stages = WORK_STAGES;
  const activeIdx = stages.indexOf(stage as WorkStage);

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
                  (window as any).__ewSetWorkStage?.(s);
                }
              }}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 4,
                cursor: canClick ? "pointer" : "default",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#0D1B2A" : isDone ? "var(--fg-3)" : "var(--fg-3)",
                background: isActive ? "var(--gold-bright)" : "transparent",
                transition: "all 0.1s",
              }}
              onMouseEnter={e => { if (canClick && !isActive) (e.target as HTMLElement).style.color = "var(--fg-2)"; }}
              onMouseLeave={e => { if (canClick && !isActive) (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
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

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(245,198,66,0.2)",
          border: "1px solid rgba(245,198,66,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "var(--gold)",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 290 }} />
          <div style={{
            position: "absolute", top: 36, right: 0,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
            zIndex: 300,
            width: 220,
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(245,198,66,0.2)",
                  border: "1px solid rgba(245,198,66,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--gold)", flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)" }}>{displayName || "User"}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)" }}>EVERYWHERE Studio</div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>Your profile</div>
              {[
                { label: "Voice DNA", value: "Active", valueColor: "#4CAF82", path: "/studio/settings/voice" },
                { label: "Brand DNA", value: "Active", valueColor: "#4CAF82", path: "/studio/settings/brand" },
              ].map(r => (
                <div
                  key={r.label}
                  onClick={() => { nav(r.path); setOpen(false); }}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", cursor: "pointer", borderRadius: 3, transition: "opacity 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  <span style={{ color: "var(--fg-2)" }}>{r.label}</span>
                  <span style={{ color: r.valueColor, fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding: 6 }}>
              {[
                { label: "Preferences", action: () => { nav("/studio/settings"); setOpen(false); } },
                { label: "Edit Voice DNA", action: () => { nav("/studio/settings/voice"); setOpen(false); } },
                { label: "Edit Brand DNA", action: () => { nav("/studio/settings/brand"); setOpen(false); } },
              ].map(item => (
                <div
                  key={item.label}
                  onClick={item.action}
                  style={{ padding: "7px 10px", fontSize: 12, color: "var(--fg-2)", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {item.label}
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--line)", margin: "4px 0" }} />
              <div
                onClick={handleSignOut}
                style={{ padding: "7px 10px", fontSize: 12, color: "var(--fg-3)", cursor: "pointer", borderRadius: 5, transition: "background 0.1s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Sign out
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main TopBar ─────────────────────────────────────────────────
export default function StudioTopBar() {
  const { dashOpen, setDashOpen, setAdvisorsOpen, setDiscoverOpen } = useShell();
  const { left, showAdvisors } = useBreadcrumbs();

  return (
    <div style={{
      height: 50,
      background: "var(--bg)",
      borderBottom: "1px solid var(--line)",
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
          onClick={() => setDashOpen(!dashOpen)}
          style={{
            fontSize: 11, fontWeight: dashOpen ? 600 : 500,
            color: dashOpen ? "var(--fg)" : "var(--fg-3)",
            cursor: "pointer", background: "none", border: "none",
            fontFamily: "var(--font)", padding: 0, transition: "color 0.12s",
          }}
          onMouseEnter={e => { if (!dashOpen) (e.target as HTMLElement).style.color = "var(--fg-2)"; }}
          onMouseLeave={e => { if (!dashOpen) (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
        >
          Dashboard
        </button>

        <Divider />

        <button
          onClick={() => setDiscoverOpen(true)}
          style={{
            background: "transparent", border: "none",
            color: "var(--fg-3)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", padding: "4px", lineHeight: 1,
            fontFamily: "var(--font)", transition: "color 0.12s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--blue)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--fg-3)"; }}
          title="Discover"
        >
          ?
        </button>

        <ThemeToggle />

        <UserAvatar />
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: "var(--line)", flexShrink: 0 }} />;
}
