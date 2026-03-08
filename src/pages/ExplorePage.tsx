import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE v8
// Editorial-minimalist. No pill containers. No abbr boxes.
// Three acts: Watch / Work / Wrap. Composed Intelligence.
// ─────────────────────────────────────────────────────────────────────────────

// WATCH visual: scrolling signal feed — editorial, no canvas
function WatchFeed({ dark }: { dark: boolean }) {
  const signals = [
    { cat: "INDUSTRY", headline: "OpenAI releases operator mode for enterprise clients", score: 9.1 },
    { cat: "AUDIENCE", headline: "Thought leaders: LinkedIn dwell time up 18% this quarter", score: 8.4 },
    { cat: "COMPETITOR", headline: "Substack adds AI-assisted formatting for newsletters", score: 7.7 },
    { cat: "TREND", headline: "Voice-to-content workflows gain traction among creators", score: 9.4 },
    { cat: "SIGNAL", headline: "Peak engagement window shifts to 7–9am across platforms", score: 8.1 },
    { cat: "INDUSTRY", headline: "Andreessen Horowitz backs three AI content startups", score: 7.2 },
    { cat: "AUDIENCE", headline: "Executive audiences respond 3x more to short-form video", score: 8.8 },
    { cat: "TREND", headline: "Newsletter open rates highest in 4 years for thought leaders", score: 9.0 },
    { cat: "SIGNAL", headline: "Twitter/X algorithm rewards original analysis over curation", score: 7.6 },
    { cat: "COMPETITOR", headline: "Jasper pivots to 'brand voice' positioning in new campaign", score: 6.9 },
    { cat: "INDUSTRY", headline: "OpenAI releases operator mode for enterprise clients", score: 9.1 },
    { cat: "AUDIENCE", headline: "Thought leaders: LinkedIn dwell time up 18% this quarter", score: 8.4 },
  ];
  const accent = "#3A7BD5";
  const fg = dark ? "rgba(232,232,230,0.80)" : "#111110";
  const fg2 = dark ? "rgba(232,232,230,0.35)" : "#8B8B88";
  const border = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.055)";
  const catColor: Record<string, string> = {
    INDUSTRY: "#3A7BD5", AUDIENCE: "#0D8C9E", TREND: "#C8961A", SIGNAL: "#10b981", COMPETITOR: "#e85d75"
  };
  return (
    <div style={{ width: "100%", height: 340, overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes watch-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .watch-feed { animation: watch-scroll 22s linear infinite; }
        .watch-feed:hover { animation-play-state: paused; }
      `}</style>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 48, zIndex: 2,
        background: dark ? "linear-gradient(180deg, #0a0e1a 0%, transparent 100%)" : "linear-gradient(180deg, #F0F5FF 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80, zIndex: 2,
        background: dark ? "linear-gradient(0deg, #0a0e1a 0%, transparent 100%)" : "linear-gradient(0deg, #F0F5FF 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div className="watch-feed">
        {signals.map((s, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "56px 1fr 36px",
            gap: "0 14px", padding: "11px 0", alignItems: "center",
            borderBottom: `1px solid ${border}`,
          }}>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: ".08em",
              color: catColor[s.cat] || accent, opacity: 0.75,
            }}>{s.cat}</span>
            <span style={{ fontSize: 12.5, color: fg, lineHeight: 1.4, fontWeight: 400 }}>{s.headline}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, textAlign: "right", opacity: 0.7 }}>{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// WRAP visual: platform deployment feed — content going out everywhere
function WrapFeed({ dark }: { dark: boolean }) {
  const deployments = [
    { platform: "LINKEDIN", title: "The attention economy is broken. Here's what I did about it.", format: "Essay", status: "LIVE", time: "9:02am" },
    { platform: "SUBSTACK", title: "Sunday Story: What three years of public writing taught me", format: "Newsletter", status: "LIVE", time: "7:00am" },
    { platform: "TWITTER/X", title: "Thread: Why most thought leaders confuse audience with community", format: "Thread", status: "SCHEDULED", time: "11:30am" },
    { platform: "YOUTUBE", title: "I let AI manage my content for 30 days. Here's what happened.", format: "Script", status: "DRAFT", time: "Today" },
    { platform: "PODCAST", title: "Ep 42: The compounding returns of consistent thinking", format: "Audio", status: "LIVE", time: "Mon 8am" },
    { platform: "EMAIL", title: "3 signals from this week you shouldn't miss", format: "Campaign", status: "SENT", time: "Fri 6am" },
    { platform: "LINKEDIN", title: "The attention economy is broken. Here's what I did about it.", format: "Essay", status: "LIVE", time: "9:02am" },
    { platform: "SUBSTACK", title: "Sunday Story: What three years of public writing taught me", format: "Newsletter", status: "LIVE", time: "7:00am" },
    { platform: "TWITTER/X", title: "Thread: Why most thought leaders confuse audience with community", format: "Thread", status: "SCHEDULED", time: "11:30am" },
    { platform: "YOUTUBE", title: "I let AI manage my content for 30 days. Here's what happened.", format: "Script", status: "DRAFT", time: "Today" },
    { platform: "PODCAST", title: "Ep 42: The compounding returns of consistent thinking", format: "Audio", status: "LIVE", time: "Mon 8am" },
    { platform: "EMAIL", title: "3 signals from this week you shouldn't miss", format: "Campaign", status: "SENT", time: "Fri 6am" },
  ];
  const accent = "#7850DC";
  const fg = dark ? "rgba(232,232,230,0.80)" : "#111110";
  const fg2 = dark ? "rgba(232,232,230,0.32)" : "#9B9B98";
  const border = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const statusColor: Record<string, string> = {
    LIVE: "#10b981", SCHEDULED: "#C8961A", DRAFT: "#6B6B68", SENT: "#3A7BD5"
  };
  const platColor: Record<string, string> = {
    LINKEDIN: "#0D8C9E", "TWITTER/X": "#3A7BD5", SUBSTACK: "#e85d75",
    YOUTUBE: "#e85d75", PODCAST: "#C8961A", EMAIL: "#7850DC"
  };
  return (
    <div style={{ width: "100%", height: 340, overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes wrap-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .wrap-feed { animation: wrap-scroll 26s linear infinite; animation-direction: reverse; }
        .wrap-feed:hover { animation-play-state: paused; }
      `}</style>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 48, zIndex: 2,
        background: dark ? "linear-gradient(180deg, #100a22 0%, transparent 100%)" : "linear-gradient(180deg, #F5F0FF 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80, zIndex: 2,
        background: dark ? "linear-gradient(0deg, #100a22 0%, transparent 100%)" : "linear-gradient(0deg, #F5F0FF 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div className="wrap-feed">
        {deployments.map((d, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "70px 1fr 60px 44px",
            gap: "0 12px", padding: "12px 0", alignItems: "center",
            borderBottom: `1px solid ${border}`,
          }}>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: ".07em",
              color: platColor[d.platform] || accent, opacity: 0.75,
            }}>{d.platform}</span>
            <span style={{ fontSize: 12, color: fg, lineHeight: 1.35, fontWeight: 400 }}>{d.title}</span>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: ".06em",
              color: statusColor[d.status] || fg2, opacity: 0.85, textAlign: "right",
            }}>{d.status}</span>
            <span style={{ fontSize: 10, color: fg2, textAlign: "right" }}>{d.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scroll reveal: word by word ────────────────────────────────────────────
function Reveal({ text, delay = 0, size = "inherit", weight = 400, color = "inherit", lineHeight = 1.2, center = false, maxWidth }: {
  text: string; delay?: number; size?: string | number; weight?: number;
  color?: string; lineHeight?: number; center?: boolean; maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ maxWidth, textAlign: center ? "center" : "left" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.26em",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(14px)",
          transition: `opacity .55s ${delay + i * 0.028}s ease, transform .55s ${delay + i * 0.028}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(18px)",
      transition: `opacity .7s ${delay}s cubic-bezier(.16,1,.3,1), transform .7s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

// Clip reveal: text rises from behind a mask
function ClipReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.05 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div style={{ overflow: "hidden" }}>
      <div ref={ref} style={{
        transform: vis ? "translateY(0)" : "translateY(100%)",
        opacity: vis ? 1 : 0,
        transition: `transform .85s ${delay}s cubic-bezier(.16,1,.3,1), opacity .4s ${delay}s ease`,
      }}>{children}</div>
    </div>
  );
}

// Feature line: numbered, no boxes
function FeatureLine({ num, title, desc, delay = 0, accent, dark }: {
  num: string; title: string; desc: string; delay?: number; accent: string; dark: boolean;
}) {
  const fgMain = dark ? "#E8E8E6" : "#111110";
  const fgSub  = dark ? "rgba(232,232,230,0.42)" : "#6B6B68";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.055)";
  return (
    <FadeIn delay={delay}>
      <div style={{
        display: "grid", gridTemplateColumns: "28px 1fr",
        gap: "0 20px", paddingBottom: 16, paddingTop: 2,
        borderBottom: `1px solid ${border}`, alignItems: "baseline",
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: accent, opacity: 0.65, letterSpacing: ".06em" }}>{num}</span>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: fgMain }}>{title}</span>
          <span style={{ fontSize: 13, color: fgSub, lineHeight: 1.6, marginLeft: 10 }}>{desc}</span>
        </div>
      </div>
    </FadeIn>
  );
}

