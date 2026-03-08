import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PROJECTS = [
  {
    id: 1,
    name: "My Studio",
    desc: "General thought leadership content",
    outputs: 10,
    lastActive: "Mar 7",
    score: 881,
    status: "active",
  },
  {
    id: 2,
    name: "TEDx Content",
    desc: "TEDx Santa Barbara 2026 talk and surrounding content",
    outputs: 4,
    lastActive: "Feb 15",
    score: 921,
    status: "active",
  },
  {
    id: 3,
    name: "Book Project",
    desc: "Working title: The Orchestrated Life",
    outputs: 2,
    lastActive: "Jan 12",
    score: 0,
    status: "paused",
  },
];

const SCORE_COLOR = (s: number) => s >= 900 ? "#10b981" : s >= 800 ? "#3A7BD5" : s >= 700 ? "#C8961A" : "var(--fg-3)";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)", transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const totalOutputs = PROJECTS.reduce((s, p) => s + p.outputs, 0);
  const activeProjects = PROJECTS.filter(p => p.status === "active").length;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900, minHeight: "100vh", fontFamily: "var(--font)" }}>

      {/* Header */}
      <Reveal delay={0}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>Projects</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.045em", color: "var(--fg)", lineHeight: 1 }}>
              {PROJECTS.length} active
            </h1>
          </div>
          <button className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
            New Project
          </button>
        </div>
      </Reveal>

      {/* Summary stats */}
      <Reveal delay={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 48 }}>
          {[
            { label: "Active", value: activeProjects },
            { label: "Total Outputs", value: totalOutputs },
            { label: "Paused", value: PROJECTS.length - activeProjects },
          ].map(({ label, value }, i) => (
            <div key={i} style={{ padding: "0 24px", borderLeft: i > 0 ? "1px solid var(--line)" : "none", ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
              <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Column headers */}
      <Reveal delay={100}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 60px", paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
          {["Project", "Outputs", "Avg Score", "Last Active", ""].map((h, i) => (
            <p key={i} style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", textAlign: i > 0 ? "right" : "left" }}>{h}</p>
          ))}
        </div>
      </Reveal>

      {/* Project rows */}
      <Reveal delay={120}>
        <div>
          {PROJECTS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => navigate(`/studio/projects/${p.id}`)}
              onMouseEnter={() => setHoverRow(p.id)}
              onMouseLeave={() => setHoverRow(null)}
              style={{
                width: "100%", background: "none", border: "none",
                borderBottom: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "1fr 80px 80px 80px 60px",
                padding: "20px 0",
                cursor: "pointer", textAlign: "left",
              }}
            >
              {/* Name + desc */}
              <div style={{ paddingRight: 20 }}>
                <p style={{
                  fontSize: 15, fontWeight: 600,
                  color: hoverRow === p.id ? "var(--fg)" : "var(--fg-2)",
                  letterSpacing: "-0.02em", marginBottom: 4,
                  transition: "color 0.15s",
                }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.4 }}>{p.desc}</p>
              </div>

              {/* Outputs */}
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-2)", textAlign: "right", paddingTop: 2, fontVariantNumeric: "tabular-nums" }}>{p.outputs}</p>

              {/* Score */}
              <p style={{ fontSize: 13, fontWeight: 700, color: p.score ? SCORE_COLOR(p.score) : "var(--fg-3)", textAlign: "right", paddingTop: 2, fontVariantNumeric: "tabular-nums" }}>
                {p.score || "--"}
              </p>

              {/* Last active */}
              <p style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "right", paddingTop: 2 }}>{p.lastActive}</p>

              {/* Status */}
              <p style={{ fontSize: 11, fontWeight: 500, color: p.status === "active" ? "#10b981" : "var(--fg-3)", textAlign: "right", paddingTop: 2 }}>{p.status}</p>
            </button>
          ))}
        </div>
      </Reveal>

      {/* CTA — bottom spacer row */}
      <Reveal delay={200}>
        <div style={{ paddingTop: 32 }}>
          <p style={{ fontSize: 12, color: "var(--fg-3)" }}>
            Projects group your outputs and maintain context across sessions.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
