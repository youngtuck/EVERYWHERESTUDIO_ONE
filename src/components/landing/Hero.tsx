import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const FORMATS = ["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"];
const LINES = [
  "There's a leadership principle I've been sitting on for three years...",
  "Finished a brutal week. Here's what I actually learned from it...",
  "Most people get delegation backwards. Let me show you the version that works...",
];

function HeroDemo() {
  const [typed, setTyped] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const iv = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const line = LINES[lineIdx];
    if (charIdx < line.length) {
      t.current = setTimeout(() => { setTyped(line.slice(0, charIdx + 1)); setCharIdx(c=>c+1); }, 36);
    } else {
      t.current = setTimeout(() => { setActive(true); setCount(0); }, 600);
    }
    return () => clearTimeout(t.current);
  }, [charIdx, lineIdx]);

  useEffect(() => {
    if (!active) return;
    iv.current = setInterval(() => {
      setCount(c => {
        if (c >= FORMATS.length) {
          clearInterval(iv.current);
          setTimeout(() => { setActive(false); setCount(0); setTyped(""); setCharIdx(0); setLineIdx(l=>(l+1)%LINES.length); }, 2200);
          return c;
        }
        return c + 1;
      });
    }, 85);
    return () => clearInterval(iv.current);
  }, [active]);

  return (
    <div style={{ background:"#0D0D0D", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"22px", width:"100%", maxWidth:460, boxShadow:"0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#F5C642", boxShadow:"0 0 6px rgba(245,198,66,0.6)" }} />
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.22)", fontFamily:"'Afacad Flux',sans-serif" }}>Watson · Listening</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"14px 16px", marginBottom:14, minHeight:68 }}>
        <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,0.82)", fontFamily:"'Afacad Flux',sans-serif", minHeight:24 }}>
          {typed}<span style={{ display:"inline-block", width:2, height:14, background:"rgba(245,198,66,0.8)", marginLeft:2, verticalAlign:"middle", animation:"cur 0.9s step-end infinite" }} />
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
        {FORMATS.map((f,i) => {
          const on = active && i < count;
          return (
            <div key={f} style={{ padding:"9px 10px", background:on?"rgba(245,198,66,0.08)":"rgba(255,255,255,0.025)", border:`1px solid ${on?"rgba(245,198,66,0.2)":"rgba(255,255,255,0.05)"}`, borderRadius:6, opacity:on?1:0.45, transition:"all 0.2s ease" }}>
              <p style={{ fontSize:10, fontWeight:on?700:400, color:on?"#F5C642":"rgba(255,255,255,0.4)", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.35, transition:"color 0.2s" }}>{f}</p>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes cur{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";

  // Colors that respond to theme
  const bg        = dark ? "#0A0A0A" : "#FFFFFF";
  const headC     = dark ? "#FFFFFF" : "#0A0A0A";
  const bodyC     = dark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.52)";
  const microC    = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.28)";
  const badgeBg   = dark ? "rgba(245,198,66,0.07)" : "rgba(245,198,66,0.1)";
  const badgeBord = dark ? "rgba(245,198,66,0.14)" : "rgba(245,198,66,0.28)";
  const badgeText = dark ? "rgba(245,198,66,0.72)" : "rgba(160,120,0,0.9)";
  const secBg     = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const secBord   = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.14)";
  const secText   = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)";
  const secHovB   = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.3)";
  const secHovT   = dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.72)";
  const gridDot   = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.035)";

  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", padding:"100px 36px 80px", background:bg, color:headC, position:"relative", overflow:"hidden" }}>
      {/* Dot grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(circle, ${gridDot} 1px, transparent 1px)`, backgroundSize:"28px 28px", pointerEvents:"none" }} />
      {/* Gold glow */}
      <div style={{ position:"absolute", top:"20%", right:"5%", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle, ${dark?"rgba(245,198,66,0.04)":"rgba(245,198,66,0.07)"} 0%, transparent 65%)`, pointerEvents:"none" }} />
      {/* Blue glow */}
      <div style={{ position:"absolute", bottom:"15%", left:"-8%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, ${dark?"rgba(74,144,217,0.035)":"rgba(74,144,217,0.05)"} 0%, transparent 65%)`, pointerEvents:"none" }} />

      <div style={{ maxWidth:1160, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center", position:"relative", zIndex:1 }} className="hero-grid">
        <div>
          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:28, padding:"5px 14px 5px 8px", background:badgeBg, border:`1px solid ${badgeBord}`, borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#F5C642" }} />
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:badgeText, fontFamily:"'Afacad Flux',sans-serif" }}>Composed Intelligence Platform</span>
          </div>

          <h1 style={{ fontSize:"clamp(46px,5.5vw,80px)", fontWeight:900, letterSpacing:"-3.5px", lineHeight:0.92, marginBottom:32, fontFamily:"'Afacad Flux',sans-serif", color:headC }}>
            Your thinking.<br /><span style={{ color:"#F5C642" }}>Composed.</span>
          </h1>

          <p style={{ fontSize:"clamp(15px,1.5vw,17px)", lineHeight:1.78, color:bodyC, maxWidth:440, marginBottom:42, fontFamily:"'Afacad Flux',sans-serif" }}>
            There is a mountain between the spark and the audience. EVERYWHERE Studio was built to carry it — one idea, transformed into impact everywhere it belongs.
          </p>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:22 }}>
            <button onClick={() => navigate("/auth")}
              style={{ background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"15px 34px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif", transition:"opacity 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              Request Access
            </button>
            <button onClick={() => navigate("/studio/dashboard")}
              style={{ background:"transparent", color:secText, border:`1px solid ${secBord}`, cursor:"pointer", fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", padding:"14px 28px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif", transition:"all 0.2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=secHovB; e.currentTarget.style.color=secHovT; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=secBord; e.currentTarget.style.color=secText; }}>
              Explore Demo Studio
            </button>
          </div>

          <p style={{ fontSize:11, color:microC, fontFamily:"'Afacad Flux',sans-serif" }}>Invitation only · Currently onboarding founding members</p>
        </div>

        {/* Demo card is always dark — it represents the product UI */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
          <HeroDemo />
        </div>
      </div>
      <style>{`@media(max-width:800px){.hero-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
