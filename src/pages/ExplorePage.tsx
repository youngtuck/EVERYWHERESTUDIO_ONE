import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import HeroCanvas from "../components/landing/HeroCanvas";
import { MARKETING_NUMBERS } from "../lib/constants";
import { MARKETING_CSS, EASE } from "../styles/marketing";

/* ═══════════════════════════════════════════════════════════
   EVERYWHERE STUDIO — EXPLORE PAGE v5
   Liquid glass: blur + static corner luminance (no sweeping specular loop).
   Instrument Sans + DM Mono. Earned scroll.
   ═══════════════════════════════════════════════════════════ */

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

// ══════════════════════════════════
// HOOKS
// ══════════════════════════════════

// Shared IntersectionObserver: one instance for all Reveals on this page.
const sharedRevealCallbacks = new Map<Element, (visible: boolean) => void>();
let sharedRevealObserver: IntersectionObserver | null = null;

function getSharedRevealObserver() {
  if (!sharedRevealObserver) {
    sharedRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const cb = sharedRevealCallbacks.get(entry.target);
          if (cb && entry.isIntersecting) {
            cb(true);
            sharedRevealObserver?.unobserve(entry.target);
            sharedRevealCallbacks.delete(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
  }
  return sharedRevealObserver;
}

function useScrollReveal(_threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getSharedRevealObserver();
    sharedRevealCallbacks.set(el, setIsVisible);
    obs.observe(el);
    return () => {
      obs.unobserve(el);
      sharedRevealCallbacks.delete(el);
    };
  }, []);
  return { ref, isVisible };
}

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (!trigger || ran.current) return;
    ran.current = true;
    const t0 = performance.now();
    const go = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setVal(Math.round(target * easeOut(p)));
      if (p < 1) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, [trigger, target, duration]);
  return val;
}

// ══════════════════════════════════
// REVEAL WRAPPER
// ══════════════════════════════════

