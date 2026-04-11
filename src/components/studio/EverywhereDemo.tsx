import React, { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";

const TABS = ["WATCH", "WORK", "WRAP"] as const;

const inter: React.CSSProperties = {
  fontFamily: "Inter, system-ui, sans-serif",
};

export interface EverywhereDemoProps {
  stageDuration?: number;
  autoPlay?: boolean;
}

export default function EverywhereDemo({ stageDuration = 7000, autoPlay = true }: EverywhereDemoProps) {
  const [stage, setStage] = useState(0);
  const [fillNonce, setFillNonce] = useState(0);
  const [hoverPause, setHoverPause] = useState(false);
  const hoverPauseRef = useRef(false);

  useEffect(() => {
    hoverPauseRef.current = hoverPause;
  }, [hoverPause]);

  const bump = () => setFillNonce(n => n + 1);

  const selectTab = (i: number) => {
    setStage(i);
    bump();
  };

  const onBarEnd = useCallback(() => {
    if (hoverPauseRef.current || !autoPlay) return;
    setStage(s => (s + 1) % 3);
    setFillNonce(n => n + 1);
  }, [autoPlay]);

  const playState: React.CSSProperties["animationPlayState"] =
    hoverPause || !autoPlay ? "paused" : "running";

  return (
    <div
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
    >
      <style>{`
        @keyframes xpEwDemoFillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <div style={{ marginBottom: 16, display: "flex", gap: 32 }}>
        {TABS.map((label, i) => {
          const active = stage === i;
          return (
            <button
              key={label}
              type="button"
              onClick={() => selectTab(i)}
              style={{
                position: "relative",
                padding: 0,
                paddingBottom: 8,
                cursor: "pointer",
                background: "none",
                border: "none",
                ...inter,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              {active && (
                <span
                  key={`xp-ew-fill-${i}-${fillNonce}`}
                  onAnimationEnd={autoPlay ? onBarEnd : undefined}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 2,
                    width: 0,
                    background: "var(--xp-gold)",
                    animation: autoPlay ? `xpEwDemoFillBar ${stageDuration}ms linear forwards` : "none",
                    animationPlayState: autoPlay ? playState : undefined,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <StudioShell stage={stage} />
      </div>
    </div>
  );
}

function StudioShell({ stage }: { stage: number }) {
  return (
    <div style={{ display: "flex", height: "100%", width: "100%", minHeight: 0 }}>
      <aside
        style={{
          width: 180,
          flexShrink: 0,
          background: "rgba(0,0,0,0.3)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ paddingLeft: 16, marginBottom: 20 }}>
          <Logo size={18} variant="dark" />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 8, paddingRight: 8 }}>
          {(["Watch", "Work", "Wrap"] as const).map((name, idx) => {
            const active = stage === idx;
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  ...inter,
                  color: active ? "var(--xp-gold)" : "rgba(255,255,255,0.3)",
                  background: active ? "rgba(200,169,110,0.08)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: active ? "var(--xp-gold)" : "rgba(255,255,255,0.2)",
                    flexShrink: 0,
                  }}
                />
                {name}
              </div>
            );
          })}
        </nav>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            opacity: stage === 0 ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: stage === 0 ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          <WatchCenter />
        </div>
        <div
          style={{
            opacity: stage === 1 ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: stage === 1 ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "20px 24px",
            overflow: "auto",
          }}
        >
          <WorkCenter />
        </div>
        <div
          style={{
            opacity: stage === 2 ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: stage === 2 ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          <WrapCenter />
        </div>
      </div>

      <AdvisorColumn />
    </div>
  );
}

const SIGNAL_ROWS: { dot: string; src: string; line: string }[] = [
  { dot: "rgba(110,231,183,0.9)", src: "Briefing", line: "Rates steady, guidance cautious on hiring" },
  { dot: "rgba(251,191,36,0.95)", src: "Wire", line: "Sector read: buyers waiting for proof, not promises" },
  { dot: "rgba(148,163,184,0.85)", src: "Internal", line: "Your last memo flags delivery risk in Q3" },
  { dot: "rgba(96,165,250,0.9)", src: "Field", line: "Customer calls repeat the same three objections" },
  { dot: "rgba(167,139,250,0.9)", src: "Scan", line: "Competitor launched a thinner story with louder distribution" },
];

function WatchCenter() {
  return (
    <div>
      {SIGNAL_ROWS.map((row, i) => (
        <div key={row.line}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: row.dot,
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4, ...inter }}>{row.src}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.35, ...inter }}>
                {row.line}
              </div>
            </div>
          </div>
          {i < SIGNAL_ROWS.length - 1 ? (
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WorkCenter() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.45,
              ...inter,
            }}
          >
            What is the single outcome you want a reader to act on?
          </div>
        </div>
        <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}>
          <div
            style={{
              background: "rgba(200,169,110,0.12)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.45,
              ...inter,
            }}
          >
            Credibility without the corporate fog. Plain stakes, plain ask.
          </div>
        </div>
        <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.45,
              ...inter,
            }}
          >
            Open with the tradeoff. Name what you refuse to soften.
          </div>
        </div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 8, paddingLeft: 12, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.28)",
              lineHeight: 1.6,
              paddingLeft: i * 8,
              ...inter,
            }}
          >
            {i === 0 ? "Opening: tension, not throat clearing" : i === 1 ? "Middle: proof tied to the ask" : "Close: one move the reader can take today"}
          </div>
        ))}
      </div>
    </div>
  );
}

const OUTPUT_LABELS = ["LinkedIn Post", "Essay", "Podcast", "Email", "Board Report", "Newsletter"] as const;

function WrapCenter() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        height: "100%",
        alignContent: "start",
      }}
    >
      {OUTPUT_LABELS.map(name => {
        const highlight = name === "Essay";
        return (
          <div
            key={name}
            style={{
              position: "relative",
              background: highlight ? "rgba(200,169,110,0.07)" : "rgba(255,255,255,0.04)",
              border: highlight ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              color: highlight ? "var(--xp-gold)" : "rgba(255,255,255,0.6)",
              ...inter,
            }}
          >
            {highlight ? (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--xp-gold)",
                }}
              >
                Recommended
              </span>
            ) : null}
            {name}
          </div>
        );
      })}
    </div>
  );
}

function AdvisorColumn() {
  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: "rgba(0,0,0,0.3)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        ...inter,
      }}
    >
      <AdvisorBlock title="Feedback" bars={[0.92, 0.72, 0.55]} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
      <AdvisorBlock title="Ask Reed" bars={[0.88, 0.5]} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
      <AdvisorBlock title="Help" bars={[0.65, 0.78, 0.42]} />
    </aside>
  );
}

function AdvisorBlock({ title, bars }: { title: string; bars: number[] }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {bars.map((w, i) => (
          <div
            key={i}
            style={{
              height: 4,
              borderRadius: 2,
              width: `${Math.round(w * 100)}%`,
              background: "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
