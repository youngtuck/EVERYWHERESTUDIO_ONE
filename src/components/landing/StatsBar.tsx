const STATS = [
  { num:"40", label:"Specialized agents" },
  { num:"12", label:"Output formats" },
  { num:"07", label:"Quality checkpoints" },
  { num:"1000", label:"Betterish maximum" },
  { num:"3", label:"Layers" },
];
export default function StatsBar() {
  return (
    <div style={{ background:"var(--bg-2)", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)", padding:"48px 32px" }}>
      <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:20 }} className="stats-g">
        {STATS.map((s,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"'Montserrat', sans-serif", fontSize:"clamp(36px,3.5vw,56px)", fontWeight:400, color:"var(--fg)", letterSpacing:"-1.5px", lineHeight:1 }}>{s.num}</p>
            <p style={{ fontSize:13, fontWeight:400, color:"var(--fg-3)", marginTop:8, fontFamily:"'Montserrat', sans-serif" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:640px){.stats-g{grid-template-columns:repeat(3,1fr)!important}}`}</style>
    </div>
  );
}
