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

// ── Scroll progress (0-1 through entire page) ──────────────────────────────
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return progress;
}

// ── Element scroll progress (0-1 as element traverses viewport) ─────────────
function useElementScroll(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = 1 - (rect.top + rect.height) / (vh + rect.height);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return progress;
}

// ── Reveal wrapper (enhanced with direction support) ────────────────────────
type RevealDirection = "up" | "left" | "right" | "scale" | "none";

function Reveal({
  children,
  delay = 0,
  threshold = 0.15,
  direction = "up",
  distance = 40,
  duration = 900,
  once = true,
  scale,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  direction?: RevealDirection;
  distance?: number;
  duration?: number;
  once?: boolean;
  scale?: boolean;
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollReveal(threshold);

  const hiddenTransform = (() => {
    switch (direction) {
      case "up": return `translateY(${distance}px)`;
      case "left": return `translateX(${distance}px)`;
      case "right": return `translateX(-${distance}px)`;
      case "scale": return "scale(0.92)";
      case "none": return "none";
      default: return `translateY(${distance}px)`;
    }
  })();

  const show = once ? isVisible : isVisible;

  return (
    <div
      ref={ref}
      style={{
        opacity: show ? 1 : 0,
        transform: show
          ? `translateY(0) translateX(0) scale(1)`
          : `${hiddenTransform}${scale && direction !== "scale" ? " scale(0.95)" : ""}`,
        transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
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
  --ew-navy: #0D1B2A;
  --ew-navy-rich: #1B263B;
  --ew-gold: #F5C642;
  --ew-blue: #4A90D9;
  --ew-coral: #E8B4A0;
  --ew-white: #FFFFFF;
  --ew-offwhite: #F7F9FC;
  --ew-text-dark: #111111;
  --ew-text-body: #64748B;
  --ew-text-light: rgba(255,255,255,0.85);
  --ew-text-light-dim: rgba(255,255,255,0.5);
  --ew-border-light: #E2E8F0;
  --ew-border-dark: rgba(255,255,255,0.08);
  --ew-ease: ${EASE};
  --font: 'Afacad Flux', sans-serif;
}

.xp {
  background: var(--ew-navy);
  color: var(--ew-text-light);
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  position: relative;
}

/* em inherits section context: gold on dark, blue on light */
.xp em { font-style: normal; }
.xp a { color: inherit; text-decoration: none; }

/* Nav: starts transparent over dark hero, darkens on scroll */
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
  background: rgba(13, 27, 42, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--ew-border-dark);
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
  color: var(--ew-text-light-dim);
  transition: color 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font);
  padding: 0;
}
.xp-nav-link:hover { color: var(--ew-text-light); }

/* Buttons: dark surface variants (gold accent) */
.xp-btn-gold {
  display: inline-block;
  padding: 14px 36px;
  background: var(--ew-gold);
  color: var(--ew-navy);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: opacity 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }
/* Light surface variant: blue accent */
.xp-btn-blue {
  display: inline-block;
  padding: 14px 36px;
  background: var(--ew-blue);
  color: var(--ew-white);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: opacity 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-blue:hover { opacity: 0.88; transform: translateY(-1px); }
.xp-btn-outline {
  display: inline-block;
  padding: 14px 36px;
  background: transparent;
  color: var(--ew-text-light);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: border-color 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-outline:hover { border-color: rgba(255, 255, 255, 0.4); transform: translateY(-1px); }
/* Outline on light surfaces */
.xp-btn-outline-light {
  display: inline-block;
  padding: 14px 36px;
  background: transparent;
  color: var(--ew-text-dark);
  border: 1px solid var(--ew-border-light);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: border-color 0.25s ${EASE}, transform 0.25s ${EASE};
  text-decoration: none;
}
.xp-btn-outline-light:hover { border-color: #CBD5E1; transform: translateY(-1px); }

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

/* Rooms: dark surface (Watch.Work.Wrap on navy) */
.xp-rooms {
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  gap: 0;
}
.xp-room-divider {
  background: var(--ew-border-dark);
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
  color: var(--ew-text-light);
  margin: 0 0 8px;
}
.xp-room-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ew-gold);
  margin-bottom: 20px;
}
.xp-room-body {
  font-size: 15px;
  color: var(--ew-text-light-dim);
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
  color: var(--ew-text-light-dim);
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
  background: var(--ew-gold);
  flex-shrink: 0;
  position: relative;
  top: -2px;
}

/* Checkpoints */
.xp-cp {
  padding: 18px 0;
  border-bottom: 1px solid var(--ew-border-dark);
  line-height: 1.6;
}
.xp-cp-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--ew-gold);
  margin-right: 10px;
  font-variant-numeric: tabular-nums;
}
.xp-cp-name {
  font-weight: 700;
  color: var(--ew-text-light);
  margin-right: 6px;
}
.xp-cp-desc {
  color: var(--ew-text-light-dim);
  font-size: 15px;
}

/* Moments */
.xp-moment {
  padding: 24px 0;
  border-bottom: 1px solid var(--ew-border-dark);
}
.xp-moment:first-child { border-top: 1px solid var(--ew-border-dark); }
.xp-moment-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ew-gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.xp-moment-text {
  color: var(--ew-text-light-dim);
  font-size: 16px;
  line-height: 1.6;
}

/* Footer */
.xp-footer {
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1080px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--ew-text-body);
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
        <Logo size="sm" variant="dark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
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

      {/* ── SECTION 01: HERO (Dark Navy, atmospheric) ─────────── */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "var(--ew-navy)",
          overflow: "hidden",
        }}
      >
        {/* Atmospheric radial glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(74,144,217,0.06) 0%, transparent 60%)",
          transform: `translateY(${heroParallax.y * -0.33}px)`,
          pointerEvents: "none",
        }} />
        {/* Noise texture */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.025,
          pointerEvents: "none",
        }} />

        <div
          style={{
            textAlign: "center",
            maxWidth: 900,
            padding: "0 32px",
            position: "relative",
            zIndex: 1,
            transform: `translateY(${heroParallax.y}px)`,
            opacity: heroParallax.opacity,
            willChange: "transform, opacity",
          }}
        >
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: "0 0 28px",
            color: "var(--ew-white)",
          }}>
            {/* Word-by-word staggered reveal */}
            <span style={{ display: "block" }}>
              {"Your thinking reaches your audience.".split(" ").map((word, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    animation: `xpWordUp 0.7s ${EASE} ${100 + i * 80}ms both`,
                    marginRight: "0.27em",
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
            {/* Second line: single block fade-up at 400ms */}
            <em style={{
              display: "block",
              color: "var(--ew-gold)",
              fontWeight: 500,
              fontStyle: "italic",
              animation: `xpFadeUp 0.9s ${EASE} 500ms both`,
            }}>
              In your voice. Better than you'd write it yourself.
            </em>
          </h1>
          <p style={{
            fontSize: "clamp(16px, 2vw, 22px)",
            color: "var(--ew-text-light-dim)",
            maxWidth: 540,
            margin: "0 auto 44px",
            lineHeight: 1.6,
            animation: `xpFadeUp 0.8s ${EASE} 700ms both`,
          }}>
            Watson is your guide. You talk, and the world hears you.
          </p>
          <div className="xp-hero-ctas" style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            animation: `xpFadeUp 0.8s ${EASE} 900ms both`,
          }}>
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="xp-hero-cta-primary"
              style={{
                background: "var(--ew-gold)",
                color: "var(--ew-navy)",
                border: "none",
                borderRadius: 100,
                padding: "16px 36px",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                fontFamily: "var(--font)",
                cursor: "pointer",
                transition: `transform 0.3s ${EASE}, box-shadow 0.3s ${EASE}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,198,66,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              Get Early Access
            </button>
            <a
              href="#how"
              onClick={(e) => { e.preventDefault(); scrollTo(howRef); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "transparent",
                color: "var(--ew-white)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 100,
                padding: "16px 36px",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "var(--font)",
                textDecoration: "none",
                cursor: "pointer",
                transition: `border-color 0.3s ${EASE}, background 0.3s ${EASE}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent"; }}
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          animation: `xpScrollPulse 2s ease-in-out infinite`,
          opacity: heroParallax.opacity,
        }}>
          <div style={{
            width: 2,
            height: 24,
            background: "var(--ew-gold)",
            borderRadius: 1,
          }} />
        </div>

        <style>{`
          @keyframes xpFadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes xpWordUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes xpScrollPulse {
            0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
            50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
          }
        `}</style>
      </section>

      {/* ── SECTION 02: THE PROBLEM (Light: #FFFFFF, blue accent) ── */}
      <section style={{ padding: "140px 0", background: "var(--ew-white)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ marginLeft: isMobile ? 0 : "clamp(40px, 12vw, 160px)", maxWidth: 600 }}>
            <div style={{ display: "flex", gap: 0 }}>
              <div style={{
                width: 3,
                background: "var(--ew-blue)",
                borderRadius: 2,
                flexShrink: 0,
              }} />
              <div style={{ paddingLeft: isMobile ? 20 : 32 }}>
                <Reveal direction="left" distance={30} duration={800}>
                  <h2 style={{
                    fontSize: "clamp(26px, 3.5vw, 42px)",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    margin: "0 0 32px",
                    color: "var(--ew-text-dark)",
                  }}>
                    The thought leaders you see everywhere aren't better thinkers.{" "}
                    <em style={{ color: "var(--ew-blue)", fontWeight: 700, fontStyle: "normal" }}>They got their ideas out.</em>
                  </h2>
                </Reveal>
                <Reveal direction="up" distance={20} delay={150}>
                  <p style={{ color: "var(--ew-text-body)", maxWidth: 540, marginBottom: 16, fontSize: 16, lineHeight: 1.7 }}>
                    You have the thinking. What you've been missing is someone to carry it, from your head, into the world, without you doing the work twice.
                  </p>
                </Reveal>
                <Reveal direction="up" distance={20} delay={300}>
                  <p style={{ color: "var(--ew-text-body)", maxWidth: 540, marginBottom: 16, fontSize: 16, lineHeight: 1.7 }}>
                    This isn't about discipline or talent.
                  </p>
                </Reveal>
                <Reveal direction="up" distance={20} delay={450}>
                  <p style={{ color: "var(--ew-text-body)", maxWidth: 540, fontSize: 16, lineHeight: 1.7 }}>
                    It's an infrastructure problem. <span style={{ fontWeight: 600, color: "var(--ew-text-dark)" }}>Watson is the answer.</span>
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03: WATSON (Dark: #1B263B, gold accent) ─────── */}
      {/* Gradient transition from light to dark */}
      <div style={{ height: 120, background: "linear-gradient(180deg, var(--ew-white) 0%, var(--ew-navy-rich) 100%)" }} />
      <section style={{ padding: "0 0 120px", background: "var(--ew-navy-rich)" }}>
        <div className="xp-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80 }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--ew-gold)", marginBottom: 20, textAlign: "center" }}>
              Watson
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 620, textAlign: "center", marginBottom: 16, fontSize: 16, lineHeight: 1.7 }}>
              <span style={{ color: "var(--ew-text-light)", fontWeight: 600 }}>Watson is your thinking partner.</span> You talk. He listens. He asks until he finds what you actually mean, not what you said first. Then you're done.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 620, textAlign: "center", marginBottom: 56, fontSize: 16, lineHeight: 1.7 }}>
              No editing. No formatting. No chasing the idea across five tabs. Watson carries it. What comes back is done. In your voice. Ready to ship.
            </p>
          </Reveal>

          {/* Watson demo widget with magnetic hover */}
          <Reveal direction="scale" duration={1000}>
            <div
              style={{ perspective: 1000, maxWidth: 480, width: "100%", marginBottom: 56 }}
              onMouseMove={e => {
                const el = e.currentTarget.firstElementChild as HTMLElement;
                if (!el) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                el.style.transform = `rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg)`;
                el.style.boxShadow = `${-dx * 8}px ${-dy * 8}px 80px rgba(0,0,0,0.4), 0 0 60px rgba(74,144,217,0.06)`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget.firstElementChild as HTMLElement;
                if (!el) return;
                el.style.transform = "rotateY(0deg) rotateX(0deg)";
                el.style.boxShadow = "0 24px 80px rgba(0,0,0,0.4)";
              }}
            >
              <div style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 16,
                border: "1px solid var(--ew-border-dark)",
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
                width: "100%",
                transition: `transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}`,
                position: "relative",
              }}>
                {/* Subtle glow behind widget */}
                <div style={{
                  position: "absolute",
                  inset: -40,
                  background: "radial-gradient(circle at 50% 50%, rgba(74,144,217,0.08) 0%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 0,
                }} />
                {/* Header */}
                <div style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--ew-border-dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  position: "relative",
                  zIndex: 1,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ew-gold)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ew-text-light-dim)", letterSpacing: "0.04em" }}>Watson is listening</span>
                </div>
                {/* Chat area */}
                <div style={{ padding: "20px 20px 16px", position: "relative", zIndex: 1 }}>
                  {/* User bubble */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                    <div style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "10px 16px",
                      maxWidth: "80%",
                      fontSize: 13,
                      color: "var(--ew-text-light)",
                      lineHeight: 1.5,
                    }}>
                      The people in your market who show up everywhere aren't better thinkers. They got their ideas out. Every week. On every channel. Without doing it alone.
                    </div>
                  </div>
                  {/* Watson bubble */}
                  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                    <div style={{
                      background: "rgba(245,198,66,0.06)",
                      border: "1px solid rgba(245,198,66,0.1)",
                      borderRadius: "14px 14px 14px 4px",
                      padding: "10px 16px",
                      maxWidth: "85%",
                      fontSize: 13,
                      color: "var(--ew-text-light)",
                      lineHeight: 1.5,
                    }}>
                      <strong style={{ color: "var(--ew-gold)" }}>Core thesis:</strong> Infrastructure, not talent, separates visible thought leaders from invisible ones.<br /><br />
                      Who specifically needs to hear this?
                    </div>
                  </div>
                  {/* Footer bar */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: "1px solid var(--ew-border-dark)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: "var(--ew-gold)", fontVariantNumeric: "tabular-nums" }}>86</span>
                      <span style={{ fontSize: 11, color: "var(--ew-text-light-dim)", fontWeight: 500 }}>Impact Score</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["LinkedIn", "Newsletter", "Podcast"].map((f) => (
                        <span key={f} style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid var(--ew-border-dark)",
                          color: "var(--ew-text-light-dim)",
                          letterSpacing: "0.02em",
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Supporting line */}
          <Reveal delay={200}>
            <p style={{
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 600,
              color: "var(--ew-gold)",
              margin: 0,
              maxWidth: 720,
              textAlign: "center",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}>
              The people in your market who show up everywhere aren't better thinkers. They have better infrastructure.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 04: YOU KNOW THIS FEELING (Light: #F7F9FC, blue accent) */}
      <section style={{ padding: sectionPad, background: "var(--ew-offwhite)" }}>
        <Reveal>
          <div className="xp-inner">
            <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
              <h2 style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 16px",
                color: "var(--ew-text-dark)",
              }}>
                The idea is in your head. Not in the world.
              </h2>
              <p style={{ color: "var(--ew-text-body)", maxWidth: 540, margin: "0 auto" }}>
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
                  background: "var(--ew-white)",
                  border: "1px solid var(--ew-border-light)",
                  borderRadius: 8,
                  padding: "28px 32px",
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ew-blue)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}>{m.label}</div>
                  <div style={{ color: "var(--ew-text-body)", fontSize: 16, lineHeight: 1.6 }}>{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 05: STATS + TESTIMONIAL (Light: #F7F9FC, blue accent) */}
      <section style={{ padding: "100px 0", background: "var(--ew-offwhite)" }}>
        <div className="xp-inner">
          {/* Section intro */}
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--ew-blue)", marginBottom: 16 }}>
                EVERYWHERE Studio
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 auto 28px",
                maxWidth: 800,
                color: "var(--ew-text-dark)",
              }}>
                You talk. Watson listens until he really gets it. Then {MARKETING_NUMBERS.specialistCount} specialists turn what you said into publication-ready content, in your voice, verified, every word traceable back to you.
              </h2>
              <p style={{ color: "var(--ew-text-body)", maxWidth: 600, margin: "0 auto", textAlign: "center", fontSize: 16, lineHeight: 1.7 }}>
                You talk. They work. You publish. Every word sounds like you. Every claim is verified. Nothing ships without passing {MARKETING_NUMBERS.qualityCheckpoints} quality checkpoints.
              </p>
            </div>
          </Reveal>

          {/* Stats grid with dividers */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: isMobile ? "center" : "flex-start",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 40 : 0,
            marginBottom: 72,
          }}>
            {[
              { headline: "Always ready.", body: "Whenever you have something to say, a post, a brief, a board deck, a newsletter, Watson is there. You talk. It's done." },
              { headline: "Every channel.", body: "Newsletter, LinkedIn, podcast, Substack, one idea, every format, native to each." },
              { headline: "Zero left to finish.", body: "You talk to Watson. What comes back is done." },
            ].map((block, i) => (
              <Reveal key={block.headline} delay={i * 150}>
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  {/* Vertical divider (desktop only, not before first) */}
                  {!isMobile && i > 0 && (
                    <div style={{
                      width: 1,
                      height: 48,
                      background: "var(--ew-border-light)",
                      flexShrink: 0,
                      alignSelf: "center",
                      marginRight: 48,
                    }} />
                  )}
                  <div
                    style={{
                      textAlign: "center",
                      maxWidth: 260,
                      paddingRight: !isMobile && i < 2 ? 48 : 0,
                      cursor: "default",
                    }}
                    onMouseEnter={e => {
                      const h = e.currentTarget.querySelector("[data-stat-head]") as HTMLElement;
                      if (h) h.style.color = "var(--ew-blue)";
                    }}
                    onMouseLeave={e => {
                      const h = e.currentTarget.querySelector("[data-stat-head]") as HTMLElement;
                      if (h) h.style.color = "var(--ew-text-dark)";
                    }}
                  >
                    <div
                      data-stat-head=""
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--ew-text-dark)",
                        marginBottom: 8,
                        transition: `color 0.3s ${EASE}`,
                      }}
                    >
                      {block.headline}
                    </div>
                    <div style={{ fontSize: 15, color: "var(--ew-text-body)", lineHeight: 1.6 }}>
                      {block.body}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Testimonial */}
          <Reveal direction="left" distance={40} delay={400}>
            <div style={{ maxWidth: 640, marginInline: "auto", textAlign: "left" }}>
              <blockquote style={{
                margin: 0,
                padding: "0 0 0 24px",
                borderLeft: "3px solid var(--ew-blue)",
              }}>
                <p style={{
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: "var(--ew-text-dark)",
                  fontStyle: "italic",
                  margin: "0 0 12px",
                  letterSpacing: "-0.01em",
                }}>
                  "Better than what I was writing myself."
                </p>
                <p style={{
                  fontSize: 15,
                  color: "var(--ew-text-body)",
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
                  color: "var(--ew-text-body)",
                }}>
                  Doug C., Executive Coach
                </footer>
              </blockquote>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 06: WATCH. WORK. WRAP. (Dark: #0D1B2A, gold accent) */}
      <section ref={howRef} style={{ padding: sectionPad, background: "var(--ew-navy)" }}>
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
                    {i > 0 && <div style={{ height: 1, background: "var(--ew-border-dark)", margin: "8px 0" }} />}
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

      {/* ── SECTION 07: QUALITY STANDARD (Light: #FFFFFF, blue accent) */}
      <section ref={standardRef} style={{ padding: sectionPad, background: "var(--ew-white)" }}>
        <div className="xp-inner">
          <Reveal>
            <div style={{ maxWidth: 640 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--ew-blue)", marginBottom: 16 }}>
                Quality Standard
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 24px",
                color: "var(--ew-text-dark)",
              }}>
                Nothing ships unless it would fool a skeptic.
              </h2>
              <p style={{ color: "var(--ew-text-body)", maxWidth: 580 }}>
                Before any content reaches you, a hostile reader runs through it. Looking for AI patterns, assembled phrases, anything that doesn't sound like a human made a real decision. If it fails, it doesn't ship. Not once. Not ever. AI slop is everywhere. This is the only standard that keeps your name off it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 08: ANCHOR LINE (Dark transition) ──────── */}
      <section style={{ padding: isMobile ? "56px 0" : "100px 0", background: "var(--ew-navy)" }}>
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

      {/* ── SECTION 09: FINAL CTA (Dark: #0D1B2A, gold accent) ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ew-navy)", padding: "120px 0" }}>
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 720, padding: "0 32px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--ew-gold)", marginBottom: 20 }}>
              Let's Talk
            </div>
            <h2 style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: "0 0 28px",
              color: "var(--ew-text-light)",
            }}>
              Your thinking deserves to <em style={{ color: "var(--ew-gold)" }}>be heard.</em>
            </h2>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center" }}>
              You don't need more discipline. You need a system that carries the idea from your head to your audience, every week, without it sitting on your to-do list.
            </p>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center" }}>
              The output is yours because the input was yours.
            </p>
            <p style={{ color: "var(--ew-gold)", maxWidth: 560, margin: "0 auto 44px", textAlign: "center", fontWeight: 500 }}>
              There's a mountain between the idea and the audience. EVERYWHERE Studio carries the mountain.
            </p>
            <div className="xp-hero-ctas" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="xp-btn-gold" onClick={() => navigate("/auth?mode=signup")} style={{ border: "none", fontSize: 15, padding: "16px 44px" }}>
                Get Early Access
              </button>
              <a href={CTA_MAILTO} className="xp-btn-outline" style={{ fontSize: 15, padding: "16px 44px" }}>
                Let's Talk
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER (Light: #F7F9FC) ─────────────────────────── */}
      <footer style={{ background: "var(--ew-offwhite)" }}>
        <div className="xp-footer">
          <Logo size="sm" variant="light" />
          <span style={{ color: "var(--ew-text-body)" }}>&copy; 2026 Mixed Grill, LLC</span>
        </div>
      </footer>
    </div>
  );
}
