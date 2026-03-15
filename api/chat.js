import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const READY_MARKER = "READY_TO_GENERATE";

/** Human-readable labels for placeholder replies (modes 3–8). */
const SYSTEM_MODE_LABELS = {
  CONTENT_PRODUCTION: "Content Production",
  PATH_DETERMINATION: "Path Determination",
  DECISION_VALIDATION: "Decision Validation",
  STRESS_TEST: "Stress Test",
  QUICK_REVIEW: "Quick Review",
  UX_REVIEW: "UX Review",
  LEARNING_MODE: "Learning Mode",
  RED_TEAM: "Red Team",
};

const MODE_AGENT_FILES = {
  DECISION_VALIDATION: ["SARA.md", "VICTOR.md"],
  STRESS_TEST: ["DANA.md", "JOSH.md", "LEE.md"],
  QUICK_REVIEW: ["CHRISTOPHER.md"],
  UX_REVIEW: ["CHRISTOPHER.md"],
  LEARNING_MODE: ["SANDE.md"],
  RED_TEAM: ["DANA.md"],
};

const MODE_SYSTEM_PROMPTS = {
  DECISION_VALIDATION: `You are Sara convening a Decision Validation session. The user has a decision they're leaning toward. Run a six-gate stress test and return GREEN / YELLOW / RED with reasoning for each gate. Be direct. End with a clear recommendation.`,
  STRESS_TEST: `You are Dana leading a Stress Test on a name or positioning choice. Run six phases of adversarial challenge. Josh provides category design perspective. Lee provides brand architecture perspective. Be rigorous but constructive. End with a clear verdict.`,
  QUICK_REVIEW: `You are Christopher, Strategic Digital Partner. The user wants a quick review of an asset. Evaluate it for: clarity, audience fit, visual hierarchy, and effectiveness. Be specific and actionable. One recommendation per issue.`,
  UX_REVIEW: `You are Christopher, UX Review Lead. Evaluate the provided asset for usability, information architecture, interaction design, and accessibility. Be specific. Cite exact elements. Prioritize fixes by impact.`,
  LEARNING_MODE: `You are Sande, The Trainer. Use SODOTU methodology: See One, Do One, Teach One. The user wants to learn a capability. Walk them through it by showing an example, having them try it, then having them explain it back. Be patient, structured, and encouraging.`,
  RED_TEAM: `You are Dana, Red Team Lead. The user wants adversarial challenge before committing to something. Three modes available: Premortem (what could go wrong), Devil's Advocacy (argue the other side), Full Red Team (comprehensive challenge). Ask which mode, then execute ruthlessly but constructively.`,
};

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

/** Inline SBU Path Determination prompt (used when sara-routing.md is not available). */
const PATH_DETERMINATION_FALLBACK = `You are Sara convening the SBU (Strategy Board Unit) for Path Determination. The user has no direction yet—they need to explore before choosing a path.

Your role:
- Synthesize the full SBU perspective (Victor, Evan, Josh, Lee, Guy, Ward, Monty, Basil, Scott, Betterish, Dana) into ONE clear recommendation, not a list of options.
- Dana is present but restrained; her adversarial energy shows up as questions, not arguments. The SBU is exploring, not defending.
- Respond in Sara's voice: direct, efficient, warm. One recommendation with brief rationale. End with a conviction check: "Do you believe it yourself?"`;

function loadPathDeterminationSystemPrompt() {
  try {
    const promptsPath = path.join(process.cwd(), "src", "lib", "agents", "prompts", "sara-routing.md");
    const saraMd = fs.readFileSync(promptsPath, "utf8");
    return (
      saraMd +
      "\n\n---\n\nSBU ACTIVATION FOR PATH DETERMINATION (Mode 2):\nConvene the full SBU. Synthesize Victor through Dana into ONE clear recommendation, not a menu. Dana asks questions; the panel explores. Output one recommendation and end with a conviction check: \"Do you believe it yourself?\""
    );
  } catch {
    return PATH_DETERMINATION_FALLBACK;
  }
}

function loadModeAgentContext(systemMode) {
  const files = MODE_AGENT_FILES[systemMode] || [];
  let context = "";
  for (const file of files) {
    try {
      const filePath = path.join(process.cwd(), "CLEAN_6_5", file);
      const md = fs.readFileSync(filePath, "utf8");
      context += `\n\n--- ${file.replace(".md", "")} AGENT PROFILE ---\n${md}`;
    } catch {
      // File not found in deployment, skip
    }
  }
  return context;
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

  const {
    messages = [],
    outputType = "freestyle",
    voiceProfile = null,
    voiceDnaMd,
    systemPromptOverride,
    systemMode = "CONTENT_PRODUCTION",
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required." });
  }

  // Modes 3-8: Use dedicated system prompts + agent context from MD files
  if (MODE_SYSTEM_PROMPTS[systemMode]) {
    const basePrompt = MODE_SYSTEM_PROMPTS[systemMode];
    const agentContext = loadModeAgentContext(systemMode);
    const modeSystemPrompt = agentContext
      ? basePrompt + "\n\n--- AGENT REFERENCE ---" + agentContext
      : basePrompt;

    try {
      const client = new Anthropic({ apiKey });
      const claudeMessages = messages.map((m) => ({
        role: m.role === "watson" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: modeSystemPrompt,
        messages: claudeMessages,
      });

      const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
      const readyToGenerate = text.includes(READY_MARKER);
      const reply = text.replace(READY_MARKER, "").replace(/\n+$/, "").trim();

      return res.json({ reply, readyToGenerate });
    } catch (err) {
      console.error(`[api/chat][${systemMode}]`, err);
      const status = err.status === 401 ? 401 : 502;
      return res.status(status).json({ error: err.message || "Something went wrong." });
    }
  }

  let systemPrompt;
  if (typeof systemPromptOverride === "string" && systemPromptOverride.trim()) {
    systemPrompt = systemPromptOverride.trim();
  } else if (systemMode === "PATH_DETERMINATION") {
    systemPrompt = loadPathDeterminationSystemPrompt();
  } else {
    // CONTENT_PRODUCTION or default: full Watson + Voice DNA
    systemPrompt = buildWatsonSystem(outputType, voiceProfile, voiceDnaMd);
  }

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
