import { useState } from "react";
import { OUTPUT_TYPES_FULL } from "../../lib/constants";
import "./shared.css";

type CategoryKey = "content" | "social" | "business" | "extended";

const FONT = "var(--font)";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6, marginTop: 16 }}>{children}</div>
);

const SectionBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.55, marginBottom: 12 }}>{children}</div>
);

export default function OutputLibraryPage({ category }: { category: CategoryKey }) {
  const data = OUTPUT_TYPES_FULL[category];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selected = selectedIdx !== null ? data.types[selectedIdx] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg)", padding: "12px 20px 10px" }}>
        {data.label}
      </div>
      <div style={{ height: 1, background: "var(--line)", flexShrink: 0 }} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left column (44%) */}
        <div style={{ width: "44%", borderRight: "1px solid var(--line)", overflowY: "auto", padding: "8px 0" }}>
          {data.types.map((t, i) => {
            const isSelected = selectedIdx === i;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedIdx(isSelected ? null : i)}
                style={{
                  display: "flex", alignItems: "center", padding: "10px 16px",
                  cursor: "pointer",
                  borderLeft: isSelected ? "2px solid var(--blue, #4A90D9)" : "2px solid transparent",
                  background: isSelected ? "rgba(74,144,217,0.06)" : "transparent",
                  transition: "all 0.1s",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: "1px solid var(--line)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} />
                {/* Name */}
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: isSelected ? "var(--blue, #4A90D9)" : "var(--fg)",
                  marginLeft: 12, flex: 1,
                }}>{t.name}</span>
                {/* Chevron */}
                <svg style={{ width: 13, height: 13, stroke: "var(--line-2)", strokeWidth: 1.75, fill: "none", flexShrink: 0, marginLeft: "auto" }} viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Right column (56%) */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {!selected ? (
            <div style={{ fontSize: 12, color: "var(--fg-3)", fontStyle: "italic", textAlign: "center", paddingTop: 40 }}>
              Select an output type.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                {selected.name}
              </div>

              <SectionLabel>What It Is</SectionLabel>
              <SectionBody>{selected.what}</SectionBody>

              <SectionLabel>How Reed Guides You</SectionLabel>
              <SectionBody>{selected.reed}</SectionBody>

              <SectionLabel>Format</SectionLabel>
              <SectionBody>{selected.format}</SectionBody>

              <SectionLabel>Delivery</SectionLabel>
              <SectionBody>{selected.delivery}</SectionBody>

              <SectionLabel>Not the Right Fit If</SectionLabel>
              <div style={{
                background: "rgba(245,198,66,0.06)", borderLeft: "3px solid var(--gold, #F5C642)",
                padding: "8px 10px", borderRadius: "0 4px 4px 0",
              }}>
                <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.55 }}>{selected.notFit}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
