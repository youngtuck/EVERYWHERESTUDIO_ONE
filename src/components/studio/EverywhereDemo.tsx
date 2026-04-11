import React, { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { EASE, EASE_SMOOTH } from "../../styles/marketing";

const TABS = ["Watch", "Work", "Wrap"] as const;

const font = { fontFamily: "var(--xp-font, 'Instrument Sans', system-ui, sans-serif)" };
const mono = { fontFamily: "var(--xp-mono, 'DM Mono', monospace)" };

export interface EverywhereDemoProps {
  /** Time each tab stays active before auto-advance (ms). */
  stageDuration?: number;
  autoPlay?: boolean;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/** Simple pointer for scripted demo clicks (no PII). */
function DemoCursor({ x, y, visible, click }: { x: number; y: number; visible: boolean; click?: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 18,
        height: 18,
        marginLeft: -4,
        marginTop: -2,
        pointerEvents: "none",
        zIndex: 30,
        transition: `left 0.75s ${EASE}, top 0.75s ${EASE}, transform 0.12s ${EASE}`,
        transform: click ? "scale(0.88)" : "scale(1)",
      }}
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}>
        <path
          d="M5 3l14 10.5-5.5 1.2L10.5 21 5 3z"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function EverywhereDemo({ stageDuration = 12000, autoPlay = true }: EverywhereDemoProps) {
  const [stage, setStage] = useState(0);
  const [fillNonce, setFillNonce] = useState(0);
  const [hoverPause, setHoverPause] = useState(false);
  const hoverPauseRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();

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

  const effectiveDuration = reducedMotion ? Math.min(stageDuration, 4000) : stageDuration;

  return (
    <div
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
      style={{ ...font, maxWidth: 880, margin: "0 auto" }}
    >
      <style>{`
        @keyframes xpEwDemoFillBar {
          from { transform: scaleX(0.04); }
          to { transform: scaleX(1); }
        }
        @keyframes xpEwDemoRowIn {
          from { opacity: 0; transform: translate3d(0, 6px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes xpEwDemoBubble {
          from { opacity: 0; transform: translate3d(0, 6px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes xpEwDemoTile {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .xpEwDemo-fillHost {
          transform-origin: left center;
          transform: scaleX(0);
          background: rgba(200, 169, 110, 0.35);
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
          background: rgba(200, 169, 110, 0.12);
          border: 1px solid rgba(200, 169, 110, 0.22);
          transition: left 0.45s ${EASE};
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
          transition: color 0.3s ${EASE_SMOOTH};
        }
        .xpEwDemo-tabBtn-active {
          color: rgba(255, 255, 255, 0.92);
        }
        .xpEwDemo-canvasInner {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
          min-height: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .xpEwDemo-fillHost { animation: none !important; transform: scaleX(1) !important; opacity: 0.9; }
          .xpEwDemo-tabPill { transition: none !important; }
        }
        @media (max-width: 720px) {
          .xpEwDemo-advisor { display: none !important; }
          .xpEwDemo-shell { flex-direction: column !important; }
          .xpEwDemo-nav { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; }
        }
      `}</style>

      <div style={{ marginBottom: 14, textAlign: "center" }}>
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
          One surface. Three motions. Follow the demo to see signal, conversation, and shipped formats.
        </p>
      </div>

      <div className="xp-glass-card-dark xpEwDemo-tabPillTrack" style={{ marginBottom: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.14)" }}>
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

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
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
                  animation: `xpEwDemoFillBar ${effectiveDuration}ms linear forwards`,
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
          maxHeight: 380,
        }}
      >
        <div className="xp-liquid-glass-border" style={{ borderRadius: 16 }} />
        <div style={{ padding: 10, position: "relative", zIndex: 3 }}>
          <div className="xpEwDemo-shell" style={{ display: "flex", height: 312, gap: 8, minHeight: 0 }}>
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
              <StudioCanvas stage={stage} fillNonce={fillNonce} reducedMotion={reducedMotion} />
            </div>
            <AdvisorColumn />
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
        width: 128,
        flexShrink: 0,
        borderRadius: 12,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "visible",
      }}
    >
      <div
        style={{
          padding: "2px 0 10px",
          marginBottom: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflow: "visible",
          minHeight: 24,
        }}
      >
        <Logo size={14} variant="dark" />
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
              background: active ? "rgba(200,169,110,0.1)" : "transparent",
              border: active ? "1px solid rgba(200,169,110,0.18)" : "1px solid transparent",
              transition: `color 0.3s ${EASE}, background 0.3s ${EASE}, border-color 0.3s ${EASE}`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: active ? "var(--xp-gold)" : "rgba(255,255,255,0.18)",
                flexShrink: 0,
              }}
            />
            {name}
          </div>
        );
      })}
    </aside>
  );
}

