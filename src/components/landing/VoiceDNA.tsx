const LAYERS = [
  { name:"Voice Layer", desc:"How you speak — rhythm, sentence length, vocabulary, punctuation patterns", pct:97, note:"Directness, cadence, signature constructions" },
  { name:"Value Layer", desc:"What you stand for — core beliefs, professional principles, ethical lines", pct:94, note:"Positions, politics, what you won't compromise" },
  { name:"Personality Layer", desc:"How you show up — humor, warmth, edge, the texture of your presence", pct:91, note:"Tone, cultural markers, what makes you memorable" },
];
const VoiceDNA = () => (
  <section style={{ padding:"80px 28px", background:"var(--bg-primary)" }}>
    <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center" }} className="vdna-grid">
      <div>
        <p className="eyebrow" style={{ marginBottom:16 }}>Voice DNA</p>
        <h2 style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:900, letterSpacing:"-1.5px", color:"var(--text-primary)", marginBottom:20, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.05 }}>
          It learns your voice.<br />Permanently.
        </h2>
        <p style={{ fontSize:16, lineHeight:1.75, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:16 }}>
          A 15-minute conversation. Three extracted layers. A Voice Fidelity Score that climbs with every session. The longer you use EVERYWHERE Studio, the more it sounds like you — and only you.
        </p>
        <p style={{ fontSize:14, color:"var(--text-muted)", lineHeight:1.7, fontFamily:"'Afacad Flux',sans-serif" }}>
          This is not a style setting. Competitors can copy the output format. They cannot copy the system underneath it.
        </p>
      </div>
      <div>
        <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:28 }}>
          <span style={{ fontSize:56, fontWeight:900, color:"#F5C642", letterSpacing:"-3px", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>94.7</span>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity Score</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>↑ Increases with every session</p>
          </div>
        </div>
        {LAYERS.map((l, i) => (
          <div key={i} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{l.name}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{l.pct}%</span>
            </div>
            <div style={{ height:3, background:"var(--bg-tertiary)", borderRadius:2, marginBottom:5, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${l.pct}%`, background:"linear-gradient(90deg,#F5C642,#F5C642aa)", borderRadius:2 }} />
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
