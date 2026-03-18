import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const CHECKPOINTS = [
  { num:"01", name:"Strategy", desc:"Clear POV. Right moment. Right position in your category." },
  { num:"02", name:"Voice", desc:"Matches all three Voice DNA layers. Fidelity Score calculated here." },
  { num:"03", name:"Accuracy", desc:"All claims verifiable. No hallucinated data ships." },
  { num:"04", name:"AI Tells", desc:"Seven synthetic patterns removed. Reads like you wrote it." },
  { num:"05", name:"Audience", desc:"Calibrated for the specific person you're writing for." },
  { num:"06", name:"Platform", desc:"Formatted and sized correctly for the destination." },
  { num:"07", name:"Impact", desc:"Clear call to action. The reader knows what to do next." },
];

export default function QualityCheckpoints() {
  const [open, setOpen] = useState<number|null>(null);
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <section style={{ padding:"100px 32px", background:"var(--bg-2)", borderTop:"1px solid var(--line)" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <p className="eyebrow" style={{ marginBottom:20 }}>Quality Checkpoints</p>
        <h2 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:"clamp(32px,3.8vw,56px)", fontWeight:400, letterSpacing:"-0.5px", color:"var(--fg)", marginBottom:16, lineHeight:1.08 }}>
          Seven checkpoints.<br /><em style={{fontStyle:"italic"}}>Everything clears all of them.</em>
        </h2>
        <p style={{ fontSize:15, color:"var(--fg-3)", lineHeight:1.78, marginBottom:52, fontFamily:"'Montserrat', sans-serif", fontWeight:300 }}>
          A pipeline, not a checklist. Each checkpoint's output feeds the next. Nothing ships without clearing all seven.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {CHECKPOINTS.map((g,i) => (
            <div key={i}>
              <button onClick={() => setOpen(open===i?null:i)}
                style={{ display:"flex", alignItems:"center", gap:16, width:"100%", padding:"15px 18px", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:open===i?"8px 8px 0 0":8, cursor:"pointer", textAlign:"left", transition:"background 0.12s", fontFamily:"'Montserrat', sans-serif" }}
                onMouseEnter={e=>{ if(open!==i)(e.currentTarget as HTMLElement).style.background="var(--bg-3)"; }}
                onMouseLeave={e=>{ if(open!==i)(e.currentTarget as HTMLElement).style.background="var(--surface)"; }}>
                <span style={{ fontSize:13, color:"var(--fg-3)", fontFamily:"'Montserrat', sans-serif", fontStyle:"italic", minWidth:20, fontWeight:400 }}>{g.num}</span>
                <span style={{ fontSize:14, fontWeight:400, color:"var(--fg)", flex:1 }}>{g.name}</span>
                <span style={{ fontSize:14, color:"var(--fg-3)", transform:open===i?"rotate(45deg)":"none", transition:"transform 0.15s", display:"inline-block" }}>+</span>
              </button>
              {open===i && (
                <div style={{ padding:"14px 18px 18px 54px", background:"var(--bg-3)", border:"1px solid var(--line)", borderTop:"none", borderRadius:"0 0 8px 8px" }}>
                  <p style={{ fontSize:13, color:"var(--fg-2)", lineHeight:1.72, fontFamily:"'Montserrat', sans-serif", fontWeight:300 }}>{g.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
