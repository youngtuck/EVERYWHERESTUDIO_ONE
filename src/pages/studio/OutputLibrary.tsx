import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Filter } from "lucide-react";

const OUTPUTS = [
  { id:1, type:"LinkedIn Post", title:"The CEO who reads everything", score:912, date:"Mar 4", status:"published", project:"My Studio" },
  { id:2, type:"Essay", title:"Why slow thinking wins in fast markets", score:847, date:"Mar 1", status:"ready", project:"My Studio" },
  { id:3, type:"Newsletter", title:"February round-up: momentum and motion", score:871, date:"Feb 28", status:"published", project:"My Studio" },
  { id:4, type:"LinkedIn Post", title:"The question I ask every founder", score:763, date:"Feb 25", status:"published", project:"My Studio" },
  { id:5, type:"Essay", title:"Leadership habits of quiet operators", score:0, date:"Mar 7", status:"draft", project:"My Studio" },
  { id:6, type:"Podcast Script", title:"Through Another Lens: The meeting tax", score:889, date:"Feb 20", status:"published", project:"My Studio" },
  { id:7, type:"Newsletter", title:"January edition: the reset issue", score:832, date:"Jan 31", status:"published", project:"My Studio" },
  { id:8, type:"LinkedIn Post", title:"What I learned building the wrong product", score:0, date:"Mar 6", status:"draft", project:"TEDx Content" },
  { id:9, type:"Talk Outline", title:"TEDx 2026: The Orchestrated Life", score:921, date:"Feb 15", status:"ready", project:"TEDx Content" },
  { id:10, type:"Executive Brief", title:"Q1 2026 landscape briefing", score:856, date:"Jan 28", status:"published", project:"My Studio" },
  { id:11, type:"Email Campaign", title:"The thought leader welcome sequence", score:798, date:"Jan 20", status:"ready", project:"My Studio" },
  { id:12, type:"Short Video", title:"Why I journal for 10 minutes every morning", score:0, date:"Mar 5", status:"draft", project:"My Studio" },
];

const STATUS_MAP: Record<string, string> = { draft:"pill-draft", active:"pill-active", ready:"pill-ready", published:"pill-published" };

const ScoreDisplay = ({ score }: { score: number }) => {
  if (score === 0) return <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>—</span>;
  const color = score >= 800 ? "#F5C642" : score >= 600 ? "#188FA7" : "#999";
  return <span style={{ fontSize:13, fontWeight:800, color, fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-0.5px" }}>{score}</span>;
};

const OutputLibrary = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid"|"list">("grid");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const types = ["All Types", ...Array.from(new Set(OUTPUTS.map(o => o.type)))];
  const statuses = ["All Statuses", "draft", "ready", "published"];

  const filtered = OUTPUTS.filter(o =>
    (typeFilter === "All Types" || o.type === typeFilter) &&
    (statusFilter === "All Statuses" || o.status === statusFilter)
  );

  return (
    <div style={{ padding:"28px" }}>
      <div style={{ marginBottom:24 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Library</p>
        <h1 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", fontFamily:"'Afacad Flux',sans-serif" }}>
          Output Library
        </h1>
        <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4, fontFamily:"'Afacad Flux',sans-serif" }}>{OUTPUTS.length} pieces · {OUTPUTS.filter(o=>o.status==="published").length} published</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
        {[types, statuses].map((opts, fi) => (
          <select key={fi} value={fi===0?typeFilter:statusFilter} onChange={e => fi===0?setTypeFilter(e.target.value):setStatusFilter(e.target.value)}
            style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:5, padding:"7px 10px", fontSize:12, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", cursor:"pointer" }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {(["grid","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ background:view===v?"var(--bg-tertiary)":"none", border:"1px solid var(--border)", borderRadius:5, padding:"7px 9px", cursor:"pointer", color:view===v?"var(--text-primary)":"var(--text-muted)" }}>
              {v==="grid"?<Grid size={14}/>:<List size={14}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {view === "grid" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
          {filtered.map(o => (
            <div key={o.id} className="card" style={{ padding:"18px 16px", cursor:"pointer" }}
              onClick={() => navigate(`/studio/outputs/${o.id}`)}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-strong)")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.type}</span>
                <span className={`pill ${STATUS_MAP[o.status]}`}>{o.status}</span>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.45, marginBottom:14, fontFamily:"'Afacad Flux',sans-serif" }}>{o.title}</p>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <ScoreDisplay score={o.score} />
                <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {view === "list" && (
        <div className="card" style={{ overflow:"hidden" }}>
          {filtered.map((o, i) => (
            <div key={o.id} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", alignItems:"center", gap:16, padding:"12px 16px", borderBottom:i<filtered.length-1?"1px solid var(--border)":"none", cursor:"pointer" }}
              onClick={() => navigate(`/studio/outputs/${o.id}`)}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-secondary)")}
              onMouseLeave={e=>(e.currentTarget.style.background="")}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.title}</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"'Afacad Flux',sans-serif" }}>{o.type} · {o.project}</p>
              </div>
              <ScoreDisplay score={o.score} />
              <span className={`pill ${STATUS_MAP[o.status]}`}>{o.status}</span>
              <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", minWidth:40, textAlign:"right" }}>{o.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default OutputLibrary;
