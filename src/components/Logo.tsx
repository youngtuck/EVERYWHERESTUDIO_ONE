interface LogoProps { size?: "sm" | "md" | "lg"; onDark?: boolean; }
const Logo = ({ size = "md", onDark = false }: LogoProps) => {
  const s = { sm:{fs:13,sub:9}, md:{fs:17,sub:11}, lg:{fs:24,sub:14} }[size];
  return (
    <div style={{ display:"inline-flex", alignItems:"baseline", gap:4, fontFamily:"'Afacad Flux',sans-serif", userSelect:"none", cursor:"pointer" }}>
      <span style={{ fontSize:s.fs, fontWeight:800, letterSpacing:"-0.5px" }}>
        <span style={{ color: onDark ? "rgba(255,255,255,0.9)" : "var(--text-primary)" }}>EVERY</span>
        <span style={{ color:"#4A90D9" }}>WHERE</span>
      </span>
      <span style={{ fontSize:s.sub, fontWeight:300, letterSpacing:"3px", textTransform:"uppercase", color:"#F5C642", marginLeft:3 }}>STUDIO</span>
      <span style={{ fontSize:s.sub*0.72, color: onDark ? "rgba(255,255,255,0.25)" : "var(--text-muted)" }}>™</span>
    </div>
  );
};
export default Logo;
