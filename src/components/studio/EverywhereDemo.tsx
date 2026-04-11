import React, { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { EASE, EASE_SMOOTH } from "../../styles/marketing";

const TABS = ["Watch", "Work", "Wrap"] as const;

const font = { fontFamily: "var(--xp-font, 'Instrument Sans', system-ui, sans-serif)" };
const mono = { fontFamily: "var(--xp-mono, 'DM Mono', monospace)" };

export interface EverywhereDemoProps {
  stageDuration?: number;
  autoPlay?: boolean;
}

export default function EverywhereDemo({ stageDuration = 7200, autoPlay = true }: EverywhereDemoProps) {
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
      style={{ ...font, maxWidth: 860, margin: "0 auto" }}
    >
      <style>{`
        @keyframes xpEwDemoFillBar {
          from { transform: scaleX(0.02); }
          to { transform: scaleX(1); }
        }
        @keyframes xpEwDemoShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes xpEwDemoRowIn {
          from {
            opacity: 0;
            transform: translate3d(0, 10px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes xpEwDemoBubble {
          from {
            opacity: 0;
            transform: translate3d(0, 14px, 0) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes xpEwDemoTile {
          from {
            opacity: 0;
            transform: translate3d(0, 12px, 0) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes xpEwDemoBarIn {
          from {
            opacity: 0;
            transform: scaleX(0.06);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        @keyframes xpEwDemoPulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200, 169, 110, 0.25); }
          50% { box-shadow: 0 0 0 6px rgba(200, 169, 110, 0); }
        }
        @keyframes xpEwDemoScanline {
          0% { transform: translate3d(0, -100%, 0); opacity: 0; }
          8% { opacity: 0.06; }
          92% { opacity: 0.06; }
          100% { transform: translate3d(0, 100%, 0); opacity: 0; }
        }
        @keyframes xpEwDemoGlowLine {
          0%, 100% { opacity: 0.35; transform: scaleX(0.92); }
          50% { opacity: 0.85; transform: scaleX(1); }
        }
        @keyframes xpEwDemoDotPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes xpEwDemoStageAura {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
        .xpEwDemo-fillHost {
          transform-origin: left center;
          transform: scaleX(0);
          background: linear-gradient(
            90deg,
            rgba(200, 169, 110, 0.15),
            var(--xp-gold),
            rgba(255, 255, 255, 0.35),
            var(--xp-gold),
            rgba(200, 169, 110, 0.2)
          );
          background-size: 200% 100%;
          animation:
            xpEwDemoFillBar ${stageDuration}ms linear forwards,
            xpEwDemoShimmer 2.2s ease-in-out infinite;
        }
        .xpEwDemo-tabPillTrack {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          padding: 3px;
          border-radius: 12px;
        }
        .xpEwDemo-tabPill {
          position: absolute;
          top: 3px;
          bottom: 3px;
          width: calc((100% - 10px) / 3);
          border-radius: 9px;
          background: rgba(200, 169, 110, 0.14);
          border: 1px solid rgba(200, 169, 110, 0.28);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: left 0.5s ${EASE};
          pointer-events: none;
          z-index: 0;
        }
        .xpEwDemo-tabBtn {
          position: relative;
          z-index: 1;
          border: none;
          background: none;
          cursor: pointer;
          padding: 8px 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.38);
          transition: color 0.35s ${EASE_SMOOTH};
        }
        .xpEwDemo-tabBtn-active {
          color: rgba(255, 255, 255, 0.95);
        }
        .xpEwDemo-canvasInner {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          min-height: 0;
        }
        .xpEwDemo-canvasInner::before {
          content: "";
          position: absolute;
          inset: -40% 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(74, 144, 217, 0.04) 45%,
            rgba(200, 169, 110, 0.05) 55%,
            transparent 100%
          );
          animation: xpEwDemoStageAura 5s ease-in-out infinite;
        }
        .xpEwDemo-scan {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: inherit;
        }
        .xpEwDemo-scan::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 42%;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(255, 255, 255, 0.04),
            transparent
          );
          animation: xpEwDemoScanline 6.5s ease-in-out infinite;
        }
        @keyframes xpEwDemoLiveDot {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1); }
        }
        .xpEwDemo-liveDot {
          animation: xpEwDemoLiveDot 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpEwDemo-fillHost,
          .xpEwDemo-canvasInner::before,
          .xpEwDemo-scan::after,
          .xpEwDemo-liveDot {
            animation: none !important;
          }
          .xpEwDemo-fillHost { transform: scaleX(1) !important; opacity: 0.85; }
          .xpEwDemo-tabPill { transition: none !important; }
          .xpEwDemo-liveDot { opacity: 0.9; transform: scale(1); }
        }
        @media (max-width: 720px) {
          .xpEwDemo-advisor { display: none !important; }
          .xpEwDemo-shell { flex-direction: column !important; }
          .xpEwDemo-nav { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; }
        }
      `}</style>

      <div style={{ marginBottom: 14, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            className="xpEwDemo-liveDot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(110, 231, 183, 0.85)",
              boxShadow: "0 0 12px rgba(110, 231, 183, 0.45)",
            }}
            aria-hidden
          />
          <span
            className="xp-mono"
            style={{
              ...mono,
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(200, 169, 110, 0.75)",
            }}
          >
            Live product rhythm
          </span>
        </div>
        <h2
          style={{
            fontSize: "clamp(20px, 3.2vw, 26px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--xp-on-dark)",
            margin: "0 0 8px",
            lineHeight: 1.15,
          }}
        >
          Watch. Work. Wrap.
        </h2>
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: "var(--xp-dim-dark)",
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          One surface. Three motions. Intelligence that stays with the idea from signal to shipped formats.
        </p>
      </div>

      <div className="xp-glass-card-dark xpEwDemo-tabPillTrack" style={{ marginBottom: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
        <div
          className="xpEwDemo-tabPill"
          style={{ left: `calc(3px + ${stage} * ((100% - 10px) / 3 + 2px))` }}
        />
        {TABS.map((label, i) => {
          const active = stage === i;
          return (
            <button
              key={label}
              type="button"
              className={`xpEwDemo-tabBtn ${active ? "xpEwDemo-tabBtn-active" : ""}`}
              onClick={() => selectTab(i)}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {stage === i && autoPlay ? (
              <div
                key={`fill-${i}-${fillNonce}`}
                className="xpEwDemo-fillHost"
                onAnimationEnd={onBarEnd}
                style={{
                  position: "absolute",
                  inset: 0,
                  animationPlayState: playState,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div
        className="xp-liquid-glass xp-lg-dark xp-lg-shadow"
        style={{
          borderRadius: 16,
          position: "relative",
          isolation: "isolate",
          maxHeight: 360,
        }}
      >
        <div className="xp-liquid-glass-border" style={{ borderRadius: 16 }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "12%",
            right: "12%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(200,169,110,0.45), transparent)",
            animation: "xpEwDemoGlowLine 3.2s ease-in-out infinite",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />
        <div style={{ padding: 10, position: "relative", zIndex: 3 }}>
          <div className="xpEwDemo-shell" style={{ display: "flex", height: 300, gap: 8, minHeight: 0 }}>
            <DemoNav stage={stage} />
            <div
              className="xp-glass-card-dark xpEwDemo-canvasInner"
              style={{
                flex: 1,
                minWidth: 0,
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
              }}
            >
              <div className="xpEwDemo-scan" />
              <StudioCanvas stage={stage} fillNonce={fillNonce} />
            </div>
            <AdvisorColumn stage={stage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoNav({ stage }: { stage: number }) {
  return (
    <aside
      className="xp-glass-card-dark xpEwDemo-nav"
      style={{
        width: 108,
        flexShrink: 0,
        borderRadius: 12,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 4,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ padding: "0 4px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Logo size={15} variant="dark" />
      </div>
      {(["Watch", "Work", "Wrap"] as const).map((name, idx) => {
        const active = stage === idx;
        return (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 6px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: active ? 600 : 500,
              letterSpacing: "0.04em",
              color: active ? "var(--xp-gold)" : "rgba(255,255,255,0.32)",
              background: active ? "rgba(200,169,110,0.12)" : "transparent",
              border: active ? "1px solid rgba(200,169,110,0.2)" : "1px solid transparent",
              transition: `color 0.35s ${EASE}, background 0.35s ${EASE}, border-color 0.35s ${EASE}`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: active ? "var(--xp-gold)" : "rgba(255,255,255,0.18)",
                flexShrink: 0,
                animation: active ? "xpEwDemoDotPulse 2s ease-in-out infinite" : "none",
              }}
            />
            {name}
          </div>
        );
      })}
    </aside>
  );
}

function StudioCanvas({ stage, fillNonce }: { stage: number; fillNonce: number }) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", minHeight: 0, zIndex: 2 }}>
      {[0, 1, 2].map(s => (
        <div
          key={s}
          style={{
            opacity: stage === s ? 1 : 0,
            transform:
              stage === s ? "translate3d(0,0,0) scale(1)" : "translate3d(0,8px,0) scale(0.985)",
            transition: `opacity 0.5s ${EASE}, transform 0.55s ${EASE}`,
            pointerEvents: stage === s ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "12px 14px",
            overflow: s === 1 ? "auto" : "hidden",
          }}
        >
          {s === 0 ? <WatchCenter animKey={`${fillNonce}-w`} /> : null}
          {s === 1 ? <WorkCenter animKey={`${fillNonce}-k`} /> : null}
          {s === 2 ? <WrapCenter animKey={`${fillNonce}-r`} /> : null}
        </div>
      ))}
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

function WatchCenter({ animKey }: { animKey: string }) {
  return (
    <div key={animKey}>
      {SIGNAL_ROWS.map((row, i) => (
        <div key={row.line}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "7px 0",
              animation: `xpEwDemoRowIn 0.55s ${EASE} both`,
              animationDelay: `${70 * i}ms`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: row.dot,
                marginTop: 3,
                flexShrink: 0,
                boxShadow: `0 0 10px ${row.dot}`,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                className="xp-mono"
                style={{
                  ...mono,
                  fontSize: 8,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                  marginBottom: 3,
                }}
              >
                {row.src}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.82)", lineHeight: 1.38 }}>
                {row.line}
              </div>
            </div>
          </div>
          {i < SIGNAL_ROWS.length - 1 ? (
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

const WORK_LINES: { side: "reed" | "you"; text: string }[] = [
  { side: "reed", text: "What is the single outcome you want a reader to act on?" },
  { side: "you", text: "Credibility without the corporate fog. Plain stakes, plain ask." },
  { side: "reed", text: "Open with the tradeoff. Name what you refuse to soften." },
];

function WorkCenter({ animKey }: { animKey: string }) {
  return (
    <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {WORK_LINES.map((row, i) => (
          <div
            key={i}
            style={{
              alignSelf: row.side === "reed" ? "flex-start" : "flex-end",
              maxWidth: "78%",
              animation: `xpEwDemoBubble 0.55s ${EASE} both`,
              animationDelay: `${100 + i * 120}ms`,
            }}
          >
            <div
              className="xp-glass-card-dark"
              style={{
                borderRadius: 10,
                padding: "7px 10px",
                fontSize: 11,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.82)",
                border:
                  row.side === "you"
                    ? "1px solid rgba(200,169,110,0.35)"
                    : "1px solid rgba(255,255,255,0.1)",
                background:
                  row.side === "you" ? "rgba(200,169,110,0.1)" : "rgba(255,255,255,0.04)",
                boxShadow: row.side === "you" ? "0 4px 16px rgba(0,0,0,0.12)" : "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              {row.text}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 8,
          paddingLeft: 10,
          borderLeft: "2px solid rgba(200,169,110,0.25)",
        }}
      >
        {["Opening: tension, not throat clearing", "Middle: proof tied to the ask", "Close: one move the reader can take today"].map((line, i) => (
          <div
            key={line}
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.55,
              paddingLeft: i * 6,
              animation: `xpEwDemoRowIn 0.5s ${EASE} both`,
              animationDelay: `${380 + i * 70}ms`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

const OUTPUT_LABELS = ["LinkedIn Post", "Essay", "Podcast", "Email", "Board Report", "Newsletter"] as const;

function WrapCenter({ animKey }: { animKey: string }) {
  return (
    <div
      key={animKey}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 6,
        height: "100%",
        alignContent: "start",
      }}
    >
      {OUTPUT_LABELS.map((name, i) => {
        const highlight = name === "Essay";
        const card = (
          <div
            className="xp-glass-card-dark"
            style={{
              position: "relative",
              borderRadius: 8,
              padding: "8px 9px",
              fontSize: 9,
              fontWeight: highlight ? 600 : 500,
              letterSpacing: "0.02em",
              color: highlight ? "var(--xp-gold)" : "rgba(255,255,255,0.55)",
              border: highlight ? "1px solid rgba(200,169,110,0.45)" : "1px solid rgba(255,255,255,0.08)",
              background: highlight ? "rgba(200,169,110,0.08)" : "rgba(255,255,255,0.03)",
              animation: `xpEwDemoTile 0.5s ${EASE} both`,
              animationDelay: `${60 * i}ms`,
              boxShadow: highlight ? "inset 0 1px 0 rgba(255,255,255,0.06)" : undefined,
            }}
          >
            {highlight ? (
              <span
                className="xp-mono"
                style={{
                  position: "absolute",
                  top: 5,
                  right: 6,
                  fontSize: 7,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--xp-gold)",
                }}
              >
                Ready
              </span>
            ) : null}
            {name}
          </div>
        );
        if (!highlight) {
          return <div key={name}>{card}</div>;
        }
        return (
          <div
            key={name}
            style={{
              borderRadius: 10,
              padding: 1,
              animation: "xpEwDemoPulseRing 2.8s ease-in-out infinite",
            }}
          >
            {card}
          </div>
        );
      })}
    </div>
  );
}

function AdvisorColumn({ stage }: { stage: number }) {
  return (
    <aside
      className="xp-glass-card-dark xpEwDemo-advisor"
      style={{
        width: 124,
        flexShrink: 0,
        borderRadius: 12,
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <AdvisorBlock title="Quality" bars={[0.92, 0.72, 0.55]} stage={stage} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
      <AdvisorBlock title="Reed" bars={[0.88, 0.5]} stage={stage} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
      <AdvisorBlock title="Signals" bars={[0.65, 0.78, 0.42]} stage={stage} />
    </aside>
  );
}

function AdvisorBlock({ title, bars, stage }: { title: string; bars: number[]; stage: number }) {
  return (
    <div>
      <div
        className="xp-mono"
        style={{
          ...mono,
          fontSize: 8,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.32)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }} key={`${title}-${stage}`}>
        {bars.map((w, i) => (
          <div
            key={i}
            style={{
              height: 3,
              borderRadius: 2,
              width: `${Math.round(w * 100)}%`,
              transformOrigin: "left center",
              background: "linear-gradient(90deg, rgba(200,169,110,0.45), rgba(255,255,255,0.12))",
              animation: `xpEwDemoBarIn 0.75s ${EASE} both`,
              animationDelay: `${80 + i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
