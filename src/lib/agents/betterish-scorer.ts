import { supabase } from "../supabase";
import { PIPELINE_CONFIG } from "./config";
import type { BetterishScore, PipelineContext } from "./types";
import { PROMPTS } from "./prompts/index";

function loadBetterishPrompt(): string {
  return PROMPTS["betterish.md"];
}

export async function scoreBetterish(
  draft: string,
  context: PipelineContext
): Promise<BetterishScore> {
  const systemPrompt = await loadBetterishPrompt();

  const userMessage = [
    `Score this ${context.outputType} on a 0-1000 scale.`,
    "Return ONLY valid JSON matching the structure in your instructions.",
    "",
    "USER VOICE DNA:",
    context.voiceDnaMd || "(not provided)",
    "",
    `OUTPUT TYPE: ${context.outputType}`,
    context.targetPlatform ? `TARGET PLATFORM: ${context.targetPlatform}` : "",
    "",
    "CONTENT TO SCORE:",
    draft,
  ].join("\n");

  const { data, error } = await supabase.functions.invoke("claude-agent", {
    body: {
      model: PIPELINE_CONFIG.model,
      maxTokens: PIPELINE_CONFIG.maxTokensForBetterish,
      systemPrompt,
      userMessage,
    },
  });

  if (error || !data?.text) {
    return {
      total: 0,
      breakdown: {
        voiceAuthenticity: 0,
        researchDepth: 0,
        hookStrength: 0,
        slopScore: 0,
        editorialQuality: 0,
        perspective: 0,
        engagement: 0,
        platformFit: 0,
        strategicValue: 0,
        nvcCompliance: 0,
      },
      verdict: "REJECT",
      topIssue: "Scoring failed: no response from scoring agent.",
      gutCheck: "Unable to score.",
    };
  }

  try {
    const cleaned = (data.text as string).replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const total = parsed.total || parsed.totalScore || 0;
      let verdict: BetterishScore["verdict"] = "REJECT";
      if (total >= PIPELINE_CONFIG.betterishThreshold) verdict = "PUBLISH";
      else if (total >= 600) verdict = "REVISE";

      return {
        total,
        breakdown: parsed.breakdown || {
          voiceAuthenticity: 0,
          researchDepth: 0,
          hookStrength: 0,
          slopScore: 0,
          editorialQuality: 0,
          perspective: 0,
          engagement: 0,
          platformFit: 0,
          strategicValue: 0,
          nvcCompliance: 0,
        },
        verdict,
        topIssue: parsed.topIssue || "",
        gutCheck: parsed.gutCheck || "",
      };
    }
  } catch {
    // fall through to REJECT
  }

  return {
    total: 0,
    breakdown: {
      voiceAuthenticity: 0,
      researchDepth: 0,
      hookStrength: 0,
      slopScore: 0,
      editorialQuality: 0,
      perspective: 0,
      engagement: 0,
      platformFit: 0,
      strategicValue: 0,
      nvcCompliance: 0,
    },
    verdict: "REJECT",
    topIssue: "Scoring response could not be parsed.",
    gutCheck: "Unable to score.",
  };
}

