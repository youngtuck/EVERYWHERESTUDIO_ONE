import { useState } from "react";
import { Plus } from "lucide-react";

const FIDELITY_SCORE = 94.7;
const TRAITS: { label: string; score: number }[] = [
  { label: "Vocabulary and Syntax", score: 88 },
  { label: "Tonal Register", score: 94 },
  { label: "Rhythm and Cadence", score: 91 },
  { label: "Metaphor Patterns", score: 87 },
  { label: "Structural Habits", score: 96 },
];

const GOLD = "#C8961A";

const WRITING_SAMPLES = [
  { title: "CEO who reads everything", wordCount: 412, dateAdded: "Mar 4, 2026" },
  { title: "Interview before the essay", wordCount: 890, dateAdded: "Mar 2, 2026" },
  { title: "Delegation and trust", wordCount: 624, dateAdded: "Feb 28, 2026" },
];

function TraitBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 13, color: "var(--fg-2)", width: 160, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-3)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            width: `${score}%`,
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD}99)`,
            transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {score}%
      </div>
    </div>
  );
}

export default function VoiceDnaSettings() {
  const [samples] = useState(WRITING_SAMPLES);

  return (
    <div style={{ maxWidth: "var(--studio-content-max)", margin: "0 auto", fontFamily: "var(--font)", paddingBottom: "var(--studio-gap-lg)" }}>
      {/* Page header */}
      <header style={{ marginBottom: "var(--studio-gap-lg)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Voice DNA
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-3)", fontWeight: 400 }}>
          How the system learns to write like you
        </p>
      </header>

      {/* Fidelity Score */}
      <section className="card" style={{ padding: "var(--studio-gap-lg)", marginBottom: "var(--studio-gap-lg)", border: "1px solid var(--line)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>
          Voice Fidelity
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 42, fontWeight: 800, color: GOLD, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {FIDELITY_SCORE}
          </span>
          <span style={{ fontSize: 14, color: "var(--fg-3)", fontWeight: 500 }}>/ 100</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              width: `${FIDELITY_SCORE}%`,
              background: GOLD,
              transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </section>

      {/* Five trait bars */}
      <section className="card" style={{ padding: "var(--studio-gap-lg)", marginBottom: "var(--studio-gap-lg)", border: "1px solid var(--line)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 18 }}>
          Trait profile
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {TRAITS.map((t) => (
            <TraitBar key={t.label} label={t.label} score={t.score} />
          ))}
        </div>
      </section>

      {/* Writing Samples */}
      <section className="card" style={{ padding: "var(--studio-gap-lg)", marginBottom: "var(--studio-gap-lg)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase" }}>
            Writing Samples
          </div>
          <button
            type="button"
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "8px 14px" }}
            onClick={() => {}}
          >
            <Plus size={16} strokeWidth={2} />
            Add Sample
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {samples.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 0",
                borderBottom: i < samples.length - 1 ? "1px solid var(--line)" : "none",
              }}
            >
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.title}
              </span>
              <span style={{ fontSize: 12, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{s.wordCount} words</span>
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{s.dateAdded}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recalibrate Voice */}
      <div style={{ marginTop: "var(--studio-gap)" }}>
        <button
          type="button"
          style={{
            background: "var(--fg)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "var(--studio-radius)",
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font)",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => {}}
        >
          Recalibrate Voice
        </button>
      </div>
    </div>
  );
}
