/**
 * Human Voice Test (HVT) types and utilities.
 *
 * The HVT is the final quality gate. It simulates a skeptical reader
 * scanning for AI tells across 8 detection vectors: Rhythm, Transitions,
 * Structure, Register, Construction, Contractions, Fragment Pairs, Close.
 *
 * The Approve button cannot activate until HVT verdict is PASSES.
 * HVT cannot be disabled on any template, any output type, ever.
 */

export interface HVTFlaggedLine {
  lineIndex: number;
  original: string;
  issue: string;   // e.g. "Mechanical transition", "AI-pattern parallel structure"
  vector: string;  // Which of the 8 detection vectors triggered it
  suggestion: string;
}

export interface HVTResult {
  verdict: "PASSES" | "NEEDS_WORK";
  flaggedLines: HVTFlaggedLine[];
  attemptNumber: number;
  score: number; // 0-100
  feedback: string;
}

/**
 * Parse a gate-7 (Human Voice Test) checkpoint result into a structured HVTResult.
 * The gate returns JSON with status, score, feedback, and issues (flagged lines).
 */
export function parseHVTFromGateResult(
  gateResult: { status: string; score: number; feedback: string; issues?: string[] },
  attemptNumber: number
): HVTResult {
  const verdict: HVTResult["verdict"] =
    gateResult.status === "PASS" ? "PASSES" : "NEEDS_WORK";

  // Parse flagged lines from the feedback field.
  // The gate-7 prompt returns feedback like:
  //   "TOTAL FLAGS: 3\n[quoted line] | [vector] | [reason] | [rewrite]\n..."
  const flaggedLines: HVTFlaggedLine[] = [];

  if (gateResult.issues && gateResult.issues.length > 0) {
    gateResult.issues.forEach((line, i) => {
      // Try to parse structured feedback entries from the feedback text
      const entry = extractFlagEntry(gateResult.feedback, line, i);
      flaggedLines.push(entry);
    });
  }

  return {
    verdict,
    flaggedLines,
    attemptNumber,
    score: gateResult.score,
    feedback: gateResult.feedback,
  };
}

/**
 * Extract a structured flag entry from the feedback text for a given flagged line.
 */
function extractFlagEntry(
  feedback: string,
  flaggedLine: string,
  index: number
): HVTFlaggedLine {
  // Try to find the vector and suggestion from the feedback text
  // Feedback format: "[quoted line] | [vector] | [reason] | [rewrite]"
  const escaped = flaggedLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linePattern = new RegExp(
    escaped.slice(0, 40) + "[^|]*\\|\\s*([^|]+)\\|\\s*([^|]+?)(?:\\|\\s*(.+))?$",
    "mi"
  );
  const match = feedback.match(linePattern);

  // Detection vectors for classification
  const vectors = [
    "Rhythm", "Transitions", "Structure", "Register",
    "Construction", "Contractions", "Fragment Pairs", "Close",
  ];

  let vector = "Construction";
  let issue = "Reads as generated rather than written";
  let suggestion = "";

  if (match) {
    vector = match[1]?.trim() || vector;
    issue = match[2]?.trim() || issue;
    suggestion = match[3]?.trim() || "";
  } else {
    // Try to classify by known patterns
    const lower = flaggedLine.toLowerCase();
    if (/alongside that|threaded through|with that in mind|that said|it's worth noting|building on that|stepping back|zooming out|taken together|beyond that/.test(lower)) {
      vector = "Transitions";
      issue = "AI-pattern transition phrase";
    } else if (/not as .+\. as .+|this isn't about .+\. it's about/.test(lower)) {
      vector = "Fragment Pairs";
      issue = "Fragment pair construction, a reliable generation tell";
    }
  }

  return {
    lineIndex: index,
    original: flaggedLine,
    issue,
    vector,
    suggestion,
  };
}

/**
 * Maximum HVT rerun attempts before showing structural rewrite message.
 */
export const HVT_MAX_ATTEMPTS = 3;

/**
 * Message shown after max HVT failures.
 */
export const HVT_STRUCTURAL_MESSAGE =
  "Voice issues are structural. Consider a full rewrite.";
