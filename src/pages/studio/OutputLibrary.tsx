import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Download, Filter } from "lucide-react";

type OutputType = "Essay"|"LinkedIn Post"|"Newsletter"|"Podcast Script"|"Sunday Story"|"Twitter Thread"|"Short Video"|"Talk Outline";
type StatusType = "published"|"draft"|"in-review";

interface Output {
  id: number; type: OutputType; title: string; score: number;
  status: StatusType; date: string; words: number; project: string;
}

const TYPE_COLOR: Record<OutputType, string> = {
  "Essay":"#4A90D9", "LinkedIn Post":"#0A66C2", "Newsletter":"#F5C642",
  "Podcast Script":"#9B7ECC", "Sunday Story":"#188FA7", "Twitter Thread":"#1DA1F2",
  "Short Video":"#DC4444", "Talk Outline":"#E8A820",
};

const OUTPUTS: Output[] = [
  { id:1,  type:"Essay",          title:"Leadership habits of quiet operators",           score:912, status:"published", date:"Mar 4",  words:2840, project:"Thought Leadership" },
  { id:2,  type:"LinkedIn Post",  title:"The CEO who reads everything",                   score:871, status:"published", date:"Mar 1",  words:320,  project:"Thought Leadership" },
  { id:3,  type:"Newsletter",     title:"February round-up: signal vs noise",             score:847, status:"published", date:"Feb 28", words:1200, project:"Thought Leadership" },
  { id:4,  type:"Essay",          title:"Why slow thinking wins in fast markets",          score:763, status:"draft",     date:"Feb 25", words:1640, project:"Thought Leadership" },
  { id:5,  type:"Podcast Script", title:"The Quiet Leader podcast — EP 12",               score:891, status:"published", date:"Feb 20", words:3100, project:"Podcast" },
  { id:6,  type:"Sunday Story",   title:"What the tide taught me about patience",         score:923, status:"published", date:"Feb 16", words:1800, project:"Sunday Story" },
  { id:7,  type:"Twitter Thread", title:"8 leadership principles I had to unlearn",       score:856, status:"published", date:"Feb 12", words:480,  project:"Thought Leadership" },
  { id:8,  type:"Talk Outline",   title:"TEDx Santa Barbara 2026 — draft outline",        score:734, status:"in-review", date:"Feb 10", words:2200, project:"Speaking" },
  { id:9,  type:"LinkedIn Post",  title:"The delegation myth",                            score:888, status:"published", date:"Feb 8",  words:290,  project:"Thought Leadership" },
  { id:10, type:"Newsletter",     title:"January: Three things I got wrong",              score:812, status:"published", date:"Jan 31", words:1100, project:"Thought Leadership" },
  { id:11, type:"Short Video",    title:"60-second: Why 'move fast' is bad advice",       score:867, status:"published", date:"Jan 28", words:180,  project:"Video" },
  { id:12, type:"Essay",          title:"The operator mindset vs the visionary mindset",  score:844, status:"published", date:"Jan 22", words:2600, project:"Thought Leadership" },
];

const STATUS_COLOR: Record<StatusType, string> = {
  published:"#188FA7", draft:"var(--text-muted)", "in-review":"#F5C642",
};

