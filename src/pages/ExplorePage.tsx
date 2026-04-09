import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

/* ═══════════════════════════════════════════════════════════
   EVERYWHERE STUDIO — EXPLORE PAGE
   Design: Instrument Sans. White-first. One dark moment.
   CSS geometry in hero. Light-mode Reed demo.
   ═══════════════════════════════════════════════════════════ */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

// ── Hooks ──

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

// ── Reveal wrapper ──

function Reveal({
  children, delay = 0, threshold = 0.12,
  style,
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
      transform: isVisible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.9s ${EASE} ${delay}ms, transform 0.9s ${EASE} ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── CSS ──

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

:root {
  --xp-navy: #0C1A29;
  --xp-gold: #C8A96E;
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
@keyframes xpUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
@keyframes xpFade { from{opacity:0;} to{opacity:1;} }
@keyframes xpLine { from{width:0;opacity:0;} to{width:64px;opacity:1;} }
@keyframes xpSpin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
@keyframes xpSpinR { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(-360deg);} }
@keyframes xpDot { 0%,100%{opacity:.25;} 50%{opacity:1;} }
@keyframes xpGlow { 0%,100%{opacity:.03;} 50%{opacity:.07;} }
@keyframes xpScrollPulse { 0%,100%{transform:translateX(-50%) translateY(0);opacity:.5;} 50%{transform:translateX(-50%) translateY(8px);opacity:.9;} }
@keyframes xpSlideIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }

/* Hero staggered entries */
.xp-h-label { animation: xpUp .8s var(--xp-ease) .4s both; }
.xp-h-head  { animation: xpUp 1s var(--xp-ease) .7s both; }
.xp-h-rule  { animation: xpLine 1.2s var(--xp-ease) 1.3s both; }
.xp-h-sub   { animation: xpUp .8s var(--xp-ease) 1.5s both; }
.xp-h-cta   { animation: xpUp .7s var(--xp-ease) 1.8s both; }

/* Pulse dots for composing */
.xp-dots span {
  display:inline-block;width:5px;height:5px;border-radius:50%;
  background:var(--xp-gold);animation:xpDot 1.2s infinite;
}
.xp-dots span:nth-child(2){animation-delay:.2s;}
.xp-dots span:nth-child(3){animation-delay:.4s;}

/* Nav */
.xp-nav {
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 48px;height:56px;
  transition:all .5s var(--xp-ease);
}
.xp-nav-dark { background:transparent; }
.xp-nav-light {
  background:rgba(255,255,255,.9);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--xp-border);
}
.xp-nav-link {
  font-size:13px;font-weight:500;cursor:pointer;
  background:none;border:none;font-family:var(--xp-font);transition:opacity .2s;
}
.xp-nav-cta {
  font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  padding:9px 22px;border-radius:999px;cursor:pointer;font-family:var(--xp-font);transition:all .3s;
}

