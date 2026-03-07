import { useTheme } from "../../context/ThemeContext";

const FORMATS = [
  { name:"LinkedIn Post", desc:"Native-formatted. CTA-optimized." },
  { name:"Newsletter", desc:"Story-forward. Audience-tuned." },
  { name:"Sunday Story", desc:"10 pieces from one conversation." },
  { name:"Podcast Script", desc:"SSML-ready for ElevenLabs." },
  { name:"Twitter Thread", desc:"Hook, build, land." },
  { name:"Essay", desc:"1200–2000 words. Fully referenced." },
  { name:"Short Video", desc:"Script, hook, caption." },
  { name:"Substack Note", desc:"Brief. Personal. Punchy." },
  { name:"Talk Outline", desc:"Structure for the stage." },
  { name:"Email Campaign", desc:"Sequence with intent." },
  { name:"Blog Post", desc:"SEO-optimized. Substantial." },
  { name:"Executive Brief", desc:"Tight. Decision-ready." },
];

export default function TwelveFormats() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return (
    <section style={{ padding:"96px 36px", background:"var(--bg-primary)", borderTop:"1px solid var(--border)" }}>
      <div style={{ maxWidth:1160, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:18 }}>Output Formats</p>
          <h2 style={{ fontSize:"clamp(28px,3.5vw,54px)", fontWeight:900, letterSpacing:"-2px", color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0 }}>
            One idea.<br />Twelve formats.
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }} className="fmt-grid">
          {FORMATS.map((f,i) => (
            <div key={i}
              style={{ padding:"24px 20px", background:"var(--bg-secondary)", border:"1px solid var(--border-strong)", borderRadius:8, cursor:"default", transition:"all 0.2s ease" }}
              onMouseEnter={e => {
                e.currentTarget.style.background = dark ? "#FFFFFF" : "#0A0A0A";
                e.currentTarget.style.borderColor = dark ? "#FFFFFF" : "#0A0A0A";
                (e.currentTarget.querySelector(".fn") as HTMLElement).style.color = dark ? "#0A0A0A" : "#FFFFFF";
                (e.currentTarget.querySelector(".fd") as HTMLElement).style.color = dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
                (e.currentTarget.querySelector(".fn") as HTMLElement).style.color = "var(--text-primary)";
                (e.currentTarget.querySelector(".fd") as HTMLElement).style.color = "var(--text-muted)";
              }}>
              <p className="fn" style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s" }}>{f.name}</p>
              <p className="fd" style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s", lineHeight:1.45 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <style>{`@media(max-width:800px){.fmt-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      </div>
    </section>
  );
}
