import { useState } from "react";
import { ReedProfileIcon } from "../../components/studio/ReedProfileIcon";
import { useMobile } from "../../hooks/useMobile";
import "./shared.css";

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

const USER_TEMPLATES: Array<{ name: string; base: string; modified: boolean }> = [];

export default function Templates() {
  const [selected, setSelected] = useState<number | null>(0);
  const [section, setSection] = useState<"system" | "yours">("system");
  const isMobile = useMobile();

  const selectedSystem = section === "system" && selected !== null ? SYSTEM_TEMPLATES[selected] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden", fontFamily: FONT, minHeight: 0 }}>
      <header className="liquid-glass" style={{ flexShrink: 0, borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}>
        <div style={{ padding: "14px 20px 16px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>
            Wrap layer
          </div>
          <h1 style={{ fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em" }}>
            Templates
          </h1>
          <p style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.55, marginTop: 8, maxWidth: 520 }}>
            System templates ship with Studio. Custom templates start from a system base or from scratch with Reed.
          </p>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          gap: isMobile ? 12 : 16,
          padding: isMobile ? "12px 14px 16px" : "16px 20px 20px",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          minHeight: 0,
        }}
      >
        <div
          className="liquid-glass"
          style={{
            width: isMobile ? "100%" : "min(38%, 320px)",
            flexShrink: 0,
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: isMobile ? 180 : 0,
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>System</span>
            <span className="liquid-glass-card" style={{ fontSize: 8, fontWeight: 600, padding: "3px 8px", borderRadius: 8, color: "var(--fg-3)" }}>Read only</span>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: 6 }}>
            {SYSTEM_TEMPLATES.map((t, i) => {
              const on = section === "system" && selected === i;
              return (
                <button
                  key={`sys-${t.name}`}
                  type="button"
                  onClick={() => { setSelected(i); setSection("system"); }}
                  className={on ? "liquid-glass-card" : ""}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left" as const,
                    padding: "10px 12px",
                    marginBottom: 4,
                    borderRadius: 12,
                    border: on ? "1px solid rgba(245,198,66,0.35)" : "1px solid transparent",
                    background: on ? "rgba(245,198,66,0.08)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    fontFamily: FONT,
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: "var(--fg)" }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 3, lineHeight: 1.35 }}>Based on {t.base} · {t.format}</div>
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: "var(--glass-border)", margin: "4px 10px" }} />

          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>Yours</span>
            <button type="button" className="liquid-glass-btn" style={{ padding: "4px 10px", fontSize: 9, fontWeight: 600 }}>
              <span className="liquid-glass-btn-label" style={{ color: "var(--blue, #4A90D9)" }}>+ New</span>
            </button>
          </div>
          <div style={{ overflowY: "auto", maxHeight: isMobile ? 160 : 220, padding: "0 6px 8px" }}>
            {USER_TEMPLATES.length === 0 ? (
              <div className="liquid-glass-card" style={{ margin: "0 6px", padding: "12px 14px", fontSize: 11, color: "var(--fg-3)", lineHeight: 1.45, borderRadius: 12 }}>
                No custom templates yet. Use + New when you are ready to build one from a system template or from scratch.
              </div>
            ) : (
              USER_TEMPLATES.map((t, i) => (
                <button
                  key={`usr-${i}`}
                  type="button"
                  onClick={() => { setSelected(i); setSection("yours"); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left" as const,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: section === "yours" && selected === i ? "rgba(74,144,217,0.08)" : "transparent",
                    cursor: "pointer",
                    fontFamily: FONT,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 1 }}>
                    Based on {t.base} {t.modified ? "· Modified" : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="liquid-glass" style={{ flex: 1, minWidth: 0, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px" : "22px 24px" }}>
            {selectedSystem ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: 700, color: "var(--fg)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{selectedSystem.name}</h2>
                  <span className="liquid-glass-card" style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: "var(--fg-3)", padding: "4px 10px", borderRadius: 8, display: "inline-block",
                  }}>Supplied template</span>
                </div>

                <div className="liquid-glass-card" style={{ padding: "14px 16px", marginBottom: 14, borderRadius: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.65 }}>{selectedSystem.description}</div>
                </div>

                <div className="liquid-glass-card" style={{ padding: "14px 16px", marginBottom: 14, borderRadius: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 10 }}>Sections</div>
                  {selectedSystem.sections.map((sec, i) => (
                    <div
                      key={sec}
                      style={{
                        padding: "8px 0",
                        borderBottom: i < selectedSystem.sections.length - 1 ? "1px solid var(--glass-border)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold, #F5C642)", minWidth: 20 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{sec}</span>
                    </div>
                  ))}
                </div>

                {selectedSystem.reedInterview && (
                  <div className="liquid-glass-card" style={{ padding: "14px 16px", marginBottom: 14, borderRadius: 14, border: "1px solid rgba(74,144,217,0.18)" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue, #4A90D9)", marginBottom: 10 }}>Reed interview</div>
                    {selectedSystem.reedInterview.map((q, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55, padding: "6px 0 6px 12px", borderLeft: "2px solid rgba(74,144,217,0.35)", marginBottom: 6 }}>{q}</div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  <div className="liquid-glass-card" style={{ padding: "12px 14px", borderRadius: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Format</div>
                    <div style={{ fontSize: 12, color: "var(--fg-2)" }}>{selectedSystem.format}</div>
                  </div>
                  <div className="liquid-glass-card" style={{ padding: "12px 14px", borderRadius: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Base output type</div>
                    <div style={{ fontSize: 12, color: "var(--fg-2)" }}>{selectedSystem.base}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="liquid-glass-card" style={{ padding: "20px 18px", borderRadius: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "center",
                    flexShrink: 0, width: 36, paddingTop: 2,
                  }}>
                    <ReedProfileIcon size={24} title="Reed" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Reed</div>
                    <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                      What are we building? I can start from an existing output type, modify one of your current templates, or work from scratch.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!selectedSystem && (
            <div className="liquid-glass" style={{ padding: "10px 14px", borderRadius: 0, borderTop: "1px solid var(--glass-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  placeholder="Reply to Reed…"
                  className="liquid-glass-input"
                  style={{ flex: 1, fontSize: 13, height: 38, borderRadius: 10 }}
                />
                <button type="button" className="liquid-glass-btn-gold" style={{ width: 38, height: 38, borderRadius: 10, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Send">
                  <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2.2, fill: "none" }} viewBox="0 0 24 24">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
