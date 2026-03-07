import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, Zap } from "lucide-react";

const RECENT = [
  { type:"LinkedIn Post", title:"The CEO who reads everything", score:912, date:"Mar 4" },
  { type:"Essay", title:"Why slow thinking wins", score:847, date:"Mar 1" },
  { type:"Newsletter", title:"February round-up", score:871, date:"Feb 28" },
];

const SIGNALS = [
  "AI leadership content spiked 38% this week — angle ready",
  "Competitor published on burnout — gap identified",
  "Your 'delegation' essay trending in SB entrepreneur circles",
];

function ScoreBar({ score }: { score: number }) {
  const c = score >= 800 ? "#E8A820" : score >= 600 ? "#188FA7" : "var(--text-muted)";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
      <div style={{ flex:1, height:2, background:"var(--bg-tertiary)", borderRadius:1, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(score/1000)*100}%`, background:c, borderRadius:1 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:c, fontFamily:"'Geist',sans-serif", minWidth:28 }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding:"48px 40px", maxWidth:960, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:56 }}>
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", marginBottom:8, letterSpacing:"-0.01em" }}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
        </p>
        <h1 style={{ fontSize:"clamp(28px,3vw,42px)", fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.04em", fontFamily:"'Geist',sans-serif", lineHeight:1.08, marginBottom:16 }}>
          {greeting}, Mark.
        </h1>
        {/* Primary CTA — the single most important action */}
        <button onClick={() => navigate("/studio/work")}
          style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--text-primary)", color:"var(--bg-primary)", border:"none", cursor:"pointer", fontSize:14, fontWeight:600, padding:"14px 28px", borderRadius:8, fontFamily:"'Geist',sans-serif", transition:"opacity 0.15s", letterSpacing:"-0.02em" }}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.82")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
          Start a new session <ArrowRight size={15} />
        </button>
      </div>

      {/* Two column: main + sidebar */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:32 }} className="dash-grid">

        {/* Left — primary content */}
        <div>
          {/* In progress — the 1 most important item */}
          <div style={{ marginBottom:40 }}>
            <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", marginBottom:16 }}>In Progress</p>
            <div
              style={{ padding:"24px 28px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", transition:"all 0.15s" }}
              onClick={() => navigate("/studio/work/1")}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-strong)";e.currentTarget.style.boxShadow="var(--shadow-sm)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>Essay</span>
                <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4, background:"rgba(24,143,167,0.08)", color:"#188FA7", border:"1px solid rgba(24,143,167,0.15)", fontFamily:"'Geist',sans-serif" }}>Gate 5 of 7</span>
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.03em", fontFamily:"'Geist',sans-serif", marginBottom:6, lineHeight:1.3 }}>
                Leadership habits of quiet operators
              </h3>
              <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", marginBottom:16 }}>Last edited 2 days ago</p>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <div style={{ flex:1, height:3, background:"var(--bg-tertiary)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:"71%", background:"linear-gradient(90deg,#188FA7,#4A90D9)", borderRadius:2 }} />
                </div>
                <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", minWidth:32 }}>71%</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
                <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>Betterish: 763 → needs Impact Gate</span>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Geist',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
                  Resume <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* Recent outputs */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>Recent Outputs</p>
              <button onClick={() => navigate("/studio/outputs")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", display:"flex", alignItems:"center", gap:4, letterSpacing:"-0.01em" }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--text-primary)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-muted)")}>
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div style={{ borderTop:"1px solid var(--border)" }}>
              {RECENT.map((o,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                  onClick={() => navigate("/studio/outputs/"+(i+1))}
                  onMouseEnter={e=>(e.currentTarget.style.opacity="0.7")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>{o.type}</span>
                      <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>·  {o.date}</span>
                    </div>
                    <p style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Geist',sans-serif", letterSpacing:"-0.02em" }}>{o.title}</p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <span style={{ fontSize:16, fontWeight:700, color:o.score>=800?"#E8A820":"#188FA7", fontFamily:"'Geist',sans-serif", letterSpacing:"-0.02em" }}>{o.score}</span>
                    <p style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>Betterish</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Voice Fidelity */}
          <div style={{ padding:"22px 24px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10 }}>
            <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif", marginBottom:14 }}>Voice Fidelity</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
              <span style={{ fontSize:40, fontWeight:700, color:"#E8A820", letterSpacing:"-0.04em", fontFamily:"'Geist',sans-serif", lineHeight:1 }}>94.7</span>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>/ 100</span>
            </div>
            <div style={{ height:3, background:"var(--bg-tertiary)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:"94.7%", background:"linear-gradient(90deg,#E8A820,#F5C642)", borderRadius:2 }} />
            </div>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>↑ 2.3 since last session</p>
          </div>

          {/* Sentinel signals */}
          <div style={{ padding:"22px 24px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>Today's Signals</p>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#188FA7", display:"inline-block", boxShadow:"0 0 8px rgba(24,143,167,0.6)" }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {SIGNALS.map((s,i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"#188FA7", marginTop:5, flexShrink:0 }} />
                  <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.55, fontFamily:"'Geist',sans-serif", letterSpacing:"-0.01em" }}>{s}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/studio/watch")}
              style={{ display:"flex", alignItems:"center", gap:6, marginTop:16, background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"#188FA7", fontFamily:"'Geist',sans-serif", letterSpacing:"-0.01em" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.7")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              Full briefing <ArrowRight size={11} />
            </button>
          </div>

          {/* Quick action */}
          <button onClick={() => navigate("/studio/work")}
            style={{ padding:"16px 20px", background:"none", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", textAlign:"left", transition:"all 0.15s", display:"flex", alignItems:"center", gap:12 }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border-strong)";e.currentTarget.style.background="var(--bg-secondary)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="none";}}>
            <Zap size={16} style={{ color:"#E8A820", flexShrink:0 }} />
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Geist',sans-serif", letterSpacing:"-0.02em" }}>Quick capture</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Geist',sans-serif" }}>Speak an idea, Watson listens</p>
            </div>
          </button>
        </div>
      </div>

      <style>{`@media(max-width:800px){.dash-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
