import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Score chip ─────────────────────────────────────────────────────────────
function ScoreChip({ score }: { score: number }) {
  const label =
    score >= 900 ? "Exceptional"
    : score >= 800 ? "Ready"
    : score >= 700 ? "Solid"
    : score >= 500 ? "Getting There"
    : "Needs Work";
  const color =
    score >= 900 ? "#10b981"
    : score >= 800 ? "#3A7BD5"
    : score >= 700 ? "#C8961A"
    : score >= 500 ? "#9ca3af"
    : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 32, height: 3, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${score / 10}%`, background: color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "-0.01em" }}>{score}</span>
    </div>
  );
}

// ── Fade-in card ───────────────────────────────────────────────────────────
function FadeCard({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)`,
      ...style,
    }}>{children}</div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();

  const stats = [
    { label: "Voice Fidelity", value: "94.7", unit: "", sub: "+2.1 this week", color: "#3A7BD5" },
    { label: "Outputs Created", value: "47", unit: "", sub: "12 this month", color: "#C8961A" },
    { label: "Avg Betterish", value: "812", unit: "", sub: "Ready to Publish", color: "#10b981" },
    { label: "Signals", value: "11", unit: "", sub: "3 high priority", color: "#e85d75" },
  ];

  const startTypes = [
    { abbr: "LI", label: "LinkedIn", color: "#3A7BD5" },
    { abbr: "NL", label: "Newsletter", color: "#0D8C9E" },
    { abbr: "SS", label: "Sunday Story", color: "#C8961A" },
    { abbr: "PC", label: "Podcast Script", color: "#6b4dd4" },
    { abbr: "TT", label: "Thread", color: "#10b981" },
    { abbr: "ES", label: "Essay", color: "#e85d75" },
    { abbr: "VD", label: "Short Video", color: "#f5a623" },
    { abbr: "TB", label: "Talk Brief", color: "#4ab8f5" },
  ];

  const sessions = [
    { title: "The compound effect of daily writing", type: "LinkedIn", score: 847, time: "2h ago" },
    { title: "Why most thought leaders sound the same", type: "Newsletter", score: 792, time: "Yesterday" },
    { title: "What I learned from 500 conversations", type: "Essay", score: 921, time: "2d ago" },
    { title: "The future of personal branding", type: "Sunday Story", score: 681, time: "3d ago" },
  ];

  const signals = [
    { label: "AI tools replacing writers", category: "WT", color: "#e85d75", strength: 92 },
    { label: "LinkedIn algorithm favors long-form", category: "TR", color: "#3A7BD5", strength: 87 },
    { label: "Newsletter open rates declining", category: "IN", color: "#C8961A", strength: 74 },
  ];

  return (
    <div data-theme="light" style={{ padding: "28px 32px", maxWidth: 1200, minHeight: "100vh" }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <FadeCard delay={0}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.035em", color: "var(--fg)", marginBottom: 4 }}>
              Good morning, Mark.
            </h1>
            <p style={{ fontSize: 14, color: "var(--fg-3)" }}>
              You have 11 new signals and 2 drafts ready to review.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => nav("/studio/watch")}
              className="btn-ghost"
              style={{ fontSize: 13, padding: "9px 18px" }}
            >
              View Signals
            </button>
            <button
              onClick={() => nav("/studio/work")}
              className="btn-primary"
              style={{ fontSize: 13, padding: "9px 18px" }}
            >
              + New Session
            </button>
          </div>
        </div>
      </FadeCard>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <FadeCard delay={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {stats.map(({ label, value, sub, color }, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: color, opacity: 0.7 }} />
              <div style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--fg)", lineHeight: 1, marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </FadeCard>

      {/* ── Two-column ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Start something */}
          <FadeCard delay={120}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "20px 22px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.015em" }}>Start Something</h2>
                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>12 formats</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {startTypes.map(({ abbr, label, color }) => (
                  <button
                    key={abbr}
                    onClick={() => nav("/studio/work")}
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      padding: "12px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${color}22`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                      color, fontFamily: "var(--font)",
                    }}>{abbr}</span>
                    <span style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.01em" }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </FadeCard>

          {/* Recent sessions */}
          <FadeCard delay={180}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 22px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.015em" }}>Recent Sessions</h2>
                <button onClick={() => nav("/studio/outputs")} style={{
                  background: "none", border: "none",
                  fontSize: 12, color: "var(--fg-3)",
                }}>View all</button>
              </div>
              <div>
                {sessions.map(({ title, type, score, time }, i) => (
                  <button
                    key={i}
                    onClick={() => nav("/studio/work/1")}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 22px",
                      borderBottom: i < sessions.length - 1 ? "1px solid var(--line)" : "none",
                      background: "none", border: "none",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                  >
                    {/* Type indicator */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "var(--fg-2)",
                      letterSpacing: "0.04em",
                    }}>
                      {type.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: "var(--fg)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 3,
                      }}>{title}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{type} · {time}</div>
                    </div>
                    <ScoreChip score={score} />
                  </button>
                ))}
              </div>
            </div>
          </FadeCard>
        </div>

        {/* Right column — Sentinel */}
        <FadeCard delay={150}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            overflow: "hidden",
            height: "fit-content",
          }}>
            <div style={{
              padding: "16px 18px",
              borderBottom: "1px solid var(--line)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.015em", marginBottom: 2 }}>Sentinel</h2>
                <div style={{ fontSize: 11, color: "var(--fg-3)" }}>11 signals today</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: "rgba(232,93,117,0.1)",
                color: "#e85d75",
                border: "1px solid rgba(232,93,117,0.2)",
                borderRadius: 100, padding: "3px 8px",
              }}>3 High</span>
            </div>

            <div style={{ padding: "6px 0" }}>
              {signals.map(({ label, category, color, strength }, i) => (
                <button
                  key={i}
                  style={{
                    width: "100%", background: "none", border: "none",
                    padding: "12px 18px", textAlign: "left",
                    borderBottom: i < signals.length - 1 ? "1px solid var(--line)" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{label}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                      background: `${color}18`, color,
                      border: `1px solid ${color}30`,
                      borderRadius: 4, padding: "2px 6px", flexShrink: 0, marginLeft: 8,
                    }}>{category}</span>
                  </div>
                  {/* Signal strength */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 2, background: "var(--bg-3)", borderRadius: 1, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${strength}%`, background: color, borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 600, width: 22, textAlign: "right" }}>{strength}</span>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ padding: "14px 18px", borderTop: "1px solid var(--line)" }}>
              <button
                onClick={() => nav("/studio/watch")}
                className="btn-ghost"
                style={{ width: "100%", fontSize: 12, padding: "9px" }}
              >
                View All Signals
              </button>
            </div>
          </div>
        </FadeCard>
      </div>
    </div>
  );
}
