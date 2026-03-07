const AboutMark = () => (
  <section style={{ background: "#0A0A0A", padding: "120px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 500, height: 500, background: "radial-gradient(circle, rgba(245,198,66,0.03) 0%, transparent 60%)", pointerEvents: "none" }} />

    <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 80, alignItems: "start" }} className="about-grid">

        <div className="fade-up">
          <div style={{ width: 96, height: 96, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.12)", letterSpacing: "-1px", fontFamily: "'Afacad Flux', sans-serif" }}>MS</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: 4, fontFamily: "'Afacad Flux', sans-serif" }}>Mark Sylvester</h3>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 24, fontFamily: "'Afacad Flux', sans-serif" }}>Founder · Composer</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["TEDxSantaBarbara Producer", "3× Startup Founder", "20 Years in Content & Media", "Santa Barbara, CA"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Afacad Flux', sans-serif" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="fade-up delay-1" style={{ borderLeft: "2px solid rgba(245,198,66,0.3)", paddingLeft: 24, marginBottom: 36 }}>
            <p style={{ fontSize: "clamp(18px, 2.2vw, 26px)", fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.55, fontStyle: "italic", fontFamily: "'Afacad Flux', sans-serif" }}>
              "The terrible choice isn't between AI and authenticity. It's between publishing and silence. Most thought leaders choose silence — not because they have nothing to say, but because the mountain is too steep to climb alone."
            </p>
          </div>
          <p className="fade-up delay-2" style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, marginBottom: 18, fontFamily: "'Afacad Flux', sans-serif" }}>
            Mark built EVERYWHERE Studio because he needed it. As the producer of TEDxSantaBarbara and a serial founder, he had ideas worth sharing — and no system for sharing them consistently.
          </p>
          <p className="fade-up delay-3" style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, fontFamily: "'Afacad Flux', sans-serif" }}>
            The studio he built for himself is now available to the thought leaders who face the same mountain. The ideas stay yours. The voice stays yours. The mountain gets carried.
          </p>
        </div>
      </div>
    </div>
    <style>{`@media(max-width:700px){.about-grid{grid-template-columns:1fr!important;gap:48px!important}}`}</style>
  </section>
);

export default AboutMark;
