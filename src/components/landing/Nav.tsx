import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";
  const overHero = !scrolled;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive:true }); fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const bg     = overHero ? "rgba(13,27,42,0.92)" : dark ? "rgba(12,12,10,0.94)" : "rgba(250,250,248,0.94)";
  const bd     = overHero ? "rgba(255,255,255,0.06)" : dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const linkC  = overHero ? "rgba(255,255,255,0.44)" : dark ? "var(--fg-3)" : "var(--fg-3)";
  const linkH  = overHero ? "rgba(255,255,255,0.88)" : dark ? "var(--fg)" : "var(--fg)";

  const LINKS = ["Problem","Framework","Rooms","Checkpoints","Contact"];

  return (
    <nav style={{ position:"sticky", top:0, left:0, right:0, zIndex:200, height:54, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:bg, borderBottom:`1px solid ${bd}`, backdropFilter:"blur(20px)", transition:"background 0.3s ease, border-color 0.3s ease" }}>
      <div>
        <Logo size={18} variant="dark" onClick={() => navigate("/")} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        {LINKS.map(s=>(
          <a key={s} href={`#${s.toLowerCase()}`}
            style={{ fontSize:13, fontWeight:400, color:linkC, textDecoration:"none", fontFamily:"'DM Sans',sans-serif", transition:"color 0.15s", letterSpacing:"-0.01em" }}
            onMouseEnter={e=>(e.currentTarget.style.color=linkH)}
            onMouseLeave={e=>(e.currentTarget.style.color=linkC)}>
            {s}
          </a>
        ))}
        <ThemeToggle onDark={overHero || dark} />
        <a href="/auth" onClick={(e)=>{e.preventDefault();navigate("/auth");}}
          style={{ padding:"8px 20px", borderRadius:8, background:"#F5C642", color:"#0D1B2A", fontSize:13, fontWeight:700, textDecoration:"none", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"'DM Sans',sans-serif", transition:"opacity 0.15s" }}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.88")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
          Open Studio
        </a>
      </div>
    </nav>
  );
}
