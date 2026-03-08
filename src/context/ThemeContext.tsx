import { createContext, useContext, useEffect, useState, ReactNode } from "react";
type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; toggleTheme: () => void; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggleTheme: () => {}, toggle: () => {} });
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const s = localStorage.getItem("ew-theme"); if (s === "light" || s === "dark") return s; } catch {}
    return "light"; // default to light
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ew-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, toggleTheme, toggle: toggleTheme }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);
