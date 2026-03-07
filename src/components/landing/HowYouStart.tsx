const STEPS = [
  { num: "01", label: "Voice DNA", tag: "Free · 15 min", desc: "A conversation with Watson. He asks questions, you answer naturally. The system builds a precise model of how you think and communicate. Everything runs on this." },
  { num: "02", label: "Testdrive", tag: "Free · 1 output", desc: "Bring one real idea. Watson draws it out, then the system shapes it into a format of your choice. You see what EVERYWHERE produces before committing to anything." },
  { num: "03", label: "Conversation", tag: "30 min · With Mark", desc: "If you want the full system, we talk. Not a sales call — a conversation about your goals and whether this is the right tool for where you're trying to go." },
];

const HowYouStart = () => (
  <section id="wrap" style={{ background: "#F8F8F8", padding: "120px 24px" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      <div className="fade-up" style={{ marginBottom: 80 }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>Getting Started</p>
        <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-2px", lineHeight: 1.0, fontFamily: "'Afacad Flux', sans-serif" }}>
          Three steps.<br /><span style={{ fontWeight: 300, color: "#BBBBBB" }}>No commitment until step three.</span>
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="steps-grid">
        {STEPS.map((s, i) => (
          <div key={s.num} className="fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
            <div style={{
              background: i === 0 ? "#0A0A0A" : "#ffffff",
              border: `1px solid ${i === 0 ? "transparent" : "#E8E8E8"}`,
              borderRadius: 10, padding: "40px 34px",
              height: "100%", display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: i === 0 ? "rgba(255,255,255,0.06)" : "#F2F2F2", lineHeight: 1, letterSpacing: "-3px", fontFamily: "'Afacad Flux', sans-serif" }}>{s.num}</span>
                <div style={{ height: 1, flex: 1, background: i === 0 ? "rgba(255,255,255,0.06)" : "#E8E8E8" }} />
              </div>

              <h3 style={{ fontSize: 24, fontWeight: 800, color: i === 0 ? "#ffffff" : "#0A0A0A", letterSpacing: "-0.5px", marginBottom: 8, fontFamily: "'Afacad Flux', sans-serif" }}>{s.label}</h3>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: i === 0 ? "#F5C642" : "#BBBBBB", marginBottom: 18, fontFamily: "'Afacad Flux', sans-serif" }}>{s.tag}</p>
              <p style={{ fontSize: 14, color: i === 0 ? "rgba(255,255,255,0.45)" : "#777777", lineHeight: 1.75, flex: 1, marginBottom: 32, fontFamily: "'Afacad Flux', sans-serif" }}>{s.desc}</p>

              <button
                onClick={() => document.getElementById("voice-dna")?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  background: i === 0 ? "#ffffff" : "transparent",
                  color: i === 0 ? "#0A0A0A" : "#555555",
                  border: i === 0 ? "none" : "1px solid #E8E8E8",
                  cursor: "pointer", fontSize: 10, fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  padding: "12px 20px", borderRadius: 4,
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "opacity 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {i === 0 ? "Start Here" : i === 1 ? "Try It" : "Get In Touch"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:700px){.steps-grid{grid-template-columns:1fr!important}}`}</style>
  </section>
);

export default HowYouStart;
