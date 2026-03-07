import Logo from "../Logo";

const Footer = () => {
  return (
    <footer
      style={{
        background: "#0D1B2A",
        padding: "40px 32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <Logo size="sm" />

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          fontFamily: "'Afacad Flux', sans-serif",
          letterSpacing: "0.5px",
        }}
      >
        © 2026 Mixed Grill, LLC · Santa Barbara, CA
      </p>

      <div style={{ display: "flex", gap: 24 }}>
        {["Privacy", "Terms", "Contact"].map((item) => (
          <button
            key={item}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'Afacad Flux', sans-serif",
              letterSpacing: "1px",
              textTransform: "uppercase",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
          >
            {item}
          </button>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
