import { useState } from "react";

const FONT = "var(--font)";

const SYSTEM_TEMPLATES = [
  { name: "The Edition", base: "Essay" },
  { name: "Sunday Story", base: "Essay" },
  { name: "Session Brief", base: "Session Brief" },
];

const USER_TEMPLATES = [
  { name: "Doug's Coaching Brief", base: "Session Brief", modified: true },
  { name: "Weekly Signal Digest", base: "Newsletter", modified: true },
  { name: "CEO LinkedIn Voice", base: "Essay", modified: true },
];

export default function Templates() {
  const [selected, setSelected] = useState<number | null>(null);
  const [section, setSection] = useState<"system" | "yours">("system");

  return (
    <div style={{ display: "flex", flex: 1, height: "100%", overflow: "hidden" }}>
      {/* Left list (44%) */}
      <div style={{ width: "44%", borderRight: "1px solid var(--line)", overflowY: "auto", padding: "8px 0" }}>
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
            background: "var(--bg-2)", borderRadius: 3, padding: "1px 6px",
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
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 1 }}>Based on {t.base}</div>
          </div>
        ))}

        <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />

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
        {USER_TEMPLATES.map((t, i) => (
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
        ))}
      </div>

      {/* Right Reed pane (56%) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Reed greeting */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "var(--blue, #4A90D9)", flexShrink: 0,
            }}>W</div>
            <div style={{
              background: "rgba(74,144,217,0.07)", border: "1px solid rgba(74,144,217,0.15)",
              borderRadius: "0 10px 10px 10px", padding: "10px 14px",
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: "85%",
            }}>
              What are we building? I can start from an existing output type, modify one of your current templates, or work from scratch.
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div style={{
          padding: "8px 14px 10px",
          borderTop: "1px solid var(--line)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              placeholder="Reply to Reed..."
              style={{
                flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 8, padding: "0 12px", fontSize: 13,
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
      </div>
    </div>
  );
}