function Reveal({
  children, delay = 0, threshold = 0.12, style,
}: {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollReveal(threshold);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (isVisible && !settled) {
      const t = setTimeout(() => setSettled(true), 650 + delay);
      return () => clearTimeout(t);
    }
  }, [isVisible, settled, delay]);

  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(28px)",
      transition: settled ? "none" : `opacity 0.5s ${EASE} ${delay}ms, transform 0.5s ${EASE} ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════
// CSS — Shared marketing design system
// ══════════════════════════════════

const CSS = MARKETING_CSS + `
/* ExplorePage-specific overrides */
.xp-reed-side { display: block; }
.xp-reed-met { display: block; }
.xp-stats-row { flex-direction: row; }
.xp-parallax-nums { flex-direction: row; }
.xp-statement-text { font-size: clamp(36px, 7vw, 88px); }
.xp-split-grid { grid-template-columns: 1fr 1fr; }
@media(max-width:900px) {
  .xp-reed-side { display: none !important; }
  .xp-reed-met { display: none !important; }
  .xp-stats-row { flex-direction: column !important; gap: 48px !important; }
  .xp-gates-track { flex-wrap: wrap !important; gap: 12px !important; }
  .xp-gate-line { display: none !important; }
  .xp-footer-inner { flex-direction: column !important; text-align: center !important; gap: 16px !important; }
  .xp-statement-text { font-size: 8vw !important; }
  .xp-split-grid { grid-template-columns: 1fr !important; }
  .xp-parallax-nums { flex-direction: column !important; align-items: center !important; gap: 40px !important; }
}
@media(max-width:600px) {
  .xp-statement-text { font-size: 10vw !important; }
}
`;
// (shared CSS imported from ../styles/marketing)

// ══════════════════════════════════
// DATA
// ══════════════════════════════════

const PROBLEMS = [
  { without: "The strategy is clear. The insight is sharp. But somewhere between the thought and the published piece, everything slows down. Drafts sit unfinished. Opportunities pass. The mountain grows.", with: "A system that watches the landscape, works the idea all the way through, and wraps the output for the world. One idea, worked all the way through. Seven quality checkpoints. Nothing ships until it is ready." },
  { without: "That's not a creativity problem. It's a systems problem.", with: "Specialized intelligence working as an orchestrated ensemble. Every session has a first listener who asks the right questions. A quality system that won't let mediocre content through. An intelligence layer monitoring your category while you sleep." },
];

const ROOMS = [
  { name: "Watch", desc: "Know what's moving before your competitors do. EVERYWHERE monitors your category overnight and delivers a structured briefing every morning. Signals scored. Opportunities ranked. Content angles ready to go." },
  { name: "Work", desc: "One idea, worked all the way through. Your first listener asks the right questions. Structure emerges. The draft gets written, refined, and run through seven quality checkpoints. Nothing ships until it's ready." },
  { name: "Wrap", desc: "From approved to published. Choose a format. Choose a channel. Your thinking reaches the people who need to hear it." },
];

const GATES = ["Dedup", "Research", "Voice", "Engage", "SLOP", "Editorial", "Risk"];
const SPECIALIST_TAGS = ["Brand Voice", "Enterprise Copy", "SEO", "Distribution", "Analytics"];
const STATEMENT_WORDS = ["The", "idea", "is", "never", "the", "problem."];


// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Page load
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Nav theme from data attributes
  useEffect(() => {
    const sections = document.querySelectorAll("[data-nav-theme]");
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const t = (e.target as HTMLElement).dataset.navTheme as "dark" | "light";
            if (t) setNavTheme(t);
          }
        }
      },
      { rootMargin: "-1px 0px -95% 0px", threshold: 0 },
    );
    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Scroll progress bar (RAF-throttled, direct DOM update)
  const progressBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const progress = total > 0 ? window.scrollY / total : 0;
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress * 100}%`;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goSignup = useCallback(() => navigate("/auth?mode=signup"), [navigate]);
  const goSignin = useCallback(() => navigate("/auth"), [navigate]);

  const isDarkNav = navTheme === "dark";

  return (
    <div className="xp" style={{ opacity: pageLoaded ? 1 : 0, transition: `opacity 0.5s ${EASE}` }}>
      <style>{CSS}</style>

      {/* Scroll progress */}
      <div ref={progressBarRef} style={{ position: "fixed", top: 0, left: 0, height: 2, width: "0%", background: "var(--xp-gold)", zIndex: 200, transition: "none", pointerEvents: "none" }} />

      {/* ═══ LIQUID GLASS NAV ═══ */}
      <nav className={`xp-glass-nav xp-liquid-glass ${isDarkNav ? "xp-lg-dark" : "xp-lg-light"}`}>
        <div className="xp-liquid-glass-border" />
        <Logo
          size="sm"
          variant={isDarkNav ? "dark" : "light"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {!isMobile && (
            <div className="xp-nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[
                { label: "How It Works", path: "/how-it-works" },
                { label: "Who It's For", path: "/who-its-for" },
                { label: "The System", path: "/the-system" },
                { label: "About", path: "/about" },
              ].map(link => (
                <button
                  key={link.label}
                  className="xp-nav-link"
                  onClick={() => navigate(link.path)}
                  style={{ color: isDarkNav ? "rgba(255,255,255,0.55)" : "var(--xp-sec)" }}
                >
                  {link.label}
                </button>
              ))}
              <button className="xp-nav-link" onClick={goSignin} style={{
                color: isDarkNav ? "rgba(255,255,255,0.55)" : "var(--xp-sec)",
              }}>Sign In</button>
              <button className="xp-nav-cta" onClick={goSignup} style={
                isDarkNav
                  ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--xp-on-dark)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
                  : { background: "rgba(12,26,41,0.08)", border: "1px solid rgba(12,26,41,0.15)", color: "var(--xp-navy)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
              }>Request Access</button>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: "block", width: 20, height: 2, background: isDarkNav ? "var(--xp-on-dark)" : "var(--xp-text)", borderRadius: 1 }} />
              ))}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--xp-navy)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 28, color: "var(--xp-gold)", fontFamily: "var(--xp-font)", fontWeight: 300 }}>&times;</button>
          {[
            { label: "How It Works", action: () => { setMobileMenuOpen(false); navigate("/how-it-works"); } },
            { label: "Who It's For", action: () => { setMobileMenuOpen(false); navigate("/who-its-for"); } },
            { label: "The System", action: () => { setMobileMenuOpen(false); navigate("/the-system"); } },
            { label: "About", action: () => { setMobileMenuOpen(false); navigate("/about"); } },
            { label: "Sign In", action: () => { setMobileMenuOpen(false); goSignin(); } },
            { label: "Request Access", action: () => { setMobileMenuOpen(false); goSignup(); } },
          ].map((link, i) => (
            <button key={link.label} onClick={link.action} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 24, fontWeight: 600, color: "var(--xp-white)",
              fontFamily: "var(--xp-font)", letterSpacing: "0.04em",
              animation: `xpSlideIn 0.5s ${EASE} ${i * 80}ms both`,
            }}>
              {link.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HERO — Dark. Staggered CSS entries.
          Geometric rings with float animation.
          Logo prominent. No cinema, just precision.
          ═══════════════════════════════════════════ */}
      <section data-nav-theme="dark" style={{
        minHeight: "100vh", background: "var(--xp-navy-deep)", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 48px", overflow: "hidden",
      }}>
        {/* Generative fluid canvas background (desktop only) */}
        <HeroCanvas isMobile={isMobile} />

        {/* Mobile fallback: static gradient mesh */}
        {isMobile && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 30% 30%, rgba(107,127,242,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(200,169,110,0.08) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(80,100,200,0.06) 0%, transparent 60%)",
          }} />
        )}

        {/* Ambient glow (supplements canvas on desktop, primary on mobile) */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: "120%", height: "120%", transform: "translate(-50%,-50%)",
          background: "radial-gradient(ellipse at 50% 45%, rgba(200,169,110,0.04) 0%, transparent 60%)",
          animation: "xpGlow 8s ease-in-out infinite", pointerEvents: "none",
        }} />

        {/* Hero content — staggered CSS entries */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="xp-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--xp-dim-dark)", marginBottom: 28, marginTop: 48,
            animation: `xpHeroLabel 0.8s ${EASE} 0.5s both`,
          }}>
            Structured Intelligence
          </div>

          <h1 style={{
            fontSize: "clamp(52px, 8.5vw, 100px)", fontWeight: 600,
            letterSpacing: "-0.04em", lineHeight: 1.02,
            color: "var(--xp-on-dark)", marginBottom: 16,
            animation: `xpHeroHead 1s ${EASE} 0.8s both`,
          }}>
            The idea is never<br />the problem.
          </h1>

          <p style={{
            fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300,
            letterSpacing: "-0.02em", lineHeight: 1.1,
            color: "var(--xp-gold)", marginBottom: 24,
            animation: `xpHeroSub 0.8s ${EASE} 1.1s both`,
          }}>
            Getting it out of your head is.
          </p>

          <div style={{
            height: 1, background: "var(--xp-gold)", marginBottom: 28,
            animation: `xpHeroLine 1.2s ${EASE} 1.3s both`,
          }} />

          <p style={{
            fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)",
            maxWidth: 400, marginBottom: 44,
            animation: `xpHeroSub 0.8s ${EASE} 1.5s both`,
          }}>
            EVERYWHERE Studio moves your thinking from private<br />to published, at the level your ideas deserve.
          </p>

          <div style={{ animation: `xpHeroCta 0.7s ${EASE} 1.8s both` }}>
            <button className="xp-btn xp-btn-liquid" onClick={goSignup}>See It Work</button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 40, left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: `xpFadeUp 0.6s ${EASE} 2.2s both`,
        }}>
          <span className="xp-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--xp-dim-dark)", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 24, background: "var(--xp-gold)", borderRadius: 1, animation: "xpScrollHint 2s ease-in-out infinite 2.5s" }} />
        </div>
      </section>

      {/* ═══ ACT 2: THE STATEMENT ═══ */}
      <StatementSection />

      {/* ═══ ACT 3: THE SPLIT ═══ */}
      <SplitSection />

      {/* ═══ ACT 4: REED IN LIQUID GLASS ═══ */}
      <ReedSection isMobile={isMobile} />

      {/* ═══ ACT 5: ARCHITECTURAL NUMBERS ═══ */}
      <NumbersSection />

      {/* ═══ ACT 6: GLASS CARDS ═══ */}
      <GlassCardsSection />

      {/* ═══ ACT 7: QUALITY GATES ═══ */}
      <QualitySection />

      {/* ═══ ACT 8: CTA (Dark bookend) ═══ */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "148px 48px", background: "var(--xp-navy-deep)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Centered gold glow behind rings */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: "80%", height: "80%",
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(ellipse at 50% 50%, rgba(200,169,110,0.06) 0%, transparent 50%)",
          }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 400, height: 400, borderRadius: "50%", border: "0.5px solid rgba(200,169,110,0.04)", animation: "xpSpin 120s linear infinite" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 600, height: 600, borderRadius: "50%", border: "0.5px solid rgba(255,255,255,0.02)", animation: "xpSpinR 180s linear infinite" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{
                fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 600,
                letterSpacing: "-0.04em", lineHeight: 1.08,
                color: "var(--xp-on-dark)", maxWidth: 600, marginBottom: 24,
              }}>
                Built for one kind of person.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--xp-dim-dark)", maxWidth: 380, marginBottom: 48 }}>
                You're not a marketer. You're not a content creator. You're a practitioner with something important to say. You've been waiting too long for the system to catch up to the thinking. EVERYWHERE Studio was built for you.
              </p>
              <button className="xp-btn xp-btn-liquid" onClick={goSignup} style={{ marginBottom: 16 }}>Request Access</button>
              <div style={{ marginTop: 20 }}>
                <button className="xp-btn xp-btn-glass" onClick={goSignin}>Sign In</button>
              </div>
              <div style={{ marginTop: 40 }}>
                <a href="mailto:beta@everywherestudio.ai" className="xp-mono" style={{ fontSize: 12, color: "var(--xp-dim-dark)", textDecoration: "none" }}>
                  beta@everywherestudio.ai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "40px 48px", background: "var(--xp-white)", borderTop: "1px solid var(--xp-border)" }}>
        <div className="xp-footer-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <Logo size="sm" variant="light" />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(label => (
              <button key={label} style={{
                fontSize: 12, color: "var(--xp-ter)", cursor: "pointer",
                background: "none", border: "none", fontFamily: "var(--xp-font)",
                transition: "color 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--xp-text)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--xp-ter)")}
              >{label}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--xp-ter)" }}>&copy; {new Date().getFullYear()} Mixed Grill, LLC. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}


