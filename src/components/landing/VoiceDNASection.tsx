const DNA_LAYERS = [
  { label: "Voice Markers", items: ["Sentence length", "Paragraph rhythm", "Transition patterns", "Punctuation style"] },
  { label: "Value Markers", items: ["Recurring themes", "What you oppose", "Signature positions", "Belief language"] },
  { label: "Personality Markers", items: ["Humor style", "Humility signals", "Confidence register", "Reader relationship"] },
];

const VoiceDNASection = () => (
  <section id="voice-dna" style={{ background: "#0A0A0A", padding: "120px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      background: "radial-gradient(ellipse 60% 50% at 75% 50%, rgba(245,198,66,0.03) 0%, transparent 70%)",
    }} />

    <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="voice-grid">

        {/* Left */}
        <div>
          <p className="fade-up eyebrow" style={{ color: "rgba(255,255,255,0.2)", marginBottom: 18 }}>The Technology</p>
          <h2 className="fade-up delay-1" style={{
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 800, color: "#ffffff",
            letterSpacing: "-1.5px", lineHeight: 1.05,
            marginBottom: 24,
            fontFamily: "'Afacad Flux', sans-serif",
          }}>
            It writes like you.<br />
            <span style={{ color: "#F5C642", fontWeight: 300 }}>Because it learned from you.</span>
          </h2>
          <p className="fade-up delay-2" style={{
            fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.45)",
            lineHeight: 1.8, marginBottom: 20,
            fontFamily: "'Afacad Flux', sans-serif",
          }}>
            Voice DNA isn't voice matching. It's a deep capture of how you actually communicate — your rhythms, your values, the words you'd never use. It starts with a 15-minute conversation and sharpens with every piece you create.
          </p>
          <p className="fade-up delay-3" style={{
            fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.45)",
            lineHeight: 1.8, marginBottom: 44,
            fontFamily: "'Afacad Flux', sans-serif",
          }}>
            After 30 days it knows you. After 90, it anticipates you.
          </p>
          <button className="fade-up delay-4" onClick={() => {}} style={{
            background: "#ffffff", color: "#0A0A0A",
            border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", padding: "13px 30px",
            borderRadius: 4, fontFamily: "'Afacad Flux', sans-serif",
            transition: "opacity 0.2s ease",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Extract Your Voice DNA — Free
          </button>
        </div>

        {/* Right — DNA card */}
        <div className="fade-up delay-2">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DNA_LAYERS.map((layer, i) => (
              <div key={layer.label} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "22px 24px",
                transition: "border-color 0.25s ease",
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <p style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "2.5px",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                  marginBottom: 12, fontFamily: "'Afacad Flux', sans-serif",
                }}>{layer.label}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {layer.items.map(item => (
                    <span key={item} style={{
                      fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "4px 10px", borderRadius: 4,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Score */}
            <div style={{
              background: "rgba(245,198,66,0.04)",
              border: "1px solid rgba(245,198,66,0.12)",
              borderRadius: 8, padding: "18px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "2.5px",
                textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
                fontFamily: "'Afacad Flux', sans-serif",
              }}>Voice Fidelity Score</span>
              <span style={{
                fontSize: 30, fontWeight: 800, color: "#F5C642",
                letterSpacing: "-1.5px", fontFamily: "'Afacad Flux', sans-serif",
              }}>94.7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>{`@media(max-width:700px){.voice-grid{grid-template-columns:1fr!important;gap:48px!important}}`}</style>
  </section>
);

export default VoiceDNASection;
