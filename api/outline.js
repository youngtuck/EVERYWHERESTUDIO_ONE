import Anthropic from "@anthropic-ai/sdk";
import { getUserResources } from "./_resources.js";
import { clipDna, DNA_LIMITS } from "./_dnaContext.js";
import { callWithRetry } from "./_retry.js";
import { CLAUDE_MODEL } from "./_config.js";
import { requireAuth } from "./_auth.js";

function sanitizeEmDashes(text) {
  if (!text) return text;
  let result = text.replace(/\s*\u2014\s*/g, ", ");
  result = result.replace(/\s+\u2013\s+/g, ", ");
  result = result.replace(/, ,/g, ",").replace(/,\./g, ".").replace(/,\s*,/g, ",");
  return result;
}

function sanitizeOutlineObj(obj) {
  if (!obj) return obj;
  if (typeof obj === "string") return sanitizeEmDashes(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeOutlineObj);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeOutlineObj(v);
    }
    return out;
  }
  return obj;
}

const OUTLINE_SYSTEM = `You are Reed, generating a structured outline from a conversation you just had with the user. You captured their thesis, audience, goal, hook, and format during intake. Now produce two genuinely different structural approaches to the piece.

CRITICAL RULES:
- Never use em-dashes. Use commas, periods, colons, or semicolons instead.
- Every outline row must contain specific, opinionated editorial content. Never use generic filler like "Supporting evidence and examples" or "What changes if the reader acts on this." Every line should be a real editorial decision that could only apply to THIS piece.
- The two angles must be structurally different, not the same content reshuffled. Different titles, different hooks, different organizational logic.
- Each outline row should be 5 to 20 words. Concise and directional. Not a full sentence, more like a section heading with enough specificity to guide the draft.
- Sub-points (indented rows) should be genuine structural sub-sections, not generic placeholders.

OUTPUT FORMAT: Respond with ONLY valid JSON, no markdown backticks, no preamble. Use this exact structure:

{
  "angleA": {
    "name": "Short 2-5 word name for this angle's approach",
    "description": "One sentence describing the structural strategy. E.g. 'Opens with the myth, pivots to structural diagnosis, closes with the system as solution.'",
    "rows": [
      {"label": "Title", "content": "The actual title for this angle"},
      {"label": "Hook", "content": "The specific opening approach"},
      {"label": "Body", "content": "The core argument or narrative move"},
      {"label": "", "content": "A specific sub-point that develops the body", "indent": true},
      {"label": "", "content": "Another specific sub-point", "indent": true},
      {"label": "Stakes", "content": "What is at risk, specific to this piece"},
      {"label": "", "content": "A specific sub-point on stakes", "indent": true},
      {"label": "Close", "content": "How this piece lands"}
    ]
  },
  "angleB": {
    "name": "Short 2-5 word name for this angle's approach",
    "description": "One sentence describing how this angle differs structurally from A.",
    "rows": [
      {"label": "Title", "content": "A different title reflecting this angle"},
      {"label": "Hook", "content": "A structurally different opening"},
      {"label": "Body", "content": "Different organizational logic for the argument"},
      {"label": "", "content": "Sub-point specific to this angle", "indent": true},
      {"label": "", "content": "Sub-point specific to this angle", "indent": true},
      {"label": "Stakes", "content": "Stakes framed differently than angle A"},
      {"label": "", "content": "Sub-point on stakes", "indent": true},
      {"label": "Close", "content": "A different landing than angle A"}
    ]
  }
}

Each angle should have 7-9 rows. The rows array should use the exact label names: "Title", "Hook", "Body", "Stakes", "Close" for labeled rows, and "" for indented sub-point rows. Indented rows must have "indent": true.

EXAMPLES OF GOOD VS BAD OUTLINE ROWS:

BAD (generic): "Supporting evidence and examples."
GOOD (specific): "Why willpower cannot bridge the gap."

BAD (generic): "What changes if the reader acts on this."
GOOD (specific): "Every week without infrastructure, someone else says what you have been thinking."

BAD (generic): "Circle back to the opening image."
GOOD (specific): "The thinking is in your head. It belongs in the world."

BAD (reshuffled): Angle B title is "A different take on: [Angle A title]"
GOOD (genuinely different): Angle A is "The Infrastructure Reframe", Angle B is "The Articulation Gap"`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireAuth(req, res);
  if (!auth) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured." });

  const { messages = [], userId, outputType = "freestyle" } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required with at least one message." });
  }

  try {
    // Load user resources for voice/brand/method context
    const resources = await getUserResources(userId);
    const A = DNA_LIMITS.auxiliary;

    // Build system prompt with voice/brand context
    let systemPrompt = OUTLINE_SYSTEM;
    if (resources.voiceDna) {
      systemPrompt = `## Voice DNA (write in this voice)\n${clipDna(resources.voiceDna, A.voice)}\n\n` + systemPrompt;
    }
    if (resources.brandDna) {
      systemPrompt = `## Brand DNA\n${clipDna(resources.brandDna, A.brand)}\n\n` + systemPrompt;
    }
    if (resources.methodDna) {
      systemPrompt = `## Method DNA (use proprietary terms exactly)\n${clipDna(resources.methodDna, A.method)}\n\n` + systemPrompt;
    }
    systemPrompt += `\n\nOutput type for this session: ${outputType}. Tailor the outline structure to this format.`;

    // Build Claude messages from conversation history
    const claudeMessages = messages.map((m) => ({
      role: m.role === "reed" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content : String(m.content),
    }));

    // Add a final user message requesting the outline
    claudeMessages.push({
      role: "user",
      content: "Generate two structurally distinct outlines based on our conversation. Return ONLY valid JSON.",
    });

    const client = new Anthropic({ apiKey });
    const response = await callWithRetry(() =>
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: claudeMessages,
      })
    );

    const raw = response.content?.[0]?.text || "";

    // Parse JSON from response, handling possible markdown code fences
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[api/outline] JSON parse failed. Raw response:", raw.slice(0, 500));
      return res.status(502).json({ error: "Failed to parse outline response from Claude." });
    }

    // Validate structure
    if (!parsed.angleA?.rows || !parsed.angleB?.rows) {
      console.error("[api/outline] Invalid structure:", JSON.stringify(parsed).slice(0, 500));
      return res.status(502).json({ error: "Invalid outline structure from Claude." });
    }

    // Sanitize em-dashes from all text fields
    const result = sanitizeOutlineObj(parsed);

    return res.json({
      angleA: {
        name: result.angleA.name || "Angle A",
        description: result.angleA.description || "",
        rows: result.angleA.rows,
      },
      angleB: {
        name: result.angleB.name || "Angle B",
        description: result.angleB.description || "",
        rows: result.angleB.rows,
      },
    });
  } catch (err) {
    console.error("[api/outline]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: "Outline generation failed. Please try again." });
  }
}
