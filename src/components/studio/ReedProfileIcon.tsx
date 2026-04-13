/**
 * Side-profile mark for Reed (conversation UI). Right-facing head silhouette, bold stroke, cornflower outline.
 */
const STROKE = "#4A90D9";

export function ReedProfileIcon({ size = 22, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* Neck base → throat / jaw → chin → lip notch → nose → brow → crown → back of head → nape → neck */}
      <path
        d="M 4.25 20.5
           H 14.75
           C 15.6 20.5 16.35 20.05 16.75 19.25
           L 18.1 15.5
           C 18.75 13.75 18.8 11.85 18.2 10.05
           L 17.75 8.65
           C 17.45 7.55 17.7 6.35 18.5 5.45
           L 19.85 3.65
           C 20.65 2.55 20.15 1.45 18.95 1.15
           C 15.9 0.45 12.55 1.05 10.35 3.05
           L 8.85 4.85
           C 7.1 7.2 6.35 10.05 6.45 12.95
           L 6.55 17.85
           C 6.58 18.95 6.35 20.05 5.6 20.75
           L 4.85 20.95
           L 4.25 20.5
           Z"
        fill="none"
        stroke={STROKE}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
