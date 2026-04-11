import React, { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { EASE, EASE_SMOOTH } from "../../styles/marketing";

const TABS = ["Watch", "Work", "Wrap"] as const;

const font = { fontFamily: "var(--xp-font, 'Instrument Sans', system-ui, sans-serif)" };
const mono = { fontFamily: "var(--xp-mono, 'DM Mono', monospace)" };

/** Flat panel (toned down vs liquid glass). */
const panelSurface: React.CSSProperties = {
  background: "rgba(8, 16, 28, 0.82)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12,
  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
};

export interface EverywhereDemoProps {
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

function DemoCursor({ x, y, visible, click }: { x: number; y: number; visible: boolean; click?: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 22,
        height: 22,
        marginLeft: -5,
        marginTop: -3,
        pointerEvents: "none",
        zIndex: 50,
        transition: `left 0.65s ${EASE}, top 0.65s ${EASE}`,
      }}
      aria-hidden
    >
      {click ? (
        <span
          style={{
            position: "absolute",
            left: -10,
            top: -10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid rgba(200,169,110,0.55)",
            animation: "xpEwDemoClickRing 0.38s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ) : null}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
          transform: click ? "translateY(2px)" : "translateY(0)",
          transition: "transform 0.08s ease-out",
        }}
      >
        <path
          d="M5 3l14 10.5-5.5 1.2L10.5 21 5 3z"
          fill="rgba(255,255,255,0.95)"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function EverywhereDemo({ stageDuration = 14500, autoPlay = true }: EverywhereDemoProps) {
  const [stage, setStage] = useState(0);
  const [fillNonce, setFillNonce] = useState(0);
  const [hoverPause, setHoverPause] = useState(false);
  const hoverPauseRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    hoverPauseRef.current = hoverPause;
  }, [hoverPause]);

  const selectTab = (i: number) => {
    setStage(i);
    setFillNonce(n => n + 1);
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
      style={{ ...font, maxWidth: 1040, margin: "0 auto" }}
    >
      <style>{`
        @keyframes xpEwDemoFillBar {
          from { transform: scaleX(0.04); }
          to { transform: scaleX(1); }
        }
        @keyframes xpEwDemoRowIn {
          from { opacity: 0; transform: translate3d(0, 5px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes xpEwDemoBubble {
          from { opacity: 0; transform: translate3d(0, 5px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes xpEwDemoTile {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes xpEwDemoClickRing {
          from { transform: scale(0.35); opacity: 0.95; }
          to { transform: scale(1.15); opacity: 0; }
        }
        @keyframes xpEwDemoBriefIn {
          from { opacity: 0; transform: scale(0.96) translate3d(0, 8px, 0); }
          to { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .xpEwDemo-fillHost {
          transform-origin: left center;
          transform: scaleX(0);
          background: rgba(200, 169, 110, 0.38);
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
          background: rgba(200, 169, 110, 0.1);
          border: 1px solid rgba(200, 169, 110, 0.18);
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
            fontSize: "clamp(20px, 3.2vw, 28px)",
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
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--xp-dim-dark)",
            maxWidth: 460,
            margin: "0 auto",
          }}
        >
          One surface. Three motions. Follow the demo to see signal, conversation, and shipped formats.
        </p>
      </div>

      <div className="xpEwDemo-tabPillTrack" style={{ ...panelSurface, marginBottom: 12 }}>
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
        style={{
          position: "relative",
          isolation: "isolate",
          maxHeight: 480,
          ...panelSurface,
          borderRadius: 16,
        }}
      >
        <div style={{ padding: 12, position: "relative", zIndex: 3 }}>
          <div className="xpEwDemo-shell" style={{ display: "flex", height: 420, gap: 10, minHeight: 0 }}>
            <DemoNav stage={stage} />
            <div
              className="xpEwDemo-canvasInner"
              style={{
                flex: 1,
                minWidth: 0,
                ...panelSurface,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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
      className="xpEwDemo-nav"
      style={{
        width: 136,
        flexShrink: 0,
        ...panelSurface,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 4,
        overflow: "visible",
      }}
    >
      <div
        style={{
          padding: "2px 0 10px",
          marginBottom: 2,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          overflow: "visible",
          minHeight: 24,
        }}
      >
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
              padding: "6px 7px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: active ? 600 : 500,
              letterSpacing: "0.04em",
              color: active ? "var(--xp-gold)" : "rgba(255,255,255,0.34)",
              background: active ? "rgba(200,169,110,0.08)" : "transparent",
              border: active ? "1px solid rgba(200,169,110,0.16)" : "1px solid transparent",
              transition: `color 0.3s ${EASE}, background 0.3s ${EASE}, border-color 0.3s ${EASE}`,
            }}
          >
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
            transform: stage === s ? "translate3d(0,0,0)" : "translate3d(0,3px,0)",
            transition: reducedMotion ? "none" : `opacity 0.35s ${EASE}, transform 0.4s ${EASE}`,
            pointerEvents: stage === s ? "auto" : "none",
            position: "absolute",
            inset: 0,
            padding: "14px 16px",
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

const SIGNAL_ROWS: { src: string; line: string }[] = [
  { src: "Briefing", line: "Rates steady, guidance cautious on hiring" },
  { src: "Wire", line: "Sector read: buyers waiting for proof, not promises" },
  { src: "Internal", line: "Your last memo flags delivery risk in Q3" },
  { src: "Field", line: "Customer calls repeat the same three objections" },
  { src: "Scan", line: "Competitor launched a thinner story with louder distribution" },
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
    const t0 = window.setTimeout(() => setPhase(1), 400);
    const t1 = window.setTimeout(() => setPhase(2), 1200);
    const t2 = window.setTimeout(() => setPhase(3), 2100);
    const t3 = window.setTimeout(() => setPhase(4), 2480);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [animKey, reducedMotion]);

  useEffect(() => {
    if (phase === 3) {
      setCursor(c => ({ ...c, click: true }));
      const t = window.setTimeout(() => setCursor(c => ({ ...c, click: false })), 220);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const wrap = wrapRef.current.getBoundingClientRect();
    if (phase === 0) {
      setCursor(c => ({ ...c, visible: false, click: false }));
      return;
    }
    if (phase === 1) {
      setCursor({
        x: wrap.width * 0.84,
        y: 18,
        visible: true,
        click: false,
      });
      return;
    }
    if (phase >= 2 && phase <= 3 && targetRef.current) {
      const row = targetRef.current.getBoundingClientRect();
      setCursor({
        x: row.right - wrap.left - 12,
        y: row.top - wrap.top + row.height * 0.4,
        visible: true,
        click: phase === 3,
      });
      return;
    }
    if (phase >= 4) {
      setCursor({ x: 0, y: 0, visible: false, click: false });
    }
  }, [phase]);

  return (
    <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%", minHeight: 0 }}>
      <DemoCursor x={cursor.x} y={cursor.y} visible={cursor.visible} click={cursor.click} />
      <div
        style={{
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {SIGNAL_ROWS.map((row, i) => {
          const isTarget = i === WATCH_TARGET_INDEX;
          return (
            <div key={row.line} ref={isTarget ? targetRef : undefined}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  animation: reducedMotion ? "none" : `xpEwDemoRowIn 0.4s ${EASE} both`,
                  animationDelay: reducedMotion ? "0ms" : `${45 * i}ms`,
                  background: phase >= 3 && isTarget ? "rgba(200,169,110,0.07)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="xp-mono"
                    style={{
                      ...mono,
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.38)",
                      marginBottom: 4,
                    }}
                  >
                    {row.src}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.86)", lineHeight: 1.45 }}>
                    {row.line}
                  </div>
                </div>
              </div>
              {i < SIGNAL_ROWS.length - 1 ? (
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginLeft: 12, marginRight: 12 }} />
              ) : null}
            </div>
          );
        })}
      </div>

      {phase >= 4 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(2, 8, 16, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: reducedMotion ? "none" : "xpEwDemoBriefIn 0.45s ease both",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(10, 18, 30, 0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span className="xp-mono" style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", color: "var(--xp-gold)", textTransform: "uppercase" }}>
                Brief
              </span>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", lineHeight: 1 }} aria-hidden>
                ×
              </span>
            </div>
            <div style={{ padding: "14px 14px 16px", fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.82)" }}>
              Pull the Wire line into a one-page brief: thesis, audience, and the proof buyers still need before they move. Watch keeps the signal tight so you open on substance, not noise.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const REED_OPEN = "What is the single outcome you want a reader to act on?";
const USER_TYPE = "Credibility without the corporate fog. Plain stakes, plain ask.";
const REED_REPLY =
  "Good. Open with the tradeoff, then prove it once. What is the one risk you want them to feel before they scroll away?";

function bubbleShell(side: "reed" | "you"): React.CSSProperties {
  return {
    borderRadius: 10,
    padding: "8px 11px",
    fontSize: 12,
    lineHeight: 1.45,
    border: side === "you" ? "1px solid rgba(200,169,110,0.28)" : "1px solid rgba(255,255,255,0.1)",
    background: side === "you" ? "rgba(200,169,110,0.07)" : "rgba(255,255,255,0.05)",
  };
}

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
    const startType = 220;
    const charMs = 5;
    timers.push(window.setTimeout(() => setPhase(1), 280));
    for (let i = 1; i <= USER_TYPE.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setTyped(USER_TYPE.slice(0, i));
          if (i === USER_TYPE.length) setPhase(2);
        }, startType + i * charMs),
      );
    }
    const sendAt = startType + (USER_TYPE.length + 1) * charMs + 280;
    timers.push(window.setTimeout(() => setPhase(3), sendAt));
    timers.push(
      window.setTimeout(() => {
        setShowUserBubble(true);
        setTyped("");
        setPhase(4);
      }, sendAt + 320),
    );
    const reedStart = sendAt + 520;
    timers.push(window.setTimeout(() => setPhase(5), reedStart));
    const reedChar = 4;
    for (let j = 1; j <= REED_REPLY.length; j++) {
      timers.push(window.setTimeout(() => setReedTail(REED_REPLY.slice(0, j)), reedStart + j * reedChar));
    }
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [animKey, reducedMotion]);

  return (
    <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            alignSelf: "flex-start",
            maxWidth: "88%",
            animation: reducedMotion ? "none" : `xpEwDemoBubble 0.35s ${EASE} both`,
          }}
        >
          <div style={{ ...bubbleShell("reed") }}>
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(200,169,110,0.8)", display: "block", marginBottom: 4 }}>Reed</span>
            {REED_OPEN}
          </div>
        </div>
        {showUserBubble ? (
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "88%",
              animation: reducedMotion ? "none" : `xpEwDemoBubble 0.3s ${EASE} both`,
            }}
          >
            <div style={{ ...bubbleShell("you") }}>
              <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 4 }}>You</span>
              {USER_TYPE}
            </div>
          </div>
        ) : null}
        {reedTail ? (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "88%",
              animation: reducedMotion ? "none" : `xpEwDemoBubble 0.3s ${EASE} both`,
            }}
          >
            <div style={{ ...bubbleShell("reed") }}>
              <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", color: "rgba(200,169,110,0.8)", display: "block", marginBottom: 4 }}>Reed</span>
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
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.22)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
            padding: "9px 11px",
            lineHeight: 1.4,
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            ...mono,
            flexShrink: 0,
            padding: "9px 12px",
            borderRadius: 10,
            border: "none",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "default",
            background: phase === 3 ? "rgba(200,169,110,0.42)" : "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.92)",
            transition: "background 0.15s ease",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const OUTPUT_LABELS = ["LinkedIn Post", "Essay", "Podcast", "Email", "Board Report", "Newsletter"] as const;

const WRAP_LI = `The tradeoff is simple: buyers will wait for proof, not promises. Name the proof in line one. End with one question they can answer in a comment.`;

const WRAP_EMAIL = `Subject: Proof before promises\n\nTeam,\n\nLead with what buyers already believe, then show the one artifact that closes the gap. Keep it under 180 words so it gets read before the next meeting.`;

function WrapCenter({ animKey, reducedMotion }: { animKey: string; reducedMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const linkedInRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, click: false });
  const [liText, setLiText] = useState("");
  const [emText, setEmText] = useState("");
  const [showWrapCursor, setShowWrapCursor] = useState(true);
  const [liSelected, setLiSelected] = useState(false);
  const [emSelected, setEmSelected] = useState(false);

  useEffect(() => {
    setPhase(0);
    setCursor({ x: 0, y: 0, visible: false, click: false });
    setLiText("");
    setEmText("");
    setShowWrapCursor(true);
    setLiSelected(false);
    setEmSelected(false);
    if (reducedMotion) {
      setPhase(6);
      setLiText(WRAP_LI);
      setEmText(WRAP_EMAIL);
      setShowWrapCursor(false);
      setLiSelected(true);
      setEmSelected(true);
      return;
    }
    const t0 = window.setTimeout(() => setPhase(1), 400);
    const t1 = window.setTimeout(() => setPhase(2), 1100);
    const t2 = window.setTimeout(() => setPhase(3), 1850);
    const t3 = window.setTimeout(() => setPhase(4), 2300);
    const t4 = window.setTimeout(() => setPhase(5), 3000);
    const t5 = window.setTimeout(() => {
      setPhase(6);
      setShowWrapCursor(false);
    }, 3450);
    return () => {
      [t0, t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [animKey, reducedMotion]);

  useEffect(() => {
    if (phase === 3) {
      setLiSelected(true);
      setCursor(c => ({ ...c, click: true }));
      const t = window.setTimeout(() => setCursor(c => ({ ...c, click: false })), 200);
      return () => window.clearTimeout(t);
    }
    if (phase === 5) {
      setEmSelected(true);
      setCursor(c => ({ ...c, click: true }));
      const t = window.setTimeout(() => setCursor(c => ({ ...c, click: false })), 200);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const wrap = wrapRef.current.getBoundingClientRect();
    if (phase === 0) {
      setCursor(c => ({ ...c, visible: false, click: false }));
      return;
    }
    if (phase === 1) {
      setCursor({ x: wrap.width * 0.82, y: 22, visible: true, click: false });
      return;
    }
    if (phase === 2 || phase === 3) {
      const el = linkedInRef.current?.getBoundingClientRect();
      if (el) {
        setCursor({
          x: el.left - wrap.left + el.width * 0.55,
          y: el.top - wrap.top + el.height * 0.45,
          visible: true,
          click: phase === 3,
        });
      }
      return;
    }
    if (phase === 4 || phase === 5) {
      const el = emailRef.current?.getBoundingClientRect();
      if (el) {
        setCursor({
          x: el.left - wrap.left + el.width * 0.5,
          y: el.top - wrap.top + el.height * 0.45,
          visible: true,
          click: phase === 5,
        });
      }
      return;
    }
    if (phase >= 6) {
      setCursor({ x: 0, y: 0, visible: false, click: false });
    }
  }, [phase]);

  useEffect(() => {
    if (phase < 6 || reducedMotion) return;
    let li = 0;
    let em = 0;
    const step = 5;
    const id = window.setInterval(() => {
      li = Math.min(WRAP_LI.length, li + step);
      em = Math.min(WRAP_EMAIL.length, em + step);
      setLiText(WRAP_LI.slice(0, li));
      setEmText(WRAP_EMAIL.slice(0, em));
      if (li >= WRAP_LI.length && em >= WRAP_EMAIL.length) window.clearInterval(id);
    }, 8);
    return () => window.clearInterval(id);
  }, [phase, reducedMotion]);

  if (phase >= 6) {
    return (
      <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            minHeight: 0,
            animation: reducedMotion ? "none" : `xpEwDemoBubble 0.35s ${EASE} both`,
          }}
        >
          <div
            style={{
              borderRadius: 10,
              padding: "10px 12px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div className="xp-mono" style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", color: "var(--xp-gold)", textTransform: "uppercase" }}>
              LinkedIn Post
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.84)", overflow: "auto", whiteSpace: "pre-wrap" }}>
              {liText}
              {liText.length > 0 && liText.length < WRAP_LI.length ? (
                <span style={{ display: "inline-block", width: 5, height: 12, marginLeft: 1, background: "var(--xp-gold)", verticalAlign: "-1px", opacity: 0.65 }} />
              ) : null}
            </div>
          </div>
          <div
            style={{
              borderRadius: 10,
              padding: "10px 12px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div className="xp-mono" style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", color: "var(--xp-gold)", textTransform: "uppercase" }}>
              Email
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.84)", overflow: "auto", whiteSpace: "pre-wrap" }}>
              {emText}
              {emText.length > 0 && emText.length < WRAP_EMAIL.length ? (
                <span style={{ display: "inline-block", width: 5, height: 12, marginLeft: 1, background: "var(--xp-gold)", verticalAlign: "-1px", opacity: 0.65 }} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={animKey} ref={wrapRef} style={{ position: "relative", height: "100%" }}>
      {showWrapCursor ? <DemoCursor x={cursor.x} y={cursor.y} visible={cursor.visible} click={cursor.click} /> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          height: "100%",
          alignContent: "start",
        }}
      >
        {OUTPUT_LABELS.map((name, i) => {
          const isLi = name === "LinkedIn Post";
          const isEm = name === "Email";
          const selected = (isLi && liSelected) || (isEm && emSelected);
          return (
            <div
              key={name}
              ref={isLi ? linkedInRef : isEm ? emailRef : undefined}
              style={{
                borderRadius: 9,
                padding: "9px 10px",
                fontSize: 10,
                fontWeight: selected ? 600 : 500,
                letterSpacing: "0.02em",
                color: selected ? "var(--xp-gold)" : "rgba(255,255,255,0.55)",
                border: selected ? "1px solid rgba(200,169,110,0.32)" : "1px solid rgba(255,255,255,0.08)",
                background: selected ? "rgba(200,169,110,0.06)" : "rgba(255,255,255,0.03)",
                animation: reducedMotion ? "none" : `xpEwDemoTile 0.35s ${EASE} both`,
                animationDelay: reducedMotion ? "0ms" : `${35 * i}ms`,
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
      className="xpEwDemo-advisor"
      style={{
        width: 122,
        flexShrink: 0,
        ...panelSurface,
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
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
              background: "linear-gradient(90deg, rgba(200,169,110,0.38), rgba(255,255,255,0.08))",
            }}
          />
        ))}
      </div>
    </div>
  );
}
