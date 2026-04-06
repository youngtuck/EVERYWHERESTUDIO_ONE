export const MARKETING_NUMBERS = {
  specialistCount: 40,
  outputFormatCount: 12,
  qualityCheckpoints: 7,
  impactThreshold: 75,
  betterishThreshold: 75, // Legacy alias: v7 renamed Betterish to Impact Score
  voiceDnaTarget: 95,
} as const;

export const APP_VERSION = "Alpha 3.021";

export const REED_STAGE_CHIPS: Record<string, Array<{ label: string; prefill: string }>> = {
  Watch: [
    { label: "Turn signal into brief", prefill: "Turn the strongest signal this week into a content brief for me." },
    { label: "What should I write about?", prefill: "Based on this week's signals, what's the most timely thing for me to write about?" },
    { label: "Who went quiet?", prefill: "Which competitors went quiet this week and what does that mean for my positioning?" },
  ],
  Intake: [
    { label: "Who is my reader?", prefill: "Who is the specific reader for this piece? Help me get precise." },
    { label: "What's the structural problem?", prefill: "What's the real structural problem I'm writing about, not the symptom?" },
    { label: "What should they feel?", prefill: "What do I want the reader to feel when they finish this?" },
    { label: "What's my angle?", prefill: "I have a general topic. Help me find the sharpest angle into it." },
  ],
  Outline: [
    { label: "Does the structure hold?", prefill: "Read my outline and tell me if the structure holds. Where is the logic weakest?" },
    { label: "Sharpen my hook", prefill: "How can I sharpen the opening hook? What's the strongest way to start this?" },
    { label: "Is the close strong?", prefill: "Does my closing section deliver on what the hook promised?" },
    { label: "What's missing?", prefill: "What's the one thing this outline is missing that would make it significantly stronger?" },
  ],
  Edit: [
    { label: "Tighten to 700", prefill: "This piece is running long. Cut to 700 words without losing the argument. Show me what to remove." },
    { label: "Find my weakest sentence", prefill: "Find the single weakest sentence in this draft and tell me why it's weak." },
    { label: "Fix passive voice", prefill: "Find every passive construction and rewrite them as active voice." },
    { label: "Make the opening hit harder", prefill: "Rewrite the opening paragraph to hit harder. Keep my voice." },
  ],
  Review: [
    { label: "Fix the humanization flag", prefill: "Paragraph 4 has a humanization flag. Rewrite it to feel more specific and personal." },
    { label: "Final read", prefill: "Do a final read of this piece as an adversarial editor. What would make someone stop reading?" },
    { label: "Write the pull quote", prefill: "Pull the single most quotable line from this piece for social." },
    { label: "Is this ready to publish?", prefill: "Is this ready to publish? Give me your honest assessment." },
  ],
  Wrap: [
    { label: "Adapt for podcast", prefill: "Adapt this piece into a podcast script. Natural spoken language, same argument." },
    { label: "Write the LinkedIn post", prefill: "Write the LinkedIn version of this piece. 150 words, punchy opening." },
    { label: "Write the email subject line", prefill: "Write 3 subject line options for the newsletter version of this piece." },
    { label: "What else can I make from this?", prefill: "What other content can I extract or adapt from this piece?" },
  ],
};

export const OUTPUT_TYPES = {
  content: {
    label: "Content",
    description: "Single-session outputs that build your reputation, audience, and authority over time.",
    types: [
      { id: "essay", name: "Essay", format: ".md / .html", shortDesc: "Long-form writing that establishes your thinking on a subject." },
      { id: "podcast", name: "Podcast", format: ".md", shortDesc: "Scripted audio show in any format: solo, two hosts, interview, or panel." },
      { id: "video_script", name: "Video Script", format: ".md", shortDesc: "Scripts built for the platform. The algorithm decides in the first three seconds." },
      { id: "email", name: "Email", format: "Plain text", shortDesc: "Any email, any purpose. 2 to 3 strategic variants, each aimed at a different outcome." },
    ],
  },
  social: {
    label: "Social Media",
    description: "Content built for the interest graph. Each platform has its own rules.",
    types: [
      { id: "linkedin", name: "LinkedIn Post", format: "Plain text", shortDesc: "Short-form professional post built for the interest graph." },
      { id: "x_post", name: "X Post", format: "Plain text", shortDesc: "A short, sharp take built for speed and signal. 280 characters." },
      { id: "social_post", name: "Social Post", format: "Plain text", shortDesc: "Content adapted for Instagram, Facebook, or other platforms." },
    ],
  },
  business: {
    label: "Business",
    description: "Single-session structured documents for the normal course of business.",
    types: [
      { id: "presentation", name: "Presentation", format: ".html / .pdf", shortDesc: "A slide narrative built around what the audience needs to believe." },
      { id: "proposal", name: "Proposal", format: ".html / .pdf", shortDesc: "A document that makes the client feel understood before it asks for anything." },
      { id: "one_pager", name: "One-Pager", format: ".html / .pdf", shortDesc: "One page, one idea, one ask. The hardest document to write well." },
      { id: "report", name: "Report", format: ".pdf / .html", shortDesc: "Structured findings that enable a decision." },
      { id: "executive_summary", name: "Executive Summary", format: ".pdf / .html", shortDesc: "A standalone argument for a decision-maker. Not a shortened version." },
      { id: "case_study", name: "Case Study", format: ".html / .pdf", shortDesc: "Proof that you deliver. A story about what changed." },
      { id: "sow", name: "Statement of Work", format: ".pdf", shortDesc: "Specific, unambiguous commitments: what, when, and out of scope." },
      { id: "meeting", name: "Meeting Agenda / Recap", format: ".md / .html", shortDesc: "Pre-meeting structure or post-meeting record of what matters." },
      { id: "bio", name: "Bio / Speaker Profile", format: "Plain text", shortDesc: "All four lengths in one session plus a speaker introduction." },
      { id: "white_paper", name: "White Paper", format: ".html / .pdf", shortDesc: "Your longest bet on your own thinking. A position backed by evidence." },
    ],
  },
  extended: {
    label: "Extended",
    description: "Built across multiple sessions. Each session adds to something larger.",
    types: [
      { id: "book", name: "Book", format: ".md per chapter", shortDesc: "Your most ambitious output. A project, not a single session." },
      { id: "website", name: "Website", format: ".md / .html", shortDesc: "A full website built page by page, each page its own session." },
      { id: "newsletter", name: "Newsletter", format: ".html", shortDesc: "A recurring publication. Each issue is its own session." },
    ],
  },
  freestyle: {
    label: "Freestyle",
    description: "When what you need does not fit a category.",
    types: [
      { id: "freestyle", name: "Freestyle", format: "Varies", shortDesc: "You describe it, Reed builds it. Same quality standards." },
    ],
  },
};
