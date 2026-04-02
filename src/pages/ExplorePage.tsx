import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

const CTA_MAILTO = "mailto:mark@coastalintelligence.ai?subject=EVERYWHERE%20Studio%3A%20Let's%20Talk";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// ── Scroll reveal hook ──────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

// ── Reveal wrapper ──────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  threshold = 0.15,
  scale,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  scale?: boolean;
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollReveal(threshold);
  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : `translateY(30px) scale(${scale ? 0.95 : 1})`,
        transition: `opacity 0.9s ${EASE} ${delay}ms, transform 0.9s ${EASE} ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');

:root {
  --navy: #FAFAF8;
  --navy-mid: #FFFFFF;
  --gold: #F5C642;
  --gold-dim: rgba(245, 198, 66, 0.12);
  --blue: #6B8FD4;
  --white: #111111;
  --white-dim: #5A5A58;
  --divider: rgba(0, 0, 0, 0.06);
  --font: 'Afacad Flux', sans-serif;
}

.xp {
  background: var(--navy);
  color: var(--white);
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  position: relative;
}

.xp em { font-style: normal; color: var(--gold); }
.xp a { color: inherit; text-decoration: none; }

/* Nav */
.xp-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease;
}
.xp-nav.scrolled {
  background: rgba(250, 250, 248, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.xp-nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}
.xp-nav-link {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #5A5A58;
  transition: color 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font);
  padding: 0;
}
.xp-nav-link:hover { color: #111111; }

/* Buttons */
.xp-btn-gold {
  display: inline-block;
  padding: 14px 36px;
  background: #111111;
  color: #FFFFFF;
  border: none;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-gold:hover { background: #333333; transform: translateY(-1px); }
.xp-btn-outline {
  display: inline-block;
  padding: 14px 36px;
  background: transparent;
  color: #111111;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 100px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: border-color 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-outline:hover { border-color: rgba(0, 0, 0, 0.3); transform: translateY(-1px); }

/* Section container */
.xp-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 40px;
}

/* Grid */
.xp-grid-2 {
  display: grid;
  grid-template-columns: 5fr 6fr;
  gap: 80px;
  align-items: start;
}

/* Rooms */
.xp-rooms {
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  gap: 0;
}
.xp-room-divider {
  background: var(--divider);
  width: 1px;
  align-self: stretch;
}
.xp-room { padding: 0 36px; }
.xp-room:first-child { padding-left: 0; }
.xp-room:last-child { padding-right: 0; }
.xp-room-name {
  font-size: clamp(36px, 4vw, 56px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #111111;
  margin: 0 0 8px;
}
.xp-room-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #F5C642;
  margin-bottom: 20px;
}
.xp-room-body {
  font-size: 15px;
  color: var(--white-dim);
  line-height: 1.65;
  margin-bottom: 24px;
}
.xp-room-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.xp-room-items li {
  font-size: 14px;
  color: var(--white-dim);
  padding: 8px 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.xp-room-items li::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  flex-shrink: 0;
  position: relative;
  top: -2px;
}

/* Checkpoints */
.xp-cp {
  padding: 18px 0;
  border-bottom: 1px solid var(--divider);
  line-height: 1.6;
}
.xp-cp-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
  margin-right: 10px;
  font-variant-numeric: tabular-nums;
}
.xp-cp-name {
  font-weight: 700;
  color: #111111;
  margin-right: 6px;
}
.xp-cp-desc {
  color: var(--white-dim);
  font-size: 15px;
}

/* Moments */
.xp-moment {
  padding: 24px 0;
  border-bottom: 1px solid var(--divider);
}
.xp-moment:first-child { border-top: 1px solid var(--divider); }
.xp-moment-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.xp-moment-text {
  color: var(--white-dim);
  font-size: 16px;
  line-height: 1.6;
}

/* Footer */
.xp-footer {
  border-top: 1px solid var(--divider);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1080px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--white-dim);
}

/* Mobile */
@media (max-width: 768px) {
  .xp-nav { padding: 0 20px; }
  .xp-nav-links-desktop { display: none !important; }
  .xp-inner { padding: 0 24px; }
  .xp-grid-2 { grid-template-columns: 1fr; gap: 48px; }
  .xp-rooms { grid-template-columns: 1fr; gap: 0; }
  .xp-room-divider { width: 100%; height: 1px; align-self: auto; }
  .xp-room { padding: 32px 0; }
  .xp-room:first-child { padding-left: 0; padding-top: 0; }
  .xp-room:last-child { padding-right: 0; }
  .xp-footer { flex-direction: column; gap: 16px; text-align: center; padding: 32px 24px; }
}
@media (max-width: 820px) {
  .xp-problem-grid { grid-template-columns: 1fr !important; gap: 40px !important; padding: 0 24px !important; }
}
@media (max-width: 400px) {
  .xp-hero-ctas { flex-direction: column !important; width: 100% !important; }
  .xp-hero-ctas > * { width: 100% !important; text-align: center !important; }
}
`;

