import { NavLink } from "react-router-dom";
import { Eye, PenLine, Package, FolderOpen, BookOpen, Layers, Settings, Grid } from "lucide-react";

const NAV = [
  { section: "Studio", items: [
    { label:"Dashboard", icon:Grid, to:"/studio/dashboard" },
    { label:"New Session", icon:PenLine, to:"/studio/work" },
  ]},
  { section: "Review", items: [
    { label:"Watch", icon:Eye, to:"/studio/watch" },
    { label:"Outputs", icon:Package, to:"/studio/outputs" },
    { label:"Projects", icon:FolderOpen, to:"/studio/projects" },
  ]},
  { section: "Configure", items: [
    { label:"Resources", icon:BookOpen, to:"/studio/resources" },
    { label:"The Lot", icon:Layers, to:"/studio/lot" },
    { label:"Settings", icon:Settings, to:"/studio/settings" },
  ]},
];

interface Props { collapsed: boolean; }
export default function StudioSidebar({ collapsed }: Props) {
  return (
    <div className={`studio-sidebar${collapsed?" collapsed":""}`}>
      <div style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom:4 }}>
            {!collapsed && (
              <p className="nav-section-label">{group.section}</p>
            )}
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({isActive}) => `nav-item${isActive?" active":""}`}
                style={{ display:"flex", alignItems:"center", gap:9 }}>
                <item.icon size={14} style={{ flexShrink:0 }} />
                {!collapsed && <span style={{ fontFamily:"'Geist',sans-serif", letterSpacing:"-0.01em" }}>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
