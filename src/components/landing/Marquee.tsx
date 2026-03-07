import { useTheme } from "../../context/ThemeContext";
const ITEMS = ["Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio","Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio"];
export default function Marquee() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return (
    <div style={{ overflow:"hidden", borderTop:`1px solid ${dark?"rgba(255,255,255,0.06)":"var(--border)"}`, borderBottom:`1px solid ${dark?"rgba(255,255,255,0.06)":"var(--border)"}`, padding:"11px 0", background:dark?"#050505":"var(--bg-secondary)" }}>
      <div className="marquee-track">
        {ITEMS.map((item,i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:18, padding:"0 18px", fontSize:9, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:dark?"rgba(255,255,255,0.16)":"rgba(0,0,0,0.3)", fontFamily:"'Afacad Flux',sans-serif", whiteSpace:"nowrap" }}>
            {item}<span style={{ color:"rgba(245,198,66,0.45)", fontSize:6 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
