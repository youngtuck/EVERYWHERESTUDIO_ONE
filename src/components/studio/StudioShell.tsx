import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import { CommandPalette } from "./CommandPalette";
import MobileBottomNav from "./MobileBottomNav";
import NotificationBell from "./NotificationBell";
import { useMobile } from "../../hooks/useMobile";
import Logo from "../Logo";

/** Studio layout: sidebar + main outlet; full-bleed for work session. No transition on tab switch to avoid flash. */

export default function StudioShell() {
  const location = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Lock studio background and disable transitions on root/body to prevent black flash on tab switch
  useEffect(() => {
    const root = document.getElementById("root");
    document.body.style.background = "";
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "";
    document.body.style.transition = "none";
    document.documentElement.style.background = "";
    document.documentElement.style.backgroundImage = "none";
    document.documentElement.style.backgroundColor = "";
    document.documentElement.style.transition = "none";
    if (root) {
      root.style.background = "";
      root.style.backgroundImage = "none";
      root.style.backgroundColor = "";
      root.style.transition = "none";
    }
    return () => {
      document.body.style.background = "";
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
      document.body.style.transition = "";
      document.documentElement.style.background = "";
      document.documentElement.style.backgroundImage = "";
      document.documentElement.style.backgroundColor = "";
      document.documentElement.style.transition = "";
      if (root) {
        root.style.background = "";
        root.style.backgroundImage = "";
        root.style.backgroundColor = "";
        root.style.transition = "";
      }
    };
  }, []);

  const studioFooter = (
    <footer style={{
      fontFamily: "'Afacad Flux', sans-serif",
      fontSize: 12,
      color: "var(--fg-3)",
      textAlign: "center",
      padding: "20px 24px",
      width: "100%",
      flexShrink: 0,
      borderTop: "1px solid var(--line)",
      background: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    }}>
      <Logo size="sm" variant="light" />
      <span>™ 2026, Mixed Grill, LLC, v6.5 Alpha</span>
    </footer>
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg-2)", fontFamily: "'Afacad Flux', sans-serif", position: "relative", overflow: "hidden", transition: "none" }}>
      <CommandPalette />
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
                width: 240,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.3s cubic-bezier(.16,1,.3,1)",
                zIndex: 40,
              }
            : {
                position: "relative",
                height: "100vh",
                width: sidebarCollapsed ? 60 : 240,
                flexShrink: 0,
                zIndex: 1,
                transition: "width 0.2s ease",
              }
        }
      >
        <StudioSidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
          onMobileClose={isMobile ? () => setSidebarOpen(false) : undefined}
        />
      </div>
      <main style={{ flex: 1, minHeight: "100vh", background: "var(--bg-2)", overflowY: "auto", position: "relative", zIndex: 1, padding: 0, transition: "none", display: "flex", flexDirection: "column" }}>
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
              background: "var(--bg-2)",
              backdropFilter: "blur(12px)",
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
                minHeight: 44,
                minWidth: 44,
              }}
              aria-label="Open navigation"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <Logo size="sm" variant="light" />
            <NotificationBell />
          </div>
        )}
        <div className="studio-main-inner" style={{ background: "var(--bg-2)", flex: 1, paddingBottom: isMobile ? 80 : 0 }}>
          <div key={location.pathname} className="studio-page-transition">
            <Outlet />
          </div>
        </div>
        {!isMobile && !/^\/studio\/work(\/|$)/.test(location.pathname) && studioFooter}
        {isMobile && <MobileBottomNav />}
      </main>
    </div>
  );
}
