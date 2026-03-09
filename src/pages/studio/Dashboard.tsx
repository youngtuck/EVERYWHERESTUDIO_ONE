import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, Mic, Globe, Mail, FileText, Eye, ChevronRight, Plus, FolderOpen, Clock } from "lucide-react";
import OnboardingModal, { isOnboardingComplete } from "../../components/studio/OnboardingModal";

// ── Time-based greeting ────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function getDateLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

// ── Score chip ─────────────────────────────────────────────────────────────
function ScoreChip({ score }: { score: number }) {
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
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)`,
      ...style,
    }}>{children}</div>
  );
}

// ── Section label (caps, letter-spacing) ────────────────────────────────────
function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--fg-3)", textTransform: "uppercase" }}>
        {children}
      </span>
      {action}
    </div>
  );
}

const QUICK_START = [
  { key: "essay", label: "Write an Essay", desc: "Long-form narrative", icon: PenLine, color: "#3A7BD5" },
  { key: "podcast", label: "Podcast Script", desc: "Episode from any topic", icon: Mic, color: "#C8961A" },
  { key: "social", label: "Social Package", desc: "Multi-platform posts", icon: Globe, color: "#a080f5" },
  { key: "newsletter", label: "Newsletter", desc: "Campaign-ready email", icon: Mail, color: "#0D8C9E" },
  { key: "freestyle", label: "Freestyle", desc: "Describe what you need", icon: FileText, color: "#10b981" },
];

export default function Dashboard() {
  const nav = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingComplete());

  const stats = [
    { label: "Voice Fidelity", value: "94.7", unit: "", sub: "+2.1 this week", color: "#3A7BD5" },
    { label: "Outputs Created", value: "47", unit: "", sub: "12 this month", color: "#C8961A" },
    { label: "Avg Betterish", value: "812", unit: "", sub: "Ready to Publish", color: "#10b981" },
    { label: "Signals", value: "11", unit: "", sub: "3 high priority", color: "#e85d75" },
  ];

  const sessions = [
    { title: "The compound effect of daily writing", type: "LinkedIn", score: 847, time: "2h ago" },
    { title: "Why most thought leaders sound the same", type: "Newsletter", score: 792, time: "Yesterday" },
    { title: "What I learned from 500 conversations", type: "Essay", score: 921, time: "2d ago" },
    { title: "The future of personal branding", type: "Sunday Story", score: 681, time: "3d ago" },
  ];
  const hasSessions = sessions.length > 0;

  const signals = [
    { label: "AI tools replacing writers", category: "WT", color: "#e85d75", strength: 92 },
    { label: "LinkedIn algorithm favors long-form", category: "TR", color: "#3A7BD5", strength: 87 },
    { label: "Newsletter open rates declining", category: "IN", color: "#C8961A", strength: 74 },
  ];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font)" }}>
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ── Hero strip (reference style): date, greeting, one CTA ───────────── */}
      <FadeCard delay={0}>
        <div style={{
          background: "var(--fg)",
          color: "var(--bg)",
          borderRadius: "var(--studio-radius-lg)",
          padding: "24px 28px",
          marginBottom: "var(--studio-gap-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", opacity: 0.7, marginBottom: 6 }}>
              {getDateLabel()}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {getGreeting()}, Mark.
            </h1>
            <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 400 }}>
              Your studio is ready. Start your first output below.
            </p>
          </div>
          <button
            onClick={() => nav("/studio/work")}
            style={{
              background: "var(--gold-l)",
              color: "#0A0A0A",
              border: "none",
              borderRadius: "var(--studio-radius)",
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontFamily: "var(--font)",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Output
          </button>
        </div>
      </FadeCard>

      {/* ── Sentinel Briefing card (reference: single card, coming soon) ───── */}
      <FadeCard delay={40}>
        <button
          onClick={() => nav("/studio/watch")}
          className="card"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            marginBottom: "var(--studio-gap-lg)",
            cursor: "pointer",
            textAlign: "left",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "var(--studio-radius)",
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Eye size={18} style={{ color: "var(--fg-2)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>Sentinel Briefing</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Coming soon — intelligence monitoring</div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--fg-3)" }} />
        </button>
      </FadeCard>

      {/* ── Quick Start (reference: 5 cards with icon + title + description) ─ */}
      <FadeCard delay={80}>
        <SectionLabel>Quick Start</SectionLabel>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "var(--studio-gap-sm)",
          marginBottom: "var(--studio-gap-lg)",
        }}>
          {QUICK_START.map(({ key, label, desc, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => nav("/studio/work")}
              className="card"
              style={{
                padding: "18px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                textAlign: "center",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "var(--studio-radius)",
                background: `${color}12`,
                border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.3 }}>{desc}</div>
            </button>
          ))}
        </div>
      </FadeCard>

      {/* ── Stats row (ours: keep for power users) ──────────────────────────── */}
      <FadeCard delay={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--studio-gap)", marginBottom: "var(--studio-gap-lg)" }}>
          {stats.map(({ label, value, sub, color }, i) => (
            <div key={i} className="card" style={{ padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: color, opacity: 0.7 }} />
              <div style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--fg)", lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </FadeCard>

      {/* ── Two-column: Projects + Recent Outputs (left) | Sentinel signals (right) ─ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--studio-gap)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--studio-gap-lg)" }}>

          {/* Projects (reference: section + one card, "+ New") ───────────────── */}
          <FadeCard delay={140}>
            <SectionLabel action={<button onClick={() => nav("/studio/projects")} style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", background: "none", border: "none", cursor: "pointer" }}>+ New</button>}>
              Projects
            </SectionLabel>
            <button
              onClick={() => nav("/studio/projects")}
              className="card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--studio-radius)",
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FolderOpen size={18} style={{ color: "var(--fg-2)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>My Studio</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Your primary workspace</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--fg-3)" }}>
                <Clock size={12} />
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </button>
          </FadeCard>

          {/* Recent Outputs (reference: section label + empty state or list) ─── */}
          <FadeCard delay={180}>
            <SectionLabel action={<button onClick={() => nav("/studio/outputs")} style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", background: "none", border: "none", cursor: "pointer" }}>View all</button>}>
              Recent Outputs
            </SectionLabel>
            <div className="card" style={{ overflow: "hidden", minHeight: 200 }}>
              {hasSessions ? (
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
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "var(--studio-radius)",
                        background: "var(--bg-2)", border: "1px solid var(--line)",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, color: "var(--fg-2)", letterSpacing: "0.04em",
                      }}>{type.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{type} · {time}</div>
                      </div>
                      <ScoreChip score={score} />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: "48px 28px",
                  textAlign: "center",
                  color: "var(--fg-3)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  No outputs yet. Click <strong style={{ color: "var(--fg)" }}>New Output</strong> or use Quick Start above to create your first piece.
                </div>
              )}
            </div>
          </FadeCard>
        </div>

        {/* Right column — Sentinel (ours: live signals) ─────────────────────── */}
        <FadeCard delay={150}>
          <div className="card" style={{ overflow: "hidden", height: "fit-content" }}>
            <div style={{
              padding: "16px 18px",
              borderBottom: "1px solid var(--line)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em", marginBottom: 2 }}>Sentinel</h2>
                <div style={{ fontSize: 11, color: "var(--fg-3)" }}>11 signals today</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: "rgba(232,93,117,0.1)", color: "#e85d75",
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
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{label}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                      background: `${color}18`, color, border: `1px solid ${color}30`,
                      borderRadius: 4, padding: "2px 6px", flexShrink: 0, marginLeft: 8,
                    }}>{category}</span>
                  </div>
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
              <button onClick={() => nav("/studio/watch")} className="btn-ghost" style={{ width: "100%", fontSize: 12, padding: "9px" }}>
                View All Signals
              </button>
            </div>
          </div>
        </FadeCard>
      </div>
    </div>
  );
}
