import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";
import { MARKETING_NUMBERS } from "../lib/constants";

const CTA_MAILTO = "mailto:mark@mixedgrill.studio?subject=EVERYWHERE%20Studio%20—%20Let's%20Talk";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');

:root {
  --navy: #07091A;
  --navy-mid: #0D1230;
  --navy-card: #111830;
  --gold: #D4A832;
  --gold-dim: rgba(212, 168, 50, 0.12);
  --blue: #6B8FD4;
  --white: #F0F2F8;
  --white-dim: rgba(240, 242, 248, 0.55);
  --divider: rgba(240, 242, 248, 0.07);
  --font: 'Afacad Flux', sans-serif;
}

.explore-page {
  background: var(--navy);
  color: var(--white);
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

.explore-page em {
  font-style: normal;
  color: var(--gold);
}

.explore-page a { color: inherit; text-decoration: none; }

.ex-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  background: rgba(7, 9, 26, 0.82);
  border-bottom: 1px solid var(--divider);
  padding: 0 32px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ex-nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  font-size: 14px;
  font-weight: 500;
  color: var(--white-dim);
}

.ex-nav-links a:hover { color: var(--white); }

.ex-section {
  max-width: 980px;
  margin: 0 auto;
  padding: 80px 32px;
}

.ex-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 16px;
}

.ex-h1 {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  color: var(--white);
}

.ex-h2 {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
  color: var(--white);
}

.ex-body {
  color: var(--white-dim);
  max-width: 640px;
  margin-bottom: 16px;
}

.ex-btn-gold {
  display: inline-block;
  padding: 14px 32px;
  background: var(--gold);
  color: var(--navy);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  transition: opacity 0.15s ease;
  text-decoration: none;
}
.ex-btn-gold:hover { opacity: 0.88; }

.ex-btn-outline {
  display: inline-block;
  padding: 14px 32px;
  background: transparent;
  color: var(--white);
  border: 1px solid rgba(240, 242, 248, 0.2);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: border-color 0.15s ease;
  text-decoration: none;
}
.ex-btn-outline:hover { border-color: rgba(240, 242, 248, 0.5); }

.ex-stats-row {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
  margin-top: 40px;
}

.ex-stat {
  text-align: center;
}
.ex-stat-num {
  font-size: 42px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
}
.ex-stat-label {
  font-size: 13px;
  color: var(--white-dim);
  margin-top: 6px;
}

.ex-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}

.ex-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 32px;
}

.ex-room-card {
  background: var(--navy-card);
  border: 1px solid var(--divider);
  border-radius: 12px;
  padding: 28px;
}
.ex-room-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 12px;
}
.ex-room-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--white);
}
.ex-room-body {
  font-size: 15px;
  color: var(--white-dim);
  line-height: 1.6;
  margin-bottom: 16px;
}
.ex-room-items {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
  color: var(--white-dim);
}
.ex-room-items li {
  padding: 6px 0;
  border-top: 1px solid var(--divider);
}

.ex-checkpoint {
  padding: 14px 0;
  border-bottom: 1px solid var(--divider);
}
.ex-checkpoint-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
  margin-right: 8px;
}
.ex-checkpoint-name {
  font-weight: 700;
  color: var(--white);
  margin-right: 8px;
}
.ex-checkpoint-desc {
  color: var(--white-dim);
  font-size: 15px;
}

.ex-moment {
  padding: 20px 0;
  border-bottom: 1px solid var(--divider);
}
.ex-moment-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.ex-moment-text {
  color: var(--white-dim);
  font-size: 16px;
}

.ex-footer {
  border-top: 1px solid var(--divider);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 980px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--white-dim);
}

