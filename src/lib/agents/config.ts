export const PIPELINE_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokensPerGate: 8192,
  maxTokensForImpact: 4096,
  maxTokensForWrap: 8192,
  impactThreshold: 75, // Must match MARKETING_NUMBERS.impactThreshold in src/lib/constants.ts
  maxAutoFixAttempts: 1,
} as const;

export const GATE_DEFINITIONS = [
  {
    id: "gate-0",
    name: "Deduplication",
    label: "Deduplication",
    promptFile: "gate-0-echo.md",
    blocking: true,
    description: "Catches repetition of concepts, phrases, and structural patterns.",
  },
  {
    id: "gate-1",
    name: "Research Validation",
    label: "Research",
    promptFile: "gate-1-priya.md",
    blocking: true,
    description: "Verifies every claim. Minimum 8 sources for long-form.",
  },
  {
    id: "gate-2",
    name: "Voice Authenticity",
    label: "Voice DNA",
    promptFile: "gate-2-jordan.md",
    blocking: true,
    description: "Content must match Voice DNA above 95 percent. Zero AI language patterns.",
  },
  {
    id: "gate-3",
    name: "Engagement Optimization",
    label: "Hook & Engagement",
    promptFile: "gate-3-david.md",
    blocking: true,
    description: "7 second hook test. Clear stakes. Three to five quotable moments.",
  },
  {
    id: "gate-4",
    name: "SLOP Detection",
    label: "SLOP + AI Tells",
    promptFile: "gate-4-elena.md",
    blocking: true,
    description: "Zero tolerance for Superfluity, Loops, Overwrought prose, Pretension.",
  },
  {
    id: "gate-5",
    name: "Editorial Excellence",
    label: "Editorial + Stranger Test",
    promptFile: "gate-5-natasha.md",
    blocking: true,
    description: "Publication grade quality. All terms explained for cold readers.",
  },
  {
    id: "gate-6",
    name: "Perspective & Risk",
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

/** Map of agent keys to prompt filenames for agent-runner.ts (e.g. sara-routing, reed-capture). */
export const AGENT_PROMPTS: Record<string, string> = {
  "sara-routing": "sara-routing.md",
  "reed-capture": "reed-capture.md",
  "sentinel-intel": "sentinel-intel.md",
  scout: "scout.md",
};

/**
 * Per-output-type locked checkpoints.
 * These checkpoints cannot be disabled in templates for the given output type.
 * Human Voice Test is always locked on for ALL types (enforced separately).
 */
export const LOCKED_CHECKPOINTS_BY_TYPE: Record<string, string[]> = {
  essay: ["gate-0", "gate-1", "gate-2", "gate-3", "gate-4", "gate-5", "gate-6"],
  video_script: ["gate-3"], // Hook check locked on, hard-blocks if fails
  newsletter: ["gate-4"],   // Spam/SLOP locked on
  email: ["gate-2", "gate-4"], // Voice + SLOP locked on
  one_pager: ["gate-4"],    // SLOP locked on
  report: ["gate-1"],       // Research locked on
  white_paper: ["gate-6"],  // Perspective locked on
  social_media: ["gate-3"], // Engagement/Interest Graph locked on
};

/**
 * Project output types: these create project containers.
 */
export const PROJECT_OUTPUT_TYPES = ["book", "website_content", "newsletter", "social_media"] as const;
