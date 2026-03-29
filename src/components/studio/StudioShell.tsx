import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import StudioTopBar from "./StudioTopBar";
import { CommandPalette } from "./CommandPalette";
import MobileBottomNav from "./MobileBottomNav";
import { useMobile } from "../../hooks/useMobile";
import Logo from "../Logo";
import NotificationBell from "./NotificationBell";

// ── Shell Context ──────────────────────────────────────────────
interface ShellCtx {
  dashOpen: boolean;
  setDashOpen: (v: boolean) => void;
  advisorsOpen: boolean;
  setAdvisorsOpen: (v: boolean) => void;
  discoverOpen: boolean;
  setDiscoverOpen: (v: boolean) => void;
  dashContent: React.ReactNode | null;
  setDashContent: (node: React.ReactNode | null) => void;
}

const ShellContext = createContext<ShellCtx>({
  dashOpen: true,
  setDashOpen: () => {},
  advisorsOpen: false,
  setAdvisorsOpen: () => {},
  discoverOpen: false,
  setDiscoverOpen: () => {},
  dashContent: null,
  setDashContent: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

export default function StudioShell() {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashOpen, setDashOpen] = useState(true);
  const [advisorsOpen, setAdvisorsOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [dashContent, setDashContent] = useState<React.ReactNode | null>(null);

  return (
    <ShellContext.Provider value={{
      dashOpen, setDashOpen,
      advisorsOpen, setAdvisorsOpen,
      discoverOpen, setDiscoverOpen,
      dashContent, setDashContent,
    }}>
      <div style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--font)",
        overflow: "hidden",
      }}>
        <CommandPalette />

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 39 }}
          />
        )}

        {/* Left Rail */}
        <div style={
          isMobile
            ? {
                position: "fixed", top: 0, left: 0, height: "100vh",
                width: 220,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.18s ease",
                zIndex: 40,
              }
            : {
                position: "relative", height: "100vh",
                width: sidebarCollapsed ? 52 : 220,
                flexShrink: 0, zIndex: 1,
                transition: "width 0.18s ease",
              }
        }>
          <StudioSidebar
            collapsed={!isMobile && sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
            onMobileClose={isMobile ? () => setSidebarOpen(false) : undefined}
          />
        </div>

        {/* Main column */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          position: "relative",
        }}>
          {/* Top bar */}
          {isMobile ? (
            <div style={{
              height: 48,
              background: "var(--bg)",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: "none", border: "none", borderRadius: 6,
                  padding: 6, cursor: "pointer", color: "var(--fg-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Open navigation"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
              <Logo size="sm" />
              <NotificationBell />
            </div>
          ) : (
            <StudioTopBar />
          )}

          {/* Content + Dashboard panel row */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Page content */}
            <main
              className="studio-main-inner"
              style={{
                flex: 1,
                overflowY: "auto",
                minWidth: 0,
                paddingBottom: isMobile ? 80 : 0,
              }}
            >
              <Outlet />
            </main>

            {/* Right dashboard panel — desktop only */}
            {!isMobile && (
              <DashboardPanel open={dashOpen}>
                {dashContent}
              </DashboardPanel>
            )}
          </div>
        </div>

        {/* Advisors modal */}
        {advisorsOpen && <AdvisorsModal onClose={() => setAdvisorsOpen(false)} />}

        {/* Discover overlay */}
        {discoverOpen && <DiscoverOverlay onClose={() => setDiscoverOpen(false)} />}

        {isMobile && <MobileBottomNav />}
      </div>
    </ShellContext.Provider>
  );
}

