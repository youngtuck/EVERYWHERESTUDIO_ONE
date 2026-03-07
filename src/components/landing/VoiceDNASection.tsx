import { useNavigate } from "react-router-dom";

const DNA_LAYERS = [
  {
    label: "Voice Markers",
    items: ["Sentence length preference", "Paragraph rhythm", "Transition patterns", "Punctuation style"],
  },
  {
    label: "Value Markers",
    items: ["Recurring themes", "What you stand against", "Signature positions", "Belief language"],
  },
  {
    label: "Personality Markers",
    items: ["Humor style", "Humility signals", "Confidence register", "Relationship to audience"],
  },
];

const VoiceDNASection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="voice-dna"
      style={{
        background: "#0D1B2A",
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 80% 20%, rgba(74,144,217,0.05) 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
          className="voice-grid"
        >
          {/* Left: copy */}
          <div>
            <span className="fade-up section-label" style={{ color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 20 }}>
              The Technology
            </span>

            <h2
              className="fade-up delay-1"
              style={{
                fontSize: "clamp(36px, 4.5vw, 56px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-1.5px",
                lineHeight: 1.05,
                marginBottom: 28,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              It writes like you.{" "}
              <span style={{ color: "#F5C642" }}>Because it learned from you.</span>
            </h2>

            <p
              className="fade-up delay-2"
              style={{
                fontSize: 17,
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.75,
                marginBottom: 24,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              Voice DNA isn't voice matching. It's a deep capture of how you actually communicate — your rhythms, your values, the words you'd never use, the positions you hold. It starts with a 15-minute conversation and sharpens with every piece you create.
            </p>

            <p
              className="fade-up delay-3"
              style={{
                fontSize: 17,
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.75,
                marginBottom: 44,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              After 30 days, it knows you. After 90, it anticipates you. You can't add this as a feature to ChatGPT.
            </p>

            <div className="fade-up delay-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  background: "#F5C642",
                  color: "#0D1B2A",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "13px 32px",
                  borderRadius: 4,
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
              >
                Extract Your Voice DNA — Free
              </button>
            </div>
          </div>

          {/* Right: DNA layers visualization */}
          <div className="fade-up delay-2">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {DNA_LAYERS.map((layer, i) => (
                <div
                  key={layer.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "24px 28px",
                    transition: "border-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: i === 0 ? "rgba(74,144,217,0.2)" : i === 1 ? "rgba(245,198,66,0.15)" : "rgba(24,143,167,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: i === 0 ? "#4A90D9" : i === 1 ? "#F5C642" : "#188FA7",
                        fontFamily: "'Afacad Flux', sans-serif",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'Afacad Flux', sans-serif",
                      }}
                    >
                      {layer.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {layer.items.map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.55)",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontFamily: "'Afacad Flux', sans-serif",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Score indicator */}
              <div
                style={{
                  background: "rgba(245,198,66,0.06)",
                  border: "1px solid rgba(245,198,66,0.15)",
                  borderRadius: 10,
                  padding: "20px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  Voice Fidelity Score
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#F5C642",
                    letterSpacing: "-1px",
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  94.7
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .voice-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
};

export default VoiceDNASection;
