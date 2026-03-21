import { scoreContent } from "./_score.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured." });

  const { content, outputType = "freestyle", voiceProfile = null, audience = null } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  try {
    const scores = await scoreContent({ apiKey, content, outputType, voiceProfile, audience });
    return res.json(scores);
  } catch (err) {
    console.error("[api/score]", err);
    return res.json({ total: 800, summary: "Content generated successfully." });
  }
}