/* Buttons */
.xp-btn {
  display:inline-flex;align-items:center;gap:8px;
  padding:15px 34px;font-family:var(--xp-font);
  font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  border:none;border-radius:999px;cursor:pointer;
  transition:all .35s var(--xp-ease);
}
.xp-btn-w { background:var(--xp-white);color:var(--xp-navy); }
.xp-btn-w:hover { background:var(--xp-gold); }
.xp-btn-n { background:var(--xp-navy);color:var(--xp-white); }
.xp-btn-n:hover { background:#15283d; }

/* Responsive */
@media(max-width:900px){
  .xp-nav{padding:0 24px;}
  .xp-nav-links-desktop{display:none !important;}
  .xp-3col{grid-template-columns:1fr !important;}
  .xp-3col>div+div{border-left:none !important;border-top:1px solid var(--xp-border);padding-top:40px !important;padding-left:0 !important;}
  .xp-3col>div:first-child{padding-right:0 !important;}
  .xp-3col>div:last-child{padding-right:0 !important;}
  .xp-reed-side{display:none !important;}
  .xp-reed-met{display:none !important;}
  .xp-stats-row{flex-direction:column !important;}
  .xp-stats-row>div+div{border-left:none !important;border-top:1px solid var(--xp-border);padding-top:32px !important;}
  .xp-gates-track{flex-wrap:wrap !important;gap:12px !important;}
  .xp-gate-line{display:none !important;}
  .xp-footer-inner{flex-direction:column !important;text-align:center !important;gap:16px !important;}
}
@media(max-width:600px){
  .xp-sect{padding-left:20px !important;padding-right:20px !important;}
}
`;

// ── Data ──

const PROBLEMS = [
  "Your team produces 200 pieces of content a month. You have no idea which 10 moved the needle.",
  "You hired specialists for strategy, brand voice, SEO, and distribution. They have never been in the same room.",
  "Your AI tools generate fast. Your audience can tell.",
  "Quality review happens after publishing. If it happens at all.",
];

const ROOMS = [
  { name: "Watch", body: "The intelligence layer. Reed monitors your industry, tracks competitor moves, surfaces opportunities, and builds the strategic foundation before creation begins." },
  { name: "Work", body: "The creation engine. 40 specialists collaborate in real time across copywriting, brand voice, SEO, design direction, and distribution strategy." },
  { name: "Wrap", body: "The quality standard. Seven gates verify every output against voice DNA, strategic alignment, factual accuracy, and audience relevance before it ships." },
];

const GATES = ["Voice", "Strategy", "Accuracy", "Audience", "Format", "Brand", "Final"];

const SPECIALIST_TAGS = ["Brand Voice", "Enterprise Copy", "SEO", "Distribution", "Analytics"];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [navScrolled, setNavScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Page load
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Scroll state
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const goSignup = useCallback(() => navigate("/auth?mode=signup"), [navigate]);
  const goSignin = useCallback(() => navigate("/auth"), [navigate]);

  return (
    <div className="xp" style={{ opacity: pageLoaded ? 1 : 0, transition: `opacity 0.4s ${EASE}` }}>
      <style>{CSS}</style>

      {/* ── Scroll progress bar ── */}
      <div style={{ position: "fixed", top: 0, left: 0, height: 2, width: `${scrollProgress * 100}%`, background: "var(--xp-gold)", zIndex: 200, transition: "width .06s linear", pointerEvents: "none" }} />

      {/* ── NAV ── */}
      <nav className={`xp-nav ${navTheme === "dark" && !navScrolled ? "xp-nav-dark" : "xp-nav-light"}`}>
        <Logo
          size="sm"
          variant={navTheme === "dark" && !navScrolled ? "dark" : "light"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {!isMobile && (
            <div className="xp-nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button className="xp-nav-link" onClick={goSignin} style={{
                color: navTheme === "dark" && !navScrolled ? "rgba(255,255,255,0.55)" : "var(--xp-sec)",
                opacity: 1,
              }}>Sign In</button>
              <button className="xp-nav-cta" onClick={goSignup} style={
                navTheme === "dark" && !navScrolled
                  ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--xp-on-dark)" }
                  : { background: "var(--xp-navy)", border: "1px solid var(--xp-navy)", color: "var(--xp-white)" }
              }>Get Early Access</button>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: "block", width: 20, height: 2, background: navTheme === "dark" && !navScrolled ? "var(--xp-on-dark)" : "var(--xp-text)", borderRadius: 1 }} />
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

      {/* ═══ HERO (Dark) ═══ */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        minHeight: "100vh", background: "var(--xp-navy)", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 48px", overflow: "hidden",
      }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: "120%", height: "120%", transform: "translate(-50%,-50%)",
          background: "radial-gradient(ellipse at 50% 45%, rgba(200,169,110,0.04) 0%, transparent 60%)",
          animation: "xpGlow 8s ease-in-out infinite", pointerEvents: "none",
        }} />

        {/* Geometric rings */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 320, height: 320, borderRadius: "50%", border: "0.5px solid rgba(200,169,110,0.055)", animation: "xpSpin 80s linear infinite" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 520, height: 520, borderRadius: "50%", border: "0.5px solid rgba(255,255,255,0.035)", animation: "xpSpinR 140s linear infinite" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 740, height: 740, borderRadius: "50%", border: "0.5px solid rgba(255,255,255,0.025)", animation: "xpSpin 200s linear infinite" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="xp-mono xp-h-label" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--xp-dim-dark)", marginBottom: 28 }}>
            {MARKETING_NUMBERS.specialistCount} Specialists. {MARKETING_NUMBERS.qualityCheckpoints} Gates. One Intelligence.
          </div>
          <h1 className="xp-h-head" style={{ fontSize: "clamp(52px, 8.5vw, 100px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.02, color: "var(--xp-on-dark)", marginBottom: 24 }}>
            Composed<br />Intelligence
          </h1>
          <div className="xp-h-rule" style={{ height: 1, background: "var(--xp-gold)", marginBottom: 28 }} />
          <p className="xp-h-sub" style={{ fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)", maxWidth: 400, marginBottom: 44 }}>
            Content that performs. Quality that scales.<br />Intelligence that compounds.
          </p>
          <div className="xp-h-cta">
            <button className="xp-btn xp-btn-w" onClick={goSignup}>Get Early Access</button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "xpScrollPulse 2s ease-in-out infinite" }}>
          <div style={{ width: 2, height: 24, background: "var(--xp-gold)", borderRadius: 1 }} />
        </div>
      </section>

      {/* ═══ PROBLEM (White) ═══ */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "140px 48px", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>01 / The Problem</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12, maxWidth: 640, marginBottom: 56 }}>
              Content teams are drowning in tools.{" "}
              <span style={{ color: "var(--xp-ter)" }}>Starving for strategy.</span>
            </h2>
          </Reveal>
          {PROBLEMS.map((txt, i) => (
            <Reveal key={i} delay={100 + i * 100}>
              <div style={{
                padding: "28px 0",
                borderTop: i === 0 ? "1px solid var(--xp-border)" : "none",
                borderBottom: "1px solid var(--xp-border)",
                display: "flex", gap: 24, alignItems: "baseline",
              }}>
                <span className="xp-mono" style={{ fontSize: 12, color: "var(--xp-gold)", letterSpacing: "0.06em", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.5, margin: 0 }}>{txt}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ REED DEMO (Light mode) ═══ */}
      <ReedSection isMobile={isMobile} />

      {/* ═══ STATS ═══ */}
      <StatsSection isMobile={isMobile} />

      {/* ═══ WATCH. WORK. WRAP. ═══ */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "140px 48px", background: "var(--xp-off)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>03 / The System</div>
            <h2 style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.08, marginBottom: 64 }}>Watch. Work. Wrap.</h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="xp-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {ROOMS.map((rm, i) => (
                <div key={rm.name} style={{
                  padding: i === 0 ? "0 40px 0 0" : i === 2 ? "0 0 0 40px" : "0 40px",
                  borderLeft: i > 0 ? "1px solid var(--xp-border)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ height: 1, width: 28, background: "var(--xp-gold)" }} />
                    <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{rm.name}</h3>
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--xp-sec)", margin: 0 }}>{rm.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ QUALITY GATES ═══ */}
      <QualitySection />

      {/* ═══ CTA (Dark bookend) ═══ */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "160px 48px", background: "var(--xp-navy)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 500, borderRadius: "50%", border: "0.5px solid rgba(200,169,110,0.04)", animation: "xpSpin 120s linear infinite", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--xp-dim-dark)", marginBottom: 32 }}>Everywhere Studio</div>
              <h2 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.1, color: "var(--xp-on-dark)", maxWidth: 560, marginBottom: 24 }}>
                Your content deserves<br />composed intelligence.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--xp-dim-dark)", maxWidth: 380, marginBottom: 44 }}>
                Join the teams replacing content chaos with a system that compounds.
              </p>
              <button className="xp-btn xp-btn-w" onClick={goSignup} style={{ marginBottom: 28 }}>Get Early Access</button>
              <a href="mailto:mark@coastalintelligence.ai" className="xp-mono" style={{ fontSize: 12, color: "var(--xp-dim-dark)", textDecoration: "none" }}>
                mark@coastalintelligence.ai
              </a>
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
// REED SECTION — Light mode product mockup
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
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{ padding: "140px 48px", background: "var(--xp-off)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>02 / Meet Reed</div>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 600, marginBottom: 16 }}>
            Intelligence that thinks<br />before it writes.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", maxWidth: 520, marginBottom: 56 }}>
            Reed coordinates {MARKETING_NUMBERS.specialistCount} specialists across research, strategy, voice calibration, and quality review before a single word reaches your audience.
          </p>
        </Reveal>

        {/* Light-mode interface mockup */}
        <Reveal delay={200}>
          <div style={{
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.06), 0 0 0 1px var(--xp-border)",
            background: "var(--xp-white)",
          }}>
            {/* Title bar */}
            <div style={{
              display: "flex", alignItems: "center", padding: "11px 18px",
              background: "var(--xp-off)", borderBottom: "1px solid var(--xp-border)",
            }}>
              <div style={{ display: "flex", gap: 7 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
              </div>
              <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--xp-ter)", fontWeight: 500 }}>Everywhere Studio</div>
              <div style={{ width: 48 }} />
            </div>

            <div style={{ display: "flex", minHeight: isMobile ? 360 : 420 }}>
              {/* Sidebar */}
              <div className="xp-reed-side" style={{
                width: 172, background: "var(--xp-off)",
                borderRight: "1px solid var(--xp-border)",
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
              <div style={{ flex: 1, background: "var(--xp-white)", padding: "24px 28px", display: "flex", flexDirection: "column" }}>
                <div className="xp-mono" style={{ fontSize: 10, color: "var(--xp-ter)", textAlign: "center", marginBottom: 20 }}>Today at 10:42 AM</div>

                {/* User message */}
                <div style={{
                  opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(8px)",
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
                  opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(8px)",
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
                width: 192, background: "var(--xp-off)",
                borderLeft: "1px solid var(--xp-border)",
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
        </Reveal>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════
// STATS — Count up
// ═══════════════════════════════════════════

function StatsSection({ isMobile }: { isMobile: boolean }) {
  const { ref, isVisible } = useScrollReveal(0.15);
  const a = useCountUp(MARKETING_NUMBERS.specialistCount, 1600, isVisible);
  const b = useCountUp(MARKETING_NUMBERS.outputFormatCount, 1200, isVisible);
  const c = useCountUp(MARKETING_NUMBERS.qualityCheckpoints, 900, isVisible);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{ padding: "100px 48px", background: "var(--xp-white)" }}>
      <Reveal>
        <div className="xp-stats-row" style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "center" }}>
          {[{ v: a, t: "Specialists" }, { v: b, t: "Output Formats" }, { v: c, t: "Quality Gates" }].map((s, i) => (
            <React.Fragment key={s.t}>
              {i > 0 && <div style={{ width: 1, background: "var(--xp-border)", alignSelf: "stretch" }} />}
              <div style={{ flex: 1, textAlign: "center", padding: "0 32px" }}>
                <div style={{ fontSize: "clamp(48px, 6.5vw, 76px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.v}</div>
                <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--xp-ter)", marginTop: 10 }}>{s.t}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════════
// QUALITY GATES — Sequential light-up
// ═══════════════════════════════════════════

function QualitySection() {
  const { ref, isVisible } = useScrollReveal(0.12);
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    let i = 0;
    const iv = setInterval(() => { i++; setLit(i); if (i >= 7) clearInterval(iv); }, 220);
    return () => clearInterval(iv);
  }, [isVisible]);

  return (
    <section data-nav-theme="light" className="xp-sect" ref={ref} style={{ padding: "140px 48px", background: "var(--xp-white)", textAlign: "center" }}>
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
          <div className="xp-gates-track" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {GATES.map((g, i) => {
              const on = i < lit;
              return (
                <React.Fragment key={g}>
                  {i > 0 && <div className="xp-gate-line" style={{ width: 32, height: 1, background: on ? "var(--xp-gold)" : "var(--xp-border)", transition: "background .3s ease", flexShrink: 0 }} />}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div className="xp-mono" style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: `1.5px solid ${on ? "var(--xp-gold)" : "var(--xp-border)"}`,
                      background: on ? "rgba(200,169,110,0.05)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 500,
                      color: on ? "var(--xp-gold)" : "var(--xp-ter)",
                      transition: `all .35s ${EASE}`,
                    }}>{i + 1}</div>
                    <span className="xp-mono" style={{
                      fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase",
                      color: on ? "var(--xp-gold)" : "var(--xp-ter)", transition: "color .3s ease",
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
