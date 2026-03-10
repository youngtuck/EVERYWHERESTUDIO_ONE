export function getScoreColor(score: number | null): { text: string; bg: string; fill: string } {
  if (!score) return { text: "var(--text-tertiary)", bg: "rgba(0,0,0,0.04)", fill: "rgba(0,0,0,0.15)" };
  if (score >= 800) return { text: "#0D8C9E", bg: "rgba(13,140,158,0.1)", fill: "#0D8C9E" };
  if (score >= 600) return { text: "#C8961A", bg: "rgba(200,150,26,0.1)", fill: "#C8961A" };
  return { text: "var(--text-tertiary)", bg: "rgba(0,0,0,0.04)", fill: "rgba(0,0,0,0.15)" };
}
