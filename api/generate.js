import Anthropic from "@anthropic-ai/sdk";
import { scoreContent } from "./_score.js";
import { getUserResources } from "./_resources.js";
import { callWithRetry } from "./_retry.js";

function sanitizeContent(text) {
  if (!text) return text;
  let result = text.replace(/\s*\u2014\s*/g, ", ");
  result = result.replace(/\s+\u2013\s+/g, ", ");
  result = result.replace(/, ,/g, ",").replace(/,\./g, ".").replace(/,\s*,/g, ",");
  return result;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured." });

  const { conversationSummary = "", outputType = "freestyle", voiceProfile = null } = req.body;

  let resources = { voiceDna: "", brandDna: "", methodDna: "", references: "" };
  const userId = req.body?.userId;
  if (userId) {
    try {
      resources = await getUserResources(userId);
    } catch (e) {
      console.error("[api/generate] Failed to load resources", e);
    }
  }

  try {
    const client = new Anthropic({ apiKey });

    let system = `You are producing a single piece of content for EVERYWHERE Studio. Use the captured conversation to write in the user's voice. Output only the final content. No meta-commentary, no preamble, no "Here is your essay:" headers. Format appropriately for the type: ${outputType}.`;
    if (voiceProfile) {
      system += `\n\nUSER VOICE PROFILE:\n- Role: ${voiceProfile.role}\n- Audience: ${voiceProfile.audience}\n- Tone: ${voiceProfile.tone}\n- Writing sample: "${voiceProfile.writing_sample?.slice(0, 600)}"\n\nMatch this person's voice exactly.`;
    }
    if (resources.voiceDna) {
      system += "\n\nVOICE DNA - Match this voice exactly:\n" + resources.voiceDna;
    }
    if (resources.brandDna) {
      system += "\n\nBRAND DNA - Stay on brand:\n" + resources.brandDna;
    }
    if (resources.methodDna) {
      system += "\n\nMETHOD DNA - Use these frameworks and proprietary terminology exactly as written. Do not paraphrase tool names:\n" + resources.methodDna;
    }
    if (resources.references) {
      system += "\n\nREFERENCE MATERIALS:\n" + resources.references;
    }

    system += "\n\nCRITICAL FORMATTING RULE: Never use em-dashes (the long dash character) anywhere in your output. Use commas, periods, colons, or semicolons instead. This is non-negotiable.";

    const response = await callWithRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [{
          role: "user",
          content: `Conversation summary:\n${conversationSummary}\n\nProduce the ${outputType} now.`
        }],
      })
    );

    const content = sanitizeContent(response.content?.[0]?.type === "text" ? response.content[0].text : "");

    let gates = null;
    let score = 800;
    try {
      const scores = await scoreContent({ apiKey, content, outputType, voiceProfile });
      gates = scores;
      if (typeof scores?.total === "number") {
        score = scores.total;
      }
    } catch (err) {
      console.error("[api/generate][score]", err);
    }

    return res.json({ content, score, gates });
  } catch (err) {
    console.error("[api/generate]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message || "Something went wrong." });
  }
}