function StudioCanvas({ stage, fillNonce, reducedMotion }: { stage: number; fillNonce: number; reducedMotion: boolean }) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", minHeight: 0, zIndex: 2 }}>
      {[0, 1, 2].map(s => (
        <div
          key={s}
          style={{
            opacity: stage === s ? 1 : 0,
            transform: stage === s ? "translate3d(0,0,0)" : "translate3d(0,4px,0)",
            transition: reducedMotion ? "none" : `opacity 0.4s ${EASE}, transform 0.45s ${EASE}`,
            pointerEvents: stage === s ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "12px 14px",
            overflow: s === 1 || s === 2 ? "auto" : "hidden",
          }}
        >
          {s === 0 ? <WatchCenter animKey={`${fillNonce}-w`} reducedMotion={reducedMotion} /> : null}
          {s === 1 ? <WorkCenter animKey={`${fillNonce}-k`} reducedMotion={reducedMotion} /> : null}
          {s === 2 ? <WrapCenter animKey={`${fillNonce}-r`} reducedMotion={reducedMotion} /> : null}
        </div>
      ))}
    </div>
  );
}

const SIGNAL_ROWS: { dot: string; src: string; line: string }[] = [
  { dot: "rgba(110,231,183,0.85)", src: "Briefing", line: "Rates steady, guidance cautious on hiring" },
  { dot: "rgba(251,191,36,0.9)", src: "Wire", line: "Sector read: buyers waiting for proof, not promises" },
  { dot: "rgba(148,163,184,0.8)", src: "Internal", line: "Your last memo flags delivery risk in Q3" },
  { dot: "rgba(96,165,250,0.85)", src: "Field", line: "Customer calls repeat the same three objections" },
  { dot: "rgba(167,139,250,0.85)", src: "Scan", line: "Competitor launched a thinner story with louder distribution" },
];

const WATCH_TARGET_INDEX = 1;

function WatchCenter({ animKey, reducedMotion }: { animKey: string; reducedMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, click: false });

  useEffect(() => {
    setPhase(0);
    setCursor({ x: 0, y: 0, visible: false, click: false });
    if (reducedMotion) {
      setPhase(4);
      return;
    }
    const t0 = window.setTimeout(() => setPhase(1), 500);
    const t1 = window.setTimeout(() => setPhase(2), 1600);
    const t2 = window.setTimeout(() => setPhase(3), 2600);
    const t3 = window.setTimeout(() => setPhase(4), 3100);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [animKey, reducedMotion]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const wrap = wrapRef.current.getBoundingClientRect();
    if (phase === 0) {
      setCursor(c => ({ ...c, visible: false }));
      return;
    }
    if (phase === 1) {
      setCursor({
        x: wrap.width * 0.82,
        y: 16,
        visible: true,
        click: false,
      });
      return;
    }
    if (phase >= 2 && targetRef.current) {
      const row = targetRef.current.getBoundingClientRect();
      setCursor({
        x: row.right - wrap.left - 10,
        y: row.top - wrap.top + row.height * 0.42,
        visible: true,
        click: phase >= 3,
      });
    }
  }, [phase]);

  return (
    <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%", minHeight: 0 }}>
      <DemoCursor x={cursor.x} y={cursor.y} visible={cursor.visible} click={cursor.click} />
      {SIGNAL_ROWS.map((row, i) => {
        const isTarget = i === WATCH_TARGET_INDEX;
        return (
          <div key={row.line} ref={isTarget ? targetRef : undefined}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "7px 0",
                animation: reducedMotion ? "none" : `xpEwDemoRowIn 0.45s ${EASE} both`,
                animationDelay: reducedMotion ? "0ms" : `${50 * i}ms`,
                borderRadius: phase >= 3 && isTarget ? 8 : 0,
                background: phase >= 3 && isTarget ? "rgba(200,169,110,0.08)" : "transparent",
                outline: phase >= 3 && isTarget ? "1px solid rgba(200,169,110,0.25)" : "none",
                transition: "background 0.25s ease, outline 0.25s ease",
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
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
            ) : null}
          </div>
        );
      })}
      {phase >= 4 ? (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            animation: reducedMotion ? "none" : `xpEwDemoBubble 0.4s ${EASE} both`,
          }}
        >
          <div className="xp-mono" style={{ ...mono, fontSize: 8, letterSpacing: "0.1em", color: "var(--xp-gold)", marginBottom: 6 }}>
            Brief opened
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
            Pull the Wire item into a one-page brief: thesis, audience, and the proof buyers still need before they move. Watch keeps the signal tight so you open on substance, not noise.
          </div>
        </div>
      ) : null}
    </div>
  );
}

