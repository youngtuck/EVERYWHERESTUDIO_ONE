import Anthropic from "@anthropic-ai/sdk";

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

  const { responses = {}, userName = "the user" } = req.body || {};

  try {
    const client = new Anthropic({ apiKey });

    const system =
      "You are a Voice DNA analyst. Given a set of interview answers, produce a structured Voice DNA profile. You must respond with ONLY valid JSON that can be parsed by JSON.parse in JavaScript. Use double quotes for all keys and string values. Do not include comments, placeholders, angle brackets, or any trailing commas. No preamble, no markdown code blocks, no explanation. Just the raw JSON object.";

    const lines = [`Interview responses from ${userName}:`];
    for (const [key, value] of Object.entries(responses)) {
      lines.push(`${key}: ${String(value)}`);
    }
    lines.push(
      "",
      "Generate a Voice DNA profile as a JSON object with this exact shape. Fill in realistic numeric scores (0-100) and text based on the interview:",
      "{",
      '  "voiceDna": {',
      '    "voice_fidelity": 87,',
      '    "voice_layer": 82,',
      '    "value_layer": 79,',
      '    "personality_layer": 91,',
      '    "traits": {',
      '      "vocabulary_and_syntax": 84,',
      '      "tonal_register": 76,',
      '      "rhythm_and_cadence": 88,',
      '      "metaphor_patterns": 72,',
      '      "structural_habits": 80',
      "    },",
      '    "summary": "2-3 sentences describing this person\\'s voice in plain language.",',
      '    "signature_phrases": ["example phrase 1", "example phrase 2", "example phrase 3"],',
      '    "prohibited_patterns": ["pattern to avoid 1", "pattern to avoid 2", "pattern to avoid 3"],',
      '    "mode": "single"',
      "  },",
      '  "markdown": "Full Voice DNA .md document in the same format as VOICE_DNA_SYSTEM.md, escaped as a JSON string."',
      "}"
    );

    const userMessage = lines.join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content?.[0];
    const text = block?.type === "text" ? block.text : "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("[api/voice-dna] Failed to parse JSON", err, text.slice(0, 500));
      return res
        .status(502)
        .json({ error: "Voice DNA response was not valid JSON", raw: text.slice(0, 500) });
    }

    const { voiceDna, markdown } = parsed || {};
    return res.status(200).json({ voiceDna, markdown });
  } catch (err) {
    console.error("[api/voice-dna]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message || "Something went wrong." });
  }
}

