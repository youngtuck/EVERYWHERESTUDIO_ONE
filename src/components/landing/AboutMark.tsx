export default function AboutMark() {
  return (
    <section style={{ padding:"96px 36px", background:"var(--bg-secondary)", borderTop:"1px solid var(--border)" }}>
      <div style={{ maxWidth:940, margin:"0 auto", display:"grid", gridTemplateColumns:"auto 1fr", gap:56, alignItems:"start" }} className="mark-grid">
        <div style={{ width:84, height:84, borderRadius:14, background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"2px solid rgba(245,198,66,0.28)", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
          <span style={{ fontSize:26, fontWeight:900, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-1.5px" }}>MS</span>
        </div>
        <div>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:14 }}>The Founder</p>
          <h2 style={{ fontSize:"clamp(22px,2.8vw,38px)", fontWeight:900, letterSpacing:"-1px", color:"var(--text-primary)", marginBottom:22, fontFamily:"'Afacad Flux',sans-serif" }}>Mark Sylvester</h2>
          <div style={{ padding:"22px 28px", background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:8, borderLeft:"3px solid #F5C642", marginBottom:22 }}>
            <p style={{ fontSize:16, lineHeight:1.82, color:"var(--text-primary)", fontStyle:"italic", fontFamily:"'Afacad Flux',sans-serif" }}>
              "I spent years helping others find and share their voice. EVERYWHERE Studio is what I wish I'd had. It doesn't replace the thinking — it removes every obstacle between the thinking and the audience."
            </p>
          </div>
          <p style={{ fontSize:14, lineHeight:1.78, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>
            Executive producer, TEDxSantaBarbara. Entrepreneur. Founder of Mixed Grill LLC. Student of what makes ideas spread and what makes experts invisible — and determined to fix the latter.
          </p>
        </div>
      </div>
      <style>{`@media(max-width:600px){.mark-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
