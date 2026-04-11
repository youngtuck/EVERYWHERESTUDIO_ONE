import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MARKETING_CSS, EASE } from "../styles/marketing";
import MarketingNav from "../components/marketing/MarketingNav";
import MarketingFooter from "../components/marketing/MarketingFooter";
import Reveal from "../components/marketing/Reveal";

const CHECKPOINTS = [
  { num: 1, name: "Deduplication", desc: "No repeated content." },
  { num: 2, name: "Research Validation", desc: "Every claim verified." },
  { num: 3, name: "Voice Authenticity", desc: "Sounds like you wrote it." },
  { num: 4, name: "Engagement", desc: "Passes the 7-second test." },
  { num: 5, name: "SLOP Detection", desc: "No AI padding. No filler. No fluff." },
  { num: 6, name: "Editorial Excellence", desc: "Publication grade. No exceptions." },
  { num: 7, name: "Perspective and Risk", desc: "No blind spots." },
];

export default function HowItWorksPage() {
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
        padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800 }}>
          <div className="xp-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--xp-dim-dark)", marginBottom: 28,
            animation: `xpHeroLabel 0.8s ${EASE} 0.3s both`,
          }}>The System</div>
          <h1 style={{
            fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 600,
            letterSpacing: "-0.04em", lineHeight: 1.08,
            color: "var(--xp-on-dark)", marginBottom: 24,
            animation: `xpHeroHead 1s ${EASE} 0.6s both`,
          }}>EVERYWHERE Studio runs on one sequence. Every session follows the same path.</h1>
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)",
            maxWidth: 500, margin: "0 auto",
            animation: `xpHeroSub 0.8s ${EASE} 0.9s both`,
          }}>WATCH. WORK. WRAP.</p>
        </div>
      </section>

      {/* Phase One: Watch */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase One</div>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              Watch. Intelligence before execution.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="xp-glass-card" style={{ padding: "32px 36px", marginTop: 32 }}>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
                Before a single word gets written, you know what's moving in your category. What the market is saying. Where the opportunity sits.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
                EVERYWHERE monitors your competitive landscape overnight. By the time you arrive, the briefing is ready. Signals are ranked by impact. Opportunities are scored. Content angles are mapped to the Work pipeline.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", fontWeight: 500 }}>
                You don't start the day catching up. You start ahead.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Phase Two: Work */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-off)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase Two</div>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              Work. One idea. All the way through.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="xp-glass-card" style={{ padding: "32px 36px", marginTop: 32 }}>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
                Work has four stages: Intake, Outline, Edit, Review.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
                Your first listener opens every session with one question: What are we working on? The interview draws out what you actually mean to say. Not the surface version. The real one. The brief gets built. The structure follows. The draft gets written.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", fontWeight: 500 }}>
                Then the quality system runs. Seven checkpoints. Every one blocking. Voice authenticity. Research validation. SLOP detection. Editorial excellence. Perspective and risk. Nothing exits Work until it passes. Then the Impact Score. Threshold: 75. No exceptions. Then the Human Voice Test. It either passes or it doesn't. Approve only activates when everything is ready.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Phase Three: Wrap */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase Three</div>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              Wrap. Ideas become assets.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="xp-glass-card" style={{ padding: "32px 36px", marginTop: 32 }}>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
                Approved work moves to Wrap. Choose a format. Choose a channel. EVERYWHERE structures your thinking for the platform it's going to.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
                LinkedIn post. Newsletter. Presentation. Podcast script. Report. One-pager.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", fontWeight: 500 }}>
                The format changes. The thinking survives it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quality System */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-navy-deep)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--xp-on-dark)", textAlign: "center", marginBottom: 16 }}>
              Seven checkpoints. All blocking.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)", textAlign: "center", maxWidth: 500, margin: "0 auto 64px" }}>
              Nothing ships until every one clears.
            </p>
          </Reveal>

          <div className="checkpoint-grid">
            {CHECKPOINTS.map((cp, i) => (
              <Reveal key={cp.num} delay={i * 80}>
                <div className="xp-glass-card-dark" style={{ padding: 32, minHeight: 200, display: "flex", flexDirection: "column" as const }}>
                  <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--xp-gold)", marginBottom: 12 }}>{String(cp.num).padStart(2, "0")}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--xp-on-dark)", marginBottom: 10 }}>{cp.name}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--xp-dim-dark)", margin: 0 }}>{cp.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={600}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-dim-dark)", textAlign: "center", maxWidth: 600, margin: "64px auto 0" }}>
              After checkpoints: Impact Score (75 minimum). After Impact Score: Human Voice Test. Pass or rewrite. No middle ground.
            </p>
          </Reveal>
        </div>
      </section>

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

      <MarketingFooter />
    </div>
  );
}
