import { useState, useEffect } from "react";
import { Check, AlertTriangle, X as XIcon, Loader2 } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";

const SPECIALIST_INFO: Record<number, { name: string; role: string; color: string; detail: string }> = {
  0: {
    name: "Echo",
    role: "Deduplication",
    color: "#4A90D9",
    detail: "Echo scans for conceptual repetition, not just word-for-word duplicates. If your piece restates the same argument in different words across sections, Echo catches it.",
  },
  1: {
    name: "Priya",
    role: "Research Accuracy",
    color: "#F5C642",
    detail: "Priya verifies every factual claim against independent sources. Unverified claims are flagged for revision or removal.",
  },
  2: {
    name: "Jordan",
    role: "Voice Authenticity",
    color: "#4A90D9",
    detail: "Jordan compares every sentence against your Voice DNA profile. Vocabulary, rhythm, tonal register, metaphor patterns, and structural habits all get scored. The target is 95% fidelity.",
  },
  3: {
    name: "David",
    role: "Engagement",
    color: "#A080F5",
    detail: "David runs the 7-second hook test. If your opening does not earn attention within the first two sentences, it fails. He also checks for clear stakes and counts quotable moments.",
  },
  4: {
    name: "Elena",
    role: "SLOP Detection",
    color: "#E8506A",
    detail: "Elena is the SLOP Detector. She scans for Superfluity, Loops, Overwrought prose, and Pretension. One em dash in prose is an automatic block.",
  },
  5: {
    name: "Natasha",
    role: "Editorial Excellence",
    color: "#4A90D9",
    detail: "Natasha applies publication-grade editorial standards. Every term must be explained for a cold reader. If a stranger cannot follow your argument without context, it fails.",
  },
  6: {
    name: "Marcus + Marshall",
    role: "Perspective + Impact",
    color: "#50c8a0",
    detail: "Marcus checks for cultural blind spots and unexamined assumptions. Marshall applies nonviolent communication principles. Together they ensure your content challenges without alienating.",
  },
};

// Map simplified gate keys (from /api/generate) to specialist indices
const GATE_KEY_MAP: Record<string, number> = {
  accuracy: 1, voice: 2, audience: 3, ai_tells: 4, strategy: 5, platform: 6, impact: 6,
};

interface GateData {
  index: number;
  status: "pass" | "fail" | "flag" | "processing" | "pending";
  score?: number;
  feedback?: string;
  issues?: string[];
}

interface SpecialistPanelProps {
  // From real pipeline (GateResult[])
  pipelineGateResults?: Array<{ gate?: string; status?: string; score?: number; feedback?: string; issues?: string[] } | null>;
  // From simplified /api/generate gates
  simpleGates?: Record<string, number | undefined> | null;
  // Animation state
  visibleCount?: number;
  revealedCount?: number;
  // Total score
  totalScore?: number;
  showTotal?: boolean;
  // Interactivity
  isAnimating?: boolean;
  // Threshold
  threshold?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#50c8a0";
  if (score >= 60) return "#F5C642";
  return "#E53935";
}

