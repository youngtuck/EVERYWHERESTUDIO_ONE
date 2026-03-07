import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
interface Props { onDark?: boolean; }
const ThemeToggle = ({ onDark = false }: Props) => {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark" || onDark;
  return (
    <button onClick={toggle}
      style={{ background:"none", border:`1px solid ${dark?"rgba(255,255,255,0.14)":"var(--line-2)"}`, borderRadius:6, cursor:"pointer", padding:"5px 7px", display:"flex", alignItems:"center", justifyContent:"center", color:dark?"rgba(255,255,255,0.4)":"var(--fg-3)", transition:"all 0.15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=dark?"rgba(255,255,255,0.32)":"var(--fg-3)"; e.currentTarget.style.color=dark?"rgba(255,255,255,0.8)":"var(--fg)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=dark?"rgba(255,255,255,0.14)":"var(--line-2)"; e.currentTarget.style.color=dark?"rgba(255,255,255,0.4)":"var(--fg-3)"; }}>
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
};
export default ThemeToggle;
