import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import { useMobile } from "../../hooks/useMobile";

/** Studio layout: sidebar + main outlet; full-bleed for work session, fade transition for tab switches. */

// ── Page transition wrapper ────────────────────────────────────────────────
// Opacity-only fade on route change (no movement, no transition: all).
function PageSlide({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  return (
    <div
      key={routeKey}
      style={{
        animation: "studioFadeIn 0.15s ease-out",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default function StudioShell() {
  const location = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Clean up any dark backgrounds from marketing pages (Explore/Index zoom)
  useEffect(() => {
    document.documentElement.style.backgroundColor = "";
    document.body.style.backgroundColor = "";
  }, []);

  const isFullScreen =
    location.pathname === "/studio/work" ||
    location.pathname.startsWith("/studio/work/");

  if (isFullScreen) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F4F2ED", fontFamily: "var(--font)", position: "relative" }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 39,
          }}
        />
      )}
      <div
        style={
          isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                width: 260,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.3s cubic-bezier(.16,1,.3,1)",
                zIndex: 40,
              }
            : {
                position: "relative",
                height: "100vh",
                flexShrink: 0,
                zIndex: 1,
              }
        }
      >
        <StudioSidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
        />
      </div>
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh", position: "relative", zIndex: 1, background: "#F4F2ED" }}>
        {isMobile && (
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 20,
              background: "#F4F2ED",
            }}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--fg-2)",
              }}
              aria-label="Open navigation"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <span style={{ fontSize: 12, color: "var(--fg-3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Studio
            </span>
            <span style={{ width: 32 }} />
          </div>
        )}
        <div className="studio-main-inner">
          <PageSlide routeKey={location.pathname}>
            <Outlet />
          </PageSlide>
        </div>
      </main>
    </div>
  );
}
