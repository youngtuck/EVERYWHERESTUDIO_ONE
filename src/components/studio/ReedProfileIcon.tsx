/**
 * Side-profile mark for Reed (conversation UI). Right-facing head silhouette, stroke only.
 */
const STROKE = "rgba(74, 144, 217, 0.68)";

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
      {/* Nape → back of head → crown → forehead → nose tip → upper lip → chin → jaw → nape */}
      <path
        d="M 8.45 19.4
           C 7.05 18.85 6.1 17.45 5.9 15.85
           C 5.65 13.75 6.35 11.65 7.85 10.1
           C 9.55 8.35 12.1 7.45 14.65 7.55
           C 16.9 7.7 18.75 9.15 19.35 11.25
           C 19.85 12.95 19.75 13.85 19.05 14.85
           C 19.55 15.35 19.85 16.15 19.45 16.95
           C 18.95 17.85 17.75 18.05 16.85 17.55
           C 15.1 18.85 12.85 19.55 10.5 19.5
           C 9.55 19.48 8.85 19.25 8.45 19.4 Z"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