function ScoreBar({ score }: { score: number }) {
  const c = score >= 800 ? "#F5C642" : score >= 600 ? "#188FA7" : "#999";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:52, height:2, background:"var(--bg-tertiary)", borderRadius:1, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(score/1000)*100}%`, background:c, borderRadius:1 }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:c, fontFamily:"'Afacad Flux',sans-serif",
        letterSpacing:"-.02em", minWidth:28 }}>{score}</span>
    </div>
  );
}

export default function OutputLibrary() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<OutputType|"All">("All");
  const [statusFilter, setStatusFilter] = useState<StatusType|"All">("All");
  const [sortBy, setSortBy] = useState<"date"|"score">("date");

  const allTypes: (OutputType|"All")[] = ["All","Essay","LinkedIn Post","Newsletter","Podcast Script","Sunday Story","Twitter Thread","Short Video","Talk Outline"];

  let results = OUTPUTS
    .filter(o => !query || o.title.toLowerCase().includes(query.toLowerCase()) || o.type.toLowerCase().includes(query.toLowerCase()))
    .filter(o => typeFilter === "All" || o.type === typeFilter)
    .filter(o => statusFilter === "All" || o.status === statusFilter);

  if (sortBy === "score") results = [...results].sort((a,b) => b.score - a.score);

  const published = OUTPUTS.filter(o => o.status==="published").length;
  const avgScore = Math.round(OUTPUTS.reduce((a,o) => a+o.score, 0) / OUTPUTS.length);

  return (
    <div style={{ padding:"44px 40px 80px", maxWidth:1040, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontSize:"clamp(24px,3vw,36px)", fontWeight:800, color:"var(--text-primary)",
          letterSpacing:"-.04em", fontFamily:"'Afacad Flux',sans-serif", marginBottom:6 }}>
          Output Library
        </h1>
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>
          {OUTPUTS.length} total outputs · {published} published · avg Betterish {avgScore}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
        {/* Search */}
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            color:"var(--text-muted)" }} />
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search outputs..."
            style={{ width:"100%", padding:"9px 12px 9px 34px", background:"var(--bg-secondary)",
              border:"1px solid var(--border)", borderRadius:8, fontSize:13,
              color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", outline:"none" }} />
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as StatusType|"All")}
          style={{ padding:"9px 12px", background:"var(--bg-secondary)", border:"1px solid var(--border)",
            borderRadius:8, fontSize:13, color:"var(--text-primary)",
            fontFamily:"'Afacad Flux',sans-serif", outline:"none", cursor:"pointer" }}>
          <option value="All">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="in-review">In Review</option>
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as "date"|"score")}
          style={{ padding:"9px 12px", background:"var(--bg-secondary)", border:"1px solid var(--border)",
            borderRadius:8, fontSize:13, color:"var(--text-primary)",
            fontFamily:"'Afacad Flux',sans-serif", outline:"none", cursor:"pointer" }}>
          <option value="date">Sort: newest</option>
          <option value="score">Sort: score</option>
        </select>
      </div>

      {/* Type filter pills */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:24, paddingBottom:20,
        borderBottom:"1px solid var(--border)" }}>
        {allTypes.map(t => (
          <button key={t} onClick={() => setTypeFilter(t as OutputType|"All")}
            style={{ padding:"5px 12px", borderRadius:100, border:"1px solid",
              borderColor:typeFilter===t?(t==="All"?"var(--border-strong)":TYPE_COLOR[t as OutputType]):"var(--border)",
              background:typeFilter===t?"var(--bg-secondary)":"transparent",
              color:typeFilter===t?(t==="All"?"var(--text-primary)":TYPE_COLOR[t as OutputType]):"var(--text-muted)",
              cursor:"pointer", fontSize:11, fontWeight:500,
              fontFamily:"'Afacad Flux',sans-serif", transition:"all .15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 80px 36px",
          padding:"10px 20px", borderBottom:"1px solid var(--border)",
          gap:12, alignItems:"center" }}>
          {["Output","Type","Date","Score",""].map(h => (
            <span key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
              color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{h}</span>
          ))}
        </div>

        {results.length === 0 ? (
          <div style={{ padding:"48px 20px", textAlign:"center", color:"var(--text-muted)",
            fontFamily:"'Afacad Flux',sans-serif", fontSize:14 }}>
            No outputs match your filters.
          </div>
        ) : results.map((o, i) => (
          <div key={o.id}
            onClick={() => navigate(`/studio/outputs/${o.id}`)}
            style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 80px 36px",
              padding:"14px 20px", borderBottom:i<results.length-1?"1px solid var(--border)":"none",
              gap:12, alignItems:"center", cursor:"pointer", transition:"background .12s" }}
            onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-tertiary)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>

            {/* Title + status */}
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:2 }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em",
                  textTransform:"uppercase", color:STATUS_COLOR[o.status],
                  fontFamily:"'Afacad Flux',sans-serif" }}>{o.status}</span>
                {o.words && <span style={{ fontSize:10, color:"var(--text-muted)",
                  fontFamily:"'Afacad Flux',sans-serif" }}>{o.words.toLocaleString()}w</span>}
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)",
                fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-.02em",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.title}</p>
            </div>

            {/* Type badge */}
            <span style={{ fontSize:10, fontWeight:600, color:TYPE_COLOR[o.type],
              fontFamily:"'Afacad Flux',sans-serif", letterSpacing:".02em",
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.type}</span>

            {/* Date */}
            <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.date}</span>

            {/* Score */}
            <ScoreBar score={o.score} />

            {/* Arrow */}
            <ChevronRight size={13} style={{ color:"var(--text-muted)" }} />
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
          marginTop:12, textAlign:"right" }}>
          Showing {results.length} of {OUTPUTS.length} outputs
        </p>
      )}
    </div>
  );
}
