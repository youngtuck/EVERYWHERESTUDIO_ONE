import { useState, type ReactNode, type ComponentType, type CSSProperties } from "react";
import { Mic, Globe, ChevronDown, Upload } from "lucide-react";
import { getScoreColor } from "../../utils/scoreColor";
import "./shared.css";

const VOICE_LAYERS = [
  { name: "Voice Layer", desc: "How you speak: rhythm, sentence length, vocabulary, punctuation patterns", strength: 97, detail: "Direct, declarative. Short sentences that land. No hedging. Occasional single-sentence paragraphs for emphasis." },
  { name: "Value Layer", desc: "What you stand for: core beliefs, professional principles, ethical lines", strength: 94, detail: "Clarity over complexity. Depth over volume. Long-game thinking. Authentic over polished." },
  { name: "Personality Layer", desc: "How you show up: humor, warmth, edge, the texture of your presence", strength: 91, detail: "Wry, not sarcastic. Self-aware. Willing to take a position. Dislikes corporate speak." },
];

interface SectionProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  title: string;
  children: ReactNode;
}

function AccordionSection({ icon: Icon, title, children }: SectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.01)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon size={20} style={{ color: "var(--gold-dark)" }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        </div>
        <ChevronDown
          size={20}
          style={{
            color: "var(--text-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {open && children}
    </div>
  );
}

export default function Resources() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          STUDIO
        </p>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Resources
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 4,
            marginBottom: 0,
            maxWidth: 560,
            lineHeight: 1.6,
          }}
        >
          Your Voice DNA, Brand Guide, and Publication Standards. Set once and it runs in every session.
        </p>
      </div>

      <AccordionSection icon={Mic} title="Voice DNA">
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--gold-dark)", letterSpacing: "-0.02em" }}>94.7</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)" }}>Voice Fidelity Score · Sharpening with each session</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {VOICE_LAYERS.map((layer) => {
              const sc = getScoreColor(layer.strength >= 80 ? 800 : layer.strength >= 60 ? 650 : 500);
              return (
                <div
                  key={layer.name}
                  style={{
                    margin: "0 0 12px",
                    padding: 20,
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{layer.name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: sc.text }}>{layer.strength}%</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, marginTop: 0 }}>{layer.desc}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: "italic", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{layer.detail}</p>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            style={{
              marginTop: 16,
              padding: "12px 20px",
              border: "1px dashed var(--border-default)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--text-secondary)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--gold-dark)";
              e.currentTarget.style.color = "var(--gold-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Upload size={18} />
            Upload Writing Samples to Improve
          </button>
        </div>
      </AccordionSection>

      <AccordionSection icon={Globe} title="Brand DNA">
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ padding: "14px 16px", background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 10, marginBottom: 14 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3, marginTop: 0 }}>Source URL</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>mixedgrill.net · Last analyzed Feb 10, 2026</p>
          </div>
          {[
            ["Positioning", "Orchestrated Intelligence for Thought Leaders"],
            ["Tone", "Confident, direct, warm without being casual"],
            ["Core Promise", "Ideas to Impact. One idea. Everywhere."],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 14, marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", minWidth: 90 }}>{k}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>
            </div>
          ))}
          <button
            type="button"
            style={{
              marginTop: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--gold-dark)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Re-analyze from URL
          </button>
        </div>
      </AccordionSection>
    </div>
  );
}
