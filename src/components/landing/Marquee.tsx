const ITEMS = [
  "Watch · Work · Wrap",
  "40 AI Agents",
  "7 Quality Gates",
  "12 Output Formats",
  "Voice DNA Technology",
  "Orchestrated Intelligence",
  "One Idea. Everywhere.",
  "Ideas to Impact",
  "Platform-Native Content",
  "Always In Your Voice",
];

const Marquee = () => {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div style={{
      background: "#0A0A0A",
      borderTop: "1px solid #1A1A1A",
      borderBottom: "1px solid #1A1A1A",
      padding: "14px 0",
      overflow: "hidden",
      position: "relative",
    }}>
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 28,
            paddingRight: 28,
            fontSize: 10, fontWeight: 700, letterSpacing: "3px",
            textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
            fontFamily: "'Afacad Flux', sans-serif",
            whiteSpace: "nowrap",
          }}>
            {item}
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#F5C642", display: "inline-block" }} />
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
