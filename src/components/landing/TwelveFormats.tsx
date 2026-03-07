const FORMATS = [
  { name:"LinkedIn Post", desc:"Native. CTA-optimized." },
  { name:"Newsletter", desc:"Story-forward. Audience-tuned." },
  { name:"Sunday Story", desc:"10 pieces, one session." },
  { name:"Podcast Script", desc:"SSML-ready." },
  { name:"Twitter Thread", desc:"Hook, build, land." },
  { name:"Essay", desc:"1200–2000 words, referenced." },
  { name:"Short Video", desc:"Script, hook, caption." },
  { name:"Substack Note", desc:"Brief. Personal. Punchy." },
  { name:"Talk Outline", desc:"Built for the stage." },
  { name:"Email Campaign", desc:"Sequence with intent." },
  { name:"Blog Post", desc:"SEO-optimized." },
  { name:"Executive Brief", desc:"Decision-ready." },
];
export default function TwelveFormats() {
  return (
    <section style={{ padding:"100px 32px", background:"var(--bg)", borderTop:"1px solid var(--line)" }}>
      <div style={{ maxWidth:1160, margin:"0 auto" }}>
        <div style={{ maxWidth:480, marginBottom:64 }}>
          <p className="eyebrow" style={{ marginBottom:20 }}>Output Formats</p>
          <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(32px,3.8vw,56px)", fontWeight:400, letterSpacing:"-0.5px", color:"var(--fg)", lineHeight:1.08 }}>
            One idea,<br /><em style={{fontStyle:"italic"}}>twelve formats.</em>
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }} className="fmt-g">
          {FORMATS.map((f,i) => (
            <div key={i}
              style={{ padding:"20px 18px", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:10, cursor:"default", transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--line-2)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.boxShadow="none"; }}>
              <p style={{ fontSize:13, fontWeight:500, color:"var(--fg)", marginBottom:4, fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.01em" }}>{f.name}</p>
              <p style={{ fontSize:11, color:"var(--fg-3)", fontFamily:"'DM Sans',sans-serif", fontWeight:300, lineHeight:1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <style>{`@media(max-width:820px){.fmt-g{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </div>
    </section>
  );
}
