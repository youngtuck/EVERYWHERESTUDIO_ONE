interface LogoProps {
  size?: "sm" | "md" | "lg" | number;
  /** @deprecated Prefer `variant="dark" | "light"` going forward. */
  onDark?: boolean;
  variant?: "dark" | "light";
  onClick?: () => void;
}

const Logo = ({ size = "md", onDark, variant, onClick }: LogoProps) => {
  const isDark = variant ? variant === "dark" : !!onDark;

  const fs = typeof size === "number"
    ? size
    : { sm: 13, md: 15, lg: 22 }[size];

  const studioFs = fs * 0.65;
  const tmFs = studioFs * 0.24;
  const studioColor = isDark ? "#F5C642" : "#0D1B2A";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: "'Afacad Flux', sans-serif",
        userSelect: "none",
        letterSpacing: "-2px",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
      onClick={onClick}
    >
      <span style={{ fontSize: fs, fontWeight: 700, color: "#4A90D9", textTransform: "uppercase" }}>
        EVERYWHERE
      </span>
      <span style={{ width: fs * 0.25 }} />
      <span style={{ fontSize: studioFs, fontWeight: 300, color: studioColor, textTransform: "uppercase", letterSpacing: "-2px" }}>
        STUDIO
      </span>
      <sup style={{ fontSize: Math.max(tmFs, 5), fontWeight: 300, color: studioColor, marginLeft: 1, lineHeight: 1 }}>
        ™
      </sup>
    </div>
  );
};

export default Logo;
