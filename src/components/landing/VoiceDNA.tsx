const LAYERS = [
  { name:"Voice Layer", pct:97, note:"Directness, cadence, signature constructions" },
  { name:"Value Layer", pct:94, note:"Positions, beliefs, what you won't compromise" },
  { name:"Personality Layer", pct:91, note:"Tone, warmth, what makes you memorable" },
];
export default function VoiceDNA() {
  return (
    <section style={{ padding:"96px 36px", background:"var(--bg-primary)", borderTop:"1px solid var(--border)" }}>
      <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }} className="vdna-grid">
        <div>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:18 }}>Voice DNA</p>
          <h2 style={{ fontSize:"clamp(28px,3.5vw,54px)", fontWeight:900, letterSpacing:"-2px", color:"var(--text-primary)", marginBottom:24, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0 }}>
            It learns your voice.<br />Permanently.
          </h2>
          <p style={{ fontSize:16, lineHeight:1.8, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:16 }}>
            A 15-minute conversation. Three extracted layers. A Voice Fidelity Score that climbs with every session. The longer you use EVERYWHERE Studio, the more it sounds like you — and only you.
          </p>
          <p style={{ fontSize:14, color:"var(--text-muted)", lineHeight:1.72, fontFamily:"'Afacad Flux',sans-serif" }}>
            Competitors can copy the output format. They cannot copy the system underneath it.
          </p>
        </div>
        <div>
          {/* Score */}
          <div style={{ display:"flex", alignItems:"baseline", gap:14, marginBottom:40, padding:"24px 28px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10, borderLeft:"3px solid #F5C642" }}>
            <span style={{ fontSize:68, fontWeight:900, color:"#F5C642", letterSpacing:"-3.5px", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>94.7</span>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity Score</p>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:5, fontFamily:"'Afacad Flux',sans-serif" }}>↑ Sharpens with every session</p>
            </div>
          </div>
          {/* Layers */}
          {LAYERS.map((l,i) => (
            <div key={i} style={{ marginBottom:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{l.name}</span>
                <span style={{ fontSize:14, fontWeight:800, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{l.pct}%</span>
              </div>
              <div style={{ height:4, background:"var(--bg-tertiary)", borderRadius:2, marginBottom:7, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${l.pct}%`, background:"linear-gradient(90deg,#F5C642,#E8B800)", borderRadius:2 }} />
              </div>
              <p style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{l.note}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:800px){.vdna-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
