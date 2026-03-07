const STATS = [
  { num:"40", label:"Specialized Agents" },
  { num:"12", label:"Output Formats" },
  { num:"07", label:"Quality Gates" },
  { num:"1000", label:"Betterish Maximum" },
  { num:"3", label:"Watch · Work · Wrap" },
];
export default function StatsBar() {
  return (
    <div style={{ background:"var(--bg-secondary)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"44px 36px" }}>
      <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:24, textAlign:"center" }} className="stats-grid">
        {STATS.map((s,i) => (
          <div key={i}>
            <p style={{ fontSize:"clamp(34px,3.5vw,54px)", fontWeight:900, color:"var(--text-primary)", letterSpacing:"-2.5px", lineHeight:1, fontFamily:"'Afacad Flux',sans-serif" }}>{s.num}</p>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", marginTop:10, fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:640px){.stats-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
    </div>
  );
}
