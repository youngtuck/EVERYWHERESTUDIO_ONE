/**
 * EVERYWHERE Studio — Work API
 * Watson (Claude) conversation + generation. Keep API key server-side only.
 */
import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const READY_MARKER = "READY_TO_GENERATE";

const WATSON_SYSTEM = `You are Dr. John Watson, the First Listener for EVERYWHERE Studio. Your role is to capture the user's ideas, not to write for them.

RULES:
- Ask ONE question per response. Never ask multiple questions at once.
- Listen first. Draw out what they mean, not just what they say.
- Reflect back: "So what you're saying is..." to catch misunderstandings early.
- Use their words and rhythm when you summarize. You capture from them; you don't create for them.
- When you have enough to produce the requested output (clear idea, format, audience, and any key specifics), end your message with a brief confirmation, then on a new line write exactly: ${READY_MARKER}
- Be patient, curious, and ego-free. Signature phrases: "Tell me more about that.", "What happened next?", "Help me understand what you mean by..."

OUTPUT TYPES (for context): essay, newsletter, presentation, social, podcast, video, sunday_story, freestyle.`;

function buildWatsonSystem(outputType) {
  return `${WATSON_SYSTEM}

Current output type for this session: ${outputType || "freestyle"}. Ask questions that clarify the idea, the audience, and any specifics needed to create it.`;
}

app.post("/api/chat", async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not set. Add it to .env — see SETUP.md." });
  }
  const { messages = [], outputType = "freestyle" } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required with at least one message." });
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const system = buildWatsonSystem(outputType);

    // Build messages for Claude: user/assistant alternating
    const claudeMessages = messages.map((m) => ({
      role: m.role === "watson" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content : m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: claudeMessages,
    });

    const block = response.content?.[0];
    const text = block?.type === "text" ? block.text : "";
    const readyToGenerate = text.includes(READY_MARKER);
    const reply = text.replace(READY_MARKER, "").replace(/\n+$/, "").trim();

    res.json({ reply, readyToGenerate });
  } catch (err) {
    console.error("[/api/chat]", err);
    const status = err.status === 401 ? 401 : 502;
    res.status(status).json({
      error: err.message || "Claude request failed. Check your API key and SETUP.md.",
    });
  }
});

app.post("/api/generate", async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not set. Add it to .env — see SETUP.md." });
  }
  const { context = "", outputType = "freestyle", conversationSummary } = req.body;

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const system = `You are producing a single piece of content for EVERYWHERE Studio. Use the captured context and conversation to write in the user's voice. Output only the final content, no meta-commentary. Format appropriately for the type: ${outputType}.`;

    const userContent = conversationSummary
      ? `Conversation summary:\n${conversationSummary}\n\nProduce the ${outputType} now.`
      : `Context:\n${context}\n\nProduce the ${outputType} now.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userContent }],
    });

    const block = response.content?.[0];
    const content = block?.type === "text" ? block.text : "";

    // Placeholder Betterish score (real scoring would call a separate step or model)
    const score = 800 + Math.floor(Math.random() * 150);

    res.json({ content, score });
  } catch (err) {
    console.error("[/api/generate]", err);
    const status = err.status === 401 ? 401 : 502;
    res.status(status).json({
      error: err.message || "Generation failed. Check your API key and SETUP.md.",
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EVERYWHERE Studio API running at http://localhost:${PORT}`);
});
