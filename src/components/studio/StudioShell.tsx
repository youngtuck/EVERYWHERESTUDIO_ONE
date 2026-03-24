import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import { CommandPalette } from "./CommandPalette";
import MobileBottomNav from "./MobileBottomNav";
import NotificationBell from "./NotificationBell";
import { useMobile } from "../../hooks/useMobile";
import Logo from "../Logo";

export default function StudioShell() {
  const location = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--bg)",
      fontFamily: "'Afacad Flux', sans-serif",
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

      {/* Sidebar */}
      <div
        style={
          isMobile
            ? {
                position: "fixed", top: 0, left: 0, height: "100vh", width: 240,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.15s ease",
                zIndex: 40,
              }
            : {
                position: "relative", height: "100vh",
                width: sidebarCollapsed ? 64 : 240,
                flexShrink: 0, zIndex: 1,
                transition: "width 0.15s ease",
              }
        }
      >
        <StudioSidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
          onMobileClose={isMobile ? () => setSidebarOpen(false) : undefined}
        />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        background: "var(--bg)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--bg)",
          }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", borderRadius: 8,
                padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--fg-2)", minHeight: 44, minWidth: 44,
              }}
              aria-label="Open navigation"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <Logo size="sm" />
            <NotificationBell />
          </div>
        )}

        {/* Page content */}
        <div className="studio-main-inner" style={{ flex: 1, paddingBottom: isMobile ? 80 : 0 }}>
          <div key={location.pathname} className="studio-page-transition">
            <Outlet />
          </div>
        </div>

        {isMobile && <MobileBottomNav />}
      </main>
    </div>
  );
}
