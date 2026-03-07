import Logo from "../Logo";
import { useNavigate } from "react-router-dom";
const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"#080808", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"28px 32px" }}>
      <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
        <Logo size="sm" />
        <div style={{ display:"flex", gap:22 }}>
          {[["Studio","/studio/dashboard"],["Sign In","/auth"],["Get Access","/auth"]].map(([label,path])=>(
            <button key={label} onClick={()=>navigate(path)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(255,255,255,0.2)",fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.45)")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.2)")}>{label}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)", fontFamily:"'Afacad Flux',sans-serif" }}>
          © 2026 Mixed Grill LLC · EVERYWHERE Studio™
        </p>
      </div>
    </footer>
  );
};
export default Footer;
