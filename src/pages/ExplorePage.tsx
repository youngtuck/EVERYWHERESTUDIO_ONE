import { useEffect, useRef, useState, Children } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";
import Logo from "../components/Logo";

// ─── Animation Primitives ───────────────────────────────────────────────────────

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(14px)",
        transition: `opacity .6s ${delay}s cubic-bezier(.16,1,.3,1), transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`,
      }}
    >
      {children}
    </div>
  );
}

function WordReveal({
  text, size, weight = 700, color, lh = 1.1, delay = 0, center = false,
}: {
  text: string; size: string | number; weight?: number; color: string; lh?: number; delay?: number; center?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.06 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ textAlign: center ? "center" : "left", overflowWrap: "break-word", wordBreak: "break-word" }}>
      {text.split(" ").map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.24em",
            opacity: vis ? 1 : 0,
            transform: vis ? "none" : "translateY(10px)",
            transition: `opacity .48s ${delay + i * 0.05}s ease, transform .48s ${delay + i * 0.05}s cubic-bezier(.16,1,.3,1)`,
            fontSize: size,
            fontWeight: weight,
            color,
            lineHeight: lh,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

function FadeInSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const items = Children.toArray(children);
  return (
    <div ref={ref} style={style}>
      {items.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: visible ? `${index * 0.1}s` : "0s",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

function Counter({ target, suffix = "", label, accent }: { target: number; suffix?: string; label: string; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  useEffect(() => {
    if (!vis) return;
    let start: number | null = null;
    const dur = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [vis, target]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: accent }}>{val}</span>
        <span style={{ color: "#F0F2F8", opacity: 0.5 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 11, letterSpacing: ".15em", color: "rgba(240,242,248,0.55)", textTransform: "uppercase", marginTop: 6, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Section Divider ────────────────────────────────────────────────────────────

const SectionDivider = () => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
    <div style={{ height: 1, background: "rgba(240,242,248,0.07)" }} />
  </div>
);

// ─── Colors ─────────────────────────────────────────────────────────────────────

const C = {
  navy: "#07091A",
  navyMid: "#0D1230",
  navyCard: "#111830",
  gold: "#D4A832",
  goldDim: "rgba(212,168,50,0.12)",
  blue: "#6B8FD4",
  coral: "#C86B55",
  white: "#F0F2F8",
  whiteDim: "rgba(240,242,248,0.55)",
  whiteGhost: "rgba(240,242,248,0.10)",
  divider: "rgba(240,242,248,0.07)",
};

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const nav = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const fromLandingZoom = location.state?.fromLandingZoom === true;
  const [entranceDone, setEntranceDone] = useState(!fromLandingZoom);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = "none";
    document.documentElement.style.backgroundImage = "none";
    document.body.style.backgroundColor = C.navy;
    document.documentElement.style.backgroundColor = C.navy;
    return () => {
      document.body.style.background = "";
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#F4F2ED";
      document.documentElement.style.background = "";
      document.documentElement.style.backgroundImage = "none";
      document.documentElement.style.backgroundColor = "#F4F2ED";
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
      setShowScrollHint(window.scrollY <= 100);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => {
      const el = document.documentElement;
      const denom = el.scrollHeight - el.clientHeight;
      setScrollPct(denom <= 0 ? 0 : el.scrollTop / denom);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!fromLandingZoom) return;
    setEntranceDone(false);
    const frameId = requestAnimationFrame(() => {
      const timeoutId = window.setTimeout(() => setEntranceDone(true), 50);
      return () => window.clearTimeout(timeoutId);
    });
    return () => cancelAnimationFrame(frameId);
  }, [fromLandingZoom]);

  return (
    <div
      className="noise-overlay"
      style={{
        background: C.navy,
        fontFamily: "'Afacad Flux', sans-serif",
        color: C.white,
        overflowX: "clip",
        transition: fromLandingZoom ? "opacity 0.6s ease-out" : undefined,
        opacity: fromLandingZoom ? (entranceDone ? 1 : 0) : 1,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        [id] { scroll-margin-top: 60px; }
        ::selection { background: ${C.gold}40; }
        .noise-overlay::before {
          content: "";
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 2; opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(6px); opacity: 0.6; }
        }
      `}</style>

      {/* Scroll progress */}
      <div style={{ position: "fixed", right: 0, top: 0, width: 2, height: "100vh", zIndex: 100, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ width: "100%", height: `${scrollPct * 100}%`, background: `linear-gradient(to bottom, ${C.blue}, ${C.gold})`, transition: "height 0.1s linear" }} />
      </div>

      {/* ══ NAV ═══════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, width: "100%",
          zIndex: 200,
          height: 56,
          padding: isMobile ? "0 20px" : "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navScrolled ? "rgba(7,9,26,0.96)" : "rgba(7,9,26,0.6)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: `1px solid ${C.divider}`,
          transition: "background 0.3s ease",
        }}
      >
        <button
          onClick={() => nav("/")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "baseline" }}
        >
          <Logo size={16} variant="dark" />
        </button>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <a
              href="#how"
              style={{ color: C.whiteDim, textDecoration: "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.whiteDim; }}
            >
              How It Works
            </a>
            <a
              href="#quality"
              style={{ color: C.whiteDim, textDecoration: "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.whiteDim; }}
            >
              The Standard
            </a>
          </div>
        )}
        <button
          onClick={() => nav("/auth")}
          style={{
            background: C.gold,
            color: C.navy,
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "10px 24px",
            border: "none",
            borderRadius: 100,
            cursor: "pointer",
            transition: "opacity 0.2s, transform 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
        >
          Let's Talk
        </button>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: isMobile ? "120px 24px 80px" : "128px 64px 96px",
          position: "relative",
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 70% 50% at 50% 52%, rgba(107,143,212,0.08) 0%, transparent 68%)" }} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: "2rem",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(4px)",
            transition: "opacity .8s .3s ease, transform .8s .3s cubic-bezier(.16,1,.3,1)",
          }}
        >
          EVERYWHERE Studio
        </div>

        <h1
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: "clamp(42px, 6.5vw, 80px)",
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-1.5px",
            textTransform: "uppercase",
            color: C.white,
            maxWidth: 880,
            marginBottom: "2rem",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(14px)",
            transition: "opacity .8s .35s ease, transform .8s .35s cubic-bezier(.16,1,.3,1)",
          }}
        >
          You know what<br />
          you want to say.<br />
          <span style={{ color: C.gold, fontStyle: "normal" }}>It's still in your head.</span>
        </h1>

        <p
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: 20,
            fontWeight: 400,
            color: C.whiteDim,
            maxWidth: 560,
            lineHeight: 1.65,
            marginBottom: "3rem",
            opacity: mounted ? 1 : 0,
            transition: "opacity .8s .5s ease",
          }}
        >
          Sunday night. Another week where your best thinking didn't make it out into the world. That ends here.
        </p>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: mounted ? 1 : 0,
            transition: "opacity .8s .6s ease",
          }}
        >
          <button
            onClick={() => document.getElementById("talk")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: C.gold,
              color: C.navy,
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "10px 24px",
              border: "none",
              borderRadius: 100,
              cursor: "pointer",
              transition: "opacity 0.2s, transform 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
          >
            Let's Talk
          </button>
          <button
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent",
              color: C.white,
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "10px 24px",
              border: "1px solid rgba(240,242,248,0.25)",
              borderRadius: 100,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,242,248,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,242,248,0.25)"; }}
          >
            See How It Works
          </button>
        </div>

        {/* Scroll cue */}
        <button
          type="button"
          onClick={() => document.getElementById("recognition")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            opacity: showScrollHint ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          aria-label="Scroll down"
        >
          <svg
            width="20" height="12" viewBox="0 0 20 12" fill="none"
            style={{ display: "block", animation: "float 2.5s ease-in-out infinite", stroke: "rgba(240,242,248,0.4)" }}
          >
            <path d="M3 3L10 9L17 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* ══ RECOGNITION ══════════════════════════════════════════════════════ */}
      <section
        id="recognition"
        style={{
          padding: isMobile ? "80px 24px" : "112px 64px",
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ width: 3, height: 52, background: C.gold, marginBottom: "2.5rem" }} />
            <h2 style={{
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              color: C.white,
              marginBottom: "2rem",
            }}>
              You have years of thinking<br />
              that the world hasn't heard yet.<br />
              <span style={{ color: C.gold }}>That's not a discipline problem.</span>
            </h2>
            <p style={{ fontSize: 19, color: C.whiteDim, lineHeight: 1.75, maxWidth: 680, marginBottom: "1.5rem" }}>
              It's an infrastructure problem. Getting ideas from your head, through drafting, editing, formatting, and publishing, across every channel, in your voice, at the quality they deserve, is a full operation.
            </p>
            <p style={{ fontSize: 19, color: C.whiteDim, lineHeight: 1.75, maxWidth: 680 }}>
              <strong style={{ color: C.white, fontWeight: 600 }}>You've been trying to run that operation alone.</strong> Most thought leaders are. The ones who aren't are the ones you see everywhere.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ══ LEVERAGE STRIP ════════════════════════════════════════════════════ */}
      <div
        style={{
          padding: isMobile ? "32px 24px" : "44px 64px",
          borderTop: "1px solid rgba(212,168,50,0.25)",
          borderBottom: "1px solid rgba(212,168,50,0.25)",
          background: C.goldDim,
          textAlign: "center",
        }}
      >
        <FadeUp>
          <p style={{
            fontSize: "clamp(18px, 2.2vw, 26px)",
            fontWeight: 400,
            color: C.gold,
            maxWidth: 740,
            margin: "0 auto",
            lineHeight: 1.5,
          }}>
            <strong style={{ fontWeight: 700 }}>The people in your market who show up everywhere aren't better thinkers.</strong><br />
            They have better infrastructure.
          </p>
        </FadeUp>
      </div>

      {/* ══ IDENTITY SHIFT ═══════════════════════════════════════════════════ */}
      <section
        style={{
          padding: isMobile ? "80px 24px" : "112px 64px",
          borderBottom: `1px solid ${C.divider}`,
          background: C.navyMid,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "48px" : "80px",
            alignItems: "start",
          }}
        >
          <FadeInSection>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: "2rem",
              }}
            >
              You know this feeling
            </div>
            <h2 style={{
              fontSize: "clamp(26px, 3vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              color: C.white,
              marginBottom: "1.5rem",
            }}>
              The idea is<br />in your head.<br /><span style={{ color: C.gold }}>Not in the world.</span>
            </h2>
            <p style={{ fontSize: 17, color: C.whiteDim, lineHeight: 1.75, marginBottom: "1.25rem" }}>
              You've had thoughts that could change how someone sees their business, their career, their life. They deserved to be heard. They didn't make it out.
            </p>
            <p style={{ fontSize: 17, color: C.whiteDim, lineHeight: 1.75 }}>
              EVERYWHERE Studio exists for this exact problem.
            </p>
          </FadeInSection>

          <div>
            {[
              { label: "Sunday night", text: 'The week is ending. You had three ideas worth writing about. <b>None of them made it out.</b> You tell yourself next week will be different.' },
              { label: "On a plane", text: 'You write two pages of thinking in a notebook. <b>It never becomes anything.</b> The notebook joins the others.' },
              { label: "Watching someone else", text: "You see someone on stage or in your feed saying something you've thought for years. <b>They just got it out first.</b>" },
              { label: "After the conversation", text: 'You just explained something perfectly to a client. Room changed. <b>No one else will ever hear that version of it.</b>' },
            ].map((m, i) => (
              <FadeUp key={m.label} delay={i * 0.08}>
                <div style={{ padding: "1.5rem 0", borderBottom: i < 3 ? `1px solid ${C.divider}` : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.gold, marginBottom: "0.5rem" }}>
                    {m.label}
                  </div>
                  <p
                    style={{ fontSize: 16, color: C.whiteDim, lineHeight: 1.65 }}
                    dangerouslySetInnerHTML={{
                      __html: m.text.replace(/<b>/g, `<strong style="color:${C.white};font-weight:600">`).replace(/<\/b>/g, "</strong>"),
                    }}
                  />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHAT IT IS ════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: isMobile ? "80px 24px" : "112px 64px",
          borderBottom: `1px solid ${C.divider}`,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: "2rem" }}>
              EVERYWHERE Studio
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              marginBottom: "1.75rem",
              color: C.white,
            }}>
              Your thinking. Out in the world.<br />In your voice. Every week.
            </h2>
            <p style={{ fontSize: 19, color: C.whiteDim, lineHeight: 1.75, marginBottom: "1.25rem" }}>
              A coordinated team of 40 specialists takes the idea in your head and turns it into publication-ready content across every format and channel you need.
            </p>
            <p style={{ fontSize: 19, color: C.whiteDim, lineHeight: 1.75 }}>
              <strong style={{ color: C.white, fontWeight: 600 }}>You talk. They work. You publish.</strong> Every word sounds like you. Every claim is verified. Nothing ships without passing seven quality checkpoints.
            </p>
          </FadeInSection>

          <FadeInSection style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "3rem",
            border: `1px solid ${C.divider}`,
            borderRadius: 2,
          }}>
            {[
              { value: 40, label: "Specialists" },
              { value: 7, label: "Checkpoints" },
              { value: 900, label: "Min. Quality Score" },
              { value: 0, label: "Left for you to finish" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: isMobile ? "0 0 50%" : 1,
                  padding: "1.75rem 1rem",
                  borderRight: (!isMobile && i < 3) ? `1px solid ${C.divider}` : "none",
                  borderBottom: (isMobile && i < 2) ? `1px solid ${C.divider}` : "none",
                  textAlign: "center",
                }}
              >
                <Counter target={stat.value} label={stat.label} accent={C.white} />
              </div>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ═════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: isMobile ? "80px 24px" : "96px 64px",
          borderBottom: `1px solid ${C.divider}`,
          background: C.navyCard,
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <FadeInSection>
            <p style={{
              fontSize: "clamp(20px, 2.5vw, 30px)",
              fontWeight: 400,
              lineHeight: 1.5,
              color: C.white,
              marginBottom: "2rem",
            }}>
              "I had a decade of thinking that had never made it out. Now it does, every week, and it <span style={{ color: C.gold, fontWeight: 600 }}>sounds like me.</span> Better than what I was writing myself."
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.whiteDim }}>
              -- Early Access Client
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section
        id="how"
        style={{
          padding: isMobile ? "80px 24px" : "112px 64px",
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: isMobile ? "3rem" : "5rem" }}>
          <FadeInSection>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: "1rem" }}>
              Three rooms. One idea.
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              marginBottom: "1rem",
              color: C.white,
            }}>
              Watch. Work. Wrap.
            </h2>
            <p style={{ fontSize: 18, color: C.whiteDim, maxWidth: 500, margin: "0 auto" }}>
              Your idea moves through the same sequence every time. Nothing skips a room.
            </p>
          </FadeInSection>
        </div>

        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 1,
            background: C.divider,
          }}
        >
          {[
            {
              num: "Room One",
              name: "Watch",
              tag: "The Intelligence Room",
              tagColor: C.blue,
              desc: "Your idea doesn't enter a vacuum. We map what your market is already reading, arguing about, and missing, so your thinking lands in context, not into noise.",
              items: ["Real-time market signal tracking", "Conversation and gap mapping", "Your idea meets the moment"],
            },
            {
              num: "Room Two",
              name: "Work",
              tag: "The Production Room",
              tagColor: C.blue,
              desc: "A coordinated team transforms what's in your head into publication-grade content. In your voice. Every claim verified. Seven checkpoints before it touches you.",
              items: ["Voice DNA: sounds exactly like you", "100% verified claims", "Zero AI fingerprints", "7-second hook on every piece"],
            },
            {
              num: "Room Three",
              name: "Wrap",
              tag: "The Distribution Room",
              tagColor: C.blue,
              desc: "One idea becomes a complete publishing event. Newsletter, LinkedIn, podcast, Substack, simultaneously. The thinking that was stuck in your head is now everywhere it needs to be.",
              items: ["Every channel, formatted natively", "One-click to publish", "Every piece makes the next one better"],
            },
          ].map((room, idx) => (
            <FadeUp key={room.name} delay={idx * 0.1}>
              <div style={{ background: C.navy, padding: isMobile ? "2rem 1.5rem" : "3rem 2.5rem" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: "0.75rem" }}>
                  {room.num}
                </div>
                <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-1px", textTransform: "uppercase", color: C.white, lineHeight: 1, marginBottom: "0.5rem" }}>
                  {room.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: room.tagColor, marginBottom: "1.5rem" }}>
                  {room.tag}
                </div>
                <p style={{ fontSize: 16, color: C.whiteDim, lineHeight: 1.7, marginBottom: "1.75rem" }}>
                  {room.desc}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {room.items.map((item) => (
                    <li
                      key={item}
                      style={{
                        fontSize: 14,
                        color: C.whiteDim,
                        padding: "0.5rem 0",
                        borderBottom: `1px solid ${C.divider}`,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                      }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, marginTop: 10, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ QUALITY CHECKPOINTS ══════════════════════════════════════════════ */}
      <section
        id="quality"
        style={{
          padding: isMobile ? "80px 24px" : "112px 64px",
          borderBottom: `1px solid ${C.divider}`,
          background: C.navyMid,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
            gap: isMobile ? "48px" : "80px",
            alignItems: "start",
          }}
        >
          <FadeInSection>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: "1rem" }}>
              Quality Checkpoints
            </div>
            <h2 style={{
              fontSize: "clamp(26px, 3vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              color: C.white,
              marginBottom: "1.25rem",
            }}>
              Nothing ships without passing all seven.
            </h2>
            <p style={{ fontSize: 17, color: C.whiteDim, lineHeight: 1.7 }}>
              Seven specialists review every piece. No AI tells. No brand moments. Nothing that sounds like it came from a machine.
            </p>
          </FadeInSection>

          <div>
            {[
              { num: "01", name: "Echo", desc: "Catches repeated concepts and structural patterns." },
              { num: "02", name: "Priya", desc: "Verifies every factual claim. 100% accuracy standard." },
              { num: "03", name: "Jordan", desc: "Voice DNA fidelity. Greater than 95% match. Zero AI tells." },
              { num: "04", name: "David", desc: "7-second hook test. Doesn't earn the read, doesn't ship." },
              { num: "05", name: "Elena", desc: "SLOP detection. One em dash in prose is an automatic block." },
              { num: "06", name: "Natasha", desc: "Publication-grade standard plus the Stranger Test." },
              { num: "07", name: "Marcus + Marshall", desc: "Cultural sensitivity and nonviolent communication review." },
            ].map((cp, i) => (
              <FadeUp key={cp.num} delay={i * 0.04}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem 0",
                    borderBottom: i < 6 ? `1px solid ${C.divider}` : "none",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.gold, minWidth: 22, paddingTop: 3 }}>
                    {cp.num}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.white, minWidth: 110 }}>
                    {cp.name}
                  </span>
                  <span style={{ fontSize: 14, color: C.whiteDim, lineHeight: 1.55, flex: 1 }}>
                    {cp.desc}
                  </span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section
        id="talk"
        style={{
          padding: isMobile ? "120px 24px 100px" : "144px 64px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: "2rem" }}>
              Let's Talk
            </div>
            <h2 style={{
              fontSize: "clamp(34px, 5vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              textTransform: "uppercase",
              color: C.white,
              marginBottom: "2rem",
            }}>
              Your thinking<br />deserves to<br /><span style={{ color: C.gold }}>be heard.</span>
            </h2>
            <p style={{ fontSize: 19, color: C.whiteDim, lineHeight: 1.65, marginBottom: "1.5rem" }}>
              You don't need more discipline. You need a system that carries the idea from your head to your audience, every week, without it sitting on your to-do list.
            </p>
            <p style={{
              fontSize: "clamp(16px, 1.8vw, 21px)",
              color: C.gold,
              lineHeight: 1.55,
              marginBottom: "3.5rem",
              maxWidth: 500,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              There's a mountain between the idea and the audience.<br />
              EVERYWHERE Studio carries the mountain.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                onClick={() => { window.location.href = "mailto:mark@everywherestudio.com"; }}
                style={{
                  background: C.gold,
                  color: C.navy,
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "14px 40px",
                  border: "none",
                  borderRadius: 100,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.opacity = "0.85";
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 8px 30px rgba(212,168,50,0.25)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.opacity = "1";
                  el.style.transform = "none";
                  el.style.boxShadow = "none";
                }}
              >
                Let's Talk
              </button>
              <button
                onClick={() => nav("/studio/dashboard")}
                style={{
                  background: "transparent",
                  color: C.white,
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "14px 40px",
                  border: "1px solid rgba(240,242,248,0.25)",
                  borderRadius: 100,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,242,248,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(240,242,248,0.25)"; }}
              >
                Open Studio
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          padding: isMobile ? "32px 24px" : "40px 64px",
          borderTop: `1px solid ${C.divider}`,
          display: "flex",
          alignItems: isMobile ? "center" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "1rem" : 0,
          fontSize: 12,
          color: "rgba(240,242,248,0.2)",
        }}
      >
        <Logo size={14} variant="dark" />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,242,248,0.18)" }}>
          Composed Intelligence · Santa Barbara, CA · 2026 Mixed Grill LLC
        </div>
      </footer>
    </div>
  );
}
