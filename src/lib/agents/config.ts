export const PIPELINE_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokensPerGate: 8192,
  maxTokensForBetterish: 4096,
  maxTokensForWrap: 8192,
  betterishThreshold: 900, // Must match MARKETING_NUMBERS.betterishThreshold in src/lib/constants.ts
  maxAutoFixAttempts: 1,
} as const;

export const GATE_DEFINITIONS = [
  {
    id: "gate-0",
    name: "Echo",
    label: "Deduplication",
    promptFile: "gate-0-echo.md",
    blocking: true,
    description: "Catches repetition of concepts, phrases, and structural patterns.",
  },
  {
    id: "gate-1",
    name: "Priya",
    label: "Research",
    promptFile: "gate-1-priya.md",
    blocking: true,
    description: "Verifies every claim. Minimum 8 sources for long-form.",
  },
  {
    id: "gate-2",
    name: "Jordan",
    label: "Voice DNA",
    promptFile: "gate-2-jordan.md",
    blocking: true,
    description: "Content must match Voice DNA above 95 percent. Zero AI language patterns.",
  },
  {
    id: "gate-3",
    name: "David",
    label: "Hook & Engagement",
    promptFile: "gate-3-david.md",
    blocking: true,
    description: "7 second hook test. Clear stakes. Three to five quotable moments.",
  },
  {
    id: "gate-4",
    name: "Elena",
    label: "SLOP + AI Tells",
    promptFile: "gate-4-elena.md",
    blocking: true,
    description: "Zero tolerance for Superfluity, Loops, Overwrought prose, Pretension.",
  },
  {
    id: "gate-5",
    name: "Natasha",
    label: "Editorial + Stranger Test",
    promptFile: "gate-5-natasha.md",
    blocking: true,
    description: "Publication grade quality. All terms explained for cold readers.",
  },
  {
    id: "gate-6",
    name: "Marcus + Marshall",
    label: "Perspective + NVC",
    promptFile: "gate-6-perspective.md",
    blocking: true,
    description: "Cultural sensitivity. Blind spots. Challenges without alienating.",
  },
] as const;

export const WRAP_AGENTS = [
  { id: "byron", name: "Byron", label: "Humanization", promptFile: "byron-humanize.md" },
  { id: "mira", name: "Mira", label: "Format", promptFile: "mira-format.md" },
  { id: "dmitri", name: "Dmitri", label: "Platform", promptFile: "dmitri-platform.md" },
] as const;

/** Map of agent keys to prompt filenames for agent-runner.ts (e.g. sara-routing, watson-capture). */
export const AGENT_PROMPTS: Record<string, string> = {
  "sara-routing": "sara-routing.md",
  "watson-capture": "watson-capture.md",
  "sentinel-intel": "sentinel-intel.md",
  scout: "scout.md",
};
