import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

/* ═══════════════════════════════════════════════════════════
   EVERYWHERE STUDIO — EXPLORE PAGE v4
   Logo Cinema. Liquid Glass. Scroll-earned reveals.
   Instrument Sans + DM Mono. Apple-grade precision.
   ═══════════════════════════════════════════════════════════ */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_SMOOTH = "cubic-bezier(0.4, 0, 0.2, 1)";

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ══════════════════════════════════
// HOOKS
// ══════════════════════════════════

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
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

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
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
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.9s ${EASE} ${delay}ms, transform 0.9s ${EASE} ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════
// CSS
// ══════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

:root {
  --xp-navy: #0C1A29;
  --xp-navy-deep: #060D14;
  --xp-gold: #C8A96E;
  --xp-gold-dim: rgba(200,169,110,0.12);
  --xp-blue: #6B7FF2;
  --xp-white: #FFFFFF;
  --xp-off: #F8F9FA;
  --xp-text: #0A0A0A;
  --xp-sec: #6B7280;
  --xp-ter: #A1A1AA;
  --xp-on-dark: #F0EDE4;
  --xp-dim-dark: rgba(255,255,255,0.38);
  --xp-border: #E4E4E7;
  --xp-border-dark: rgba(255,255,255,0.06);
  --xp-font: 'Instrument Sans', -apple-system, system-ui, sans-serif;
  --xp-mono: 'DM Mono', monospace;
  --xp-ease: ${EASE};

  /* Glass tokens */
  --glass-blur: 24px;
  --glass-sat: saturate(180%);
  --glass-bg-dark: rgba(10,8,6,0.62);
  --glass-bg-light: rgba(255,255,255,0.72);
  --glass-border-dark: rgba(255,255,255,0.1);
  --glass-border-light: rgba(0,0,0,0.06);
  --glass-shadow-dark: 0 1px 32px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.06);
  --glass-shadow-light: 0 1px 32px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.8);
}

.xp {
  font-family: var(--xp-font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--xp-white);
  color: var(--xp-text);
  overflow-x: hidden;
  scroll-behavior: smooth;
}
.xp a { color: inherit; text-decoration: none; }
.xp ::selection { background: var(--xp-gold); color: var(--xp-navy); }
.xp button:active { transform: scale(0.97) !important; transition-duration: 0.1s !important; }
.xp-mono { font-family: var(--xp-mono); }

/* Keyframes */
@keyframes xpSpin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
@keyframes xpSpinR { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(-360deg);} }
@keyframes xpDot { 0%,100%{opacity:.25;} 50%{opacity:1;} }
@keyframes xpGlow { 0%,100%{opacity:.03;} 50%{opacity:.07;} }
@keyframes xpSlideIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }
@keyframes xpBreath { 0%,100%{transform:scale(1);} 50%{transform:scale(1.012);} }
@keyframes xpGatePulse { 0%{box-shadow:0 0 0 0 rgba(200,169,110,0.3);} 70%{box-shadow:0 0 0 8px rgba(200,169,110,0);} 100%{box-shadow:0 0 0 0 rgba(200,169,110,0);} }
@keyframes xpFadeUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }

/* Pulse dots for composing */
.xp-dots span {
  display:inline-block;width:5px;height:5px;border-radius:50%;
  background:var(--xp-gold);animation:xpDot 1.2s infinite;
}
.xp-dots span:nth-child(2){animation-delay:.2s;}
.xp-dots span:nth-child(3){animation-delay:.4s;}

/* ═══ Liquid Glass Nav ═══ */
.xp-glass-nav {
  position:fixed;top:12px;left:16px;right:16px;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;height:52px;
  border-radius:16px;
  backdrop-filter:blur(var(--glass-blur)) var(--glass-sat);
  -webkit-backdrop-filter:blur(var(--glass-blur)) var(--glass-sat);
  transition:background .5s ${EASE_SMOOTH}, border-color .5s ${EASE_SMOOTH}, box-shadow .5s ${EASE_SMOOTH}, opacity .4s ${EASE};
}
.xp-glass-nav-dark {
  background:var(--glass-bg-dark);
  border:1px solid var(--glass-border-dark);
  box-shadow:var(--glass-shadow-dark);
}
.xp-glass-nav-light {
  background:var(--glass-bg-light);
  border:1px solid var(--glass-border-light);
  box-shadow:var(--glass-shadow-light);
}
.xp-glass-nav-hidden {
  opacity:0;
  pointer-events:none;
}

