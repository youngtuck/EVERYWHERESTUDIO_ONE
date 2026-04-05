import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

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

// ── Reveal wrapper ────────────────────────────────────────────
type RevealDirection = "up" | "left" | "right" | "scale" | "none";

function Reveal({
  children, delay = 0, threshold = 0.15, direction = "up", distance = 40,
  duration = 900, once = true, scale, style,
}: {
  children: React.ReactNode; delay?: number; threshold?: number;
  direction?: RevealDirection; distance?: number; duration?: number;
  once?: boolean; scale?: boolean; style?: React.CSSProperties;
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
    <div ref={ref} style={{
      opacity: show ? 1 : 0,
      transform: show ? `translateY(0) translateX(0) scale(1)` : `${hiddenTransform}${scale && direction !== "scale" ? " scale(0.95)" : ""}`,
      transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
      ...style,
    }}>{children}</div>
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
  background: var(--ew-white);
  color: var(--ew-text-dark);
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  position: relative;
}

.xp a { color: inherit; text-decoration: none; }
.xp button, .xp a { cursor: pointer; }

/* Text selection */
.xp ::selection { background: rgba(74,144,217,0.2); color: #111; }
[data-nav-theme="dark"] ::selection { background: rgba(245,198,66,0.3); color: white; }

.xp button:active, .xp a:active { transform: scale(0.98) !important; transition-duration: 0.1s !important; }

.xp-reed-widget { cursor: default; }

/* Nav */
.xp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 56px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px;
  transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease;
}

/* Buttons */
.xp-btn-gold {
  display: inline-block; padding: 14px 36px;
  background: var(--ew-gold); color: var(--ew-navy); border: none; border-radius: 6px;
  font-size: 14px; font-weight: 700; font-family: var(--font); letter-spacing: 0.02em;
  cursor: pointer; transition: opacity 0.25s ${EASE}, transform 0.25s ${EASE}; text-decoration: none;
}
.xp-btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }
.xp-btn-outline {
  display: inline-block; padding: 14px 36px;
  background: transparent; color: var(--ew-text-light);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
  font-size: 14px; font-weight: 600; font-family: var(--font);
  cursor: pointer; transition: border-color 0.25s ${EASE}, transform 0.25s ${EASE}; text-decoration: none;
}
.xp-btn-outline:hover { border-color: rgba(255,255,255,0.4); transform: translateY(-1px); }

.xp-inner { max-width: 1080px; margin: 0 auto; padding: 0 40px; }

/* Moment cards */
.xp-moment {
  background: var(--ew-white);
  border: 1px solid var(--ew-border-light);
  border-radius: 8px;
  padding: 24px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.xp-moment:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.06); transform: translateY(-2px); }

/* Footer */
.xp-footer {
  max-width: 1080px; margin: 0 auto; padding: 20px 40px;
  display: flex; align-items: center; justify-content: space-between;
}

/* Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }

/* Tab component */
.xp-tab-row {
  display: flex; justify-content: center; gap: 0;
  border-bottom: 1px solid var(--ew-border-light); margin-bottom: 0;
}
.xp-tab {
  padding: 12px 24px; font-size: 14px; font-weight: 500; color: #94A3B8;
  border: none; background: none; cursor: pointer; font-family: var(--font);
  border-bottom: 2px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
  margin-bottom: -1px;
}
.xp-tab:hover { color: var(--ew-text-dark); }
.xp-tab.active { color: var(--ew-text-dark); font-weight: 700; border-bottom-color: var(--ew-gold); }

