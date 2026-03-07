import { useState } from "react";

const GATES = [
  { num: "01", name: "Strategy Gate", q: "Does this serve the right goal?", desc: "Checked against your objectives before a word is written." },
  { num: "02", name: "Voice Gate", q: "Does this sound like you?", desc: "Voice DNA comparison — rhythm, vocabulary, signature phrases, prohibited language." },
  { num: "03", name: "Accuracy Gate", q: "Is every claim verifiable?", desc: "Every factual claim verified against at least two sources. Nothing ships with unchecked data." },
  { num: "04", name: "AI Tells Gate", q: "Does this read as human?", desc: "Weekly-updated list of AI tells. All flagged and removed before anything ships." },
  { num: "05", name: "Audience Gate", q: "Will this land?", desc: "Resonance check. Does this serve the audience or just the author? Navel-gazing goes back." },
  { num: "06", name: "Platform Gate", q: "Is this built for where it's going?", desc: "Channel-specific requirements applied automatically. Platform optimization is invisible." },
  { num: "07", name: "Impact Gate", q: "Is this worth publishing?", desc: "Final review. Does this advance the body of work? Clears six gates but fails this one — it waits." },
];

const QualityGates = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section style={{ background: "#0A0A0A", padding: "120px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div className="fade-up" style={{ marginBottom: 72 }}>
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.2)", marginBottom: 16 }}>Quality</p>
          <h2 style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 800, color: "#ffffff",
            letterSpacing: "-2px", lineHeight: 1.0,
            marginBottom: 18, fontFamily: "'Afacad Flux', sans-serif",
          }}>Nothing ships without earning it.</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 460, lineHeight: 1.7, fontFamily: "'Afacad Flux', sans-serif" }}>
            Seven mandatory gates. Every piece. Every time. No exceptions, no skipping, no overrides.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {GATES.map((g, i) => (
            <div key={g.num} className="fade-up" style={{ transitionDelay: `${i * 50}ms` }}>
              <div
                style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 32px",
                  alignItems: "center", gap: 20,
                  padding: "22px 28px",
                  background: active === i ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${active === i ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)"}`,
                  borderRadius: 7, cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setActive(active === i ? null : i)}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "1px" }}>{g.num}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 3, fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "-0.2px" }}>{g.name}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'Afacad Flux', sans-serif", fontStyle: "italic" }}>"{g.q}"</p>
                  {active === i && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.65, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "'Afacad Flux', sans-serif" }}>{g.desc}</p>
                  )}
                </div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(24,143,167,0.12)", border: "1px solid rgba(24,143,167,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "#188FA7" }}>✓</div>
              </div>
            </div>
          ))}
        </div>

        <div className="fade-up" style={{ marginTop: 40, padding: "24px 28px", background: "rgba(245,198,66,0.04)", border: "1px solid rgba(245,198,66,0.1)", borderRadius: 8, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 3, height: 36, background: "#F5C642", borderRadius: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, fontFamily: "'Afacad Flux', sans-serif" }}>
            If it matters enough to say, it matters enough to say correctly. The gates protect your reputation as much as your message.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QualityGates;