.xp-nav-link {
  font-size:13px;font-weight:500;cursor:pointer;
  background:none;border:none;font-family:var(--xp-font);transition:opacity .2s;
}
.xp-nav-cta {
  font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  padding:9px 22px;border-radius:999px;cursor:pointer;font-family:var(--xp-font);transition:all .3s;
}

/* ═══ Glass Containers ═══ */
.xp-glass {
  backdrop-filter:blur(20px) saturate(160%);
  -webkit-backdrop-filter:blur(20px) saturate(160%);
  background:rgba(255,255,255,0.65);
  border:1px solid rgba(255,255,255,0.5);
  border-radius:20px;
  box-shadow:
    0 8px 48px rgba(0,0,0,0.06),
    0 1px 3px rgba(0,0,0,0.04),
    inset 0 1px 0 rgba(255,255,255,0.7);
}
.xp-glass-dark {
  background:rgba(12,26,41,0.55);
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 8px 48px rgba(0,0,0,0.2),
    0 1px 3px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

/* ═══ Glass Cards ═══ */
.xp-glass-card {
  backdrop-filter:blur(16px) saturate(140%);
  -webkit-backdrop-filter:blur(16px) saturate(140%);
  background:rgba(255,255,255,0.55);
  border:1px solid rgba(255,255,255,0.6);
  border-radius:16px;
  box-shadow:
    0 4px 32px rgba(0,0,0,0.04),
    0 1px 2px rgba(0,0,0,0.03),
    inset 0 1px 0 rgba(255,255,255,0.8);
  transition: transform .45s ${EASE}, box-shadow .45s ${EASE}, border-color .3s ease;
}
.xp-glass-card:hover {
  transform:translateY(-6px);
  box-shadow:
    0 12px 48px rgba(0,0,0,0.08),
    0 2px 4px rgba(0,0,0,0.04),
    inset 0 1px 0 rgba(255,255,255,0.9);
  border-color:rgba(200,169,110,0.2);
}

/* ═══ Buttons ═══ */
.xp-btn {
  display:inline-flex;align-items:center;gap:8px;
  padding:15px 34px;font-family:var(--xp-font);
  font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  border:none;border-radius:999px;cursor:pointer;
  transition:all .35s var(--xp-ease);
}
.xp-btn-w { background:var(--xp-white);color:var(--xp-navy); }
.xp-btn-w:hover { background:var(--xp-gold);color:var(--xp-navy); }
.xp-btn-n { background:var(--xp-navy);color:var(--xp-white); }
.xp-btn-n:hover { background:#15283d; }
.xp-btn-glass {
  background:rgba(255,255,255,0.12);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.15);
  color:var(--xp-on-dark);
}
.xp-btn-glass:hover {
  background:rgba(255,255,255,0.2);
  border-color:rgba(255,255,255,0.25);
}

/* ═══ Responsive ═══ */
@media(max-width:900px){
  .xp-glass-nav{left:8px;right:8px;top:8px;padding:0 20px;height:48px;border-radius:14px;}
  .xp-nav-links-desktop{display:none !important;}
  .xp-3col{grid-template-columns:1fr !important;}
  .xp-3col>div{border-left:none !important;padding:0 !important;}
  .xp-3col>div+div{padding-top:24px !important;}
  .xp-reed-side{display:none !important;}
  .xp-reed-met{display:none !important;}
  .xp-stats-row{flex-direction:column !important;gap:48px !important;}
  .xp-gates-track{flex-wrap:wrap !important;gap:12px !important;}
  .xp-gate-line{display:none !important;}
  .xp-footer-inner{flex-direction:column !important;text-align:center !important;gap:16px !important;}
  .xp-logo-cinema{font-size:13vw !important;}
  .xp-statement-text{font-size:7vw !important;}
  .xp-split-grid{grid-template-columns:1fr !important;}
  .xp-parallax-nums{flex-direction:column !important;align-items:center !important;gap:40px !important;}
  .xp-glass-cards-row{flex-direction:column !important;}
}
@media(max-width:600px){
  .xp-sect{padding-left:20px !important;padding-right:20px !important;}
  .xp-glass-nav{left:6px;right:6px;top:6px;padding:0 16px;}
  .xp-logo-cinema{font-size:16vw !important;}
  .xp-statement-text{font-size:9vw !important;}
}

/* Reduced motion */
@media(prefers-reduced-motion: reduce){
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// ══════════════════════════════════
// DATA
// ══════════════════════════════════

const PROBLEMS = [
  { without: "200 pieces a month. No idea which 10 moved the needle.", with: "Every piece tracked, measured, and ranked by real impact." },
  { without: "Strategy, brand voice, SEO, distribution: four specialists who have never shared a room.", with: "40 specialists collaborating in real time on every single piece." },
  { without: "AI tools that generate fast. Audiences that can tell.", with: "Intelligence that thinks before it writes. Quality your audience trusts." },
  { without: "Quality review after publishing. If it happens at all.", with: "Seven gates. Every piece. Before it ships." },
];

const ROOMS = [
  { name: "Watch", desc: "The intelligence layer. Reed monitors your industry, tracks competitors, and builds strategic foundation before creation begins.", icon: "◉" },
  { name: "Work", desc: "The creation engine. 40 specialists collaborate across copywriting, voice, SEO, design direction, and distribution.", icon: "◈" },
  { name: "Wrap", desc: "The quality standard. Seven gates verify every output against voice DNA, accuracy, and audience relevance.", icon: "◇" },
];

const GATES = ["Voice", "Strategy", "Accuracy", "Audience", "Format", "Brand", "Final"];

const SPECIALIST_TAGS = ["Brand Voice", "Enterprise Copy", "SEO", "Distribution", "Analytics"];

const STATEMENT_WORDS = ["Your", "content", "deserves", "composed", "intelligence."];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const scrollY = useScrollPosition();
  const reducedMotion = useReducedMotion();
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [heroComplete, setHeroComplete] = useState(false);

  // Page load
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Logo Cinema calculations ──
  // The logo starts large and centered, then shrinks and moves to nav position
  const CINEMA_DURATION = typeof window !== "undefined" ? window.innerHeight : 900;
  const cinemaProgress = reducedMotion ? 1 : clamp(scrollY / CINEMA_DURATION, 0, 1);
  const cinemaEased = easeOut(cinemaProgress);

  // Logo scale: starts at ~5x, ends at 1x (nav size)
  const logoScale = lerp(5, 1, cinemaEased);
  // Logo Y position: starts at ~40vh, ends at nav position (top)
  const logoY = lerp(40, 0, cinemaEased);
  // Logo X position: starts centered, ends at left
  const logoX = lerp(0, 0, cinemaEased); // stays centered-ish, nav handles final position
  // Hero content opacity: fades in as logo shrinks
  const heroContentOpacity = clamp((cinemaProgress - 0.4) / 0.4, 0, 1);
  // Background fade: starts solid dark, transitions as logo shrinks
  const heroBgOpacity = 1;
  // Nav visibility: appears after cinema completes ~70%
  const navVisible = cinemaProgress > 0.65;
  // Logo in cinema vs in nav
  const logoInCinema = cinemaProgress < 0.95;

  useEffect(() => {
    if (cinemaProgress >= 0.95 && !heroComplete) setHeroComplete(true);
  }, [cinemaProgress, heroComplete]);

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

  // Scroll progress for the thin gold bar
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
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

      {/* ── Scroll progress bar ── */}
      <div style={{ position: "fixed", top: 0, left: 0, height: 2, width: `${scrollProgress * 100}%`, background: "var(--xp-gold)", zIndex: 200, transition: "width .06s linear", pointerEvents: "none" }} />

      {/* ═══ LIQUID GLASS NAV ═══ */}
      <nav className={`xp-glass-nav ${isDarkNav ? "xp-glass-nav-dark" : "xp-glass-nav-light"} ${!navVisible ? "xp-glass-nav-hidden" : ""}`}>
        <div style={{
          opacity: navVisible && !logoInCinema ? 1 : 0,
          transition: `opacity 0.4s ${EASE}`,
          display: "flex", alignItems: "center",
        }}>
          <Logo
            size="sm"
            variant={isDarkNav ? "dark" : "light"}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {!isMobile && (
            <div className="xp-nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button className="xp-nav-link" onClick={goSignin} style={{
                color: isDarkNav ? "rgba(255,255,255,0.55)" : "var(--xp-sec)",
              }}>Sign In</button>
              <button className="xp-nav-cta" onClick={goSignup} style={
                isDarkNav
                  ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--xp-on-dark)" }
                  : { background: "var(--xp-navy)", border: "1px solid var(--xp-navy)", color: "var(--xp-white)" }
              }>Get Early Access</button>
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
            { label: "Sign In", action: () => { setMobileMenuOpen(false); goSignin(); } },
            { label: "Get Early Access", action: () => { setMobileMenuOpen(false); goSignup(); } },
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
          ACT 1: LOGO CINEMA + HERO
          The logo starts massive and centered, then physically
          shrinks into the nav as the user scrolls.
          ═══════════════════════════════════════════ */}
      <section data-nav-theme="dark" style={{
        height: "200vh", // Double viewport for scroll-driven animation space
        position: "relative",
        background: "var(--xp-navy-deep)",
      }}>
        {/* Sticky container holds the visual content in place during scroll */}
        <div style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {/* Background radial glow */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse at 50% 45%, rgba(200,169,110,${0.03 + cinemaEased * 0.02}) 0%, transparent 60%)`,
            animation: "xpGlow 8s ease-in-out infinite",
            pointerEvents: "none",
          }} />

          {/* Geometric rings - fade in as cinema progresses */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: heroContentOpacity }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 320, height: 320, borderRadius: "50%", border: "0.5px solid rgba(200,169,110,0.055)", animation: "xpSpin 80s linear infinite" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 520, height: 520, borderRadius: "50%", border: "0.5px solid rgba(255,255,255,0.035)", animation: "xpSpinR 140s linear infinite" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 740, height: 740, borderRadius: "50%", border: "0.5px solid rgba(255,255,255,0.025)", animation: "xpSpin 200s linear infinite" }} />
          </div>

          {/* THE LOGO CINEMA */}
          <div style={{
            position: "absolute",
            top: `${lerp(50, 4, cinemaEased)}%`,
            left: "50%",
            transform: `translate(-50%, -50%) scale(${logoScale})`,
            transformOrigin: "center center",
            zIndex: 10,
            opacity: logoInCinema ? 1 : 0,
            transition: logoInCinema ? "none" : `opacity 0.3s ${EASE}`,
            animation: cinemaProgress < 0.05 && pageLoaded ? "xpBreath 4s ease-in-out infinite" : "none",
          }}>
            <Logo
              size="sm"
              variant="dark"
            />
          </div>

          {/* Hero content - fades in as logo cinema completes */}
          <div style={{
            position: "relative", zIndex: 2,
            textAlign: "center", maxWidth: 800,
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "0 48px",
            opacity: heroContentOpacity,
            transform: `translateY(${lerp(40, 0, clamp((cinemaProgress - 0.3) / 0.5, 0, 1))}px)`,
          }}>
            <div className="xp-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--xp-dim-dark)", marginBottom: 28,
            }}>
              {MARKETING_NUMBERS.specialistCount} Specialists. {MARKETING_NUMBERS.qualityCheckpoints} Gates. One Intelligence.
            </div>
            <h1 style={{
              fontSize: "clamp(52px, 8.5vw, 100px)", fontWeight: 600,
              letterSpacing: "-0.04em", lineHeight: 1.02,
              color: "var(--xp-on-dark)", marginBottom: 24,
            }}>
              Composed<br />Intelligence
            </h1>
            <div style={{ height: 1, width: 64, background: "var(--xp-gold)", marginBottom: 28 }} />
            <p style={{
              fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)",
              maxWidth: 400, marginBottom: 44,
            }}>
              Content that performs. Quality that scales.<br />Intelligence that compounds.
            </p>
            <div>
              <button className="xp-btn xp-btn-w" onClick={goSignup}>Get Early Access</button>
            </div>
          </div>

          {/* Scroll hint - only when cinema hasn't started */}
          <div style={{
            position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
            opacity: cinemaProgress < 0.05 ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span className="xp-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--xp-dim-dark)", textTransform: "uppercase" }}>Scroll</span>
              <div style={{ width: 1, height: 24, background: "var(--xp-gold)", borderRadius: 1, animation: "xpGlow 2s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ACT 2: THE STATEMENT
          Single massive typographic moment. Words reveal
          sequentially on scroll.
          ═══════════════════════════════════════════ */}
      <StatementSection />

      {/* ═══════════════════════════════════════════
          ACT 3: THE SPLIT
          Without us / With us. Left fades, right expands.
          ═══════════════════════════════════════════ */}
      <SplitSection />

      {/* ═══════════════════════════════════════════
          ACT 4: REED IN GLASS
          Light-mode product demo in liquid glass container.
          ═══════════════════════════════════════════ */}
      <ReedSection isMobile={isMobile} />

      {/* ═══════════════════════════════════════════
          ACT 5: ARCHITECTURAL NUMBERS
          Massive parallax typography.
          ═══════════════════════════════════════════ */}
      <NumbersSection />

      {/* ═══════════════════════════════════════════
          ACT 6: WATCH. WORK. WRAP. (Glass Cards)
          Three liquid glass cards that fan out on enter.
          ═══════════════════════════════════════════ */}
      <GlassCardsSection />

      {/* ═══════════════════════════════════════════
          ACT 7: QUALITY GATES
          Sequential light-up with glass spheres.
          ═══════════════════════════════════════════ */}
      <QualitySection />

      {/* ═══════════════════════════════════════════
          ACT 8: CTA + FOOTER (Dark bookend)
          ═══════════════════════════════════════════ */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "160px 48px", background: "var(--xp-navy-deep)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Bookend rings echo the hero */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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
                Start building.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--xp-dim-dark)", maxWidth: 380, marginBottom: 48 }}>
                Join the teams replacing content chaos with a system that compounds.
              </p>
              <button className="xp-btn xp-btn-w" onClick={goSignup} style={{ marginBottom: 16 }}>Get Early Access</button>
              <div style={{ marginTop: 20 }}>
                <button className="xp-btn xp-btn-glass" onClick={goSignin}>Sign In</button>
              </div>
              <div style={{ marginTop: 40 }}>
                <a href="mailto:mark@coastalintelligence.ai" className="xp-mono" style={{ fontSize: 12, color: "var(--xp-dim-dark)", textDecoration: "none" }}>
                  mark@coastalintelligence.ai
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "36px 48px", background: "var(--xp-white)", borderTop: "1px solid var(--xp-border)" }}>
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
          <span style={{ fontSize: 12, color: "var(--xp-ter)" }}>&copy; {new Date().getFullYear()} Mixed Grill LLC / Coastal Intelligence. All rights reserved.</span>
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
          // Stagger word reveals
          STATEMENT_WORDS.forEach((_, i) => {
            setTimeout(() => setWordIndex(i), 120 * (i + 1));
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
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "120px 48px",
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
            const isGold = word === "intelligence.";
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
            Everywhere Studio
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
      padding: "140px 48px", background: "var(--xp-off)",
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
            Content teams are drowning in tools.{" "}
            <span style={{ color: "var(--xp-ter)" }}>Starving for strategy.</span>
          </h2>
        </Reveal>

        {/* The split grid */}
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
            overflow: "hidden",
            minWidth: 0,
          }}>
            <div style={{ minWidth: 400 }}>
              <div className="xp-mono" style={{
                fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--xp-ter)", marginBottom: 24, paddingRight: 40,
              }}>Without Us</div>
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
            }}>With Everywhere Studio</div>
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
// ACT 4: REED IN GLASS
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
      padding: "140px 48px",
      background: "var(--xp-white)",
      position: "relative",
    }}>
      {/* Subtle gradient mesh behind the glass container */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 30% 40%, rgba(107,127,242,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(200,169,110,0.03) 0%, transparent 50%)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>02 / Meet Reed</div>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 600, marginBottom: 16 }}>
            Intelligence that thinks<br />before it writes.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", maxWidth: 520, marginBottom: 56 }}>
            Reed coordinates {MARKETING_NUMBERS.specialistCount} specialists across research, strategy, voice calibration, and quality review before a single word reaches your audience.
          </p>
        </Reveal>

        {/* LIQUID GLASS CONTAINER for Reed demo */}
        <Reveal delay={200}>
          <div className="xp-glass" style={{
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Inner glow */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.04) 0%, transparent 60%)",
              borderRadius: 20,
            }} />

            {/* The actual interface */}
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
              {/* Title bar */}
              <div style={{
                display: "flex", alignItems: "center", padding: "11px 18px",
                background: "rgba(248,249,250,0.8)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", gap: 7 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
                </div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--xp-ter)", fontWeight: 500 }}>Everywhere Studio</div>
                <div style={{ width: 48 }} />
              </div>

              <div style={{ display: "flex", minHeight: isMobile ? 360 : 420, background: "rgba(255,255,255,0.9)" }}>
                {/* Sidebar */}
                <div className="xp-reed-side" style={{
                  width: 172, background: "rgba(248,249,250,0.7)",
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

                  {/* Composing indicator */}
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
                          background: "var(--xp-off)",
                          border: "1px solid var(--xp-border)",
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
                  width: 192, background: "rgba(248,249,250,0.7)",
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
  const ref = useRef<HTMLDivElement>(null);
  const { ref: revealRef, isVisible } = useScrollReveal(0.15);
  const a = useCountUp(MARKETING_NUMBERS.specialistCount, 1600, isVisible);
  const b = useCountUp(MARKETING_NUMBERS.outputFormatCount, 1200, isVisible);
  const c = useCountUp(MARKETING_NUMBERS.qualityCheckpoints, 900, isVisible);

  return (
    <section data-nav-theme="light" ref={revealRef} style={{
      minHeight: "80vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "120px 48px",
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
          { v: b, label: "Output Formats", size: "clamp(60px, 12vw, 140px)" },
          { v: c, label: "Quality Gates", size: "clamp(80px, 15vw, 180px)" },
        ].map((s, i) => (
          <div key={s.label} style={{
            textAlign: "center",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(40px)",
            transition: `opacity 0.8s ${EASE} ${i * 150}ms, transform 0.8s ${EASE} ${i * 150}ms`,
          }}>
            <div style={{
              fontSize: s.size,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 0.85,
              color: "var(--xp-text)",
              opacity: 0.9,
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
// ACT 6: GLASS CARDS
// ═══════════════════════════════════════════

function GlassCardsSection() {
  const { ref, isVisible } = useScrollReveal(0.12);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{
      padding: "140px 48px",
      background: "var(--xp-white)",
      position: "relative",
    }}>
      {/* Subtle gradient mesh */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 30%, rgba(107,127,242,0.03) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(200,169,110,0.03) 0%, transparent 40%)",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>03 / The System</div>
          <h2 style={{
            fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 600,
            letterSpacing: "-0.035em", lineHeight: 1.08, marginBottom: 64,
          }}>Watch. Work. Wrap.</h2>
        </Reveal>

        <div className="xp-glass-cards-row" style={{
          display: "flex", gap: 24, alignItems: "stretch",
        }}>
          {ROOMS.map((rm, i) => (
            <div key={rm.name} className="xp-glass-card" style={{
              flex: 1,
              padding: "40px 32px",
              opacity: isVisible ? 1 : 0,
              transform: isVisible
                ? "translateY(0) rotate(0deg)"
                : `translateY(${60 + i * 20}px) rotate(${(i - 1) * 2}deg)`,
              transition: `opacity 0.7s ${EASE} ${200 + i * 120}ms, transform 0.7s ${EASE} ${200 + i * 120}ms`,
            }}>
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(200,169,110,0.06)",
                border: "1px solid rgba(200,169,110,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: "var(--xp-gold)",
                marginBottom: 28,
              }}>
                {rm.icon}
              </div>

              {/* Phase name */}
              <h3 style={{
                fontSize: 24, fontWeight: 600,
                letterSpacing: "-0.02em", marginBottom: 16,
              }}>{rm.name}</h3>

              {/* Description */}
              <p style={{
                fontSize: 15, lineHeight: 1.75,
                color: "var(--xp-sec)", margin: 0,
              }}>{rm.desc}</p>

              {/* Subtle bottom accent */}
              <div style={{
                width: 32, height: 2, background: "var(--xp-gold)",
                borderRadius: 1, marginTop: 28, opacity: 0.5,
              }} />
            </div>
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
      padding: "140px 48px", background: "var(--xp-off)", textAlign: "center",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>04 / Quality Standard</div>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Seven gates. Zero compromises.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--xp-sec)", maxWidth: 520, margin: "0 auto 56px" }}>
            Every piece of content passes through seven independent quality checkpoints before reaching your audience.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="xp-gates-track" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {GATES.map((g, i) => {
              const on = i < lit;
              const justLit = i === lit - 1;
              return (
                <React.Fragment key={g}>
                  {i > 0 && (
                    <div className="xp-gate-line" style={{
                      width: 32, height: 1, flexShrink: 0,
                      background: on ? "var(--xp-gold)" : "var(--xp-border)",
                      transition: "background .3s ease",
                      boxShadow: on ? "0 0 8px rgba(200,169,110,0.2)" : "none",
                    }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div className="xp-mono" style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: `1.5px solid ${on ? "var(--xp-gold)" : "var(--xp-border)"}`,
                      background: on
                        ? "radial-gradient(circle at 40% 35%, rgba(200,169,110,0.12), rgba(200,169,110,0.03))"
                        : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 500,
                      color: on ? "var(--xp-gold)" : "var(--xp-ter)",
                      transition: `all .35s ${EASE}`,
                      boxShadow: on
                        ? "0 2px 12px rgba(200,169,110,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                        : "0 1px 4px rgba(0,0,0,0.03)",
                      animation: justLit ? "xpGatePulse 0.6s ease" : "none",
                    }}>{i + 1}</div>
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
