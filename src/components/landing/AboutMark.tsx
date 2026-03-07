const AboutMark = () => {
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
          top: 0,
          right: 0,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(245,198,66,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 80,
            alignItems: "center",
          }}
          className="about-grid"
        >
          {/* Left: identity block */}
          <div className="fade-up">
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                fontSize: 40,
                fontWeight: 800,
                color: "rgba(255,255,255,0.15)",
                fontFamily: "'Afacad Flux', sans-serif",
                letterSpacing: "-2px",
              }}
            >
              MS
            </div>
            <h3
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                marginBottom: 6,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              Mark Sylvester
            </h3>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              Founder · Composer
            </p>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "TEDxSantaBarbara Producer",
                "3× Startup Founder",
                "20 Years in Content & Media",
                "Santa Barbara, CA",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: quote + copy */}
          <div>
            <div
              className="fade-up delay-1"
              style={{
                borderLeft: "3px solid rgba(245,198,66,0.4)",
                paddingLeft: 28,
                marginBottom: 40,
              }}
            >
              <p
                style={{
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.5,
                  letterSpacing: "-0.3px",
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontStyle: "italic",
                }}
              >
                "The terrible choice isn't between AI and authenticity. It's between publishing and silence. Most thought leaders choose silence — not because they have nothing to say, but because the mountain between the idea and the audience is too steep to climb alone."
              </p>
            </div>

            <div className="fade-up delay-2">
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.8,
                  marginBottom: 20,
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                Mark built EVERYWHERE Studio because he needed it. As the producer of TEDxSantaBarbara and a serial founder, he had ideas worth sharing — and no system for sharing them consistently. The studio he built for himself is now available to the thought leaders who face the same mountain.
              </p>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.8,
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                EVERYWHERE is orchestrated intelligence — not a tool you operate, but a system that works for you. The ideas stay yours. The voice stays yours. The mountain gets carried.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
};

export default AboutMark;
