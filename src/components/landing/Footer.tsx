import Logo from "../Logo";

const Footer = () => (
  <footer style={{
    background: "#0A0A0A",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "36px 32px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 16,
  }}>
    <Logo size="sm" />
    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "0.5px" }}>
      © 2026 Mixed Grill, LLC · Santa Barbara, CA
    </p>
    <div style={{ display: "flex", gap: 24 }}>
      {["Privacy", "Terms", "Contact"].map(item => (
        <button key={item} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 10, color: "rgba(255,255,255,0.18)",
          fontFamily: "'Afacad Flux', sans-serif",
          letterSpacing: "1.5px", textTransform: "uppercase",
          transition: "color 0.2s ease",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
        >{item}</button>
      ))}
    </div>
  </footer>
);

export default Footer;
