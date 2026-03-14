import Anthropic from "@anthropic-ai/sdk";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `You are a Brand DNA analyst for EVERYWHERE Studio. Given a conversation history (Watson asking questions, user answering), produce a structured Brand DNA profile. Respond with ONLY a raw JSON object. No preamble. No markdown code fences. No explanation. Pure JSON only. The JSON must be parseable by JSON.parse() with no preprocessing.`;

function buildUserMessage(userName, responses) {
  const lines = [`Conversation from ${userName}:`];
  if (Array.isArray(responses)) {
    responses.forEach((m) => {
      const role = m.role === "assistant" || m.role === "watson" ? "Watson" : "User";
      lines.push(`${role}: ${String(m.content || "").trim()}`);
    });
  } else if (responses && typeof responses === "object") {
    for (const [key, value] of Object.entries(responses)) {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  lines.push(
    "",
    "Generate a Brand DNA profile as this exact JSON structure:",
    "{",
    '  "brandDna": {',
    '    "brand_name": "<string>",',
    '    "category_position": "<string, what category this brand owns>",',
    '    "declared_enemy": "<string, what they are against>",',
    '    "core_promise": "<string, one sentence>",',
    '    "target_person": "<string, specific description>",',
    '    "brand_voice_adjectives": ["<3-5 adjectives>"],',
    '    "never_say": ["<3-5 phrases the brand would never use>"],',
    '    "visual_direction": "<string, brief description>",',
    '    "summary": "<2-3 sentences>"',
    "  },",
    '  "markdown": "<full Brand DNA .md document as a string>"',
    "}"
  );
  return lines.join("\n");
}

function stripMarkdownFences(text) {
  if (!text || typeof text !== "string") return text;
  let out = text.trim();
  const codeBlockRe = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i;
  const m = out.match(codeBlockRe);
  if (m) out = m[1].trim();
  return out;
}

function tryParseJson(text) {
  try {
    return { parsed: JSON.parse(text), error: null };
  } catch (err) {
    return { parsed: null, error: err };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { responses = [], userName = "the user" } = req.body || {};

  try {
    const client = new Anthropic({ apiKey });
    const userMessage = buildUserMessage(userName, responses);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content?.[0];
    let text = block?.type === "text" ? block.text : "";

    let { parsed, error } = tryParseJson(text);
    if (error) {
      text = stripMarkdownFences(text);
      const retry = tryParseJson(text);
      parsed = retry.parsed;
      error = retry.error;
    }
    if (error || !parsed) {
      console.error("[api/brand-dna] Failed to parse JSON", error, text.slice(0, 500));
      return res.status(502).json({ error: "Brand DNA response was not valid JSON", raw: text.slice(0, 500) });
    }

    const { brandDna, markdown } = parsed;
    return res.status(200).json({ brandDna, markdown });
  } catch (err) {
    console.error("[api/brand-dna]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message || "Something went wrong." });
  }
}
