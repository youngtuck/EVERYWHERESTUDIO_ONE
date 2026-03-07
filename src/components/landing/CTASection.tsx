import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  return (
    <section style={{ padding:"120px 40px", background:"var(--bg-inverse)", borderTop:"1px solid var(--border)", textAlign:"center" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <h2 style={{ fontSize:"clamp(36px,5vw,68px)", fontWeight:800, letterSpacing:"-0.04em", color:"var(--text-inverse)", marginBottom:20, fontFamily:"'Geist',sans-serif", lineHeight:0.96 }}>
          Your thinking.<br /><span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontWeight:400, color:"#E8A820" }}>Composed.</span>
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.4)", lineHeight:1.72, marginBottom:48, fontFamily:"'Geist',sans-serif", letterSpacing:"-0.01em" }}>
          Invitation only. Currently onboarding founding members.
        </p>
        {!done ? (
          <form onSubmit={e=>{e.preventDefault();setDone(true);}}
            style={{ display:"flex", gap:8, maxWidth:400, margin:"0 auto 20px", flexWrap:"wrap", justifyContent:"center" }}>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"12px 16px", color:"#fff", fontSize:14, fontFamily:"'Geist',sans-serif", outline:"none", letterSpacing:"-0.01em" }} />
            <button type="submit"
              style={{ background:"#fff", color:"#000", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, padding:"12px 22px", borderRadius:7, fontFamily:"'Geist',sans-serif", transition:"opacity 0.15s", letterSpacing:"-0.01em" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              Request access
            </button>
          </form>
        ) : (
          <div style={{ padding:"14px 24px", background:"rgba(24,143,167,0.12)", border:"1px solid rgba(24,143,167,0.24)", borderRadius:8, display:"inline-block", marginBottom:20 }}>
            <p style={{ color:"#188FA7", fontSize:14, fontFamily:"'Geist',sans-serif" }}>You're on the list. We'll be in touch.</p>
          </div>
        )}
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.18)", fontFamily:"'Geist',sans-serif" }}>
          Or <button onClick={()=>navigate("/studio/dashboard")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.32)", fontSize:12, fontFamily:"'Geist',sans-serif", textDecoration:"underline" }}>explore the demo</button>
        </p>
      </div>
    </section>
  );
}
