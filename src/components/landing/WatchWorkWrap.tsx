import { Eye, PenLine, Package } from "lucide-react";

const STAGES = [
  {
    id: "watch", num: "01", label: "Watch", Icon: Eye,
    headline: "Your market. Briefed daily.",
    body: "Sentinel monitors your category, competitors, and signals around the clock. Every morning you wake up knowing what moved, what matters, what to act on. Intelligence reserved for analysts — now yours automatically.",
    tags: ["Daily briefings", "Competitor tracking", "Trend signals", "Event radar"],
  },
  {
    id: "work", num: "02", label: "Work", Icon: PenLine,
    headline: "Your ideas. Your voice.",
    body: "Bring a sentence, a voice memo, a half-formed thought. Watson draws it out. 40 specialist agents shape it into content that sounds exactly like you — not AI, not generic. Nine output types. Seven gates. Nothing ships that isn't ready.",
    tags: ["Voice DNA", "40 agents", "7 quality gates", "9 output types"],
  },
  {
    id: "wrap", num: "03", label: "Wrap", Icon: Package,
    headline: "Published. Tracked. Done.",
    body: "One idea becomes 12 formats, each built natively for its platform. LinkedIn knows LinkedIn. Your podcast gets music cues. Your talk gets stage direction. It ships. The Impact System starts the clock.",
    tags: ["12 formats", "Platform-native", "Impact tracking", "Delivery"],
  },
];

const WatchWorkWrap = () => (
  <section id="watch" style={{ background: "#FFFFFF", padding: "120px 24px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      <div className="fade-up" style={{ marginBottom: 88 }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>The System</p>
        <h2 style={{
          fontSize: "clamp(40px, 5.5vw, 68px)",
          fontWeight: 800, color: "#0A0A0A",
          letterSpacing: "-2.5px", lineHeight: 1.0,
          fontFamily: "'Afacad Flux', sans-serif",
        }}>
          Watch. Work. Wrap.
        </h2>
        <p style={{
          fontSize: 18, fontWeight: 400, color: "#777777",
          maxWidth: 460, marginTop: 18, lineHeight: 1.65,
          fontFamily: "'Afacad Flux', sans-serif",
        }}>
          Three layers. One system. The mountain between your idea and its audience — carried.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {STAGES.map((stage, i) => {
          const isDark = i % 2 !== 0;
          return (
            <div key={stage.id} id={i === 1 ? "work" : undefined}
              className="fade-up" style={{ transitionDelay: `${i * 80}ms` }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #E8E8E8",
                marginBottom: 12,
              }} className="stage-grid">
                {/* Number panel */}
                <div style={{
                  background: isDark ? "#0A0A0A" : "#F8F8F8",
                  padding: "60px 52px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  order: isDark ? 1 : 0,
                }}>
                  <div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: isDark ? "rgba(255,255,255,0.2)" : "#BBBBBB",
                      fontFamily: "'Afacad Flux', sans-serif",
                      display: "block", marginBottom: 20,
                    }}>Stage {stage.num}</span>
                    <span style={{
                      fontSize: 112, fontWeight: 800, lineHeight: 1,
                      letterSpacing: "-6px",
                      color: isDark ? "rgba(255,255,255,0.04)" : "#EBEBEB",
                      fontFamily: "'Afacad Flux', sans-serif",
                      display: "block", marginBottom: 28,
                    }}>{stage.num}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 7,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#EBEBEB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <stage.Icon size={16} color={isDark ? "rgba(255,255,255,0.4)" : "#555555"} />
                    </div>
                    <span style={{
                      fontSize: 26, fontWeight: 800,
                      color: isDark ? "#ffffff" : "#0A0A0A",
                      letterSpacing: "-0.5px",
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}>{stage.label}</span>
                  </div>
                </div>

                {/* Content panel */}
                <div style={{
                  background: isDark ? "#F8F8F8" : "#0A0A0A",
                  padding: "60px 52px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  order: isDark ? 0 : 1,
                }}>
                  <h3 style={{
                    fontSize: "clamp(24px, 2.8vw, 38px)",
                    fontWeight: 800,
                    color: isDark ? "#0A0A0A" : "#ffffff",
                    letterSpacing: "-1px", lineHeight: 1.1,
                    marginBottom: 20,
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}>{stage.headline}</h3>
                  <p style={{
                    fontSize: 15, fontWeight: 400,
                    color: isDark ? "#555555" : "rgba(255,255,255,0.5)",
                    lineHeight: 1.75, marginBottom: 28,
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}>{stage.body}</p>
                  <div style={{
                    borderTop: `1px solid ${isDark ? "#E8E8E8" : "rgba(255,255,255,0.07)"}`,
                    paddingTop: 18,
                    display: "flex", flexWrap: "wrap", gap: 8,
                  }}>
                    {stage.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "2px",
                        textTransform: "uppercase",
                        color: isDark ? "#BBBBBB" : "rgba(255,255,255,0.2)",
                        fontFamily: "'Afacad Flux', sans-serif",
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <style>{`@media(max-width:700px){.stage-grid{grid-template-columns:1fr!important}}`}</style>
  </section>
);

export default WatchWorkWrap;
