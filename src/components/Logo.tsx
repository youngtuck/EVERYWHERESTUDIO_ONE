interface LogoProps { size?: "sm"|"md"|"lg"; onDark?: boolean; }
const Logo = ({ size = "md", onDark = false }: LogoProps) => {
  const s = { sm:{fs:13,sub:8.5}, md:{fs:15,sub:10}, lg:{fs:22,sub:13.5} }[size];
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:2, fontFamily:"'DM Sans',sans-serif", userSelect:"none", letterSpacing:"-0.03em" }}>
      <span style={{ fontSize:s.fs, fontWeight:600 }}>
        <span style={{ color: onDark ? "rgba(255,255,255,0.88)" : "var(--fg)" }}>Every</span>
        <span style={{ color:"#3A7BD5" }}>where</span>
      </span>
      <span style={{ fontSize:s.sub, fontWeight:400, letterSpacing:"0.08em", textTransform:"uppercase", color: onDark ? "rgba(255,255,255,0.28)" : "var(--fg-3)", marginLeft:6, fontVariant:"small-caps" }}>Studio</span>
    </div>
  );
};
export default Logo;
