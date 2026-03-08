import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";

// Work sessions get the full viewport (no sidebar chrome)
const FULL_SCREEN_PATHS = ["/studio/work/"];

export default function StudioShell() {
  const location = useLocation();
  const isFullScreen = FULL_SCREEN_PATHS.some(p => location.pathname.startsWith(p));

  if (isFullScreen) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)" }}>
      <StudioSidebar />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}
