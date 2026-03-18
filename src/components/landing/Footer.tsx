import Logo from "../Logo";
import { useNavigate } from "react-router-dom";
export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"#0D1B2A", borderTop:"3px solid #F5C642", padding:"28px 40px" }}>
      <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <Logo size="sm" variant="dark" />
        <div style={{ display:"flex", gap:24 }}>
          {[["Studio","/studio/dashboard"],["Sign in","/auth"]].map(([l,p])=>(
            <button key={l} onClick={()=>navigate(p!)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:"'Afacad Flux', sans-serif", transition:"color 0.15s", letterSpacing:"-0.01em" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}>{l}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"'Afacad Flux', sans-serif" }}>EVERYWHERE STUDIO &trade; 2026, Mixed Grill, LLC, v6.5 Alpha</p>
      </div>
    </footer>
  );
}
