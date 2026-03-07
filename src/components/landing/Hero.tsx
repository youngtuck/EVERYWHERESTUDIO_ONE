import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const IDEAS = [
  "The best leaders I know share one counterintuitive habit...",
  "What 10 years of building companies taught me about failure...",
  "Why the most effective executives I know write every day...",
  "The conversation that changed how I think about scale...",
];

const FORMATS = [
  "LinkedIn Post", "Newsletter", "Podcast Script", "Twitter Thread",
  "Long-form Essay", "Short Video", "Substack Note", "Talk Outline",
  "Email Campaign", "Press Release", "Blog Post", "Executive Brief",
];

const Hero = () => {
  const navigate = useNavigate();
  const [ideaIdx, setIdeaIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showOutputs, setShowOutputs] = useState(false);
  const [visibleOutputs, setVisibleOutputs] = useState<number[]>([]);
  const cycleRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  useEffect(() => {
    const idea = IDEAS[ideaIdx];
    let i = 0;
    setTyped(""); setIsTyping(true); setShowOutputs(false); setVisibleOutputs([]);

    const interval = setInterval(() => {
      i++;
      setTyped(idea.slice(0, i));
      if (i >= idea.length) {
        clearInterval(interval);
        setIsTyping(false);
        later(() => {
          setShowOutputs(true);
          FORMATS.forEach((_, fi) => later(() => setVisibleOutputs(p => [...p, fi]), fi * 100 + 150));
          later(() => { cycleRef.current++; setIdeaIdx(p => (p + 1) % IDEAS.length); }, FORMATS.length * 100 + 2600);
        }, 500);
      }
    }, 36);

    return () => { clearInterval(interval); clear(); };
  }, [ideaIdx]);

  return (
    <section style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "100px 24px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 860, textAlign: "center" }}>

        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
          <span style={{ width: 20, height: 1, background: "#4A90D9", display: "inline-block" }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "3px",
            textTransform: "uppercase", color: "#4A90D9",
            fontFamily: "'Afacad Flux', sans-serif",
          }}>Orchestrated Intelligence</span>
          <span style={{ width: 20, height: 1, background: "#4A90D9", display: "inline-block" }} />
        </div>

        {/* Wordmark headline */}
        <h1 style={{
          fontSize: "clamp(56px, 9vw, 108px)",
          fontWeight: 800,
          letterSpacing: "-4px",
          lineHeight: 0.95,
          marginBottom: 10,
          fontFamily: "'Afacad Flux', sans-serif",
          whiteSpace: "nowrap",
        }}>
          <span style={{ color: "#ffffff" }}>EVERY</span><span style={{ color: "#F5C642" }}>WHERE</span>
        </h1>
        <h2 style={{
          fontSize: "clamp(28px, 4.5vw, 54px)",
          fontWeight: 300,
          letterSpacing: "-1px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.25)",
          marginBottom: 52,
          fontFamily: "'Afacad Flux', sans-serif",
        }}>
          Studio™ — Ideas to Impact
        </h2>

        {/* DEMO CARD — fixed height so page never moves */}
        <div style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          padding: "32px 36px",
          maxWidth: 760,
          margin: "0 auto 44px",
          textAlign: "left",
          /* FIXED HEIGHT — this is the key fix. Page never moves. */
          minHeight: 280,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Input row */}
          <div style={{ marginBottom: 24, flex: "0 0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "3px",
                textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                fontFamily: "'Afacad Flux', sans-serif",
              }}>Your idea</span>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: isTyping ? "#F5C642" : "#188FA7",
                display: "inline-block",
                boxShadow: isTyping ? "0 0 6px rgba(245,198,66,0.7)" : "0 0 6px rgba(24,143,167,0.7)",
                transition: "background 0.4s ease, box-shadow 0.4s ease",
              }} />
            </div>
            {/* Fixed height text area — never causes layout shift */}
            <div style={{ minHeight: 64 }}>
              <p style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                fontWeight: 400,
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.55,
                fontFamily: "'Afacad Flux', sans-serif",
              }}>
                {typed}
                <span style={{
                  display: "inline-block", width: 2, height: "1em",
                  background: "#F5C642", marginLeft: 2, verticalAlign: "middle",
                  animation: "blink 1s step-end infinite",
                }} />
              </p>
            </div>
          </div>

          {/* Outputs — fixed container height so they slot in without shifting */}
          <div style={{
            flex: "1 1 auto",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 20,
            opacity: showOutputs ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "3px",
              textTransform: "uppercase", color: "rgba(255,255,255,0.18)",
              marginBottom: 14, fontFamily: "'Afacad Flux', sans-serif",
            }}>
              12 outputs · your voice · ready to publish
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
            }}>
              {FORMATS.map((f, i) => (
                <div key={f} style={{
                  padding: "6px 10px",
                  background: visibleOutputs.includes(i) ? "rgba(255,255,255,0.04)" : "transparent",
                  border: `1px solid ${visibleOutputs.includes(i) ? "rgba(255,255,255,0.08)" : "transparent"}`,
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  color: visibleOutputs.includes(i) ? "rgba(255,255,255,0.6)" : "transparent",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "all 0.25s ease",
                  letterSpacing: "0.2px",
                }}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
          <button
            onClick={() => document.getElementById("voice-dna")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "#ffffff", color: "#0A0A0A",
              border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", padding: "13px 36px",
              borderRadius: 4, fontFamily: "'Afacad Flux', sans-serif",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Extract Your Voice DNA
          </button>
          <button
            onClick={() => document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", fontSize: 11, fontWeight: 600,
              letterSpacing: "2px", textTransform: "uppercase",
              padding: "13px 36px", borderRadius: 4,
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            See How It Works
          </button>
        </div>

        {/* Scroll cue */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", fontFamily: "'Afacad Flux', sans-serif" }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)" }} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
