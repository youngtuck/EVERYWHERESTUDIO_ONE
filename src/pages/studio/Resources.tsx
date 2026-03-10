import { useState, type ReactNode, type ComponentType, type CSSProperties } from "react";
import { Mic, Globe, BookOpen, Layers, ChevronDown, ChevronRight, Upload, CheckCircle } from "lucide-react";

const VOICE_LAYERS = [
  { name:"Voice Layer", desc:"How you speak: rhythm, sentence length, vocabulary, punctuation patterns", strength:97, detail:"Direct, declarative. Short sentences that land. No hedging. Occasional single-sentence paragraphs for emphasis." },
  { name:"Value Layer", desc:"What you stand for: core beliefs, professional principles, ethical lines", strength:94, detail:"Clarity over complexity. Depth over volume. Long-game thinking. Authentic > polished." },
  { name:"Personality Layer", desc:"How you show up: humor, warmth, edge, the texture of your presence", strength:91, detail:"Wry, not sarcastic. Self-aware. Willing to take a position. Dislikes corporate speak." },
];

const PUBLICATIONS = [
  { name:"LinkedIn", status:"configured", standard:"500-800 words, no external links in post, strong CTA" },
  { name:"Substack / Email", status:"configured", standard:"1000-1400 words, story-forward, 3 sections" },
  { name:"Medium / Essay", status:"configured", standard:"1200-2000 words, fully referenced, SEO-optimized" },
  { name:"Podcast Script", status:"configured", standard:"SSML-ready, 12-18 minute target" },
];

interface SectionProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  title: string;
  children: ReactNode;
  color?: string;
}

const Section = ({ icon: Icon, title, children, color = "var(--gold)" }: SectionProps) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? "1px solid var(--line)" : "none", fontFamily: "var(--font)" }}>
        <Icon size={15} style={{ color }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", flex: 1, textAlign: "left" }}>{title}</span>
        {open ? <ChevronDown size={14} style={{ color: "var(--fg-3)" }} /> : <ChevronRight size={14} style={{ color: "var(--fg-3)" }} />}
      </button>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
};

const Resources = () => (
  <div style={{ maxWidth: 800, fontFamily: "'DM Sans', sans-serif" }}>
    <div style={{ marginBottom: "var(--studio-gap-lg)" }}>
      <p className="eyebrow" style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(0,0,0,0.3)", textTransform: "uppercase" }}>Studio</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em", marginBottom: 4 }}>Resources</h1>
      <p style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", lineHeight: 1.6, marginTop: 4 }}>Your Voice DNA, Brand Guide, and Publication Standards. Set once and it runs in every session.</p>
    </div>

    <Section icon={Mic} title="Voice DNA" color="var(--gold)">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: "var(--gold)", letterSpacing: "-0.02em" }}>94.7</span>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Voice Fidelity Score · Sharpening with each session</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {VOICE_LAYERS.map(layer => (
          <div key={layer.name} style={{ padding: "14px 16px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--studio-radius)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{layer.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)" }}>{layer.strength}%</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--fg-2)", marginBottom: 6 }}>{layer.desc}</p>
            <p style={{ fontSize: 12, color: "var(--fg)", fontStyle: "italic" }}>{layer.detail}</p>
          </div>
        ))}
      </div>
      <button className="btn-ghost" style={{ marginTop: 14, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Upload size={12} /> Upload Writing Samples to Improve
      </button>
    </Section>

    <Section icon={Globe} title="Brand DNA" color="var(--blue)">
      <div style={{ padding: "14px 16px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--studio-radius)", marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 3 }}>Source URL</p>
        <p style={{ fontSize: 12, color: "var(--fg-3)" }}>mixedgrill.net · Last analyzed Feb 10, 2026</p>
      </div>
      {[
        ["Positioning", "Orchestrated Intelligence for Thought Leaders"],
        ["Tone", "Confident, direct, warm without being casual"],
        ["Core Promise", "Ideas to Impact. One idea. Everywhere."],
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", minWidth: 90 }}>{k}</span>
          <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{v}</span>
        </div>
      ))}
      <button className="btn-ghost" style={{ marginTop: 14, fontSize: 12 }}>Re-analyze from URL</button>
    </Section>

    <Section icon={BookOpen} title="Publication Standards" color="#188FA7">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PUBLICATIONS.map(p => (
          <div key={p.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--studio-radius)" }}>
            <CheckCircle size={13} style={{ color: "#188FA7", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{p.name}</p>
              <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{p.standard}</p>
            </div>
          </div>
        ))}
        <button className="btn-ghost" style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Layers size={12} /> Add Publication Standard
        </button>
      </div>
    </Section>
  </div>
);
export default Resources;
