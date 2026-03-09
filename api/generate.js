/**
 * Vercel serverless: POST /api/generate — Content generation from Watson conversation.
 * Same logic as server/index.js; keep in sync for local dev.
 */
import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

function isRetryable(err) {
  const status = err?.status ?? err?.httpStatus;
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (err?.message?.includes("ECONNRESET") || err?.message?.includes("ETIMEDOUT")) return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && isRetryable(err)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function setCors(res, req) {
  const origin = req.headers?.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not set. Add it in Vercel Project Settings → Environment Variables." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { context = "", outputType = "freestyle", conversationSummary } = body;

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const system = `You are producing a single piece of content for EVERYWHERE Studio. Use the captured context and conversation to write in the user's voice. Output only the final content, no meta-commentary. Format appropriately for the type: ${outputType}.`;

    const userContent = conversationSummary
      ? `Conversation summary:\n${conversationSummary}\n\nProduce the ${outputType} now.`
      : `Context:\n${context}\n\nProduce the ${outputType} now.`;

    const response = await withRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userContent }],
      })
    );

    const block = response.content?.[0];
    const content = block?.type === "text" ? block.text : "";
    const score = 800 + Math.floor(Math.random() * 150);

    return res.status(200).json({ content, score });
  } catch (err) {
    console.error("[api/generate]", err);
    const status = err.status === 401 ? 401 : 502;
    const message = err.message || "Something went wrong on our end.";
    return res.status(status).json({
      error: status === 401 ? "Invalid API key. Check Vercel environment variables." : message,
      retryable: isRetryable(err),
    });
  }
}
