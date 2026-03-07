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

  const bg     = overHero ? "rgba(0,0,0,0.42)" : dark ? "rgba(12,12,10,0.94)" : "rgba(250,250,248,0.94)";
  const bd     = overHero ? "rgba(255,255,255,0.06)" : dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const linkC  = overHero ? "rgba(255,255,255,0.44)" : dark ? "var(--fg-3)" : "var(--fg-3)";
  const linkH  = overHero ? "rgba(255,255,255,0.88)" : dark ? "var(--fg)" : "var(--fg)";
  const sigC   = scrolled && !dark ? "var(--fg-2)" : "rgba(255,255,255,0.55)";
  const sigBd  = scrolled && !dark ? "var(--line-2)" : "rgba(255,255,255,0.15)";
  const sigHC  = scrolled && !dark ? "var(--fg)" : "#FFF";
  const sigHBd = scrolled && !dark ? "var(--fg-3)" : "rgba(255,255,255,0.35)";

  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:54, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:bg, borderBottom:`1px solid ${bd}`, backdropFilter:"blur(20px)", transition:"background 0.3s ease, border-color 0.3s ease" }}>
      <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
        <Logo size="md" onDark={overHero || dark} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        {["Watch","Work","Wrap"].map(s=>(
          <a key={s} href={`#${s.toLowerCase()}`}
            style={{ fontSize:13, fontWeight:400, color:linkC, textDecoration:"none", fontFamily:"'DM Sans',sans-serif", transition:"color 0.15s", letterSpacing:"-0.01em" }}
            onMouseEnter={e=>(e.currentTarget.style.color=linkH)}
            onMouseLeave={e=>(e.currentTarget.style.color=linkC)}>
            {s}
          </a>
        ))}
        <ThemeToggle onDark={overHero || dark} />
        <button onClick={()=>navigate("/auth")}
          style={{ background:"transparent", border:`1px solid ${sigBd}`, color:sigC, cursor:"pointer", fontSize:12, fontWeight:400, letterSpacing:"-0.01em", padding:"6px 15px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=sigHBd; e.currentTarget.style.color=sigHC; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=sigBd; e.currentTarget.style.color=sigC; }}>
          Sign in
        </button>
        <button onClick={()=>navigate("/auth")}
          style={{ background:"var(--fg)", color:"var(--bg)", border:"none", cursor:"pointer", fontSize:12, fontWeight:500, letterSpacing:"-0.01em", padding:"7px 16px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", transition:"opacity 0.15s" }}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
          Get access
        </button>
      </div>
    </nav>
  );
}
