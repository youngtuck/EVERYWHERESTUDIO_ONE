import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface Props { size?: number; onDark?: boolean; }
const ThemeToggle = ({ size = 15, onDark = false }: Props) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark" || onDark;
  return (
    <button onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background:"none",
        border:`1px solid ${isDark ? "rgba(255,255,255,0.18)" : "var(--border-strong)"}`,
        borderRadius:5, cursor:"pointer", padding:"6px",
        display:"flex", alignItems:"center", justifyContent:"center",
        color: isDark ? "rgba(255,255,255,0.5)" : "var(--text-secondary)",
        transition:"all 0.2s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.4)" : "var(--text-primary)"; e.currentTarget.style.color = isDark ? "#FFF" : "var(--text-primary)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.18)" : "var(--border-strong)"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "var(--text-secondary)"; }}
    >
      {theme === "dark" ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
};
export default ThemeToggle;
