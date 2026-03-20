import { useTheme } from "../context/ThemeContext";

interface LogoProps {
  size?: "sm" | "md" | "lg" | number;
  /** @deprecated Prefer `variant="dark" | "light"` going forward. */
  onDark?: boolean;
  variant?: "dark" | "light";
  onClick?: () => void;
}

const SIZE_MAP = { sm: 20, md: 28, lg: 42 } as const;
const TM_MAP = { sm: 10, md: 14, lg: 22 } as const;

const Logo = ({ size = "md", onDark, variant, onClick }: LogoProps) => {
  const { theme } = useTheme();

  const isDark = variant
    ? variant === "dark"
    : onDark !== undefined
      ? onDark
      : theme === "dark";

  // Map named sizes; numeric sizes interpolate TM proportionally
  const fs = typeof size === "number"
    ? size
    : SIZE_MAP[size];

  const tmFs = typeof size === "number"
    ? Math.round(size * 0.52)
    : TM_MAP[size];

  const studioColor = isDark ? "#F5C642" : "#0D1B2A";

  return (
    <span
      style={{
        letterSpacing: "-1px",
        fontFamily: "'Afacad Flux', sans-serif",
        display: "inline-flex",
        alignItems: "baseline",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      onClick={onClick}
    >
      <span style={{ color: "#4A90D9", fontWeight: 700, fontSize: fs, lineHeight: 1, textTransform: "uppercase" }}>
        EVERYWHERE
      </span>
      <span style={{ color: studioColor, fontWeight: 300, fontSize: fs, lineHeight: 1, textTransform: "uppercase" }}>
        STUDIO
        <span style={{ color: studioColor, fontSize: tmFs, verticalAlign: "top", marginLeft: 2 }}>™</span>
      </span>
    </span>
  );
};

export default Logo;
