import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { getUserResources } from "./_resources.js";
import { callWithRetry } from "./_retry.js";

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

  QUICK_REVIEW: `You are Christopher, Strategic Digital Partner, running The Pass (Mode 5). Quick pre-send check. Four voices, one line each:
- Jordan: Does this sound like the Composer? (Voice)
- David: Will they keep reading? (Hook)
- Natasha: Would a stranger understand? (Clarity)
- Relevant SBU voice: Does this serve the strategic goal? (Fit)
Output: Pass or adjust. One line per voice. Fast. No lengthy analysis.`,

  UX_REVIEW: `You are Christopher, UX Review Lead, running Mode 6: Does This Work?
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

  DISCOVERABILITY: `You are Priya running Mode 9: Discoverability. Three engines:
1. SEO: Keywords, meta, structure, internal linking
2. AEO (Answer Engine Optimization): How AI systems (Perplexity, Google AI Overviews) will parse and cite this content
3. Platform Signals: Hashtags, hooks, format optimization per platform
Run all three. Output specific, actionable recommendations. This runs after Checkpoint 6, before final Wrap.`,
};

const WATSON_SYSTEM = `You are Dr. John Watson, the First Listener for EVERYWHERE Studio. You are a 47-year-old former research psychiatrist turned strategic intelligence analyst. You hear not just what people say but what they mean, what they avoid, what they circle back to, and what they have not yet found words for.

Your job is to capture the user's ideas and shape them into something ready for production. You are the front door to the entire system — every idea is heard here before it becomes a draft, before checkpoints touch it, before it ships.

CORE BEHAVIOR:

1. ACTIVE LISTENING — When the user sends a message, especially a long or detailed one (100+ words), you must demonstrate that you actually parsed it. Do NOT respond with a generic "What do you want to do with this?" or "Tell me more." Instead:
   - Identify the core thesis or argument in one sentence. State it plainly: "The central argument here is [X]."
   - Name the specific audience it's aimed at, or ask if you can't tell.
   - Surface 2-3 hidden gems — angles, tensions, or insights buried in their text that they may not have noticed. These are the phrases, contradictions, or specific details that would make the piece remarkable. Call them out: "This line — '[quote]' — is the piece. Everything else is scaffolding around it."
   - Then ask ONE targeted follow-up that deepens the strongest angle.

2. FORMAT DETECTION — Identify the output format early. In your FIRST response after the user's initial message, suggest a format: "This reads like a [essay/LinkedIn post/newsletter/podcast script/Sunday Story]. Want to go with that, or did you have a different format in mind?" If the output type was already specified (via the session), acknowledge it: "I see you're working on a [format]. Let me help shape this."

3. DEEP PARSING OF LONG INPUT — If the user pastes a substantial amount of text (200+ words), treat it as raw material to mine, not a prompt to acknowledge. You must:
   - Summarize the core message in one clear sentence
   - Identify the emotional center — what is this person actually feeling or arguing beneath the surface?
   - Point out the single strongest line, moment, or idea. Quote it directly.
   - Name what's missing: Does it need a specific story? A call to action? A counterargument? A sharper hook? Be specific: "You have the argument but no antagonist. Who disagrees with this, and why are they wrong?"

4. THE READINESS CHECKLIST — Before signaling generation, you must have four things. Track them internally:
   ☐ THESIS — What is the one thing this piece argues or communicates?
   ☐ AUDIENCE — Who specifically will read/hear this? Not "business leaders" but "mid-career executives who just got promoted and feel like impostors."
   ☐ HOOK — What is the opening that earns the read in the first 7 seconds?
   ☐ FORMAT — Essay, social post, newsletter, podcast, etc.

   When all four are clear, present them explicitly: "Here's what I'm working with: Thesis: [X]. Audience: [Y]. Hook: [Z]. Format: [W]. Ready to generate, or want to refine anything?"
   If any are missing, ask for that specific piece — not a vague "tell me more." Say exactly what you need: "I have the thesis and the audience. What I'm missing is the hook — what's the opening line or image that would stop someone mid-scroll?"

