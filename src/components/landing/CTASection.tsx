import { useState } from "react";
import { useNavigate } from "react-router-dom";
const CTASection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };
  return (
    <section style={{ padding:"110px 28px", background:"#0A0A0A", borderTop:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <p className="eyebrow" style={{ color:"rgba(255,255,255,0.25)", marginBottom:22 }}>The mountain gets carried.</p>
        <h2 style={{ fontSize:"clamp(36px,5vw,68px)", fontWeight:900, letterSpacing:"-2.5px", color:"#FFFFFF", marginBottom:18, fontFamily:"'Afacad Flux',sans-serif", lineHeight:0.95 }}>
          Your thinking.<br /><span style={{ color:"#F5C642" }}>Composed.</span>
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.38)", lineHeight:1.75, marginBottom:44, fontFamily:"'Afacad Flux',sans-serif" }}>
          EVERYWHERE Studio is currently invitation only.<br />Join the founding member list.
        </p>
        {!submitted ? (
          <form onSubmit={submit} style={{ display:"flex", gap:10, maxWidth:420, margin:"0 auto", flexWrap:"wrap", justifyContent:"center" }}>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"13px 16px", color:"#FFFFFF", fontSize:14, fontFamily:"'Afacad Flux',sans-serif", outline:"none" }} />
            <button type="submit" style={{ background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"13px 28px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif" }}>
              Request Access
            </button>
          </form>
        ) : (
          <div style={{ padding:"16px 28px", background:"rgba(24,143,167,0.08)", border:"1px solid rgba(24,143,167,0.2)", borderRadius:8, display:"inline-block" }}>
            <p style={{ color:"#188FA7", fontSize:15, fontWeight:600, fontFamily:"'Afacad Flux',sans-serif" }}>You're on the list. We'll be in touch.</p>
          </div>
        )}
        <p style={{ marginTop:22, fontSize:11, color:"rgba(255,255,255,0.18)", fontFamily:"'Afacad Flux',sans-serif" }}>
          Or{" "}
          <button onClick={() => navigate("/studio/dashboard")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.32)", fontSize:11, fontFamily:"'Afacad Flux',sans-serif", textDecoration:"underline" }}>
            explore the demo studio
          </button>
        </p>
      </div>
    </section>
  );
};
export default CTASection;
