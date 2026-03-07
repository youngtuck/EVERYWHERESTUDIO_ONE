import { createContext, useContext, useEffect, useState, ReactNode } from "react";
type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const s = localStorage.getItem("ew-theme"); if (s === "light" || s === "dark") return s; } catch {}
    return "dark";
  });
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("ew-theme", theme); }, [theme]);
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);
