const STORIES = [
  {
    tag: "The Operator", sub: "Built a $40M company. No content presence.",
    before: "3,200 LinkedIn followers. Posted twice a year. Lost a board seat because the room didn't know who he was.",
    after: "12 months later: 47,000 followers. Two speaking invitations. A VC firm called because they'd been reading him for months.",
    metric: "14×", metricLabel: "Follower growth",
  },
  {
    tag: "The Expert", sub: "Published researcher. Couldn't reach practitioners.",
    before: "Writing 10,000-word papers that 200 people read. Ideas that could reshape an industry — locked behind paywalls.",
    after: "Same ideas. 12 formats. LinkedIn, podcast, newsletter, speaking. Now training the practitioners who implement her research.",
    metric: "8mo", metricLabel: "To industry keynote",
  },
  {
    tag: "The Founder", sub: "Scaling fast. No time. No team.",
    before: "Brilliant operator. No voice in market. Hiring felt like a lottery because candidates didn't know what they were joining.",
    after: "Built a public point of view while scaling. Three senior hires cited his content as the reason they applied.",
    metric: "3→28", metricLabel: "Team in 14 months",
  },
];

const ProofStories = () => (
  <section style={{ background: "#ffffff", padding: "120px 24px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      <div className="fade-up" style={{ marginBottom: 72 }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>Outcomes</p>
        <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-2px", lineHeight: 1.0, fontFamily: "'Afacad Flux', sans-serif" }}>
          Ideas that landed.
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="proof-grid">
        {STORIES.map((s, i) => (
          <div key={s.tag} className="fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
            <div style={{
              background: "#F8F8F8",
              border: "1px solid #E8E8E8", borderRadius: 10,
              padding: "36px 30px", height: "100%",
              display: "flex", flexDirection: "column",
              transition: "border-color 0.25s ease, transform 0.25s ease",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#2A2A2A"; el.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#E8E8E8"; el.style.transform = "translateY(0)"; }}
            >
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#999999", marginBottom: 8, fontFamily: "'Afacad Flux', sans-serif" }}>{s.tag}</p>
                <p style={{ fontSize: 14, color: "#555555", fontFamily: "'Afacad Flux', sans-serif" }}>{s.sub}</p>
              </div>

              <div style={{ marginBottom: 16, flex: 1 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#BBBBBB", marginBottom: 7, fontFamily: "'Afacad Flux', sans-serif" }}>Before</p>
                <p style={{ fontSize: 13, color: "#555555", lineHeight: 1.65, fontFamily: "'Afacad Flux', sans-serif" }}>{s.before}</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#BBBBBB", marginBottom: 7, fontFamily: "'Afacad Flux', sans-serif" }}>After</p>
                <p style={{ fontSize: 13, color: "#555555", lineHeight: 1.65, fontFamily: "'Afacad Flux', sans-serif" }}>{s.after}</p>
              </div>

              <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: 18, display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-1.5px", fontFamily: "'Afacad Flux', sans-serif" }}>{s.metric}</span>
                <span style={{ fontSize: 12, color: "#999999", fontFamily: "'Afacad Flux', sans-serif" }}>{s.metricLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:700px){.proof-grid{grid-template-columns:1fr!important}}`}</style>
  </section>
);

export default ProofStories;
