const ITEMS = ["Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio","Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio"];
const Marquee = ({ inverted = false }: { inverted?: boolean }) => (
  <div style={{
    overflow: "hidden",
    borderTop: `1px solid ${inverted ? "rgba(255,255,255,0.07)" : "var(--border)"}`,
    borderBottom: `1px solid ${inverted ? "rgba(255,255,255,0.07)" : "var(--border)"}`,
    padding: "12px 0",
    background: inverted ? "#080808" : "var(--bg-tertiary)",
  }}>
    <div className="marquee-track">
      {ITEMS.map((item, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 20,
          padding: "0 20px",
          fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase",
          color: inverted ? "rgba(255,255,255,0.2)" : "var(--text-muted)",
          fontFamily: "'Afacad Flux',sans-serif", whiteSpace: "nowrap",
        }}>
          {item}
          <span style={{ color: inverted ? "rgba(245,198,66,0.35)" : "rgba(245,198,66,0.45)", fontSize:7 }}>◆</span>
        </span>
      ))}
    </div>
  </div>
);
export default Marquee;
