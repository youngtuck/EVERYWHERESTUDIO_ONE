import { useState } from "react";
import { CheckCircle, ChevronDown } from "lucide-react";

const GATES = [
  { num:"01", name:"Strategy Gate", desc:"Does this piece have a clear POV? Is it positioned correctly for this moment in your category?" },
  { num:"02", name:"Voice Gate", desc:"Does this sound like you? Voice Fidelity Score runs here — matching against all three Voice DNA layers." },
  { num:"03", name:"Accuracy Gate", desc:"Are all claims, statistics, and references verifiable? No hallucinated data ships." },
  { num:"04", name:"AI Tells Gate", desc:"Seven synthetic patterns removed. This doesn't read like it was generated. It reads like you wrote it." },
  { num:"05", name:"Audience Gate", desc:"Does this resonate for the specific person you're writing for? Engagement patterns analyzed." },
  { num:"06", name:"Platform Gate", desc:"Is this formatted, structured, and sized correctly for the destination platform?" },
  { num:"07", name:"Impact Gate", desc:"Does this have a genuine call to action? Will the reader know what to do next, and want to do it?" },
];

const QualityGates = () => {
  const [open, setOpen] = useState<number|null>(null);
  return (
    <section style={{ padding:"80px 28px", background:"#0A0A0A", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth:800, margin:"0 auto" }}>
        <p className="eyebrow" style={{ marginBottom:16, color:"rgba(255,255,255,0.3)" }}>Quality Gates</p>
        <h2 style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:900, letterSpacing:"-1.5px", color:"#FFFFFF", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.05 }}>
          Seven gates.<br />Every piece clears all of them.
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:40, fontFamily:"'Afacad Flux',sans-serif" }}>
          Not a checklist. A pipeline. Each gate's output becomes the next gate's input. Nothing ships that doesn't clear all seven.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {GATES.map((g, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open===i?null:i)}
                style={{ display:"flex", alignItems:"center", gap:14, width:"100%", padding:"16px 18px", background:open===i?"rgba(24,143,167,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${open===i?"rgba(24,143,167,0.2)":"rgba(255,255,255,0.06)"}`, borderRadius:8, cursor:"pointer", textAlign:"left" }}>
                <CheckCircle size={14} style={{ color:"#188FA7", flexShrink:0 }} />
                <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", minWidth:22, fontFamily:"'Afacad Flux',sans-serif" }}>{g.num}</span>
                <span style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.85)", flex:1, fontFamily:"'Afacad Flux',sans-serif" }}>{g.name}</span>
                <ChevronDown size={14} style={{ color:"rgba(255,255,255,0.3)", transform:open===i?"rotate(180deg)":"none", transition:"transform 0.2s ease" }} />
              </button>
              {open === i && (
                <div style={{ padding:"14px 18px 18px 58px", background:"rgba(24,143,167,0.03)", border:"1px solid rgba(24,143,167,0.12)", borderTop:"none", borderRadius:"0 0 8px 8px" }}>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.45)", lineHeight:1.7, fontFamily:"'Afacad Flux',sans-serif" }}>{g.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default QualityGates;
