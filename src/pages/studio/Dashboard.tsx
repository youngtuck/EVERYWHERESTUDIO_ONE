import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Stagger reveal ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(14px)",
      transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)`,
      transitionDelay: `${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

// ── Score label (no chip, just ruled bar + number) ─────────────────────────
function ScoreLabel({ score }: { score: number }) {
  const color = score >= 900 ? "#10b981" : score >= 800 ? "#3A7BD5" : score >= 700 ? "#C8961A" : score >= 500 ? "#9ca3af" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 40, height: 2, background: "var(--bg-3)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score / 10}%`, background: color, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", minWidth: 28 }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverSignal, setHoverSignal] = useState<number | null>(null);
  const [hoverFormat, setHoverFormat] = useState<number | null>(null);

  const stats = [
    { label: "Voice Fidelity", value: "94.7", sub: "+2.1 this week" },
    { label: "Outputs Created", value: "47", sub: "12 this month" },
    { label: "Avg Betterish", value: "812", sub: "Ready to Publish" },
    { label: "Signals", value: "11", sub: "3 high priority" },
  ];

  const formats = [
    "LinkedIn Post", "Newsletter", "Sunday Story", "Podcast Script",
    "Twitter Thread", "Essay", "Short Video", "Talk Outline",
    "Email Campaign", "Blog Post", "Executive Brief", "Substack Note",
  ];

  const sessions = [
    { title: "The compound effect of daily writing", type: "LinkedIn", score: 847, time: "2h ago" },
    { title: "Why most thought leaders sound the same", type: "Newsletter", score: 792, time: "Yesterday" },
    { title: "What I learned from 500 conversations", type: "Essay", score: 921, time: "2d ago" },
    { title: "The future of personal branding", type: "Sunday Story", score: 681, time: "3d ago" },
  ];

  const signals = [
    { label: "AI tools replacing writers", tag: "Watchlist", strength: 92, color: "#e85d75" },
    { label: "LinkedIn algorithm favors long-form", tag: "Trend", strength: 87, color: "#3A7BD5" },
    { label: "Newsletter open rates declining", tag: "Intel", strength: 74, color: "#C8961A" },
    { label: "Authenticity gap widens in B2B", tag: "Trend", strength: 68, color: "#3A7BD5" },
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1160, minHeight: "100vh", fontFamily: "var(--font)" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Reveal delay={0}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>
              Sunday, March 8, 2026
            </p>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.045em", color: "var(--fg)", lineHeight: 1 }}>
              Good morning, Mark.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 2 }}>
            <button onClick={() => nav("/studio/watch")} className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px" }}>
              View Signals
            </button>
            <button onClick={() => nav("/studio/work")} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
              New Session
            </button>
          </div>
        </div>
      </Reveal>

      {/* ── Stats — ruled columns, no cards ───────────────────────────── */}
      <Reveal delay={80}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 52 }}>
          {stats.map(({ label, value, sub }, i) => (
            <div key={i} style={{
              padding: "0 28px",
              borderLeft: i > 0 ? "1px solid var(--line)" : "none",
              ...(i === 0 ? { paddingLeft: 0 } : {}),
            }}>
              <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>{label}</p>
              <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.05em", color: "var(--fg)", lineHeight: 1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--fg-3)" }}>{sub}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Two column ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 56, alignItems: "start" }}>

        {/* Left */}
        <div>

          {/* Start Something */}
          <Reveal delay={120}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)" }}>Start Something</p>
                <p style={{ fontSize: 11, color: "var(--fg-3)" }}>12 formats</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {formats.map((label, i) => {
                  const isLastRow = i >= formats.length - 2;
                  const isLeft = i % 2 === 0;
                  return (
                    <button
                      key={i}
                      onClick={() => nav("/studio/work")}
                      onMouseEnter={() => setHoverFormat(i)}
                      onMouseLeave={() => setHoverFormat(null)}
                      style={{
                        background: "none", border: "none",
                        borderBottom: isLastRow ? "none" : "1px solid var(--line)",
                        borderRight: isLeft ? "1px solid var(--line)" : "none",
                        padding: "13px 0",
                        paddingRight: isLeft ? 20 : 0,
                        paddingLeft: isLeft ? 0 : 20,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        color: hoverFormat === i ? "var(--fg)" : "var(--fg-2)",
                        letterSpacing: "-0.01em",
                        transition: "color 0.15s",
                      }}>{label}</span>
                      <span style={{
                        fontSize: 14, color: "var(--fg-3)",
                        opacity: hoverFormat === i ? 1 : 0,
                        transform: hoverFormat === i ? "translateX(0)" : "translateX(-4px)",
                        transition: "opacity 0.15s, transform 0.15s",
                      }}>+</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Recent Sessions */}
          <Reveal delay={200}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)" }}>Recent Sessions</p>
                <button onClick={() => nav("/studio/outputs")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--fg-3)", padding: 0 }}>
                  View all
                </button>
              </div>
              <div>
                {sessions.map(({ title, type, score, time }, i) => (
                  <button
                    key={i}
                    onClick={() => nav("/studio/work/1")}
                    onMouseEnter={() => setHoverRow(i)}
                    onMouseLeave={() => setHoverRow(null)}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "15px 0",
                      borderBottom: i < sessions.length - 1 ? "1px solid var(--line)" : "none",
                      background: "none", border: "none",
                      borderBottom: i < sessions.length - 1 ? "1px solid var(--line)" : "none",
                      textAlign: "left", cursor: "pointer",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 500,
                        color: hoverRow === i ? "var(--fg)" : "var(--fg-2)",
                        letterSpacing: "-0.015em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 3, transition: "color 0.15s",
                      }}>{title}</p>
                      <p style={{ fontSize: 11, color: "var(--fg-3)" }}>{type} · {time}</p>
                    </div>
                    <ScoreLabel score={score} />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right — Sentinel */}
        <Reveal delay={100}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)" }}>Sentinel</p>
              <p style={{ fontSize: 11, color: "var(--fg-3)" }}>11 signals</p>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 20 }}>3 high priority today</p>

            <div>
              {signals.map(({ label, tag, strength, color }, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHoverSignal(i)}
                  onMouseLeave={() => setHoverSignal(null)}
                  style={{
                    width: "100%", background: "none", border: "none",
                    borderBottom: i < signals.length - 1 ? "1px solid var(--line)" : "none",
                    padding: "14px 0", textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 500,
                      color: hoverSignal === i ? "var(--fg)" : "var(--fg-2)",
                      lineHeight: 1.4, flex: 1, paddingRight: 12,
                      transition: "color 0.15s",
                    }}>{label}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", flexShrink: 0, paddingTop: 2 }}>{tag}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }}>
                      <div style={{ height: "100%", width: `${strength}%`, background: color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{strength}</span>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ paddingTop: 20 }}>
              <button onClick={() => nav("/studio/watch")} className="btn-ghost" style={{ width: "100%", fontSize: 12, padding: "10px" }}>
                View All Signals
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
