import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
          borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Logo size="md" />
        </button>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
          }}
          className="hidden-mobile"
        >
          {["Watch", "Work", "Wrap", "Voice DNA"].map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item.toLowerCase().replace(" ", "-"))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: scrolled ? "#374151" : "#9ca3af",
                transition: "color 0.2s ease",
                fontFamily: "'Afacad Flux', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = scrolled ? "#0D1B2A" : "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = scrolled ? "#374151" : "#9ca3af")}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: scrolled ? "#374151" : "#9ca3af",
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "color 0.2s ease",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => scrollTo("voice-dna")}
            style={{
              background: "#F5C642",
              color: "#0D1B2A",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "8px 20px",
              borderRadius: 4,
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Nav;
