import { useTheme } from "../../context/ThemeContext";

const DATA = [
  {
    num:"01", id:"watch", label:"Watch", accent:"#0D8C9E",
    heading:"Signal, not noise.",
    body:"Before a word gets written, EVERYWHERE Studio does the intelligence work. Sentinel monitors your category overnight — surfacing what's moving, what's forming, what has your name on it.",
    detail:"You wake up to a briefing. Content triggers with angles. Competitor moves. Trend signals. Everything organized and scannable. Tap what resonates.",
    items:["Overnight category monitoring","Content triggers with ready angles","Competitor intelligence","Event radar with local scope","Trend signal detection"],
  },
  {
    num:"02", id:"work", label:"Work", accent:"#C8961A",
    heading:"The interview before the essay.",
    body:"Watson, your First Listener, interviews you. Not a form. Not a prompt. A conversation. Watson asks the questions that pull the real story out — the one that was stuck in your head.",
    detail:"What emerges sounds like you because it came from you. Voice DNA captures your rhythm, your vocabulary, your argumentative structure. It sharpens with every session.",
    items:["Watson conversation-first production","Voice DNA — 3 layers","7 Quality Gates in sequence","Betterish Score 0–1000","12 output formats"],
  },
  {
    num:"03", id:"wrap", label:"Wrap", accent:"#3A7BD5",
    heading:"Every audience it deserves.",
    body:"Real publishing means every piece of thinking reaches every audience it deserves, in the format that audience actually uses — with nothing left on the table.",
    detail:"A single idea becomes a complete publishing event. LinkedIn post, newsletter, podcast script, video brief — all from one conversation.",
    items:["12 format outputs from one session","Platform-native formatting","One-click export","Impact tracking","Scheduling (coming)"],
  },
];

export default function WatchWorkWrap() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div>
      {DATA.map((s,i) => {
        const altBg = i % 2 === 1;
        const bg = dark
          ? (altBg ? "var(--bg-2)" : "var(--bg)")
          : (altBg ? "#FFFFFF" : "var(--bg-2)");

        return (
          <section key={s.id} id={s.id} style={{ background:bg, padding:"100px 32px", borderTop:"1px solid var(--line)" }}>
            <div style={{ maxWidth:1160, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:100, alignItems:"center" }} className="www-g">
              <div style={{ order:i===1?2:1 }}>
                {/* Number + label */}
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
                  <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:14, color:"var(--fg-3)", fontStyle:"italic" }}>{s.num}</span>
                  <span style={{ width:24, height:1, background:"var(--line-2)", display:"block" }} />
                  <span style={{ fontSize:10, fontWeight:500, letterSpacing:"1px", textTransform:"uppercase", color:s.accent, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span>
                </div>

                <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(32px,3.8vw,56px)", fontWeight:400, letterSpacing:"-0.5px", color:"var(--fg)", marginBottom:22, lineHeight:1.08 }}>
                  {s.heading}
                </h2>
                <p style={{ fontSize:16, lineHeight:1.82, color:"var(--fg-2)", marginBottom:14, fontFamily:"'DM Sans',sans-serif", fontWeight:300 }}>{s.body}</p>
                <p style={{ fontSize:14, lineHeight:1.78, color:"var(--fg-3)", fontFamily:"'DM Sans',sans-serif", fontWeight:300 }}>{s.detail}</p>
              </div>

              <div style={{ order:i===1?1:2 }}>
                <div style={{ background:"var(--surface)", border:"1px solid var(--line)", borderRadius:12, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                  {s.items.map((item,j) => (
                    <div key={j} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 22px", borderBottom:j<s.items.length-1?"1px solid var(--line)":undefined }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:s.accent, flexShrink:0, opacity:0.7, display:"block" }} />
                      <span style={{ fontSize:14, color:"var(--fg-2)", fontFamily:"'DM Sans',sans-serif", fontWeight:300 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <style>{`@media(max-width:820px){.www-g{grid-template-columns:1fr!important}.www-g>*{order:unset!important}}`}</style>
          </section>
        );
      })}
    </div>
  );
}
