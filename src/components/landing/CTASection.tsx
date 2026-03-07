import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";

  // CTA is a high-contrast closing statement — dark in dark, rich off-black in light
  const bg      = dark ? "#050505" : "#0F0F0F";
  const eyeC    = "rgba(255,255,255,0.22)";
  const headC   = "#FFFFFF";
  const subC    = "rgba(255,255,255,0.36)";
  const inputBg = "rgba(255,255,255,0.05)";
  const inputBd = "rgba(255,255,255,0.1)";

  return (
    <section style={{ padding:"120px 36px", background:bg, borderTop:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
      <div style={{ maxWidth:580, margin:"0 auto" }}>
        <p style={{ fontSize:9, fontWeight:700, letterSpacing:"3.5px", textTransform:"uppercase", color:eyeC, fontFamily:"'Afacad Flux',sans-serif", marginBottom:26 }}>The mountain gets carried.</p>
        <h2 style={{ fontSize:"clamp(38px,5.5vw,76px)", fontWeight:900, letterSpacing:"-3.5px", color:headC, marginBottom:22, fontFamily:"'Afacad Flux',sans-serif", lineHeight:0.93 }}>
          Your thinking.<br /><span style={{ color:"#F5C642" }}>Composed.</span>
        </h2>
        <p style={{ fontSize:16, color:subC, lineHeight:1.78, marginBottom:52, fontFamily:"'Afacad Flux',sans-serif" }}>
          EVERYWHERE Studio is currently invitation only.<br />Join the founding member list.
        </p>
        {!submitted ? (
          <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
            style={{ display:"flex", gap:10, maxWidth:440, margin:"0 auto", flexWrap:"wrap", justifyContent:"center" }}>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ flex:1, minWidth:200, background:inputBg, border:`1px solid ${inputBd}`, borderRadius:5, padding:"14px 18px", color:"#FFFFFF", fontSize:14, fontFamily:"'Afacad Flux',sans-serif", outline:"none" }} />
            <button type="submit"
              style={{ background:"#F5C642", color:"#0A0A0A", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", padding:"14px 30px", borderRadius:5, fontFamily:"'Afacad Flux',sans-serif", transition:"opacity 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")}
              onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              Request Access
            </button>
          </form>
        ) : (
          <div style={{ padding:"18px 32px", background:"rgba(24,143,167,0.1)", border:"1px solid rgba(24,143,167,0.22)", borderRadius:8, display:"inline-block" }}>
            <p style={{ color:"#188FA7", fontSize:15, fontWeight:600, fontFamily:"'Afacad Flux',sans-serif" }}>You're on the list. We'll be in touch.</p>
          </div>
        )}
        <p style={{ marginTop:26, fontSize:11, color:"rgba(255,255,255,0.16)", fontFamily:"'Afacad Flux',sans-serif" }}>
          Or{" "}
          <button onClick={() => navigate("/studio/dashboard")} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.32)", fontSize:11, fontFamily:"'Afacad Flux',sans-serif", textDecoration:"underline", transition:"color 0.2s" }}
            onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.32)")}>
            explore the demo studio
          </button>
        </p>
      </div>
    </section>
  );
}
