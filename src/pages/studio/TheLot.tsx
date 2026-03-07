import { Inbox } from "lucide-react";
const TheLot = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"calc(100vh - 54px)", padding:24 }}>
    <div style={{ textAlign:"center", maxWidth:360 }}>
      <div style={{ width:52, height:52, borderRadius:12, background:"var(--bg-secondary)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <Inbox size={20} style={{ color:"var(--text-muted)" }} />
      </div>
      <h2 style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px", marginBottom:10, fontFamily:"'Afacad Flux',sans-serif" }}>The Lot</h2>
      <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7, fontFamily:"'Afacad Flux',sans-serif" }}>
        Your parked ideas — the ones you're not ready to work on yet, but too good to lose. Coming in a future phase.
      </p>
    </div>
  </div>
);
export default TheLot;
