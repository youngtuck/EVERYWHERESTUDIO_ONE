import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 32px", height: 58,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      // Always dark on hero — transitions to themed when scrolled past hero
      background: scrolled ? "var(--topbar-bg)" : "rgba(10,10,10,0.6)",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)",
      transition: "background 0.4s ease, border-color 0.4s ease",
    }}>
      <Logo size="md" />
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        {["Watch","Work","Wrap"].map(s => (
          <a key={s} href={`#${s.toLowerCase()}`}
            style={{ fontSize:12, fontWeight:600, color: scrolled ? "var(--text-secondary)" : "rgba(255,255,255,0.45)", textDecoration:"none", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s", letterSpacing:"0.5px" }}
            onMouseEnter={e=>(e.currentTarget.style.color=scrolled?"var(--text-primary)":"rgba(255,255,255,0.85)")}
            onMouseLeave={e=>(e.currentTarget.style.color=scrolled?"var(--text-secondary)":"rgba(255,255,255,0.45)")}
          >{s}</a>
        ))}
        <ThemeToggle />
        <button
          className="btn-ghost"
          style={{ fontSize:10, padding:"7px 16px", borderColor:"rgba(255,255,255,0.18)", color:"rgba(255,255,255,0.5)" }}
          onClick={() => navigate("/auth")}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.4)"; e.currentTarget.style.color="rgba(255,255,255,0.8)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.18)"; e.currentTarget.style.color="rgba(255,255,255,0.5)"; }}
        >Sign In</button>
        <button
          style={{ background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"8px 18px", borderRadius:4, fontFamily:"'Afacad Flux',sans-serif", transition:"opacity 0.2s" }}
          onClick={() => navigate("/auth")}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
        >Get Access</button>
      </div>
    </nav>
  );
};
export default Nav;
