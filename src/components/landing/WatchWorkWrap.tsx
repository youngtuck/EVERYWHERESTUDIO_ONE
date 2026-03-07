const SECTIONS = [
  {
    num:"01", id:"watch", label:"Watch",
    headline:"Signal, not noise.",
    body:"Before a word gets written, EVERYWHERE Studio does the intelligence work. Sentinel monitors your category overnight — surfacing what's moving, what's forming, what has your name on it. You wake up to a briefing. Three to five things that matter for your world today.",
    detail:"Content triggers with angles. Competitor moves. Event radar. Trend signals. Everything organized and scannable. Tap what resonates — and you're already in a conversation with Watson.",
    color:"#188FA7",
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
    body:"Watson, your First Listener, interviews you. Not a form. Not a prompt box. A conversation. Watson asks the questions that pull the real story out — the one that was stuck in your head, the one with the actual insight in it.",
    detail:"What emerges sounds like you because it came from you. Voice DNA captures your rhythm, your vocabulary, your argumentative structure. It sharpens with every session. The longer you use it, the wider the gap.",
    color:"#F5C642",
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
    detail:"A single idea becomes a complete publishing event. LinkedIn post, newsletter, podcast script, video brief, press release — all from one conversation. Export to any platform. Nothing left to chance.",
    color:"#FFFFFF",
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
    {SECTIONS.map((s, i) => {
      const dark = i === 0 || i === 2;
      return (
        <section key={s.id} id={s.id} style={{ background:dark?"#0A0A0A":"var(--bg-primary)", padding:"80px 28px", borderTop:`1px solid ${dark?"rgba(255,255,255,0.06)":"var(--border)"}` }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:i===1?"1fr 1fr":"1fr 1fr", gap:60, alignItems:"start" }} className="www-grid">
            {/* Left */}
            <div style={{ order:i===1?1:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:16, marginBottom:24 }}>
                <span style={{ fontSize:72, fontWeight:900, color:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", letterSpacing:"-4px", lineHeight:1, fontFamily:"'Afacad Flux',sans-serif", userSelect:"none" }}>{s.num}</span>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:s.color, fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</span>
              </div>
              <h2 style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:900, letterSpacing:"-1.5px", color:dark?"#FFFFFF":"var(--text-primary)", marginBottom:20, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.05 }}>
                {s.headline}
              </h2>
              <p style={{ fontSize:16, lineHeight:1.75, color:dark?"rgba(255,255,255,0.5)":"var(--text-secondary)", marginBottom:16, fontFamily:"'Afacad Flux',sans-serif" }}>{s.body}</p>
              <p style={{ fontSize:14, lineHeight:1.7, color:dark?"rgba(255,255,255,0.35)":"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{s.detail}</p>
            </div>
            {/* Right */}
            <div style={{ order:i===1?0:1 }}>
              <div style={{ background:dark?"rgba(255,255,255,0.02)":"var(--bg-secondary)", border:`1px solid ${dark?"rgba(255,255,255,0.06)":"var(--border)"}`, borderRadius:12, padding:"28px" }}>
                {s.side.map((item, j) => (
                  <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:j<s.side.length-1?`1px solid ${dark?"rgba(255,255,255,0.05)":"var(--border)"}`:undefined }}>
                    <span style={{ fontSize:13, fontWeight:700, color:s.color, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1, marginTop:2, flexShrink:0 }}>→</span>
                    <span style={{ fontSize:14, color:dark?"rgba(255,255,255,0.6)":"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`@media(max-width:768px){.www-grid{grid-template-columns:1fr!important}.www-grid>*{order:unset!important}}`}</style>
        </section>
      );
    })}
  </div>
);
export default WatchWorkWrap;
