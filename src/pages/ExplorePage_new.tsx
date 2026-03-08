import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE v9.2
// No hero orb · Siri orbs in section panels (blue/teal/violet) · Light+Dark mode
// Fixed overflow · Tighter padding · Beautiful in both modes
// ─────────────────────────────────────────────────────────────────────────────

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// Siri orb shader — accepts u_palette (0=blue, 1=teal, 2=violet)
const SIRI_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_palette; // 0=blue 1=teal 2=violet
uniform float u_light;   // 0=dark 1=light

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float lobe(vec3 p, vec3 center, float radius){
  float d = length(p - center);
  return exp(-d*d / (radius*radius));
}

void main(){
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  uv.x *= u_res.x / u_res.y;

  vec3 ro = vec3(0., 0., 2.4);
  vec3 rd = normalize(vec3(uv, -1.7));

  float R = 0.78;
  float b = dot(ro, rd);
  float c = dot(ro, ro) - R*R;
  float disc = b*b - c;
  if(disc < 0.0){ gl_FragColor = vec4(0.); return; }

  float sqD = sqrt(disc);
  float edgeAA = smoothstep(0., 0.006, sqD);
  float t1 = max(-b - sqD, 0.0);
  float t2 = -b + sqD;
  if(t2 < 0.0){ gl_FragColor = vec4(0.); return; }

  vec3 hitFront = ro + rd * t1;
  vec3 N = normalize(hitFront);
  vec3 V = -rd;
  float NoV = max(dot(N, V), 0.0);

  float rx = u_mouse.y * 0.7;
  float ry = u_mouse.x * 0.7;
  // Breathing energy
  float breathe = 0.12 + 0.08 * sin(u_t * 0.8);
  float spd = (1.0 + (u_energy + breathe) * 1.8);
  float t = u_t * spd;

  vec3 c1 = vec3(sin(t*0.41+0.0)*0.38, cos(t*0.37+1.1)*0.35, sin(t*0.29+2.3)*0.30);
  vec3 c2 = vec3(sin(t*0.53+3.5)*0.42, cos(t*0.44+0.7)*0.38, sin(t*0.35+1.8)*0.32);
  vec3 c3 = vec3(cos(t*0.38+2.1)*0.36, sin(t*0.61+4.2)*0.30, cos(t*0.47+0.4)*0.34);
  vec3 c4 = vec3(cos(t*0.28+5.1)*0.40, sin(t*0.33+2.8)*0.36, cos(t*0.52+3.3)*0.28);

  // Blue palette
  vec3 b1 = vec3(0.10, 0.35, 1.00);
  vec3 b2 = vec3(0.20, 0.60, 1.00);
  vec3 b3 = vec3(0.40, 0.75, 1.00);
  vec3 b4 = vec3(0.60, 0.90, 1.00);

  // Teal palette
  vec3 t1v = vec3(0.05, 0.75, 0.80);
  vec3 t2v = vec3(0.10, 0.90, 0.85);
  vec3 t3v = vec3(0.20, 0.70, 0.90);
  vec3 t4v = vec3(0.05, 0.55, 0.70);

  // Violet palette
  vec3 v1 = vec3(0.60, 0.20, 1.00);
  vec3 v2 = vec3(0.40, 0.15, 0.90);
  vec3 v3 = vec3(0.75, 0.35, 1.00);
  vec3 v4 = vec3(0.50, 0.10, 0.80);

  float p01 = clamp(u_palette, 0.0, 1.0);
  float p12 = clamp(u_palette - 1.0, 0.0, 1.0);

  vec3 col1 = mix(mix(b1, t1v, p01), v1, p12);
  vec3 col2 = mix(mix(b2, t2v, p01), v2, p12);
  vec3 col3 = mix(mix(b3, t3v, p01), v3, p12);
  vec3 col4 = mix(mix(b4, t4v, p01), v4, p12);

  float span = t2 - t1;
  vec3 interior = vec3(0.);
  for(int i = 0; i < 14; i++){
    float fi = float(i) / 13.0;
    vec3 p = ro + rd * (t1 + span * (fi * 0.88 + 0.06));
    p.yz = rot2(rx) * p.yz;
    p.xz = rot2(ry) * p.xz;
    float l1 = lobe(p, c1, 0.38);
    float l2 = lobe(p, c2, 0.42);
    float l3 = lobe(p, c3, 0.35);
    float l4 = lobe(p, c4, 0.40);
    float depth = 1.0 - fi * 0.45;
    interior += (col1*l1*2.0 + col2*l2*1.8 + col3*l3*1.6 + col4*l4*1.5) * depth;
  }
  interior /= 14.0;
  interior *= 1.0 + u_energy * 0.7 + breathe * 0.4;

  float fresnel = pow(1.0 - NoV, 3.2);

  // Light mode: lighter glass shell
  vec3 faceCol = mix(vec3(0.55,0.72,0.98), col1 * 0.5 + col2 * 0.5, 0.3);
  faceCol = mix(faceCol, vec3(0.85,0.90,0.98), u_light * 0.3);
  vec3 shellTint = mix(faceCol, vec3(0.95,0.97,1.00), fresnel);

  vec3 L1 = normalize(vec3(-0.5, 0.9, 0.6));
  vec3 H1 = normalize(L1 + V);
  float spec1 = pow(max(dot(N,H1),0.0), 200.0) * 2.0;
  vec3 L2 = normalize(vec3(0.7,0.2,0.8));
  vec3 H2 = normalize(L2 + V);
  float spec2 = pow(max(dot(N,H2),0.0), 70.0) * 0.6;

  float glassAlpha = 0.15 + fresnel * 0.72;
  // In light mode, slightly more opaque shell
  glassAlpha += u_light * 0.08;

  vec3 col = interior*(1.0-glassAlpha*0.55) + shellTint*glassAlpha;
  col += vec3(1.0,0.98,0.96) * (spec1 + spec2);

  // Center glow — tinted by palette
  float cg = exp(-dot(uv,uv)*3.0) * 0.30 * (1.0 + u_energy * 0.5);
  col += mix(col2, vec3(1.0), 0.3) * cg;

  col = col / (col + 0.85);
  col = pow(max(col, 0.0), vec3(0.86));

  float alpha = edgeAA * (0.85 + fresnel * 0.15);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

class OrbSpring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(stf=0.05,dmp=0.88){
    this.vx+=(this.tx-this.x)*stf; this.vy+=(this.ty-this.y)*stf;
    this.vx*=dmp; this.vy*=dmp;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// palette: 0=blue, 1=teal, 2=violet
function SiriOrb({ size, palette, light }: { size: number; palette: number; light: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new OrbSpring());
  const raf = useRef(0);
  const paletteRef = useRef(palette);
  const lightRef = useRef(light ? 1 : 0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const energyRef = useRef(0.1);

  useEffect(() => { paletteRef.current = palette; }, [palette]);
  useEffect(() => { lightRef.current = light ? 1 : 0; }, [light]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const mkS = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, SIRI_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT = gl.getUniformLocation(prog, "u_t");
    const uR = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uEnergy = gl.getUniformLocation(prog, "u_energy");
    const uPalette = gl.getUniformLocation(prog, "u_palette");
    const uLight = gl.getUniformLocation(prog, "u_light");

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left - size/2) / size;
      const dy = (e.clientY - rect.top - size/2) / size;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const proximity = Math.max(0, 1 - dist * 2.5);
      energyRef.current = proximity * 0.5;
      mouseRef.current = { x: dx * 2, y: -dy * 2 };
    };
    window.addEventListener("mousemove", onMove);

    const start = performance.now();
    const loop = () => {
      spring.current.tx = mouseRef.current.x * 0.35;
      spring.current.ty = mouseRef.current.y * 0.35;
      spring.current.step();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const ts = (performance.now() - start) * 0.001;
      gl.uniform1f(uT, ts);
      gl.uniform1f(uEnergy, energyRef.current);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uMouse, spring.current.x, spring.current.y);
      gl.uniform1f(uPalette, paletteRef.current);
      gl.uniform1f(uLight, lightRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: "block" }} />;
}

// ── Intersection-based reveals ────────────────────────────────────────────────
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(16px)",
      transition: `opacity .6s ${delay}s cubic-bezier(.16,1,.3,1), transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

function WordReveal({ text, size, weight = 700, color, lineHeight = 1.15, delay = 0, center = false }: {
  text: string; size: string | number; weight?: number; color: string; lineHeight?: number; delay?: number; center?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ textAlign: center ? "center" : "left" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.26em",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(12px)",
          transition: `opacity .48s ${delay + i * 0.028}s ease, transform .48s ${delay + i * 0.028}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

function Counter({ target, suffix = "", label, accent }: { target: number; suffix?: string; label: string; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  useEffect(() => {
    if (!vis) return;
    let start: number | null = null;
    const dur = 1300;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [vis, target]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(44px,5vw,70px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: accent }}>{val}</span><span style={{ color: accent, opacity: 0.7 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 9, letterSpacing: ".15em", marginTop: 8, fontWeight: 500, opacity: 0.35, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function FeatureLine({ num, title, desc, accent, delay = 0, fg, line }: {
  num: string; title: string; desc: string; accent: string; delay?: number; fg: string; line: string;
}) {
  return (
    <FadeUp delay={delay}>
      <div style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: "0 16px", paddingBottom: 14, paddingTop: 2, borderBottom: `1px solid ${line}` }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: accent, opacity: .55, letterSpacing: ".06em", paddingTop: 3 }}>{num}</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{title}</span>
          <span style={{ fontSize: 12, opacity: 0.42, lineHeight: 1.6, marginLeft: 8, color: fg }}>{desc}</span>
        </div>
      </div>
    </FadeUp>
  );
}

function GateRow({ num, name, desc, color, delay, fg, line }: {
  num: string; name: string; desc: string; color: string; delay: number; fg: string; line: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: .1 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "grid", gridTemplateColumns: "32px 140px 1fr", gap: "0 20px", padding: "15px 0",
      borderBottom: `1px solid ${line}`,
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(-10px)",
      transition: `opacity .45s ${delay}s ease, transform .45s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color, opacity: .55, letterSpacing: ".08em" }}>{num}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: fg }}>{name}</span>
      <span style={{ fontSize: 12, opacity: 0.40, lineHeight: 1.6, color: fg }}>{desc}</span>
    </div>
  );
}

function DnaBar({ label, score, delay = 0, accent, fg }: {
  label: string; score: number; delay?: number; accent: string; fg: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: .2 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 14,
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(-6px)",
      transition: `opacity .55s ${delay}s ease, transform .55s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 11, color: fg, opacity: .38, width: 165, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: `${fg}18`, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          background: `linear-gradient(90deg,${accent},${accent}66)`,
          width: vis ? `${score}%` : "0%",
          transition: `width 1.1s ${delay + .1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: fg, width: 22, textAlign: "right", opacity: .7 }}>{score}</div>
    </div>
  );
}

function Ticker({ fg }: { fg: string }) {
  const formats = ["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"];
  const doubled = [...formats, ...formats];
  return (
    <div style={{ overflow: "hidden", maskImage: "linear-gradient(90deg,transparent,black 10%,black 90%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,black 10%,black 90%,transparent)" }}>
      <style>{`@keyframes ew-tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ew-tick{display:flex;width:max-content;animation:ew-tick 28s linear infinite}.ew-tick:hover{animation-play-state:paused}`}</style>
      <div className="ew-tick">
        {doubled.map((f, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, color: fg, opacity: .28, padding: "5px 18px", whiteSpace: "nowrap", letterSpacing: ".03em" }}>
            {f}<span style={{ display: "inline-block", width: 1, height: 8, background: `${fg}22`, margin: "0 0 0 18px" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Wordmark({ fg }: { fg: string }) {
  const words = ["Studio","Intelligence","System"];
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setFading(true); setTimeout(() => { setIdx(i => (i+1)%3); setFading(false); }, 350); }, 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: "inline-block", opacity: fading ? 0 : 1, transform: fading ? "translateY(-3px)" : "translateY(0)", transition: "opacity .35s ease, transform .35s ease", color: fg, opacity: fading ? 0 : 0.35, fontWeight: 300, fontSize: 15 }}>
      {words[idx]}
    </span>
  );
}

// ── Theme toggle ───────────────────────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
        position: "relative", transition: "background .3s", flexShrink: 0,
        display: "flex", alignItems: "center", padding: "3px",
      }}
    >
      {/* Track */}
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: dark ? "#E8E8E6" : "#111110",
        position: "absolute", left: dark ? 21 : 3,
        transition: "left .25s cubic-bezier(.16,1,.3,1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9,
      }}>
        {dark ? "☀" : "●"}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const [dark, setDark] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Section refs for orb energy
  const watchRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [watchEnergy, setWatchEnergy] = useState(0.1);
  const [workEnergy, setWorkEnergy] = useState(0.1);
  const [wrapEnergy, setWrapEnergy] = useState(0.1);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      setScrollY(sy);
      const getEnergy = (el: HTMLElement | null) => {
        if (!el) return 0.1;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom < 0 || rect.top > vh) return 0.1;
        const p = Math.max(0, Math.min(1, -rect.top / (rect.height - vh)));
        return 0.1 + p * 0.6;
      };
      setWatchEnergy(getEnergy(watchRef.current));
      setWorkEnergy(getEnergy(workRef.current));
      setWrapEnergy(getEnergy(wrapRef.current));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Theme colors ────────────────────────────────────────────────────────────
  const bg     = dark ? "#07090f" : "#F5F5F3";
  const bg2    = dark ? "#0b0d14" : "#EDEDEB";
  const fg     = dark ? "#E8E8E6" : "#111110";
  const fg2    = dark ? "rgba(232,232,230,0.50)" : "rgba(17,17,16,0.52)";
  const line   = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const gold   = "#C8961A";
  const watchA = dark ? "#4A90F5" : "#2563EB";
  const workA  = dark ? "#0D9E8E" : "#0D7A6E";
  const wrapA  = dark ? "#9B7FE8" : "#7C3AED";

  const sectionBgWatch = dark ? "#050918" : "#EEF3FF";
  const sectionBgWork  = dark ? "#040e10" : "#EBF7F6";
  const sectionBgWrap  = dark ? "#08051A" : "#F3EEFF";

  const navBg = scrollY > 40
    ? (dark ? "rgba(7,9,15,0.94)" : "rgba(245,245,243,0.94)")
    : "transparent";
  const navBorder = scrollY > 40 ? `1px solid ${line}` : "none";

  const orbGlowWatch = dark ? "rgba(74,144,245,0.25)" : "rgba(37,99,235,0.20)";
  const orbGlowWork  = dark ? "rgba(13,158,142,0.25)" : "rgba(13,122,110,0.20)";
  const orbGlowWrap  = dark ? "rgba(155,127,232,0.25)" : "rgba(124,58,237,0.20)";

  return (
    <div style={{ fontFamily: "'Afacad Flux',sans-serif", background: bg, color: fg, overflowX: "hidden", transition: "background .35s, color .35s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 54, padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg, backdropFilter: scrollY > 40 ? "blur(18px)" : "none",
        borderBottom: navBorder, transition: "all .4s ease",
      }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", display: "flex", alignItems: "baseline", gap: 0, cursor: "pointer" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: fg, letterSpacing: ".04em", transition: "color .3s" }}>EVERY</span>
          <Wordmark fg={fg} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
          <button onClick={() => nav("/auth")} style={{
            background: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
            border: `1px solid ${line}`, borderRadius: 100,
            padding: "7px 20px", color: fg, fontSize: 12, fontWeight: 500,
            fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".75"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >Get Early Access</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO — no orb, clean typographic
      ══════════════════════════════════════════ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px 70px", position: "relative", overflow: "hidden" }}>
        {/* Ambient radial behind text */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: dark
            ? "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(58,123,213,0.11) 0%, transparent 68%)"
            : "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(37,99,235,0.07) 0%, transparent 68%)",
          transition: "background .4s",
        }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 860 }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: 10, letterSpacing: ".24em", color: fg, opacity: mounted ? 0.25 : 0,
            textTransform: "uppercase", marginBottom: 22, fontWeight: 500,
            transition: "opacity .8s .2s ease",
          }}>Composed Intelligence</div>

          {/* Headline */}
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(14px)",
            transition: "opacity .75s .28s ease, transform .75s .28s cubic-bezier(.16,1,.3,1)",
          }}>
            <div style={{ fontSize: "clamp(54px,9vw,116px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .88, color: fg, marginBottom: 8, transition: "color .3s" }}>
              Your thinking.
            </div>
            <div style={{ fontSize: "clamp(54px,9vw,116px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .88, color: gold, marginBottom: 32 }}>
              Composed.
            </div>
          </div>

          {/* Subhead */}
          <p style={{
            fontSize: "clamp(14px,1.6vw,17px)", lineHeight: 1.72, color: fg2, maxWidth: 500, margin: "0 auto 36px",
            opacity: mounted ? 1 : 0, transition: "opacity .8s .5s ease, color .3s",
          }}>
            You have the ideas, the expertise, and the point of view. What you don't have is the system to turn all of that into content that actually lands.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", opacity: mounted ? 1 : 0, transition: "opacity .8s .65s ease" }}>
            <button onClick={() => nav("/auth")} style={{
              background: dark ? "#fff" : "#111110", border: "none", borderRadius: 100,
              padding: "12px 38px", fontSize: 13, fontWeight: 600,
              color: dark ? "#07090f" : "#F5F5F3",
              fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s, background .3s, color .3s",
            }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
              Get Early Access
            </button>
            <button onClick={() => document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" })} style={{
              background: "transparent", border: `1px solid ${line}`, borderRadius: 100,
              padding: "12px 38px", fontSize: 13, fontWeight: 500, color: fg2,
              fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "all .2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = ".7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
              See How It Works
            </button>
          </div>

          {/* Scroll cue */}
          <div style={{ marginTop: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, opacity: mounted ? 0.22 : 0, transition: "opacity .8s .9s ease" }}>
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <rect x="1" y="1" width="12" height="18" rx="6" stroke={fg} strokeWidth="1.1"/>
              <circle cx="7" cy="6.5" r="1.8" fill={fg}/>
            </svg>
            <span style={{ fontSize: 8, letterSpacing: ".18em", color: fg2, textTransform: "uppercase" }}>Scroll</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THE PROBLEM
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 40px 72px", borderTop: `1px solid ${line}`, transition: "border-color .3s" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <WordReveal text="You already know what to say." size="clamp(30px,4.5vw,54px)" weight={700} lineHeight={1.06} color={fg} />
          <div style={{ marginTop: 10, marginBottom: 32 }}>
            <WordReveal text="The hard part is everything after that." size="clamp(16px,1.9vw,21px)" weight={400} color={fg} delay={0.1} lineHeight={1.4} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 60px", maxWidth: 820 }}>
            <FadeUp delay={0.05}>
              <p style={{ fontSize: 14, lineHeight: 1.78, color: fg2, transition: "color .3s" }}>
                Every thought leader faces the same bottleneck. You have insights worth sharing, but turning them into polished, multi-format content takes a team you don't have and time you can't spare.
              </p>
            </FadeUp>
            <FadeUp delay={0.12}>
              <p style={{ fontSize: 14, lineHeight: 1.78, color: fg2, transition: "color .3s" }}>
                The AI tools move fast, but they flatten your voice into something generic. Ghostwriters get the tone right, but they cost $9,000 a month and still need you to do half the work.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FRAMEWORK + COUNTERS
      ══════════════════════════════════════════ */}
      <section id="rooms" style={{ padding: "64px 40px 60px", borderTop: `1px solid ${line}`, background: dark ? "#07090f" : "#EDEDEB", transition: "background .35s, border-color .3s" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: fg, opacity: .22, textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>The Framework</div>
              <div style={{ fontSize: "clamp(36px,5vw,68px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .92, color: fg, marginBottom: 5, transition: "color .3s" }}>One idea in.</div>
              <div style={{ fontSize: "clamp(36px,5vw,68px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .92, color: gold, marginBottom: 18 }}>Communications out.</div>
              <p style={{ fontSize: 14, color: fg2, maxWidth: 400, margin: "0 auto", transition: "color .3s" }}>EVERYWHERE Studio is the bridge between what you know and what the world sees.</p>
            </div>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", marginTop: 48 }}>
            <div style={{ padding: "32px 28px", borderRight: `1px solid ${line}` }}>
              <Counter target={40} suffix="+" label="AI Specialists" accent={watchA} />
            </div>
            <div style={{ padding: "32px 28px", borderRight: `1px solid ${line}` }}>
              <Counter target={12} label="Output Formats" accent={workA} />
            </div>
            <div style={{ padding: "32px 28px" }}>
              <Counter target={7} label="Quality Gates" accent={wrapA} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WATCH — sticky left with Siri orb (blue)
      ══════════════════════════════════════════ */}
      <div ref={watchRef} style={{ display: "flex", minHeight: "130vh", position: "relative" }}>
        {/* Left sticky */}
        <div style={{
          position: "sticky", top: 0, height: "100vh", width: "46%", flexShrink: 0, overflow: "hidden",
          background: sectionBgWatch, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${line}`, transition: "background .35s, border-color .3s",
        }}>
          {/* Ambient glow behind orb */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: dark ? "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(74,144,245,0.10) 0%, transparent 70%)" : "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(37,99,235,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ filter: `drop-shadow(0 0 56px ${orbGlowWatch})`, transition: "filter 1s" }}>
              <SiriOrb size={200} palette={0} light={!dark} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: watchA, textTransform: "uppercase", marginBottom: 10, fontWeight: 600, opacity: .75 }}>Room One</div>
              <div style={{ fontSize: "clamp(44px,5.5vw,72px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: fg, transition: "color .3s" }}>WATCH</div>
              <div style={{ fontSize: 9, letterSpacing: ".14em", color: fg, opacity: .25, textTransform: "uppercase", marginTop: 10, fontWeight: 500 }}>The Signal Room</div>
            </div>
          </div>
        </div>

        {/* Right — scrolling content */}
        <div style={{ flex: 1, padding: "72px 52px 72px 56px", display: "flex", flexDirection: "column", gap: 32, justifyContent: "center", minWidth: 0 }}>
          <WordReveal text="Before you write a single word, the system scans your category for what's moving." size="clamp(18px,2vw,24px)" weight={700} lineHeight={1.24} color={fg} />
          <FadeUp delay={0.08}>
            <p style={{ fontSize: 14, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>
              You get structured intelligence, not a reading list. Every briefing is built for action, not review.
            </p>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="What's Moving" desc="Developments shaping your category right now" accent={watchA} delay={0} fg={fg} line={line} />
            <FeatureLine num="02" title="Threats" desc="Items requiring defensive positioning or response" accent={watchA} delay={0.05} fg={fg} line={line} />
            <FeatureLine num="03" title="Opportunities" desc="Scored on effort-to-impact ratio, highest leverage first" accent={watchA} delay={0.10} fg={fg} line={line} />
            <FeatureLine num="04" title="Content Triggers" desc="Angles ready for the production engine" accent={watchA} delay={0.15} fg={fg} line={line} />
            <FeatureLine num="05" title="Event Radar" desc="Upcoming events filtered by proximity and relevance" accent={watchA} delay={0.20} fg={fg} line={line} />
          </div>
          <FadeUp delay={0.1}>
            <div style={{ borderLeft: `2px solid ${watchA}44`, paddingLeft: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: fg, marginBottom: 5, transition: "color .3s" }}>Source Verification</div>
              <p style={{ fontSize: 12, color: fg2, lineHeight: 1.72, transition: "color .3s" }}>Every claim requires two or more independent, credible sources. Unverified intelligence never ships. This is not a preference. It is a protocol.</p>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          WORK — sticky left with Siri orb (teal)
      ══════════════════════════════════════════ */}
      <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${workA}44,transparent)` }} />
      <div ref={workRef} style={{ display: "flex", minHeight: "150vh", position: "relative" }}>
        <div style={{
          position: "sticky", top: 0, height: "100vh", width: "46%", flexShrink: 0, overflow: "hidden",
          background: sectionBgWork, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${line}`, transition: "background .35s, border-color .3s",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: dark ? "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(13,158,142,0.10) 0%, transparent 70%)" : "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(13,122,110,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ filter: `drop-shadow(0 0 56px ${orbGlowWork})`, transition: "filter 1s" }}>
              <SiriOrb size={200} palette={1} light={!dark} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: workA, textTransform: "uppercase", marginBottom: 10, fontWeight: 600, opacity: .75 }}>Room Two</div>
              <div style={{ fontSize: "clamp(44px,5.5vw,72px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: fg, transition: "color .3s" }}>WORK</div>
              <div style={{ fontSize: 9, letterSpacing: ".14em", color: fg, opacity: .25, textTransform: "uppercase", marginTop: 10, fontWeight: 500 }}>The Engine Room</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "72px 52px 72px 56px", display: "flex", flexDirection: "column", gap: 32, justifyContent: "center", minWidth: 0 }}>
          <WordReveal text="A coordinated team of forty specialists transforms your raw thinking into publication-grade content." size="clamp(18px,2vw,24px)" weight={700} lineHeight={1.24} color={fg} />
          <FadeUp delay={0.08}>
            <p style={{ fontSize: 14, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>
              Not a single prompt. A system of roles working in sequence. Voice DNA ensures every word sounds like you. Quality gates ensure every piece meets your standards.
            </p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: ".2em", color: fg, opacity: .22, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Output formats</div>
              <Ticker fg={fg} />
            </div>
          </FadeUp>
          <FadeUp delay={0.18}>
            <div style={{ borderTop: `1px solid ${line}`, paddingTop: 28, transition: "border-color .3s" }}>
              <div style={{ fontSize: 8, letterSpacing: ".2em", color: workA, textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>Voice DNA</div>
              <div style={{ marginBottom: 20 }}>
                <WordReveal text="Every output sounds exactly like you." size={18} weight={700} color={fg} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Vocabulary and Syntax",88],["Tonal Register",94],["Rhythm and Cadence",91],["Metaphor Patterns",87],["Structural Habits",96]].map(([l,s],i)=>(
                  <DnaBar key={i} label={l as string} score={s as number} delay={i*.06} accent={workA} fg={fg} />
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          WRAP — sticky left with Siri orb (violet)
      ══════════════════════════════════════════ */}
      <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${wrapA}44,transparent)` }} />
      <div ref={wrapRef} style={{ display: "flex", minHeight: "120vh", position: "relative" }}>
        <div style={{
          position: "sticky", top: 0, height: "100vh", width: "46%", flexShrink: 0, overflow: "hidden",
          background: sectionBgWrap, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${line}`, transition: "background .35s, border-color .3s",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: dark ? "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(155,127,232,0.10) 0%, transparent 70%)" : "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ filter: `drop-shadow(0 0 56px ${orbGlowWrap})`, transition: "filter 1s" }}>
              <SiriOrb size={200} palette={2} light={!dark} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: wrapA, textTransform: "uppercase", marginBottom: 10, fontWeight: 600, opacity: .75 }}>Room Three</div>
              <div style={{ fontSize: "clamp(44px,5.5vw,72px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: fg, transition: "color .3s" }}>WRAP</div>
              <div style={{ fontSize: 9, letterSpacing: ".14em", color: fg, opacity: .25, textTransform: "uppercase", marginTop: 10, fontWeight: 500 }}>The Distribution Room</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "72px 52px 72px 56px", display: "flex", flexDirection: "column", gap: 32, justifyContent: "center", minWidth: 0 }}>
          <WordReveal text="One idea becomes a complete publishing event." size="clamp(18px,2vw,24px)" weight={700} lineHeight={1.24} color={fg} />
          <FadeUp delay={0.08}>
            <p style={{ fontSize: 14, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>
              Articles, social posts, email sequences, video scripts. Formatted for every channel. Ready to ship. Nothing is left on the table. Nothing is left for you to finish.
            </p>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="Content Calendar" desc="Visual scheduling across all channels from one canvas." accent={wrapA} delay={0} fg={fg} line={line} />
            <FeatureLine num="02" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social at once." accent={wrapA} delay={0.06} fg={fg} line={line} />
            <FeatureLine num="03" title="Performance Loop" desc="Engagement data flows back to sharpen your next strategy." accent={wrapA} delay={0.12} fg={fg} line={line} />
            <FeatureLine num="04" title="The Flywheel" desc="Every post makes the next one better. Ideas compound." accent={wrapA} delay={0.18} fg={fg} line={line} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          7 QUALITY GATES
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 40px 100px", background: dark ? "linear-gradient(180deg,#080412 0%,#07090f 100%)" : "linear-gradient(180deg,#EDE8FF 0%,#F5F5F3 100%)", borderTop: `1px solid ${line}`, transition: "background .35s, border-color .3s" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 56px", alignItems: "end", marginBottom: 44 }}>
            <div>
              <FadeUp><div style={{ fontSize: 9, letterSpacing: ".2em", color: wrapA, textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>Quality Gates</div></FadeUp>
              <WordReveal text="Nothing ships without passing the gates." size="clamp(24px,3.2vw,42px)" weight={700} lineHeight={1.08} color={fg} />
            </div>
            <FadeUp delay={0.1}>
              <p style={{ fontSize: 13, lineHeight: 1.72, color: fg2, transition: "color .3s" }}>Every piece of content runs through 7 checks before it reaches your audience. No AI tells. No off-brand moments. No weak writing.</p>
            </FadeUp>
          </div>
          <div style={{ borderTop: `1px solid ${line}`, transition: "border-color .3s" }}>
            {[["01","Strategy","Does this serve your goals?","#3A7BD5"],["02","Voice","Does this sound like you?","#0D8C9E"],["03","Accuracy","Are the facts correct?","#C8961A"],["04","AI Tells","Could anyone spot the AI?","#e85d75"],["05","Audience","Will this resonate?","#9B7FE8"],["06","Platform","Is this native to the channel?","#4ab8f5"],["07","Impact","Will this move people to action?","#10b981"]].map(([num,name,desc,color],i)=>(
              <GateRow key={i} num={num} name={name} desc={desc} color={color} delay={0.04+i*.05} fg={fg} line={line} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY IT COMPOUNDS
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 40px 80px", borderTop: `1px solid ${line}`, background: bg, transition: "background .35s, border-color .3s" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeUp><div style={{ fontSize: 9, letterSpacing: ".2em", color: fg, opacity: .22, textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Compound Advantage</div></FadeUp>
          <WordReveal text="Why It Compounds" size="clamp(34px,4.5vw,58px)" weight={700} lineHeight={1.0} color={fg} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
            <FadeUp delay={0.07}><p style={{ fontSize: 15, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>Most tools make content faster. EVERYWHERE Studio makes it better — and the difference grows with every piece you publish.</p></FadeUp>
            <FadeUp delay={0.13}><p style={{ fontSize: 15, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>Your Voice DNA sharpens over time. The quality gates calibrate to your rising standards. The intelligence layer learns the contours of your category with increasing precision.</p></FadeUp>
            <FadeUp delay={0.19}><p style={{ fontSize: 15, lineHeight: 1.76, color: fg2, transition: "color .3s" }}>The result is a widening moat: the longer you use the system, the further it pulls ahead of anything else available — for you, specifically, and for no one else.</p></FadeUp>
          </div>
          <FadeUp delay={0.3}>
            <div style={{ marginTop: 44, padding: "28px 0", borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, textAlign: "center", transition: "border-color .3s" }}>
              <div style={{ fontSize: "clamp(16px,1.9vw,22px)", fontWeight: 600, lineHeight: 1.4, color: gold, fontStyle: "italic" }}>
                "Competitors can copy the output format. They cannot copy the system underneath it."
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════════ */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", background: dark ? "linear-gradient(180deg,#07090f 0%,#0a0d1c 100%)" : "linear-gradient(180deg,#F5F5F3 0%,#EAEAF8 100%)", borderTop: `1px solid ${line}`, transition: "background .35s, border-color .3s" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <FadeUp><div style={{ fontSize: 9, letterSpacing: ".2em", color: fg, opacity: .20, textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>Let's Talk</div></FadeUp>
          <WordReveal text="Your ideas deserve a system built to carry them." size="clamp(28px,4vw,52px)" weight={700} lineHeight={1.02} color={fg} center />
          <FadeUp delay={0.18}>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: fg2, marginTop: 18, marginBottom: 40, transition: "color .3s" }}>
              If you're ready to stop carrying the mountain alone, let's have a conversation.
            </p>
          </FadeUp>
          <FadeUp delay={0.28}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => nav("/auth")} style={{
                background: dark ? "#fff" : "#111110", border: "none", borderRadius: 100,
                padding: "14px 44px", fontSize: 14, fontWeight: 700,
                color: dark ? "#07090f" : "#F5F5F3",
                fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s, background .3s, color .3s",
              }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                Let's Talk
              </button>
              <button onClick={() => nav("/studio/dashboard")} style={{
                background: "transparent", border: `1px solid ${line}`, borderRadius: 100,
                padding: "14px 44px", fontSize: 14, fontWeight: 500, color: fg2,
                fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "all .2s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".7"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                Open Studio
              </button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "20px 40px", borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: bg, transition: "background .35s, border-color .3s" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: fg, opacity: .55, transition: "color .3s" }}>EVERY</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: fg, opacity: .16, transition: "color .3s" }}>WHERE</span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".16em", color: fg, opacity: .20, marginLeft: 5, textTransform: "uppercase", transition: "color .3s" }}>Studio</span>
        </div>
        <span style={{ fontSize: 10, color: fg, opacity: .20, letterSpacing: ".04em", transition: "color .3s" }}>2026 Mixed Grill LLC · Composed Intelligence</span>
      </footer>
    </div>
  );
}
