import Anthropic from "@anthropic-ai/sdk";
import { getUserResources } from "./_resources.js";
import { callWithRetry } from "./_retry.js";
import fs from "fs";
import path from "path";

function loadPrompt(filename) {
  const paths = [
    path.join(process.cwd(), "src", "lib", "agents", "prompts", filename),
    path.join("/var/task", "src", "lib", "agents", "prompts", filename),
  ];
  if (typeof __dirname !== "undefined") {
    paths.push(path.join(__dirname, "..", "src", "lib", "agents", "prompts", filename));
  }
  for (const p of paths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      if (content) return content;
    } catch {}
  }
  return null;
}

const FORMAT_INSTRUCTIONS = {
  LinkedIn: {
    platformSpec: "LinkedIn",
    system: `You are adapting content for LinkedIn. You are Dmitri Wells, platform optimization specialist.

LINKEDIN RULES (non-negotiable):
- Maximum 3,000 characters total
- First line is CRITICAL: must function as a complete hook before the "see more" break at ~210 characters. This first line alone determines whether anyone reads further. It must create enough tension or curiosity that a busy executive stops scrolling.
- Short paragraphs: 2-4 lines maximum. LinkedIn rewards white space. Walls of text are algorithmically penalized and abandoned by readers.
- NO markdown formatting. LinkedIn does not render markdown. Asterisks and pound signs appear as literal characters. Strip all markdown.
- NO links in the post body (they suppress organic reach). If the draft references URLs, note them in a comment suggestion at the end.
- Single line break between short paragraphs. Double line break for major section transitions.
- End with a question that invites genuine response, not a generic CTA.
- 3-5 relevant hashtags at the very end, separated from the body by a double line break.
- The voice must match the Voice DNA exactly. LinkedIn is personal-professional, not corporate.
- Do NOT add "What do you think?" or other generic engagement bait. Write a specific, interesting question that comes from the content.

OUTPUT FORMAT: Return ONLY the adapted LinkedIn post. No commentary. No "Here's your LinkedIn post:" header. Just the post, ready to paste into LinkedIn.`,
  },

  Newsletter: {
    platformSpec: "Substack",
    system: `You are adapting content for a Substack newsletter. You are Dmitri Wells, platform optimization specialist.

NEWSLETTER RULES (non-negotiable):
- Open with a direct address to the reader. Newsletter subscribers expect personal connection. One sentence that makes them feel like this was written for them specifically.
- SEO title: keyword-rich, clear about the specific topic, structured for discovery. This goes in the subject line field.
- Email subject line: optimized for open rate. Curiosity gap, specificity, or personal relevance. Keep under 50 characters for mobile display.
- Preview text: 80-140 characters that complete the subject line's thought, not repeat it.
- Longer paragraphs are acceptable here (unlike LinkedIn), but every paragraph must earn its length.
- Include one "quotable passage" that works out of context for restacking/sharing.
- Use subheadings (## in markdown) to create scannable structure.
- End with a single clear CTA, not multiple competing ones.
- The voice must match the Voice DNA. Newsletters reward personality and point of view more than any other format.

OUTPUT FORMAT: Return the adapted newsletter in this exact structure:
SUBJECT: [email subject line, under 50 chars]
PREVIEW: [preview text, 80-140 chars]
SEO_TITLE: [SEO-optimized title]
---
[newsletter body in markdown]`,
  },

  Podcast: {
    platformSpec: "Podcast",
    system: `You are adapting content into a podcast script. You are Dmitri Wells, platform optimization specialist, working with Felix Rossi on audio production.

PODCAST SCRIPT RULES (non-negotiable):
- This is SPOKEN content. Every sentence must sound natural when read aloud. If a sentence would make someone stumble while reading it into a microphone, rewrite it.
- Structure: OPEN (warm, conversational hook, 2-3 sentences), HOOK (the core tension/question of the episode), BODY (the substance, broken into 2-4 segments), CLOSE (personal reflection + question for listeners).
- Conversational transitions, not written transitions. "So here is the thing" works. "Furthermore" does not. "And look," works. "Additionally" does not.
- Use contractions aggressively. "I've" not "I have." "It's" not "It is." "Don't" not "Do not." Spoken language contracts.
- Shorter sentences than written content. Spoken language has more periods and fewer semicolons.
- Include [PAUSE] markers where a natural beat should occur for emphasis.
- Include [SEGMENT BREAK] markers between major topic shifts.
- Episode title: front-load the searchable topic. Under 60 characters.
- No hashtags, no links, no visual formatting. This is audio.

OUTPUT FORMAT: Return the adapted script in this exact structure:
EPISODE_TITLE: [title, under 60 chars]
SHOW_NOTES: [200-300 words for podcast platform description]
---
[OPEN]
[script text]

[HOOK]
[script text]

[BODY]
[script text with SEGMENT BREAK markers between sections]

[CLOSE]
[script text]`,
  },

  "Sunday Story": {
    platformSpec: "Substack",
    system: `You are adapting content into a Sunday Story. You are Dmitri Wells, working with the full editorial team.

SUNDAY STORY RULES (non-negotiable):
- This is the flagship format. It is a personal essay that reads like the best thing in someone's inbox that week.
- The Sunday Story is narrative, not instructional. It tells a story that contains an insight, rather than teaching a lesson that uses a story.
- Open with a scene, an image, or a moment. Not a thesis statement. Not "I have been thinking about..." Start in the middle of something happening.
- Longer form: 800-1500 words. This format earns its length through narrative pull, not information density.
- Paragraph rhythm matters more here than in any other format. Vary paragraph length deliberately. A one-sentence paragraph after a long one creates emphasis. Three medium paragraphs in a row creates flow. Use this.
- The insight should emerge from the story, not be bolted onto it. The reader should feel like they discovered something, not like they were told something.
- End with an image or a moment that echoes the opening, not with a CTA or a lesson summary. The best Sunday Stories land like a closing chord.
- Subheadings are optional and should be used sparingly if at all. This is not a listicle.
- The voice must be the most personal, most human version of the Voice DNA. This format rewards vulnerability and specificity.

OUTPUT FORMAT: Return the adapted Sunday Story in this exact structure:
TITLE: [evocative title, not a keyword title]
SUBTITLE: [one sentence that sets the mood without spoiling the insight]
---
[story body in markdown, no section headers unless absolutely necessary]`,
  },
};

