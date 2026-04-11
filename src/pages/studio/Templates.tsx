import { useState } from "react";

const FONT = "var(--font)";

interface SystemTemplate {
  name: string;
  base: string;
  description: string;
  format: string;
  sections: string[];
  reedInterview?: string[];
  designSpec?: {
    width: string;
    headerBg: string;
    frameBorder: string;
    frameBg: string;
    stopBar: { bg: string; accent: string };
  };
}

const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    name: "The Edition",
    base: "Newsletter",
    description: "A recurring publication format with editorial identity. Built for Substack, Beehiiv, or ConvertKit. Subject line and preview text included.",
    format: ".html",
    sections: ["Opening", "Body", "Close", "Subject Line", "Preview Text"],
  },
  {
    name: "Sunday Story",
    base: "Essay",
    description: "A weekly personal essay with narrative structure. Sensory opening, reflective middle, purposeful close. Built for weekend reading.",
    format: ".html",
    sections: ["Opening Image", "Body", "Stakes", "Close"],
  },
  {
    name: "Session Brief",
    base: "Business",
    description: "A post-session summary capturing what was discussed, what was decided, and what comes next. Auto-generated from any Work session.",
    format: ".md",
    sections: ["Frame", "Key Decisions", "Open Items", "Next Steps"],
  },
  {
    name: "Executive Brief",
    base: "Business",
    description: "A standalone decision document for a principal. Not a summary of the full report. Works on its own. One to two pages maximum.",
    format: ".pdf / .html",
    sections: ["Decision Required", "Context", "Recommendation", "Risk"],
  },
  {
    name: "Release Brief",
    base: "Business",
    description: "A post-build document that captures what changed, why it matters, and what comes next. Three audiences: partners, developers, and principals. Not a changelog. A positioning document that contains technical detail.",
    format: ".html",
    sections: ["Frame", "Partner: Why It Matters", "Partner: Partner Update", "Developer: What Changed", "Developer: What to Test", "What's Next"],
    reedInterview: [
      "Start with what changed.",
      "Who needs to act on it, and what do they need to do?",
      "What is the one thing they need to know before they open the file?",
    ],
    designSpec: {
      width: "840px",
      headerBg: "#0D1B2A",
      frameBorder: "4px solid #4A90D9",
      frameBg: "rgba(74,144,217,0.06)",
      stopBar: { bg: "#0D1B2A", accent: "#F5C642" },
    },
  },
  {
    name: "Signal Sweep",
    base: "Social",
    description: "A LinkedIn post format built from Watch signals. Surfaces one category insight and frames it as a timely take. Built for the interest graph.",
    format: "Plain text",
    sections: ["Hook", "Signal", "Take", "Close"],
  },
];

/** User-created templates (persisted per user when backend is wired). New accounts start empty. */
const USER_TEMPLATES: Array<{ name: string; base: string; modified: boolean }> = [];