// ═══════════════════════════════════════════
// ACT 2: THE STATEMENT
// ═══════════════════════════════════════════

function StatementSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [wordIndex, setWordIndex] = useState(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          STATEMENT_WORDS.forEach((_, i) => {
            setTimeout(() => setWordIndex(i), 150 * (i + 1));
          });
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section data-nav-theme="light" ref={ref} style={{
      minHeight: "80vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "112px 48px",
      background: "var(--xp-white)",
    }}>
      <div style={{ maxWidth: 1100, width: "100%", textAlign: "center" }}>
        <h2 className="xp-statement-text" style={{
          fontSize: "clamp(36px, 7vw, 88px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          color: "var(--xp-text)",
        }}>
          {STATEMENT_WORDS.map((word, i) => {
            const isGold = word === "problem.";
            const visible = i <= wordIndex;
            return (
              <span key={i} style={{
                display: "inline-block",
                marginRight: i < STATEMENT_WORDS.length - 1 ? "0.3em" : 0,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
              }}>
                <span style={{ color: isGold ? "var(--xp-gold)" : "inherit" }}>{word}</span>
              </span>
            );
          })}
        </h2>
        <div style={{
          marginTop: 40,
          opacity: wordIndex >= STATEMENT_WORDS.length - 1 ? 1 : 0,
          transition: `opacity 0.8s ${EASE} 0.3s`,
        }}>
          <span className="xp-mono" style={{
            fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--xp-ter)",
          }}>
            EVERYWHERE Studio
          </span>
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// ACT 3: THE SPLIT
// ═══════════════════════════════════════════