@media (max-width: 900px) {
  .ex-nav { padding: 0 20px; }
  .ex-nav-links-desktop { display: none !important; }
  .ex-section { padding: 56px 20px; }
  .ex-h1 { font-size: 34px; }
  .ex-h2 { font-size: 26px; }
  .ex-grid-2 { grid-template-columns: 1fr; gap: 40px; }
  .ex-grid-3 { grid-template-columns: 1fr; }
  .ex-stats-row { gap: 32px; }
  .ex-footer { flex-direction: column; gap: 16px; text-align: center; }
}
`;

export default function ExplorePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const howRef = useRef<HTMLDivElement>(null);
  const standardRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="explore-page">
      <style>{CSS}</style>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="ex-nav">
        <Logo size="sm" variant="dark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <div className="ex-nav-links">
          <div className="ex-nav-links-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo(howRef); }}>How It Works</a>
            <a href="#standard" onClick={(e) => { e.preventDefault(); scrollTo(standardRef); }}>The Standard</a>
          </div>
          <a href={CTA_MAILTO} className="ex-btn-gold" style={{ padding: "8px 20px", fontSize: 13 }}>
            Let's Talk
          </a>
        </div>
      </nav>

      {/* ── SECTION 01: HERO ─────────────────────────────── */}
      <section style={{ background: "var(--navy)" }}>
        <div className="ex-section" style={{ paddingTop: isMobile ? 64 : 100, paddingBottom: isMobile ? 64 : 100 }}>
          <div className="ex-eyebrow">EVERYWHERE Studio™</div>
          <h1 className="ex-h1">
            You know what you want to say.<br />
            <em>It's still in your head.</em>
          </h1>
          <p className="ex-body" style={{ fontSize: 19, marginBottom: 32 }}>
            Sunday night. Another week where your best thinking didn't make it out into the world. That ends here.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href={CTA_MAILTO} className="ex-btn-gold">Let's Talk</a>
            <a href="#how" className="ex-btn-outline" onClick={(e) => { e.preventDefault(); scrollTo(howRef); }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 02: RECOGNITION ──────────────────────── */}
      <section style={{ background: "var(--navy-mid)" }}>
        <div className="ex-section">
          <div style={{ borderLeft: "3px solid var(--gold)", paddingLeft: 28 }}>
            <h2 className="ex-h2" style={{ maxWidth: 700 }}>
              You have years of thinking that the world hasn't heard yet.{" "}
              <em>That's not a discipline problem.</em>
            </h2>
            <p className="ex-body">
              It's an infrastructure problem. Getting ideas from your head — through drafting, editing, formatting, and publishing, across every channel, in your voice, at the quality they deserve — is a full operation.
            </p>
            <p className="ex-body">
              You've been trying to run that operation alone. Most thought leaders are. The ones who aren't are the ones you see everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 03: LEVERAGE STRIP ───────────────────── */}
      <section style={{ background: "var(--gold-dim)" }}>
        <div className="ex-section" style={{ paddingTop: 48, paddingBottom: 48, textAlign: "center" }}>
          <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, color: "var(--gold)", margin: 0, maxWidth: 700, marginInline: "auto", lineHeight: 1.4 }}>
            The people in your market who show up everywhere aren't better thinkers. They have better infrastructure.
          </p>
        </div>
      </section>

      {/* ── SECTION 04: IDENTITY SHIFT ───────────────────── */}
      <section style={{ background: "var(--navy)" }}>
        <div className="ex-section">
          <div className="ex-grid-2">
            <div>
              <div className="ex-eyebrow">You know this feeling</div>
              <h2 className="ex-h2">The idea is in your head. Not in the world.</h2>
              <p className="ex-body">
                You've been carrying ideas that deserve an audience. The problem was never the thinking. It was the distance between having the thought and getting it out — in your voice, at the quality it deserves, on every channel that matters.
              </p>
            </div>
            <div>
              {[
                { label: "Sunday night", text: "The week is ending. You had three ideas worth writing about. None of them made it out." },
                { label: "On a plane", text: "You write two pages of thinking in a notebook. It never becomes anything." },
                { label: "Watching someone else", text: "You see someone on stage or in your feed saying something you've thought for years. They just got it out first." },
                { label: "After the conversation", text: "You just explained something perfectly to a client. Room changed. No one else will ever hear that version of it." },
              ].map((m) => (
                <div key={m.label} className="ex-moment">
                  <div className="ex-moment-label">{m.label}</div>
                  <div className="ex-moment-text">{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 05: WHAT IT IS ───────────────────────── */}
      <section style={{ background: "var(--navy-mid)" }}>
        <div className="ex-section" style={{ textAlign: "center" }}>
          <div className="ex-eyebrow">EVERYWHERE Studio</div>
          <h2 className="ex-h2" style={{ maxWidth: 700, marginInline: "auto" }}>
            Your thinking. Out in the world. In your voice. Every week.
          </h2>
          <p className="ex-body" style={{ marginInline: "auto" }}>
            A coordinated team of {MARKETING_NUMBERS.specialistCount} specialists takes the idea in your head and turns it into publication-ready content across every format and channel you need.
          </p>
          <p className="ex-body" style={{ marginInline: "auto" }}>
            You talk. They work. You publish. Every word sounds like you. Every claim is verified. Nothing ships without passing {MARKETING_NUMBERS.qualityCheckpoints} quality checkpoints.
          </p>
          <div className="ex-stats-row" style={{ justifyContent: "center" }}>
            <div className="ex-stat">
              <div className="ex-stat-num">{MARKETING_NUMBERS.specialistCount}</div>
              <div className="ex-stat-label">Specialists</div>
            </div>
            <div className="ex-stat">
              <div className="ex-stat-num">{MARKETING_NUMBERS.qualityCheckpoints}</div>
              <div className="ex-stat-label">Checkpoints</div>
            </div>
            <div className="ex-stat">
              <div className="ex-stat-num">{MARKETING_NUMBERS.betterishThreshold}</div>
              <div className="ex-stat-label">Min. Quality Score</div>
            </div>
            <div className="ex-stat">
              <div className="ex-stat-num">0</div>
              <div className="ex-stat-label">Left for you to finish</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 06: SOCIAL PROOF ─────────────────────── */}
      <section style={{ background: "var(--navy-card)" }}>
        <div className="ex-section" style={{ textAlign: "center", maxWidth: 700, marginInline: "auto" }}>
          <blockquote style={{ margin: 0, padding: 0, border: "none" }}>
            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 500, lineHeight: 1.5, color: "var(--white)", fontStyle: "italic", marginBottom: 20 }}>
              "I had a decade of thinking that had never made it out. Now it does — every week — and it sounds like me. Better than what I was writing myself."
            </p>
            <footer style={{ fontSize: 14, color: "var(--white-dim)" }}>
              — [Client Name] · [Title]
            </footer>
          </blockquote>
          <p style={{ fontSize: 12, color: "var(--white-dim)", marginTop: 24, opacity: 0.5, fontStyle: "italic" }}>
            [ Replace with one real named result before launch ]
          </p>
        </div>
      </section>

      {/* ── SECTION 07: HOW IT WORKS ─────────────────────── */}
      <section ref={howRef} style={{ background: "var(--navy)" }}>
        <div className="ex-section">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="ex-eyebrow">Three rooms. One idea.</div>
            <h2 className="ex-h2">Watch. Work. Wrap.</h2>
          </div>
          <div className="ex-grid-3">
            {/* Room One */}
            <div className="ex-room-card">
              <div className="ex-room-tag">Room One — WATCH</div>
              <div className="ex-room-title">The Intelligence Room</div>
              <p className="ex-room-body">
                Your idea doesn't enter a vacuum. We map what your market is already reading, arguing about, and missing — so your thinking lands in context, not into noise.
              </p>
              <ul className="ex-room-items">
                <li>Real-time market signal tracking</li>
                <li>Conversation and gap mapping</li>
                <li>Your idea meets the moment</li>
              </ul>
            </div>
            {/* Room Two */}
            <div className="ex-room-card">
              <div className="ex-room-tag">Room Two — WORK</div>
              <div className="ex-room-title">The Production Room</div>
              <p className="ex-room-body">
                A coordinated team transforms what's in your head into publication-grade content. In your voice. Every claim verified. Seven checkpoints before it touches you.
              </p>
              <ul className="ex-room-items">
                <li>Voice DNA — sounds exactly like you</li>
                <li>100% verified claims</li>
                <li>Zero AI fingerprints</li>
                <li>7-second hook on every piece</li>
              </ul>
            </div>
            {/* Room Three */}
            <div className="ex-room-card">
              <div className="ex-room-tag">Room Three — WRAP</div>
              <div className="ex-room-title">The Distribution Room</div>
              <p className="ex-room-body">
                One idea becomes a complete publishing event. Newsletter, LinkedIn, podcast, Substack — simultaneously.
              </p>
              <ul className="ex-room-items">
                <li>Every channel, formatted natively</li>
                <li>One-click to publish</li>
                <li>Every piece makes the next one better</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 08: QUALITY CHECKPOINTS ──────────────── */}
      <section ref={standardRef} style={{ background: "var(--navy-mid)" }}>
        <div className="ex-section">
          <div className="ex-grid-2">
            <div>
              <div className="ex-eyebrow">Quality Checkpoints</div>
              <h2 className="ex-h2">Nothing ships without passing all seven.</h2>
              <p className="ex-body">
                Every piece of content runs through {MARKETING_NUMBERS.qualityCheckpoints} independent quality gates before it reaches you. Not style checks. Substantive evaluation by specialists who know what publication-ready means.
              </p>
            </div>
            <div>
              {[
                { num: "01", name: "Echo", desc: "Catches repeated concepts and structural patterns." },
                { num: "02", name: "Priya", desc: "Verifies every factual claim. 100% accuracy standard." },
                { num: "03", name: "Jordan", desc: `Voice DNA fidelity. Greater than ${MARKETING_NUMBERS.voiceDnaTarget}% match. Zero AI tells.` },
                { num: "04", name: "David", desc: "7-second hook test. Doesn't earn the read, doesn't ship." },
                { num: "05", name: "Elena", desc: "SLOP detection. One em dash in prose is an automatic block." },
                { num: "06", name: "Natasha", desc: "Publication-grade standard plus the Stranger Test." },
                { num: "07", name: "Marcus + Marshall", desc: "Cultural sensitivity and nonviolent communication review." },
              ].map((cp) => (
                <div key={cp.num} className="ex-checkpoint">
                  <span className="ex-checkpoint-num">{cp.num}</span>
                  <span className="ex-checkpoint-name">{cp.name}</span>
                  <span className="ex-checkpoint-desc">— {cp.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 09: FINAL CTA ────────────────────────── */}
      <section style={{ background: "var(--navy)" }}>
        <div className="ex-section" style={{ textAlign: "center", paddingTop: isMobile ? 64 : 100, paddingBottom: isMobile ? 64 : 100 }}>
          <div className="ex-eyebrow">Let's Talk</div>
          <h2 className="ex-h2" style={{ maxWidth: 640, marginInline: "auto" }}>
            Your thinking deserves to <em>be heard.</em>
          </h2>
          <p className="ex-body" style={{ marginInline: "auto", marginBottom: 12 }}>
            You don't need more discipline. You need a system that carries the idea from your head to your audience — every week, without it sitting on your to-do list.
          </p>
          <p className="ex-body" style={{ marginInline: "auto", marginBottom: 36 }}>
            There's a mountain between the idea and the audience. EVERYWHERE Studio carries the mountain.
          </p>
          <a href={CTA_MAILTO} className="ex-btn-gold" style={{ fontSize: 16, padding: "16px 40px" }}>
            Let's Talk
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: "var(--navy)" }}>
        <div className="ex-footer">
          <Logo size="sm" variant="dark" />
          <span>Composed Intelligence · Santa Barbara, CA · 2026 Mixed Grill LLC</span>
        </div>
      </footer>
    </div>
  );
}
