import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", background:scrolled?"var(--topbar-bg)":"transparent", borderBottom:scrolled?"1px solid var(--border)":"none", backdropFilter:scrolled?"blur(16px)":"none", transition:"background 0.3s ease, border-color 0.3s ease" }}>
      <Logo size="md" />
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        {["Watch","Work","Wrap"].map(s => (
          <a key={s} href={`#${s.toLowerCase()}`} style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)", textDecoration:"none", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s ease" }}
            onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")}
            onMouseLeave={e=>(e.currentTarget.style.color="var(--text-secondary)")}>{s}</a>
        ))}
        <ThemeToggle />
        <button className="btn-ghost" style={{ fontSize:10, padding:"8px 18px" }} onClick={() => navigate("/auth")}>Sign In</button>
        <button className="btn-primary" style={{ fontSize:10, padding:"8px 18px" }} onClick={() => navigate("/auth")}>Get Access</button>
      </div>
    </nav>
  );
};
export default Nav;
