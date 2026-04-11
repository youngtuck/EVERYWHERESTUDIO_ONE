/**
 * Side-profile mark for Reed (conversation UI). Line silhouette suggesting someone speaking, not an emoji.
 */
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
      {/* Facing right: crown, nose, slightly open mouth, chin, neck */}
      <path
        d="M10.2 3.25c2.35-.45 4.55.85 5.45 3.05.28.68.32 1.38.14 2.02.92.42 1.58 1.22 1.78 2.22.28 1.45-.32 2.85-1.48 3.55.08.95-.22 1.85-.82 2.48-.62.65-1.48.98-2.38.92l-4.85-.95c-1.35-.26-2.28-1.35-2.52-2.72l-.35-6.1c.22-2.05 1.62-3.72 3.53-4.47z"
        fill="rgba(74, 144, 217, 0.14)"
        stroke="rgba(74, 144, 217, 0.44)"
        strokeWidth="1.05"
        strokeLinejoin="round"
      />
      <path
        d="M15.35 11.15c.55.18 1.05.62 1.22 1.18"
        stroke="rgba(74, 144, 217, 0.5)"
        strokeWidth="0.95"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.05 12.35q.65.52.35 1.05"
        stroke="rgba(74, 144, 217, 0.42)"
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
