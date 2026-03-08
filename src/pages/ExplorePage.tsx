import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE
// Cinematic scroll narrative. Three acts: Watch / Work / Wrap.
// Aesthetic: Apple-minimalist meets tech-forward dark. Large type, clean grid,
// word-by-word scroll reveals, morphing WebGL orbs per section.
// No emojis. No em-dashes. 2-letter icon abbreviations only.
// ─────────────────────────────────────────────────────────────────────────────

// ── WebGL mini orb (mode 0=blue/watch, 1=teal/work, 2=violet/wrap) ────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;
const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform float u_mode;
#define TAU 6.28318530718
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ return noise(p)*.5+noise(p*2.1+1.7)*.25+noise(p*4.3+2.8)*.125; }
vec3 film(float c,float t){ float o=2.*t*sqrt(max(0.,1.-(.48)*(1.-c*c))); return .5+.5*cos(TAU*o/vec3(.65,.55,.45)); }
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.; uv.x*=u_res.x/u_res.y;
  float R=.78; vec3 ro=vec3(0.,0.,2.3), rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, d=b*b-c;
  if(d<0.){gl_FragColor=vec4(0.);return;}
  float sd=sqrt(d); float t1=max(-b-sd,0.),t2=-b+sd;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  vec3 P=ro+rd*t1, N=normalize(P), V=-rd; float NoV=max(dot(N,V),0.);
  float phi=atan(P.z,P.x), th=acos(clamp(P.y/max(length(P),.001),-1.,1.));
  float tk=.28+fbm(vec2(phi*.6+u_t*.02,th-.015*u_t))*.65;
  vec3 f=film(NoV,tk); float rim=pow(1.-NoV,5.)*1.1;
  vec3 cA=mix(vec3(.06,.10,.42),vec3(.50,.68,.98),NoV*.6);
  vec3 cB=mix(vec3(.04,.18,.14),vec3(.28,.78,.68),NoV*.6);
  vec3 cC=mix(vec3(.18,.07,.38),vec3(.68,.52,.95),NoV*.6);
  float m=mod(u_mode,3.);
  vec3 base=m<1.?mix(cA,cB,m):m<2.?mix(cB,cC,m-1.):mix(cC,cA,m-2.);
  vec3 col=mix(base,f*.98,.80)+rim*.55*vec3(.4,.6,1.);
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  gl_FragColor=vec4(clamp(col,0.,1.)*smoothstep(0.,.006,sd),smoothstep(0.,.006,sd));
}`;

function Orb({ size, mode }: { size: number; mode: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size * dpr); c.height = Math.round(size * dpr);
    const gl = c.getContext("webgl", { alpha: true, premultipliedAlpha: false })!;
    if (!gl) return;
    const sh = (t: number, s: string) => { const x = gl.createShader(t)!; gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
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
  return (
    <canvas ref={ref} style={{
      width: size, height: size, display: "block",
      filter: "drop-shadow(0 0 40px rgba(80,120,255,0.45))",
    }} />
  );
}

// ── Word-by-word scroll reveal ─────────────────────────────────────────────
function Reveal({
  text, delay = 0, size = "inherit", weight = 400,
  color = "#fff", lineHeight = 1.2, center = false, maxWidth,
}: {
  text: string; delay?: number; size?: string | number;
  weight?: number; color?: string; lineHeight?: number;
  center?: boolean; maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ maxWidth, textAlign: center ? "center" : "left" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.26em",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(14px)",
          transition: `opacity .55s ${delay + i * 0.038}s cubic-bezier(.16,1,.3,1),
                       transform .55s ${delay + i * 0.038}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

// ── Fade-in wrapper ───────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, from = "up" }: {
  children: React.ReactNode; delay?: number; from?: "up" | "left" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  const startT = from === "up" ? "translateY(20px)" : from === "left" ? "translateX(-20px)" : "none";
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : startT,
      transition: `opacity .6s ${delay}s cubic-bezier(.16,1,.3,1), transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

// ── Feature row (2-letter abbr icon, no emojis) ────────────────────────────
function FeatureRow({ abbr, title, desc, delay = 0, accent = "#4a90f5" }: {
  abbr: string; title: string; desc: string; delay?: number; accent?: string;
}) {
  return (
    <FadeIn delay={delay} from="left">
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${accent}18`, border: `1px solid ${accent}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: accent, letterSpacing: "0.05em",
          fontFamily: "var(--font)",
        }}>{abbr}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.46)", lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </FadeIn>
  );
}

// ── Gate card component (extracted to avoid hook-in-map) ──────────────────
function GateCard({ num, name, desc, color, delay }: {
  num: string; name: string; desc: string; color: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      padding: "24px 22px", borderRadius: 16, textAlign: "left",
      background: `${color}0d`, border: `1px solid ${color}22`,
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)",
      transition: `opacity .5s ${delay}s cubic-bezier(.16,1,.3,1), transform .5s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: ".14em", color: `${color}88`, marginBottom: 10, fontWeight: 700 }}>{num}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{name}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.42)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────
