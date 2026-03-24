import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { callWithRetry } from "./_retry.js";

const GATE_FILES = [
  { name: "Echo", file: "gate-0-echo.md", label: "Deduplication" },
  { name: "Priya", file: "gate-1-priya.md", label: "Research" },
  { name: "Jordan", file: "gate-2-jordan.md", label: "Voice DNA" },
  { name: "David", file: "gate-3-david.md", label: "Engagement" },
  { name: "Elena", file: "gate-4-elena.md", label: "SLOP Detection" },
  { name: "Natasha", file: "gate-5-natasha.md", label: "Editorial" },
  { name: "Marcus + Marshall", file: "gate-6-perspective.md", label: "Perspective" },
];

// Prompt loading with detailed error reporting
function loadPrompt(filename) {
  const paths = [
    path.join(process.cwd(), "src", "lib", "agents", "prompts", filename),
    path.join("/var/task", "src", "lib", "agents", "prompts", filename),
  ];
  if (typeof __dirname !== "undefined") {
    paths.push(path.join(__dirname, "..", "src", "lib", "agents", "prompts", filename));
  }
  for (const p of paths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      if (content) return content;
    } catch {}
  }
  console.error(`[run-pipeline] PROMPT NOT FOUND: ${filename}. Tried: ${paths.join(", ")}`);
  return null;
}

const promptCache = {};
function getPrompt(filename) {
  if (!promptCache[filename]) {
    promptCache[filename] = loadPrompt(filename);
  }
  return promptCache[filename];
}

function parseGateResponse(text) {
  let status = "PASS";
  let score = 75;
  let feedback = text || "";
  let issues = [];

  // Try JSON first
  try {
    const cleaned = (text || "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.status) {
        const s = String(parsed.status).toUpperCase();
        status = s === "PASS" ? "PASS" : (s === "FAIL" || s.includes("BLOCK")) ? "FAIL" : "FLAG";
      }
      if (typeof parsed.score === "number") score = Math.min(100, Math.max(0, parsed.score));
      if (parsed.feedback) feedback = String(parsed.feedback).slice(0, 500);
      if (Array.isArray(parsed.issues)) issues = parsed.issues.map(String).slice(0, 10);
      if (status === "FAIL") score = Math.min(score, 50);
      return { status, score, feedback, issues };
    }
  } catch {}

  // Regex fallback
  const statusMatch = (text || "").match(/STATUS:\s*(PASS|FAIL|FLAG|REVISE|AUTOMATIC BLOCK|BLOCKED|BLOCK|CLEAR)/i)
    || (text || "").match(/CHECKPOINT\s*\d+\s*STATUS:\s*(PASS|FAIL|FLAG|REVISE|AUTOMATIC BLOCK|BLOCKED|CLEAR)/i);
  if (statusMatch) {
    const s = statusMatch[1].toUpperCase();
    status = (s === "PASS" || s === "CLEAR") ? "PASS" : (s === "FAIL" || s.includes("BLOCK")) ? "FAIL" : "FLAG";
  }

  const scoreMatch = (text || "").match(/SCORE:\s*(\d+)/i) || (text || "").match(/(\d+)\/100/);
  if (scoreMatch) score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));

  const lines = (text || "").split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("|"));
  feedback = lines.slice(0, 5).join("\n").trim().slice(0, 500);
  if (status === "FAIL") score = Math.min(score, 50);
  return { status, score, feedback, issues };
}

