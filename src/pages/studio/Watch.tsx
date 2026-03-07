import { useState } from "react";
import { TrendingUp, Shield, Zap, Calendar, Radio, ChevronDown, ChevronRight, ArrowRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BRIEFINGS = [
  {
    date: "Today · March 7, 2026",
    triggers: [
      { text: '"The CEO who writes" narrative is gaining traction — 3 major pieces this week. Your angle is different and stronger.', action: true },
      { text: 'Adam Grant published on delegation and trust. Your counterpoint exists and you\'ve lived it.', action: true },
      { text: 'Quiet leadership trending in your category. 47K posts in 72 hours.', action: true },
    ],
    competitors: [
      { text: 'Competitor X launched a newsletter — 8,000 subscribers in first week. Notable because they had no prior content presence.' },
    ],
    events: [
      { text: 'SxSW panel on "Thought Leadership in the AI Era" — March 11. Your positioning is directly relevant.' },
      { text: 'Fast Company Innovation Summit submissions open. Deadline March 21.' },
    ],
    trends: [],
    signals: 6,
  },
  {
    date: "March 5, 2026",
    triggers: [
      { text: 'HBR article on executive presence got 2.3M views. Your related essay draft scored 912. Consider publishing now.', action: true },
    ],
    competitors: [],
    events: [],
    trends: [{ text: 'Authentic leadership content +34% engagement vs. polished/corporate tone this week.' }],
    signals: 3,
  },
  {
    date: "March 3, 2026",
    triggers: [],
    competitors: [],
    events: [],
    trends: [],
    signals: 0,
  },
];

const Section = ({ icon: Icon, title, items, color, onWrite }: any) => {
  const [open, setOpen] = useState(true);
  if (!items || items.length === 0) return (
    <div style={{ padding:"10px 0", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
      <ChevronRight size={13} style={{ color:"var(--text-muted)" }} />
      <Icon size={13} style={{ color:"var(--text-muted)" }} />
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{title} (0)</span>
    </div>
  );
  return (
    <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:12, marginBottom:12 }}>
      <button onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", width:"100%", padding:"8px 0" }}>
        {open ? <ChevronDown size={13} style={{ color:"var(--text-muted)" }} /> : <ChevronRight size={13} style={{ color:"var(--text-muted)" }} />}
        <Icon size={13} style={{ color }} />
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{title} ({items.length})</span>
      </button>
      {open && (
        <div style={{ paddingLeft:22, display:"flex", flexDirection:"column", gap:10, marginTop:4 }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ padding:"12px 14px", background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:7 }}>
              <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.65, marginBottom:item.action?10:0, fontFamily:"'Afacad Flux',sans-serif" }}>{item.text}</p>
              {item.action && onWrite && (
                <button onClick={onWrite} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"none", border:"1px solid var(--border-strong)", borderRadius:4, padding:"5px 10px", cursor:"pointer", fontSize:11, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>
                  Write About This <ArrowRight size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Watch = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const briefing = BRIEFINGS[selected];

  return (
    <div style={{ display:"flex", height:"calc(100vh - 54px)" }}>
      {/* Left — list */}
      <div style={{ width:220, borderRight:"1px solid var(--border)", padding:"20px 0", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"0 16px 14px", borderBottom:"1px solid var(--border)", marginBottom:8 }}>
          <p className="eyebrow">Sentinel</p>
        </div>
        {BRIEFINGS.map((b, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{ width:"100%", textAlign:"left", padding:"10px 16px", background:selected===i?"var(--bg-secondary)":"none", border:"none", cursor:"pointer", borderLeft:selected===i?"2px solid #F5C642":"2px solid transparent" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:3 }}>
              {i === 0 ? "Today" : b.date.split(" · ")[0]}
            </p>
            <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>
              {b.signals === 0 ? "No notable signals" : `${b.signals} signal${b.signals !== 1 ? "s" : ""}`}
            </p>
          </button>
        ))}
      </div>

      {/* Right — detail */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 28px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom:8 }}>Briefing</p>
            <h2 style={{ fontSize:"clamp(20px,2.5vw,28px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px", fontFamily:"'Afacad Flux',sans-serif" }}>{briefing.date}</h2>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"1px solid var(--border)", borderRadius:5, padding:"7px 12px", cursor:"pointer", fontSize:11, fontWeight:600, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>
            <Settings size={12} /> Configure
          </button>
        </div>

        <Section icon={TrendingUp} title="Content Triggers" items={briefing.triggers} color="#188FA7" onWrite={() => navigate("/studio/work")} />
        <Section icon={Shield} title="Competitor Moves" items={briefing.competitors} color="#F5C642" />
        <Section icon={Calendar} title="Event Radar" items={briefing.events} color="var(--text-muted)" />
        <Section icon={Radio} title="Trend Signals" items={briefing.trends} color="var(--text-muted)" />

        {briefing.signals === 0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:14, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>No notable signals this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Watch;
