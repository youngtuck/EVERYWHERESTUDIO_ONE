/**
 * Shared Voice / Brand / Method DNA context limits (character budgets).
 * Keeps pipeline, Wrap adapt, and auxiliary routes aligned.
 */

export const DNA_LIMITS = {
  /** Quality checkpoints + HVT user messages (draft is separate) */
  pipeline: { voice: 4500, brand: 2800, method: 4000 },
  /** Wrap channel adaptation system prompt */
  adapt: { voice: 4500, brand: 2800, method: 4000 },
  /** Outline, Writer's Room angles, beat sheet */
  auxiliary: { voice: 3500, brand: 2200, method: 3200 },
  /** Primary generation: soft ceiling only (protect runaway pastes) */
  generate: { voice: 14000, brand: 10000, method: 14000 },
  /** Reed chat system prompt DNA blocks */
  reed: { voice: 10000, brand: 6000, method: 8000, references: 5000 },
};

/**
 * @param {string} [text]
 * @param {number} maxLen
 * @returns {string}
 */
export function clipDna(text, maxLen) {
  if (!text || !maxLen) return "";
  const t = String(text).trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}\n\n[DNA context truncated for model budget]`;
}
