import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudioTopBar from "./StudioTopBar";
import StudioSidebar from "./StudioSidebar";

export default function StudioShell() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <StudioTopBar onToggleSidebar={() => setCollapsed(c => !c)} />
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <StudioSidebar collapsed={collapsed} />
        <main className="studio-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
