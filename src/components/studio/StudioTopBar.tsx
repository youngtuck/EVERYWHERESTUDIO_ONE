import { useState } from "react";
import { PenLine, Settings } from "lucide-react";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const ZOOM_LEVELS = [90, 100, 115, 130, 150];

interface Props { onToggleSidebar: () => void; }

export default function StudioTopBar({ onToggleSidebar }: Props) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [zoomIndex, setZoomIndex] = useState(1);

  function adjustZoom() {
    const next = (zoomIndex + 1) % ZOOM_LEVELS.length;
    setZoomIndex(next);
    document.body.style.zoom = String(ZOOM_LEVELS[next] / 100);
  }

  return (
    <div className="studio-topbar">
      <div onClick={() => navigate("/")} style={{ cursor:"pointer" }} title="Go to homepage">
        <Logo size="sm" variant={dark ? "dark" : "light"} />
      </div>

      <div style={{ width:1, height:16, background:"var(--border)", margin:"0 4px" }} />

      <button title="Switch project" style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"4px 8px", borderRadius:5, color:"var(--text-muted)", fontSize:12, fontFamily:"'Afacad Flux', sans-serif", fontWeight:450, letterSpacing:"-0.01em", transition:"color 0.15s ease" }}
        onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")}
        onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
        Mark's Studio<span style={{ fontSize:10, opacity:0.5 }}>▾</span>
      </button>

      <div style={{ flex:1 }} />

      <button onClick={adjustZoom} title={`Text size: ${ZOOM_LEVELS[zoomIndex]}%`} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 2, fontSize: 12, color: 'var(--text-secondary)', transition: 'all 0.15s ease' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-default)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border-subtle)";}}>
        <span style={{ fontSize: 11 }}>A</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>A</span>
      </button>

      <ThemeToggle />

      <button onClick={() => navigate("/studio/settings")}
        title="Settings"
        style={{ background:"none", border:"none", cursor:"pointer", padding:"5px", borderRadius:5, color:"var(--text-muted)", display:"flex", transition:"color 0.15s" }}
        onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
        <Settings size={14} />
      </button>

      <button onClick={() => navigate("/studio/work")}
        title="Start a new Watson session"
        style={{ background:"var(--text-primary)", color:"var(--bg-primary)", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:6, fontFamily:"'Afacad Flux', sans-serif", display:"flex", alignItems:"center", gap:6, transition:"opacity 0.15s", letterSpacing:"-0.01em" }}
        onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
        <PenLine size={11} />New session
      </button>
    </div>
  );
}
