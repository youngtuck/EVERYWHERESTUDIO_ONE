import { useState } from "react";
import { Mic, Globe, BookOpen, Layers, ChevronDown, ChevronRight, Upload, CheckCircle } from "lucide-react";

const VOICE_LAYERS = [
  { name:"Voice Layer", desc:"How you speak — rhythm, sentence length, vocabulary, punctuation patterns", strength:97, detail:"Direct, declarative. Short sentences that land. No hedging. Occasional single-sentence paragraphs for emphasis." },
  { name:"Value Layer", desc:"What you stand for — core beliefs, professional principles, ethical lines", strength:94, detail:"Clarity over complexity. Depth over volume. Long-game thinking. Authentic > polished." },
  { name:"Personality Layer", desc:"How you show up — humor, warmth, edge, the texture of your presence", strength:91, detail:"Wry, not sarcastic. Self-aware. Willing to take a position. Dislikes corporate speak." },
];

const PUBLICATIONS = [
  { name:"LinkedIn", status:"configured", standard:"500-800 words, no external links in post, strong CTA" },
  { name:"Substack / Email", status:"configured", standard:"1000-1400 words, story-forward, 3 sections" },
  { name:"Medium / Essay", status:"configured", standard:"1200-2000 words, fully referenced, SEO-optimized" },
  { name:"Podcast Script", status:"configured", standard:"SSML-ready, 12-18 minute target" },
];

const Section = ({ icon:Icon, title, children, color="#F5C642" }: any) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ marginBottom:16, overflow:"hidden" }}>
      <button onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", borderBottom:open?"1px solid var(--border)":"none" }}>
        <Icon size={15} style={{ color }} />
        <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", flex:1, textAlign:"left" }}>{title}</span>
        {open ? <ChevronDown size={14} style={{ color:"var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color:"var(--text-muted)" }} />}
      </button>
      {open && <div style={{ padding:"20px" }}>{children}</div>}
    </div>
  );
};

const Resources = () => (
  <div style={{ padding:"28px", maxWidth:800 }}>
    <div style={{ marginBottom:28 }}>
      <p className="eyebrow" style={{ marginBottom:8 }}>Studio</p>
      <h1 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", fontFamily:"'Afacad Flux',sans-serif" }}>Resources</h1>
      <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4, fontFamily:"'Afacad Flux',sans-serif" }}>Your Voice DNA, Brand Guide, and Publication Standards. Set once — runs in every session.</p>
    </div>

    {/* Voice DNA */}
    <Section icon={Mic} title="Voice DNA" color="#F5C642">
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:32, fontWeight:800, color:"#F5C642", letterSpacing:"-1.5px", fontFamily:"'Afacad Flux',sans-serif" }}>94.7</span>
        <span style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity Score · Sharpening with each session</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {VOICE_LAYERS.map(layer => (
          <div key={layer.name} style={{ padding:"14px 16px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:7 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{layer.name}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{layer.strength}%</span>
            </div>
            <p style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:6, fontFamily:"'Afacad Flux',sans-serif" }}>{layer.desc}</p>
            <p style={{ fontSize:12, color:"var(--text-primary)", fontStyle:"italic", fontFamily:"'Afacad Flux',sans-serif" }}>{layer.detail}</p>
          </div>
        ))}
      </div>
      <button className="btn-ghost" style={{ marginTop:14, fontSize:10, display:"flex", alignItems:"center", gap:6 }}>
        <Upload size={12} /> Upload Writing Samples to Improve
      </button>
    </Section>

    {/* Brand DNA */}
    <Section icon={Globe} title="Brand DNA" color="#4A90D9">
      <div style={{ padding:"14px 16px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:7, marginBottom:14 }}>
        <p style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:3, fontFamily:"'Afacad Flux',sans-serif" }}>Source URL</p>
        <p style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>mixedgrill.net — Last analyzed Feb 10, 2026</p>
      </div>
      {[
        ["Positioning","Orchestrated Intelligence for Thought Leaders"],
        ["Tone","Confident, direct, warm without being casual"],
        ["Core Promise","Ideas to Impact. One idea. Everywhere."],
      ].map(([k,v]) => (
        <div key={k} style={{ display:"flex", gap:14, marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", minWidth:90, fontFamily:"'Afacad Flux',sans-serif" }}>{k}</span>
          <span style={{ fontSize:12, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{v}</span>
        </div>
      ))}
      <button className="btn-ghost" style={{ marginTop:14, fontSize:10 }}>Re-analyze from URL</button>
    </Section>

    {/* Publications */}
    <Section icon={BookOpen} title="Publication Standards" color="#188FA7">
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {PUBLICATIONS.map(p => (
          <div key={p.name} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:7 }}>
            <CheckCircle size={13} style={{ color:"#188FA7", marginTop:2, flexShrink:0 }} />
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{p.name}</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"'Afacad Flux',sans-serif" }}>{p.standard}</p>
            </div>
          </div>
        ))}
        <button className="btn-ghost" style={{ marginTop:6, fontSize:10, display:"flex", alignItems:"center", gap:6 }}>
          <Layers size={12} /> Add Publication Standard
        </button>
      </div>
    </Section>
  </div>
);
export default Resources;