function SplitSection() {
  const { ref, isVisible } = useScrollReveal(0.15);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => setExpanded(true), 800);
    return () => clearTimeout(t);
  }, [isVisible]);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{
      padding: "132px 48px", background: "var(--xp-off)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>
            01 / The Problem
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h2 style={{
            fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 600,
            letterSpacing: "-0.03em", lineHeight: 1.12,
            maxWidth: 640, marginBottom: 64,
          }}>
            You're not short on ideas.{" "}
            <span style={{ color: "var(--xp-ter)" }}>You're short on execution.</span>
          </h2>
        </Reveal>

        <div className="xp-split-grid" style={{
          display: "grid",
          gridTemplateColumns: expanded ? "0fr 1fr" : "1fr 1fr",
          gap: 0,
          transition: `grid-template-columns 1s ${EASE}`,
          overflow: "hidden",
        }}>
          {/* WITHOUT column */}
          <div style={{
            opacity: expanded ? 0 : 0.5,
            transition: `opacity 0.8s ${EASE}`,
            overflow: "hidden", minWidth: 0,
          }}>
            <div style={{ minWidth: 400 }}>
              <div className="xp-mono" style={{
                fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--xp-ter)", marginBottom: 24, paddingRight: 40,
              }}>Without a system</div>
              {PROBLEMS.map((p, i) => (
                <Reveal key={i} delay={200 + i * 80}>
                  <div style={{
                    padding: "20px 40px 20px 0",
                    borderBottom: "1px solid var(--xp-border)",
                  }}>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--xp-sec)", margin: 0 }}>{p.without}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* WITH column */}
          <div style={{
            opacity: isVisible ? 1 : 0,
            borderLeft: expanded ? "none" : "1px solid var(--xp-border)",
            paddingLeft: expanded ? 0 : 40,
            transition: `opacity 0.8s ${EASE} 0.2s, padding-left 1s ${EASE}, border-left-color 0.5s ease`,
          }}>
            <div className="xp-mono" style={{
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--xp-gold)", marginBottom: 24,
            }}>With EVERYWHERE Studio</div>
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={300 + i * 100}>
                <div style={{
                  padding: "20px 0",
                  borderBottom: "1px solid var(--xp-border)",
                  display: "flex", gap: 16, alignItems: "baseline",
                }}>
                  <span className="xp-mono" style={{ fontSize: 12, color: "var(--xp-gold)", letterSpacing: "0.06em", flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{p.with}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// ACT 4: REED IN LIQUID GLASS
// ═══════════════════════════════════════════

function ReedSection({ isMobile }: { isMobile: boolean }) {
  const { ref, isVisible } = useScrollReveal(0.05);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2600),
      setTimeout(() => setStep(4), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  const sideItem = (label: string, active: boolean) => (
    <div style={{
      padding: "7px 12px", borderRadius: 6, fontSize: 13,
      color: active ? "var(--xp-text)" : "var(--xp-ter)",
      background: active ? "rgba(0,0,0,0.03)" : "transparent",
      display: "flex", alignItems: "center", gap: 8,
      fontWeight: active ? 500 : 400, cursor: "pointer",
    }}>
      {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--xp-gold)" }} />}
      {label}
    </div>
  );

  const metric = (label: string, val: string, pct: number, delay: number) => (
    <div style={{ marginBottom: 18, opacity: step >= 4 ? 1 : 0, transition: `opacity .5s ease ${delay}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <span className="xp-mono" style={{ fontSize: 11, color: "var(--xp-gold)", fontWeight: 500 }}>{val}</span>
      </div>
      <div style={{ height: 2, background: "var(--xp-border)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "var(--xp-gold)", borderRadius: 1,
          width: step >= 4 ? `${pct}%` : "0%",
          transition: `width 1s ${EASE} ${delay + 0.2}s`,
        }} />
      </div>
    </div>
  );

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{
      padding: "132px 48px",
      background: "var(--xp-white)",
      position: "relative",
    }}>
      {/* Gradient mesh behind the glass: increased visibility for refraction */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 30% 40%, rgba(107,127,242,0.07) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(200,169,110,0.07) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(80,100,200,0.04) 0%, transparent 45%)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>02 / A New Category</div>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 600, marginBottom: 16 }}>
            Not an AI writing tool.<br />Not a content calendar.<br />Structured Intelligence.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", maxWidth: 520, marginBottom: 56 }}>
            Specialized intelligence working as an orchestrated ensemble. Every session has a first listener who asks the right questions. A quality system that won't let mediocre content through. An intelligence layer monitoring your category while you sleep. The system thinks with you. Not for you.
          </p>
        </Reveal>

        {/* LIQUID GLASS CONTAINER */}
        <Reveal delay={200}>
          <div className="xp-liquid-glass xp-lg-light xp-lg-shadow" style={{ borderRadius: 20 }}>
            <div className="xp-liquid-glass-border" style={{ borderRadius: 20 }} />

            {/* The interface inside the glass */}
            <div style={{ borderRadius: 20, overflow: "hidden" }}>
              {/* Title bar */}
              <div style={{
                display: "flex", alignItems: "center", padding: "11px 18px",
                background: "rgba(248,249,250,0.6)",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", gap: 7 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
                </div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--xp-ter)", fontWeight: 500 }}>EVERYWHERE Studio</div>
                <div style={{ width: 48 }} />
              </div>

              <div style={{ display: "flex", minHeight: isMobile ? 360 : 420, background: "rgba(255,255,255,0.85)" }}>
                {/* Sidebar */}
                <div className="xp-reed-side" style={{
                  width: 172, background: "rgba(248,249,250,0.6)",
                  borderRight: "1px solid rgba(0,0,0,0.04)",
                  padding: "18px 10px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 1,
                }}>
                  <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.1em", padding: "6px 12px 4px", textTransform: "uppercase" }}>Studio</div>
                  {sideItem("Watch", false)}
                  {sideItem("Work", true)}
                  {sideItem("Wrap", false)}
                  <div style={{ height: 1, background: "var(--xp-border)", margin: "10px 0" }} />
                  <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.1em", padding: "6px 12px 4px", textTransform: "uppercase" }}>Library</div>
                  {sideItem("Catalog", false)}
                  {sideItem("Pipeline", false)}
                  {sideItem("Resources", false)}
                  <div style={{ flex: 1 }} />
                  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#28C840" }} />
                    <span style={{ fontSize: 11, color: "var(--xp-ter)" }}>Reed Active</span>
                  </div>
                </div>

                {/* Chat */}
                <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column" }}>
                  <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", textAlign: "center", marginBottom: 20 }}>Today at 10:42 AM</div>

                  {/* User message */}
                  <div style={{
                    opacity: step >= 1 ? 1 : 0,
                    transform: step >= 1 ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
                    transition: `all .5s ${EASE}`,
                    alignSelf: "flex-end", maxWidth: "78%", marginBottom: 18,
                  }}>
                    <div style={{
                      padding: "13px 17px", borderRadius: "13px 13px 3px 13px",
                      background: "var(--xp-off)", border: "1px solid var(--xp-border)",
                      fontSize: 14, color: "var(--xp-text)", lineHeight: 1.6,
                    }}>
                      Write a product launch email for our Q2 feature release targeting enterprise design teams.
                    </div>
                  </div>

                  {/* Composing */}
                  <div style={{
                    opacity: step === 2 ? 1 : 0, transition: "opacity .25s ease",
                    marginBottom: 14, display: "flex", alignItems: "center", gap: 10, minHeight: 32,
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(200,169,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--xp-gold)" }} />
                    </div>
                    <div className="xp-dots" style={{ display: "flex", gap: 3 }}><span /><span /><span /></div>
                    <span className="xp-mono" style={{ fontSize: 11, color: "var(--xp-ter)" }}>Composing with 12 specialists...</span>
                  </div>

                  {/* Reed response */}
                  <div style={{
                    opacity: step >= 3 ? 1 : 0,
                    transform: step >= 3 ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
                    transition: `all .6s ${EASE}`, maxWidth: "88%", marginBottom: 16,
                  }}>
                    <div style={{ display: "flex", gap: 11 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(200,169,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--xp-gold)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--xp-gold)", marginBottom: 7 }}>Reed</div>
                        <div style={{
                          padding: "14px 18px", borderRadius: "3px 13px 13px 13px",
                          background: "var(--xp-off)", border: "1px solid var(--xp-border)",
                          fontSize: 14, color: "var(--xp-text)", lineHeight: 1.7,
                        }}>
                          I analyzed your brand voice profile, reviewed the Q2 feature documentation, and cross-referenced engagement patterns from your last three launches. The draft targets the strategic pain points your enterprise segment flagged in March. Copy maintains a 96% voice DNA match with your established tone.
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
                          {SPECIALIST_TAGS.map((tag, i) => (
                            <span key={tag} className="xp-mono" style={{
                              padding: "3px 9px", borderRadius: 999,
                              background: "rgba(200,169,110,0.06)",
                              border: "1px solid rgba(200,169,110,0.15)",
                              fontSize: 10, color: "var(--xp-gold)",
                              opacity: step >= 4 ? 1 : 0,
                              transition: `opacity .4s ease ${0.3 + i * 0.07}s`,
                            }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* Input */}
                  <div style={{
                    padding: "11px 16px", borderRadius: 9,
                    background: "var(--xp-off)", border: "1px solid var(--xp-border)",
                    display: "flex", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--xp-ter)" }}>Ask Reed anything...</span>
                  </div>
                </div>

                {/* Metrics panel */}
                <div className="xp-reed-met" style={{
                  width: 192, background: "rgba(248,249,250,0.6)",
                  borderLeft: "1px solid rgba(0,0,0,0.04)",
                  padding: "18px 14px", flexShrink: 0,
                }}>
                  <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 22 }}>Composition</div>
                  {metric("Voice DNA", "96%", 96, 0)}
                  {metric("Impact", "High", 88, 0.12)}
                  {metric("Brand Match", "94%", 94, 0.24)}

                  <div style={{ height: 1, background: "var(--xp-border)", margin: "14px 0" }} />

                  <div style={{ opacity: step >= 4 ? 1 : 0, transition: "opacity .5s ease .4s" }}>
                    <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Gates</div>
                    <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
                      {Array.from({ length: 7 }, (_, n) => (
                        <div key={n} className="xp-mono" style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: "1px solid var(--xp-gold)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 8, color: "var(--xp-gold)",
                        }}>{n + 1}</div>
                      ))}
                    </div>
                    <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Specialists</div>
                    <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
                      12 <span style={{ fontSize: 12, color: "var(--xp-ter)", fontWeight: 400 }}>activated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// ACT 5: ARCHITECTURAL NUMBERS
// ═══════════════════════════════════════════

function NumbersSection() {
  const { ref, isVisible } = useScrollReveal(0.15);
  const a = useCountUp(MARKETING_NUMBERS.specialistCount, 1600, isVisible);
  const b = useCountUp(MARKETING_NUMBERS.outputFormatCount, 1200, isVisible);
  const c = useCountUp(MARKETING_NUMBERS.qualityCheckpoints, 900, isVisible);

  return (
    <section data-nav-theme="light" ref={ref} style={{
      minHeight: "70vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "112px 48px",
      background: "var(--xp-off)",
      overflow: "hidden",
    }}>
      <div className="xp-parallax-nums" style={{
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        gap: "clamp(40px, 8vw, 120px)",
        maxWidth: 1200, width: "100%",
      }}>
        {[
          { v: a, label: "Specialists", size: "clamp(80px, 15vw, 180px)" },
          { v: b, label: "Output Formats", size: "clamp(80px, 15vw, 180px)" },
          { v: c, label: "Quality Gates", size: "clamp(80px, 15vw, 180px)" },
        ].map((s, i) => (
          <div key={s.label} style={{
            textAlign: "center",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(40px)",
            transition: `opacity 0.8s ${EASE} ${i * 150}ms, transform 0.8s ${EASE} ${i * 150}ms`,
          }}>
            <div style={{
              fontSize: s.size, fontWeight: 700,
              letterSpacing: "-0.05em", lineHeight: 0.85,
              color: "var(--xp-text)", opacity: 0.9,
            }}>{s.v}</div>
            <div className="xp-mono" style={{
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--xp-ter)", marginTop: 16,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// ACT 6: GLASS CARDS (Watch. Work. Wrap.)
// ═══════════════════════════════════════════

function GlassCard({
  rm, index, isVisible,
}: {
  rm: { name: string; desc: string };
  index: number;
  isVisible: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shimmer, setShimmer] = useState({ x: 50, y: 50, active: false });

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setShimmer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }, []);

  const onLeave = useCallback(() => {
    setShimmer(s => ({ ...s, active: false }));
  }, []);

  return (
    <div
      ref={cardRef}
      className="xp-glass-card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        flex: 1,
        padding: "40px 32px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) rotate(0deg)"
          : `translateY(${60 + index * 20}px) rotate(${(index - 1) * 2}deg)`,
        transition: `opacity 0.7s ${EASE} ${200 + index * 200}ms, transform 0.7s ${EASE} ${200 + index * 200}ms`,
      }}
    >
      {/* Glass card border */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        border: "1px solid rgba(255,255,255,0.5)",
        pointerEvents: "none", zIndex: 3,
      }} />

      {/* Hover shimmer: specular highlight that follows cursor */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        pointerEvents: "none", zIndex: 4,
        background: shimmer.active
          ? `radial-gradient(circle at ${shimmer.x}% ${shimmer.y}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)`
          : "transparent",
        opacity: shimmer.active ? 1 : 0,
        transition: "opacity 0.35s ease",
      }} />

      <h3 style={{
        fontSize: 24, fontWeight: 600,
        letterSpacing: "-0.02em", marginBottom: 16,
      }}>{rm.name}</h3>

      <p style={{
        fontSize: 15, lineHeight: 1.75,
        color: "var(--xp-sec)", margin: 0,
      }}>{rm.desc}</p>

      <div style={{
        width: 32, height: 2, background: "var(--xp-gold)",
        borderRadius: 1, marginTop: 28, opacity: 0.5,
      }} />
    </div>
  );
}

function GlassCardsSection() {
  const { ref, isVisible } = useScrollReveal(0.12);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{
      padding: "132px 48px",
      background: "var(--xp-white)",
      position: "relative",
    }}>
      {/* Multi-point gradient mesh for glass refraction depth */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 15% 25%, rgba(107,127,242,0.08) 0%, transparent 40%), radial-gradient(ellipse at 85% 75%, rgba(200,169,110,0.07) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(140,160,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(180,150,90,0.04) 0%, transparent 35%)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>03 / The Framework</div>
          <h2 style={{
            fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 600,
            letterSpacing: "-0.035em", lineHeight: 1.08, marginBottom: 64,
          }}>Watch. Work. Wrap.</h2>
        </Reveal>

        <div className="xp-glass-cards-row" style={{
          display: "flex", gap: 24, alignItems: "stretch",
        }}>
          {ROOMS.map((rm, i) => (
            <GlassCard key={rm.name} rm={rm} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// ACT 7: QUALITY GATES (Glass Spheres)
// ═══════════════════════════════════════════

function QualitySection() {
  const { ref, isVisible } = useScrollReveal(0.12);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let i = 0;
    const iv = setInterval(() => { i++; setLit(i); if (i >= 7) clearInterval(iv); }, 260);
    return () => clearInterval(iv);
  }, [isVisible]);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{
      padding: "132px 48px", background: "var(--xp-off)", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Gradient mesh for glass gate refraction */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 40% 60%, rgba(200,169,110,0.06) 0%, transparent 45%), radial-gradient(ellipse at 60% 40%, rgba(107,127,242,0.05) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(140,160,255,0.03) 0%, transparent 55%)",
      }} />

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>04 / Quality Standard</div>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Seven gates. Zero compromises.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--xp-sec)", maxWidth: 520, margin: "0 auto 56px" }}>
            Nothing ships until every one clears. Voice authenticity. Research validation. SLOP detection. Editorial excellence. Perspective and risk.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="xp-gates-track" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 28,
          }}>
            {GATES.map((g, i) => {
              const on = i < lit;
              const justLit = i === lit - 1;
              return (
                <React.Fragment key={g}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div className="xp-mono" style={{
                      width: 52, height: 52, borderRadius: "50%",
                      border: `1.5px solid ${on ? "rgba(200,169,110,0.5)" : "var(--xp-border)"}`,
                      background: on
                        ? "radial-gradient(circle at 38% 32%, rgba(200,169,110,0.22), rgba(200,169,110,0.06))"
                        : "radial-gradient(circle at 38% 32%, rgba(248,249,250,0.9), rgba(240,238,230,0.6))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 500,
                      color: on ? "var(--xp-gold)" : "var(--xp-ter)",
                      transition: `all .35s ${EASE}`,
                      backdropFilter: "blur(12px) saturate(140%)",
                      WebkitBackdropFilter: "blur(12px) saturate(140%)",
                      boxShadow: on
                        ? "0 4px 16px rgba(200,169,110,0.18), inset 0 0 12px rgba(200,169,110,0.08), inset 0 1px 0 rgba(255,255,255,0.25), inset -1px -1px 1px rgba(200,169,110,0.1)"
                        : "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0.5px rgba(255,255,255,0.15)",
                      animation: justLit ? "xpGatePulse 0.6s ease" : "none",
                    }}><span style={{ position: "relative", zIndex: 5 }}>{i + 1}</span></div>
                    <span className="xp-mono" style={{
                      fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase",
                      color: on ? "var(--xp-gold)" : "var(--xp-ter)",
                      transition: "color .3s ease",
                    }}>{g}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