/* Triptych */
.xp-triptych { height: 300vh; position: relative; }
.xp-triptych-inner {
  position: sticky; top: 0; height: 100vh;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.xp-triptych-state {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.6s ease, transform 0.6s ease; padding: 0 40px;
}

/* Keyframes */
@keyframes xpFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes xpWordUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes xpScrollPulse { 0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; } 50% { transform: translateX(-50%) translateY(8px); opacity: 1; } }
@keyframes xpSlideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes xpSonarPing { 0% { transform: scale(1); opacity: 0.1; } 70% { transform: scale(1.4); opacity: 0; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes xpMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

@media (max-width: 768px) {
  .xp-inner { padding: 0 20px; }
  .xp-nav { padding: 0 20px; }
  .xp-footer { padding: 20px; }
  .xp-triptych { height: 200vh; }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const progress = useScrollProgress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"watch" | "work" | "wrap">("watch");

  // Triptych
  const triptychRef = useRef<HTMLDivElement>(null);
  const triptychProgress = useElementScroll(triptychRef);
  const triptychState = triptychProgress < 0.33 ? 0 : triptychProgress < 0.66 ? 1 : 2;

  // Hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const heroProgress = useElementScroll(heroRef);
  const heroParallax = { y: heroProgress * 80, opacity: Math.max(0, 1 - heroProgress * 2.5) };

  // Scroll state
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 40);
      // Detect nav theme from section under nav
      const sections = document.querySelectorAll("[data-nav-theme]");
      let currentTheme: "dark" | "light" = "dark";
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 56 && rect.bottom > 56) {
          currentTheme = (section.getAttribute("data-nav-theme") as "dark" | "light") || "dark";
        }
      });
      setNavTheme(currentTheme);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lenis smooth scroll
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js";
    script.onload = () => {};
    document.head.appendChild(script);
    return () => { document.head.removeChild(link); document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    const Lenis = (window as any).Lenis;
    if (!Lenis) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const tabContent: Record<string, string> = {
    watch: "You arrive knowing what your audience is already thinking. Your ideas land in context, not into noise.",
    work: "Your idea becomes publication-ready content. In your voice. Verified. Zero AI fingerprints. Nothing ships until it reads like a human made every decision.",
    wrap: "One idea. Every channel. Simultaneously. Newsletter, LinkedIn, podcast, Substack, formatted for each, ready to publish.",
  };

  const triptychContent = [
    { label: "Watch", body: "You arrive knowing what your audience is already thinking." },
    { label: "Work", body: "Your idea becomes publication-ready content. In your voice." },
    { label: "Wrap", body: "One idea. Every channel. Simultaneously." },
  ];

  return (
    <div className="xp">
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 20px" : "0 40px",
        background: navScrolled
          ? (navTheme === "dark" ? "rgba(13,27,42,0.92)" : "rgba(255,255,255,0.85)")
          : "transparent",
        backdropFilter: navScrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: navScrolled ? "blur(16px)" : "none",
        borderBottom: navScrolled
          ? (navTheme === "dark" ? "1px solid var(--ew-border-dark)" : "1px solid var(--ew-border-light)")
          : "1px solid transparent",
        transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
      }}>
        <Logo size="sm" variant={navTheme === "dark" ? "dark" : "light"} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {!isMobile && (
            <>
              <button onClick={() => navigate("/auth")} style={{
                fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: navTheme === "dark" ? "rgba(255,255,255,0.7)" : "var(--ew-text-body)",
                background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)", padding: "4px 0",
                transition: "color 0.3s ease",
              }}>Sign In</button>
              <button onClick={() => navigate("/auth?mode=signup")} style={{
                padding: "8px 22px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, fontFamily: "var(--font)", borderRadius: 100, cursor: "pointer",
                transition: "all 0.4s ease",
                ...(navTheme === "dark"
                  ? { border: "1px solid rgba(255,255,255,0.2)", color: "var(--ew-white)", background: "transparent" }
                  : { border: "none", color: "var(--ew-white)", background: "var(--ew-text-dark)" }),
              }}>Get Early Access</button>
            </>
          )}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}>
              {[0, 1, 2].map(i => (<span key={i} style={{ display: "block", width: 20, height: 2, background: navTheme === "dark" ? "var(--ew-white)" : "var(--ew-text-dark)", borderRadius: 1 }} />))}
            </button>
          )}
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--ew-navy)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 28, color: "var(--ew-gold)", fontFamily: "var(--font)", fontWeight: 300 }}>&times;</button>
          {[
            { label: "Sign In", action: () => { setMobileMenuOpen(false); navigate("/auth"); } },
            { label: "Get Early Access", action: () => { setMobileMenuOpen(false); navigate("/auth?mode=signup"); } },
          ].map((link, i) => (
            <button key={link.label} onClick={link.action} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, fontWeight: 600, color: "var(--ew-white)", fontFamily: "var(--font)", letterSpacing: "0.04em", animation: `xpSlideInRight 0.5s ${EASE} ${i * 80}ms both` }}>{link.label}</button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 1: HERO (Dark navy)
         ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} data-nav-theme="dark" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", background: "var(--ew-navy)", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(74,144,217,0.06) 0%, transparent 60%)", transform: `translateY(${heroParallax.y * -0.33}px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.025, pointerEvents: "none" }} />
        <div style={{ textAlign: "center", maxWidth: 900, padding: "0 32px", position: "relative", zIndex: 1, transform: `translateY(${heroParallax.y}px)`, opacity: heroParallax.opacity, willChange: "transform, opacity" }}>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" as any, margin: "0 0 28px", color: "var(--ew-white)" }}>
            <span style={{ display: "block" }}>
              {"Your thinking reaches your audience.".split(" ").map((word, i) => (
                <span key={i} style={{ display: "inline-block", animation: `xpWordUp 0.7s ${EASE} ${100 + i * 80}ms both`, marginRight: "0.27em" }}>{word}</span>
              ))}
            </span>
            <span style={{ display: "block", color: "var(--ew-gold)", fontWeight: 500, fontStyle: "italic", fontSize: "clamp(20px, 3vw, 36px)", letterSpacing: "-0.01em", lineHeight: 1.35, marginTop: 8, animation: `xpFadeUp 0.8s ${EASE} 0.8s both` }}>
              In your voice. Better than you'd write it yourself.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", color: "var(--ew-text-light-dim)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.55, animation: `xpFadeUp 0.8s ${EASE} 1s both` }}>
            Reed is your guide. You talk, and the world hears you.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", animation: `xpFadeUp 0.8s ${EASE} 1.15s both` }}>
            <button className="xp-btn-gold" onClick={() => navigate("/auth?mode=signup")}>Get Early Access</button>
            <button className="xp-btn-outline" onClick={() => { const el = document.querySelector("[data-section='problem']"); el?.scrollIntoView({ behavior: "smooth" }); }}>See How It Works</button>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "xpScrollPulse 2s ease-in-out infinite", opacity: heroParallax.opacity }}>
          <div style={{ width: 2, height: 24, background: "var(--ew-gold)", borderRadius: 1 }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 2: THE PROBLEM (White)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" data-section="problem" style={{ background: "var(--ew-white)", padding: isMobile ? "80px 0" : "120px 0" }}>
        <div className="xp-inner" style={{ maxWidth: 720 }}>
          <Reveal direction="left">
            <div style={{ borderLeft: "3px solid var(--ew-blue)", paddingLeft: 24 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ew-text-dark)", margin: "0 0 24px" }}>
                The thought leaders you see everywhere aren't better thinkers. They got their ideas out.
              </h2>
              <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, margin: "0 0 16px" }}>
                You have the thinking. What you've been missing is someone to carry it, from your head, into the world, without you doing the work twice.
              </p>
              <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, margin: "0 0 16px" }}>
                This isn't about discipline or talent.
              </p>
              <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, margin: 0 }}>
                It's an infrastructure problem. Reed is the answer.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 3: REED INTRODUCTION (Rich dark)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="dark" style={{ background: "var(--ew-navy-rich)", padding: isMobile ? "80px 0" : "120px 0", color: "var(--ew-text-light)" }}>
        <div className="xp-inner">
          <Reveal>
            <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "5fr 6fr", gap: 80, alignItems: "start" }}>
              <div style={{ marginBottom: isMobile ? 48 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--ew-gold)", marginBottom: 16 }}>Reed</div>
                <p style={{ fontSize: 17, color: "var(--ew-text-light)", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Reed is your thinking partner. You talk. He listens. He asks until he finds what you actually mean, not what you said first. Then you're done.
                </p>
                <p style={{ fontSize: 17, color: "var(--ew-text-light-dim)", lineHeight: 1.7, margin: 0 }}>
                  No editing. No formatting. No chasing the idea across five tabs. Reed carries it. What comes back is done. In your voice. Ready to ship.
                </p>
              </div>
              {/* Reed Widget */}
              <div className="xp-reed-widget" style={{ perspective: 1000, maxWidth: 480, width: "100%", marginBottom: 56 }}
                onMouseMove={e => {
                  const el = e.currentTarget.firstElementChild as HTMLElement;
                  if (!el) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
                  const dx = (e.clientX - cx) / (rect.width / 2); const dy = (e.clientY - cy) / (rect.height / 2);
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
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid var(--ew-border-dark)", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", width: "100%", transition: `transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}`, position: "relative" }}>
                  <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle at 50% 50%, rgba(74,144,217,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ew-border-dark)", display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ew-gold)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ew-text-light-dim)", letterSpacing: "0.04em" }}>Reed is listening</span>
                  </div>
                  <div style={{ padding: "20px 20px 16px", position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "14px 14px 4px 14px", padding: "10px 16px", maxWidth: "80%", fontSize: 13, color: "var(--ew-text-light)", lineHeight: 1.5 }}>
                        The people in your market who show up everywhere aren't better thinkers. They got their ideas out. Every week. On every channel. Without doing it alone.
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                      <div style={{ background: "rgba(245,198,66,0.06)", border: "1px solid rgba(245,198,66,0.1)", borderRadius: "14px 14px 14px 4px", padding: "10px 16px", maxWidth: "85%", fontSize: 13, color: "var(--ew-text-light)", lineHeight: 1.5 }}>
                        <strong style={{ color: "var(--ew-gold)" }}>Core thesis:</strong> Infrastructure, not talent, separates visible thought leaders from invisible ones.<br /><br />Who specifically needs to hear this?
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--ew-border-dark)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--ew-gold)", fontVariantNumeric: "tabular-nums" }}>86</span>
                        <span style={{ fontSize: 11, color: "var(--ew-text-light-dim)", fontWeight: 500 }}>Impact Score</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["LinkedIn", "Newsletter", "Podcast"].map(f => (
                          <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid var(--ew-border-dark)", color: "var(--ew-text-light-dim)", letterSpacing: "0.02em" }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: "clamp(18px, 2.5vw, 28px)", fontWeight: 600, color: "var(--ew-text-light)", textAlign: "center", maxWidth: 700, margin: "0 auto", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
              The people in your market who show up everywhere aren't better thinkers. They have better infrastructure.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 4: YOU KNOW THIS FEELING (Off-white)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" style={{ background: "var(--ew-offwhite)", padding: isMobile ? "80px 0" : "120px 0" }}>
        <div className="xp-inner">
          <Reveal>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ew-text-dark)", margin: "0 0 16px", textAlign: "center" }}>
              The idea is in your head. Not in the world.
            </h2>
            <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
              You've been carrying ideas that deserve an audience. The problem was never the thinking. It was the distance between having the thought and getting it out. In your voice, at the quality it deserves, on every channel that matters.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {[
              { label: "Sunday night", text: "The week is ending. You had three ideas worth writing about. None of them made it out." },
              { label: "On a plane", text: "You write two pages of thinking in a notebook. It never becomes anything." },
              { label: "Watching someone else", text: "You see someone on stage or in your feed saying something you've thought for years. They just got it out first." },
              { label: "After the conversation", text: "You just explained something perfectly to a client. Room changed. No one else will ever hear that version of it." },
            ].map((card, i) => (
              <Reveal key={card.label} delay={i * 100}>
                <div className="xp-moment">
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ew-text-dark)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 8 }}>{card.label}</div>
                  <p style={{ fontSize: 15, color: "var(--ew-text-body)", lineHeight: 1.6, margin: 0 }}>{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 5: TABBED PRODUCT DEMO (White)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" style={{ background: "var(--ew-white)", padding: isMobile ? "80px 0" : "120px 0" }}>
        <div className="xp-inner">
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--ew-blue)", marginBottom: 16, textAlign: "center" }}>EVERYWHERE STUDIO</div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", color: "var(--ew-text-dark)", margin: "0 0 16px", textAlign: "center", maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
              You talk. Reed listens until he really gets it. Then {MARKETING_NUMBERS.specialistCount} specialists turn what you said into publication-ready content, in your voice, verified, every word traceable back to you.
            </h2>
            <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
              You talk. They work. You publish. Every word sounds like you. Every claim is verified. Nothing ships without passing {MARKETING_NUMBERS.qualityCheckpoints} quality checkpoints.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="xp-tab-row">
              {(["watch", "work", "wrap"] as const).map(tab => (
                <button key={tab} className={`xp-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ border: "1px solid var(--ew-border-light)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: isMobile ? 24 : 40, minHeight: 200 }}>
              <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, margin: "0 0 24px", maxWidth: 560 }}>
                {tabContent[activeTab]}
              </p>
              <div style={{ height: 200, background: "var(--ew-offwhite)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>Product demo</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 6: STORYTELLING TRIPTYCH (Off-white)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" ref={triptychRef} className="xp-triptych" style={{ background: "var(--ew-offwhite)" }}>
        <div className="xp-triptych-inner">
          {triptychContent.map((item, i) => {
            const isActive = triptychState === i;
            return (
              <div key={item.label} className="xp-triptych-state" style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(20px)",
                pointerEvents: isActive ? "auto" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 80, maxWidth: 900, width: "100%", flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 800, color: "var(--ew-gold)", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 16 }}>{item.label}</div>
                    <p style={{ fontSize: "clamp(17px, 2vw, 22px)", color: "var(--ew-text-body)", lineHeight: 1.6, maxWidth: 400 }}>{item.body}</p>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                    {i === 0 && (
                      <div style={{ width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,144,217,0.15) 0%, rgba(74,144,217,0.03) 70%, transparent 100%)", border: "1px solid rgba(74,144,217,0.1)" }} />
                    )}
                    {i === 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 200 }}>
                        {[0.9, 0.7, 1, 0.5, 0.8].map((w, j) => (
                          <div key={j} style={{ height: 3, borderRadius: 2, background: `rgba(74,144,217,${0.1 + j * 0.04})`, width: `${w * 100}%` }} />
                        ))}
                      </div>
                    )}
                    {i === 2 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 240, justifyContent: "center" }}>
                        {["LinkedIn", "Newsletter", "Podcast", "Substack", "Essay", "Video"].map(f => (
                          <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 6, background: "var(--ew-white)", border: "1px solid var(--ew-border-light)", color: "var(--ew-text-body)" }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 7: QUALITY STANDARD (White)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" style={{ background: "var(--ew-white)", padding: isMobile ? "80px 0" : "120px 0" }}>
        <div className="xp-inner" style={{ maxWidth: 720 }}>
          <Reveal direction="left">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--ew-blue)", marginBottom: 16 }}>Quality Standard</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--ew-text-dark)", margin: "0 0 24px" }}>
              {"Nothing ships unless it would fool a skeptic.".split(" ").map((word, i) => (
                <span key={i} style={{ display: "inline-block", animation: `xpWordUp 0.7s ${EASE} ${i * 60}ms both`, marginRight: "0.25em" }}>{word}</span>
              ))}
            </h2>
            <p style={{ fontSize: 17, color: "var(--ew-text-body)", lineHeight: 1.7, margin: 0 }}>
              Before any content reaches you, a hostile reader runs through it. Looking for AI patterns, assembled phrases, anything that doesn't sound like a human made a real decision. If it fails, it doesn't ship. Not once. Not ever. AI slop is everywhere. This is the only standard that keeps your name off it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 8: TESTIMONIAL (Off-white)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="light" style={{ background: "var(--ew-offwhite)", padding: isMobile ? "80px 0" : "120px 0" }}>
        <div className="xp-inner" style={{ maxWidth: 720, textAlign: "center" }}>
          <Reveal>
            <blockquote style={{ borderLeft: "3px solid var(--ew-blue)", paddingLeft: 24, textAlign: "left", margin: "0 auto", maxWidth: 560 }}>
              <p style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.3, color: "var(--ew-text-dark)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
                "Better than what I was writing myself."
              </p>
              <p style={{ fontSize: 15, color: "var(--ew-text-body)", lineHeight: 1.6, margin: "0 0 12px" }}>
                Doug C. had a decade of thinking that never made it out. Now it does, in his voice.
              </p>
              <cite style={{ fontSize: 13, fontWeight: 600, color: "var(--ew-text-dark)", fontStyle: "normal" }}>Doug C., Executive Coach</cite>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 9: CLOSING CTA (Dark navy)
         ══════════════════════════════════════════════════════════════════════ */}
      <section data-nav-theme="dark" style={{ background: "var(--ew-navy)", padding: isMobile ? "80px 0" : "120px 0", color: "var(--ew-text-light)" }}>
        <div className="xp-inner" style={{ textAlign: "center", maxWidth: 640 }}>
          <Reveal>
            <p style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 200, lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 8px", color: "var(--ew-text-light-dim)" }}>Most AI writes for you.</p>
            <p style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 40px", color: "var(--ew-white)" }}>EVERYWHERE works for you.</p>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: 17, color: "var(--ew-text-light-dim)", lineHeight: 1.7, margin: "0 0 16px" }}>
              You don't need more discipline. You need a system that carries the idea from your head to your audience, every week, without it sitting on your to-do list.
            </p>
            <p style={{ fontSize: 17, color: "var(--ew-text-light-dim)", lineHeight: 1.7, margin: "0 0 16px" }}>
              The output is yours because the input was yours.
            </p>
            <p style={{ fontSize: 17, color: "var(--ew-text-light-dim)", lineHeight: 1.7, margin: "0 0 48px" }}>
              There's a mountain between the idea and the audience. EVERYWHERE Studio carries the mountain.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 40 }}>
              <div style={{ position: "absolute", inset: -8, borderRadius: 100, border: "1px solid var(--ew-gold)", animation: "xpSonarPing 3s ease-out infinite", pointerEvents: "none" }} />
              <button className="xp-btn-gold" onClick={() => navigate("/auth?mode=signup")} style={{ borderRadius: 100, padding: "16px 48px" }}>Get Early Access</button>
            </div>
            <p style={{ fontSize: 14, color: "var(--ew-text-light-dim)", margin: 0 }}>
              <a href="mailto:mark@coastalintelligence.ai" style={{ color: "var(--ew-text-light-dim)", textDecoration: "none", borderBottom: "1px solid transparent", transition: "border-color 0.3s ease" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "var(--ew-gold)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "transparent"; }}
              >mark@coastalintelligence.ai</a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ width: "100%", overflow: "hidden", padding: "40px 0", background: "var(--ew-offwhite)", pointerEvents: "none", userSelect: "none" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "xpMarquee 40s linear infinite" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", fontSize: "clamp(80px, 12vw, 200px)", fontFamily: "var(--font)", textTransform: "uppercase" as const, letterSpacing: "-0.02em", flexShrink: 0, marginRight: "0.5em" }}>
              <span style={{ fontWeight: 800, color: "rgba(0,0,0,0.04)" }}>EVERYWHERE</span>
              <span style={{ color: "rgba(245,198,66,0.08)", fontSize: "0.35em", margin: "0 0.15em", display: "inline-flex", alignItems: "center" }}>&#9679;</span>
              <span style={{ fontWeight: 300, color: "rgba(0,0,0,0.04)" }}>STUDIO</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--ew-offwhite)", borderTop: "1px solid var(--ew-border-light)" }}>
        <div className="xp-footer">
          <Logo size="sm" variant="light" />
          <span style={{ color: "#AAAAAA", fontSize: 11 }}>&copy; 2026 Mixed Grill, LLC</span>
        </div>
      </footer>
    </div>
  );
}
