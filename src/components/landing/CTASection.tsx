import { useState } from "react";
import { useNavigate } from "react-router-dom";
const CTASection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };
  return (
    <section style={{ padding:"100px 28px", background:"#0A0A0A", borderTop:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <p className="eyebrow" style={{ color:"rgba(255,255,255,0.3)", marginBottom:20 }}>The mountain gets carried.</p>
        <h2 style={{ fontSize:"clamp(32px,5vw,60px)", fontWeight:900, letterSpacing:"-2.5px", color:"#FFFFFF", marginBottom:16, fontFamily:"'Afacad Flux',sans-serif", lineHeight:0.97 }}>
          Your thinking.<br /><span style={{ color:"#F5C642" }}>Composed.</span>
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:40, fontFamily:"'Afacad Flux',sans-serif" }}>
          EVERYWHERE Studio is currently invitation only. Join the founding member list.
        </p>
        {!submitted ? (
          <form onSubmit={submit} style={{ display:"flex", gap:10, maxWidth:400, margin:"0 auto", flexWrap:"wrap", justifyContent:"center" }}>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, padding:"12px 16px", color:"#FFFFFF", fontSize:14, fontFamily:"'Afacad Flux',sans-serif", outline:"none" }} />
            <button type="submit" className="btn-gold" style={{ fontSize:10 }}>Request Access</button>
          </form>
        ) : (
          <div style={{ padding:"16px 24px", background:"rgba(24,143,167,0.08)", border:"1px solid rgba(24,143,167,0.2)", borderRadius:8, display:"inline-block" }}>
            <p style={{ color:"#188FA7", fontSize:14, fontWeight:600, fontFamily:"'Afacad Flux',sans-serif" }}>You're on the list. We'll be in touch.</p>
          </div>
        )}
        <p style={{ marginTop:20, fontSize:12, color:"rgba(255,255,255,0.2)", fontFamily:"'Afacad Flux',sans-serif" }}>
          Or <button onClick={() => navigate("/studio/dashboard")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", fontSize:12, fontFamily:"'Afacad Flux',sans-serif", textDecoration:"underline" }}>explore the demo studio</button>
        </p>
      </div>
    </section>
  );
};
export default CTASection;
