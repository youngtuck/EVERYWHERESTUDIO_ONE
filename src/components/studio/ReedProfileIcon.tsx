/**
 * Reed mark: bust-in-silhouette side profile (same visual idea as 👤), facing right, cornflower fill.
 */
const FILL = "#4A90D9";

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
      {/* Shoulder → back of head → crown → face/nose → chin → neck → shoulder (smooth C curves) */}
      <path
        d="M 2.75 22.25 L 2.75 20.1 C 2.75 18.3 4.1 17.2 6 16.65 C 7.9 16.1 9.45 15.15 9.75 13.25 C 10.05 11.1 9.1 9.55 7.8 8.55 C 6.5 7.55 6.75 5.85 8.4 4.75 C 10.3 3.5 13.05 3.25 15.6 3.75 C 18.2 4.25 20.1 6.35 20.45 9.05 C 20.8 11.75 19.65 14.2 17.55 15.45 C 15.45 16.7 12.85 17 10.65 16.75 C 8.45 16.5 6.45 17.1 5.35 18.4 C 4.25 19.7 3.95 21.05 3.95 22.25 Z"
        fill={FILL}
      />
    </svg>
  );
}
