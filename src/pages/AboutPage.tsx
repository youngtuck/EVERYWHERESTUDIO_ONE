import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MARKETING_CSS, EASE } from "../styles/marketing";
import MarketingNav from "../components/marketing/MarketingNav";
import MarketingFooter from "../components/marketing/MarketingFooter";
import Reveal from "../components/marketing/Reveal";

export default function AboutPage() {
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
          }}>About</div>
          <h1 style={{
            fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 600,
            letterSpacing: "-0.04em", lineHeight: 1.08,
            color: "var(--xp-on-dark)", marginBottom: 24,
            animation: `xpHeroHead 1s ${EASE} 0.6s both`,
          }}>Why EVERYWHERE Studio Exists</h1>
        </div>
      </section>

      {/* Mark's Story */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "120px 48px", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div className="xp-glass-card" style={{ padding: "48px 40px", marginBottom: 48 }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--xp-text)", marginBottom: 4 }}>Mark Sylvester</div>
              <div className="xp-mono" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--xp-ter)", marginBottom: 20 }}>Founder, Mixed Grill</div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", margin: 0 }}>
                Mark Sylvester has spent 30 years building at the intersection of strategy and communication. Author, speaker, advisor. He built EVERYWHERE Studio because he needed it.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
              It started with a Substack and a problem I could not solve.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
              I had the ideas. I had the strategy. I had the audience. What I did not have was a system that could keep up with the pace of my thinking.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", marginBottom: 24 }}>
              I tried the tools. All of them. They were fast but shallow. They generated words, not thinking. I needed something that would think with me, not for me.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-text)", fontWeight: 500 }}>
              So I built it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The Infrastructure */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "120px 48px", background: "var(--xp-off)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              The problem was not a lack of ideas. It was a lack of infrastructure.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
              The gap between thinking and publishing is not a creativity problem. It is a systems problem. Strategy without execution is just theory. Execution without quality is just noise. EVERYWHERE Studio closes both gaps.
            </p>
          </Reveal>
        </div>
      </section>

      {/* A New Category */}
      <section data-nav-theme="dark" className="xp-sect" style={{
        padding: "120px 48px", background: "var(--xp-navy-deep)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--xp-on-dark)", marginBottom: 24 }}>
              Structured Intelligence.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-dim-dark)", marginBottom: 24 }}>
              EVERYWHERE Studio is not an AI writing tool. It is not a content management system. It is not a prompt library. It is a new category: Structured Intelligence. A system that combines strategic analysis, voice capture, quality enforcement, and multi-format publishing into a single workflow.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-dim-dark)" }}>
              Forty specialists work in concert. Seven quality checkpoints block anything that is not ready. Your VoiceDNA profile ensures that every piece sounds like you. The result is not generated content. It is your thinking, structured and scaled.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Your Data */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "120px 48px", background: "var(--xp-white)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              Your Thinking Stays Yours.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
              Your content, your voice profile, your strategic data. None of it is used to train models. None of it is shared. None of it leaves your account. EVERYWHERE Studio is built on the principle that your intellectual property belongs to you. Period.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The Company */}
      <section data-nav-theme="light" className="xp-sect" style={{ padding: "120px 48px", background: "var(--xp-off)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24 }}>
              Mixed Grill, LLC
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--xp-sec)", marginBottom: 24 }}>
              EVERYWHERE Studio is a product of Mixed Grill, LLC, based in Santa Barbara, California. Mixed Grill builds tools for practitioners who think deeply and communicate strategically. EVERYWHERE Studio is the flagship product.
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
