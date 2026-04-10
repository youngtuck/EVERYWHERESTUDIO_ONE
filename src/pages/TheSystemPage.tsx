import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MARKETING_CSS, EASE } from "../styles/marketing";
import MarketingNav from "../components/marketing/MarketingNav";
import MarketingFooter from "../components/marketing/MarketingFooter";
import Reveal from "../components/marketing/Reveal";

const DNA_MODULES = [
  {
    name: "VoiceDNA",
    subhead: "Your voice. Captured. Consistent.",
    body: "EVERYWHERE Studio captures how you actually think and communicate. Not a style guide. Not a tone matrix. Your real patterns, rhythms, and instincts. Every piece of content passes through your VoiceDNA profile. The result: content that sounds like you wrote it. Because, in the way that matters, you did.",
    bg: "var(--xp-white)",
  },
  {
    name: "BrandDNA",
    subhead: "Organizations have a voice too.",
    body: "BrandDNA extends voice capture to the institutional level. Company-wide style, messaging frameworks, approved terminology, strategic positioning. Teams create content that sounds like the organization, not like the individual who happened to draft it.",
    bg: "var(--xp-off)",
  },
  {
    name: "MethodDNA",
    subhead: "Built for coaching ecosystems.",
    body: "If you teach a method, a framework, or a system, MethodDNA captures the proprietary language and logic. Coaches, consultants, and educators can produce derivative content that stays faithful to their intellectual property. The methodology delivers the framework. EVERYWHERE Studio delivers the content infrastructure that makes it land.",
    bg: "var(--xp-white)",
  },
  {
    name: "LegacyDNA",
    subhead: "Your knowledge should not leave with you.",
    body: "LegacyDNA is long-term knowledge capture. For founders, executives, and domain experts who want their thinking preserved and structured for the next generation. Books, courses, institutional memory. Your ideas, organized and accessible.",
    bg: "var(--xp-off)",
  },
];

export default function TheSystemPage() {
  const navigate = useNavigate();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const t = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const goSignup = useCallback(() => navigate("/auth?mode=signup"), [navigate]);
  const goSignin = useCallback(() => navigate("/auth"), [navigate]);

  return (
    <div className="xp" style={{ opacity: pageLoaded ? 1 : 0, transition: `opacity 0.5s ${EASE}` }}>
      <style>{MARKETING_CSS}</style>
      <MarketingNav onSignin={goSignin} onSignup={goSignup} />

      {/* Hero */}
      <section data-nav-theme="dark" style={{
        minHeight: "80vh", background: "var(--xp-navy-deep)", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 48px", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800 }}>
          <div className="xp-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--xp-dim-dark)", marginBottom: 28,
            animation: `xpHeroLabel 0.8s ${EASE} 0.3s both`,
          }}>What's Inside</div>
          <h1 style={{
            fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 600,
            letterSpacing: "-0.04em", lineHeight: 1.08,
            color: "var(--xp-on-dark)", marginBottom: 24,
            animation: `xpHeroHead 1s ${EASE} 0.6s both`,
          }}>Four DNA modules. One intelligence infrastructure.</h1>
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)",
            maxWidth: 500, margin: "0 auto",
            animation: `xpHeroSub 0.8s ${EASE} 0.9s both`,
          }}>Each module is a different entry point. Each one solves a specific problem. All four run on the same system.</p>
        </div>
      </section>

      {/* DNA Module Sections */}
      {DNA_MODULES.map((mod, i) => (
        <section
          key={mod.name}
          data-nav-theme="light"
          className="xp-sect"
          style={{ padding: "120px 48px", background: mod.bg }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Reveal>
              <div className="xp-glass-card" style={{ padding: "40px 36px", maxWidth: 800, margin: "0 auto" }}>
                <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 20 }}>
                  Module {String(i + 1).padStart(2, "0")}
                </div>
                <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
                  {mod.name}
                </h2>
                <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--xp-sec)", marginBottom: 24, fontWeight: 500 }}>
                  {mod.subhead}
                </p>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", margin: 0 }}>
                  {mod.body}
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "160px 48px", background: "var(--xp-navy-deep)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.08, color: "var(--xp-on-dark)", maxWidth: 600, marginBottom: 24 }}>
                Built for one kind of person.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--xp-dim-dark)", maxWidth: 380, marginBottom: 48 }}>
                You are not a marketer. You are a practitioner with something important to say. EVERYWHERE Studio was built for you.
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

      <MarketingFooter />
    </div>
  );
}
