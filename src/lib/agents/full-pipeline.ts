import { runGatePipeline } from "./gate-pipeline";
import { scoreBetterish } from "./betterish-scorer";
import { runWrapPipeline } from "./wrap-pipeline";
import { runAgent } from "./agent-runner";
import { PIPELINE_CONFIG } from "./config";
import type { PipelineContext, PipelineResult, GateResult } from "./types";

export async function runFullPipeline(
  rawDraft: string,
  context: PipelineContext,
  callbacks?: {
    onStageStart?: (stage: string) => void;
    onGateComplete?: (result: GateResult, index: number) => void;
    onStageComplete?: (stage: string) => void;
  }
): Promise<PipelineResult> {
  const startTime = Date.now();
  const runId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  callbacks?.onStageStart?.("checkpoints");

  const gateResult = await runGatePipeline(rawDraft, context, callbacks?.onGateComplete);

  callbacks?.onStageComplete?.("checkpoints");

  if (gateResult.status === "BLOCKED") {
    return {
      status: "BLOCKED",
      finalDraft: gateResult.currentDraft,
      originalDraft: rawDraft,
      gateResults: gateResult.results,
      betterishScore: null,
      wrapApplied: false,
      qaResult: null,
      completenessResult: null,
      blockedAt: gateResult.blockedAt,
      totalDurationMs: Date.now() - startTime,
      runId,
    };
  }

  callbacks?.onStageStart?.("betterish");
  const betterishScore = await scoreBetterish(gateResult.currentDraft, context);
  callbacks?.onStageComplete?.("betterish");

  if (betterishScore.total < PIPELINE_CONFIG.betterishThreshold) {
    return {
      status: "BLOCKED",
      finalDraft: gateResult.currentDraft,
      originalDraft: rawDraft,
      gateResults: gateResult.results,
      betterishScore,
      wrapApplied: false,
      qaResult: null,
      completenessResult: null,
      blockedAt: `Betterish (${betterishScore.total}/${PIPELINE_CONFIG.betterishThreshold} required)`,
      totalDurationMs: Date.now() - startTime,
      runId,
    };
  }

  callbacks?.onStageStart?.("wrap");
  const wrapResult = await runWrapPipeline(gateResult.currentDraft, context);
  callbacks?.onStageComplete?.("wrap");

  callbacks?.onStageStart?.("qa");
  const qaResult = await runAgent(
    "alex-sterling-qa.md",
    "QA: Alex",
    wrapResult.finalDraft,
    context
  );

  const completenessResult = await runAgent(
    "charlie-completeness.md",
    "Completeness: Charlie",
    wrapResult.finalDraft,
    context
  );
  callbacks?.onStageComplete?.("qa");

  if (completenessResult.status === "FAIL") {
    return {
      status: "BLOCKED",
      finalDraft: wrapResult.finalDraft,
      originalDraft: rawDraft,
      gateResults: [...gateResult.results, ...wrapResult.results],
      betterishScore,
      wrapApplied: true,
      qaResult,
      completenessResult,
      blockedAt: "Charlie (Completeness)",
      totalDurationMs: Date.now() - startTime,
      runId,
    };
  }

  return {
    status: "PASSED",
    finalDraft: wrapResult.finalDraft,
    originalDraft: rawDraft,
    gateResults: [...gateResult.results, ...wrapResult.results],
    betterishScore,
    wrapApplied: true,
    qaResult,
    completenessResult,
    totalDurationMs: Date.now() - startTime,
    runId,
  };
}

