import type { VoiceDNA } from "../../utils/voiceDNAProcessor";

interface VoiceDNAReviewProps {
  data: VoiceDNA;
  onConfirm: () => void;
  onRefine?: () => void;
  onUploadMore?: () => void;
}

export function VoiceDNAReview({ data, onConfirm, onRefine, onUploadMore }: VoiceDNAReviewProps) {
  const fidelity = data.voice_fidelity ?? 0;

  const traitEntries: { key: keyof VoiceDNA["traits"]; label: string }[] = [
    { key: "vocabulary_and_syntax", label: "Vocabulary and Syntax" },
    { key: "tonal_register", label: "Tonal Register" },
    { key: "rhythm_and_cadence", label: "Rhythm and Cadence" },
    { key: "metaphor_patterns", label: "Metaphor Patterns" },
    { key: "structural_habits", label: "Structural Habits" },
  ];

  const layerCard = (title: string, score: number, description: string) => (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: "'Afacad Flux', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: "#ffffff",
        }}
      >
        <span>{title}</span>
        <span>{Math.round(score)}%</span>
      </div>
      <p
        style={{
          marginTop: 4,
          fontFamily: "'Afacad Flux', sans-serif",
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {description}
      </p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", color: "#ffffff" }}>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
          fontSize: 36,
          fontWeight: 300,
          margin: "0 0 24px",
        }}
      >
        Your Voice DNA
      </h1>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
              fontSize: 64,
              fontWeight: 600,
              color: "#C8961A",
              lineHeight: 1,
            }}
          >
            {fidelity.toFixed(1)}
          </span>
          <span
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            / 100
          </span>
        </div>
        <div
          style={{
            marginTop: 12,
            width: "100%",
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, fidelity))}%`,
              background: "#C8961A",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {layerCard("Voice Layer", data.voice_layer ?? 0, data.voice_description || "How you sound on the page: sentence length, rhythm, vocabulary, punctuation.")}
        {layerCard("Value Layer", data.value_layer ?? 0, data.value_description || "What you stand for professionally: principles, non-negotiables, beliefs.")}
        {layerCard("Personality Layer", data.personality_layer ?? 0, data.personality_description || "The texture of your presence: humor, warmth, edge, register.")}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 16,
          }}
        >
          Trait profile
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {traitEntries.map((item, index) => {
            const score = data.traits?.[item.key] ?? 0;
            return (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 180,
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(0, Math.min(100, score))}%`,
                      background: "#C8961A",
                      transformOrigin: "left",
                      animation: "barFill 0.7s ease forwards",
                      animationDelay: `${index * 80}ms`,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 40,
                    textAlign: "right",
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#C8961A",
                  }}
                >
                  {Math.round(score)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 32,
        }}
      >
        <button
          type="button"
          onClick={onConfirm}
          style={{
            flex: 1,
            minWidth: 160,
            border: "none",
            borderRadius: 999,
            padding: "14px 18px",
            background: "#C8961A",
            color: "#07090f",
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          This sounds like me
        </button>
        {onRefine && (
          <button
            type="button"
            onClick={onRefine}
            style={{
              flex: 1,
              minWidth: 160,
              borderRadius: 999,
              padding: "14px 18px",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "#ffffff",
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Let me refine it
          </button>
        )}
        {onUploadMore && (
          <button
            type="button"
            onClick={onUploadMore}
            style={{
              border: "none",
              background: "none",
              color: "rgba(255,255,255,0.65)",
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Upload more samples
          </button>
        )}
      </div>
    </div>
  );
}

