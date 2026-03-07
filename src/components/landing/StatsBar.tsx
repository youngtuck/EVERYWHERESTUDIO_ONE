const STATS = [
  { value: "40", label: "AI Agents" },
  { value: "12", label: "Output Formats" },
  { value: "7", label: "Quality Gates" },
  { value: "15min", label: "To Voice DNA" },
  { value: "100%", label: "Your Voice" },
];

const StatsBar = () => (
  <section style={{ background: "#F8F8F8", borderTop: "1px solid #E8E8E8", borderBottom: "1px solid #E8E8E8", padding: "52px 24px" }}>
    <div style={{
      maxWidth: 1080, margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 32,
    }} className="stats-inner">
      {STATS.map((s, i) => (
        <div key={s.label} className="fade-in" style={{ transitionDelay: `${i * 60}ms`, textAlign: "center", flex: "1 1 140px" }}>
          <p style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-2px", lineHeight: 1, marginBottom: 6, fontFamily: "'Afacad Flux', sans-serif" }}>{s.value}</p>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#BBBBBB", fontFamily: "'Afacad Flux', sans-serif" }}>{s.label}</p>
        </div>
      ))}
    </div>
    <style>{`@media(max-width:500px){.stats-inner{gap:24px!important;justify-content:center!important}}`}</style>
  </section>
);

export default StatsBar;
