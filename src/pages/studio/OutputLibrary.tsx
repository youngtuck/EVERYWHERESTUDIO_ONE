import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OUTPUTS = [
  { id:"1", title:"Why most advice is wrong about delegation",       type:"essay",        score:847, date:"Mar 8",  status:"published" },
  { id:"2", title:"The interview before the essay",                 type:"newsletter",   score:912, date:"Mar 7",  status:"published" },
  { id:"3", title:"TEDx talk outline: composed intelligence",       type:"presentation", score:788, date:"Mar 6",  status:"draft" },
  { id:"4", title:"LinkedIn thread: AI tells to eliminate",         type:"social",       score:861, date:"Mar 5",  status:"published" },
  { id:"5", title:"Podcast episode 14: the authenticity gap",       type:"podcast",      score:893, date:"Mar 4",  status:"published" },
  { id:"6", title:"Sunday Story: the conversation I almost avoided",type:"sunday_story", score:924, date:"Mar 2",  status:"published" },
  { id:"7", title:"What I know about slow thinking",               type:"essay",        score:835, date:"Feb 28", status:"draft" },
  { id:"8", title:"Video script: one thing most consultants miss",  type:"video",        score:802, date:"Feb 27", status:"draft" },
];

const TYPE_COLORS: Record<string, string> = {
  essay:"#4A90D9", newsletter:"#50c8a0", presentation:"#F5A623",
  social:"#a080f5", podcast:"#F5C642", video:"#e85d75",
  sunday_story:"#F5C642", freestyle:"#4A90D9",
};

const TYPE_LABELS: Record<string, string> = {
  essay:"Essay", newsletter:"Newsletter", presentation:"Presentation",
  social:"Social", podcast:"Podcast", video:"Video",
  sunday_story:"Sunday Story", freestyle:"Freestyle",
};

export default function OutputLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = OUTPUTS.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.type === filter;
    return matchSearch && matchFilter;
  });

  const scoreColor = (s: number) => s >= 900 ? "#50c8a0" : s >= 800 ? "#4A90D9" : "#F5C642";

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto", fontFamily: "var(--font)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-.03em", marginBottom: 4 }}>Outputs</h1>
          <p style={{ fontSize: 13, color: "var(--fg-3)", fontWeight: 300 }}>{OUTPUTS.length} pieces produced</p>
        </div>
        <button onClick={() => navigate("/studio/work/new")} style={{
          background: "var(--fg)", border: "none", borderRadius: 8, padding: "9px 18px",
          cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--bg)",
          fontFamily: "var(--font)", transition: "opacity .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >New Session</button>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: .4 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search outputs..."
            style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px 8px 30px", fontSize: 13, color: "var(--fg)", fontFamily: "var(--font)", outline: "none", transition: "border-color .15s", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = "var(--blue)"}
            onBlur={e => e.target.style.borderColor = "var(--line)"}
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8,
          padding: "8px 12px", fontSize: 13, color: "var(--fg)", fontFamily: "var(--font)", outline: "none",
        }}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map(o => (
          <button key={o.id} onClick={() => navigate(`/studio/outputs/${o.id}`)} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "none", border: "none", borderRadius: 8, padding: "11px 12px",
            cursor: "pointer", textAlign: "left", fontFamily: "var(--font)", width: "100%",
            transition: "background .12s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[o.type] || "#4A90D9", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", fontWeight: 400, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
            <span style={{ fontSize: 11, color: "var(--fg-3)", width: 90, flexShrink: 0 }}>{TYPE_LABELS[o.type] || o.type}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(o.score), width: 42, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{o.score}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, flexShrink: 0,
              background: o.status === "published" ? "rgba(80,200,160,.1)" : "rgba(255,255,255,.06)",
              color: o.status === "published" ? "#50c8a0" : "var(--fg-3)",
              border: `1px solid ${o.status === "published" ? "rgba(80,200,160,.2)" : "var(--line)"}`,
            }}>{o.status}</span>
            <span style={{ fontSize: 11, color: "var(--fg-3)", width: 48, textAlign: "right", flexShrink: 0 }}>{o.date}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>No outputs match your search.</div>
        )}
      </div>
    </div>
  );
}
