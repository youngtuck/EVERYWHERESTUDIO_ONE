import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import "./shared.css";

const TRAITS: { label: string; score: number; strengthPhrase: string; distinctionPhrase: string }[] = [
  { label: "Vocabulary and Syntax", score: 88, strengthPhrase: "precise, intentional word choice", distinctionPhrase: "instinct over ornamentation in vocabulary" },
  { label: "Tonal Register", score: 94, strengthPhrase: "a distinctive tonal identity", distinctionPhrase: "tonal range that shifts with context" },
  { label: "Rhythm and Cadence", score: 91, strengthPhrase: "strong rhythmic patterns that carry ideas forward", distinctionPhrase: "content-first pacing over musical rhythm" },
  { label: "Metaphor Patterns", score: 87, strengthPhrase: "vivid metaphor to make abstract ideas tangible", distinctionPhrase: "direct language over figurative expression" },
  { label: "Structural Habits", score: 96, strengthPhrase: "structurally driven writing with clear architecture", distinctionPhrase: "organic flow over rigid structure" },
];

const WRITING_SAMPLES = [
  { title: "CEO who reads everything", wordCount: 412, dateAdded: "Mar 4, 2026" },
  { title: "Interview before the essay", wordCount: 890, dateAdded: "Mar 2, 2026" },
  { title: "Delegation and trust", wordCount: 624, dateAdded: "Feb 28, 2026" },
];

function scoreToLabel(score: number): string {
  if (score <= 20) return "Minimal";
  if (score <= 40) return "Light";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "Strong";
  return "Dominant";
}

function buildNarrativeSummary(traits: typeof TRAITS): string {
  const sorted = [...traits].sort((a, b) => b.score - a.score);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const secondHighest = sorted[1];

  return [
    `Your writing leans on ${highest.strengthPhrase}.`,
    secondHighest.score > 40
      ? `You also show ${scoreToLabel(secondHighest.score).toLowerCase()} ${secondHighest.label.toLowerCase()}, giving your voice a layered quality.`
      : `That single dominant trait gives your voice a focused, recognizable quality.`,
    `Where others rely on ${lowest.label.toLowerCase()}, you favor ${lowest.distinctionPhrase}, and that's part of what makes your voice yours.`,
  ].join(" ");
}

function TraitBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
      <div style={{ fontFamily: "var(--font)", fontSize: 14, fontWeight: 500, color: "var(--fg)", width: 180, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", overflow: "hidden", borderRadius: 4 }}>
          <div
            style={{
              height: "100%",
              width: "100%",
              borderRadius: 4,
              background: "var(--gold)",
              animation: "barFill 0.8s ease forwards",
              animationDelay: `${delay}ms`,
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
      <div style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, color: "var(--gold)", width: 72, textAlign: "right" }}>{scoreToLabel(score)}</div>
    </div>
  );
}

export default function VoiceDnaSettings() {
  const navigate = useNavigate();
  const [samples] = useState(WRITING_SAMPLES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px 80px",
        fontFamily: "var(--font)",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--fg)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Voice DNA
        </h1>
        <p style={{ fontFamily: "var(--font)", fontSize: 14, color: "var(--fg-2)", marginTop: 4, marginBottom: 0 }}>
          How the system learns to write like you
        </p>
      </header>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--fg-3)",
            marginBottom: 10,
          }}
        >
          YOUR VOICE
        </div>
        <p
          style={{
            fontFamily: "var(--font)",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--fg)",
            margin: "0 0 12px",
          }}
        >
          {buildNarrativeSummary(TRAITS)}
        </p>
        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
          Last trained: Mar 4, 2026
        </div>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--fg-3)",
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
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "var(--font)",
              fontSize: 14,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--fg-3)",
            }}
          >
            WRITING SAMPLES
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              color: "var(--fg)",
              border: "1px solid var(--line-2)",
              padding: "10px 20px",
              borderRadius: 8,
              fontFamily: "var(--font)",
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
              e.currentTarget.style.borderColor = "var(--fg-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "var(--line-2)";
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
                borderBottom: i < samples.length - 1 ? "1px solid var(--line)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: "var(--font)", fontSize: 14, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font)", fontSize: 12, color: "var(--fg-3)" }}>{s.wordCount} words</span>
                <span style={{ fontFamily: "var(--font)", fontSize: 12, color: "var(--fg-3)" }}>{s.dateAdded}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Retrain section */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: 32,
          marginTop: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--fg-3)",
            marginBottom: 12,
          }}
        >
          RETRAIN
        </div>
        <p style={{ fontSize: 14, color: "var(--fg-2)", margin: "0 0 16px", lineHeight: 1.6 }}>
          Add new writing samples or re-analyze existing ones to improve voice matching accuracy.
        </p>
        <button
          type="button"
          onClick={() => navigate("/onboarding?step=voice&retrain=true")}
          style={{
            background: "transparent",
            color: "var(--gold)",
            border: "2px solid var(--gold)",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,198,66,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <RefreshCw size={16} />
          Retrain Voice DNA
        </button>
      </section>
    </div>
  );
}
