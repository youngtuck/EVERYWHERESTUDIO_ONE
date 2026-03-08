import { useEffect, useRef, useState, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";

// Pages where sidebar chrome is hidden (full-screen chat)
const FULL_SCREEN = ["/studio/work/", "/studio/work"];

// ── Page transition wrapper ────────────────────────────────────────────────
// Slides in fresh content with a 280ms ease on every route change.
function PageSlide({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(routeKey);
  const [nextKey, setNextKey] = useState(routeKey);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (routeKey === key) {
      setVisible(true);
      return;
    }
    // Fade out old
    setVisible(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setKey(routeKey);
      setNextKey(routeKey);
      setVisible(true);
    }, 120);
    return () => clearTimeout(timerRef.current);
  }, [routeKey]);

  return (
    <div
      key={key}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: visible
          ? "opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)"
          : "opacity 0.10s ease, transform 0.10s ease",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default function StudioShell() {
  const location = useLocation();
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
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
      <StudioSidebar />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        <PageSlide routeKey={location.pathname}>
          <Outlet />
        </PageSlide>
      </main>
    </div>
  );
}
