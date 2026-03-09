import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured." });

  const { conversationSummary = "", outputType = "freestyle" } = req.body;

  try {
    const client = new Anthropic({ apiKey });

    const system = `You are producing a single piece of content for EVERYWHERE Studio. Use the captured conversation to write in the user's voice. Output only the final content — no meta-commentary, no preamble, no "Here is your essay:" headers. Format appropriately for the type: ${outputType}.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{
        role: "user",
        content: `Conversation summary:\n${conversationSummary}\n\nProduce the ${outputType} now.`
      }],
    });

    const content = response.content?.[0]?.type === "text" ? response.content[0].text : "";
    const score = 800 + Math.floor(Math.random() * 150);

    return res.json({ content, score });
  } catch (err) {
    console.error("[api/generate]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message || "Something went wrong." });
  }
}
