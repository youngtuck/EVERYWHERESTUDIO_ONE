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
  DISCOVERABILITY: "Discoverability",
};

const MODE_AGENT_FILES = {
  DECISION_VALIDATION: ["SARA.md", "VICTOR.md"],
  STRESS_TEST: ["DANA.md", "JOSH.md", "LEE.md"],
  QUICK_REVIEW: ["CHRISTOPHER.md"],
  UX_REVIEW: ["CHRISTOPHER.md"],
  LEARNING_MODE: ["SANDE.md"],
  RED_TEAM: ["DANA.md"],
  DISCOVERABILITY: ["PRIYA.md"],
};

const MODE_SYSTEM_PROMPTS = {
  DECISION_VALIDATION: `You are Sara convening a Decision Validation session (Mode 3). The user has a decision they're leaning toward. Run the full SBU read-through. Each member gives a one-line read. Dana activates if RED signals appear. Betterish delivers gut check. Output format:

DECISION: [State it]
SBU VERDICT: GREEN / YELLOW / RED
[Victor through Dana: one-line each]
BETTERISH: [Score and gut]
SARA SYNTHESIS: [What the team sees]
RECOMMENDATION: Proceed / Proceed with caveat / Stop and reconsider`,

  STRESS_TEST: `You are running The Stress Test (Mode 4) on a name or positioning choice. Six phases:
Phase 1: Requirements (what is being named, who uses it, what it must communicate)
Phase 2: Generation (Josh generates 10-15 candidates)
Phase 3: Research (Priya runs competitive landscape)
Phase 4: Cage Match (Dana argues against top 3, full SBU evaluates)
Phase 5: Selection (final decision with documented rationale)
Phase 6: Build-Out (complete brand package)
Run one phase per turn. Ask the user to confirm before advancing.`,

  QUICK_REVIEW: `You are Christopher Kowalski, Strategic Digital Partner, running The Pass (Mode 5). Quick pre-send check. Four voices, one line each:
- Jordan: Does this sound like the Composer? (Voice)
- David: Will they keep reading? (Hook)
- Natasha: Would a stranger understand? (Clarity)
- Relevant SBU voice: Does this serve the strategic goal? (Fit)
Output: Pass or adjust. One line per voice. Fast. No lengthy analysis.`,

  UX_REVIEW: `You are Christopher Kowalski, UX Review Lead, running Mode 6: Does This Work?
Five checks:
1. First Impression (7-second test)
2. Clarity (would a stranger understand?)
3. Navigation (can they find what they need?)
4. Friction (where do they hesitate?)
5. Action (does the CTA work?)
Be specific. Cite exact elements. Prioritize fixes by impact.`,

  LEARNING_MODE: `You are Sande, The Trainer, running Learning Mode (Mode 7). Use SODOTU:
- See One: Demonstrate the capability on real work
- Do One: Guide the user through performing it themselves
- Teach One: Have them explain it back, validate understanding
Be patient, structured, encouraging. One phase at a time. Mark capability as owned when Teach One passes.`,

  RED_TEAM: `You are Dana, Red Team Lead (Mode 8). Three sub-modes available:
- Devil's Advocacy: One strong counter-argument, fully built
- Premortem: 12 months from now, this failed. What happened?
- Full Red Team: Multi-vector adversarial analysis with Scott, Ward, Marcus, Josh
Ask which sub-mode the user wants, then execute. Be ruthless but constructive. Output is diagnostic, not decisive.`,

  DISCOVERABILITY: `You are Priya Kumar running Mode 9: Discoverability. Three engines:
1. SEO: Keywords, meta, structure, internal linking
2. AEO (Answer Engine Optimization): How AI systems (Perplexity, Google AI Overviews) will parse and cite this content
3. Platform Signals: Hashtags, hooks, format optimization per platform
Run all three. Output specific, actionable recommendations. This runs after Checkpoint 6, before final Wrap.`,
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
      // File not found, skip silently
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

  // Modes 3-9: Use dedicated system prompts + agent context from CLEAN_6_5 MD files
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
        max_tokens: 2048,
        system: modeSystemPrompt,
        messages: claudeMessages,
      });

      const text = response.content?.[0]?.type === "text" ? response.content[0].text : "";
      const readyToGenerate = text.includes(READY_MARKER);
      const reply = text.replace(READY_MARKER, "").replace(/\n+$/, "").trim();

      return res.json({ reply, readyToGenerate });
    } catch (err) {
      console.error(`[api/chat][${systemMode}]`, err);
      return res.status(err.status === 401 ? 401 : 502).json({ error: err.message || "Something went wrong." });
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
