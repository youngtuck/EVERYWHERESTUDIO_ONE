/**
 * Quality Pipeline API - runs all 7 gates + Betterish scorer on a draft.
 * POST body: { draft, outputType, voiceDnaMd, brandDnaMd, methodDnaMd, userId, outputId }
 * Returns: { status, gateResults, betterishScore, finalDraft, blockedAt }
 *
 * This replaces the client-side pipeline that relied on Supabase Edge Functions.
 * Each gate runs sequentially using the Anthropic API directly.
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const GATE_FILES = [
  { name: "Echo", file: "gate-0-echo.md", label: "Deduplication" },
  { name: "Priya", file: "gate-1-priya.md", label: "Research" },
  { name: "Jordan", file: "gate-2-jordan.md", label: "Voice DNA" },
  { name: "David", file: "gate-3-david.md", label: "Engagement" },
  { name: "Elena", file: "gate-4-elena.md", label: "SLOP Detection" },
  { name: "Natasha", file: "gate-5-natasha.md", label: "Editorial" },
  { name: "Marcus + Marshall", file: "gate-6-perspective.md", label: "Perspective" },
];

// Load prompts from filesystem (available in Vercel serverless)
function loadPrompt(filename) {
  // Try multiple paths (Vercel deployment structure varies)
  const paths = [
    path.join(process.cwd(), "src", "lib", "agents", "prompts", filename),
    path.join(__dirname, "..", "src", "lib", "agents", "prompts", filename),
    path.join("/var/task", "src", "lib", "agents", "prompts", filename),
  ];
  for (const p of paths) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {}
  }
  console.error(`[run-pipeline] Could not load prompt: ${filename}`);
  return null;
}

// Cache loaded prompts
const promptCache = {};
function getPrompt(filename) {
  if (!promptCache[filename]) {
    promptCache[filename] = loadPrompt(filename);
  }
  return promptCache[filename];
}

function parseGateResponse(text) {
  // Gate agents return structured responses. Try to extract key fields.
  let status = "PASS";
  let score = 75;
  let feedback = text;
  let issues = [];

  // Look for explicit status markers
  const statusMatch = text.match(/STATUS:\s*(PASS|FAIL|FLAG)/i) || text.match(/\*\*Status\*\*:\s*(PASS|FAIL|FLAG)/i);
  if (statusMatch) status = statusMatch[1].toUpperCase();

  // Look for score
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i) || text.match(/\*\*Score\*\*:\s*(\d+)/i) || text.match(/(\d+)\/100/);
  if (scoreMatch) score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));

  // Look for issues/findings
  const issuesMatch = text.match(/(?:ISSUES|FINDINGS|PROBLEMS|FLAGS):\s*\n([\s\S]*?)(?:\n\n|\n---|\n##|$)/i);
  if (issuesMatch) {
    issues = issuesMatch[1].split("\n").map(l => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).slice(0, 10);
  }

  // Extract feedback (first substantive paragraph)
  const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("|"));
  feedback = lines.slice(0, 5).join("\n").trim().slice(0, 500);

  if (status === "FAIL") score = Math.min(score, 50);

  return { status, score, feedback, issues };
}

function parseBetterishResponse(text) {
  // Betterish scorer returns a composite 0-1000 score
  let total = 0;
  const totalMatch = text.match(/TOTAL:\s*(\d+)/i) || text.match(/\*\*Total\*\*:\s*(\d+)/i) || text.match(/composite.*?(\d{3,4})/i);
  if (totalMatch) total = Math.min(1000, Math.max(0, parseInt(totalMatch[1])));

  let verdict = total >= 900 ? "PUBLISH" : total >= 600 ? "REVISE" : "REJECT";
  const verdictMatch = text.match(/VERDICT:\s*(PUBLISH|REVISE|REJECT)/i);
  if (verdictMatch) verdict = verdictMatch[1].toUpperCase();

  return { total, verdict, raw: text.slice(0, 1000) };
}

export const config = {
  maxDuration: 120,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { draft, outputType, voiceDnaMd, brandDnaMd, methodDnaMd, userId, outputId } = req.body || {};
  if (!draft) return res.status(400).json({ error: "draft is required" });

  const client = new Anthropic({ apiKey });
  const model = "claude-sonnet-4-20250514";
  const gateResults = [];
  let currentDraft = draft;
  let blockedAt = null;
  const startTime = Date.now();

  console.log(`[run-pipeline] Starting pipeline for output ${outputId}`);

  // Run 7 gates sequentially
  for (let i = 0; i < GATE_FILES.length; i++) {
    const gate = GATE_FILES[i];
    const prompt = getPrompt(gate.file);

    if (!prompt) {
      gateResults.push({
        gate: gate.name,
        status: "FLAG",
        score: 0,
        feedback: `Prompt file ${gate.file} not available.`,
        issues: ["PROMPT_NOT_LOADED"],
      });
      continue;
    }

    try {
      console.log(`[run-pipeline] Gate ${i}: ${gate.name}`);

      const userMessage = [
        `OUTPUT TYPE: ${outputType || "essay"}`,
        voiceDnaMd ? `VOICE DNA:\n${voiceDnaMd.slice(0, 2000)}` : "",
        brandDnaMd ? `BRAND DNA:\n${brandDnaMd.slice(0, 1000)}` : "",
        `\nCONTENT TO EVALUATE:\n\n${currentDraft}`,
        `\nRespond with your evaluation. Include STATUS: PASS/FAIL/FLAG, SCORE: 0-100, and detailed FEEDBACK.`,
      ].filter(Boolean).join("\n\n");

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: prompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const parsed = parseGateResponse(text);

      gateResults.push({
        gate: gate.name,
        status: parsed.status,
        score: parsed.score,
        feedback: parsed.feedback,
        issues: parsed.issues,
      });

      // Check for blocking failure
      if (parsed.status === "FAIL") {
        blockedAt = gate.name;
        // Continue running remaining gates for completeness but mark as blocked
      }

    } catch (err) {
      console.error(`[run-pipeline] Gate ${i} (${gate.name}) failed:`, err.message);
      gateResults.push({
        gate: gate.name,
        status: "FLAG",
        score: 0,
        feedback: `Gate evaluation failed: ${err.message || "Unknown error"}`,
        issues: ["API_ERROR"],
      });
    }
  }

  // Run Betterish scorer
  let betterishScore = { total: 0, verdict: "REJECT" };
  const betterishPrompt = getPrompt("betterish.md");

  if (betterishPrompt) {
    try {
      console.log("[run-pipeline] Running Betterish scorer");
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: betterishPrompt,
        messages: [{ role: "user", content: `Score this content on the Betterish scale (0-1000):\n\n${currentDraft}` }],
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      betterishScore = parseBetterishResponse(text);
    } catch (err) {
      console.error("[run-pipeline] Betterish scorer failed:", err.message);
    }
  }

  const durationMs = Date.now() - startTime;
  const anyFailed = gateResults.some(g => g.status === "FAIL");
  const status = anyFailed ? "BLOCKED" : "PASSED";

  console.log(`[run-pipeline] Complete. Status: ${status}, Score: ${betterishScore.total}, Duration: ${durationMs}ms`);

  return res.status(200).json({
    status,
    gateResults,
    betterishScore,
    finalDraft: currentDraft,
    blockedAt,
    totalDurationMs: durationMs,
  });
}
