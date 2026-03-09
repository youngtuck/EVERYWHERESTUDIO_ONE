/**
 * EVERYWHERE STUDIO™ — Official wordmark component
 * Spec: Mixed Grill, LLC · v2.0 · March 8, 2026
 * Use this component for the approved "EVERYWHERE STUDIO™" lockup site-wide.
 * See docs/WORDMARK.md for full reference.
 */

export type WordmarkVariant = "fullColor" | "bwDark" | "bwLight";
export type WordmarkSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<WordmarkSize, { base: number; tm: number }> = {
  xs: { base: 14, tm: 10 },
  sm: { base: 20, tm: 14 },
  md: { base: 32, tm: 22 },
  lg: { base: 48, tm: 34 },
  xl: { base: 64, tm: 45 },
};

export interface EverywhereWordmarkProps {
  variant?: WordmarkVariant;
  size?: WordmarkSize;
  className?: string;
  style?: React.CSSProperties;
}

export default function EverywhereWordmark({
  variant = "fullColor",
  size = "md",
  className,
  style,
}: EverywhereWordmarkProps) {
  const { base, tm } = SIZES[size];

  const everyWhereColor =
    variant === "fullColor" ? "#4A90D9" : variant === "bwDark" ? "#FFFFFF" : "#1A1A1A";
  const studioColor =
    variant === "fullColor" ? "#F5C642" : variant === "bwDark" ? "#FFFFFF" : "#1A1A1A";

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        letterSpacing: "-1px",
        fontFamily: "'Afacad Flux', sans-serif",
        lineHeight: 1,
        textTransform: "uppercase",
        ...style,
      }}
      aria-label="EVERYWHERE STUDIO"
    >
      <span
        style={{
          color: everyWhereColor,
          fontWeight: 700,
          fontSize: base,
        }}
      >
        EVERYWHERE
      </span>
      <span
        style={{
          color: studioColor,
          fontWeight: 300,
          fontSize: base,
        }}
      >
        STUDIO
        <span
          style={{
            color: studioColor,
            fontSize: tm,
            verticalAlign: "top",
            marginLeft: 2,
          }}
        >
          ™
        </span>
      </span>
    </span>
  );
}
