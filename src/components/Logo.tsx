interface LogoProps {
  size?: "sm" | "md" | "lg" | number;
  /** @deprecated Prefer `variant="dark" | "light"` going forward. */
  onDark?: boolean;
  variant?: "dark" | "light";
  onClick?: () => void;
  showTM?: boolean;
}

const Logo = ({ size = "md", onDark, variant, onClick, showTM = false }: LogoProps) => {
  const isDark = variant ? variant === "dark" : !!onDark;

  const preset = typeof size === "number"
    ? { fs: size, sub: size * 0.6 }
    : { sm: { fs: 13, sub: 8.5 }, md: { fs: 15, sub: 10 }, lg: { fs: 22, sub: 13.5 } }[size];

  const numericSize = typeof size === "number" ? size : preset.fs;

  const styles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 2,
    fontFamily: "'Afacad Flux', sans-serif",
    userSelect: "none",
    letterSpacing: "-1px",
    cursor: onClick ? "pointer" : "default",
  };

  return (
    <div style={styles} onClick={onClick}>
      <span style={{ fontSize: preset.fs, fontWeight: 700, color: "#4A90D9" }}>
        EVERYWHERE
      </span>
      <span
        style={{
          fontSize: preset.sub,
          fontWeight: 300,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: isDark ? "#F5C642" : "#0D1B2A",
          marginLeft: 6,
        }}
      >
        Studio
      </span>
      {showTM && numericSize >= 24 && (
        <span style={{ fontSize: "0.52em", verticalAlign: "super", color: isDark ? "#F5C642" : "#0D1B2A", fontWeight: 300 }}>
          TM
        </span>
      )}
    </div>
  );
};

export default Logo;
