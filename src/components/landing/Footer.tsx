import Logo from "../Logo";
import { useNavigate } from "react-router-dom";
const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"#0A0A0A", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"32px 28px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <Logo size="sm" />
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {[["Studio","/studio/dashboard"],["Sign In","/auth"],["Get Access","/auth"]].map(([label,path])=>(
            <button key={label} onClick={()=>navigate(path)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.25)",fontFamily:"'Afacad Flux',sans-serif" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>{label}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.18)", fontFamily:"'Afacad Flux',sans-serif" }}>
          © 2026 Mixed Grill LLC. EVERYWHERE Studio™
        </p>
      </div>
    </footer>
  );
};
export default Footer;
