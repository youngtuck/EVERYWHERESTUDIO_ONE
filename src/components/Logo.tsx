type LogoProps = { size?: "sm" | "md" | "lg"; dark?: boolean };

const Logo = ({ size = "md", dark = false }: LogoProps) => {
  const sizes = { sm: { main: 14, sub: 10, gap: 5 }, md: { main: 18, sub: 12, gap: 6 }, lg: { main: 24, sub: 15, gap: 8 } };
  const s = sizes[size];
  const isOnDark = !dark;

  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: s.gap, fontFamily: "'Afacad Flux', sans-serif", userSelect: "none" }}>
      <span style={{ fontSize: s.main, fontWeight: 800, letterSpacing: "-0.5px", color: isOnDark ? "#ffffff" : "#0A0A0A" }}>
        EVERY<span style={{ color: "#4A90D9" }}>WHERE</span>
      </span>
      <span style={{ fontSize: s.sub, fontWeight: 300, letterSpacing: "3px", textTransform: "uppercase", color: "#F5C642" }}>
        STUDIO
      </span>
      <span style={{ fontSize: s.sub * 0.7, color: isOnDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontWeight: 400 }}>™</span>
    </div>
  );
};

export default Logo;
