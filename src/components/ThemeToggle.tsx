import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface Props { size?: number; }

const ThemeToggle = ({ size = 16 }: Props) => {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background: "none", border: "1px solid var(--border)", borderRadius: 5,
        cursor: "pointer", padding: "6px", display: "flex", alignItems: "center",
        justifyContent: "center", color: "var(--text-secondary)",
        transition: "border-color 0.2s ease, color 0.2s ease",
      }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "var(--border-strong)"; el.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)"; }}
    >
      {theme === "dark" ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
};
export default ThemeToggle;