// ─────────────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const howRef = useRef<HTMLDivElement>(null);
  const standardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroParallax, setHeroParallax] = useState({ y: 0, opacity: 1 });
  const [navScrolled, setNavScrolled] = useState(false);

  // Hero parallax + nav background
  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      setHeroParallax({
        y: sy * -0.3,
        opacity: Math.max(0, 1 - sy / (vh * 0.55)),
      });
      setNavScrolled(sy > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sectionPad = isMobile ? "64px 0" : "120px 0";

  return (
    <div className="xp">
      <style>{CSS}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className={`xp-nav ${navScrolled ? "scrolled" : ""}`}>
        <Logo size="sm" variant="light" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <div className="xp-nav-links">
          {!isMobile && (
            <div className="xp-nav-links-desktop" style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <button className="xp-nav-link" onClick={() => scrollTo(howRef)}>How It Works</button>
              <button className="xp-nav-link" onClick={() => scrollTo(standardRef)}>Quality</button>
            </div>
          )}
          <button className="xp-nav-link" onClick={() => navigate("/auth")}>Sign In</button>
          <a href={CTA_MAILTO} className="xp-btn-gold" style={{ padding: "8px 22px", fontSize: 12, letterSpacing: "0.08em" }}>
            Let's Talk
          </a>
        </div>
      </nav>

      {/* ── SECTION 01: HERO ─────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(180deg, #FAFAF8 0%, #F5F3EE 40%, #FAFAF8 100%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 900,
            padding: "0 32px",
            transform: `translateY(${heroParallax.y}px)`,
            opacity: heroParallax.opacity,
            willChange: "transform, opacity",
          }}
        >
          <h1 style={{
            fontSize: "clamp(42px, 7vw, 88px)",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            margin: "0 0 28px",
            color: "#111111",
          }}>
            <span style={{
              display: "block",
              animation: "xpFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
              fontWeight: 700,
            }}>
              Your thinking reaches your audience.
            </span>
            <em style={{
              display: "block",
              animation: "xpFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
              fontWeight: 500,
              color: "#F5C642",
            }}>
              In your voice. Better than you'd write it yourself.
            </em>
          </h1>
          <p style={{
            fontSize: isMobile ? 17 : 20,
            color: "#5A5A58",
            maxWidth: 540,
            margin: "0 auto 40px",
            lineHeight: 1.6,
            animation: `xpFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both`,
          }}>
            Watson is your guide. You talk, and the world hears you.
          </p>
          <div className="xp-hero-ctas" style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            animation: `xpFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both`,
          }}>
            <button className="xp-btn-gold" onClick={() => navigate("/auth?mode=signup")} style={{ border: "none" }}>Get Early Access</button>
            <a href="#how" className="xp-btn-outline" onClick={(e) => { e.preventDefault(); scrollTo(howRef); }}>
              See How It Works
            </a>
          </div>
        </div>
        <style>{`
          @keyframes xpFadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* ── SECTION 02: THE PROBLEM ────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <Reveal>
          <div className="xp-inner">
            <div style={{ borderLeft: "3px solid var(--gold)", paddingLeft: isMobile ? 20 : 32, maxWidth: 700 }}>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                margin: "0 0 28px",
              }}>
                The thought leaders you see everywhere aren't better thinkers.{" "}
                <em>They got their ideas out.</em>
              </h2>
              <p style={{ color: "var(--white-dim)", maxWidth: 580, marginBottom: 16 }}>
                You have the thinking. What you've been missing is someone to carry it, from your head, into the world, without you doing the work twice.
              </p>
              <p style={{ color: "var(--white-dim)", maxWidth: 580, marginBottom: 16 }}>
                This isn't about discipline or talent.
              </p>
              <p style={{ color: "var(--white-dim)", maxWidth: 580 }}>
                It's an infrastructure problem. Watson is the answer.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 03: WATSON ────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <Reveal>
          <div className="xp-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 16 }}>
              Watson
            </div>
            <p style={{ color: "var(--white-dim)", maxWidth: 640, textAlign: "center", marginBottom: 16 }}>
              Watson is your thinking partner. You talk. He listens. He asks until he finds what you actually mean, not what you said first. Then you're done.
            </p>
            <p style={{ color: "var(--white-dim)", maxWidth: 640, textAlign: "center", marginBottom: 48 }}>
              No editing. No formatting. No chasing the idea across five tabs. Watson carries it. What comes back is done. In your voice. Ready to ship.
            </p>
            {/* Watson demo widget */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
              maxWidth: 440,
              width: "100%",
              marginBottom: 48,
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                background: "#FAFAF8",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5C642", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#5A5A58", letterSpacing: "0.04em" }}>Watson is listening</span>
              </div>
              {/* Chat area */}
              <div style={{ padding: "20px 20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <div style={{
                    background: "#F5F3EE",
                    borderRadius: "14px 14px 4px 14px",
                    padding: "10px 16px",
                    maxWidth: "80%",
                    fontSize: 13,
                    color: "#111111",
                    lineHeight: 1.5,
                  }}>
                    The people in your market who show up everywhere aren't better thinkers. They got their ideas out. Every week. On every channel. Without doing it alone.
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "14px 14px 14px 4px",
                    padding: "10px 16px",
                    maxWidth: "85%",
                    fontSize: 13,
                    color: "#333333",
                    lineHeight: 1.5,
                  }}>
                    <strong style={{ color: "#F5C642" }}>Core thesis:</strong> Infrastructure, not talent, separates visible thought leaders from invisible ones.<br /><br />
                    Who specifically needs to hear this?
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#F5C642", fontVariantNumeric: "tabular-nums" }}>86</span>
                    <span style={{ fontSize: 11, color: "#5A5A58", fontWeight: 500 }}>Impact Score</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["LinkedIn", "Newsletter", "Podcast"].map((f, i) => (
                      <span key={f} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: i < 2 ? "#F5F3EE" : "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        color: i < 2 ? "#5A5A58" : "rgba(0,0,0,0.25)",
                        letterSpacing: "0.02em",
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Supporting line */}
            <p style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 600,
              color: "var(--gold)",
              margin: 0,
              maxWidth: 720,
              textAlign: "center",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}>
              The people in your market who show up everywhere aren't better thinkers. They have better infrastructure.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 04: YOU KNOW THIS FEELING ─────────────────── */}
      <section style={{ padding: sectionPad }}>
        <Reveal>
          <div className="xp-inner">
            <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
              <h2 style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 16px",
              }}>
                The idea is in your head. Not in the world.
              </h2>
              <p style={{ color: "var(--white-dim)", maxWidth: 540, margin: "0 auto" }}>
                You've been carrying ideas that deserve an audience. The problem was never the thinking. It was the distance between having the thought and getting it out. In your voice, at the quality it deserves, on every channel that matters.
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 20,
            }}>
              {[
                { label: "Sunday night", text: "The week is ending. You had three ideas worth writing about. None of them made it out." },
                { label: "On a plane", text: "You write two pages of thinking in a notebook. It never becomes anything." },
                { label: "Watching someone else", text: "You see someone on stage or in your feed saying something you've thought for years. They just got it out first." },
                { label: "After the conversation", text: "You just explained something perfectly to a client. Room changed. No one else will ever hear that version of it." },
              ].map((m) => (
                <div key={m.label} style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 12,
                  padding: "28px 32px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--gold)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}>{m.label}</div>
                  <div style={{ color: "var(--white-dim)", fontSize: 16, lineHeight: 1.6 }}>{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 05: THE SYSTEM ─────────────────────────────── */}
      <section style={{ padding: sectionPad, background: "#FFFFFF" }}>
        <Reveal>
          <div className="xp-inner" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 16 }}>
              EVERYWHERE Studio
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: "0 auto 28px",
              maxWidth: 800,
            }}>
              You talk. Watson listens until he really gets it. Then {MARKETING_NUMBERS.specialistCount} specialists turn what you said into publication-ready content, in your voice, verified, every word traceable back to you.
            </h2>
            <p style={{ color: "var(--white-dim)", maxWidth: 600, margin: "0 auto 0", textAlign: "center" }}>
              You talk. They work. You publish. Every word sounds like you. Every claim is verified. Nothing ships without passing {MARKETING_NUMBERS.qualityCheckpoints} quality checkpoints.
            </p>
            <div style={{ display: "flex", gap: isMobile ? 32 : 56, justifyContent: "center", flexWrap: "wrap", marginTop: 56, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
              {[
                { headline: "Always ready.", body: "Whenever you have something to say, a post, a brief, a board deck, a newsletter, Watson is there. You talk. It's done." },
                { headline: "Every channel.", body: "Newsletter, LinkedIn, podcast, Substack, one idea, every format, native to each." },
                { headline: "Zero left to finish.", body: "You talk to Watson. What comes back is done." },
              ].map((block) => (
                <div key={block.headline} style={{ textAlign: "center", maxWidth: 280 }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#111111", marginBottom: 8 }}>
                    {block.headline}
                  </div>
                  <div style={{ fontSize: 14, color: "#5A5A58", lineHeight: 1.6 }}>
                    {block.body}
                  </div>
                </div>
              ))}
            </div>
            {/* Testimonial */}
            <div style={{ marginTop: 56, maxWidth: 640, marginInline: "auto", textAlign: "left" }}>
              <blockquote style={{
                margin: 0,
                padding: "0 0 0 24px",
                borderLeft: "3px solid #F5C642",
              }}>
                <p style={{
                  fontSize: "clamp(18px, 2.5vw, 22px)",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: "#111111",
                  fontStyle: "italic",
                  margin: "0 0 12px",
                  letterSpacing: "-0.01em",
                }}>
                  "Better than what I was writing myself."
                </p>
                <p style={{
                  fontSize: 14,
                  color: "#5A5A58",
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                }}>
                  Doug C. had a decade of thinking that never made it out. Now it does, in his voice.
                </p>
                <footer style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "#888888",
                }}>
                  Doug C., Executive Coach
                </footer>
              </blockquote>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 06: WATCH. WORK. WRAP. ────────────────────── */}
      <section ref={howRef} style={{ padding: sectionPad }}>
        <div className="xp-inner">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 16 }}>
                Three rooms. One idea.
              </div>
              <h2 style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                margin: 0,
              }}>
                Watch. Work. Wrap.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            {isMobile ? (
              /* Mobile: stacked with horizontal dividers */
              <div>
                {[
                  {
                    name: "Watch",
                    tag: "Watch",
                    body: "You arrive knowing what your audience is already thinking. Your ideas land in context, not into noise.",
                    items: [] as string[],
                  },
                  {
                    name: "Work",
                    tag: "Work",
                    body: "Your idea becomes publication-ready content. In your voice. Verified. Zero AI fingerprints. Nothing ships until it reads like a human made every decision.",
                    items: [] as string[],
                  },
                  {
                    name: "Wrap",
                    tag: "Wrap",
                    body: "One idea. Every channel. Simultaneously. Newsletter, LinkedIn, podcast, Substack, formatted for each, ready to publish.",
                    items: [] as string[],
                  },
                ].map((room, i) => (
                  <div key={room.name}>
                    {i > 0 && <div style={{ height: 1, background: "var(--divider)", margin: "8px 0" }} />}
                    <div className="xp-room">
                      <div className="xp-room-name">{room.name}</div>
                      <div className="xp-room-tag">{room.tag}</div>
                      <p className="xp-room-body">{room.body}</p>
                      {room.items.length > 0 && (
                        <ul className="xp-room-items">
                          {room.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: three columns with vertical dividers */
              <div className="xp-rooms">
                {[
                  {
                    name: "Watch",
                    tag: "Watch",
                    body: "You arrive knowing what your audience is already thinking. Your ideas land in context, not into noise.",
                    items: [] as string[],
                  },
                  {
                    name: "Work",
                    tag: "Work",
                    body: "Your idea becomes publication-ready content. In your voice. Verified. Zero AI fingerprints. Nothing ships until it reads like a human made every decision.",
                    items: [] as string[],
                  },
                  {
                    name: "Wrap",
                    tag: "Wrap",
                    body: "One idea. Every channel. Simultaneously. Newsletter, LinkedIn, podcast, Substack, formatted for each, ready to publish.",
                    items: [] as string[],
                  },
                ].flatMap((room, i) => {
                  const el = (
                    <div key={room.name} className="xp-room">
                      <div className="xp-room-name">{room.name}</div>
                      <div className="xp-room-tag">{room.tag}</div>
                      <p className="xp-room-body">{room.body}</p>
                      {room.items.length > 0 && (
                        <ul className="xp-room-items">
                          {room.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                  return i < 2 ? [el, <div key={`div-${i}`} className="xp-room-divider" />] : [el];
                })}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 07: QUALITY STANDARD ───────────────────── */}
      <section ref={standardRef} style={{ padding: sectionPad, background: "#FFFFFF" }}>
        <div className="xp-inner">
          <Reveal>
            <div style={{ maxWidth: 640 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: 16 }}>
                Quality Standard
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 24px",
              }}>
                Nothing ships unless it would fool a skeptic.
              </h2>
              <p style={{ color: "var(--white-dim)", maxWidth: 580 }}>
                Before any content reaches you, a hostile reader runs through it. Looking for AI patterns, assembled phrases, anything that doesn't sound like a human made a real decision. If it fails, it doesn't ship. Not once. Not ever. AI slop is everywhere. This is the only standard that keeps your name off it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 08: ANCHOR LINE ──────────────────────────── */}
      <section style={{ padding: isMobile ? "56px 0" : "100px 0" }}>
        <Reveal>
          <div className="xp-inner" style={{ textAlign: "center" }}>
            <p style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}>
              Most AI writes for you. <em>EVERYWHERE</em> works for you.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 09: FINAL CTA ────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111", padding: "120px 0" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 720, padding: "0 32px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#F5C642", marginBottom: 20 }}>
              Let's Talk
            </div>
            <h2 style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: "0 0 28px",
              color: "#FFFFFF",
            }}>
              Your thinking deserves to <em style={{ color: "#F5C642" }}>be heard.</em>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center" }}>
              You don't need more discipline. You need a system that carries the idea from your head to your audience, every week, without it sitting on your to-do list.
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center" }}>
              The output is yours because the input was yours.
            </p>
            <p style={{ color: "#F5C642", maxWidth: 560, margin: "0 auto 44px", textAlign: "center", fontWeight: 500 }}>
              There's a mountain between the idea and the audience. EVERYWHERE Studio carries the mountain.
            </p>
            <div className="xp-hero-ctas" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/auth?mode=signup")} style={{ display: "inline-block", padding: "16px 44px", background: "#F5C642", color: "#111111", border: "none", borderRadius: 100, fontSize: 15, fontWeight: 700, fontFamily: "var(--font)", cursor: "pointer", transition: "opacity 0.2s" }}>
                Get Early Access
              </button>
              <a href={CTA_MAILTO} style={{ display: "inline-block", padding: "16px 44px", background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, fontSize: 15, fontWeight: 600, fontFamily: "var(--font)", textDecoration: "none", cursor: "pointer" }}>
                Let's Talk
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#FAFAF8", borderTop: "3px solid #F5C642" }}>
        <div className="xp-footer">
          <Logo size="sm" variant="light" />
          <span style={{ color: "#AAAAAA" }}>&copy; 2026 Mixed Grill, LLC</span>
        </div>
      </footer>
    </div>
  );
}
