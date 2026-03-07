import { useState } from "react";
import { Check } from "lucide-react";

const GATES = [
  {
    num: "01",
    name: "Strategy Gate",
    question: "Does this serve the right goal?",
    desc: "Every piece is checked against your stated objectives before a word is written. Wrong goal = wrong output, regardless of quality.",
  },
  {
    num: "02",
    name: "Voice Gate",
    question: "Does this sound like you?",
    desc: "Voice DNA comparison. Sentence rhythm, vocabulary, signature phrases, prohibited language. If it doesn't sound like you, it goes back.",
  },
  {
    num: "03",
    name: "Accuracy Gate",
    question: "Is every claim verifiable?",
    desc: "Priya verifies every factual claim against at least two sources. Nothing ships with unchecked data, dates, or attributions.",
  },
  {
    num: "04",
    name: "AI Tells Gate",
    question: "Does this read as human?",
    desc: "Weekly-updated list of AI tells — phrases, patterns, structural habits that signal machine authorship. All flagged and removed.",
  },
  {
    num: "05",
    name: "Audience Gate",
    question: "Will this land?",
    desc: "Dana White stress-tests resonance. Does this serve the audience or just the author? Navel-gazing goes back for revision.",
  },
  {
    num: "06",
    name: "Platform Gate",
    question: "Is this built for where it's going?",
    desc: "Channel-specific requirements applied. LinkedIn penalizes links in copy — the system knows. Platform optimization is automatic.",
  },
  {
    num: "07",
    name: "Impact Gate",
    question: "Is this worth publishing?",
    desc: "Final review. Does this advance the body of work? Will it move people? If it clears six gates but fails this one, it waits.",
  },
];

const QualityGates = () => {
  const [activeGate, setActiveGate] = useState<number | null>(null);

  return (
    <section
      style={{
        background: "#0D1B2A",
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: "radial-gradient(ellipse, rgba(245,198,66,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 72 }}>
          <span className="section-label" style={{ color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 16 }}>
            Quality
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 20,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Nothing ships without earning it.
          </h2>
          <p
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(255,255,255,0.4)",
              maxWidth: 500,
              lineHeight: 1.65,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Seven mandatory gates. Every piece. Every time. Content does not move forward until each gate passes. No exceptions. No overrides.
          </p>
        </div>

        {/* Gates list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {GATES.map((gate, i) => (
            <div
              key={gate.num}
              className="fade-up"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 24,
                  alignItems: "center",
                  padding: "24px 32px",
                  background: activeGate === i ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeGate === i ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setActiveGate(activeGate === i ? null : i)}
              >
                {/* Number */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Afacad Flux', sans-serif",
                    letterSpacing: "1px",
                  }}
                >
                  {gate.num}
                </span>

                {/* Name + question */}
                <div>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: activeGate === i ? 12 : 4,
                      fontFamily: "'Afacad Flux', sans-serif",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {gate.name}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontStyle: "italic",
                    }}
                  >
                    "{gate.question}"
                  </p>
                  {activeGate === i && (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.65,
                        marginTop: 12,
                        fontFamily: "'Afacad Flux', sans-serif",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 12,
                      }}
                    >
                      {gate.desc}
                    </p>
                  )}
                </div>

                {/* Check */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(24,143,167,0.15)",
                    border: "1px solid rgba(24,143,167,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={13} color="#188FA7" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div
          className="fade-up"
          style={{
            marginTop: 48,
            padding: "28px 32px",
            background: "rgba(245,198,66,0.05)",
            border: "1px solid rgba(245,198,66,0.15)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ width: 3, height: 40, background: "#F5C642", borderRadius: 2, flexShrink: 0 }} />
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.65,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            If it matters enough to say, it matters enough to say correctly. The gates exist to protect your reputation as much as your message.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QualityGates;