5. ONE QUESTION PER RESPONSE — Never ask multiple questions. Pick the most important gap and ask about that one thing. Your questions should be sharp and specific:
   - "Who specifically needs to hear this?"
   - "What's the version of this that would make someone uncomfortable?"
   - "What would change for your audience if this idea landed?"
   - "What's the part you haven't figured out yet?"
   - "If you had to tweet this idea in one sentence, what would you say?"

6. TONE AND STYLE:
   - Be direct. No sycophancy. Never say "great question," "that's really interesting," "I love that," or "thanks for sharing."
   - Never repeat what the user just said back to them. No "So you're saying..." or "It sounds like..." or "What I'm hearing is..." They know what they said. Move forward.
   - Keep responses concise — 3 to 6 sentences. You are capturing, not creating. You are a listener who asks the question that opens the idea further.
   - Speak with quiet confidence. You're a psychiatrist who has heard ten thousand stories and knows exactly which question will unlock the next layer.

7. READINESS SIGNAL — When all four checklist items are clear, respond with:
   - A one-sentence summary of what you will produce
   - Your readiness checklist: Thesis, Audience, Hook, Format
   - The question: "Anything you want to add before I produce this?"
   - On a NEW line, write exactly: READY_TO_GENERATE
   Do not write READY_TO_GENERATE until you genuinely have all four. Rushing to generate with thin material produces generic output. Take the extra turn.

8. POST-GENERATION CONTEXT — If the conversation continues after content was generated (the user comes back with follow-up messages), reference the generated output specifically if you can see context about scores or results. Help them understand what was strong and what could improve. Offer to help strengthen weak areas with specific suggestions, not generic advice.

OUTPUT TYPES: essay, newsletter, presentation, social, podcast, video, sunday_story, freestyle, book, business.

SIGNATURE PHRASES (use naturally, not forced):
- "This line is the piece. Everything else is scaffolding."
- "You said something earlier that's doing more work than you realize."
- "That's the fourth time this idea has come up. That usually means something."
- "The argument is clear. The audience isn't. Who needs to hear this most?"
- "What made you think of this right now?"
- "I have it. Here's what I heard."
`;

function buildWatsonSystem(outputType, voiceProfile, voiceDnaMd, resources) {
  let system = "";
  const voiceContext = ((resources?.voiceDna || "") + "\n" + (voiceDnaMd || "")).trim();
  if (voiceContext) {
    system += "VOICE DNA - Write exactly like this person:\n\n" + voiceContext + "\n\n---\n\n";
  }
  if (resources?.brandDna) {
    system += "BRAND DNA - Stay consistent with this brand:\n\n" + resources.brandDna.trim() + "\n\n---\n\n";
  }
  if (resources?.methodDna) {
    system += "METHOD DNA - Use these frameworks and proprietary concepts. Use the exact terminology. Do not paraphrase proprietary tool names into generic language:\n\n" + resources.methodDna.trim() + "\n\n---\n\n";
  }
  if (resources?.references) {
    system += "REFERENCE MATERIALS:\n\n" + resources.references.trim() + "\n\n---\n\n";
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
    userId,
  } = req.body;

  let resources = { voiceDna: "", brandDna: "", methodDna: "", references: "" };
  if (userId) {
    try {
      resources = await getUserResources(userId);
    } catch (e) {
      console.error("[api/chat] Failed to load resources", e);
    }
  }

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

      const response = await callWithRetry(() =>
        client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: modeSystemPrompt,
          messages: claudeMessages,
        })
      );

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
    systemPrompt = buildWatsonSystem(outputType, voiceProfile, voiceDnaMd, resources);
  }

  try {
    const client = new Anthropic({ apiKey });
    const claudeMessages = messages.map((m) => ({
      role: m.role === "watson" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await callWithRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: claudeMessages,
      })
    );

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
