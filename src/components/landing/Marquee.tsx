const ITEMS = ["Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio","Watch","Work","Wrap","Voice DNA","7 Quality Gates","Betterish Score","Sentinel Intelligence","Composed Intelligence","Thought Leaders","Ideas to Impact","40 Agents","One Voice","One Studio"];
const Marquee = ({ inverted = false }: { inverted?: boolean }) => (
  <div style={{ overflow:"hidden", borderTop:`1px solid ${inverted?"rgba(255,255,255,0.08)":"var(--border)"}`, borderBottom:`1px solid ${inverted?"rgba(255,255,255,0.08)":"var(--border)"}`, padding:"11px 0", background:inverted?"#0A0A0A":"var(--bg-secondary)" }}>
    <div className="marquee-track">
      {ITEMS.map((item, i) => (
        <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:24, padding:"0 24px", fontSize:11, fontWeight:600, letterSpacing:"2.5px", textTransform:"uppercase", color:inverted?"rgba(255,255,255,0.25)":"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", whiteSpace:"nowrap" }}>
          {item} <span style={{ color:inverted?"rgba(245,198,66,0.4)":"rgba(245,198,66,0.5)", fontSize:8 }}>◆</span>
        </span>
      ))}
    </div>
  </div>
);
export default Marquee;
