import { Eye, Pen, Package } from "lucide-react";

const STAGES = [
  {
    id: "watch",
    number: "01",
    label: "Watch",
    icon: Eye,
    headline: "Your market.\nAlways on.",
    body: "Sentinel monitors your category, competitors, and signals around the clock. Every morning you wake up briefed — what moved, what matters, what to act on. Intelligence that was previously reserved for teams of analysts.",
    detail: "Daily briefings · Competitor tracking · Trend signals · Event radar",
  },
  {
    id: "work",
    number: "02",
    label: "Work",
    icon: Pen,
    headline: "Your ideas.\nYour voice.",
    body: "Bring an idea — a sentence, a voice memo, a vague feeling. Watson draws it out with questions. Then 40 specialist agents shape it into content that sounds exactly like you. Nine output types. Seven quality gates. Nothing ships that isn't ready.",
    detail: "Voice DNA · 40 agents · 7 quality gates · 9 output types",
  },
  {
    id: "wrap",
    number: "03",
    label: "Wrap",
    icon: Package,
    headline: "Published.\nTracked.\nDone.",
    body: "One idea becomes 12 formats, each built natively for its platform. LinkedIn knows LinkedIn. Substack knows Substack. Your podcast gets music cues. Your talk gets stage direction. It goes out. The Impact System starts the clock.",
    detail: "12 formats · Platform-native · Impact tracking · Unfold delivery",
  },
];

const WatchWorkWrap = () => {
  return (
    <section
      id="watch"
      style={{
        background: "#ffffff",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Section label */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 80 }}>
          <span className="section-label">How It Works</span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              color: "#0D1B2A",
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginTop: 16,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Watch. Work. Wrap.
          </h2>
          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: "#6b7280",
              maxWidth: 480,
              margin: "20px auto 0",
              lineHeight: 1.6,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Three layers. One system. The mountain between your idea and its audience — carried.
          </p>
        </div>

        {/* Stages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isEven = i % 2 === 0;
            return (
              <div
                key={stage.id}
                id={stage.id}
                className="fade-up"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    marginBottom: 16,
                  }}
                >
                  {/* Number/icon side */}
                  <div
                    style={{
                      background: isEven ? "#f9fafb" : "#0D1B2A",
                      padding: "64px 56px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      order: isEven ? 0 : 1,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                          color: isEven ? "#9ca3af" : "rgba(255,255,255,0.3)",
                          fontFamily: "'Afacad Flux', sans-serif",
                          display: "block",
                          marginBottom: 24,
                        }}
                      >
                        Stage {stage.number}
                      </span>
                      <span
                        style={{
                          fontSize: 96,
                          fontWeight: 800,
                          color: isEven ? "#e5e7eb" : "rgba(255,255,255,0.06)",
                          lineHeight: 1,
                          letterSpacing: "-4px",
                          fontFamily: "'Afacad Flux', sans-serif",
                          display: "block",
                          marginBottom: 32,
                        }}
                      >
                        {stage.number}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: isEven ? "#e5e7eb" : "rgba(255,255,255,0.07)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={18} color={isEven ? "#374151" : "rgba(255,255,255,0.5)"} />
                      </div>
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: isEven ? "#0D1B2A" : "#ffffff",
                          letterSpacing: "-0.5px",
                          fontFamily: "'Afacad Flux', sans-serif",
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  {/* Content side */}
                  <div
                    style={{
                      background: isEven ? "#0D1B2A" : "#f9fafb",
                      padding: "64px 56px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      order: isEven ? 1 : 0,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "clamp(28px, 3vw, 40px)",
                        fontWeight: 800,
                        color: isEven ? "#ffffff" : "#0D1B2A",
                        letterSpacing: "-1px",
                        lineHeight: 1.1,
                        marginBottom: 24,
                        fontFamily: "'Afacad Flux', sans-serif",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {stage.headline}
                    </h3>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 400,
                        color: isEven ? "rgba(255,255,255,0.6)" : "#6b7280",
                        lineHeight: 1.75,
                        marginBottom: 32,
                        fontFamily: "'Afacad Flux', sans-serif",
                      }}
                    >
                      {stage.body}
                    </p>
                    <div
                      style={{
                        borderTop: `1px solid ${isEven ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
                        paddingTop: 20,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "2px",
                          textTransform: "uppercase",
                          color: isEven ? "rgba(255,255,255,0.25)" : "#9ca3af",
                          fontFamily: "'Afacad Flux', sans-serif",
                        }}
                      >
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stage-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default WatchWorkWrap;
