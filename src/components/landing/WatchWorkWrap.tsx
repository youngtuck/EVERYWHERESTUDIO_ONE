const SECTIONS = [
  {
    num:"01", id:"watch", label:"Watch",
    headline:"Signal, not noise.",
    body:"Before a word gets written, EVERYWHERE Studio does the intelligence work. Sentinel monitors your category overnight — surfacing what's moving, what's forming, what has your name on it. You wake up to a briefing.",
    detail:"Content triggers with angles. Competitor moves. Event radar. Trend signals. Everything organized and scannable. Tap what resonates — and you're in a conversation with Watson before you've finished your coffee.",
    color:"#188FA7",
    dark: true,
    side: [
      "Overnight category monitoring",
      "Content triggers with ready angles",
      "Competitor intelligence",
      "Event radar with local scope",
      "Trend signal detection",
    ]
  },
  {
    num:"02", id:"work", label:"Work",
    headline:"The interview before the essay.",
    body:"Watson, your First Listener, interviews you. Not a form. Not a prompt box. A conversation. Watson asks the questions that pull the real story out — the one stuck in your head, with the actual insight in it.",
    detail:"What emerges sounds like you because it came from you. Voice DNA captures your rhythm, your vocabulary, your argumentative structure. It sharpens with every session. The longer you use it, the wider the gap.",
    color:"#F5C642",
    dark: false,
    side: [
      "Watson conversation-first production",
      "Voice DNA — 3 layers, sharpening over time",
      "7 Quality Gates in sequence",
      "Betterish Score 0–1000",
      "12 output formats from one session",
    ]
  },
  {
    num:"03", id:"wrap", label:"Wrap",
    headline:"Every audience it deserves.",
    body:"Real publishing means every piece of thinking you produce reaches every audience it deserves, in the format that audience actually uses, with nothing left on the table.",
    detail:"A single idea becomes a complete publishing event. LinkedIn post, newsletter, podcast script, video brief — all from one conversation. Export to any platform. Nothing left to chance.",
    color:"rgba(255,255,255,0.7)",
    dark: true,
    side: [
      "12 format outputs from one session",
      "Platform-native formatting",
      "One-click export suite",
      "Impact tracking",
      "Scheduling integration (coming)",
    ]
  },
];

const WatchWorkWrap = () => (
  <div>
    {SECTIONS.map((s, i) => (
      <section key={s.id} id={s.id} style={{
        background: s.dark ? "#0A0A0A" : "var(--bg-primary)",
        padding: "90px 28px",
        borderTop: `1px solid ${s.dark ? "rgba(255,255,255,0.06)" : "var(--border)"}`,
      }}>
        <div style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 72,
          alignItems: "center",
        }} className="www-grid">
          {/* Left content — alternates sides */}
          <div style={{ order: i === 1 ? 2 : 1 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:14, marginBottom:20 }}>
              <span style={{
                fontSize: 80,
                fontWeight: 900,
                letterSpacing: "-5px",
                lineHeight: 1,
                fontFamily: "'Afacad Flux',sans-serif",
                userSelect: "none",
                color: s.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
              }}>{s.num}</span>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:s.color, fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</span>
            </div>
            <h2 style={{
              fontSize: "clamp(30px,3.5vw,50px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              color: s.dark ? "#FFFFFF" : "var(--text-primary)",
              marginBottom: 22,
              fontFamily: "'Afacad Flux',sans-serif",
              lineHeight: 1.0,
            }}>
              {s.headline}
            </h2>
            <p style={{ fontSize:16, lineHeight:1.78, color:s.dark?"rgba(255,255,255,0.5)":"var(--text-secondary)", marginBottom:14, fontFamily:"'Afacad Flux',sans-serif" }}>
              {s.body}
            </p>
            <p style={{ fontSize:14, lineHeight:1.72, color:s.dark?"rgba(255,255,255,0.3)":"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>
              {s.detail}
            </p>
          </div>

          {/* Right card */}
          <div style={{ order: i === 1 ? 1 : 2 }}>
            <div style={{
              background: s.dark ? "rgba(255,255,255,0.025)" : "var(--bg-secondary)",
              border: `1px solid ${s.dark ? "rgba(255,255,255,0.06)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "28px 32px",
            }}>
              {s.side.map((item, j) => (
                <div key={j} style={{
                  display:"flex", alignItems:"flex-start", gap:14,
                  padding:"13px 0",
                  borderBottom: j < s.side.length - 1
                    ? `1px solid ${s.dark ? "rgba(255,255,255,0.04)" : "var(--border)"}`
                    : undefined,
                }}>
                  <span style={{ fontSize:12, fontWeight:700, color:s.color, flexShrink:0, marginTop:2, fontFamily:"'Afacad Flux',sans-serif" }}>→</span>
                  <span style={{ fontSize:14, lineHeight:1.55, color:s.dark?"rgba(255,255,255,0.55)":"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`.www-grid{@media(max-width:768px){grid-template-columns:1fr!important} @media(max-width:768px) .www-grid>*{order:unset!important}}`}</style>
      </section>
    ))}
  </div>
);
export default WatchWorkWrap;