function StatPill({ num, label, delay = 0 }: { num: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
      transition: `all .65s ${delay}s cubic-bezier(.16,1,.3,1)`,
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(255,255,255,.09)",
      borderRadius: 14, padding: "22px 28px", textAlign: "center",
      backdropFilter: "blur(12px)",
      minWidth: 110,
    }}>
      <div style={{ fontSize: "clamp(32px,5vw,54px)", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>{num}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.42)", marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, maxWidth: 960, margin: "0 auto", padding: "0 40px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
      <span style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(255,255,255,.24)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
    </div>
  );
}

// ── Voice DNA bar ─────────────────────────────────────────────────────────
function DnaBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 12,
      opacity: vis ? 1 : 0, transition: `opacity .5s ${delay}s ease` }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.50)", width: 154, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #4a90f5, #90c8ff)",
          width: vis ? `${score}%` : "0%",
          transition: `width 1.1s ${delay + 0.1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", width: 28, textAlign: "right" }}>{score}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const BG = "#07090f";

export default function ExplorePage() {
  const nav = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif", background: BG, color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 40 ? "rgba(7,9,15,0.90)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all .4s ease",
      }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,.92)", letterSpacing: "-.01em" }}>EVERY</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,.30)", letterSpacing: "-.01em" }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".18em", color: "rgba(255,255,255,.25)", marginLeft: 6, textTransform: "uppercase" }}>Studio</span>
        </button>
        <button
          onClick={() => nav("/auth")}
          style={{
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 100, padding: "7px 22px",
            color: "rgba(255,255,255,.75)", fontSize: 13, fontWeight: 500,
            fontFamily: "'Afacad Flux',sans-serif",
            transition: "background .2s, color .2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.13)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.75)"; }}
        >
          Get Early Access
        </button>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "130px 40px 100px",
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, #1e2faa 0%, #0d1455 40%, ${BG} 75%)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Fine grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.028,
          backgroundImage: "linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 820 }}>
          {/* Orb */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "center", animation: "float 5s ease-in-out infinite" }}>
            <Orb size={108} mode={0} />
          </div>

          <Reveal
            text="One idea. Everywhere."
            size="clamp(52px,8.5vw,106px)" weight={700} lineHeight={.94}
            color="#fff" center delay={0.08}
          />
          <div style={{ marginTop: 22 }}>
            <Reveal
              text="EVERYWHERE Studio orchestrates your thinking into content that lands everywhere your audience is. The fidelity of your voice. The strategy of a team. The speed of AI."
              size="clamp(16px,2vw,20px)" weight={400} lineHeight={1.65}
              color="rgba(255,255,255,.52)" center delay={0.28} maxWidth="680px"
            />
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
            {[["40+","Intelligent Agents"],["12","Output Formats"],["7","Quality Gates"],["94.7","Voice Fidelity"]].map(([n,l],i) => (
              <StatPill key={i} num={n} label={l} delay={0.4 + i * 0.07} />
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", opacity: 0.35 }}>
          <div style={{ width: 1, height: 40, background: "#fff", margin: "0 auto 8px", animation: "float 2.2s ease-in-out infinite" }} />
          <div style={{ fontSize: 9, letterSpacing: ".18em", color: "rgba(255,255,255,.5)", textTransform: "uppercase", textAlign: "center" }}>Scroll</div>
        </div>
      </section>

      {/* ── THE THREE ROOMS label ─────────────────────────────────── */}
      <div style={{ padding: "80px 0 64px" }}>
        <Divider label="The Three Rooms" />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 1 — WATCH                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "0 40px 120px",
        background: `linear-gradient(180deg, ${BG} 0%, #080c22 100%)`,
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "64px 80px", alignItems: "center",
          }}>
            {/* Orb side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ animation: "float 4.5s ease-in-out infinite" }}>
                <Orb size={260} mode={0} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: ".18em", color: "rgba(100,155,255,.65)", textTransform: "uppercase", marginBottom: 6 }}>Room One</div>
                <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", lineHeight: 1 }}>WATCH</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", marginTop: 8 }}>The Signal Room</div>
              </div>
            </div>

            {/* Content side */}
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal
                text="Your Sentinel scans the world so you never miss a signal."
                size="clamp(24px,3vw,36px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <Reveal
                text="While you sleep, WATCH monitors hundreds of sources. Industry news, competitor moves, trending conversations. It surfaces only what matters to your work."
                size={15} weight={400} lineHeight={1.7} color="rgba(255,255,255,.50)" delay={0.28}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 6 }}>
                <FeatureRow abbr="SB" title="Sentinel Briefings" desc="AI-curated signal reports delivered to your studio every morning." delay={0.1} accent="#4a90f5" />
                <FeatureRow abbr="IG" title="Interest Graph" desc="Learns what matters to your audience and filters everything else out." delay={0.2} accent="#4a90f5" />
                <FeatureRow abbr="FS" title="Fish Score" desc="Rates each signal by relevance, timeliness, and content potential." delay={0.3} accent="#4a90f5" />
                <FeatureRow abbr="WS" title="Write From Signal" desc="One tap turns any signal into a fully sourced content brief." delay={0.4} accent="#4a90f5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: "0 0 80px" }}><Divider label="Next" /></div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 2 — WORK                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "0 40px 120px",
        background: "linear-gradient(180deg, #080c22 0%, #090e1e 100%)",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "64px 80px", alignItems: "center",
          }}>
            {/* Content side */}
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal
                text="Forty agents transform your voice into twelve formats."
                size="clamp(24px,3vw,36px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <Reveal
                text="WORK is the engine room. Tell Watson what you are thinking. A rough idea, a voice memo, a half-formed thesis. The agent orchestra turns it into everything: newsletter, LinkedIn, Sunday story, talk outline, video script."
                size={15} weight={400} lineHeight={1.7} color="rgba(255,255,255,.50)" delay={0.28}
              />
              {/* Format pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                {["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"].map((f, i) => (
                  <span key={i} style={{
                    fontSize: 12, padding: "5px 12px", borderRadius: 100,
                    background: "rgba(74,144,245,0.10)", border: "1px solid rgba(74,144,245,0.20)",
                    color: "rgba(255,255,255,.62)", letterSpacing: ".01em",
                  }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Orb side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ animation: "float 5s ease-in-out infinite" }}>
                <Orb size={260} mode={1} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: ".18em", color: "rgba(60,210,160,.65)", textTransform: "uppercase", marginBottom: 6 }}>Room Two</div>
                <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", lineHeight: 1 }}>WORK</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", marginTop: 8 }}>The Engine Room</div>
              </div>
            </div>
          </div>

          {/* Voice DNA */}
          <div style={{ marginTop: 80 }}>
            <FadeIn delay={0.1}>
              <div style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 20, padding: "40px 48px",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(100,155,255,.65)", textTransform: "uppercase", marginBottom: 14 }}>Voice DNA</div>
                    <Reveal text="Every output sounds exactly like you." size={24} weight={700} color="#fff" delay={0.1} />
                    <div style={{ marginTop: 12 }}>
                      <Reveal
                        text="We capture your authentic voice across five dimensions. No matter the format, readers will know it is you."
                        size={14} weight={400} color="rgba(255,255,255,.46)" lineHeight={1.65} delay={0.25}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <DnaBar label="Vocabulary and Syntax" score={88} delay={0.1} />
                    <DnaBar label="Tonal Register" score={94} delay={0.18} />
                    <DnaBar label="Rhythm and Cadence" score={91} delay={0.26} />
                    <DnaBar label="Metaphor Patterns" score={87} delay={0.34} />
                    <DnaBar label="Structural Habits" score={96} delay={0.42} />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div style={{ padding: "0 0 80px" }}><Divider label="Next" /></div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 3 — WRAP                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "0 40px 120px",
        background: "linear-gradient(180deg, #090e1e 0%, #0c0a20 100%)",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "64px 80px", alignItems: "center",
          }}>
            {/* Orb side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ animation: "float 5.5s ease-in-out infinite" }}>
                <Orb size={260} mode={2} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: ".18em", color: "rgba(168,130,255,.65)", textTransform: "uppercase", marginBottom: 6 }}>Room Three</div>
                <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", lineHeight: 1 }}>WRAP</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", marginTop: 8 }}>The Distribution Room</div>
              </div>
            </div>

            {/* Content side */}
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Reveal
                text="Schedule, deploy, measure. Your thinking in the world."
                size="clamp(24px,3vw,36px)" weight={700} lineHeight={1.15} color="#fff" delay={0.1}
              />
              <Reveal
                text="WRAP closes the loop. Schedule posts across platforms, deliver newsletters, track what lands. The data feeds back into WATCH so your next idea is sharper than the last."
                size={15} weight={400} lineHeight={1.7} color="rgba(255,255,255,.50)" delay={0.28}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 6 }}>
                <FeatureRow abbr="CC" title="Content Calendar" desc="Visual scheduling across all your channels from a single canvas." delay={0.1} accent="#a080f5" />
                <FeatureRow abbr="OD" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." delay={0.2} accent="#a080f5" />
                <FeatureRow abbr="PL" title="Performance Loop" desc="Engagement data flows back to sharpen your next content strategy." delay={0.3} accent="#a080f5" />
                <FeatureRow abbr="FW" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." delay={0.4} accent="#a080f5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 QUALITY GATES ──────────────────────────────────────── */}
      <section style={{
        padding: "100px 40px 120px",
        background: "linear-gradient(180deg, #0c0a20 0%, #07090f 100%)",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <Reveal
            text="Nothing ships without passing the gates."
            size="clamp(30px,5vw,56px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.1}
          />
          <div style={{ marginTop: 14, marginBottom: 56 }}>
            <Reveal
              text="Every piece of content runs through 7 quality gates before it reaches your audience. No AI tells. No off-brand moments. No weak writing."
              size={16} weight={400} lineHeight={1.65} color="rgba(255,255,255,.44)" center delay={0.25}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[
              ["01","Strategy", "Does this serve your goals?",            "#4a90f5"],
              ["02","Voice",    "Does this sound like you?",              "#50c8a0"],
              ["03","Accuracy", "Are the facts correct?",                 "#f5a623"],
              ["04","AI Tells", "Could anyone spot the AI?",              "#e85d75"],
              ["05","Audience", "Will this resonate?",                    "#a080f5"],
              ["06","Platform", "Is this native to the channel?",         "#4ab8f5"],
              ["07","Impact",   "Will this move people to action?",       "#f5d020"],
            ].map(([num, name, desc, color], i) => (
              <GateCard key={i} num={num} name={name} desc={desc} color={color} delay={0.06 + i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section style={{
        padding: "120px 40px 100px",
        background: `radial-gradient(ellipse 90% 60% at 50% 100%, #1e2faa 0%, #0c1038 50%, ${BG} 80%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36, animation: "float 4s ease-in-out infinite" }}>
            <Orb size={88} mode={0} />
          </div>
          <Reveal
            text="Your thinking deserves to be everywhere."
            size="clamp(34px,5.5vw,66px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.1}
          />
          <div style={{ marginTop: 16 }}>
            <Reveal
              text="Join thought leaders building their content presence with EVERYWHERE Studio."
              size={17} weight={400} lineHeight={1.6} color="rgba(255,255,255,.48)" center delay={0.28}
            />
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
            <button
              onClick={() => nav("/auth")}
              style={{
                background: "#fff", border: "none", borderRadius: 100,
                padding: "15px 48px", fontSize: 15, fontWeight: 700,
                color: "#1a2090", fontFamily: "'Afacad Flux',sans-serif",
                boxShadow: "0 8px 40px rgba(70,90,255,.35)",
                transition: "all .3s cubic-bezier(.16,1,.3,1)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              Get Early Access
            </button>
            <button
              onClick={() => nav("/studio/dashboard")}
              style={{
                background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 100, padding: "15px 48px", fontSize: 15, fontWeight: 600,
                color: "rgba(255,255,255,.78)", fontFamily: "'Afacad Flux',sans-serif",
                transition: "all .3s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.13)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.78)"; }}
            >
              Open Studio
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{
        padding: "28px 48px",
        borderTop: "1px solid rgba(255,255,255,.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,.65)" }}>EVERY</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,.22)" }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".16em", color: "rgba(255,255,255,.20)", marginLeft: 5, textTransform: "uppercase" }}>Studio</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.20)", letterSpacing: ".05em" }}>
          2025 Mixed Grill LLC · Ideas to Impact
        </span>
      </footer>
    </div>
  );
}
