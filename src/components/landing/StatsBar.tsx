const STATS = [
  { num:"40", label:"Specialized Agents" },
  { num:"12", label:"Output Formats" },
  { num:"07", label:"Quality Gates" },
  { num:"1000", label:"Betterish Maximum" },
  { num:"3", label:"Layers — Watch Work Wrap" },
];
const StatsBar = () => (
  <div style={{ background:"var(--bg-secondary)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"28px" }}>
    <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:20 }} className="stats-grid">
      {STATS.map(s => (
        <div key={s.num} style={{ textAlign:"center" }}>
          <p style={{ fontSize:"clamp(28px,3vw,42px)", fontWeight:900, color:"var(--text-primary)", letterSpacing:"-2px", lineHeight:1, fontFamily:"'Afacad Flux',sans-serif" }}>{s.num}</p>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text-muted)", marginTop:6, fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</p>
        </div>
      ))}
    </div>
    <style>{`@media(max-width:700px){.stats-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
  </div>
);
export default StatsBar;
