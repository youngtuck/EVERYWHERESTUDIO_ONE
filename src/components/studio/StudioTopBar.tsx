import { PenLine, Settings } from "lucide-react";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface Props { onToggleSidebar: () => void; }

export default function StudioTopBar({ onToggleSidebar }: Props) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="studio-topbar">
      <div onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
        <Logo size="sm" onDark={dark} />
      </div>

      <div style={{ width:1, height:16, background:"var(--border)", margin:"0 4px" }} />

      <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:"4px 8px", borderRadius:5, color:"var(--text-muted)", fontSize:12, fontFamily:"'Geist',sans-serif", fontWeight:450, letterSpacing:"-0.01em" }}>
        Mark's Studio<span style={{ fontSize:8, opacity:0.5 }}>▾</span>
      </button>

      <div style={{ flex:1 }} />

      <ThemeToggle />

      <button onClick={() => navigate("/studio/settings")}
        style={{ background:"none", border:"none", cursor:"pointer", padding:"5px", borderRadius:5, color:"var(--text-muted)", display:"flex", transition:"color 0.15s" }}
        onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
        <Settings size={14} />
      </button>

      <button onClick={() => navigate("/studio/work")}
        style={{ background:"var(--text-primary)", color:"var(--bg-primary)", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:6, fontFamily:"'Geist',sans-serif", display:"flex", alignItems:"center", gap:6, transition:"opacity 0.15s", letterSpacing:"-0.01em" }}
        onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
        <PenLine size={11} />New session
      </button>
    </div>
  );
}
