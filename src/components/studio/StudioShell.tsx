import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import { CommandPalette } from "./CommandPalette";
import { useMobile } from "../../hooks/useMobile";

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
    document.body.style.backgroundColor = "#F7F9FC";
    document.body.style.transition = "none";
    document.documentElement.style.background = "";
    document.documentElement.style.backgroundImage = "none";
    document.documentElement.style.backgroundColor = "#F7F9FC";
    document.documentElement.style.transition = "none";
    if (root) {
      root.style.background = "";
      root.style.backgroundImage = "none";
      root.style.backgroundColor = "#F7F9FC";
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
    <footer style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, color: "rgba(0,0,0,0.3)", textAlign: "center", padding: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      EVERYWHERE STUDIO (tm) 2026, Mixed Grill, LLC, v6.5 Alpha
    </footer>
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#F7F9FC", fontFamily: "'Afacad Flux', sans-serif", position: "relative", overflow: "hidden", transition: "none" }}>
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
      <main style={{ flex: 1, minHeight: "100vh", background: "#F7F9FC", overflowY: "auto", position: "relative", zIndex: 1, padding: 0, transition: "none", display: "flex", flexDirection: "column" }}>
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
              background: "#F7F9FC",
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
        <div className="studio-main-inner" style={{ background: "#F7F9FC", flex: 1 }}>
          <div key={location.pathname} className="studio-page-transition">
            <Outlet />
          </div>
        </div>
        {studioFooter}
      </main>
    </div>
  );
}
