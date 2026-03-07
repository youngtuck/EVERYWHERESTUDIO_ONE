import { useTheme } from "../../context/ThemeContext";

const DATA = [
  {
    num:"01", id:"watch", label:"Watch", accentColor:"#188FA7",
    headline:"Signal, not noise.",
    body:"Before a word gets written, EVERYWHERE Studio does the intelligence work. Sentinel monitors your category overnight — surfacing what's moving, what's forming, what has your name on it. You wake up to a briefing.",
    detail:"Content triggers with angles. Competitor moves. Event radar. Trend signals. Everything organized and scannable. Tap what resonates — and you're in a conversation with Watson before you've finished your coffee.",
    items:["Overnight category monitoring","Content triggers with ready angles","Competitor intelligence","Event radar with local scope","Trend signal detection"],
  },
  {
    num:"02", id:"work", label:"Work", accentColor:"#F5C642",
    headline:"The interview before the essay.",
    body:"Watson, your First Listener, interviews you. Not a form. Not a prompt box. A conversation. Watson asks the questions that pull the real story out — the one stuck in your head, with the actual insight in it.",
    detail:"What emerges sounds like you because it came from you. Voice DNA captures your rhythm, your vocabulary, your argumentative structure. It sharpens with every session. The longer you use it, the wider the gap.",
    items:["Watson conversation-first production","Voice DNA — 3 layers, sharpening over time","7 Quality Gates in sequence","Betterish Score 0–1000","12 output formats from one session"],
  },
  {
    num:"03", id:"wrap", label:"Wrap", accentColor:"rgba(255,255,255,0.55)",
    headline:"Every audience it deserves.",
    body:"Real publishing means every piece of thinking you produce reaches every audience it deserves, in the format that audience actually uses, with nothing left on the table.",
    detail:"A single idea becomes a complete publishing event. LinkedIn post, newsletter, podcast script, video brief — all from one conversation. Export to any platform. Nothing left to chance.",
    items:["12 format outputs from one session","Platform-native formatting","One-click export suite","Impact tracking","Scheduling integration (coming)"],
  },
];

export default function WatchWorkWrap() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div>
      {DATA.map((s, i) => {
        // In dark mode: all sections dark. In light mode: alternate white/off-white, NO black.
        const bg = dark
          ? (i === 1 ? "#111111" : "#0A0A0A")
          : (i === 1 ? "#FFFFFF" : "var(--bg-secondary)");

        const headC  = dark ? "#FFFFFF" : "var(--text-primary)";
        const bodyC  = dark ? "rgba(255,255,255,0.5)" : "var(--text-secondary)";
        const detC   = dark ? "rgba(255,255,255,0.28)" : "var(--text-muted)";
        const numC   = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
        const cardBg = dark ? "rgba(255,255,255,0.03)" : "var(--bg-primary)";
        const cardBd = dark ? "rgba(255,255,255,0.07)" : "var(--border-strong)";
        const itemSep= dark ? "rgba(255,255,255,0.05)" : "var(--border)";
        const itemC  = dark ? "rgba(255,255,255,0.55)" : "var(--text-secondary)";
        const topBd  = dark ? "rgba(255,255,255,0.06)" : "var(--border)";

        // For wrap section in dark, the accentColor with rgba won't work well, use white
        const accentC = dark && i === 2 ? "rgba(255,255,255,0.55)" : i === 2 ? "rgba(0,0,0,0.4)" : s.accentColor;

        return (
          <section key={s.id} id={s.id} style={{ background:bg, padding:"96px 36px", borderTop:`1px solid ${topBd}` }}>
            <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }} className="www-grid">
              {/* Text — alternates sides */}
              <div style={{ order:i===1?2:1 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:16, marginBottom:22 }}>
                  <span style={{ fontSize:96, fontWeight:900, letterSpacing:"-6px", lineHeight:1, fontFamily:"'Afacad Flux',sans-serif", color:numC, userSelect:"none" }}>{s.num}</span>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"3px", textTransform:"uppercase", color:accentC, fontFamily:"'Afacad Flux',sans-serif" }}>{s.label}</span>
                </div>
                <h2 style={{ fontSize:"clamp(30px,3.5vw,54px)", fontWeight:900, letterSpacing:"-2px", color:headC, marginBottom:24, fontFamily:"'Afacad Flux',sans-serif", lineHeight:1.0 }}>{s.headline}</h2>
                <p style={{ fontSize:16, lineHeight:1.8, color:bodyC, marginBottom:16, fontFamily:"'Afacad Flux',sans-serif" }}>{s.body}</p>
                <p style={{ fontSize:14, lineHeight:1.72, color:detC, fontFamily:"'Afacad Flux',sans-serif" }}>{s.detail}</p>
              </div>

              {/* Card */}
              <div style={{ order:i===1?1:2 }}>
                <div style={{ background:cardBg, border:`1px solid ${cardBd}`, borderRadius:12, padding:"28px 32px", boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,0.06)" }}>
                  {s.items.map((item,j) => (
                    <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"13px 0", borderBottom:j<s.items.length-1?`1px solid ${itemSep}`:undefined }}>
                      <span style={{ fontSize:13, fontWeight:700, color:s.accentColor === "rgba(255,255,255,0.55)" ? (dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.35)") : s.accentColor, flexShrink:0, marginTop:1, fontFamily:"'Afacad Flux',sans-serif" }}>→</span>
                      <span style={{ fontSize:14, lineHeight:1.58, color:itemC, fontFamily:"'Afacad Flux',sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <style>{`@media(max-width:800px){.www-grid{grid-template-columns:1fr!important}.www-grid>*{order:unset!important}}`}</style>
          </section>
        );
      })}
    </div>
  );
}
