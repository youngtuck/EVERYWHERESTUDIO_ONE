import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

const CTA_MAILTO = "mailto:mark@mixedgrill.studio?subject=EVERYWHERE%20Studio%3A%20Let's%20Talk";

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..900;1,9..40,100..900&family=DM+Serif+Text:ital@0;1&display=swap');

:root {
  --lp-bg: #FAFAF7;
  --lp-bg2: #F3F2EE;
  --lp-fg: #1A1A1A;
  --lp-fg2: #555;
  --lp-fg3: #999;
  --lp-accent: #2C5F2D;
  --lp-accent-l: rgba(44,95,45,0.08);
  --lp-gold: #B8935A;
  --lp-gold-l: rgba(184,147,90,0.1);
  --lp-line: rgba(0,0,0,0.06);
  --lp-font: 'DM Sans', -apple-system, sans-serif;
  --lp-serif: 'DM Serif Text', Georgia, serif;
  --lp-max: 1120px;
}
.lp { background: var(--lp-bg); color: var(--lp-fg); font-family: var(--lp-font); font-size: 17px; line-height: 1.7; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
.lp a { color: inherit; text-decoration: none; }
.lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: rgba(250,250,247,0.8); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--lp-line); }
.lp-nav-links { display: flex; align-items: center; gap: 28px; }
.lp-nav-link { font-size: 13px; font-weight: 500; color: var(--lp-fg2); cursor: pointer; background: none; border: none; font-family: var(--lp-font); padding: 0; transition: color 0.2s; }
.lp-nav-link:hover { color: var(--lp-fg); }
.lp-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: var(--lp-font); cursor: pointer; transition: all 0.2s; text-decoration: none; border: none; }
.lp-btn-p { background: var(--lp-fg); color: #fff; }
.lp-btn-p:hover { opacity: 0.85; }
.lp-btn-o { background: transparent; color: var(--lp-fg); border: 1px solid var(--lp-line); }
.lp-btn-o:hover { border-color: var(--lp-fg3); }
.lp-inner { max-width: var(--lp-max); margin: 0 auto; padding: 0 40px; }
.lp-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lp-fg3); }
.lp-card { background: #fff; border: 1px solid var(--lp-line); border-radius: 16px; padding: 40px; transition: border-color 0.2s; }
.lp-card:hover { border-color: rgba(0,0,0,0.12); }
.lp-stat { font-family: var(--lp-serif); font-size: 48px; font-weight: 400; color: var(--lp-fg); line-height: 1.1; }
.lp-cp { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--lp-line); }
.lp-cp-n { width: 28px; height: 28px; border-radius: 50%; background: var(--lp-accent-l); color: var(--lp-accent); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
@keyframes lpUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 768px) { .lp-nav { padding: 0 20px; } .lp-inner { padding: 0 20px; } .lp-card { padding: 28px; } .lp-3g, .lp-2g { grid-template-columns: 1fr !important; } }
`;

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile(768);
  const [scrolled, setScrolled] = useState(false);
  const howRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const sp = isMobile ? "80px 0" : "120px 0";

  return (
    <div className="lp">
      <style>{CSS}</style>

      <nav className="lp-nav" style={{ borderBottomColor: scrolled ? "var(--lp-line)" : "transparent" }}>
        <Logo size={16} variant="light" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <div className="lp-nav-links">
          {!isMobile && <button className="lp-nav-link" onClick={() => scrollTo(howRef)}>How It Works</button>}
          {!isMobile && <button className="lp-nav-link" onClick={() => scrollTo(qualityRef)}>Quality</button>}
          <button className="lp-nav-link" onClick={() => navigate("/auth")}>Sign In</button>
          <a href={CTA_MAILTO} className="lp-btn lp-btn-p" style={{ padding: "8px 20px", fontSize: 13 }}>Get Access</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 80 }}>
        <div className="lp-inner" style={{ width: "100%" }}>
          <div style={{ maxWidth: 680 }}>
            <div className="lp-label" style={{ marginBottom: 20, animation: "lpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both" }}>
              Composed Intelligence for Thought Leaders
            </div>
            <h1 style={{
              fontFamily: "var(--lp-serif)", fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 400, lineHeight: 1.12, letterSpacing: "-0.02em",
              margin: "0 0 24px", animation: "lpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both",
            }}>
              You know what you want to say.{" "}
              <span style={{ color: "var(--lp-gold)" }}>It's still in your head.</span>
            </h1>
            <p style={{
              fontSize: 18, color: "var(--lp-fg2)", lineHeight: 1.65, maxWidth: 480,
              margin: "0 0 36px", animation: "lpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both",
            }}>
              EVERYWHERE Studio turns your thinking into publication-ready content, in your voice, across every channel. Watson listens first. Then the room goes to work.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", animation: "lpUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s both" }}>
              <button className="lp-btn lp-btn-p" onClick={() => navigate("/auth?mode=signup")}>Get Early Access</button>
              <button className="lp-btn lp-btn-o" onClick={() => scrollTo(howRef)}>See How It Works</button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "48px 0", borderTop: "1px solid var(--lp-line)", borderBottom: "1px solid var(--lp-line)" }}>
        <div className="lp-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32 }}>
            {[
              { n: String(MARKETING_NUMBERS.specialistCount), l: "AI Specialists" },
              { n: String(MARKETING_NUMBERS.qualityCheckpoints), l: "Quality Checkpoints" },
              { n: String(MARKETING_NUMBERS.outputFormatCount), l: "Output Formats" },
              { n: MARKETING_NUMBERS.impactThreshold + "%", l: "Publication Threshold" },
              { n: MARKETING_NUMBERS.voiceDnaTarget + "%", l: "Voice Match Target" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1, minWidth: 100 }}>
                <div className="lp-stat">{s.n}</div>
                <div style={{ fontSize: 12, color: "var(--lp-fg3)", fontWeight: 500, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: sp }}>
        <Reveal>
          <div className="lp-inner" style={{ maxWidth: 720 }}>
            <p style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(24px, 3.5vw, 36px)", lineHeight: 1.35, fontWeight: 400, margin: 0 }}>
              You have years of thinking that the world hasn't heard yet.{" "}
              <span style={{ color: "var(--lp-fg3)" }}>That's not a discipline problem. It's an infrastructure problem.</span>
            </p>
          </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} style={{ padding: sp, background: "var(--lp-bg2)" }}>
        <div className="lp-inner">
          <Reveal>
            <div className="lp-label" style={{ marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 400, lineHeight: 1.2, margin: "0 0 16px" }}>
              Watch. Work. Wrap.
            </h2>
            <p style={{ color: "var(--lp-fg2)", maxWidth: 520, margin: "0 0 56px" }}>Three phases. From intelligence to published content, all in your voice.</p>
          </Reveal>
          <div className="lp-3g" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { s: "01", t: "Watch", d: "Market intelligence runs overnight. Signals, trends, and competitor moves are surfaced and waiting when you arrive." },
              { s: "02", t: "Work", d: "Watson interviews you until he understands what you mean, not just what you said. Then the room produces a draft through 7 quality checkpoints." },
              { s: "03", t: "Wrap", d: "Choose a format. Pick a template. One piece becomes LinkedIn, newsletter, podcast script, and more. Published in minutes." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="lp-card" style={{ height: "100%" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--lp-accent)", letterSpacing: "0.08em", marginBottom: 16 }}>{item.s}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>{item.t}</h3>
                  <p style={{ fontSize: 15, color: "var(--lp-fg2)", lineHeight: 1.65, margin: 0 }}>{item.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WATSON */}
      <section style={{ padding: sp }}>
        <div className="lp-inner">
          <div className="lp-2g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <Reveal>
              <div>
                <div className="lp-label" style={{ marginBottom: 12 }}>Watson</div>
                <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, lineHeight: 1.25, margin: "0 0 20px" }}>
                  The First Listener
                </h2>
                <p style={{ color: "var(--lp-fg2)", marginBottom: 16, lineHeight: 1.7 }}>
                  Watson doesn't generate. He interviews. He asks until he fully understands what you're trying to say, in your words, from your experience.
                </p>
                <p style={{ color: "var(--lp-fg2)", lineHeight: 1.7 }}>
                  The output is yours because the input was yours. Watson does not invent. He excavates.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="lp-card" style={{ background: "var(--lp-bg2)", border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lp-accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--lp-fg2)" }}>Watson is listening</span>
                </div>
                <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid var(--lp-line)", marginBottom: 12, fontSize: 14, color: "var(--lp-fg2)", lineHeight: 1.6 }}>
                  The best content creators aren't the loudest voices. They're the ones who got their infrastructure right.
                </div>
                <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid var(--lp-line)", fontSize: 14 }}>
                  <div style={{ fontWeight: 600, color: "var(--lp-fg)", marginBottom: 4 }}>Core thesis:</div>
                  <div style={{ color: "var(--lp-fg2)", lineHeight: 1.6 }}>Infrastructure, not talent, separates visible thought leaders from invisible ones.</div>
                  <div style={{ marginTop: 12, fontWeight: 600, color: "var(--lp-fg)" }}>Who specifically needs to hear this?</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* QUALITY */}
      <section ref={qualityRef} style={{ padding: sp, background: "var(--lp-bg2)" }}>
        <div className="lp-inner">
          <div className="lp-2g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            <Reveal>
              <div>
                <div className="lp-label" style={{ marginBottom: 12 }}>Quality</div>
                <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, lineHeight: 1.25, margin: "0 0 20px" }}>
                  7 checkpoints stand between your draft and the world
                </h2>
                <p style={{ color: "var(--lp-fg2)", lineHeight: 1.7, marginBottom: 24 }}>
                  Every piece passes through sequential, blocking quality checkpoints. Nothing ships until it meets publication standards.
                </p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--lp-gold-l)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--lp-gold)" }}>
                  Human Voice Test: always on
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div>
                {[
                  { n: "0", t: "Deduplication", d: "Zero redundant content" },
                  { n: "1", t: "Research Validation", d: "100% verified claims" },
                  { n: "2", t: "Voice Authenticity", d: ">" + MARKETING_NUMBERS.voiceDnaTarget + "% Voice DNA match" },
                  { n: "3", t: "Engagement", d: "7-second hook test" },
                  { n: "4", t: "SLOP Detection", d: "Zero AI padding" },
                  { n: "5", t: "Editorial Excellence", d: "Publication-grade + Stranger Test" },
                  { n: "6", t: "Perspective & Risk", d: "Cultural sensitivity review" },
                ].map((c, i) => (
                  <div key={i} className="lp-cp">
                    <div className="lp-cp-n">{c.n}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.t}</div>
                      <div style={{ fontSize: 13, color: "var(--lp-fg3)" }}>{c.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* OUTPUT TYPES */}
      <section style={{ padding: sp }}>
        <div className="lp-inner">
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
              <div className="lp-label" style={{ marginBottom: 12 }}>22 Output Types</div>
              <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, lineHeight: 1.25, margin: "0 0 16px" }}>
                One idea becomes everything
              </h2>
              <p style={{ color: "var(--lp-fg2)" }}>Content and business outputs, from essays and podcasts to proposals and case studies.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {["Essay", "Podcast", "Newsletter", "LinkedIn", "Video Script", "Email", "Book Chapter"].map((t, i) => (
                <span key={i} style={{ padding: "8px 18px", borderRadius: 20, background: i < 3 ? "var(--lp-fg)" : "#fff", color: i < 3 ? "#fff" : "var(--lp-fg)", border: i < 3 ? "none" : "1px solid var(--lp-line)", fontSize: 13, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["Presentation", "Proposal", "Case Study", "Report", "One-Pager", "SOW", "Bio", "White Paper"].map((t, i) => (
                <span key={i} style={{ padding: "8px 18px", borderRadius: 20, background: "#fff", color: "var(--lp-fg)", border: "1px solid var(--lp-line)", fontSize: 13, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* VOICE DNA */}
      <section style={{ padding: sp, background: "var(--lp-bg2)" }}>
        <div className="lp-inner" style={{ maxWidth: 720, textAlign: "center" }}>
          <Reveal>
            <div className="lp-label" style={{ marginBottom: 12 }}>Voice DNA</div>
            <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, lineHeight: 1.25, margin: "0 0 20px" }}>
              It sounds like you because it came from you
            </h2>
            <p style={{ color: "var(--lp-fg2)", lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
              EVERYWHERE captures your vocabulary, rhythm, tonal register, and structural habits across three layers of voice profiling. The result is content that passes the "did a human write this?" test.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: sp }}>
        <div className="lp-inner" style={{ textAlign: "center" }}>
          <Reveal>
            <h2 style={{ fontFamily: "var(--lp-serif)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, lineHeight: 1.2, margin: "0 0 16px" }}>
              Your thinking deserves better infrastructure.
            </h2>
            <p style={{ color: "var(--lp-fg2)", maxWidth: 440, margin: "0 auto 36px", fontSize: 17 }}>
              Join the leaders who stopped trying to do it alone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="lp-btn lp-btn-p" onClick={() => navigate("/auth?mode=signup")} style={{ padding: "14px 36px" }}>Get Early Access</button>
              <a href={CTA_MAILTO} className="lp-btn lp-btn-o" style={{ padding: "14px 36px" }}>Let's Talk</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 0", borderTop: "1px solid var(--lp-line)" }}>
        <div className="lp-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Logo size={14} variant="light" />
            <span style={{ fontSize: 12, color: "var(--lp-fg3)" }}>&copy; {new Date().getFullYear()} Mixed Grill, LLC</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <button className="lp-nav-link" onClick={() => navigate("/auth")} style={{ fontSize: 12 }}>Sign In</button>
            <button className="lp-nav-link" onClick={() => navigate("/studio/dashboard")} style={{ fontSize: 12 }}>Demo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
