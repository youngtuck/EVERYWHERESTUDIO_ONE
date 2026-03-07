import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const GATES = [
  { num:"01", name:"Strategy Gate", desc:"Does this piece have a clear POV? Is it positioned correctly for this moment in your category?" },
  { num:"02", name:"Voice Gate", desc:"Does this sound like you? Voice Fidelity Score runs here — matching against all three Voice DNA layers." },
  { num:"03", name:"Accuracy Gate", desc:"Are all claims, statistics, and references verifiable? No hallucinated data ships." },
  { num:"04", name:"AI Tells Gate", desc:"Seven synthetic patterns removed. This doesn't read like it was generated. It reads like you wrote it." },
  { num:"05", name:"Audience Gate", desc:"Does this resonate for the specific person you're writing for? Engagement patterns analyzed." },
  { num:"06", name:"Platform Gate", desc:"Is this formatted, structured, and sized correctly for the destination platform?" },
  { num:"07", name:"Impact Gate", desc:"Does this have a genuine call to action? Will the reader know what to do next, and want to do it?" },
];

export default function QualityGates() {
  const [open, setOpen] = useState<number|null>(null);
  const { theme } = useTheme();
  const dark = theme === "dark";

  const bg       = dark ? "#0A0A0A" : "var(--bg-secondary)";
  const topBd    = dark ? "rgba(255,255,255,0.06)" : "var(--border)";
  const eyebrowC = dark ? "rgba(255,255,255,0.25)" : "var(--text-muted)";
  const headC    = dark ? "#FFFFFF" : "var(--text-primary)";
  const subC     = dark ? "rgba(255,255,255,0.38)" : "var(--text-secondary)";
  const rowBg    = (active:boolean) => active
    ? (dark?"rgba(24,143,167,0.07)":"rgba(24,143,167,0.06)")
    : (dark?"rgba(255,255,255,0.025)":"var(--bg-primary)");
  const rowBd    = (active:boolean) => active
    ? "rgba(24,143,167,0.22)"
    : (dark?"rgba(255,255,255,0.07)":"var(--border-strong)");
  const rowNumC  = dark ? "rgba(255,255,255,0.2)" : "var(--text-muted)";
  const rowTextC = dark ? "rgba(255,255,255,0.85)" : "var(--text-primary)";
  const chevronC = dark ? "rgba(255,255,255,0.28)" : "var(--text-muted)";
  const descC    = dark ? "rgba(255,255,255,0.42)" : "var(--text-secondary)";
  const descBg   = dark ? "rgba(24,143,167,0.04)" : "rgba(24,143,167,0.04)";
  const descBd   = dark ? "rgba(24,143,167,0.18)" : "rgba(24,143,167,0.15)";

  return (
    <section style={{ padding:"96px 36px", background:bg, borderTop:`1px solid ${topBd}` }}>
      <div style={{ maxWidth:780, margin:"0 auto" }}>
        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:eyebrowC, fontFamily:"'Afacad Flux',sans-serif", marginBottom:18 }}>Quality Gates</p>
        <h2 style={{ fontSize:"clamp(28px,3.5vw,54px)", fontWeight:900, letterSpacing:"-2px", color:headC, marginBottom:16, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0 }}>
          Seven gates.<br />Every piece clears all of them.
        </h2>
        <p style={{ fontSize:16, color:subC, lineHeight:1.78, marginBottom:52, fontFamily:"'Afacad Flux',sans-serif" }}>
          Not a checklist. A pipeline. Each gate's output becomes the next gate's input. Nothing ships that doesn't clear all seven.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {GATES.map((g,i) => (
            <div key={i}>
              <button onClick={() => setOpen(open===i?null:i)}
                style={{ display:"flex", alignItems:"center", gap:14, width:"100%", padding:"16px 20px", background:rowBg(open===i), border:`1px solid ${rowBd(open===i)}`, borderRadius:open===i?"8px 8px 0 0":8, cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}>
                <CheckCircle size={14} style={{ color:"#188FA7", flexShrink:0 }} />
                <span style={{ fontSize:10, fontWeight:700, color:rowNumC, minWidth:26, fontFamily:"'Afacad Flux',sans-serif" }}>{g.num}</span>
                <span style={{ fontSize:15, fontWeight:600, color:rowTextC, flex:1, fontFamily:"'Afacad Flux',sans-serif" }}>{g.name}</span>
                {open===i
                  ? <ChevronDown size={13} style={{ color:chevronC, flexShrink:0 }} />
                  : <ChevronRight size={13} style={{ color:chevronC, flexShrink:0 }} />}
              </button>
              {open===i && (
                <div style={{ padding:"16px 20px 20px 68px", background:descBg, border:`1px solid ${descBd}`, borderTop:"none", borderRadius:"0 0 8px 8px" }}>
                  <p style={{ fontSize:14, color:descC, lineHeight:1.72, fontFamily:"'Afacad Flux',sans-serif" }}>{g.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
