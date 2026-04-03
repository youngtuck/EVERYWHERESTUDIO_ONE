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
  scroll-behavior: smooth;
}

/* em inherits section context: gold on dark, blue on light */
.xp em { font-style: normal; }
.xp a { color: inherit; text-decoration: none; }
.xp button, .xp a { cursor: pointer; }

/* Text selection: dark surface */
.xp ::selection { background: rgba(245,198,66,0.3); color: white; }
/* Light surface selection overrides */
[data-nav-theme="light"] ::selection { background: rgba(74,144,217,0.2); color: #111; }

/* Active press feedback on buttons */
.xp button:active, .xp a:active { transform: scale(0.98) !important; transition-duration: 0.1s !important; }

/* Section gradient transitions via pseudo-elements */
.xp-grad-top-dark {
  position: relative;
}
.xp-grad-top-dark::before {
  content: '';
  position: absolute;
  top: -120px;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(180deg, var(--ew-white) 0%, var(--ew-navy-rich) 100%);
  pointer-events: none;
}
.xp-grad-top-navy {
  position: relative;
}
.xp-grad-top-navy::before {
  content: '';
  position: absolute;
  top: -120px;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(180deg, var(--ew-offwhite) 0%, var(--ew-navy) 100%);
  pointer-events: none;
}
.xp-grad-top-cta {
  position: relative;
}
.xp-grad-top-cta::before {
  content: '';
  position: absolute;
  top: -120px;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(180deg, var(--ew-white) 0%, var(--ew-navy) 100%);
  pointer-events: none;
}

/* Watson widget: showcase, not link */
.xp-watson-widget { cursor: default; }

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

// ── Watch. Work. Wrap. sticky scroll section ────────────────────────────────
const WWW_ROOMS = [
  { name: "Watch", body: "You arrive knowing what your audience is already thinking. Your ideas land in context, not into noise." },
  { name: "Work", body: "Your idea becomes publication-ready content. In your voice. Verified. Zero AI fingerprints. Nothing ships until it reads like a human made every decision." },
  { name: "Wrap", body: "One idea. Every channel. Simultaneously. Newsletter, LinkedIn, podcast, Substack, formatted for each, ready to publish." },
];

function WatchWorkWrapSection({ howRef, isMobile }: { howRef: React.RefObject<HTMLDivElement | null>; isMobile: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useElementScroll(sectionRef as React.RefObject<HTMLElement>);
  // Map 0-1 progress to active index (0, 1, 2)
  const activeIdx = Math.min(2, Math.floor(progress * 3));

  if (isMobile) {
    return (
      <section ref={howRef} data-nav-theme="dark" style={{ padding: "80px 0 120px", background: "var(--ew-navy)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--ew-gold)", marginBottom: 16 }}>
                Three rooms. One idea.
              </div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.02em", margin: 0, color: "var(--ew-white)" }}>
                Watch. Work. Wrap.
              </h2>
            </div>
          </Reveal>
          {WWW_ROOMS.map((room, i) => (
            <Reveal key={room.name} delay={i * 120}>
              <div style={{ padding: "32px 0", borderTop: i > 0 ? "1px solid var(--ew-border-dark)" : "none" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ew-gold)", marginBottom: 12 }}>{room.name}</div>
                <p style={{ fontSize: 15, color: "var(--ew-text-light-dim)", lineHeight: 1.7, margin: 0 }}>{room.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section data-nav-theme="dark" ref={(el) => { (sectionRef as any).current = el; if (howRef && "current" in howRef) (howRef as any).current = el; }} style={{ minHeight: "300vh", background: "var(--ew-navy)", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px", display: "flex", width: "100%", gap: 80 }}>
          {/* Left: Room names */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, flexShrink: 0, width: 280, justifyContent: "center" }}>
            {/* Section label above names */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--ew-gold)", marginBottom: 12 }}>
                Three rooms. One idea.
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, color: "var(--ew-white)" }}>
                Watch. Work. Wrap.
              </h2>
            </div>
            {WWW_ROOMS.map((room, i) => {
              const isActive = i === activeIdx;
              return (
                <div
                  key={room.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "default",
                    transition: `transform 0.2s ${EASE}, color 0.3s ${EASE}`,
                    transform: isActive ? "translateX(0)" : "translateX(0)",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateX(4px)";
                      (e.currentTarget.querySelector("[data-www-name]") as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateX(0)";
                    if (!isActive) {
                      (e.currentTarget.querySelector("[data-www-name]") as HTMLElement).style.color = "var(--ew-text-light-dim)";
                    }
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: isActive ? "var(--ew-gold)" : "transparent",
                    transition: `background 0.3s ${EASE}`,
                    flexShrink: 0,
                  }} />
                  <div
                    data-www-name=""
                    style={{
                      fontSize: "clamp(28px, 4vw, 48px)",
                      fontWeight: 700,
                      color: isActive ? "var(--ew-gold)" : "var(--ew-text-light-dim)",
                      textShadow: isActive ? "0 0 40px rgba(245,198,66,0.15)" : "none",
                      transition: `color 0.3s ${EASE}, text-shadow 0.3s ${EASE}`,
                      lineHeight: 1.1,
                    }}
                  >
                    {room.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Sticky body text with cross-fade */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative", minHeight: 200 }}>
            {WWW_ROOMS.map((room, i) => (
              <p
                key={room.name}
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  top: i === 0 ? undefined : 0,
                  left: 0,
                  right: 0,
                  maxWidth: 440,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "var(--ew-text-light-dim)",
                  margin: 0,
                  opacity: i === activeIdx ? 1 : 0,
                  transform: i === activeIdx ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.5s ${EASE}, transform 0.5s ${EASE}`,
                  pointerEvents: i === activeIdx ? "auto" : "none",
                }}
              >
                {room.body}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const howRef = useRef<HTMLDivElement>(null);
  const standardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroParallax, setHeroParallax] = useState({ y: 0, opacity: 1 });
  const [navScrolled, setNavScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const scrollProgress = useScrollProgress();

  // Page load entrance
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Hero parallax + nav scroll state
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

  // Nav theme detection: observe which section is behind the nav
  useEffect(() => {
    const sections = document.querySelectorAll("[data-nav-theme]");
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const theme = (entry.target as HTMLElement).dataset.navTheme as "dark" | "light";
            if (theme) setNavTheme(theme);
          }
        }
      },
      { rootMargin: "-1px 0px -95% 0px", threshold: 0 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sectionPad = isMobile ? "64px 0" : "120px 0";

  return (
    <div className="xp" style={{
      opacity: pageLoaded ? 1 : 0,
      transition: `opacity 0.4s ${EASE}`,
    }}>
      <style>{CSS}</style>

      {/* Scroll progress indicator */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2,
        width: `${scrollProgress * 100}%`,
        background: navTheme === "dark" ? "var(--ew-gold)" : "var(--ew-blue)",
        zIndex: 9999,
        transition: "background 0.4s ease",
        pointerEvents: "none",
      }} />

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
        <Logo
          size="sm"
          variant={navTheme === "dark" ? "dark" : "light"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {!isMobile && (
            <>
              {[
                { label: "How It Works", action: () => scrollTo(howRef) },
                { label: "Quality", action: () => scrollTo(standardRef) },
                { label: "Sign In", action: () => navigate("/auth") },
              ].map(link => (
                <button
                  key={link.label}
                  onClick={link.action}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: navTheme === "dark" ? "rgba(255,255,255,0.7)" : "var(--ew-text-body)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    padding: "4px 0",
                    position: "relative",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = navTheme === "dark" ? "var(--ew-white)" : "var(--ew-text-dark)";
                    const dot = e.currentTarget.querySelector("[data-nav-dot]") as HTMLElement;
                    if (dot) { dot.style.opacity = "1"; dot.style.transform = "translateX(-50%) translateY(-2px)"; }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = navTheme === "dark" ? "rgba(255,255,255,0.7)" : "var(--ew-text-body)";
                    const dot = e.currentTarget.querySelector("[data-nav-dot]") as HTMLElement;
                    if (dot) { dot.style.opacity = "0"; dot.style.transform = "translateX(-50%) translateY(0)"; }
                  }}
                >
                  {link.label}
                  <span data-nav-dot="" style={{
                    position: "absolute",
                    bottom: -4,
                    left: "50%",
                    transform: "translateX(-50%) translateY(0)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--ew-gold)",
                    opacity: 0,
                    transition: `opacity 0.2s ${EASE}, transform 0.2s ${EASE}`,
                  }} />
                </button>
              ))}
            </>
          )}
          {!isMobile && (
            <a
              href={CTA_MAILTO}
              style={{
                padding: "8px 22px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                fontFamily: "var(--font)",
                textDecoration: "none",
                borderRadius: 100,
                transition: `all 0.4s ease`,
                ...(navTheme === "dark"
                  ? { border: "1px solid rgba(255,255,255,0.2)", color: "var(--ew-white)", background: "transparent" }
                  : { border: "none", color: "var(--ew-white)", background: "var(--ew-text-dark)" }
                ),
              }}
            >
              Let's Talk
            </a>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: "block", width: 20, height: 2, background: navTheme === "dark" ? "var(--ew-white)" : "var(--ew-text-dark)", borderRadius: 1 }} />
              ))}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--ew-navy)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 32,
        }}>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "absolute", top: 16, right: 20,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 28, color: "var(--ew-gold)", fontFamily: "var(--font)", fontWeight: 300,
            }}
          >
            &times;
          </button>
          {[
            { label: "How It Works", action: () => { setMobileMenuOpen(false); scrollTo(howRef); } },
            { label: "Quality", action: () => { setMobileMenuOpen(false); scrollTo(standardRef); } },
            { label: "Sign In", action: () => { setMobileMenuOpen(false); navigate("/auth"); } },
            { label: "Let's Talk", action: () => { setMobileMenuOpen(false); window.location.href = CTA_MAILTO; } },
          ].map((link, i) => (
            <button
              key={link.label}
              onClick={link.action}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 24, fontWeight: 600, color: "var(--ew-white)",
                fontFamily: "var(--font)", letterSpacing: "0.04em",
                animation: `xpSlideInRight 0.5s ${EASE} ${i * 80}ms both`,
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes xpSlideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ── SECTION 01: HERO (Dark Navy, atmospheric) ─────────── */}
      <section
        ref={heroRef}
        data-nav-theme="dark"
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
      <section data-nav-theme="light" style={{ padding: "140px 0", background: "var(--ew-white)" }}>
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
      <section className="xp-grad-top-dark" data-nav-theme="dark" style={{ padding: "0 0 120px", background: "var(--ew-navy-rich)", marginTop: 120 }}>
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
              className="xp-watson-widget"
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
      <section data-nav-theme="light" style={{ padding: sectionPad, background: "var(--ew-offwhite)" }}>
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
      <section data-nav-theme="light" style={{ padding: "100px 0", background: "var(--ew-offwhite)" }}>
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
      <div className="xp-grad-top-navy" style={{ marginTop: 120 }}>
        <WatchWorkWrapSection howRef={howRef} isMobile={isMobile} />
      </div>

      {/* ── SECTION 07: QUALITY STANDARD (Light: #FFFFFF, blue accent) */}
      <section ref={standardRef} data-nav-theme="light" style={{ padding: "140px 0", background: "var(--ew-white)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ marginLeft: isMobile ? 0 : "clamp(40px, 12vw, 160px)", maxWidth: 680 }}>
            <Reveal direction="up" distance={20}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--ew-blue)", marginBottom: 20 }}>
                Quality Standard
              </div>
            </Reveal>
            <Reveal direction="none">
              <h2 style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 28px",
                color: "var(--ew-text-dark)",
              }}>
                {"Nothing ships unless it would fool a skeptic.".split(" ").map((word, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      animation: `xpWordUp 0.6s ${EASE} ${i * 60}ms both`,
                      marginRight: "0.25em",
                    }}
                  >
                    {word}
                  </span>
                ))}
              </h2>
            </Reveal>
            <Reveal direction="up" distance={20} delay={600}>
              <p style={{ color: "var(--ew-text-body)", maxWidth: 520, fontSize: 16, lineHeight: 1.7 }}>
                Before any content reaches you, a hostile reader runs through it. Looking for AI patterns, assembled phrases, anything that doesn't sound like a human made a real decision. If it fails, it doesn't ship. Not once. Not ever. AI slop is everywhere. This is the only standard that keeps your name off it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 08+09: CLOSING CTA (Dark: #0D1B2A, gold accent) ── */}
      <section className="xp-grad-top-cta" data-nav-theme="dark" style={{ padding: "160px 0", background: "var(--ew-navy)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", marginTop: 120 }}>
        <div style={{ textAlign: "center", maxWidth: 800, padding: "0 32px" }}>
          {/* Anchor statement */}
          <Reveal>
            <p style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 400,
              color: "var(--ew-text-light-dim)",
              margin: "0 0 8px",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}>
              Most AI writes for you.
            </p>
          </Reveal>
          <Reveal delay={300} direction="scale" distance={0}>
            <p style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              margin: "0 0 48px",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}>
              <span style={{ color: "var(--ew-gold)" }}>EVERYWHERE</span>{" "}
              <span style={{ color: "var(--ew-white)" }}>works for you.</span>
            </p>
          </Reveal>

          {/* Supporting copy */}
          <Reveal delay={500}>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center", fontSize: 16, lineHeight: 1.7 }}>
              You don't need more discipline. You need a system that carries the idea from your head to your audience, every week, without it sitting on your to-do list.
            </p>
            <p style={{ color: "var(--ew-text-light-dim)", maxWidth: 560, margin: "0 auto 12px", textAlign: "center", fontSize: 16, lineHeight: 1.7 }}>
              The output is yours because the input was yours.
            </p>
            <p style={{ color: "var(--ew-gold)", maxWidth: 560, margin: "0 auto 56px", textAlign: "center", fontWeight: 500, fontSize: 16, lineHeight: 1.7 }}>
              There's a mountain between the idea and the audience. EVERYWHERE Studio carries the mountain.
            </p>
          </Reveal>

          {/* CTA with pulse ring */}
          <Reveal delay={700} direction="up" distance={20}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 32 }}>
              {/* Sonar pulse ring */}
              <div style={{
                position: "absolute",
                inset: -8,
                borderRadius: 100,
                border: "1px solid var(--ew-gold)",
                animation: "xpSonarPing 3s ease-out infinite",
                pointerEvents: "none",
              }} />
              <button
                onClick={() => navigate("/auth?mode=signup")}
                style={{
                  background: "var(--ew-gold)",
                  color: "var(--ew-navy)",
                  border: "none",
                  borderRadius: 100,
                  padding: "18px 44px",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  fontFamily: "var(--font)",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 1,
                  transition: `transform 0.35s ${EASE}, box-shadow 0.35s ${EASE}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(245,198,66,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                Get Early Access
              </button>
            </div>
            <div>
              <a
                href="mailto:mark@coastalintelligence.ai"
                style={{
                  color: "var(--ew-text-light-dim)",
                  fontSize: 13,
                  textDecoration: "none",
                  fontFamily: "var(--font)",
                  display: "inline-block",
                  position: "relative",
                  paddingBottom: 2,
                }}
                onMouseEnter={e => {
                  const underline = e.currentTarget.querySelector("[data-underline]") as HTMLElement;
                  if (underline) underline.style.width = "100%";
                }}
                onMouseLeave={e => {
                  const underline = e.currentTarget.querySelector("[data-underline]") as HTMLElement;
                  if (underline) underline.style.width = "0";
                }}
              >
                mark@coastalintelligence.ai
                <span data-underline="" style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 1,
                  width: 0,
                  background: "var(--ew-text-light-dim)",
                  transition: `width 0.3s ${EASE}`,
                }} />
              </a>
            </div>
          </Reveal>
        </div>

        <style>{`
          @keyframes xpSonarPing {
            0% { transform: scale(1); opacity: 0.1; }
            70% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </section>

      {/* ── WATERMARK + FOOTER (Light: #F7F9FC) ─────────────── */}
      <div style={{ background: "var(--ew-offwhite)", overflow: "hidden", padding: "60px 0 0" }}>
        <Reveal direction="up" distance={20} duration={1200}>
          <div style={{
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
            marginBottom: -20,
          }}>
            <span style={{
              fontSize: "clamp(120px, 18vw, 280px)",
              fontWeight: 800,
              fontFamily: "var(--font)",
              color: "rgba(0,0,0,0.03)",
              textTransform: "uppercase" as const,
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
            }}>
              EVERYWHERE
            </span>
          </div>
        </Reveal>
      </div>
      <footer style={{ background: "var(--ew-offwhite)", borderTop: "1px solid var(--ew-border-light)" }}>
        <div className="xp-footer">
          <Logo size="sm" variant="light" />
          <span style={{ color: "#AAAAAA", fontSize: 11 }}>&copy; 2026 Mixed Grill, LLC</span>
        </div>
      </footer>
    </div>
  );
}
