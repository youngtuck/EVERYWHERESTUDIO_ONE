import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const linkColor = scrolled ? "#2A2A2A" : "rgba(255,255,255,0.4)";
  const linkHover = scrolled ? "#0A0A0A" : "#ffffff";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 58,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px",
      background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
      borderBottom: scrolled ? "1px solid #E8E8E8" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      transition: "background 0.35s ease, border-color 0.35s ease",
    }}>
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <Logo size="md" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links">
        {[["watch", "Watch"], ["work", "Work"], ["voice-dna", "Voice DNA"], ["wrap", "Pricing"]].map(([id, label]) => (
          <button key={id} onClick={() => go(id)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
            textTransform: "uppercase", color: linkColor,
            fontFamily: "'Afacad Flux', sans-serif",
            transition: "color 0.2s ease",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
            onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
          >{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate("/auth")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
          textTransform: "uppercase", color: linkColor,
          fontFamily: "'Afacad Flux', sans-serif",
          transition: "color 0.2s ease",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
          onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
        >Sign In</button>

        <button onClick={() => go("voice-dna")} style={{
          background: scrolled ? "#0A0A0A" : "rgba(255,255,255,0.08)",
          color: scrolled ? "#ffffff" : "rgba(255,255,255,0.8)",
          border: scrolled ? "1px solid #0A0A0A" : "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
          textTransform: "uppercase", padding: "8px 18px",
          borderRadius: 4, fontFamily: "'Afacad Flux', sans-serif",
          transition: "all 0.25s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >Get Started</button>
      </div>

      <style>{`
        @media (max-width: 700px) { .nav-links { display: none !important; } }
      `}</style>
    </nav>
  );
};

export default Nav;
