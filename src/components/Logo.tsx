type LogoProps = { size?: "sm"|"md"|"lg"; };
const Logo = ({ size = "md" }: LogoProps) => {
  const s = { sm:{main:13,sub:9,gap:4}, md:{main:17,sub:11,gap:5}, lg:{main:23,sub:14,gap:7} }[size];
  return (
    <div style={{ display:"inline-flex", alignItems:"baseline", gap:s.gap, fontFamily:"'Afacad Flux',sans-serif", userSelect:"none" }}>
      <span style={{ fontSize:s.main, fontWeight:800, letterSpacing:"-0.5px", color:"var(--text-primary)" }}>
        EVERY<span style={{ color:"#4A90D9" }}>WHERE</span>
      </span>
      <span style={{ fontSize:s.sub, fontWeight:300, letterSpacing:"3px", textTransform:"uppercase", color:"#F5C642" }}>STUDIO</span>
      <span style={{ fontSize:s.sub*0.7, color:"var(--text-muted)", fontWeight:400 }}>™</span>
    </div>
  );
};
export default Logo;
