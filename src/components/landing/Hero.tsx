import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const FORMATS = [
  "LinkedIn Post","Newsletter","Sunday Story","Podcast Script",
  "Twitter Thread","Essay","Short Video","Substack Note",
  "Talk Outline","Email Campaign","Blog Post","Executive Brief"
];
const TYPING_LINES = [
  "There's a leadership principle I've been sitting on for three years...",
  "Finished a brutal week. Here's what I actually learned from it...",
  "Most people get delegation backwards. Let me show you the version that works...",
];

const HeroDemo = () => {
  const [typed, setTyped] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const activateRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const line = TYPING_LINES[lineIdx];
    if (charIdx < line.length) {
      timerRef.current = setTimeout(() => {
        setTyped(line.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, 36);
    } else {
      timerRef.current = setTimeout(() => {
        setShowOutput(true);
        setActiveCount(0);
      }, 700);
    }
    return () => clearTimeout(timerRef.current);
  }, [charIdx, lineIdx]);

  useEffect(() => {
    if (!showOutput) return;
    activateRef.current = setInterval(() => {
      setActiveCount(c => {
        if (c >= FORMATS.length) {
          clearInterval(activateRef.current);
          setTimeout(() => {
            setShowOutput(false);
            setActiveCount(0);
            setTyped("");
            setCharIdx(0);
            setLineIdx(l => (l + 1) % TYPING_LINES.length);
          }, 2400);
          return c;
        }
        return c + 1;
      });
    }, 90);
    return () => clearInterval(activateRef.current);
  }, [showOutput]);

  return (
    <div style={{
      background: "#0D0D0D",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 14,
      padding: "20px",
      width: "100%",
      maxWidth: 460,
      boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      {/* Watson label */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#F5C642" }} />
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", fontFamily:"'Afacad Flux',sans-serif" }}>Watson · Listening</span>
      </div>

      {/* Input */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 14,
        minHeight: 64,
      }}>
        <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,0.82)", fontFamily:"'Afacad Flux',sans-serif", minHeight:24 }}>
          {typed}
          <span style={{ display:"inline-block", width:2, height:14, background:"rgba(245,198,66,0.8)", marginLeft:1, verticalAlign:"middle", animation:"blink 0.9s infinite" }} />
        </p>
      </div>

      {/* Format grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
        {FORMATS.map((fmt, i) => {
          const active = showOutput && i < activeCount;
          return (
            <div key={fmt} style={{
              padding: "9px 10px",
              background: active ? "rgba(245,198,66,0.08)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${active ? "rgba(245,198,66,0.22)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 6,
              opacity: active ? 1 : 0.4,
              transition: "all 0.25s ease",
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                color: active ? "#F5C642" : "rgba(255,255,255,0.45)",
                fontFamily: "'Afacad Flux',sans-serif",
                lineHeight: 1.35,
                transition: "color 0.25s ease",
              }}>{fmt}</p>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}49%{opacity:1}50%,99%{opacity:0}}`}</style>
    </div>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "100px 28px 80px",
      background: "#0A0A0A",
      color: "#FFFFFF",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle grid */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />
      {/* Gold atmospheric glow */}
      <div style={{
        position:"absolute", top:"20%", right:"8%",
        width:500, height:500, borderRadius:"50%",
        background: "radial-gradient(circle, rgba(245,198,66,0.05) 0%, transparent 65%)",
        pointerEvents:"none",
      }} />
      {/* Blue glow left */}
      <div style={{
        position:"absolute", bottom:"20%", left:"-5%",
        width:400, height:400, borderRadius:"50%",
        background: "radial-gradient(circle, rgba(74,144,217,0.04) 0%, transparent 65%)",
        pointerEvents:"none",
      }} />

      <div style={{
        maxWidth: 1120,
        margin: "0 auto",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 64,
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }} className="hero-grid">
        {/* Left */}
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:24, padding:"5px 12px 5px 8px", background:"rgba(245,198,66,0.07)", border:"1px solid rgba(245,198,66,0.15)", borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#F5C642" }} />
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(245,198,66,0.75)", fontFamily:"'Afacad Flux',sans-serif" }}>
              Composed Intelligence Platform
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(44px,5.5vw,76px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 0.93,
            marginBottom: 32,
            fontFamily: "'Afacad Flux',sans-serif",
            color: "#FFFFFF",
          }}>
            Your thinking.<br />
            <span style={{ color:"#F5C642" }}>Composed.</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px,1.5vw,17px)",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 430,
            marginBottom: 40,
            fontFamily: "'Afacad Flux',sans-serif",
          }}>
            There is a mountain between the spark and the audience. EVERYWHERE Studio was built to carry it — one idea, transformed into impact everywhere it belongs.
          </p>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
            <button
              onClick={() => navigate("/auth")}
              style={{
                background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer",
                fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
                padding:"14px 32px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif",
                transition:"opacity 0.2s ease",
              }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")}
              onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
            >
              Request Access
            </button>
            <button
              onClick={() => navigate("/studio/dashboard")}
              style={{
                background:"transparent", color:"rgba(255,255,255,0.45)",
                border:"1px solid rgba(255,255,255,0.12)", cursor:"pointer",
                fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase",
                padding:"13px 28px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif",
                transition:"border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"; e.currentTarget.style.color="rgba(255,255,255,0.7)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; e.currentTarget.style.color="rgba(255,255,255,0.45)"; }}
            >
              Explore Demo Studio
            </button>
          </div>

          <p style={{ fontSize:11, color:"rgba(255,255,255,0.18)", fontFamily:"'Afacad Flux',sans-serif" }}>
            Invitation only · Currently onboarding founding members
          </p>
        </div>

        {/* Right — demo */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
          <HeroDemo />
        </div>
      </div>

      <style>{`.hero-grid { @media(max-width:768px){ grid-template-columns:1fr!important } }`}</style>
    </section>
  );
};
export default Hero;
