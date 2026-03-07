import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    num: "01",
    label: "Voice DNA",
    tag: "Free · 15 minutes",
    desc: "A conversation with Watson. He asks questions. You answer naturally. The system builds a precise model of how you think and communicate. This is the foundation everything else runs on.",
    cta: "Start Here",
    ctaLink: "voice-dna",
    accent: "#4A90D9",
  },
  {
    num: "02",
    label: "Testdrive",
    tag: "Free · One output",
    desc: "Bring one real idea. Watson draws it out with questions, then 40 agents shape it into one format of your choice. You see exactly what EVERYWHERE Studio produces before committing to anything.",
    cta: "Try It",
    ctaLink: "voice-dna",
    accent: "#9ca3af",
  },
  {
    num: "03",
    label: "Conversation",
    tag: "30 minutes · With Mark",
    desc: "If you want the full system, we talk. Not a sales call — a conversation about your goals, your market, and whether the system is the right tool for where you're trying to go.",
    cta: "Get In Touch",
    ctaLink: "contact",
    accent: "#F5C642",
  },
];

const HowYouStart = () => {
  const navigate = useNavigate();

  return (
    <section
      id="wrap"
      style={{
        background: "#f9fafb",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 72 }}>
          <span className="section-label" style={{ display: "block", marginBottom: 16 }}>
            Getting Started
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              color: "#0D1B2A",
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 20,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Three steps.
            <br />
            <span style={{ fontWeight: 300, color: "#9ca3af" }}>No obligation until step three.</span>
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="steps-grid"
        >
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="fade-up"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "40px 36px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Step number */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: "#f3f4f6",
                      lineHeight: 1,
                      fontFamily: "'Afacad Flux', sans-serif",
                      letterSpacing: "-2px",
                    }}
                  >
                    {step.num}
                  </span>
                  <div
                    style={{
                      height: 1,
                      flex: 1,
                      background: "#e5e7eb",
                    }}
                  />
                </div>

                {/* Label + tag */}
                <div style={{ marginBottom: 20 }}>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#0D1B2A",
                      letterSpacing: "-0.5px",
                      marginBottom: 8,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {step.label}
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: step.accent,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {step.tag}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: "#6b7280",
                    lineHeight: 1.7,
                    flex: 1,
                    marginBottom: 32,
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  {step.desc}
                </p>

                <button
                  onClick={() => {
                    if (step.ctaLink === "voice-dna") {
                      document.getElementById("voice-dna")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  style={{
                    background: i === 0 ? "#0D1B2A" : "transparent",
                    color: i === 0 ? "#ffffff" : "#374151",
                    border: i === 0 ? "1px solid #0D1B2A" : "1px solid #e5e7eb",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "12px 24px",
                    borderRadius: 4,
                    fontFamily: "'Afacad Flux', sans-serif",
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (i === 0) { el.style.background = "#1B263B"; } else { el.style.background = "#f9fafb"; }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    if (i === 0) { el.style.background = "#0D1B2A"; } else { el.style.background = "transparent"; }
                  }}
                >
                  {step.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default HowYouStart;