// ── Dashboard Panel ────────────────────────────────────────────
function DashboardPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id="dash-panel"
      style={{
        width: open ? 240 : 0,
        flexShrink: 0,
        background: "var(--bg-2)",
        borderLeft: "1px solid var(--line)",
        overflow: "hidden",
        transition: "width 0.18s ease",
        position: "relative",
      }}
    >
      <div style={{
        width: 240,
        height: "100%",
        overflowY: "auto",
        padding: "14px",
        opacity: open ? 1 : 0,
        transition: "opacity 0.12s ease",
        pointerEvents: open ? "auto" : "none",
      }}>
        {children ?? <DefaultDashContent />}
      </div>
    </div>
  );
}

function DefaultDashContent() {
  return (
    <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
      Select a section to see your dashboard.
    </div>
  );
}

// ── Advisors Modal ─────────────────────────────────────────────
function AdvisorsModal({ onClose }: { onClose: () => void }) {
  const ADVISORS = [
    { role: "Clarity", text: "The core argument is strong. The reframe from motivation to infrastructure lands. The reader needs to feel the cost before the solution." },
    { role: "Audience", text: "Executives will recognize the Sunday night feeling immediately. Don't over-explain. Two sentences max before the pivot." },
    { role: "Structure", text: "The close circles back well. Consider starting with the close as the first line — lead with the destination." },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,27,42,0.5)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 30,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          width: "100%", maxWidth: 560, maxHeight: 580,
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>Advisors</span>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 4,
              background: "var(--bg-2)", color: "var(--fg-3)", fontWeight: 600,
            }}>Edit stage</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 }}
          >✕</button>
        </div>

        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
          <div style={{
            background: "rgba(74,144,217,0.04)",
            border: "1px solid rgba(74,144,217,0.12)",
            borderRadius: 8, padding: "14px 16px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: 6 }}>
              Consensus recommendation
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65 }}>
              Lead with the emotional cost, then reframe. The structural diagnosis should come after the reader already feels the problem.
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)", margin: "4px 0 16px" }} />

          {ADVISORS.map((adv, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 8, padding: "12px 14px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}>{adv.role}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ fontSize: 10, padding: "3px 10px", borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer", fontFamily: "var(--font)" }}>Agree</button>
                  <button style={{ fontSize: 10, padding: "3px 10px", borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)" }}>Skip</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55 }}>{adv.text}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--line)",
          display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)" }}>Dismiss</button>
          <button style={{ fontSize: 12, padding: "7px 16px", borderRadius: 5, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>Apply recommendations</button>
        </div>
      </div>
    </div>
  );
}

// ── Discover Overlay ───────────────────────────────────────────
const DISCOVER_ITEMS = [
  { color: "#4A90D9", icon: "✦", name: "Watch", desc: "Market signals, competitor moves, and content opportunities." },
  { color: "#F5C642", icon: "◆", name: "Work", desc: "Intake an idea and take it through Watson's full pipeline." },
  { color: "#A080F5", icon: "◉", name: "Wrap", desc: "Package exported content for distribution." },
  { color: "#4CAF82", icon: "▣", name: "The Catalog", desc: "All completed sessions with exported files." },
  { color: "#94A3B8", icon: "◌", name: "The Pipeline", desc: "Parked ideas and watched signals waiting for timing." },
  { color: "#94A3B8", icon: "▤", name: "Project Files", desc: "Voice DNA, Brand Guide, and reference documents." },
];

function DiscoverOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const filtered = DISCOVER_ITEMS.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    d.desc.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,27,42,0.55)",
        zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          width: 680, maxHeight: 540,
          overflowY: "auto",
          padding: "22px 24px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>Discover</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search features..."
          autoFocus
          style={{
            width: "100%",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "var(--font)",
            outline: "none",
            marginBottom: 16,
            color: "var(--fg)",
            background: "var(--bg)",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {filtered.map((item, i) => (
            <div
              key={i}
              onClick={onClose}
              style={{
                padding: 14,
                border: "1px solid var(--line)",
                borderTop: `3px solid ${item.color}`,
                borderRadius: 8,
                cursor: "pointer",
                background: "var(--surface)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: `${item.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, marginBottom: 10, color: item.color,
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)", marginBottom: 3 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
