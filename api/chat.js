import Anthropic from "@anthropic-ai/sdk";

const READY_MARKER = "READY_TO_GENERATE";

const WATSON_SYSTEM = `You are Dr. John Watson, the First Listener for EVERYWHERE Studio. Your role is to capture the user's ideas, not to write for them.

RULES:
- Ask ONE question per response. Never ask multiple questions at once.
- Listen first. Draw out what they mean, not just what they say.
- Reflect back: "So what you're saying is..." to catch misunderstandings early.
- Use their words and rhythm when you summarize. You capture from them; you don't create for them.
- When you have enough to produce the requested output (clear idea, format, audience, and any key specifics), end your message with a brief confirmation, then on a new line write exactly: READY_TO_GENERATE
- Be patient, curious, and ego-free.
- Signature phrases: "Tell me more about that.", "What happened next?", "Help me understand what you mean by..."

OUTPUT TYPES: essay, newsletter, presentation, social, podcast, video, sunday_story, freestyle.`;

function buildWatsonSystem(outputType, voiceProfile, voiceDnaMd) {
  let system = "";
  if (voiceDnaMd && typeof voiceDnaMd === "string" && voiceDnaMd.trim()) {
    system += "VOICE DNA - Write exactly like this person:\n\n" + voiceDnaMd.trim() + "\n\n---\n\n";
  }
  system += WATSON_SYSTEM;
  if (voiceProfile) {
    system += `\n\nUSER VOICE PROFILE:\n- Role: ${voiceProfile.role}\n- Audience: ${voiceProfile.audience}\n- Tone: ${voiceProfile.tone}\n- Writing sample: "${voiceProfile.writing_sample?.slice(0, 400)}"\n\nMatch this person's voice exactly when summarizing their ideas.`;
  }
  system += `\n\nCurrent output type: ${outputType || "freestyle"}.`;
  return system;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured." });

  const { messages = [], outputType = "freestyle", voiceProfile = null, voiceDnaMd, systemPromptOverride } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required." });
  }

  const systemPrompt =
    typeof systemPromptOverride === "string" && systemPromptOverride.trim()
      ? systemPromptOverride.trim()
      : buildWatsonSystem(outputType, voiceProfile, voiceDnaMd);

  try {
    const client = new Anthropic({ apiKey });
    const claudeMessages = messages.map((m) => ({
      role: m.role === "watson" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
    const readyToGenerate = text.includes(READY_MARKER);
    const reply = text.replace(READY_MARKER, "").replace(/\n+$/, "").trim();

    return res.json({ reply, readyToGenerate });
  } catch (err) {
    console.error("[api/chat]", err);
    const status = err.status === 401 ? 401 : 502;
    return res.status(status).json({ error: err.message || "Something went wrong." });
  }
}
