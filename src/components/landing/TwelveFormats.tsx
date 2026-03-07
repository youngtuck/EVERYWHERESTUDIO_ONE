const FORMATS = [
  { name:"LinkedIn Post", desc:"Native-formatted. CTA-optimized." },
  { name:"Newsletter", desc:"Story-forward. Audience-tuned." },
  { name:"Sunday Story", desc:"10 pieces from one conversation." },
  { name:"Podcast Script", desc:"SSML-ready for ElevenLabs." },
  { name:"Twitter Thread", desc:"Hook, build, land." },
  { name:"Essay", desc:"1200-2000 words. Fully referenced." },
  { name:"Short Video", desc:"Script, hook, caption." },
  { name:"Substack Note", desc:"Brief. Personal. Punchy." },
  { name:"Talk Outline", desc:"Structure for the stage." },
  { name:"Email Campaign", desc:"Sequence with intent." },
  { name:"Blog Post", desc:"SEO-optimized. Substantial." },
  { name:"Executive Brief", desc:"Tight. Decision-ready." },
];
const TwelveFormats = () => (
  <section style={{ padding:"80px 28px", background:"var(--bg-primary)" }}>
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <p className="eyebrow" style={{ marginBottom:16 }}>Output Formats</p>
        <h2 style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:900, letterSpacing:"-1.5px", color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.05 }}>
          One idea.<br />Twelve formats.
        </h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }} className="fmt-grid">
        {FORMATS.map((f, i) => (
          <div key={i} style={{ padding:"20px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:8, cursor:"default", transition:"all 0.2s ease" }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background="var(--text-primary)"; el.style.borderColor="var(--text-primary)"; (el.querySelector(".fmt-name") as HTMLElement).style.color="var(--bg-primary)"; (el.querySelector(".fmt-desc") as HTMLElement).style.color="var(--bg-secondary)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background="var(--bg-secondary)"; el.style.borderColor="var(--border)"; (el.querySelector(".fmt-name") as HTMLElement).style.color="var(--text-primary)"; (el.querySelector(".fmt-desc") as HTMLElement).style.color="var(--text-muted)"; }}>
            <p className="fmt-name" style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:4, fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s" }}>{f.name}</p>
            <p className="fmt-desc" style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s", lineHeight:1.4 }}>{f.desc}</p>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:768px){.fmt-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  </section>
);
export default TwelveFormats;
