import Logo from "../Logo";
import { useNavigate } from "react-router-dom";
export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"var(--bg-inverse)", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"28px 40px" }}>
      <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <Logo size="sm" variant="dark" />
        <div style={{ display:"flex", gap:24 }}>
          {[["Studio","/studio/dashboard"],["Sign in","/auth"]].map(([l,p])=>(
            <button key={l} onClick={()=>navigate(p!)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.25)", fontFamily:"'DM Sans',sans-serif", transition:"color 0.15s", letterSpacing:"-0.01em" }}
              onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>{l}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)", fontFamily:"'DM Sans',sans-serif" }}>© 2026 Mixed Grill LLC</p>
      </div>
    </footer>
  );
}
