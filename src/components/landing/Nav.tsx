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

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Always show dark overlay when over the hero area (not yet scrolled)
  const overHero = !scrolled;

  const navBg = overHero
    ? "rgba(0,0,0,0.5)"
    : dark
      ? "rgba(10,10,10,0.96)"
      : "rgba(255,255,255,0.96)";

  const navBorder = overHero
    ? "rgba(255,255,255,0.08)"
    : dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  // Link colors
  const linkC = overHero ? "rgba(255,255,255,0.48)" : dark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.45)";
  const linkH = overHero ? "rgba(255,255,255,0.9)" : dark ? "#FFF" : "#0A0A0A";

  // Sign In button — always ghost on dark background (hero), themed when scrolled
  const signinBorder = scrolled && !dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.18)";
  const signinColor  = scrolled && !dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)";
  const signinHoverB = scrolled && !dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.38)";
  const signinHoverC = scrolled && !dark ? "#0A0A0A" : "#FFF";

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      padding:"0 36px", height:58,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background: navBg, borderBottom:`1px solid ${navBorder}`,
      backdropFilter:"blur(20px)",
      transition:"background 0.35s ease, border-color 0.35s ease",
    }}>
      <div onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
        <Logo size="md" onDark={overHero || dark} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:22 }}>
        {["Watch","Work","Wrap"].map(s => (
          <a key={s} href={`#${s.toLowerCase()}`} style={{ fontSize:12, fontWeight:600, color:linkC, textDecoration:"none", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s", letterSpacing:"0.5px" }}
            onMouseEnter={e=>(e.currentTarget.style.color=linkH)}
            onMouseLeave={e=>(e.currentTarget.style.color=linkC)}
          >{s}</a>
        ))}
        <ThemeToggle />
        <button onClick={() => navigate("/auth")}
          style={{ background:"transparent", border:`1px solid ${signinBorder}`, color:signinColor, cursor:"pointer", fontSize:10, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", padding:"7px 16px", borderRadius:4, fontFamily:"'Afacad Flux',sans-serif", transition:"all 0.2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=signinHoverB; e.currentTarget.style.color=signinHoverC; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=signinBorder; e.currentTarget.style.color=signinColor; }}
        >Sign In</button>
        <button onClick={() => navigate("/auth")}
          style={{ background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", borderRadius:4, fontFamily:"'Afacad Flux',sans-serif", transition:"opacity 0.2s" }}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
        >Get Access</button>
      </div>
    </nav>
  );
}
