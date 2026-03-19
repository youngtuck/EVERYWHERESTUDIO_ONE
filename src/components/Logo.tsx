import { useTheme } from "../context/ThemeContext";

interface LogoProps {
  size?: "sm" | "md" | "lg" | number;
  /** @deprecated Prefer `variant="dark" | "light"` going forward. */
  onDark?: boolean;
  variant?: "dark" | "light";
  onClick?: () => void;
}

const Logo = ({ size = "md", onDark, variant, onClick }: LogoProps) => {
  const { theme } = useTheme();

  // If variant is explicitly set, use it. Otherwise auto-detect from theme.
  const isDark = variant
    ? variant === "dark"
    : onDark !== undefined
      ? onDark
      : theme === "dark";

  const fs = typeof size === "number"
    ? size
    : { sm: 13, md: 15, lg: 22 }[size];

  const studioFs = fs * 0.65;
  const studioColor = isDark ? "#F5C642" : "#0D1B2A";
  const gap = Math.max(2, Math.round(fs * 0.15));
  const showTM = fs >= 16;
  const tmFs = studioFs * 0.5;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: "'Afacad Flux', sans-serif",
        userSelect: "none",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
      onClick={onClick}
    >
      <span style={{
        fontSize: fs,
        fontWeight: 700,
        color: "#4A90D9",
        textTransform: "uppercase",
        letterSpacing: "-0.02em",
      }}>
        EVERYWHERE
      </span>
      <span style={{
        fontSize: studioFs,
        fontWeight: 300,
        color: studioColor,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginLeft: gap,
      }}>
        STUDIO
      </span>
      {showTM && (
        <sup style={{
          fontSize: tmFs,
          fontWeight: 300,
          color: studioColor,
          marginLeft: 1,
          lineHeight: 1,
          verticalAlign: "super",
        }}>
          ™
        </sup>
      )}
    </div>
  );
};

export default Logo;
