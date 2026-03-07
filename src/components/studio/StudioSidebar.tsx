import { Eye, PenLine, Package, Library, FolderOpen, Database, Settings, Inbox, Archive } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface Props { collapsed: boolean; }

const NAV = [
  { section: "WATCH", items: [
    { label: "Sentinel Briefings", icon: Eye, path: "/studio/watch" },
  ]},
  { section: "WORK", items: [
    { label: "New Session", icon: PenLine, path: "/studio/work" },
    { label: "Output Library", icon: Library, path: "/studio/outputs" },
  ]},
  { section: "WRAP", items: [
    { label: "Projects", icon: FolderOpen, path: "/studio/projects" },
  ]},
  { section: "STUDIO", items: [
    { label: "Resources", icon: Database, path: "/studio/resources" },
    { label: "The Lot", icon: Inbox, path: "/studio/lot" },
    { label: "Settings", icon: Settings, path: "/studio/settings" },
  ]},
];

const StudioSidebar = ({ collapsed }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className={`studio-sidebar ${collapsed ? "collapsed" : ""}`} style={{ paddingTop: 8 }}>
      {NAV.map(section => (
        <div key={section.section}>
          {!collapsed && (
            <p className="nav-section-label">{section.section}</p>
          )}
          {collapsed && <div style={{ height: 12 }} />}
          {section.items.map(item => {
            const isActive = pathname === item.path || (item.path === "/studio/work" && pathname.startsWith("/studio/work/"));
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`nav-item ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
                style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
                <item.icon size={15} style={{ flexShrink: 0, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      ))}

      {/* Recent sessions — only when expanded */}
      {!collapsed && (
        <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          <p className="nav-section-label" style={{ paddingTop: 0, marginBottom: 4 }}>RECENT</p>
          {["Leadership essay draft", "LinkedIn: AI habits", "Newsletter Mar 3"].map((s, i) => (
            <button key={i} onClick={() => navigate("/studio/work/" + (i+1))} className="nav-item"
              style={{ fontSize: 12, color: "var(--text-muted)", paddingTop: 5, paddingBottom: 5 }}>
              <Archive size={12} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default StudioSidebar;
