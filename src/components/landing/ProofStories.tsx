const STORIES = [
  {
    archetype: "The Operator",
    description: "Built a $40M company. No content presence.",
    before: "Had 3,200 LinkedIn followers. Posted twice a year. Lost a board seat because the room didn't know who he was.",
    after: "12 months later: 47,000 followers. Two speaking invitations. A VC firm called because they'd been reading him for months.",
    metric: "14× follower growth",
    accentColor: "#4A90D9",
  },
  {
    archetype: "The Expert",
    description: "Published researcher. Couldn't reach practitioners.",
    before: "Writing 10,000-word papers that 200 people read. Ideas that could reshape an industry — locked behind journal paywalls.",
    after: "Same ideas. 12 formats. LinkedIn, podcast, newsletter, speaking. Now training the practitioners who implement her research.",
    metric: "Industry keynote in 8 months",
    accentColor: "#F5C642",
  },
  {
    archetype: "The Founder",
    description: "Scaling fast. No time. No team.",
    before: "Brilliant operator. No voice in market. Hiring felt like a lottery because candidates didn't know what they were joining.",
    after: "Built a public point of view while scaling. Three senior hires cited his content as the reason they applied. Culture preceded headcount.",
    metric: "Team of 3 → 28 in 14 months",
    accentColor: "#188FA7",
  },
];

const ProofStories = () => {
  return (
    <section
      style={{
        background: "#ffffff",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 72 }}>
          <span className="section-label" style={{ display: "block", marginBottom: 16 }}>
            Outcomes
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              color: "#0D1B2A",
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Ideas that landed.
          </h2>
        </div>

        {/* Stories */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="stories-grid"
        >
          {STORIES.map((story, i) => (
            <div
              key={story.archetype}
              className="fade-up"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "36px 32px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.3s ease, transform 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = story.accentColor + "40";
                  el.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#e5e7eb";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Archetype */}
                <div style={{ marginBottom: 28 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: story.accentColor,
                      marginBottom: 10,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {story.archetype}
                  </span>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 400,
                      color: "#6b7280",
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {story.description}
                  </p>
                </div>

                {/* Before */}
                <div style={{ marginBottom: 20, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    Before
                  </span>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.65,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {story.before}
                  </p>
                </div>

                {/* After */}
                <div style={{ marginBottom: 28 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    After
                  </span>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.65,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {story.after}
                  </p>
                </div>

                {/* Metric */}
                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: 28,
                      background: story.accentColor,
                      borderRadius: 2,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0D1B2A",
                      fontFamily: "'Afacad Flux', sans-serif",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {story.metric}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default ProofStories;