export default function SpecialistPanel({
  pipelineGateResults,
  simpleGates,
  visibleCount = 7,
  revealedCount = 7,
  totalScore,
  showTotal = true,
  isAnimating = false,
  threshold = 800,
}: SpecialistPanelProps) {
  const isMobile = useMobile();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Build gate data from either source
  const gates: GateData[] = [];

  if (pipelineGateResults && pipelineGateResults.some(Boolean)) {
    // Real pipeline results
    for (let i = 0; i < 7; i++) {
      const r = pipelineGateResults[i];
      if (!r) {
        gates.push({ index: i, status: i < visibleCount ? "processing" : "pending" });
      } else {
        const s = (r.status || "").toUpperCase();
        gates.push({
          index: i,
          status: s === "PASS" ? "pass" : s === "FAIL" ? "fail" : s === "FLAG" ? "flag" : "pass",
          score: r.score,
          feedback: r.feedback,
          issues: r.issues,
        });
      }
    }
  } else if (simpleGates) {
    // Simplified gates from /api/generate
    // Echo always passes
    gates.push({ index: 0, status: "pass" });
    const keys = ["accuracy", "voice", "audience", "ai_tells", "strategy", "platform"];
    for (let i = 0; i < keys.length; i++) {
      const val = simpleGates[keys[i] as keyof typeof simpleGates] as number | undefined;
      gates.push({
        index: i + 1,
        status: val !== undefined ? (val >= 60 ? "pass" : "fail") : "pending",
        score: val,
      });
    }
  } else {
    for (let i = 0; i < 7; i++) {
      gates.push({ index: i, status: "pending" });
    }
  }

  // Auto-select the most recently completed gate during animation
  useEffect(() => {
    if (!isAnimating) return;
    const lastRevealed = gates.filter(g => g.status !== "processing" && g.status !== "pending").length - 1;
    if (lastRevealed >= 0) setSelectedIndex(lastRevealed);
  }, [revealedCount, isAnimating]);

  const selected = selectedIndex !== null ? gates[selectedIndex] : null;
  const selectedInfo = selectedIndex !== null ? SPECIALIST_INFO[selectedIndex] : null;

  const statusIcon = (g: GateData) => {
    if (g.status === "processing") return <Loader2 size={16} style={{ color: "var(--fg-3)", animation: "spin 0.8s linear infinite" }} />;
    if (g.status === "pending") return <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-3)", display: "block" }} />;
    if (g.status === "pass") return <Check size={16} strokeWidth={2.5} style={{ color: "#50c8a0" }} />;
    if (g.status === "flag") return <AlertTriangle size={16} style={{ color: "#F5C642" }} />;
    return <XIcon size={16} style={{ color: "#E53935" }} />;
  };

  const renderDetailPanel = () => {
    if (!selected || !selectedInfo) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
          Click a specialist to see their evaluation
        </div>
      );
    }

    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: selectedInfo.color + "18", color: selectedInfo.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
            {selected.index + 1}
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>{selectedInfo.name}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{selectedInfo.role}</div>
          </div>
        </div>

        {selected.score !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--bg-2)", borderRadius: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor(selected.score), fontVariantNumeric: "tabular-nums" }}>
              {selected.score}
            </span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, selected.score)}%`, background: scoreColor(selected.score), borderRadius: 2 }} />
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.25, marginBottom: 16 }}>
          {selectedInfo.detail}
        </p>

        {selected.feedback ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Feedback</div>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.25, margin: 0, whiteSpace: "pre-wrap" }}>
              {selected.feedback}
            </p>
          </div>
        ) : selected.score !== undefined ? (
          <p style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 8 }}>
            Detailed feedback is available after the full quality pipeline completes.
          </p>
        ) : null}

        {selected.issues && selected.issues.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Issues Found</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              {selected.issues.map((issue, i) => (
                <li key={i} style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.25 }}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#4A90D9", marginBottom: 16 }}>
        QUALITY PIPELINE
      </div>
      <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.25, marginBottom: 16, marginTop: -8 }}>
        Your content was reviewed by 7 AI specialists. Click any to see their evaluation.
      </p>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12, color: "var(--fg-3)" }}>
        <span><span style={{ color: "#50c8a0", fontWeight: 700 }}>80+</span> Strong</span>
        <span><span style={{ color: "#F5C642", fontWeight: 700 }}>60-79</span> Needs work</span>
        <span><span style={{ color: "#E53935", fontWeight: 700 }}>&lt;60</span> Needs attention</span>
      </div>

      <div style={{ display: isMobile ? "flex" : "grid", gridTemplateColumns: "1fr 360px", flexDirection: "column", gap: 16, marginBottom: showTotal ? 24 : 0 }}>
        {/* Left: Specialist cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {gates.map((g, i) => {
            const info = SPECIALIST_INFO[g.index];
            if (!info) return null;
            const isVisible = !isAnimating || i < visibleCount;
            const isRevealed = !isAnimating || i < revealedCount;
            const isSelected = selectedIndex === i;
            if (!isVisible) return null;

            const card = (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(isSelected ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: isSelected ? "var(--surface-white)" : "transparent",
                  border: "1px solid",
                  borderColor: isSelected ? info.color : "var(--border-subtle)",
                  borderLeft: isSelected ? `3px solid ${info.color}` : "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  animation: isAnimating && g.status === "processing" ? "pulse 2s ease-in-out infinite" : "none",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--surface-white)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 6, background: info.color + "18", color: info.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{info.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{info.role}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isRevealed && g.score !== undefined && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(g.score), fontVariantNumeric: "tabular-nums" }}>
                      {g.score}
                    </span>
                  )}
                  {statusIcon(g)}
                </div>
              </button>
            );

            // Mobile: inline expand
            if (isMobile && isSelected) {
              return (
                <div key={i}>
                  {card}
                  <div style={{ background: "var(--surface-white)", border: "1px solid var(--border-subtle)", borderTop: "none", borderRadius: "0 0 8px 8px", marginTop: -1 }}>
                    {renderDetailPanel()}
                  </div>
                </div>
              );
            }

            return card;
          })}
        </div>

        {/* Right: Detail panel (desktop only) */}
        {!isMobile && (
          <div style={{ background: "var(--surface-white)", border: "1px solid var(--border-subtle)", borderRadius: 8, minHeight: 200, position: "sticky", top: 80, alignSelf: "start" }}>
            {renderDetailPanel()}
          </div>
        )}
      </div>

      {/* Total score */}
      {showTotal && totalScore !== undefined && (
        <div style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: totalScore >= threshold ? "#50c8a0" : totalScore >= 700 ? "#F5C642" : "#E53935", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {totalScore}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>
            Publication threshold: {threshold}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: totalScore >= threshold ? "#50c8a0" : "var(--fg-2)", marginTop: 8 }}>
            {totalScore >= threshold ? "Ready to publish" : (() => {
              const scored = gates.filter(g => g.score !== undefined).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
              const lowest = scored.slice(0, 2);
              if (lowest.length === 0) return "Below threshold. Revisions recommended.";
              const names = lowest.map(g => {
                const info = SPECIALIST_INFO[g.index];
                return info ? `${info.name} (${info.role})` : null;
              }).filter(Boolean);
              return `Focus on improving ${names.join(" and ")} to reach the publication threshold.`;
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,144,217,0); }
          50% { box-shadow: 0 0 0 4px rgba(74,144,217,0.1); }
        }
      `}</style>
    </div>
  );
}
