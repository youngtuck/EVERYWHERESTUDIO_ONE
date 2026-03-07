import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const DEMO_IDEAS = [
  "The best leaders I know share one counterintuitive habit...",
  "What 10 years of building companies taught me about failure...",
  "The conversation that changed how I think about scale...",
  "Why the most effective executives I know write every day...",
];

const OUTPUT_FORMATS = [
  { label: "LinkedIn Post", time: "0.3s" },
  { label: "Newsletter", time: "0.8s" },
  { label: "Podcast Script", time: "1.1s" },
  { label: "Twitter Thread", time: "1.4s" },
  { label: "Essay", time: "1.7s" },
  { label: "Short Video", time: "2.0s" },
  { label: "Substack Note", time: "2.2s" },
  { label: "Talk Outline", time: "2.5s" },
  { label: "Email Campaign", time: "2.8s" },
  { label: "Press Release", time: "3.0s" },
  { label: "Blog Post", time: "3.2s" },
  { label: "Executive Brief", time: "3.4s" },
];

const Hero = () => {
  const navigate = useNavigate();
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showOutputs, setShowOutputs] = useState(false);
  const [visibleOutputs, setVisibleOutputs] = useState<number[]>([]);
  const [cycleCount, setCycleCount] = useState(0);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutRefs.current.push(id);
    return id;
  };

  useEffect(() => {
    const idea = DEMO_IDEAS[ideaIndex];
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);
    setShowOutputs(false);
    setVisibleOutputs([]);

    // Type the idea
    const typeInterval = setInterval(() => {
      charIndex++;
      setDisplayText(idea.slice(0, charIndex));
      if (charIndex >= idea.length) {
        clearInterval(typeInterval);
        setIsTyping(false);

        // Show outputs after typing completes
        addTimeout(() => {
          setShowOutputs(true);
          OUTPUT_FORMATS.forEach((_, i) => {
            addTimeout(() => {
              setVisibleOutputs((prev) => [...prev, i]);
            }, i * 120 + 200);
          });

          // Cycle to next idea
          addTimeout(() => {
            setCycleCount((c) => c + 1);
          }, OUTPUT_FORMATS.length * 120 + 2800);
        }, 600);
      }
    }, 38);

    return () => {
      clearInterval(typeInterval);
      clearAllTimeouts();
    };
  }, [ideaIndex]);

  useEffect(() => {
    if (cycleCount > 0) {
      setIdeaIndex((i) => (i + 1) % DEMO_IDEAS.length);
    }
  }, [cycleCount]);

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "#0D1B2A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          background: "radial-gradient(circle, rgba(74,144,217,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 900, textAlign: "center" }}>

        {/* Eyebrow */}
        <div
          className="fade-in visible"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 40,
          }}
        >
          <span style={{ width: 24, height: 1, background: "#4A90D9", display: "inline-block" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#4A90D9",
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Orchestrated Intelligence
          </span>
          <span style={{ width: 24, height: 1, background: "#4A90D9", display: "inline-block" }} />
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: "clamp(52px, 8vw, 96px)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1.0,
            marginBottom: 28,
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          Ideas to Impact.
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.5vw, 24px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0",
            lineHeight: 1.5,
            marginBottom: 72,
            maxWidth: 540,
            margin: "0 auto 72px",
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          One idea. Your voice. Every platform.
        </p>

        {/* Live demo card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "36px 40px",
            maxWidth: 760,
            margin: "0 auto 52px",
            backdropFilter: "blur(8px)",
            textAlign: "left",
          }}
        >
          {/* Input area */}
          <div style={{ marginBottom: showOutputs ? 28 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                Your idea
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isTyping ? "#F5C642" : "#188FA7",
                  display: "inline-block",
                  transition: "background 0.3s ease",
                  boxShadow: isTyping ? "0 0 8px rgba(245,198,66,0.6)" : "0 0 8px rgba(24,143,167,0.6)",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "clamp(17px, 2.2vw, 22px)",
                fontWeight: 400,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.5,
                fontFamily: "'Afacad Flux', sans-serif",
                minHeight: 60,
              }}
            >
              {displayText}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1.1em",
                  background: "#F5C642",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: isTyping ? "none" : "blink 1s step-end infinite",
                }}
              />
            </p>
          </div>

          {/* Output grid */}
          {showOutputs && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 32, height: 1, background: "rgba(255,255,255,0.1)", display: "inline-block" }} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  12 outputs · your voice · ready to publish
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 8,
                }}
              >
                {OUTPUT_FORMATS.map((format, i) => (
                  <div
                    key={format.label}
                    style={{
                      padding: "8px 12px",
                      background: visibleOutputs.includes(i)
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                      border: `1px solid ${visibleOutputs.includes(i) ? "rgba(255,255,255,0.1)" : "transparent"}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      color: visibleOutputs.includes(i) ? "rgba(255,255,255,0.7)" : "transparent",
                      fontFamily: "'Afacad Flux', sans-serif",
                      transition: "all 0.3s ease",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {format.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              document.getElementById("voice-dna")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: "#F5C642",
              color: "#0D1B2A",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "14px 36px",
              borderRadius: 4,
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "transform 0.2s ease, opacity 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.92"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
          >
            Extract Your Voice DNA
          </button>
          <button
            onClick={() => {
              document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "14px 36px",
              borderRadius: 4,
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            See How It Works
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              width: 1,
              height: 40,
              background: "white",
              animation: "scrollPulse 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50% { opacity: 0.6; transform: scaleY(1.1); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