function sanitizeContent(text) {
  if (!text) return text;
  let result = text.replace(/\s*\u2014\s*/g, ", ");
  result = result.replace(/\s+\u2013\s+/g, ", ");
  result = result.replace(/, ,/g, ",").replace(/,\./g, ".").replace(/,\s*,/g, ",");
  return result;
}

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { draft, format, voiceDnaMd, brandDnaMd, userId } = req.body || {};
  if (!draft) return res.status(400).json({ error: "draft is required" });
  if (!format) return res.status(400).json({ error: "format is required" });

  const formatConfig = FORMAT_INSTRUCTIONS[format];
  if (!formatConfig) {
    return res.status(400).json({ error: `Unknown format: ${format}` });
  }

  let resources = { voiceDna: "", brandDna: "", methodDna: "", references: "" };
  if (userId) {
    try {
      resources = await getUserResources(userId);
    } catch (e) {
      console.error("[adapt-format] Failed to load resources", e);
    }
  }

  const dmitriSpec = loadPrompt("dmitri-platform.md") || "";

  let system = formatConfig.system;

  const voiceDna = voiceDnaMd || resources.voiceDna;
  if (voiceDna) {
    system += `\n\nVOICE DNA (ACTIVE CONSTRAINT, write in this voice from the first word):\n${voiceDna.slice(0, 3000)}`;
  }

  const brandDna = brandDnaMd || resources.brandDna;
  if (brandDna) {
    system += `\n\nBRAND DNA:\n${brandDna.slice(0, 1500)}`;
  }

  const platformSection = dmitriSpec.split(`### ${formatConfig.platformSpec}`)[1];
  if (platformSection) {
    const nextSection = platformSection.indexOf("\n### ");
    const relevantSpec = nextSection > 0 ? platformSection.slice(0, nextSection) : platformSection.slice(0, 2000);
    system += `\n\nPLATFORM SPECIFICATIONS (from Dmitri Wells, platform optimization specialist):\n${relevantSpec.slice(0, 2000)}`;
  }

  system += "\n\nCRITICAL FORMATTING RULE: Never use em-dashes (the long dash character) anywhere in your output. Use commas, periods, colons, or semicolons instead. This is non-negotiable.";

  const userContent = `ORIGINAL DRAFT TO ADAPT:\n\n${draft.slice(0, 8000)}\n\nAdapt this draft for ${format}. Follow all platform rules. Preserve the author's voice. Output only the adapted content in the specified format.`;

  console.log(`[adapt-format] Adapting for ${format} (draft: ${draft.length} chars)`);
  const startTime = Date.now();

  try {
    const client = new Anthropic({ apiKey });
    const response = await callWithRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userContent }],
      }),
      1
    );

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const sanitized = sanitizeContent(text);
    const duration = Date.now() - startTime;

    console.log(`[adapt-format] ${format} complete (${duration}ms, ${sanitized.length} chars)`);

    let metadata = {};
    let body = sanitized;

    if (format === "Newsletter") {
      const subjectMatch = sanitized.match(/^SUBJECT:\s*(.+)$/m);
      const previewMatch = sanitized.match(/^PREVIEW:\s*(.+)$/m);
      const seoMatch = sanitized.match(/^SEO_TITLE:\s*(.+)$/m);
      const bodyStart = sanitized.indexOf("---");
      if (subjectMatch) metadata.subject = subjectMatch[1].trim();
      if (previewMatch) metadata.preview = previewMatch[1].trim();
      if (seoMatch) metadata.seoTitle = seoMatch[1].trim();
      if (bodyStart > 0) body = sanitized.slice(bodyStart + 3).trim();
    }

    if (format === "Podcast") {
      const titleMatch = sanitized.match(/^EPISODE_TITLE:\s*(.+)$/m);
      const notesMatch = sanitized.match(/^SHOW_NOTES:\s*([\s\S]*?)(?=^---)/m);
      const bodyStart = sanitized.lastIndexOf("---");
      if (titleMatch) metadata.episodeTitle = titleMatch[1].trim();
      if (notesMatch) metadata.showNotes = notesMatch[1].trim();
      if (bodyStart > 0) body = sanitized.slice(bodyStart + 3).trim();
    }

    if (format === "Sunday Story") {
      const titleMatch = sanitized.match(/^TITLE:\s*(.+)$/m);
      const subtitleMatch = sanitized.match(/^SUBTITLE:\s*(.+)$/m);
      const bodyStart = sanitized.indexOf("---");
      if (titleMatch) metadata.title = titleMatch[1].trim();
      if (subtitleMatch) metadata.subtitle = subtitleMatch[1].trim();
      if (bodyStart > 0) body = sanitized.slice(bodyStart + 3).trim();
    }

    return res.status(200).json({
      format,
      content: body,
      metadata,
      durationMs: duration,
    });
  } catch (err) {
    console.error(`[adapt-format] ${format} FAILED:`, err.message);
    return res.status(500).json({
      error: `Adaptation failed for ${format}`,
      fallback: true,
    });
  }
}
