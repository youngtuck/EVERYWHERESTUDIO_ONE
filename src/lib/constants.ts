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