// Gate row: horizontal list, no card borders
function GateRow({ num, name, desc, color, delay, dark }: {
  num: string; name: string; desc: string; color: string; delay: number; dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  const fgMain = dark ? "#E8E8E6" : "#111110";
  const fgSub  = dark ? "rgba(232,232,230,0.42)" : "#6B6B68";
  return (
    <div ref={ref} style={{
      display: "grid", gridTemplateColumns: "36px 150px 1fr",
      gap: "0 28px", padding: "18px 0",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
      alignItems: "baseline",
      opacity: vis ? 1 : 0,
      transform: vis ? "translateX(0)" : "translateX(-12px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: color, opacity: 0.65, letterSpacing: ".08em" }}>{num}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: fgMain }}>{name}</span>
      <span style={{ fontSize: 13, color: fgSub, lineHeight: 1.6 }}>{desc}</span>
    </div>
  );
}

// DNA bar
function DnaBar({ label, score, delay = 0, dark }: { label: string; score: number; delay?: number; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 14,
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateX(-8px)",
      transition: `opacity .6s ${delay}s ease, transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 12, color: dark ? "rgba(240,240,238,0.45)" : "#6B6B68", width: 160, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          background: dark ? "linear-gradient(90deg, #4a90f5, #90c8ff)" : "linear-gradient(90deg, #3A7BD5, #6EB8FF)",
          width: vis ? `${score}%` : "0%",
          transition: `width 1.2s ${delay + 0.1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#E8E8E6" : "#111110", width: 22, textAlign: "right" }}>{score}</div>
    </div>
  );
}

// Output formats marquee — no pills
function OutputTicker({ dark }: { dark: boolean }) {
  const formats = [
    "LinkedIn Post","Newsletter","Sunday Story","Podcast Script",
    "Twitter Thread","Essay","Short Video","Substack Note",
    "Talk Outline","Email Campaign","Blog Post","Executive Brief",
  ];
  const doubled = [...formats, ...formats];
  const fgColor = dark ? "rgba(232,232,230,0.30)" : "rgba(17,17,16,0.26)";
  const sepColor = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  return (
    <div style={{
      overflow: "hidden",
      maskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
    }}>
      <style>{`
        @keyframes ew-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ew-ticker { display: flex; width: max-content; animation: ew-ticker 30s linear infinite; }
        .ew-ticker:hover { animation-play-state: paused; }
      `}</style>
      <div className="ew-ticker">
        {doubled.map((f, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center",
            fontSize: 12, fontWeight: 500, color: fgColor,
            padding: "6px 24px", whiteSpace: "nowrap", letterSpacing: ".03em",
          }}>
            {f}
            <span style={{ display: "inline-block", width: 1, height: 10, background: sepColor, margin: "0 0 0 24px" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// Wordmark rotator
function WordmarkRotator({ color }: { color: string }) {
  const words = ["Studio", "Intelligence", "System"];
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % words.length); setFading(false); }, 380);
    }, 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      display: "inline-block",
      opacity: fading ? 0 : 1,
      transform: fading ? "translateY(-3px)" : "translateY(0)",
      transition: "opacity .38s ease, transform .38s ease",
      color, fontWeight: 300,
    }}>{words[idx]}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cursor-on-dark", dark);
    document.body.classList.toggle("cursor-on-light", !dark);
  }, [dark]);

  const bg      = dark ? "#0C0C0A" : "#FAFAF8";
  const fg      = dark ? "#E8E8E6" : "#111110";
  const fg2     = dark ? "rgba(232,232,230,0.50)" : "#6B6B68";
  const fg3     = dark ? "rgba(232,232,230,0.28)" : "#9B9B98";
  const line    = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const surface = dark ? "#151513" : "#FFFFFF";
  const navBg   = scrollY > 40
    ? (dark ? "rgba(12,12,10,0.92)" : "rgba(250,250,248,0.94)")
    : "transparent";

  const secBg1 = dark ? "linear-gradient(180deg, #0C0C0A 0%, #0a0e1a 100%)" : "linear-gradient(180deg, #FAFAF8 0%, #F0F5FF 100%)";
  const secBg2 = dark ? "linear-gradient(180deg, #0a0e1a 0%, #081418 100%)" : "linear-gradient(180deg, #F0F5FF 0%, #F0F8F8 100%)";
  const secBg3 = dark ? "linear-gradient(180deg, #081418 0%, #100a22 100%)" : "linear-gradient(180deg, #F0F8F8 0%, #F5F0FF 100%)";

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif", background: bg, color: fg, overflowX: "hidden", transition: "background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg,
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? `1px solid ${line}` : "none",
        transition: "all .4s ease",
      }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", display: "flex", alignItems: "baseline", gap: 0, cursor: "pointer" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: fg, letterSpacing: ".04em", fontKerning: "none" }}>EVERY</span>
          <WordmarkRotator color={fg2} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setDark(d => !d)}
            style={{ width: 36, height: 20, borderRadius: 10, border: `1px solid ${line}`, background: dark ? "#3A7BD5" : "rgba(0,0,0,0.08)", position: "relative", cursor: "pointer", transition: "all .25s" }}
            title={dark ? "Switch to light" : "Switch to dark"}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: dark ? "#fff" : "#111", position: "absolute", top: 2, left: dark ? 18 : 2, transition: "left .25s cubic-bezier(.16,1,.3,1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{dark ? "●" : "○"}</div>
          </button>
          <button
            onClick={() => nav("/auth")}
            style={{ background: dark ? "rgba(255,255,255,0.08)" : "#111110", border: "none", borderRadius: 100, padding: "7px 22px", color: dark ? "rgba(255,255,255,0.82)" : "#FAFAF8", fontSize: 13, fontWeight: 500, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".78"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >Get Early Access</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 48px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: dark ? "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(58,123,213,0.12) 0%, transparent 70%)" : "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(58,123,213,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 920 }}>

          {/* Eyebrow — pure text, no container */}
          <FadeIn delay={0}>
            <div style={{ fontSize: 11, letterSpacing: ".2em", color: dark ? "rgba(232,232,230,0.30)" : "rgba(0,0,0,0.32)", textTransform: "uppercase", marginBottom: 18, fontWeight: 500 }}>
              Composed Intelligence
            </div>
          </FadeIn>

          {/* Headline: clip reveals — tight, no gap */}
          <div style={{ marginBottom: 6, lineHeight: 1 }}>
            <ClipReveal delay={0.05}>
              <div style={{ fontSize: "clamp(58px,9.5vw,120px)", fontWeight: 800, lineHeight: .9, color: fg, letterSpacing: "-.03em", fontKerning: "none" }}>One idea.</div>
            </ClipReveal>
            <ClipReveal delay={0.18}>
              <div style={{ fontSize: "clamp(58px,9.5vw,120px)", fontWeight: 800, lineHeight: .9, letterSpacing: "-.03em", fontKerning: "none", marginBottom: 44, color: dark ? "rgba(232,232,230,0.20)" : "rgba(17,17,16,0.16)" }}>Everywhere.</div>
            </ClipReveal>
          </div>

          {/* Subtext */}
          <div style={{ marginBottom: 52 }}>
            <Reveal
              text="EVERYWHERE Studio composes your thinking into content that lands wherever your audience is. The fidelity of your voice. The strategy of a team. The speed of AI."
              size="clamp(15px,1.8vw,18px)" weight={400} lineHeight={1.75}
              color={fg2} center delay={0.30} maxWidth="580px"
            />
          </div>

          {/* Stats — clean rule-separated, no boxes */}
          <FadeIn delay={0.46}>
            <div style={{ display: "flex", gap: 0, justifyContent: "center", marginBottom: 48, borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, flexWrap: "wrap" }}>
              {[["40+","Agents"],["12","Formats"],["7","Quality Gates"],["94.7","Voice Score"]].map(([n,l],i) => (
                <div key={i} style={{ padding: "18px 36px", textAlign: "center", borderRight: i < 3 ? `1px solid ${line}` : "none" }}>
                  <div style={{ fontSize: "clamp(22px,3.2vw,36px)", fontWeight: 800, color: fg, letterSpacing: "-.04em", lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 9, color: fg3, marginTop: 5, letterSpacing: ".12em", textTransform: "uppercase" }}>{l}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.62}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => nav("/auth")} style={{ background: dark ? "#fff" : "#111110", border: "none", borderRadius: 100, padding: "13px 40px", fontSize: 14, fontWeight: 600, color: dark ? "#0C0C0A" : "#FAFAF8", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>Get Early Access</button>
              <button onClick={() => document.getElementById("watch-section")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", border: `1px solid ${line}`, borderRadius: 100, padding: "13px 40px", fontSize: 14, fontWeight: 500, color: fg2, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "border-color .2s, color .2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fg3; (e.currentTarget as HTMLElement).style.color = fg; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = line; (e.currentTarget as HTMLElement).style.color = fg2; }}>See How It Works</button>
            </div>
          </FadeIn>
        </div>
        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", opacity: 0.25, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none"><rect x="1" y="1" width="14" height="20" rx="7" stroke={fg} strokeWidth="1.2"/><circle cx="8" cy="7" r="2" fill={fg}/></svg>
          <span style={{ fontSize: 9, letterSpacing: ".18em", color: fg3, textTransform: "uppercase" }}>Scroll</span>
        </div>
      </section>

      {/* SECTION RULE */}
      <div style={{ padding: "60px 48px 68px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1, height: 1, background: line }} />
          <span style={{ fontSize: 9, letterSpacing: ".22em", color: fg3, textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 500 }}>Three Rooms</span>
          <div style={{ flex: 1, height: 1, background: line }} />
        </div>
      </div>

      {/* ACT 1 — WATCH */}
      <section id="watch-section" style={{ padding: "0 48px 140px", background: secBg1, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 96px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Room One</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: fg, letterSpacing: "-.04em", lineHeight: 1 }}>WATCH</div>
                <div style={{ fontSize: 11, color: fg3, marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 500 }}>The Signal Room</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, letterSpacing: ".14em", color: fg3, textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>Live signal feed</div>
                <WatchFeed dark={dark} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal text="Your Sentinel scans the world so you never miss a signal." size="clamp(22px,2.6vw,33px)" weight={700} lineHeight={1.18} color={fg} delay={0.08} />
              <Reveal text="While you sleep, WATCH monitors hundreds of sources. Industry news, competitor moves, trending conversations. It surfaces only what matters to your work." size={15} weight={400} lineHeight={1.75} color={fg2} delay={0.22} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 6 }}>
                <FeatureLine num="01" title="Sentinel Briefings" desc="AI-curated signal reports delivered to your studio every morning." delay={0.08} accent="#3A7BD5" dark={dark} />
                <FeatureLine num="02" title="Interest Graph" desc="Learns what matters to your audience and filters everything else out." delay={0.16} accent="#3A7BD5" dark={dark} />
                <FeatureLine num="03" title="Fish Score" desc="Rates each signal by relevance, timeliness, and content potential." delay={0.24} accent="#3A7BD5" dark={dark} />
                <FeatureLine num="04" title="Write From Signal" desc="One tap turns any signal into a fully sourced content brief." delay={0.32} accent="#3A7BD5" dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: line }} />

      {/* ACT 2 — WORK */}
      <section style={{ padding: "140px 48px", background: secBg2, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 96px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal text="Forty agents transform your voice into twelve formats." size="clamp(22px,2.6vw,33px)" weight={700} lineHeight={1.18} color={fg} delay={0.08} />
              <Reveal text="WORK is the engine room. Tell Watson what you are thinking. A rough idea, a voice memo, a half-formed thesis. The agent orchestra turns it into everything." size={15} weight={400} lineHeight={1.75} color={fg2} delay={0.22} />
              {/* Output formats as ticker, not pills */}
              <FadeIn delay={0.34}>
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 9, letterSpacing: ".18em", color: fg3, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Output formats</div>
                  <OutputTicker dark={dark} />
                </div>
              </FadeIn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <WorkCanvas dark={dark} />
              <div>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#0D8C9E", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Room Two</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: fg, letterSpacing: "-.04em", lineHeight: 1 }}>WORK</div>
                <div style={{ fontSize: 11, color: fg3, marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 500 }}>The Engine Room</div>
              </div>
            </div>
          </div>

          {/* Voice DNA — clean borders, no card */}
          <div style={{ marginTop: 96 }}>
            <FadeIn delay={0.1}>
              <div style={{ borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, padding: "52px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: ".18em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 16, fontWeight: 600 }}>Voice DNA</div>
                    <Reveal text="Every output sounds exactly like you." size={26} weight={700} color={fg} delay={0.1} />
                    <div style={{ marginTop: 12 }}>
                      <Reveal text="We capture your authentic voice across five dimensions. No matter the format, readers will know it is you." size={14} weight={400} color={fg2} lineHeight={1.68} delay={0.22} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <DnaBar label="Vocabulary and Syntax" score={88} delay={0.08} dark={dark} />
                    <DnaBar label="Tonal Register" score={94} delay={0.16} dark={dark} />
                    <DnaBar label="Rhythm and Cadence" score={91} delay={0.24} dark={dark} />
                    <DnaBar label="Metaphor Patterns" score={87} delay={0.32} dark={dark} />
                    <DnaBar label="Structural Habits" score={96} delay={0.40} dark={dark} />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: line }} />

      {/* ACT 3 — WRAP */}
      <section style={{ padding: "140px 48px", background: secBg3, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 96px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#7850DC", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Room Three</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: fg, letterSpacing: "-.04em", lineHeight: 1 }}>WRAP</div>
                <div style={{ fontSize: 11, color: fg3, marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 500 }}>The Distribution Room</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, letterSpacing: ".14em", color: fg3, textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>Content in the world</div>
                <WrapFeed dark={dark} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal text="Schedule, deploy, measure. Your thinking in the world." size="clamp(22px,2.6vw,33px)" weight={700} lineHeight={1.18} color={fg} delay={0.08} />
              <Reveal text="WRAP closes the loop. Schedule posts across platforms, deliver newsletters, track what lands. The data feeds back into WATCH so your next idea is sharper than the last." size={15} weight={400} lineHeight={1.75} color={fg2} delay={0.24} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 6 }}>
                <FeatureLine num="01" title="Content Calendar" desc="Visual scheduling across all your channels from a single canvas." delay={0.08} accent="#7850DC" dark={dark} />
                <FeatureLine num="02" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." delay={0.16} accent="#7850DC" dark={dark} />
                <FeatureLine num="03" title="Performance Loop" desc="Engagement data flows back to sharpen your next content strategy." delay={0.24} accent="#7850DC" dark={dark} />
                <FeatureLine num="04" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." delay={0.32} accent="#7850DC" dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 QUALITY GATES — editorial list */}
      <section style={{ padding: "120px 48px 140px", background: dark ? "linear-gradient(180deg, #100a22 0%, #0C0C0A 100%)" : "linear-gradient(180deg, #F5F0FF 0%, #FAFAF8 100%)", transition: "background .3s" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "end", marginBottom: 56 }}>
            <div>
              <FadeIn delay={0}>
                <div style={{ fontSize: 9, letterSpacing: ".2em", color: "#7850DC", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>Quality Gates</div>
              </FadeIn>
              <Reveal text="Nothing ships without passing the gates." size="clamp(26px,3.8vw,48px)" weight={700} lineHeight={1.06} color={fg} delay={0.08} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Reveal text="Every piece of content runs through 7 checks before it reaches your audience. No AI tells. No off-brand moments. No weak writing." size={14} weight={400} lineHeight={1.7} color={fg2} delay={0.22} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${line}` }}>
            {[
              ["01","Strategy", "Does this serve your goals?",           "#3A7BD5"],
              ["02","Voice",    "Does this sound like you?",             "#0D8C9E"],
              ["03","Accuracy", "Are the facts correct?",                "#C8961A"],
              ["04","AI Tells", "Could anyone spot the AI?",             "#e85d75"],
              ["05","Audience", "Will this resonate?",                   "#7850DC"],
              ["06","Platform", "Is this native to the channel?",        "#4ab8f5"],
              ["07","Impact",   "Will this move people to action?",      "#10b981"],
            ].map(([num, name, desc, color], i) => (
              <GateRow key={i} num={num} name={name} desc={desc} color={color} delay={0.04 + i * 0.05} dark={dark} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "120px 48px 100px", background: bg, textAlign: "center", borderTop: `1px solid ${line}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 9, letterSpacing: ".2em", color: fg3, textTransform: "uppercase", marginBottom: 28, fontWeight: 500 }}>Get Started</div>
          </FadeIn>
          <Reveal text="Your thinking deserves to be everywhere." size="clamp(36px,5.5vw,68px)" weight={700} lineHeight={1.0} color={fg} center delay={0.08} />
          <div style={{ marginTop: 20, marginBottom: 52 }}>
            <Reveal text="Join thought leaders building their content presence with EVERYWHERE Studio." size={16} weight={400} lineHeight={1.65} color={fg2} center delay={0.24} />
          </div>
          <FadeIn delay={0.42}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => nav("/auth")} style={{ background: dark ? "#fff" : "#111110", border: "none", borderRadius: 100, padding: "15px 48px", fontSize: 14, fontWeight: 700, color: dark ? "#0C0C0A" : "#FAFAF8", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>Get Early Access</button>
              <button onClick={() => nav("/studio/dashboard")} style={{ background: "transparent", border: `1px solid ${line}`, borderRadius: 100, padding: "15px 48px", fontSize: 14, fontWeight: 500, color: fg2, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "border-color .2s, color .2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fg3; (e.currentTarget as HTMLElement).style.color = fg; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = line; (e.currentTarget as HTMLElement).style.color = fg2; }}>Open Studio</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "24px 48px", borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: fg, opacity: 0.65 }}>EVERY</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: fg, opacity: 0.22 }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".16em", color: fg3, marginLeft: 5, textTransform: "uppercase" }}>Studio</span>
        </div>
        <span style={{ fontSize: 11, color: fg3, letterSpacing: ".04em" }}>2026 Mixed Grill LLC · Composed Intelligence</span>
      </footer>
    </div>
  );
}
