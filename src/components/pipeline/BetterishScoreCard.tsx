import type { BetterishScore } from "../../lib/agents/types";

interface BetterishScoreCardProps {
  score: BetterishScore | null;
  compact?: boolean;
}

const DIMENSION_LABELS: Record<string, string> = {
  voiceAuthenticity: "Voice",
  researchDepth: "Research",
  hookStrength: "Hook",
  slopScore: "AI Tells",
  editorialQuality: "Accuracy",
  perspective: "Audience",
  engagement: "Engagement",
  platformFit: "Platform",
  strategicValue: "Strategy",
  nvcCompliance: "Impact",
};

const DIMENSIONS: Array<keyof BetterishScore["breakdown"]> = [
  "voiceAuthenticity",
  "researchDepth",
  "hookStrength",
  "slopScore",
  "editorialQuality",
  "perspective",
  "engagement",
  "platformFit",
  "strategicValue",
  "nvcCompliance",
];

export function BetterishScoreCard({ score, compact }: BetterishScoreCardProps) {
  if (!score) return null;

  const total = score.total ?? 0;
  const verdict = score.verdict;

  const color =
    total >= 800 ? "#16a34a" : total >= 600 ? "var(--gold-dark)" : "#b91c1c";

  if (compact) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily:
            "'Afacad Flux', sans-serif",
          fontSize: 12,
          color,
        }}
      >
        <span>{total}</span>
        <span
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
          }}
        >
          / 1000
        </span>
      </span>
    );
  }

  const verdictLabel =
    verdict === "PUBLISH" ? "Publish" : verdict === "REVISE" ? "Revise" : "Reject";

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-white)",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: 4,
            }}
          >
            Betterish Score
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 2 }}>
            How your content performed across 10 quality dimensions. Each scored out of ~150.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily:
                  "'Afacad Flux', sans-serif",
                fontSize: 28,
                fontWeight: 600,
                color,
              }}
            >
              {total}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
              }}
            >
              / 1000
            </span>
          </div>
        </div>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background:
              verdict === "PUBLISH"
                ? "rgba(22,163,74,0.08)"
                : verdict === "REVISE"
                  ? "rgba(200,150,26,0.08)"
                  : "rgba(185,28,28,0.08)",
            color,
            border: `1px solid ${color}33`,
          }}
        >
          {verdictLabel}
        </span>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 11, color: "var(--text-tertiary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#50c8a0" }} /> 120+ Strong</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#4A90D9" }} /> 60-119 Developing</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#E53935" }} /> Below 60 Needs work</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {DIMENSIONS.map((key) => {
          const value = score.breakdown[key] ?? 0;
          const barColor = value >= 120 ? "#50c8a0" : value >= 80 ? "#F5C642" : value < 60 ? "#E53935" : "#4A90D9";
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 140,
                  fontSize: 14,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {DIMENSION_LABELS[key] || key}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  background: "rgba(0,0,0,0.04)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(0, Math.min(100, (value / 150) * 100))}%`,
                    background: barColor,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {score.topIssue && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            marginTop: 8,
          }}
        >
          <strong>Top issue:</strong> {score.topIssue}
        </div>
      )}
      {score.gutCheck && (
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--text-secondary)",
          }}
        >
          {score.gutCheck}
        </div>
      )}
    </div>
  );
}

