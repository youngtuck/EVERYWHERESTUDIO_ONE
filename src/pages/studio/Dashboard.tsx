import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, TrendingUp, Zap, Eye, Clock, ChevronRight } from "lucide-react";

const RECENT_OUTPUTS = [
  { id:1, type:"Essay",          title:"Leadership habits of quiet operators",  score:912, status:"published", date:"Mar 4",  color:"#4A90D9" },
  { id:2, type:"LinkedIn Post",  title:"The CEO who reads everything",           score:871, status:"published", date:"Mar 1",  color:"#F5C642" },
  { id:3, type:"Newsletter",     title:"February round-up: signal vs noise",    score:847, status:"published", date:"Feb 28", color:"#188FA7" },
  { id:4, type:"Essay",          title:"Why slow thinking wins in fast markets", score:763, status:"draft",     date:"Feb 25", color:"#4A90D9" },
];

const SIGNALS = [
  { strength:"high",  text:"AI leadership content spiked 38% this week — your angle is ready", tag:"Opportunity" },
  { strength:"med",   text:"Competitor published on burnout — a gap just opened", tag:"Gap" },
  { strength:"med",   text:"Your 'delegation' essay trending in SB entrepreneur circles", tag:"Momentum" },
  { strength:"low",   text:"Podcast listeners peaked Tue 7am — adjust your schedule", tag:"Timing" },
];

const OUTPUT_TYPES = ["Essay","Sunday Story","LinkedIn Post","Newsletter","Podcast Script","Twitter Thread","Short Video","Talk Outline"];

const VOICE_DIMS = [
  { label:"Cadence",   val:96 },
  { label:"Depth",     val:94 },
  { label:"Clarity",   val:93 },
  { label:"Authority", val:97 },
  { label:"Warmth",    val:91 },
];