const REED_OPEN = "What is the single outcome you want a reader to act on?";
const USER_TYPE = "Credibility without the corporate fog. Plain stakes, plain ask.";
const REED_REPLY = "Good. Open with the tradeoff. Name what you refuse to soften, then prove it once.";

function WorkCenter({ animKey, reducedMotion }: { animKey: string; reducedMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");
  const [showUserBubble, setShowUserBubble] = useState(false);
  const [reedTail, setReedTail] = useState("");

  useEffect(() => {
    setPhase(0);
    setTyped("");
    setShowUserBubble(false);
    setReedTail("");
    if (reducedMotion) {
      setPhase(5);
      setTyped(USER_TYPE);
      setShowUserBubble(true);
      setReedTail(REED_REPLY);
      return;
    }
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase(1), 400));
    let ti = 0;
    const typeSpeed = 38;
    for (let i = 1; i <= USER_TYPE.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setTyped(USER_TYPE.slice(0, i));
          if (i === USER_TYPE.length) setPhase(2);
        }, 900 + i * typeSpeed),
      );
    }
    const sendAt = 900 + (USER_TYPE.length + 1) * typeSpeed + 500;
    timers.push(window.setTimeout(() => setPhase(3), sendAt));
    timers.push(window.setTimeout(() => {
      setShowUserBubble(true);
      setTyped("");
      setPhase(4);
    }, sendAt + 400));
    const reedStart = sendAt + 900;
    timers.push(window.setTimeout(() => setPhase(5), reedStart));
    for (let j = 1; j <= REED_REPLY.length; j++) {
      timers.push(
        window.setTimeout(() => setReedTail(REED_REPLY.slice(0, j)), reedStart + j * 28),
      );
    }
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [animKey, reducedMotion]);

  return (
    <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            alignSelf: "flex-start",
            maxWidth: "88%",
            animation: reducedMotion ? "none" : `xpEwDemoBubble 0.4s ${EASE} both`,
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
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(200,169,110,0.85)", display: "block", marginBottom: 4 }}>Reed</span>
            {REED_OPEN}
          </div>
        </div>
        {showUserBubble ? (
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "88%",
              animation: reducedMotion ? "none" : `xpEwDemoBubble 0.35s ${EASE} both`,
            }}
          >
            <div
              className="xp-glass-card-dark"
              style={{
                borderRadius: 10,
                padding: "7px 10px",
                fontSize: 11,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(200,169,110,0.3)",
                background: "rgba(200,169,110,0.08)",
              }}
            >
              <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 4 }}>You</span>
              {USER_TYPE}
            </div>
          </div>
        ) : null}
        {reedTail ? (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "88%",
              animation: reducedMotion ? "none" : `xpEwDemoBubble 0.35s ${EASE} both`,
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
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(200,169,110,0.85)", display: "block", marginBottom: 4 }}>Reed</span>
              {reedTail}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          readOnly
          value={typed}
          placeholder={phase < 2 && !showUserBubble ? "Type your reply…" : ""}
          rows={2}
          style={{
            ...font,
            flex: 1,
            resize: "none",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)",
            color: "rgba(255,255,255,0.88)",
            fontSize: 11,
            padding: "8px 10px",
            lineHeight: 1.4,
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            ...mono,
            flexShrink: 0,
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "default",
            background: phase === 3 ? "rgba(200,169,110,0.45)" : "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.92)",
            transition: "background 0.2s ease",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const OUTPUT_LABELS = ["LinkedIn Post", "Essay", "Podcast", "Email", "Board Report", "Newsletter"] as const;
const WRAP_TARGET_NAME = "LinkedIn Post" as const;
const WRAP_DOC =
  "Lead with the tradeoff, not the company history. One proof point, one question. Keep the hook before the fold so the feed actually shows your point.";

function WrapCenter({ animKey, reducedMotion }: { animKey: string; reducedMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const linkedInRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, click: false });
  const [docText, setDocText] = useState("");
  const [showWrapCursor, setShowWrapCursor] = useState(true);

  useEffect(() => {
    setPhase(0);
    setCursor({ x: 0, y: 0, visible: false, click: false });
    setDocText("");
    setShowWrapCursor(true);
    if (reducedMotion) {
      setPhase(3);
      setDocText(WRAP_DOC);
      setShowWrapCursor(false);
      return;
    }
    const t0 = window.setTimeout(() => setPhase(1), 500);
    const t1 = window.setTimeout(() => setPhase(2), 1700);
    const t2 = window.setTimeout(() => setPhase(3), 2300);
    const t3 = window.setTimeout(() => setShowWrapCursor(false), 2700);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [animKey, reducedMotion]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const wrap = wrapRef.current.getBoundingClientRect();
    if (phase === 0) {
      setCursor(c => ({ ...c, visible: false }));
      return;
    }
    if (phase === 1) {
      setCursor({ x: wrap.width * 0.82, y: 20, visible: true, click: false });
      return;
    }
    if (phase >= 2 && linkedInRef.current) {
      const el = linkedInRef.current.getBoundingClientRect();
      setCursor({
        x: el.left - wrap.left + el.width * 0.55,
        y: el.top - wrap.top + el.height * 0.48,
        visible: true,
        click: phase >= 3,
      });
    }
  }, [phase]);

  useEffect(() => {
    if (phase < 3 || reducedMotion) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDocText(WRAP_DOC.slice(0, i));
      if (i >= WRAP_DOC.length) window.clearInterval(id);
    }, 20);
    return () => window.clearInterval(id);
  }, [phase, reducedMotion]);

  if (phase >= 3) {
    return (
      <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        {showWrapCursor ? <DemoCursor x={cursor.x} y={cursor.y} visible={cursor.visible} click={cursor.click} /> : null}
        <div
          style={{
            flex: 1,
            borderRadius: 10,
            padding: "12px 14px",
            background: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 0,
            animation: reducedMotion ? "none" : `xpEwDemoBubble 0.45s ${EASE} both`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div className="xp-mono" style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", color: "var(--xp-gold)", textTransform: "uppercase" }}>
              LinkedIn Post
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Wrapped output</div>
          </div>
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.82)",
              whiteSpace: "pre-wrap",
              flex: 1,
              overflow: "auto",
            }}
          >
            {docText}
            {docText.length > 0 && docText.length < WRAP_DOC.length ? (
              <span style={{ display: "inline-block", width: 6, height: 14, marginLeft: 1, background: "var(--xp-gold)", verticalAlign: "-2px", opacity: 0.7 }} />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%" }}>
      <DemoCursor x={cursor.x} y={cursor.y} visible={cursor.visible} click={cursor.click} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
          height: "100%",
          alignContent: "start",
        }}
      >
        {OUTPUT_LABELS.map((name, i) => {
          const isTarget = name === WRAP_TARGET_NAME;
          return (
            <div
              key={name}
              ref={isTarget ? linkedInRef : undefined}
              className="xp-glass-card-dark"
              style={{
                borderRadius: 8,
                padding: "8px 9px",
                fontSize: 9,
                fontWeight: isTarget ? 600 : 500,
                letterSpacing: "0.02em",
                color: isTarget ? "var(--xp-gold)" : "rgba(255,255,255,0.55)",
                border: isTarget ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(255,255,255,0.08)",
                background: isTarget ? "rgba(200,169,110,0.06)" : "rgba(255,255,255,0.03)",
                animation: reducedMotion ? "none" : `xpEwDemoTile 0.4s ${EASE} both`,
                animationDelay: reducedMotion ? "0ms" : `${40 * i}ms`,
              }}
            >
              {name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdvisorColumn() {
  return (
    <aside
      className="xp-glass-card-dark xpEwDemo-advisor"
      style={{
        width: 118,
        flexShrink: 0,
        borderRadius: 12,
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <AdvisorBlock title="Quality" bars={[0.9, 0.7, 0.55]} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
      <AdvisorBlock title="Reed" bars={[0.85, 0.5]} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
      <AdvisorBlock title="Signals" bars={[0.65, 0.75, 0.45]} />
    </aside>
  );
}

function AdvisorBlock({ title, bars }: { title: string; bars: number[] }) {
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
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {bars.map((w, i) => (
          <div
            key={i}
            style={{
              height: 3,
              borderRadius: 2,
              width: `${Math.round(w * 100)}%`,
              background: "linear-gradient(90deg, rgba(200,169,110,0.4), rgba(255,255,255,0.1))",
            }}
          />
        ))}
      </div>
    </div>
  );
}
