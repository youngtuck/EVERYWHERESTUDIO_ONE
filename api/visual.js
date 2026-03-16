/**
 * Visual Intelligence — Gemini image generation proxy.
 * POST body: { content, title, author, context, vibe, brandColors, voiceStyle }
 * Returns: { success: true, image: base64, mimeType } or { success: false, error }
 * Env: GEMINI_API_KEY (required). Optional: GEMINI_MODEL (default: gemini-2.5-flash-image).
 * If your key has access to an image-generation model, set GEMINI_MODEL to its ID (e.g. from AI Studio).
 * For long runs, set maxDuration to 60s for this function in Vercel.
 */

const VIBES = {
  Sketchbook: {
    label: "Sketchbook",
    prompt: `Loose hand-drawn sketchnote on cream textured notebook paper, 16:9 landscape. Casual watercolor marker swatches behind headers. Uneven hand-lettered text, wobbly arrows, organic doodle icons. 3-4 vertical columns. Warm notebook vibe. Professional enough for LinkedIn but genuinely human and imperfect. Yellow title banner, colorful section headers, hand-drawn bullet points with small relevant icons next to each.`,
  },
  Blueprint: {
    label: "Blueprint",
    prompt: `Technical blueprint-style information design on aged blue drafting paper, 16:9 landscape. White and light-blue ink only. Grid lines visible underneath. Content organized in precise rectangular zones with technical labels. Drafting compass and ruler aesthetic. Section headers in stencil-style uppercase. Connecting lines between related concepts. Small precise technical icons. Feels like an engineer's planning document. Cross-hatching for emphasis areas.`,
  },
  Poster: {
    label: "Poster",
    prompt: `Bold editorial poster design, 16:9 landscape. Stark contrast, strong typographic hierarchy. One dominant headline taking up top third in massive bold type. Content below in clean structured zones separated by thick rules. Risograph print aesthetic — slightly misaligned colors, textured fills. Two or three strong accent colors max. Icon-forward: one large illustrative icon per section. Feels like a conference keynote poster or vintage propaganda poster reinterpreted for business.`,
  },
  FieldNotes: {
    label: "Field Notes",
    prompt: `Scientist's field notebook, 16:9 landscape. Cream ruled paper with red margin line on left. Dense handwritten observations in small neat script. Content structured like research notes — numbered observations, asterisked insights, bracketed asides. Tiny precise diagrams and specimen-style illustrations. Margin annotations pointing to key insights. Underlines and circles in red pen for emphasis. Feels like Darwin's notebook or a researcher's active working document. Minimal color — black ink, red pen, occasional yellow highlight.`,
  },
  Storyboard: {
    label: "Storyboard",
    prompt: `Cinematic storyboard panels, 16:9 landscape. 6 sequential comic-style panels in a 3x2 grid, each with a scene that illustrates one key idea. Black ink on white with subtle wash tones. Each panel has a caption below in typewriter font. Narrative flow — panels tell the story of the content from problem to solution. Simple expressive character sketches where appropriate. Panel borders are hand-drawn, slightly imperfect. Feels like a film pre-production document or graphic novel. Bold title above the panel grid.`,
  },
  Boardroom: {
    label: "Boardroom",
    prompt: `McKinsey-style executive consulting slide, 16:9 landscape. Clean white background. No hand-drawn elements whatsoever. Structured grid layout with clear visual hierarchy. Content organized into 3-4 precise rectangular zones with thin rule borders. Each zone has a bold sans-serif header in navy or dark gray, followed by concise bullet points in neutral type. One simple data visualization or structured diagram. Muted professional palette: deep navy, warm gray, cool white, single accent color in slate blue or burgundy. Typography feels like Helvetica or Gill Sans. Small numbered footnotes at bottom. Feels like it came out of a $500K consulting engagement. Zero personality, maximum authority.`,
  },
};

function buildPrompt(content, vibe, title, author, context, brandColors, voiceStyle) {
  const vibeConfig = VIBES[vibe] || VIBES.Sketchbook;

  let prompt = vibeConfig.prompt + "\n\n";
  prompt += `Top banner with bold title: "${title}".\n`;
  prompt += `Byline: "${author}" in smaller text.\n`;
  prompt += `Context: "${context}".\n\n`;
  prompt += `Content to visualize (organize into 3-4 sections with headers, bullets, and relevant icons):\n`;
  prompt += (content || "").slice(0, 2000) + "\n\n";

  if (brandColors) {
    prompt += `Use these brand colors throughout: ${brandColors}.\n`;
  }
  if (voiceStyle) {
    prompt += `The tone should reflect: ${voiceStyle}.\n`;
  }

  prompt += `\nVery small footer bottom-right: "EVERYWHERE Studio" in subtle text.\n`;
  prompt += `All text in the image must be spelled correctly. No typos. No gibberish. Every word must be real and readable.`;

  return prompt;
}

const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash-exp",
].filter(Boolean);

// Two request formats to try per model
const REQUEST_FORMATS = [
  {
    name: "responseModalities",
    buildBody: (prompt) => ({
      contents: [{ role: "user", parts: [{ text: "Generate an image: " + prompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      },
    }),
  },
  {
    name: "response_mime_type",
    buildBody: (prompt) => ({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "image/png",
      },
    }),
  },
];

function extractImage(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data && (part.inlineData.mimeType || "").startsWith("image/")) {
      return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[api/visual] GEMINI_API_KEY not set");
    return res.status(503).json({
      success: false,
      error: "Visual Intelligence is being configured. GEMINI_API_KEY not set.",
      setup: "Add GEMINI_API_KEY to Vercel environment variables from https://aistudio.google.com/apikey"
    });
  }

  const {
    content = "",
    title = "",
    author = "EVERYWHERE Studio",
    context = "",
    vibe = "Sketchbook",
    brandColors = null,
    voiceStyle = null,
  } = req.body || {};

  const prompt = buildPrompt(content, vibe, title, author, context, brandColors, voiceStyle);

  let lastError = null;

  for (const model of MODELS) {
    for (const format of REQUEST_FORMATS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);
        console.log(`[api/visual] Trying model: ${model}, format: ${format.name}`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body = JSON.stringify(format.buildBody(prompt));

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[api/visual] ${model}/${format.name} HTTP ${response.status}:`, errText);
          let message = `Gemini API error (${model}/${format.name}): ${response.status}`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson?.error?.message) message = errJson.error.message;
          } catch (_) {}
          lastError = message;
          continue;
        }

        const data = await response.json();
        console.log(`[api/visual] ${model}/${format.name} response keys:`, JSON.stringify(Object.keys(data)));

        const result = extractImage(data);
        if (result) {
          console.log(`[api/visual] Success with ${model}/${format.name}`);
          return res.status(200).json({ success: true, image: result.imageBase64, mimeType: result.mimeType });
        }

        // Log full response structure for debugging
        const candidateKeys = data?.candidates?.[0]?.content?.parts?.map(p => Object.keys(p)) || [];
        console.log(`[api/visual] ${model}/${format.name} no image found. Part keys:`, JSON.stringify(candidateKeys));
        lastError = `Model ${model}/${format.name} returned no image data`;
        continue;
      } catch (err) {
        lastError = err.name === "AbortError" ? `Timeout with ${model}/${format.name}` : (err.message || "Failed");
        console.error(`[api/visual] ${lastError}`);
        continue;
      }
    }
  }

  return res.status(502).json({
    success: false,
    error: lastError || "No image generated. Try a different style or shorter content.",
    modelsAttempted: MODELS,
  });
}
