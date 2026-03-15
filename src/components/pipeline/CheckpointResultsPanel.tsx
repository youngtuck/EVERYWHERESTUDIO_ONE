import type { GateResult } from "../../lib/agents/types";

interface CheckpointResultsPanelProps {
  results: GateResult[];
  blockedAt?: string;
}

export function CheckpointResultsPanel({ results, blockedAt }: CheckpointResultsPanelProps) {
  if (!results.length) return null;

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 12,
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Quality Checkpoints
        </div>
        {blockedAt && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#b91c1c",
            }}
          >
            Blocked at {blockedAt}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map((result) => {
          const isFail = result.status === "FAIL";
          const isFlag = result.status === "FLAG";
          const color =
            result.status === "PASS"
              ? "var(--work-teal)"
              : isFail
                ? "#b91c1c"
                : "var(--gold-dark)";
          return (
            <details
              key={result.timestamp + result.gate}
              style={{
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
                padding: "8px 10px",
                background: "rgba(0,0,0,0.01)",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  listStyle: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {result.gate}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      color: color,
                      fontWeight: 600,
                    }}
                  >
                    {result.score}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {result.status}
                  </span>
                </div>
              </summary>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.feedback}
              </div>
              {result.issues && result.issues.length > 0 && (
                <ul
                  style={{
                    marginTop: 6,
                    paddingLeft: 18,
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                  }}
                >
                  {result.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
