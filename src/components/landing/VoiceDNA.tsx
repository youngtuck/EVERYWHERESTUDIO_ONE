const LAYERS = [
  { name:"Voice Layer", pct:97, note:"Directness, cadence, signature constructions" },
  { name:"Value Layer", pct:94, note:"Positions, beliefs, what you won't compromise" },
  { name:"Personality Layer", pct:91, note:"Tone, warmth, what makes you memorable" },
];
const VoiceDNA = () => (
  <section style={{ padding:"90px 28px", background:"var(--bg-primary)", borderTop:"1px solid var(--border)" }}>
    <div style={{ maxWidth:1120, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }} className="vdna-grid">
      <div>
        <p className="eyebrow" style={{ marginBottom:18 }}>Voice DNA</p>
        <h2 style={{ fontSize:"clamp(28px,3.5vw,50px)", fontWeight:900, letterSpacing:"-1.5px", color:"var(--text-primary)", marginBottom:22, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0 }}>
          It learns your voice.<br />Permanently.
        </h2>
        <p style={{ fontSize:16, lineHeight:1.78, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:14 }}>
          A 15-minute conversation. Three extracted layers. A Voice Fidelity Score that climbs with every session. The longer you use EVERYWHERE Studio, the more it sounds like you — and only you.
        </p>
        <p style={{ fontSize:14, color:"var(--text-muted)", lineHeight:1.72, fontFamily:"'Afacad Flux',sans-serif" }}>
          Competitors can copy the output format. They cannot copy the system underneath it.
        </p>
      </div>
      <div>
        <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:32 }}>
          <span style={{ fontSize:60, fontWeight:900, color:"#F5C642", letterSpacing:"-3px", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>94.7</span>
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity Score</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:3, fontFamily:"'Afacad Flux',sans-serif" }}>↑ Increases with every session</p>
          </div>
        </div>
        {LAYERS.map((l, i) => (
          <div key={i} style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{l.name}</span>
              <span style={{ fontSize:13, fontWeight:800, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{l.pct}%</span>
            </div>
            <div style={{ height:3, background:"var(--bg-tertiary)", borderRadius:2, marginBottom:6, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${l.pct}%`, background:"#F5C642", borderRadius:2 }} />
            </div>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{l.note}</p>
          </div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:768px){.vdna-grid{grid-template-columns:1fr!important}}`}</style>
  </section>
);
export default VoiceDNA;