function parseBetterishResponse(text) {
  const emptyBreakdown = {
    voiceAuthenticity: 0, researchDepth: 0, hookStrength: 0, slopScore: 0,
    editorialQuality: 0, perspective: 0, engagement: 0, platformFit: 0,
    strategicValue: 0, nvcCompliance: 0,
  };

  // Try JSON first
  try {
    const cleaned = (text || "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const total = parsed.total || parsed.totalScore || 0;
      const verdict = parsed.verdict
        ? String(parsed.verdict).toUpperCase()
        : total >= 900 ? "PUBLISH" : total >= 600 ? "REVISE" : "REJECT";
      return {
        total,
        verdict,
        breakdown: parsed.breakdown || emptyBreakdown,
        topIssue: parsed.topIssue || "",
        gutCheck: parsed.gutCheck || "",
      };
    }
  } catch {}

  // Regex fallback
  let total = 0;
  const totalMatch = (text || "").match(/TOTAL:\s*(\d+)/i) || (text || "").match(/composite.*?(\d{3,4})/i);
  if (totalMatch) total = Math.min(1000, Math.max(0, parseInt(totalMatch[1])));
  const verdict = total >= 900 ? "PUBLISH" : total >= 600 ? "REVISE" : "REJECT";
  return { total, verdict, breakdown: emptyBreakdown, topIssue: "", gutCheck: "" };
}

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { draft, outputType, voiceDnaMd, brandDnaMd, methodDnaMd, userId, outputId, gateSubset } = req.body || {};
  if (!draft) return res.status(400).json({ error: "draft is required" });

  // If gateSubset is provided, only run those specific gates (for Layer 2 runs)
  const gatesToRun = gateSubset && Array.isArray(gateSubset)
    ? GATE_FILES.filter(g => gateSubset.includes(g.name))
    : GATE_FILES;

  const gateResults = [];
  let betterishScore = { total: 0, verdict: "REJECT", breakdown: { voiceAuthenticity: 0, researchDepth: 0, hookStrength: 0, slopScore: 0, editorialQuality: 0, perspective: 0, engagement: 0, platformFit: 0, strategicValue: 0, nvcCompliance: 0 }, topIssue: "", gutCheck: "" };
  let currentDraft = draft;
  let blockedAt = null;
  const startTime = Date.now();

  try {
    const client = new Anthropic({ apiKey });
    const model = "claude-sonnet-4-20250514";

    console.log(`[run-pipeline] Starting for output ${outputId}`);

    // runGate is defined HERE inside the handler so it has closure access
    // to client, model, currentDraft, outputType, voiceDnaMd, brandDnaMd
    async function runGate(gate, index) {
      const prompt = getPrompt(gate.file);
      if (!prompt) {
        return {
          gate: gate.name,
          status: "FLAG",
          score: 0,
          feedback: `Prompt file ${gate.file} could not be loaded from the serverless filesystem.`,
          issues: ["PROMPT_NOT_LOADED"],
        };
      }

      const userMessage = [
        "Evaluate this draft. Return ONLY valid JSON matching this structure:",
        '{ "status": "PASS" or "FAIL", "score": 0-100, "feedback": "specific issues or why it passed", "issues": ["list", "of", "problems"] }',
        "",
        "Do not include any text outside the JSON object.",
        "",
        `OUTPUT TYPE: ${outputType || "essay"}`,
        voiceDnaMd ? `VOICE DNA:\n${voiceDnaMd.slice(0, 2000)}` : "",
        brandDnaMd ? `BRAND DNA:\n${brandDnaMd.slice(0, 1000)}` : "",
        `\nCONTENT TO EVALUATE:\n\n${currentDraft}`,
      ].filter(Boolean).join("\n\n");

      try {
        console.log(`[run-pipeline] Gate ${index}: ${gate.name} - calling API`);
        const response = await callWithRetry(() =>
          client.messages.create({
            model,
            max_tokens: 4096,
            system: prompt,
            messages: [{ role: "user", content: userMessage }],
          }),
          1
        );
        const text = response.content[0]?.type === "text" ? response.content[0].text : "";
        console.log(`[run-pipeline] Gate ${index}: ${gate.name} - got response (${text.length} chars)`);
        const parsed = parseGateResponse(text);
        return { ...parsed, gate: gate.name };
      } catch (err) {
        console.error(`[run-pipeline] Gate ${index} (${gate.name}) API ERROR:`, err.message, err.status || "");
        return {
          gate: gate.name,
          status: "FLAG",
          score: 0,
          feedback: `API call failed: ${err.message || "Unknown error"}`,
          issues: ["API_ERROR"],
        };
      }
    }

    // Split gates into two batches and run in parallel
    const midpoint = Math.ceil(gatesToRun.length / 2);
    const batch1Gates = gatesToRun.slice(0, midpoint);
    const batch2Gates = gatesToRun.slice(midpoint);

    console.log(`[run-pipeline] Batch 1 (${batch1Gates.length} gates): ${batch1Gates.map(g => g.name).join(", ")}`);
    const batch1Results = await Promise.allSettled(
      batch1Gates.map((gate, i) => runGate(gate, i))
    );
    for (const settled of batch1Results) {
      const r = settled.status === "fulfilled"
        ? settled.value
        : { gate: "Unknown", status: "FLAG", score: 0, feedback: `Promise rejected: ${settled.reason}`, issues: ["CRASH"] };
      gateResults.push(r);
      if (r.status === "FAIL" && !blockedAt) blockedAt = r.gate;
    }

    // Time check before batch 2
    const elapsed1 = Date.now() - startTime;
    console.log(`[run-pipeline] Batch 1 done in ${elapsed1}ms`);

    if (elapsed1 > 90000 || batch2Gates.length === 0) {
      if (batch2Gates.length > 0) {
        console.log("[run-pipeline] Time budget critical, skipping batch 2");
        for (const gate of batch2Gates) {
          gateResults.push({ gate: gate.name, status: "FLAG", score: 0, feedback: "Skipped: time budget exceeded.", issues: ["TIME_BUDGET"] });
        }
      }
    } else {
      console.log(`[run-pipeline] Batch 2 (${batch2Gates.length} gates): ${batch2Gates.map(g => g.name).join(", ")}`);
      const batch2Results = await Promise.allSettled(
        batch2Gates.map((gate, i) => runGate(gate, i + midpoint))
      );
      for (const settled of batch2Results) {
        const r = settled.status === "fulfilled"
          ? settled.value
          : { gate: "Unknown", status: "FLAG", score: 0, feedback: `Promise rejected: ${settled.reason}`, issues: ["CRASH"] };
        gateResults.push(r);
        if (r.status === "FAIL" && !blockedAt) blockedAt = r.gate;
      }
    }

    // Betterish scorer
    const elapsed2 = Date.now() - startTime;
    if (elapsed2 < 100000) {
      const betterishPrompt = getPrompt("betterish.md");
      if (betterishPrompt) {
        try {
          console.log("[run-pipeline] Running Betterish scorer");
          const response = await callWithRetry(() =>
            client.messages.create({
              model,
              max_tokens: 4096,
              system: betterishPrompt,
              messages: [{
                role: "user",
                content: [
                  `Score this ${outputType || "essay"} on a 0-1000 scale.`,
                  "Return ONLY valid JSON:",
                  '{ "total": <0-1000>, "verdict": "PUBLISH"/"REVISE"/"REJECT", "breakdown": { "voiceAuthenticity": <0-100>, "researchDepth": <0-100>, "hookStrength": <0-100>, "slopScore": <0-100>, "editorialQuality": <0-100>, "perspective": <0-100>, "engagement": <0-100>, "platformFit": <0-100>, "strategicValue": <0-100>, "nvcCompliance": <0-100> }, "topIssue": "biggest issue", "gutCheck": "one sentence" }',
                  "",
                  "Do not include any text outside the JSON object.",
                  "",
                  `CONTENT TO SCORE:\n\n${currentDraft}`,
                ].join("\n"),
              }],
            }),
            1
          );
          const text = response.content[0]?.type === "text" ? response.content[0].text : "";
          console.log(`[run-pipeline] Betterish response (${text.length} chars)`);
          betterishScore = parseBetterishResponse(text);
        } catch (err) {
          console.error("[run-pipeline] Betterish scorer failed:", err.message);
        }
      } else {
        console.error("[run-pipeline] betterish.md prompt not found");
      }
    } else {
      console.log("[run-pipeline] Skipping Betterish scorer (time budget)");
    }

    const durationMs = Date.now() - startTime;
    const anyFailed = gateResults.some(g => g.status === "FAIL");
    const status = anyFailed ? "BLOCKED" : "PASSED";
    console.log(`[run-pipeline] Done. Status: ${status}, Score: ${betterishScore.total}, Duration: ${durationMs}ms`);

    return res.status(200).json({
      status,
      gateResults,
      betterishScore,
      finalDraft: currentDraft,
      blockedAt,
      totalDurationMs: durationMs,
    });

  } catch (fatalErr) {
    console.error("[run-pipeline] FATAL:", fatalErr.message, fatalErr.stack);
    return res.status(200).json({
      status: "BLOCKED",
      gateResults,
      betterishScore,
      finalDraft: currentDraft || draft,
      blockedAt: blockedAt || `Fatal: ${fatalErr.message}`,
      totalDurationMs: Date.now() - startTime,
    });
  }
}
