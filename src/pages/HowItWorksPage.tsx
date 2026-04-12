import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MARKETING_CSS, EASE } from "../styles/marketing";
import MarketingNav from "../components/marketing/MarketingNav";
import MarketingBuiltForCta from "../components/marketing/MarketingBuiltForCta";
import MarketingFooter from "../components/marketing/MarketingFooter";
import Reveal from "../components/marketing/Reveal";
import { marketingDemoClickRingKeyframes } from "../components/marketing/MarketingDemoCursor";
import { WatchDeepDemo, WorkDeepDemo, WrapDeepDemo } from "../components/marketing/HowItWorksFlowDemos";

const CHECKPOINTS = [
  { id: "dedup", name: "Deduplication", desc: "No repeated content." },
  { id: "research", name: "Research Validation", desc: "Every claim verified." },
  { id: "voice", name: "Voice Authenticity", desc: "Sounds like you wrote it." },
  { id: "engage", name: "Engagement", desc: "Passes the opening test." },
  { id: "slop", name: "SLOP Detection", desc: "No AI padding. No filler. No fluff." },
  { id: "editorial", name: "Editorial Excellence", desc: "Publication grade. No exceptions." },
  { id: "risk", name: "Perspective and Risk", desc: "No blind spots." },
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
      <style>{marketingDemoClickRingKeyframes()}</style>
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
            fontSize: "clamp(40px, 8vw, 88px)", fontWeight: 600,
            letterSpacing: "-0.04em", lineHeight: 1.06,
            color: "var(--xp-on-dark)", marginBottom: 20,
            animation: `xpHeroHead 1s ${EASE} 0.6s both`,
          }}>WATCH. WORK. WRAP.</h1>
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)",
            maxWidth: 520, margin: "0 auto",
            animation: `xpHeroSub 0.8s ${EASE} 0.9s both`,
          }}>EVERYWHERE Studio runs on one sequence. Every session follows the same path.</p>
        </div>
      </section>

      {/* Phase One: Watch */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase One</div>
            <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.06, marginBottom: 10 }}>
              WATCH.
            </h2>
            <p style={{ fontSize: "clamp(17px, 2.4vw, 22px)", lineHeight: 1.45, color: "var(--xp-sec)", fontWeight: 500, marginBottom: 24 }}>
              Intelligence before execution.
            </p>
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
          <Reveal delay={180}>
            <WatchDeepDemo animKey="hiw-watch" />
          </Reveal>
        </div>
      </section>

      {/* Phase Two: Work */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-off)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase Two</div>
            <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.06, marginBottom: 10 }}>
              WORK.
            </h2>
            <p style={{ fontSize: "clamp(17px, 2.4vw, 22px)", lineHeight: 1.45, color: "var(--xp-sec)", fontWeight: 500, marginBottom: 24 }}>
              One idea. All the way through.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="xp-glass-card" style={{ padding: "32px 36px", marginTop: 32 }}>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
                Work opens in Intake, moves through Outline and Edit, runs the blocking checkpoint pipeline, then lands in Review before you send to Wrap.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
                Your first listener opens every session with one question: What are we working on? The interview draws out what you actually mean to say. Not the surface version. The real one. The brief gets built. The structure follows. The draft gets written.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", fontWeight: 500 }}>
                Then the quality system runs. Blocking checkpoints in sequence. Voice authenticity. Research validation. SLOP detection. Editorial excellence. Perspective and risk. Nothing exits Work until it passes. Then the Impact Score. Threshold: 75. No exceptions. Then the Human Voice Test. It either passes or it doesn't. Approve only activates when everything is ready.
              </p>
            </div>
          </Reveal>
          <Reveal delay={180}>
            <WorkDeepDemo animKey="hiw-work" />
          </Reveal>
        </div>
      </section>

      {/* Phase Three: Wrap */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "var(--xp-section-pad-y) var(--xp-section-pad-x)", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--xp-ter)", marginBottom: 40 }}>Phase Three</div>
            <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.06, marginBottom: 10 }}>
              WRAP.
            </h2>
            <p style={{ fontSize: "clamp(17px, 2.4vw, 22px)", lineHeight: 1.45, color: "var(--xp-sec)", fontWeight: 500, marginBottom: 24 }}>
              Ideas become assets.
            </p>
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
          <Reveal delay={180}>
            <WrapDeepDemo animKey="hiw-wrap" />
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
              Blocking checkpoints. No bypass.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--xp-dim-dark)", textAlign: "center", maxWidth: 500, margin: "0 auto 64px" }}>
              Nothing ships until the pipeline clears.
            </p>
          </Reveal>

          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 0 }}>
            {CHECKPOINTS.map((cp, i) => (
              <Reveal key={cp.id} delay={i * 60}>
                <div
                  className="xp-glass-card-dark"
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "flex-start",
                    gap: 4,
                    borderRadius: 10,
                    marginBottom: i < CHECKPOINTS.length - 1 ? 6 : 0,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--xp-on-dark)", letterSpacing: "-0.01em" }}>{cp.name}</div>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--xp-dim-dark)", margin: 0 }}>{cp.desc}</p>
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
            <MarketingBuiltForCta onRequestAccess={goSignup} onSignIn={goSignin} />
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
