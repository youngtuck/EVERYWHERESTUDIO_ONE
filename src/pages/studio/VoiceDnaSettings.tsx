import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import "./shared.css";

const FIDELITY_SCORE = 94.7;
const TRAITS: { label: string; score: number }[] = [
  { label: "Vocabulary and Syntax", score: 88 },
  { label: "Tonal Register", score: 94 },
  { label: "Rhythm and Cadence", score: 91 },
  { label: "Metaphor Patterns", score: 87 },
  { label: "Structural Habits", score: 96 },
];

const WRITING_SAMPLES = [
  { title: "CEO who reads everything", wordCount: 412, dateAdded: "Mar 4, 2026" },
  { title: "Interview before the essay", wordCount: 890, dateAdded: "Mar 2, 2026" },
  { title: "Delegation and trust", wordCount: 624, dateAdded: "Feb 28, 2026" },
];

function TraitBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
      <div style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", width: 180, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", overflow: "hidden", borderRadius: 4 }}>
          <div
            style={{
              height: "100%",
              width: "100%",
              borderRadius: 4,
              background: "var(--gold-dark)",
              animation: "barFill 0.8s ease forwards",
              animationDelay: `${delay}ms`,
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
      <div style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--gold-dark)", width: 48, textAlign: "right" }}>{score}%</div>
    </div>
  );
}

export default function VoiceDnaSettings() {
  const [samples] = useState(WRITING_SAMPLES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px 80px",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Voice DNA
        </h1>
        <p style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginTop: 4, marginBottom: 0 }}>
          How the system learns to write like you
        </p>
      </header>

      <section
        style={{
          background: "var(--surface-white)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: 10,
          }}
        >
          VOICE FIDELITY
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: "var(--gold-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {FIDELITY_SCORE}
          </span>
          <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 16, fontWeight: 400, color: "var(--text-tertiary)" }}>/ 100</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              width: `${FIDELITY_SCORE}%`,
              background: "var(--gold-dark)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </section>

      <section
        style={{
          background: "var(--surface-white)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: 18,
          }}
        >
          TRAIT PROFILE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {TRAITS.map((t, i) => (
            <TraitBar key={t.label} label={t.label} score={t.score} delay={i * 100} />
          ))}
        </div>
      </section>

      <section
        style={{
          background: "var(--surface-white)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
            }}
          >
            WRITING SAMPLES
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              padding: "10px 20px",
              borderRadius: 8,
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.02)";
              e.currentTarget.style.borderColor = "var(--text-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add Sample
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.doc,.docx,.pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) {
                console.log("[VoiceDNA] Sample file selected:", file.name);
              }
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {samples.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "14px 0",
                borderBottom: i < samples.length - 1 ? "1px solid var(--border-subtle)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>{s.wordCount} words</span>
                <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>{s.dateAdded}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
