import { useNavigate } from "react-router-dom";
import { PenLine, Eye, TrendingUp, Clock, CheckCircle, ArrowRight, Lightbulb, BarChart2 } from "lucide-react";

const ACTIVE_ITEMS = [
  { type: "Essay", title: "Leadership habits of quiet operators", status: "In Progress", statusClass: "pill-active" },
  { type: "LinkedIn Post", title: "The AI tools nobody talks about", status: "Draft", statusClass: "pill-draft" },
  { type: "Newsletter", title: "March edition — momentum edition", status: "Ready", statusClass: "pill-ready" },
];

const RECENT_OUTPUTS = [
  { type: "LinkedIn Post", title: "The CEO who reads everything", score: 912, date: "Mar 4" },
  { type: "Essay", title: "Why slow thinking wins", score: 847, date: "Mar 1" },
  { type: "Newsletter", title: "February round-up", score: 871, date: "Feb 28" },
];

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 800 ? "#F5C642" : score >= 600 ? "#188FA7" : "#999999";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div className="score-bar-track" style={{ flex:1 }}>
        <div className="score-bar-fill" style={{ width:`${(score/1000)*100}%`, background:color }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, fontFamily:"'Afacad Flux',sans-serif", minWidth:28 }}>{score}</span>
    </div>
  );
};

// First session state — shown if no prior work
const FirstSession = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 54px)", padding:24 }}>
      <div style={{ maxWidth:460, textAlign:"center" }}>
        <div style={{ width:56, height:56, borderRadius:12, background:"var(--bg-secondary)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <PenLine size={22} style={{ color:"var(--text-muted)" }} />
        </div>
        <h2 style={{ fontSize:"clamp(24px,3vw,32px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>
          Good morning. Your studio is ready.
        </h2>
        <p style={{ fontSize:15, color:"var(--text-secondary)", lineHeight:1.7, marginBottom:36, fontFamily:"'Afacad Flux',sans-serif" }}>
          Watson is here. What would you like to make today? Or I can set up your studio first — takes about 3 minutes.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-primary" onClick={() => navigate("/studio/work")}>Let's Make Something</button>
          <button className="btn-ghost" onClick={() => navigate("/studio/work?setup=true")}>Set Up My Studio First</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const firstSession = false; // Set to true to see first session state

  if (firstSession) return <FirstSession />;

  return (
    <div style={{ padding:"32px 28px", maxWidth:1200 }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Dashboard</p>
        <h1 style={{ fontSize:"clamp(24px,3vw,36px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", fontFamily:"'Afacad Flux',sans-serif" }}>
          Good morning, Mark.
        </h1>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginTop:4, fontFamily:"'Afacad Flux',sans-serif" }}>
          Saturday, March 7, 2026
        </p>
      </div>

      {/* 3-column grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }} className="dashboard-grid">

        {/* Col 1 — Active */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <Clock size={13} style={{ color:"var(--text-muted)" }} />
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Today's Focus</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ACTIVE_ITEMS.map((item, i) => (
              <div key={i} className="card" style={{ padding:"14px 16px", cursor:"pointer" }}
                onClick={() => navigate("/studio/work/" + (i+1))}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-strong)")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{item.type}</span>
                  <span className={`pill ${item.statusClass}`}>{item.status}</span>
                </div>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.4, fontFamily:"'Afacad Flux',sans-serif" }}>{item.title}</p>
              </div>
            ))}
            <button className="btn-ghost" onClick={() => navigate("/studio/work")} style={{ marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <PenLine size={13} /> New Session
            </button>
          </div>
        </div>

        {/* Col 2 — What's Next */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <Lightbulb size={13} style={{ color:"var(--text-muted)" }} />
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>What's Next</span>
          </div>
          {/* Suggestion card */}
          <div style={{ background:"rgba(245,198,66,0.04)", border:"1px solid rgba(245,198,66,0.14)", borderRadius:8, padding:"16px", marginBottom:12 }}>
            <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.65, marginBottom:14, fontFamily:"'Afacad Flux',sans-serif" }}>
              You haven't published in 8 days. The leadership essay is 70% through gates. Ready to pick it up?
            </p>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-gold" style={{ padding:"8px 16px", fontSize:10 }} onClick={() => navigate("/studio/work/1")}>Pick It Up</button>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Not Now</button>
            </div>
          </div>
          {/* Recent outputs */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, marginTop:20 }}>
            <BarChart2 size={13} style={{ color:"var(--text-muted)" }} />
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Recent Outputs</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {RECENT_OUTPUTS.map((o, i) => (
              <div key={i} className="card" style={{ padding:"12px 14px", cursor:"pointer" }} onClick={() => navigate("/studio/outputs/" + (i+1))}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.type}</span>
                  <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{o.date}</span>
                </div>
                <p style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:8, fontFamily:"'Afacad Flux',sans-serif" }}>{o.title}</p>
                <ScoreBar score={o.score} />
              </div>
            ))}
          </div>
        </div>

        {/* Col 3 — Sentinel */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <Eye size={13} style={{ color:"var(--text-muted)" }} />
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Watch</span>
          </div>
          <div className="card" style={{ padding:"16px", marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:10, fontFamily:"'Afacad Flux',sans-serif" }}>Today · Mar 7</p>
            {[
              { icon: TrendingUp, label: "3 content triggers", color: "#188FA7" },
              { icon: Eye, label: "1 competitor move", color: "#F5C642" },
              { icon: Clock, label: "2 upcoming events", color: "var(--text-muted)" },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <s.icon size={13} style={{ color:s.color }} />
                <span style={{ fontSize:13, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</span>
              </div>
            ))}
            <button className="btn-ghost" style={{ marginTop:8, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 16px" }} onClick={() => navigate("/studio/watch")}>
              View Full Briefing <ArrowRight size={12} />
            </button>
          </div>

          {/* Voice Fidelity */}
          <div style={{ background:"rgba(245,198,66,0.04)", border:"1px solid rgba(245,198,66,0.14)", borderRadius:8, padding:"16px" }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Voice Fidelity</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:32, fontWeight:800, color:"#F5C642", letterSpacing:"-1.5px", fontFamily:"'Afacad Flux',sans-serif" }}>94.7</span>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>/ 100</span>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width:"94.7%", background:"#F5C642" }} />
            </div>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:6, fontFamily:"'Afacad Flux',sans-serif" }}>↑ 2.3 since last week</p>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.dashboard-grid{grid-template-columns:1fr 1fr!important}}@media(max-width:600px){.dashboard-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};
export default Dashboard;
