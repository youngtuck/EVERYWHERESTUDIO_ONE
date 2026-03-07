import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudioTopBar from "./StudioTopBar";
import StudioSidebar from "./StudioSidebar";

const StudioShell = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="studio-layout">
      <StudioTopBar sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className="studio-body">
        <StudioSidebar collapsed={collapsed} />
        <main className="studio-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default StudioShell;
