import { useEffect, useRef, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import { useMobile } from "../../hooks/useMobile";

// ── Page transition wrapper ────────────────────────────────────────────────
// Light, single-direction enter animation on route change (no fade-to-empty).
function PageSlide({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  return (
    <div
      key={routeKey}
      style={{
        opacity: 1,
        transform: "translateY(0)",
        animation: "studioPageEnter 0.24s cubic-bezier(0.16,1,0.3,1)",
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

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

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
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", fontFamily: "var(--font)", position: "relative" }}>
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
        <StudioSidebar />
      </div>
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh", position: "relative", zIndex: 1 }}>
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
              background: "var(--bg)",
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
