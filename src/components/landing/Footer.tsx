import Logo from "../Logo";
import { useNavigate } from "react-router-dom";
export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"#080808", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"30px 36px" }}>
      <div style={{ maxWidth:1160, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <Logo size="sm" onDark={true} />
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[["Studio","/studio/dashboard"],["Sign In","/auth"],["Get Access","/auth"]].map(([label,path])=>(
            <button key={label} onClick={()=>navigate(path!)}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.22)", fontFamily:"'Afacad Flux',sans-serif", transition:"color 0.2s" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.22)")}>{label}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.14)", fontFamily:"'Afacad Flux',sans-serif" }}>© 2026 Mixed Grill LLC · EVERYWHERE Studio™</p>
      </div>
    </footer>
  );
}
