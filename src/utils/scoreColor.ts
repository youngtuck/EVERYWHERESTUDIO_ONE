export function getScoreColor(score: number | null): { text: string; bg: string; fill: string } {
  if (!score) return { text: "var(--text-tertiary)", bg: "rgba(0,0,0,0.04)", fill: "rgba(0,0,0,0.15)" };
  if (score >= 900) return { text: "#50c8a0", bg: "rgba(80,200,160,0.1)", fill: "#50c8a0" };
  if (score >= 700) return { text: "#C8961A", bg: "rgba(200,150,26,0.1)", fill: "#C8961A" };
  return { text: "var(--text-tertiary)", bg: "rgba(0,0,0,0.04)", fill: "rgba(0,0,0,0.15)" };
}
