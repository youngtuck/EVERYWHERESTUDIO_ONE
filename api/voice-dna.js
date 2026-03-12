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
      "You are a Voice DNA analyst. Given a set of interview answers, produce a structured Voice DNA profile. You must respond with ONLY valid JSON, no preamble, no markdown code blocks, no explanation. Just the raw JSON object.";

    const lines = [`Interview responses from ${userName}:`];
    for (const [key, value] of Object.entries(responses)) {
      lines.push(`${key}: ${String(value)}`);
    }
    lines.push(
      "",
      "Generate a Voice DNA profile as a JSON object with this exact structure:",
      "{",
      "  voiceDna: {",
      "    voice_fidelity: <number 0-100>,",
      "    voice_layer: <number 0-100>,",
      "    value_layer: <number 0-100>,",
      "    personality_layer: <number 0-100>,",
      "    traits: {",
      "      vocabulary_and_syntax: <number 0-100>,",
      "      tonal_register: <number 0-100>,",
      "      rhythm_and_cadence: <number 0-100>,",
      "      metaphor_patterns: <number 0-100>,",
      "      structural_habits: <number 0-100>",
      "    },",
      "    summary: <string, 2-3 sentences describing this person's voice>,",
      "    signature_phrases: [<array of 3-5 phrases typical of this voice>],",
      "    prohibited_patterns: [<array of 3-5 patterns to avoid>],",
      "    mode: 'single'",
      "  },",
      "  markdown: <string, full Voice DNA .md document in the same format as VOICE_DNA_SYSTEM.md>",
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