function ScorePill({ score }: { score: number }) {
  const c = score >= 800 ? "#F5C642" : score >= 600 ? "#188FA7" : "#999";
  return (
    <span style={{ fontSize:12, fontWeight:700, color:c, fontFamily:"'Afacad Flux',sans-serif",
      background:`${c}14`, padding:"2px 8px", borderRadius:4, letterSpacing:"-0.01em" }}>
      {score}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Essay");
  const [mounted, setMounted] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  const fi = (d: number) => ({
    opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(10px)",
    transition: `opacity .6s ${d}s ease, transform .6s ${d}s ease`,
  });

  return (
    <div style={{ padding:"44px 40px 80px", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ ...fi(0), marginBottom:48 }}>
        <p style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
          letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
        </p>
        <h1 style={{ fontSize:"clamp(32px,3.5vw,48px)", fontWeight:800, color:"var(--text-primary)",
          letterSpacing:"-.04em", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0, marginBottom:20 }}>
          {greeting}, Mark.
        </h1>

        {/* Primary CTA */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={() => setNewSessionOpen(true)}
            style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--text-primary)",
              color:"var(--bg-primary)", border:"none", cursor:"pointer", fontSize:14, fontWeight:700,
              padding:"12px 24px", borderRadius:8, fontFamily:"'Afacad Flux',sans-serif",
              letterSpacing:"-0.02em", transition:"opacity .15s" }}
            onMouseEnter={e=>(e.currentTarget.style.opacity=".82")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
            <Plus size={15} /> New Session
          </button>
          <button onClick={() => navigate("/studio/watch")}
            style={{ display:"inline-flex", alignItems:"center", gap:8, background:"none",
              color:"var(--text-secondary)", border:"1px solid var(--border)", cursor:"pointer",
              fontSize:14, fontWeight:500, padding:"12px 20px", borderRadius:8,
              fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-0.02em", transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-strong)";e.currentTarget.style.color="var(--text-primary)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-secondary)";}}>
            <Eye size={14} /> Today's Watch Briefing
          </button>
        </div>
      </div>

      {/* New session modal */}
      {newSessionOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,.6)", backdropFilter:"blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setNewSessionOpen(false); }}>
          <div style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:14,
            padding:"32px", width:480, maxWidth:"calc(100vw - 40px)", boxShadow:"0 24px 80px rgba(0,0,0,.4)" }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif",
              letterSpacing:"-.04em", marginBottom:6 }}>New Work Session</h2>
            <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:24 }}>
              What are we making today?
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
              {OUTPUT_TYPES.map(t => (
                <button key={t} onClick={() => setSelectedType(t)}
                  style={{ padding:"10px 14px", textAlign:"left", borderRadius:7,
                    border:`1px solid ${selectedType===t?"var(--border-strong)":"var(--border)"}`,
                    background:selectedType===t?"var(--bg-secondary)":"transparent",
                    cursor:"pointer", fontSize:13, fontWeight:selectedType===t?600:400,
                    color:selectedType===t?"var(--text-primary)":"var(--text-secondary)",
                    fontFamily:"'Afacad Flux',sans-serif", transition:"all .15s",
                    letterSpacing:"-0.01em" }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setNewSessionOpen(false); navigate("/studio/work?type="+encodeURIComponent(selectedType)); }}
                style={{ flex:1, background:"var(--text-primary)", color:"var(--bg-primary)", border:"none",
                  borderRadius:8, padding:"13px", cursor:"pointer", fontSize:14, fontWeight:700,
                  fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-.02em", display:"flex",
                  alignItems:"center", justifyContent:"center", gap:8 }}>
                Start Session <ArrowRight size={15} />
              </button>
              <button onClick={() => setNewSessionOpen(false)}
                style={{ padding:"13px 18px", background:"none", border:"1px solid var(--border)",
                  borderRadius:8, cursor:"pointer", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", fontSize:13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:28 }} className="dash-grid">

        {/* ── Left column ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* In Progress */}
          <div style={{ ...fi(.08) }}>
            <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
              color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:14 }}>
              In Progress
            </p>
            <div onClick={() => navigate("/studio/work/1")}
              style={{ padding:"24px 26px", background:"var(--bg-secondary)",
                border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", transition:"all .18s" }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="var(--border-strong)";el.style.boxShadow="var(--shadow-sm)";}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="var(--border)";el.style.boxShadow="none";}}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase",
                    color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Essay</span>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                    background:"rgba(24,143,167,0.08)", color:"#188FA7",
                    border:"1px solid rgba(24,143,167,0.15)", fontFamily:"'Afacad Flux',sans-serif",
                    fontWeight:600 }}>Gate 5 of 7</span>
                </div>
                <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
                  display:"flex", alignItems:"center", gap:4 }}>
                  <Clock size={10} /> 2 days ago
                </span>
              </div>

              <h3 style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-.035em",
                fontFamily:"'Afacad Flux',sans-serif", marginBottom:14, lineHeight:1.2 }}>
                Leadership habits of quiet operators
              </h3>

              {/* Gate progress visual */}
              <div style={{ display:"flex", gap:3, marginBottom:10 }}>
                {[1,2,3,4,5,6,7].map(n => (
                  <div key={n} style={{ flex:1, height:3, borderRadius:2,
                    background:n<=4?"#188FA7":n===5?"#F5C642":"var(--bg-tertiary)" }} />
                ))}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>
                  Betterish: 763 — needs Impact Gate
                </span>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)",
                  fontFamily:"'Afacad Flux',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
                  Resume <ChevronRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* Recent Outputs */}
          <div style={{ ...fi(.16) }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
                color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Recent Outputs</p>
              <button onClick={() => navigate("/studio/outputs")}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:12,
                  color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
                  display:"flex", alignItems:"center", gap:4 }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")}
                onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              {RECENT_OUTPUTS.map((o, i) => (
                <div key={o.id} onClick={() => navigate(`/studio/outputs/${o.id}`)}
                  style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
                    borderBottom:i<RECENT_OUTPUTS.length-1?"1px solid var(--border)":"none",
                    cursor:"pointer", transition:"background .15s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-tertiary)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <div style={{ width:3, height:32, borderRadius:2, background:o.color, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em",
                        textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.type}</span>
                      <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>· {o.date}</span>
                      {o.status === "draft" && (
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3,
                          background:"var(--bg-tertiary)", color:"var(--text-muted)",
                          fontFamily:"'Afacad Flux',sans-serif", fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
                          Draft
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)",
                      fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-.02em",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.title}</p>
                  </div>
                  <ScorePill score={o.score} />
                </div>
              ))}
            </div>
          </div>

          {/* Production stats row */}
          <div style={{ ...fi(.22), display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              { icon:TrendingUp, label:"This Month",   val:"7",   sub:"outputs published", color:"#4A90D9" },
              { icon:Zap,        label:"Avg Score",    val:"884", sub:"Betterish average",  color:"#F5C642" },
              { icon:Eye,        label:"Signals Today",val:"12",  sub:"from Sentinel",      color:"#188FA7" },
            ].map(({ icon:Icon, label, val, sub, color }) => (
              <div key={label} style={{ padding:"18px 20px", background:"var(--bg-secondary)",
                border:"1px solid var(--border)", borderRadius:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
                    color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{label}</span>
                  <Icon size={13} style={{ color:"var(--text-muted)" }} />
                </div>
                <div style={{ fontSize:32, fontWeight:800, color, fontFamily:"'Afacad Flux',sans-serif",
                  letterSpacing:"-.04em", lineHeight:1, marginBottom:4 }}>{val}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Voice Fidelity */}
          <div style={{ ...fi(.1), padding:"22px", background:"var(--bg-secondary)",
            border:"1px solid var(--border)", borderRadius:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
                color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity</p>
              <span style={{ fontSize:10, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif", fontWeight:600 }}>↑ 2.3</span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:14 }}>
              <span style={{ fontSize:42, fontWeight:800, color:"#F5C642", letterSpacing:"-.05em",
                fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>94.7</span>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>/100</span>
            </div>
            {VOICE_DIMS.map(dim => (
              <div key={dim.label} style={{ marginBottom:7 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{dim.label}</span>
                  <span style={{ fontSize:10, fontWeight:600, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{dim.val}</span>
                </div>
                <div style={{ height:2, background:"var(--bg-tertiary)", borderRadius:1, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${dim.val}%`,
                    background:"linear-gradient(90deg,#E8A820,#F5C642)", borderRadius:1 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Sentinel Signals */}
          <div style={{ ...fi(.18), padding:"22px", background:"var(--bg-secondary)",
            border:"1px solid var(--border)", borderRadius:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
                color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Today's Signals</p>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#188FA7", display:"block",
                boxShadow:"0 0 8px rgba(24,143,167,.7)" }} />
            </div>
            {SIGNALS.map((s, i) => (
              <div key={i} style={{ marginBottom:i<SIGNALS.length-1?12:0, paddingBottom:i<SIGNALS.length-1?12:0,
                borderBottom:i<SIGNALS.length-1?"1px solid var(--border)":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em",
                    color:s.strength==="high"?"#F5C642":s.strength==="med"?"#188FA7":"var(--text-muted)",
                    textTransform:"uppercase", fontFamily:"'Afacad Flux',sans-serif" }}>{s.tag}</span>
                  <div style={{ width:4, height:4, borderRadius:"50%", flexShrink:0,
                    background:s.strength==="high"?"#F5C642":s.strength==="med"?"#188FA7":"var(--border-strong)" }} />
                </div>
                <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.55,
                  fontFamily:"'Afacad Flux',sans-serif" }}>{s.text}</p>
              </div>
            ))}
            <button onClick={() => navigate("/studio/watch")}
              style={{ display:"flex", alignItems:"center", gap:5, marginTop:16, background:"none", border:"none",
                cursor:"pointer", fontSize:12, fontWeight:600, color:"#188FA7",
                fontFamily:"'Afacad Flux',sans-serif" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity=".7")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              Full briefing <ChevronRight size={12} />
            </button>
          </div>

          {/* The Lot */}
          <div style={{ ...fi(.24), padding:"18px 22px", background:"none",
            border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", transition:"all .15s" }}
            onClick={() => navigate("/studio/lot")}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="var(--border-strong)";el.style.background="var(--bg-secondary)";}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="var(--border)";el.style.background="none";}}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)",
                  fontFamily:"'Afacad Flux',sans-serif", marginBottom:2, letterSpacing:"-.02em" }}>The Lot</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>14 parked ideas</p>
              </div>
              <ChevronRight size={14} style={{ color:"var(--text-muted)" }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:800px){.dash-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}
