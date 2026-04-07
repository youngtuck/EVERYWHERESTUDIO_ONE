import Anthropic from "@anthropic-ai/sdk";
import { callWithRetry } from "./_retry.js";
import { CLAUDE_MODEL } from "./_config.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `You are a Voice DNA analyst for EVERYWHERE Studio. Given interview responses,
produce a structured Voice DNA profile. Respond with ONLY a raw JSON object.
No preamble. No markdown code fences. No explanation. Pure JSON only.
The JSON must be parseable by JSON.parse() with no preprocessing.`;

function buildUserMessage(userName, responses, textSamples) {
  const lines = [];

  // Format 1: Structured interview responses (object with question keys)
  if (responses && typeof responses === "object" && !Array.isArray(responses) && Object.keys(responses).length > 0) {
    lines.push(`Interview responses from ${userName}:`);
    for (const [key, value] of Object.entries(responses)) {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  // Format 2: Conversation array (Reed chat history)
  else if (Array.isArray(responses) && responses.length > 0) {
    lines.push(`Conversation with ${userName}:`);
    responses.forEach((m) => {
      const role = m.role === "assistant" || m.role === "reed" ? "Reed" : userName;
      if (m.content && String(m.content).trim()) {
        lines.push(`${role}: ${String(m.content).trim()}`);
      }
    });
  }
  // Format 3: Raw text samples
  else if (textSamples && typeof textSamples === "string" && textSamples.trim()) {
    lines.push(`Writing samples from ${userName}:`);
    lines.push(textSamples.trim());
  }
  // Format 4: Single text field in responses
  else if (typeof responses === "string" && responses.trim()) {
    lines.push(`Writing samples from ${userName}:`);
    lines.push(responses.trim());
  }

  if (lines.length === 0) {
    return null;
  }

  lines.push(
    "",
    "Generate a Voice DNA profile as this exact JSON structure:",
    "{",
    '  "voiceDna": {',
    '    "voice_fidelity": <number 0-100>,',
    '    "voice_layer": <number 0-100>,',
    '    "value_layer": <number 0-100>,',
    '    "personality_layer": <number 0-100>,',
    '    "traits": {',
    '      "vocabulary_and_syntax": <0-100>,',
    '      "tonal_register": <0-100>,',
    '      "rhythm_and_cadence": <0-100>,',
    '      "metaphor_patterns": <0-100>,',
    '      "structural_habits": <0-100>',
    "    },",
    '    "summary": "<2-3 sentence description>",',
    '    "signature_phrases": ["<3-5 phrases>"],',
    '    "prohibited_patterns": ["<3-5 AI patterns this person never uses>"],',
    '    "contraction_frequency": "<low | medium | high>",',
    '    "sentence_length": "<short | medium | long | varied>",',
    '    "mode": "single"',
    "  },",
    '  "markdown": "<full Voice DNA .md document as a string>"',
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
  let parsed;
  try {
    parsed = JSON.parse(text);
    return { parsed, error: null };
  } catch (err) {
    return { parsed: null, error: err };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { responses, userName = "the user", textSamples, text: textInput } = req.body || {};

  try {
    const client = new Anthropic({ apiKey });
    const userMessage = buildUserMessage(userName, responses, textSamples || textInput);

    if (!userMessage) {
      return res.status(400).json({
        error: "No voice content provided. Send interview responses, conversation history, or text samples.",
        hint: "Send { responses: { question: answer } } OR { responses: [{ role, content }] } OR { text: 'writing sample...' }"
      });
    }

    const response = await callWithRetry(() =>
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      })
    );

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
      console.error("[api/voice-dna] Failed to parse JSON", error, text.slice(0, 500));
      return res
        .status(502)
        .json({ error: "Voice DNA response was not valid JSON", raw: text.slice(0, 500) });
    }

    const { voiceDna, markdown } = parsed;
    return res.status(200).json({ voiceDna, markdown });
  } catch (err) {
    console.error("[api/voice-dna]", err);
    return res.status(502).json({ error: "Something went wrong. Please try again." });
  }
}
