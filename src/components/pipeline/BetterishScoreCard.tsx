import type { BetterishScore } from "../../lib/agents/types";

interface BetterishScoreCardProps {
  score: BetterishScore | null;
  compact?: boolean;
}

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
    total >= 900 ? "#16a34a" : total >= 600 ? "var(--gold-dark)" : "#b91c1c";

  if (compact) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily:
            "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: 12,
          color,
        }}
      >
        <span>{total}</span>
        <span
          style={{
            fontSize: 10,
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
        fontFamily: "'DM Sans', sans-serif",
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
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: 4,
            }}
          >
            Betterish Score
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
                  "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
            fontSize: 11,
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

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {DIMENSIONS.map((key) => {
          const value = score.breakdown[key] ?? 0;
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
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {key}
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
                    background: color,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 11,
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

