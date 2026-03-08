import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE
// Cinematic scroll-driven narrative. Three acts: Watch → Work → Wrap
// Inspired by GSAP's scroll-reveal text + Chainzoku's immersive world-building.
//
// Technique:
//  · IntersectionObserver-based scroll reveals
//  · Word-by-word text illumination (GSAP-style)
//  · Full-bleed section transitions
//  · Orb morphs between acts
//  · Fixed nav + progress indicator
// ─────────────────────────────────────────────────────────────────────────────

// ── Scroll-reveal text component ─────────────────────────────────────────────
function RevealText({
  text, delay = 0, size = "inherit", weight = 400, color = "#fff",
  lineHeight = 1.15, maxWidth, center = false,
}: {
  text: string; delay?: number; size?: string | number; weight?: number;
  color?: string; lineHeight?: number; maxWidth?: string; center?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const words = text.split(" ");
  return (
    <div ref={ref} style={{ maxWidth, textAlign: center ? "center" : "left" }}>
      {words.map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.28em",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: `opacity .6s ${delay + i * 0.04}s cubic-bezier(.16,1,.3,1), transform .6s ${delay + i * 0.04}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

// ── Animated stat ─────────────────────────────────────────────────────────────
function StatPill({ number, label, delay = 0 }: { number: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
      transition: `all .7s ${delay}s cubic-bezier(.16,1,.3,1)`,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16, padding: "24px 32px", textAlign: "center",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-.03em" }}>{number}</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.50)", marginTop: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── Feature row ────────────────────────────────────────────────────────────────
function FeatureRow({ icon, title, desc, delay = 0, accent = "#4a90f5" }: {
  icon: string; title: string; desc: string; delay?: number; accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", gap: 20, alignItems: "flex-start",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-20px)",
      transition: `all .65s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${accent}22`, border: `1px solid ${accent}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,.50)", lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 20, margin: "0 auto",
      maxWidth: 900, padding: "0 40px",
      opacity: visible ? 1 : 0,
      transition: `opacity .8s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.10)" }} />
      <span style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.28)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.10)" }} />
    </div>
  );
}

// ── The mini orb that morphs between sections ──────────────────────────────────
const MINI_VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;
const MINI_FRAG = `
precision highp float;
uniform float u_t;
uniform vec2 u_res;
uniform float u_mode; // 0=watch 1=work 2=wrap
#define TAU 6.28318530718
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ return noise(p)*.5+noise(p*2.1+vec2(1.7,9.2))*.25+noise(p*4.3)*.125; }
vec3 thinFilm(float c,float th){ float o=2.*th*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-c*c))); return .5+.5*cos(TAU*o/vec3(.65,.55,.45)); }
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;
  float ar=u_res.x/u_res.y; uv.x*=ar;
  float R=0.78;
  vec3 ro=vec3(0.,0.,2.3), rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, disc=b*b-c;
  if(disc<0.){gl_FragColor=vec4(0.);return;}
  float sqD=sqrt(disc);
  float t1=max(-b-sqD,0.), t2=-b+sqD;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  float edgeAA=smoothstep(0.,.005,sqD);
  vec3 pF=ro+rd*t1, N=normalize(pF), V=-rd;
  float NoV=max(dot(N,V),0.);
  float phi=atan(pF.z,pF.x), theta=acos(clamp(pF.y/max(length(pF),.001),-1.,1.));
  float thick=.28+fbm(vec2(phi*.6+u_t*.020,theta-.015*u_t))*.65;
  vec3 film=thinFilm(NoV,thick);
  float rim=pow(1.-NoV,5.)*1.1;
  // Mode-based color
  vec3 baseA=mix(vec3(.06,.10,.42),vec3(.55,.68,.96),NoV*.6);
  vec3 baseB=mix(vec3(.04,.20,.15),vec3(.30,.80,.70),NoV*.6);
  vec3 baseC=mix(vec3(.20,.08,.40),vec3(.70,.55,.95),NoV*.6);
  float m=mod(u_mode,3.);
  vec3 base=m<1. ? mix(baseA,baseB,m) : m<2. ? mix(baseB,baseC,m-1.) : mix(baseC,baseA,m-2.);
  vec3 col=mix(base,film*.98,.82)+rim*.5*vec3(.4,.6,1.);
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col=clamp(col,0.,1.);
  gl_FragColor=vec4(col*edgeAA,edgeAA);
}`;

function MiniOrb({ size, mode }: { size: number; mode: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size * dpr); c.height = Math.round(size * dpr);
    const gl = c.getContext("webgl", { alpha: true, premultipliedAlpha: false })!;
    if (!gl) return;
    const mkS = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const p = gl.createProgram()!;
    gl.attachShader(p, mkS(gl.VERTEX_SHADER, MINI_VERT));
    gl.attachShader(p, mkS(gl.FRAGMENT_SHADER, MINI_FRAG));
    gl.linkProgram(p); gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(p, "a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const uT = gl.getUniformLocation(p, "u_t");
    const uR = gl.getUniformLocation(p, "u_res");
    const uM = gl.getUniformLocation(p, "u_mode");
    const draw = (ts: number) => {
      gl.viewport(0, 0, c.width, c.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * .001); gl.uniform2f(uR, c.width, c.height); gl.uniform1f(uM, mode);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [size, mode]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "block", filter: "drop-shadow(0 0 30px rgba(80,130,255,0.50))" }} />;
}

// ── Gate card ──────────────────────────────────────────────────────────────────
const GATES = [
  { num: "01", name: "Strategy",  desc: "Does this serve your goals?",       color: "#4a90f5" },
  { num: "02", name: "Voice",     desc: "Does this sound like you?",          color: "#50c8a0" },
  { num: "03", name: "Accuracy",  desc: "Are the facts correct?",             color: "#f5a623" },
  { num: "04", name: "AI Tells",  desc: "Could anyone spot the AI?",          color: "#e85d75" },
  { num: "05", name: "Audience",  desc: "Will this resonate?",                color: "#a080f5" },
  { num: "06", name: "Platform",  desc: "Is this native to the channel?",     color: "#4ab8f5" },
  { num: "07", name: "Impact",    desc: "Will this move people to action?",   color: "#f5d020" },
];
function GateCard({ num, name, desc, color, delay }: { num: string; name: string; desc: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      padding: "28px 24px", borderRadius: 20, textAlign: "left",
      background: `${color}0f`, border: `1px solid ${color}28`,
      opacity: vis ? 1 : 0, transform: vis ? "scale(1)" : "scale(0.94)",
      transition: `all .55s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", color: `${color}99`, marginBottom: 8, fontWeight: 600 }}>{num}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const BG_DARK = "#080b18";
  const BG_MID  = "#0d1130";

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif", background: BG_DARK, color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(255,220,80,.28); color: #fff; }
        html { scroll-behavior: smooth; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Fixed nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 40 ? "rgba(8,11,24,0.88)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(16px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all .4s ease",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "baseline", gap: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,.90)" }}>EVERY</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,.36)" }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", color: "rgba(255,255,255,.30)", marginLeft: 5, textTransform: "uppercase" }}>Studio™</span>
        </button>
        <button onClick={() => navigate("/auth")} style={{
          background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 100, padding: "8px 22px", color: "rgba(255,255,255,.80)",
          fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Afacad Flux',sans-serif",
          transition: "all .25s",
        }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.14)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.08)"; }}
        >Get Early Access →</button>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 40px 80px",
        background: `radial-gradient(ellipse at 50% 40%, #2535c8 0%, #131a6e 40%, ${BG_DARK} 75%)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Animated grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800 }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <MiniOrb size={120} mode={0} />
          </div>
          <RevealText
            text="One idea. Everywhere."
            size="clamp(52px,8vw,100px)" weight={700} lineHeight={.95}
            color="#fff" center delay={0.1}
          />
          <div style={{ marginTop: 20 }}>
            <RevealText
              text="EVERYWHERE Studio orchestrates your thinking into content that lands everywhere your audience is — with the fidelity of your voice, the strategy of a team, and the speed of AI."
              size="clamp(17px,2.2vw,22px)" weight={400} lineHeight={1.6}
              color="rgba(255,255,255,.58)" center delay={0.3} maxWidth="680px"
            />
          </div>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 44, flexWrap: "wrap" }}>
            {([ ["40+", "Intelligent Agents"], ["12", "Output Formats"], ["7", "Quality Gates"], ["94.7", "Voice Fidelity Score"] ] as [string,string][]).map(([n, l], i) => (
              <StatPill key={i} number={n} label={l} delay={0.4 + i * 0.08} />
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", opacity: .4 }}>
          <div style={{ width: 1, height: 48, background: "rgba(255,255,255,.4)", margin: "0 auto 8px", animation: "float 2s ease-in-out infinite" }} />
          <div style={{ fontSize: 10, letterSpacing: ".14em", color: "rgba(255,255,255,.5)", textTransform: "uppercase", textAlign: "center" }}>Scroll</div>
        </div>
      </section>

      {/* ── SECTION LABEL ─────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 0 60px" }}>
        <Divider label="The Three Rooms" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 1 — WATCH */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 40px 120px",
        background: `linear-gradient(180deg, ${BG_DARK} 0%, #0a0f28 100%)`,
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px 60px", alignItems: "center" }}>

            {/* Left: orb + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ animation: "float 4s ease-in-out infinite" }}>
                <MiniOrb size={240} mode={0} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(100,160,255,.70)", textTransform: "uppercase", marginBottom: 8 }}>Room One</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>WATCH</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,.40)", marginTop: 6 }}>The Signal Room</div>
              </div>
            </div>

            {/* Right: content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <RevealText
                text="Your Sentinel scans the world so you never miss a signal."
                size="clamp(26px,3.2vw,38px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <RevealText
                text="While you sleep, WATCH monitors hundreds of sources — industry news, competitor moves, trending conversations — and surfaces only what matters to your work."
                size={16} weight={400} lineHeight={1.65} color="rgba(255,255,255,.55)" delay={0.3}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                <FeatureRow icon="📡" title="Sentinel Briefings" desc="AI-curated signal reports delivered to your studio every morning." delay={0.2} accent="#4a90f5" />
                <FeatureRow icon="🎯" title="Interest Graph" desc="Learns what matters to your audience and filters everything else out." delay={0.3} accent="#4a90f5" />
                <FeatureRow icon="⚡" title="Fish Score" desc="Rates each signal by relevance, timeliness, and content potential." delay={0.4} accent="#4a90f5" />
                <FeatureRow icon="🔗" title="Write From Signal" desc="One click turns any signal into a fully sourced content brief." delay={0.5} accent="#4a90f5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: "20px 0 60px" }}>
        <Divider label="↓" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 2 — WORK */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 40px 120px",
        background: `linear-gradient(180deg, #0a0f28 0%, #0c1420 100%)`,
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px 60px", alignItems: "center" }}>

            {/* Left: content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <RevealText
                text="Forty agents transform your voice into twelve formats."
                size="clamp(26px,3.2vw,38px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <RevealText
                text="WORK is the engine room. Tell Watson what you're thinking — a rough idea, a voice memo, a half-formed thesis — and the agent orchestra turns it into everything: newsletter, LinkedIn, Sunday story, talk outline, video script."
                size={16} weight={400} lineHeight={1.65} color="rgba(255,255,255,.55)" delay={0.3}
              />

              {/* Output format grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {["LinkedIn Post", "Newsletter", "Sunday Story", "Podcast Script", "Twitter Thread", "Essay", "Short Video", "Substack Note", "Talk Outline", "Email Campaign", "Blog Post", "Executive Brief"].map((f, i) => (
                    <span key={i} style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: 100,
                      background: "rgba(74,144,245,0.12)", border: "1px solid rgba(74,144,245,0.25)",
                      color: "rgba(255,255,255,.70)", letterSpacing: ".02em",
                    }}>{f}</span>
                  ))}
              </div>
            </div>

            {/* Right: orb + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ animation: "float 4.5s ease-in-out infinite" }}>
                <MiniOrb size={240} mode={1} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(80,220,180,.70)", textTransform: "uppercase", marginBottom: 8 }}>Room Two</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>WORK</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,.40)", marginTop: 6 }}>The Engine Room</div>
              </div>
            </div>
          </div>

          {/* Voice DNA callout */}
          <div style={{ marginTop: 80 }}>
            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 24, padding: "40px 48px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
                <div>
                  <RevealText text="Voice DNA" size={28} weight={700} color="#fff" delay={0.1} />
                  <div style={{ marginTop: 12 }}>
                    <RevealText
                      text="We capture your authentic voice across five dimensions — so every output sounds exactly like you, no matter the format."
                      size={15} weight={400} color="rgba(255,255,255,.52)" lineHeight={1.65} delay={0.25}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Vocabulary & Syntax",   88],
                    ["Tonal Register",        94],
                    ["Rhythm & Cadence",      91],
                    ["Metaphor Patterns",     87],
                    ["Structural Habits",     96],
                  ].map(([label, score], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", width: 160, flexShrink: 0 }}>{label}</div>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 2,
                          width: `${score}%`,
                          background: "linear-gradient(90deg, #4a90f5, #a0c8ff)",
                          transition: `width 1s ${0.2 + i * 0.1}s cubic-bezier(.16,1,.3,1)`,
                        }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", width: 32, textAlign: "right" }}>{score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: "20px 0 60px" }}>
        <Divider label="↓" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACT 3 — WRAP */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 40px 120px",
        background: `linear-gradient(180deg, #0c1420 0%, #100d28 100%)`,
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px 60px", alignItems: "center" }}>

            {/* Left: orb + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ animation: "float 5s ease-in-out infinite" }}>
                <MiniOrb size={240} mode={2} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(180,140,255,.70)", textTransform: "uppercase", marginBottom: 8 }}>Room Three</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>WRAP</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,.40)", marginTop: 6 }}>The Distribution Room</div>
              </div>
            </div>

            {/* Right: content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <RevealText
                text="Schedule, deploy, measure. Your thinking in the world."
                size="clamp(26px,3.2vw,38px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <RevealText
                text="WRAP closes the loop. Schedule posts across platforms, deliver newsletters, track what lands — and feed the data back into WATCH so your next idea is sharper than the last."
                size={16} weight={400} lineHeight={1.65} color="rgba(255,255,255,.55)" delay={0.3}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                <FeatureRow icon="📅" title="Content Calendar" desc="Visual scheduling across all your channels from a single canvas." delay={0.2} accent="#a080f5" />
                <FeatureRow icon="🚀" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social — simultaneously." delay={0.3} accent="#a080f5" />
                <FeatureRow icon="📊" title="Performance Loop" desc="Engagement data flows back to sharpen your next content strategy." delay={0.4} accent="#a080f5" />
                <FeatureRow icon="🔄" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." delay={0.5} accent="#a080f5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 QUALITY GATES ───────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 40px",
        background: `linear-gradient(180deg, #100d28 0%, ${BG_DARK} 100%)`,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <RevealText text="Nothing ships without passing the gates." size="clamp(32px,5vw,58px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.1} />
          <div style={{ marginTop: 16 }}>
            <RevealText text="Every piece of content runs through 7 quality gates before it reaches your audience. No AI tells. No off-brand moments. No weak writing." size={17} weight={400} lineHeight={1.6} color="rgba(255,255,255,.50)" center delay={0.25} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 56 }}>
            {GATES.map(({ num, name, desc, color }, i) => (
              <GateCard key={i} num={num} name={name} desc={desc} color={color} delay={0.1 + i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: "120px 40px 100px",
        background: `radial-gradient(ellipse at 50% 100%, #2535c8 0%, #0d1040 45%, ${BG_DARK} 75%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <MiniOrb size={100} mode={0} />
          </div>
          <RevealText
            text="Your thinking deserves to be everywhere."
            size="clamp(36px,5.5vw,68px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.1}
          />
          <div style={{ marginTop: 16 }}>
            <RevealText
              text="Join thought leaders building their content presence with EVERYWHERE Studio."
              size={18} weight={400} lineHeight={1.6} color="rgba(255,255,255,.52)" center delay={0.3}
            />
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 44, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/auth")} style={{
              background: "#fff", border: "none", borderRadius: 100, padding: "16px 48px",
              fontSize: 16, fontWeight: 700, color: "#1e2da0", cursor: "pointer",
              fontFamily: "'Afacad Flux',sans-serif",
              boxShadow: "0 8px 40px rgba(80,100,255,.40)",
              transition: "all .3s cubic-bezier(.16,1,.3,1)",
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "none"; }}
            >
              Get Early Access
            </button>
            <button onClick={() => navigate("/studio/dashboard")} style={{
              background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)",
              borderRadius: 100, padding: "16px 48px",
              fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,.80)", cursor: "pointer",
              fontFamily: "'Afacad Flux',sans-serif", transition: "all .3s",
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,.08)"; }}
            >
              Open Studio
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 40px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,.70)" }}>EVERY</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,.25)" }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".15em", color: "rgba(255,255,255,.22)", marginLeft: 5, textTransform: "uppercase" }}>Studio™</span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.22)", letterSpacing: ".06em" }}>
          © 2025 Mixed Grill LLC · Ideas to Impact
        </span>
      </footer>
    </div>
  );
}
