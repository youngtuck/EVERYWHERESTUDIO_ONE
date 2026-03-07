import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/landing/Footer";
import Logo from "../components/Logo";

// ─── Intersection observer hook ───────────────────────────────────────────────
function useVisible(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, v };
}

// ─── Section wrapper for reveal animations ────────────────────────────────────
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, v } = useVisible();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : `translateY(${y}px)`,
      transition: `opacity .9s ${delay}s cubic-bezier(.16,1,.3,1), transform .9s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      {children}
    </div>
  );
}

// ─── Label component ──────────────────────────────────────────────────────────
function Label({ text, color = "#4A90D9" }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 28, height: 1, background: color }} />
      <span style={{
        fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", color,
        textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif",
      }}>{text}</span>
    </div>
  );
}

// ─── Heading component ────────────────────────────────────────────────────────
function Heading({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "md" }) {
  const sz = size === "lg"
    ? "clamp(40px,5.5vw,80px)"
    : "clamp(32px,4vw,56px)";
  return (
    <h2 style={{
      fontFamily: "'Afacad Flux',sans-serif",
      fontSize: sz, fontWeight: 800, color: "#fff",
      lineHeight: 1.0, letterSpacing: "-.035em",
    }}>
      {children}
    </h2>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Div({ color = "rgba(255,255,255,.07)" }: { color?: string }) {
  return <div style={{ height: 1, background: color, margin: "0 0" }} />;
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ExploreHero() {
  const [in_, setIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIn(true), 80); return () => clearTimeout(t); }, []);
  const e = (d: number) => ({
    opacity: in_ ? 1 : 0,
    transform: in_ ? "none" : "translateY(24px)",
    transition: `opacity .9s ${d}s cubic-bezier(.16,1,.3,1), transform .9s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <section style={{ padding: "140px 0 100px", maxWidth: 900 }}>
      <div style={{ ...e(0.1), display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 28, height: 1, background: "#F5C642" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", color: "#F5C642",
          textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>
          Composed Intelligence
        </span>
      </div>

      <h1 style={{ ...e(0.25), fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(52px,7vw,96px)", fontWeight: 900, color: "#fff",
        lineHeight: .95, letterSpacing: "-.04em", margin: "0 0 32px" }}>
        Ideas to Impact.<br />
        <span style={{ color: "rgba(255,255,255,.28)" }}>One voice. Everywhere.</span>
      </h1>

      <p style={{ ...e(0.4), fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(17px,2vw,22px)", color: "rgba(255,255,255,.5)",
        lineHeight: 1.6, fontWeight: 300, maxWidth: 600, margin: "0 0 52px" }}>
        EVERYWHERE Studio is a 40-agent operating system built for thought leaders who refuse to choose between volume and voice. You speak. We compose.
      </p>

      <div style={{ ...e(0.55), display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[["40","Agents"],["12","Formats"],["7","Gates"],["94.7","Voice Score"]].map(([n,l]) => (
          <div key={l} style={{ padding: "14px 24px", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.09)", display: "flex",
            flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#F5C642",
              fontFamily: "'Afacad Flux',sans-serif", letterSpacing: "-.03em", lineHeight: 1 }}>{n}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", letterSpacing: "0.1em",
              textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>{l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThreeRooms() {
  const items = [
    {
      word: "WATCH",
      sub: "Sentinel Intelligence",
      color: "#4A90D9",
      desc: "Your AI strategist runs 24/7. It monitors the landscape — industry trends, competitor moves, audience signals — and surfaces the most relevant opportunities for your specific authority position. You wake up with a briefing, not a search tab.",
      detail: ["Trend monitoring", "Competitor analysis", "Audience signal detection", "Opportunity surfacing"],
    },
    {
      word: "WORK",
      sub: "The 40-Agent Orchestra",
      color: "#F5C642",
      desc: "You speak a thought. A voice memo, a conversation, rough notes. That raw material passes through 40 specialized agents: strategists, writers, editors, fact-checkers, platform specialists. All working in parallel. All in your voice.",
      detail: ["Voice DNA processing", "Strategy alignment", "Content generation", "Quality gate review"],
    },
    {
      word: "WRAP",
      sub: "Everywhere Distribution",
      color: "#188FA7",
      desc: "Finished content goes out in 12 formats, optimized for each platform, scheduled at peak times, and tracked for impact. Your idea doesn't just exist once. It compounds — across every channel, every audience, every context.",
      detail: ["12 output formats", "Platform optimization", "Scheduled delivery", "Impact tracking"],
    },
  ];

  return (
    <section style={{ padding: "80px 0 100px" }}>
      <Reveal>
        <Label text="The System" color="#4A90D9" />
        <Heading>Three rooms.<br /><span style={{ color: "rgba(255,255,255,.28)" }}>One studio.</span></Heading>
      </Reveal>

      <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item, i) => (
          <Reveal key={item.word} delay={i * 0.1}>
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 60,
              padding: "52px 0", borderTop: `1px solid rgba(255,255,255,.07)` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {/* Left */}
              <div>
                <div style={{ fontSize: "clamp(52px,5vw,72px)", fontWeight: 900,
                  fontFamily: "'Afacad Flux',sans-serif", color: item.color,
                  letterSpacing: "-.04em", lineHeight: 1, marginBottom: 6 }}>
                  {item.word}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
                  color: "rgba(255,255,255,.35)", textTransform: "uppercase",
                  fontFamily: "'Afacad Flux',sans-serif" }}>
                  {item.sub}
                </div>
              </div>
              {/* Right */}
              <div>
                <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
                  color: "rgba(255,255,255,.58)", lineHeight: 1.72, fontWeight: 300,
                  margin: "0 0 28px", maxWidth: 560 }}>
                  {item.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {item.detail.map(d => (
                    <span key={d} style={{ fontSize: 11, padding: "5px 12px",
                      border: `1px solid ${item.color}44`,
                      color: item.color, borderRadius: 100,
                      fontFamily: "'Afacad Flux',sans-serif",
                      fontWeight: 500, letterSpacing: "0.06em" }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function VoiceDNA() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { ref: secRef, v: visible } = useVisible();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const layers = [
        { col: "#4A90D9", amp: 16, freq: .017, ph: 0, lw: 2, a: .85 },
        { col: "#F5C642", amp: 11, freq: .028, ph: 2.0, lw: 1.5, a: .65 },
        { col: "#188FA7", amp: 22, freq: .01,  ph: 4.2, lw: 1.5, a: .45 },
      ];

      layers.forEach(l => {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = H/2
            + Math.sin(x*l.freq + t + l.ph) * l.amp
            + Math.sin(x*l.freq*2.1 + t*1.3 + l.ph) * l.amp*.35
            + Math.sin(x*l.freq*.4  + t*.5  + l.ph) * l.amp*.5;
          x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = l.col;
        ctx.lineWidth = l.lw;
        ctx.globalAlpha = visible ? l.a : 0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = l.col;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Axis points
      const pts = ["Cadence","Depth","Clarity","Authority","Warmth"];
      pts.forEach((label, i) => {
        const x = W * (0.1 + i * 0.2);
        const y = H/2 + Math.sin(x*.017+t) * 16;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI*2);
        ctx.fillStyle = "#F5C642";
        ctx.shadowBlur = 10; ctx.shadowColor = "#F5C642";
        ctx.globalAlpha = visible ? 1 : 0;
        ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = visible ? .38 : 0;
        ctx.fillStyle = "#fff";
        ctx.font = `10px 'Afacad Flux', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(label, x, H*.88);
        ctx.globalAlpha = 1;
      });

      t += .012;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  return (
    <section ref={secRef} style={{ padding: "80px 0 100px" }}>
      <Div />
      <div style={{ paddingTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        {/* Left */}
        <div>
          <Reveal>
            <Label text="Voice DNA" color="#F5C642" />
            <Heading>Every word.<br /><span style={{ color: "rgba(255,255,255,.28)" }}>Still you.</span></Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
              color: "rgba(255,255,255,.5)", lineHeight: 1.72, fontWeight: 300,
              margin: "24px 0 36px" }}>
              Three invisible layers capture how you think, what you value, and the texture of how ideas move through you. It's not mimicry — it's composition. Your Voice Fidelity Score guarantees no AI tell, ever.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 20,
              padding: "18px 26px", background: "rgba(245,198,66,.07)",
              border: "1px solid rgba(245,198,66,.2)", borderLeft: "3px solid #F5C642" }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#F5C642",
                  fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1, letterSpacing: "-.04em" }}>94.7</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: "0.15em",
                  textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif", marginTop: 3 }}>
                  Voice Fidelity Score
                </div>
              </div>
              <div style={{ width: 1, height: 44, background: "rgba(255,255,255,.1)" }} />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.42)", fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1.55 }}>
                Indistinguishable<br />from human writing
              </div>
            </div>
          </Reveal>
        </div>
        {/* Right — waveform */}
        <Reveal delay={0.15}>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", padding: "36px 28px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.28)", letterSpacing: "0.2em",
                textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>Voice Pattern Analysis</span>
              <span style={{ fontSize: 10, color: "#4A90D9", fontFamily: "'Afacad Flux',sans-serif" }}>● Live</span>
            </div>
            <canvas ref={canvasRef} style={{ width: "100%", height: 110, display: "block" }} />
            <div style={{ display: "flex", gap: 18, marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.05)" }}>
              {[["#4A90D9","Linguistic"],["#F5C642","Contextual"],["#188FA7","Behavioral"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 18, height: 2, background: c }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontFamily: "'Afacad Flux',sans-serif" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function QualityGates() {
  const { ref, v } = useVisible();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!v) return;
    const t = setInterval(() => setActive(p => (p+1)%7), 1800);
    return () => clearInterval(t);
  }, [v]);

  const gates = [
    ["Strategy",98,"Aligned with your core objectives"],
    ["Voice",94,"Authentic to your personal style"],
    ["Accuracy",99,"Every fact verified and sourced"],
    ["AI Tells",97,"Zero synthetic language patterns"],
    ["Audience",95,"Right fit for intended readers"],
    ["Platform",96,"Optimized for each channel"],
    ["Impact",92,"Engineered to move people"],
  ];

  return (
    <section style={{ padding: "80px 0 100px" }}>
      <Div />
      <div style={{ paddingTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
        <div>
          <Reveal>
            <Label text="7 Quality Gates" color="#188FA7" />
            <Heading>Nothing leaves<br /><span style={{ color: "rgba(255,255,255,.28)" }}>without passing.</span></Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
              color: "rgba(255,255,255,.5)", lineHeight: 1.72, fontWeight: 300, marginTop: 24 }}>
              Every output is scored across seven dimensions before you see it. Below 800 on the Betterish scale, the agents loop back for refinement. You only see finished work.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ marginTop: 36, padding: "20px 24px",
              background: "rgba(24,143,167,.07)", border: "1px solid rgba(24,143,167,.2)",
              display: "inline-flex", gap: 16, alignItems: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#188FA7",
                fontFamily: "'Afacad Flux',sans-serif", letterSpacing: "-.04em" }}>800+</div>
              <div>
                <div style={{ fontSize: 13, color: "#fff", fontFamily: "'Afacad Flux',sans-serif", fontWeight: 500 }}>Betterish Threshold</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontFamily: "'Afacad Flux',sans-serif" }}>Publication quality minimum</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div ref={ref} style={{ paddingTop: 4 }}>
          {gates.map(([name, score, desc], i) => (
            <div key={name}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0",
                borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer",
                opacity: v ? 1 : 0, transform: v ? "none" : "translateX(20px)",
                transition: `all .7s ${.1+i*.07}s cubic-bezier(.16,1,.3,1)` }}
              onMouseEnter={() => setActive(i)}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                border: `1px solid ${active===i?"#4A90D9":"rgba(255,255,255,.1)"}`,
                background: active===i?"rgba(74,144,217,.15)":"transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: active===i?"#4A90D9":"rgba(255,255,255,.28)",
                fontFamily: "'Afacad Flux',sans-serif", fontWeight: 600,
                transition: "all .25s" }}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: active===i?600:400,
                      color: active===i?"#fff":"rgba(255,255,255,.5)",
                      fontFamily: "'Afacad Flux',sans-serif", transition: "all .25s" }}>{name}</span>
                    {active===i && <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)",
                      fontFamily: "'Afacad Flux',sans-serif", marginLeft: 8 }}>{desc}</span>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, transition: "all .25s",
                    color: active===i?"#F5C642":"rgba(255,255,255,.28)",
                    fontFamily: "'Afacad Flux',sans-serif" }}>{score}</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2,
                    width: v ? `${score}%` : "0%",
                    background: active===i?"linear-gradient(to right,#4A90D9,#F5C642)":"rgba(255,255,255,.14)",
                    transition: `width 1s ${.15+i*.07}s cubic-bezier(.16,1,.3,1), background .25s` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Formats() {
  const fmts: [string,string][] = [
    ["LinkedIn Post","#4A90D9"],["Newsletter","#F5C642"],["Sunday Story","#188FA7"],["Podcast Script","#4A90D9"],
    ["Twitter Thread","#F5C642"],["Essay","#188FA7"],["Short Video","#4A90D9"],["Substack Note","#F5C642"],
    ["Talk Outline","#188FA7"],["Email Campaign","#4A90D9"],["Blog Post","#F5C642"],["Executive Brief","#188FA7"],
  ];

  return (
    <section style={{ padding: "80px 0 100px" }}>
      <Div />
      <div style={{ paddingTop: 80 }}>
        <Reveal>
          <Label text="12 Output Formats" color="#F5C642" />
          <Heading>One idea.<br /><span style={{ color: "rgba(255,255,255,.28)" }}>Every format.</span></Heading>
          <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
            color: "rgba(255,255,255,.5)", lineHeight: 1.7, fontWeight: 300,
            maxWidth: 540, marginTop: 20, marginBottom: 56 }}>
            A single voice memo becomes a full content ecosystem. Platform-native, audience-matched, and published on your schedule.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
          {fmts.map(([name, col], i) => (
            <Reveal key={name} delay={i * 0.04}>
              <div style={{ padding: "26px 22px", background: "rgba(255,255,255,.03)",
                borderBottom: "2px solid transparent", transition: "all .25s", cursor: "default" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background="rgba(255,255,255,.065)"; el.style.borderBottomColor=col; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background="rgba(255,255,255,.03)"; el.style.borderBottomColor="transparent"; }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: col, marginBottom: 10 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.65)",
                  fontFamily: "'Afacad Flux',sans-serif" }}>{name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section style={{ padding: "80px 0 100px" }}>
      <Div />
      <div style={{ paddingTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <Reveal>
            <Label text="The Founder" color="#4A90D9" />
            <Heading size="md">
              Mark Sylvester<br />
              <span style={{ color: "rgba(255,255,255,.28)", fontSize: ".7em" }}>Composer. Founder.</span>
            </Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
              color: "rgba(255,255,255,.5)", lineHeight: 1.72, fontWeight: 300, marginTop: 24 }}>
              TEDxSantaBarbara producer. Serial entrepreneur. Mark built EVERYWHERE Studio because he needed it himself — a system that could amplify his thinking at scale without diluting the voice that made it worth amplifying.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[["40","AI Agents","#F5C642"],["12","Output Formats","#4A90D9"],
              ["7","Quality Gates","#188FA7"],["∞","Scale","#F5C642"]].map(([n,l,c]) => (
              <div key={l} style={{ padding: "36px 28px", background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: c,
                  fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1,
                  letterSpacing: "-.04em", marginBottom: 6 }}>{n}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", letterSpacing: "0.1em",
                  textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCTA({ onEnter }: { onEnter: () => void }) {
  const { ref, v } = useVisible();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section ref={ref} style={{ padding: "80px 0 140px", textAlign: "center", position: "relative" }}>
      <Div />
      {/* Grid bg */}
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(74,144,217,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,144,217,.04) 1px,transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        pointerEvents: "none" }} />

      <div style={{ paddingTop: 80, position: "relative" }}>
        <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(28px)",
          transition: "all 1s cubic-bezier(.16,1,.3,1)" }}>
          <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
            fontSize: "clamp(44px,6.5vw,88px)", fontWeight: 900, color: "#fff",
            lineHeight: .95, letterSpacing: "-.04em", margin: "0 0 24px" }}>
            Ready to compose<br />
            <span style={{ background: "linear-gradient(120deg,#F5C642,#4A90D9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              your intelligence?
            </span>
          </h2>
          <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 18,
            color: "rgba(255,255,255,.4)", fontWeight: 300, maxWidth: 420,
            margin: "0 auto 48px", lineHeight: 1.6 }}>
            Join founders, executives, and creators transforming raw thinking into compounding authority.
          </p>

          {!done ? (
            <div style={{ display: "inline-flex", gap: 0 }}>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, color: "#fff",
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)",
                  borderRight: "none", padding: "15px 22px", borderRadius: "100px 0 0 100px",
                  outline: "none", width: 270 }} />
              <button onClick={() => { if(email.includes("@")) setDone(true); }}
                style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, fontWeight: 700,
                  color: "#000", background: "#F5C642", border: "none",
                  padding: "15px 26px", borderRadius: "0 100px 100px 0", cursor: "pointer" }}>
                Request Access
              </button>
            </div>
          ) : (
            <div style={{ display: "inline-block", padding: "15px 30px",
              background: "rgba(245,198,66,.1)", border: "1px solid rgba(245,198,66,.28)",
              borderRadius: 100, color: "#F5C642", fontFamily: "'Afacad Flux',sans-serif", fontSize: 15 }}>
              ✓ You're on the list — we'll be in touch.
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <button onClick={onEnter}
              style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 14,
                color: "rgba(255,255,255,.35)", background: "transparent",
                border: "none", cursor: "pointer", letterSpacing: "0.04em",
                textDecoration: "underline", textDecorationColor: "rgba(255,255,255,.15)" }}>
              or enter the Studio →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Nav for Explore page ─────────────────────────────────────────────────────
function ExploreNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 54,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px",
      background: scrolled ? "rgba(6,6,8,.92)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.07)" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      transition: "all .3s ease" }}>
      <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <Logo size="md" onDark={true} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => navigate("/")}
          style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 13,
            color: "rgba(255,255,255,.45)", background: "transparent",
            border: "1px solid rgba(255,255,255,.12)", cursor: "pointer",
            padding: "7px 18px", borderRadius: 6, letterSpacing: "0.02em" }}>
          ← Back
        </button>
        <button onClick={() => navigate("/studio/dashboard")}
          style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 13, fontWeight: 600,
            color: "#000", background: "#F5C642", border: "none",
            cursor: "pointer", padding: "7px 18px", borderRadius: 6 }}>
          Enter Studio
        </button>
      </div>
    </nav>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#060608", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(245,198,66,.28); color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(74,144,217,.3); border-radius: 4px; }
      `}</style>

      <ExploreNav />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>
        <ExploreHero />
        <ThreeRooms />
        <VoiceDNA />
        <QualityGates />
        <Formats />
        <FounderSection />
        <FinalCTA onEnter={() => navigate("/studio/dashboard")} />
      </div>

      <Footer />
    </div>
  );
}
