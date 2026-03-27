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

  const {
    conversationSummary = "",
    outputType = "freestyle",
    voiceProfile = null,
    outline = null,
    thesis = "",
    revisionNotes = "",
    originalDraft = "",
    edits = null,
  } = req.body;

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

    // Add outline to system prompt if provided
    if (outline && Array.isArray(outline) && outline.length > 0) {
      system += "\n\nSTRUCTURE TO FOLLOW (write each section in order):\n";
      outline.forEach((section, i) => {
        system += `\nSection ${i + 1}: ${section.section}\n`;
        if (section.beats && section.beats.length > 0) {
          system += "Key points to hit:\n";
          section.beats.forEach(beat => {
            system += `- ${beat}\n`;
          });
        }
        if (section.purpose) {
          system += `Purpose: ${section.purpose}\n`;
        }
      });
    }

    if (thesis) {
      system += `\n\nCORE THESIS (this is the one thing the piece argues): ${thesis}\n`;
    }

    // Build the user message based on mode: outline-based, revision, or standard
    let userContent;
    if (revisionNotes || originalDraft) {
      // Revision mode: surgical editing with voice preservation
      system = `You are a surgical editor. You are revising an existing draft.

ABSOLUTE RULES:
1. PRESERVE THE AUTHOR'S VOICE. Do not change the tone, style, or personality. If the original is personal and reflective, the revision must be personal and reflective. If it's casual, keep it casual.
2. DO NOT ADD NEW CONCEPTS, FRAMEWORKS, PRODUCTS, OR BRAND NAMES that don't exist in the original. If a framework name doesn't appear in the original, don't add it.
3. DO NOT EXPAND. If the original is 800 words, the revision should be approximately 800 words. Revision means fixing, not growing.
4. DO NOT SHIFT THE REGISTER. If the original is a personal essay, don't turn it into a white paper. If it's a story, don't turn it into a pitch deck.
5. ONLY FIX WHAT WAS FLAGGED. Read the revision notes carefully. Fix those specific issues. Leave everything else untouched.
6. If the revision notes say "fix repetition," CUT the redundant sections. Don't rephrase them.
7. If the revision notes say "source claims," either add a credible source or soften the claim to "some research suggests" or remove it. Do NOT invent sources.
8. NEVER add consulting language, sales copy, or strategic frameworks unless they existed in the original.

YOUR JOB: Make the minimum changes necessary to address the specific feedback. A good revision is one where a reader can barely tell what changed, but the flagged issues are gone.

CRITICAL FORMATTING RULE: Never use em-dashes (the long dash character) anywhere in your output. Use commas, periods, colons, or semicolons instead.

Output ONLY the complete revised draft. No commentary, no explanation.`;

      if (resources.voiceDna) {
        system += "\n\nVOICE DNA - The revision MUST match this voice:\n" + resources.voiceDna;
      }

      let revisionParts = [`ORIGINAL DRAFT:\n${originalDraft.slice(0, 8000)}`];
      if (edits && Array.isArray(edits) && edits.length > 0) {
        revisionParts.push(`\nUSER EDITS (apply these exactly, do not blend or paraphrase):\n${edits.map(e => `Paragraph ${e.paragraphIndex}: ${e.newText}`).join("\n")}`);
      }
      if (revisionNotes.trim()) {
        revisionParts.push(`\nREVISION NOTES:\n${revisionNotes}`);
      }
      userContent = revisionParts.join("\n\n");
    } else if (outline && Array.isArray(outline) && outline.length > 0) {
      // Outline-based generation: follow the beat sheet
      const outlineText = outline.map((s, i) => `Section ${i + 1}: ${s.section}\nBeats: ${(s.beats || []).join("; ")}\nPurpose: ${s.purpose || ""}`).join("\n\n");
      userContent = `Conversation summary:\n${conversationSummary}\n\n${thesis ? `Thesis: ${thesis}\n\n` : ""}Outline (follow this structure section by section, hit every beat):\n${outlineText}\n\nProduce the ${outputType} now. Follow the outline exactly.`;
    } else {
      // Standard generation
      userContent = `Conversation summary:\n${conversationSummary}\n\nProduce the ${outputType} now.`;
    }

    const response = await callWithRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userContent }],
      })
    );

    const content = sanitizeContent(response.content?.[0]?.type === "text" ? response.content[0].text : "");

    let gates = null;
    let score = 900;
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