export default function Templates() {
  const [selected, setSelected] = useState<number | null>(null);
  const [section, setSection] = useState<"system" | "yours">("system");

  const selectedSystem = section === "system" && selected !== null ? SYSTEM_TEMPLATES[selected] : null;

  return (
    <div style={{ display: "flex", flex: 1, height: "100%", overflow: "hidden" }}>
      {/* Left list (44%) */}
      <div style={{ width: "44%", borderRight: "1px solid var(--glass-border)", overflowY: "auto", padding: "8px 0" }}>
        {/* SYSTEM */}
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, color: "var(--fg-3)",
          padding: "8px 16px 4px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          System
          <span style={{
            fontSize: 8, fontWeight: 500, letterSpacing: 0,
            textTransform: "none" as const, color: "var(--fg-3)",
            background: "var(--glass-surface)", borderRadius: 3, padding: "1px 6px",
          }}>Read only</span>
        </div>
        {SYSTEM_TEMPLATES.map((t, i) => (
          <div
            key={`sys-${i}`}
            onClick={() => { setSelected(i); setSection("system"); }}
            style={{
              padding: "8px 16px", cursor: "pointer",
              background: section === "system" && selected === i ? "rgba(74,144,217,0.06)" : "transparent",
              borderLeft: section === "system" && selected === i ? "2px solid var(--blue, #4A90D9)" : "2px solid transparent",
              transition: "all 0.1s",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 1 }}>Based on {t.base} · {t.format}</div>
          </div>
        ))}

        <div style={{ height: 1, background: "var(--glass-border)", margin: "8px 0" }} />

        {/* YOURS */}
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, color: "var(--fg-3)",
          padding: "4px 16px 4px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          Yours
          <span style={{
            fontSize: 8, fontWeight: 500, letterSpacing: 0,
            textTransform: "none" as const, color: "var(--blue, #4A90D9)",
            background: "rgba(74,144,217,0.08)", borderRadius: 3,
            padding: "1px 6px", cursor: "pointer",
          }}>+ New</span>
        </div>
        {USER_TEMPLATES.length === 0 ? (
          <div style={{ padding: "10px 16px 12px", fontSize: 11, color: "var(--fg-3)", lineHeight: 1.45 }}>
            No custom templates yet. Use + New when you are ready to build one from a system template or from scratch.
          </div>
        ) : (
          USER_TEMPLATES.map((t, i) => (
            <div
              key={`usr-${i}`}
              onClick={() => { setSelected(i); setSection("yours"); }}
              style={{
                padding: "8px 16px", cursor: "pointer",
                background: section === "yours" && selected === i ? "rgba(74,144,217,0.06)" : "transparent",
                borderLeft: section === "yours" && selected === i ? "2px solid var(--blue, #4A90D9)" : "2px solid transparent",
                transition: "all 0.1s",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{t.name}</div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 1 }}>
                Based on {t.base} {t.modified ? "· Modified" : ""}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right pane (56%) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* System template detail view */}
          {selectedSystem ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>{selectedSystem.name}</div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                color: "var(--fg-3)", background: "var(--glass-surface)", padding: "2px 8px", borderRadius: 3,
                display: "inline-block", marginBottom: 16,
              }}>Supplied Template</span>
              <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 20 }}>
                {selectedSystem.description}
              </div>

              {/* SECTIONS */}
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Sections</div>
              <div style={{ marginBottom: 20 }}>
                {selectedSystem.sections.map((sec, i) => (
                  <div key={i} style={{
                    padding: "6px 0", borderBottom: "1px solid var(--glass-border)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold, #F5C642)", minWidth: 16 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--fg)" }}>{sec}</span>
                  </div>
                ))}
              </div>

              {/* REED INTERVIEW (if present) */}
              {selectedSystem.reedInterview && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Reed Interview</div>
                  <div style={{ marginBottom: 20 }}>
                    {selectedSystem.reedInterview.map((q, i) => (
                      <div key={i} style={{
                        fontSize: 11, color: "var(--fg-2)", lineHeight: 1.5,
                        padding: "6px 0 6px 10px", borderLeft: "2px solid var(--blue, #4A90D9)",
                        marginBottom: 6,
                      }}>{q}</div>
                    ))}
                  </div>
                </>
              )}

              {/* FORMAT */}
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Format</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>{selectedSystem.format}</div>

              {/* BASE OUTPUT TYPE */}
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Base Output Type</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{selectedSystem.base}</div>
            </>
          ) : (
            /* Reed greeting for user templates or no selection */
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "var(--blue, #4A90D9)", flexShrink: 0,
              }}>R</div>
              <div style={{
                background: "rgba(74,144,217,0.07)", border: "1px solid rgba(74,144,217,0.15)",
                borderRadius: "0 10px 10px 10px", padding: "10px 14px",
                fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: "85%",
              }}>
                What are we building? I can start from an existing output type, modify one of your current templates, or work from scratch.
              </div>
            </div>
          )}
        </div>

        {/* Input bar (shown for user templates or no selection) */}
        {!selectedSystem && (
          <div style={{
            padding: "8px 14px 10px",
            borderTop: "1px solid var(--glass-border)", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                placeholder="Reply to Reed..."
                style={{
                  flex: 1, background: "var(--glass-input)", border: "1px solid var(--glass-border)",
                  borderRadius: 8, padding: "0 12px", fontSize: 13,
                  backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)",
                  color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36,
                }}
              />
              <button style={{
                width: 32, height: 32, borderRadius: 8, background: "var(--fg)",
                border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg style={{ width: 12, height: 12, stroke: "#fff", strokeWidth: 2.5, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const }} viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
