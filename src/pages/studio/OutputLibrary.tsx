import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OUTPUTS = [
  { id:"1", title:"Why most advice is wrong about delegation",       type:"Essay",        score:847, date:"Mar 8",  status:"published" },
  { id:"2", title:"The interview before the essay",                  type:"Newsletter",   score:912, date:"Mar 7",  status:"published" },
  { id:"3", title:"TEDx talk outline: composed intelligence",        type:"Presentation", score:788, date:"Mar 6",  status:"draft"     },
  { id:"4", title:"LinkedIn thread: AI tells to eliminate",          type:"Social",       score:861, date:"Mar 5",  status:"published" },
  { id:"5", title:"Podcast episode 14: the authenticity gap",        type:"Podcast",      score:893, date:"Mar 4",  status:"published" },
  { id:"6", title:"Sunday Story: the conversation I almost avoided", type:"Sunday Story", score:924, date:"Mar 2",  status:"published" },
  { id:"7", title:"What I know about slow thinking",                 type:"Essay",        score:835, date:"Feb 28", status:"draft"     },
  { id:"8", title:"Video script: one thing most consultants miss",   type:"Video",        score:802, date:"Feb 27", status:"draft"     },
];

const SCORE_COLOR = (s: number) => s >= 900 ? "#10b981" : s >= 800 ? "#3A7BD5" : s >= 700 ? "#C8961A" : "#9ca3af";
const TYPES = ["All", "Essay", "Newsletter", "Presentation", "Social", "Podcast", "Sunday Story", "Video"];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)", transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function OutputLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverType, setHoverType] = useState<string | null>(null);

  const filtered = OUTPUTS.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || o.type === filter;
    return matchSearch && matchFilter;
  });

  const published = OUTPUTS.filter(o => o.status === "published").length;
  const avgScore = Math.round(OUTPUTS.reduce((s, o) => s + o.score, 0) / OUTPUTS.length);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000, minHeight: "100vh", fontFamily: "var(--font)" }}>

      {/* Header */}
      <Reveal delay={0}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>Output Library</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.045em", color: "var(--fg)", lineHeight: 1 }}>
              {OUTPUTS.length} pieces
            </h1>
          </div>
          <button onClick={() => navigate("/studio/work/new")} className="btn-primary" style={{ fontSize: 13, padding: "9px 18px" }}>
            New Session
          </button>
        </div>
      </Reveal>

      {/* Summary stats — ruled, no cards */}
      <Reveal delay={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 44 }}>
          {[
            { label: "Published", value: published },
            { label: "In Draft", value: OUTPUTS.length - published },
            { label: "Avg Betterish", value: avgScore },
          ].map(({ label, value }, i) => (
            <div key={i} style={{ padding: "0 24px", borderLeft: i > 0 ? "1px solid var(--line)" : "none", ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
              <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Filter row + search */}
      <Reveal delay={100}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          {/* Type filters — plain text, no pills */}
          <div style={{ display: "flex", gap: 0 }}>
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                onMouseEnter={() => setHoverType(t)}
                onMouseLeave={() => setHoverType(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: filter === t ? 600 : 400,
                  color: filter === t ? "var(--fg)" : hoverType === t ? "var(--fg-2)" : "var(--fg-3)",
                  padding: "6px 12px",
                  paddingLeft: t === "All" ? 0 : 12,
                  letterSpacing: "-0.01em",
                  borderBottom: filter === t ? "1px solid var(--fg)" : "1px solid transparent",
                  transition: "color 0.15s",
                }}
              >{t}</button>
            ))}
          </div>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                background: "none", border: "none", borderBottom: "1px solid var(--line)",
                padding: "6px 0", fontSize: 13, color: "var(--fg)", fontFamily: "var(--font)",
                outline: "none", width: 180, letterSpacing: "-0.01em",
              }}
              onFocus={e => e.target.style.borderBottomColor = "var(--fg)"}
              onBlur={e => e.target.style.borderBottomColor = "var(--line)"}
            />
          </div>
        </div>
      </Reveal>

      {/* Column headers */}
      <Reveal delay={120}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 52px 70px 52px",
          gap: 0,
          paddingBottom: 10,
          borderBottom: "1px solid var(--line)",
          marginBottom: 0,
        }}>
          {["Title", "Type", "Score", "Status", "Date"].map(h => (
            <p key={h} style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", textAlign: h === "Score" || h === "Date" ? "right" : "left" }}>{h}</p>
          ))}
        </div>
      </Reveal>

      {/* Rows */}
      <Reveal delay={140}>
        <div>
          {filtered.map(o => (
            <button
              key={o.id}
              onClick={() => navigate(`/studio/outputs/${o.id}`)}
              onMouseEnter={() => setHoverRow(o.id)}
              onMouseLeave={() => setHoverRow(null)}
              style={{
                width: "100%", background: "none", border: "none",
                borderBottom: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "1fr 120px 52px 70px 52px",
                gap: 0,
                padding: "15px 0",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              <p style={{
                fontSize: 14, fontWeight: 500,
                color: hoverRow === o.id ? "var(--fg)" : "var(--fg-2)",
                letterSpacing: "-0.015em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                paddingRight: 20, transition: "color 0.15s",
              }}>{o.title}</p>
              <p style={{ fontSize: 12, color: "var(--fg-3)", letterSpacing: "-0.01em" }}>{o.type}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: SCORE_COLOR(o.score), textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{o.score}</p>
              <p style={{ fontSize: 11, color: o.status === "published" ? "#10b981" : "var(--fg-3)", textAlign: "left", paddingLeft: 16 }}>{o.status}</p>
              <p style={{ fontSize: 11, color: "var(--fg-3)", textAlign: "right" }}>{o.date}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>No outputs match.</p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
