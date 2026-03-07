import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const FORMATS = ["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"];
const TYPING_LINES = ["There's a leadership principle I've been sitting on for three years...", "Finished a brutal week. Here's what I actually learned from it...", "Most people get delegation backwards. Let me show you the version that works..."];

const HeroDemo = () => {
  const [typed, setTyped] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [outputIdx, setOutputIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const line = TYPING_LINES[lineIdx];
    if (charIdx < line.length) {
      timerRef.current = setTimeout(() => {
        setTyped(line.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, 38);
    } else {
      timerRef.current = setTimeout(() => setShowOutput(true), 600);
    }
    return () => clearTimeout(timerRef.current);
  }, [charIdx, lineIdx]);

  useEffect(() => {
    if (showOutput) {
      const t = setTimeout(() => {
        setShowOutput(false);
        setTyped("");
        setCharIdx(0);
        setLineIdx(l => (l + 1) % TYPING_LINES.length);
        setOutputIdx(i => (i + 1) % FORMATS.length);
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [showOutput]);

  return (
    <div style={{ background:"#111111", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"22px", width:"100%", maxWidth:460 }}>
      {/* Input area */}
      <div style={{ background:"#1A1A1A", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"14px 16px", marginBottom:14, minHeight:64 }}>
        <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,0.85)", fontFamily:"'Afacad Flux',sans-serif" }}>
          {typed}<span style={{ animation:"blink 1s infinite", opacity:charIdx < TYPING_LINES[lineIdx].length ? 1 : 0 }}>|</span>
        </p>
      </div>
      {/* Output tiles */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
        {FORMATS.map((fmt, i) => {
          const active = showOutput && i <= outputIdx % 12;
          return (
            <div key={fmt} style={{ padding:"8px 10px", background:active?"rgba(245,198,66,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${active?"rgba(245,198,66,0.25)":"rgba(255,255,255,0.05)"}`, borderRadius:6, opacity:active?1:0.45, transition:"all 0.3s ease" }}>
              <p style={{ fontSize:10, fontWeight:active?700:400, color:active?"rgba(245,198,66,0.9)":"rgba(255,255,255,0.4)", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.3 }}>{fmt}</p>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", padding:"100px 28px 60px", background:"var(--bg-inverse)", color:"var(--text-inverse)", position:"relative", overflow:"hidden" }}>
      {/* Subtle dot grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
      {/* Gold blur blob */}
      <div style={{ position:"absolute", top:"30%", right:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(245,198,66,0.06) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center", position:"relative", zIndex:1 }} className="hero-grid">
        {/* Left */}
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:"rgba(245,198,66,0.7)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:20 }}>
            Composed Intelligence Platform
          </p>
          <h1 style={{ fontSize:"clamp(36px,5vw,68px)", fontWeight:900, letterSpacing:"-2.5px", lineHeight:0.95, marginBottom:28, fontFamily:"'Afacad Flux',sans-serif", color:"#FFFFFF" }}>
            Your thinking.<br />
            <span style={{ color:"#F5C642" }}>Composed.</span>
          </h1>
          <p style={{ fontSize:"clamp(15px,1.8vw,18px)", lineHeight:1.7, color:"rgba(255,255,255,0.55)", maxWidth:420, marginBottom:36, fontFamily:"'Afacad Flux',sans-serif" }}>
            There is a mountain between the spark and the audience. EVERYWHERE Studio was built to carry it. Ideas to Impact — one idea, everywhere.
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button className="btn-gold" style={{ fontSize:10 }} onClick={() => navigate("/auth")}>Request Access</button>
            <button className="btn-ghost" style={{ fontSize:10, borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)" }} onClick={() => navigate("/studio/dashboard")}>
              Explore Demo Studio
            </button>
          </div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:16, fontFamily:"'Afacad Flux',sans-serif" }}>Invitation only. Currently onboarding founding members.</p>
        </div>
        {/* Right */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <HeroDemo />
        </div>
      </div>
      <style>{`.hero-grid{@media(max-width:768px){grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};
export default Hero;
