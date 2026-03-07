import { useState } from "react";
import { Menu, ChevronDown, LogOut, Settings, User } from "lucide-react";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";
import { useNavigate } from "react-router-dom";

interface Props { sidebarCollapsed: boolean; onToggleSidebar: () => void; }

const PROJECTS = ["My Studio", "TEDx Content", "Book Project"];

const StudioTopBar = ({ sidebarCollapsed, onToggleSidebar }: Props) => {
  const [activeProject, setActiveProject] = useState("My Studio");
  const [projectOpen, setProjectOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="studio-topbar" style={{ position:"relative", zIndex:40 }}>
      {/* Left */}
      <button onClick={onToggleSidebar} title="Toggle sidebar"
        style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:"4px", display:"flex", flexShrink:0 }}>
        <Menu size={18} />
      </button>
      <button onClick={() => navigate("/studio/dashboard")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}>
        <Logo size="sm" />
      </button>

      {/* Project switcher */}
      <div style={{ position:"relative", marginLeft:8 }}>
        <button onClick={() => { setProjectOpen(p=>!p); setUserOpen(false); }}
          style={{ display:"flex", alignItems:"center", gap:6, background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:5, padding:"5px 10px", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", whiteSpace:"nowrap" }}>
          {activeProject} <ChevronDown size={12} style={{ color:"var(--text-muted)" }} />
        </button>
        {projectOpen && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:7, padding:"4px", minWidth:180, zIndex:100, boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
            {PROJECTS.map(p => (
              <button key={p} onClick={() => { setActiveProject(p); setProjectOpen(false); }}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:activeProject===p?700:400, color:activeProject===p?"var(--text-primary)":"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", borderRadius:5 }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-secondary)")}
                onMouseLeave={e=>(e.currentTarget.style.background="none")}
              >{p}</button>
            ))}
            <div style={{ height:1, background:"var(--border)", margin:"4px 0" }} />
            <button style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", borderRadius:5 }}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-secondary)")}
              onMouseLeave={e=>(e.currentTarget.style.background="none")}>
              + New Project
            </button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex:1 }} />

      {/* Voice Fidelity Score */}
      <button onClick={() => navigate("/studio/resources")} title="Voice Fidelity Score — click to view Voice DNA"
        style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(245,198,66,0.06)", border:"1px solid rgba(245,198,66,0.18)", borderRadius:5, padding:"5px 10px", cursor:"pointer" }}
        className="hide-mobile">
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity</span>
        <span style={{ fontSize:14, fontWeight:800, color:"#F5C642", letterSpacing:"-0.5px", fontFamily:"'Afacad Flux',sans-serif" }}>94.7</span>
      </button>

      <ThemeToggle />

      {/* User menu */}
      <div style={{ position:"relative" }}>
        <button onClick={() => { setUserOpen(p=>!p); setProjectOpen(false); }}
          style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"1px solid var(--border)", borderRadius:5, padding:"5px 8px", cursor:"pointer", color:"var(--text-secondary)" }}>
          <User size={14} />
          <span style={{ fontSize:12, fontWeight:600, fontFamily:"'Afacad Flux',sans-serif", color:"var(--text-primary)" }} className="hide-mobile">Mark</span>
          <ChevronDown size={12} />
        </button>
        {userOpen && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:7, padding:"4px", minWidth:160, zIndex:100, boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ padding:"8px 12px 6px", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>Mark Sylvester</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>mark@mixedgrill.net</p>
            </div>
            {[["Settings", Settings, "/studio/settings"], ["Sign Out", LogOut, "/auth"]].map(([label, Icon, path]) => (
              <button key={label as string} onClick={() => { setUserOpen(false); navigate(path as string); }}
                style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", padding:"8px 12px", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", borderRadius:5 }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-secondary)")}
                onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                <Icon size={13} /> {label as string}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default StudioTopBar;
