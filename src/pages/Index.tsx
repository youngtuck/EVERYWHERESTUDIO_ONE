import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — Intro Hero
// Ray-marched ribbed sphere. Geometric, animated, iridescent.
// Technique: SDF sphere with sinusoidal horizontal displacement bands.
// The ribs are actual 3D geometry derived from polar coordinates — not noise.
// Caustic rainbow streaks from thin-film iridescence simulation.
// ─────────────────────────────────────────────────────────────────────────────

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_mouse;

#define PI    3.14159265359
#define TAU   6.28318530718

// ── Rib SDF: sphere with animated sinusoidal ridges ─────────────────────────
// p        = sample point in 3D
// t        = time
// returns  = signed distance to surface
float ribSDF(vec3 p, float t) {
  float r = length(p);
  float eps = 0.0001;
  
  // Polar theta (0=north pole, PI=south pole)
  float cosT = clamp(p.y / max(r, eps), -1.0, 1.0);
  float theta = acos(cosT);
  
  // ── Primary ribs — 7 horizontal bands scrolling downward ──────────────────
  float numRibs  = 7.0;
  float scroll   = t * 0.20;                    // scroll speed
  float ribAngle = theta * numRibs - scroll;
  float rib1     = sin(ribAngle);               // primary rib wave
  
  // ── Secondary slow undulation — makes the whole shape breathe ─────────────
  float undulate = sin(theta * 3.5 - t * 0.11) * 0.38;
  float rib2     = sin(ribAngle * 0.5 + undulate) * 0.45;
  
  // ── Tertiary micro-ripple — fine surface detail ────────────────────────────
  float micro    = sin(ribAngle * 2.0 + t * 0.28) * 0.15;
  
  // Combined displacement — shallower at poles (natural pinch)
  float sinT     = sin(theta);                  // 0 at poles, 1 at equator
  float poleClamp = sinT * sinT;                // squared = gentler taper
  float disp     = (rib1 * 0.55 + rib2 + micro) * 0.044 * poleClamp;
  
  // Mouse tilt — nudge the whole rib phase slightly toward cursor
  float mx = (u_mouse.x - 0.5) * 0.10;
  float my = (u_mouse.y - 0.5) * 0.07;
  float tilt = mx * (p.x / max(r, eps)) + my * (p.z / max(r, eps));
  disp += tilt * 0.018;
  
  return r - (0.72 + disp);
}

// ── Surface normal via tetrahedron finite differences (fast & accurate) ──────
vec3 normal(vec3 p, float t) {
  const float e = 0.0009;
  const vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * ribSDF(p + k.xyy*e, t) +
    k.yyx * ribSDF(p + k.yyx*e, t) +
    k.yxy * ribSDF(p + k.yxy*e, t) +
    k.xxx * ribSDF(p + k.xxx*e, t)
  );
}

// ── Iridescent thin-film color ────────────────────────────────────────────────
// Simulates the rainbow prismatic effect from thin glass/soap-bubble optics
vec3 thinFilm(float phase) {
  return vec3(
    0.5 + 0.5 * cos(TAU * (phase + 0.00)),
    0.5 + 0.5 * cos(TAU * (phase + 0.33)),
    0.5 + 0.5 * cos(TAU * (phase + 0.67))
  );
}

void main() {
  // Aspect-corrected UV in [-1, 1] range
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  float aspect = u_res.x / u_res.y;
  uv.x *= aspect;
  
  // Mouse parallax — camera shifts subtly toward cursor
  vec2 mNorm  = u_mouse - 0.5;                  // -0.5..0.5
  vec3 ro = vec3(mNorm.x * 0.22, mNorm.y * 0.16, 2.1);
  vec3 rd = normalize(vec3(uv, -1.6));
  
  float time = u_t;
  
  // ── Ray march ─────────────────────────────────────────────────────────────
  float dist = 0.0;
  bool  hit  = false;
  vec3  p;
  
  for (int i = 0; i < 96; i++) {
    p = ro + rd * dist;
    float d = ribSDF(p, time);
    if (d < 0.0004) { hit = true; break; }
    if (dist > 4.5) break;
    dist += d * 0.82;         // conservative — curved SDF needs smaller steps
  }
  
  if (!hit) { gl_FragColor = vec4(0.0); return; }
  
  // ── Surface geometry ──────────────────────────────────────────────────────
  vec3 N = normal(p, time);
  vec3 V = -rd;
  vec3 R = reflect(rd, N);    // reflection direction
  
  float r    = length(p);
  float cosT = clamp(p.y / max(r, 0.0001), -1.0, 1.0);
  float theta = acos(cosT);
  float phi   = atan(p.z, p.x);
  
  // ── Rib phase — where are we on the rib cycle right now ─────────────────
  float scroll   = time * 0.20;
  float ribPhase = fract(theta * 7.0 / PI - scroll / TAU);
  // ribPhase: 0=rib top, 0.5=valley, 1=back to rib top
  
  // Ridge vs valley (0=valley, 1=ridge top)
  float ridge = abs(ribPhase * 2.0 - 1.0);     // V-shape: 0 at valley, 1 at ridge
  float ridgeSmooth = smoothstep(0.0, 1.0, ridge * ridge);
  
  // Under-rib shadow — the key visual. Normals pointing slightly down = shadow
  float underShadow = max(0.0, -dot(N, vec3(0.0, 1.0, 0.0)));
  float ribShadow   = underShadow * smoothstep(0.0, 0.6, 1.0 - ridge) * 0.7;
  
  // ── Lighting ──────────────────────────────────────────────────────────────
  // Key light — upper left
  vec3 L1    = normalize(vec3(-0.55, 0.75, 0.85));
  float ndl1 = max(dot(N, L1), 0.0);
  
  // Fill light — lower right (cooler)
  vec3 L2    = normalize(vec3(0.65, -0.35, 0.55));
  float ndl2 = max(dot(N, L2), 0.0) * 0.28;
  
  // Back rim light — creates the glowing edge
  vec3 L3    = normalize(vec3(0.0, 0.1, -1.0));
  float ndl3 = max(dot(N, L3), 0.0) * 0.15;
  
  // Specular — Blinn-Phong
  vec3 H1    = normalize(L1 + V);
  float spec1 = pow(max(dot(N, H1), 0.0), 80.0)  * 0.85;
  float spec2 = pow(max(dot(N, H1), 0.0), 400.0) * 0.55; // tight glint
  
  // Fresnel — glass edge
  float NoV    = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - NoV, 3.8);
  
  // ── Color — translucent pearl glass matching Telefónica palette ─────────
  // Ridge tops: bright pearl-lavender
  // Valleys: deeper, slightly blue-violet
  vec3 ridgeColor  = vec3(0.80, 0.84, 0.99);   // pearl-white with blue tint
  vec3 valleyColor = vec3(0.50, 0.58, 0.92);   // deeper indigo-blue
  vec3 shadowColor = vec3(0.36, 0.44, 0.82);   // under-rib shadow
  
  // Slight warm tint on ridge tops facing the key light
  ridgeColor = mix(ridgeColor, vec3(0.88, 0.88, 1.0), ndl1 * 0.25);
  
  vec3 base = mix(valleyColor, ridgeColor, ridgeSmooth);
  base = mix(base, shadowColor, ribShadow);
  
  // Translucency — bg bleeds through slightly at grazing angles
  vec3 bgTint = vec3(0.24, 0.32, 0.82);
  base = mix(base, bgTint, (1.0 - NoV) * 0.08 + fresnel * 0.06);
  
  // ── Iridescent caustic streaks ────────────────────────────────────────────
  // These appear at rib transitions and at high-angle specular patches
  // Phase varies with rib position + azimuthal angle + time drift
  float iriPhase   = ribPhase * 2.5 + phi * 0.12 + time * 0.05;
  vec3  iriColor   = thinFilm(iriPhase);
  
  // Caustic mask: concentrated at rib edges (where ribPhase ≈ 0.5)
  float edgeMask   = smoothstep(0.35, 0.50, ribPhase) * smoothstep(0.65, 0.50, ribPhase);
  // Additional specular caustic from key light
  float causticSpec = pow(max(dot(N, normalize(vec3(-0.25, 0.55, 0.85))), 0.0), 12.0);
  float causticMask = (edgeMask * 0.7 + causticSpec * 0.3) * 0.22;
  
  // ── Assemble final color ──────────────────────────────────────────────────
  vec3 col = base;
  
  // Diffuse lighting
  col *= (ndl1 * 0.68 + ndl2 + ndl3 + 0.28);
  
  // Caustics (additive)
  col += iriColor * causticMask;
  
  // Specular highlights
  col += vec3(1.00, 0.99, 0.97) * spec1;       // warm white primary
  col += vec3(0.90, 0.93, 1.00) * spec2;       // cool tight glint
  
  // Rim / Fresnel — brightens the silhouette edge
  vec3 rimCol = mix(vec3(0.65, 0.72, 1.0), vec3(0.88, 0.90, 1.0), fresnel);
  col += rimCol * fresnel * 0.55;
  
  // Subtle chromatic aberration on the rim (prismatic edge)
  float rimEdge  = smoothstep(0.60, 0.80, length(uv / vec2(aspect, 1.0)));
  col.r += rimEdge * 0.04 * fresnel;
  col.b += rimEdge * 0.08 * fresnel;
  
  // Soft sphere-edge fade for clean silhouette
  float distFromCenter = length(uv / vec2(aspect, 1.0));
  float edgeFade = 1.0 - smoothstep(0.70, 0.85, distFromCenter);
  
  // Tonemap (keep it bright — not over-compressed)
  col = col / (col + 0.45) * 1.30;
  col = clamp(col, 0.0, 1.0);
  
  // Alpha — glass edge transparency + edge fade
  float alpha = (0.86 + fresnel * 0.14) * edgeFade;
  
  gl_FragColor = vec4(col, alpha);
}
`;

// ─── WebGL Orb Component ──────────────────────────────────────────────────────
function RibbedOrb({ size }: { size: number }) {
  const ref  = useRef<HTMLCanvasElement>(null);
  const mouse  = useRef({ x: 0.5, y: 0.5 });
  const target = useRef({ x: 0.5, y: 0.5 });
  const raf  = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: false, antialias: true,
    });
    if (!gl) { console.warn("WebGL not available"); return; }

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      const log = gl.getShaderInfoLog(s);
      if (log && log.trim()) console.error("Shader:", log);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    const linkLog = gl.getProgramInfoLog(prog);
    if (linkLog && linkLog.trim()) console.error("Link:", linkLog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT = gl.getUniformLocation(prog, "u_t");
    const uR = gl.getUniformLocation(prog, "u_res");
    const uM = gl.getUniformLocation(prog, "u_mouse");

    const onMove = (e: MouseEvent) => {
      target.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const m = mouse.current, tm = target.current;
      m.x += (tm.x - m.x) * 0.05;
      m.y += (tm.y - m.y) * 0.05;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * 0.001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uM, m.x, m.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, [size]);

  return (
    <canvas
      ref={ref}
      style={{
        width: size, height: size, display: "block",
        filter: [
          "drop-shadow(0 0 50px rgba(150,180,255,0.55))",
          "drop-shadow(0 0 110px rgba(100,140,255,0.28))",
          "drop-shadow(0 0 8px  rgba(255,255,255,0.20))",
        ].join(" "),
      }}
    />
  );
}

// ─── 2D scene layer: background + satellites + orbit dots ─────────────────────
function SceneCanvas() {
  const ref  = useRef<HTMLCanvasElement>(null);
  const raf  = useRef(0);
  const angles = useRef([0, 1.3, 2.7, 4.0, 5.4, 0.7, 3.5]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Satellite blobs — same blue family as background
    const blobs = [
      { oR:.52, spd:.00040, ph:0,   r:.100, col:[130,155,255], a:.52 },
      { oR:.42, spd:-.00028,ph:2.0, r:.065, col:[110,140,250], a:.42 },
      { oR:.62, spd:.00022, ph:1.1, r:.130, col:[145,165,255], a:.36 },
      { oR:.48, spd:-.00036,ph:3.8, r:.048, col:[120,150,255], a:.30 },
      { oR:.70, spd:.00018, ph:2.5, r:.090, col:[100,130,240], a:.22 },
      { oR:.38, spd:-.00050,ph:5.1, r:.036, col:[160,175,255], a:.28 },
      { oR:.78, spd:.00013, ph:4.2, r:.060, col:[110,145,248], a:.18 },
    ];

    // Orbit rings
    const rings = [
      { r:.30, dots:48,  dotR:1.4, a:.26 },
      { r:.41, dots:65,  dotR:1.0, a:.18 },
      { r:.52, dots:84,  dotR:.80, a:.12 },
      { r:.64, dots:106, dotR:.62, a:.08 },
    ];

    const draw = (ts: number) => {
      const t = ts * .001;
      const W = window.innerWidth, H = window.innerHeight;
      const cx = W * .5, cy = H * .5;
      const base = Math.min(W, H) * .30;

      ctx.clearRect(0, 0, W, H);

      // ── Background — vivid electric indigo ──────────────────────────────
      const bg = ctx.createRadialGradient(cx, cy*.88, 0, cx, cy, Math.max(W,H)*.85);
      bg.addColorStop(0,   "#4a5fd4");
      bg.addColorStop(.30, "#3d52cc");
      bg.addColorStop(.65, "#2e43c0");
      bg.addColorStop(1,   "#1e2da0");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Edge vignette
      const vig = ctx.createRadialGradient(cx, cy, base*.2, cx, cy, Math.max(W,H)*.72);
      vig.addColorStop(0, "rgba(60,85,210,.00)");
      vig.addColorStop(1, "rgba(12,18,82,.38)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // ── Orbit dot rings ─────────────────────────────────────────────────
      rings.forEach(ring => {
        const rPx = base * (ring.r / .30);
        const rY  = rPx * .28;
        for (let i = 0; i < ring.dots; i++) {
          const angle = (i / ring.dots) * Math.PI * 2 + t * .065;
          const x = cx + Math.cos(angle) * rPx;
          const y = cy + Math.sin(angle) * rY;
          const depth = (Math.sin(angle) + 1.5) / 2.5;
          ctx.globalAlpha = ring.a * depth;
          ctx.fillStyle = "#b8c8ff";
          ctx.beginPath();
          ctx.arc(x, y, ring.dotR, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // ── Satellite blobs ─────────────────────────────────────────────────
      blobs.forEach((b, i) => {
        angles.current[i] += b.spd;
        const angle = angles.current[i];
        const rPx = base * (b.oR / .30);
        const rY  = rPx * .28;
        const bx  = cx + Math.cos(angle) * rPx;
        const by  = cy + Math.sin(angle) * rY;
        const bR  = base * b.r;
        const depth = (Math.sin(angle) + 1.0) * .5;
        const alpha = b.a * (.45 + depth * .55);

        const [r,g,bv] = b.col;
        const gr = ctx.createRadialGradient(bx-bR*.22, by-bR*.22, 0, bx, by, bR*1.35);
        gr.addColorStop(0,  `rgba(${r},${g},${bv},.92)`);
        gr.addColorStop(.45,`rgba(${r},${g},${bv},.52)`);
        gr.addColorStop(1,  `rgba(${r},${g},${bv},0)`);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(bx, by, bR, 0, Math.PI*2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady]   = useState(false);
  const [orbSize, setOrbSize] = useState(560);

  useEffect(() => {
    const calc = () => {
      // Orb fills ~65% of viewport shorter dimension — fills center like Telefónica
      setOrbSize(Math.min(
        window.innerWidth  * 0.68,
        window.innerHeight * 0.80,
        720
      ));
    };
    calc();
    window.addEventListener("resize", calc);
    const t = setTimeout(() => setReady(true), 100);
    return () => { window.removeEventListener("resize", calc); clearTimeout(t); };
  }, []);

  const fi = (delay: number) => ({
    opacity:   ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 1s ${delay}s cubic-bezier(.16,1,.3,1), transform 1s ${delay}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{
      width:"100vw", height:"100vh", overflow:"hidden",
      position:"relative", fontFamily:"'Afacad Flux',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(255,230,120,.32);color:#fff;}

        @keyframes shimmer{to{background-position:200% center;}}

        /* The CTA pill — matching Telefónica's frosted white button */
        .cta-pill{
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.92);
          border:none;
          color:#3d52cc;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:500;letter-spacing:.01em;
          padding:15px 40px;border-radius:100px;cursor:pointer;
          transition:background .25s,transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s;
          box-shadow:0 4px 24px rgba(30,45,160,.25);
        }
        .cta-pill:hover{
          background:rgba(255,255,255,1);
          transform:translateY(-3px);
          box-shadow:0 12px 48px rgba(30,45,160,.35);
        }
        .cta-pill .arr{
          font-size:18px;
          transition:transform .35s cubic-bezier(.16,1,.3,1);
        }
        .cta-pill:hover .arr{ transform:translateX(4px); }
      `}</style>

      {/* Scene: bg + satellites + orbit rings */}
      <SceneCanvas />

      {/* Orb — absolute center */}
      <div style={{
        position:"fixed", inset:0, zIndex:2,
        pointerEvents:"none",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <RibbedOrb size={orbSize} />
      </div>

      {/* UI overlay — exactly like Telefónica layout */}
      <div style={{
        position:"fixed", inset:0, zIndex:10,
        display:"flex", flexDirection:"column",
        pointerEvents:"none",
      }}>

        {/* Logo — top center */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:32, ...fi(.1) }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-.02em", color:"rgba(255,255,255,.96)" }}>EVERY</span>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-.02em", color:"rgba(255,255,255,.52)" }}>WHERE</span>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:".14em", color:"rgba(255,255,255,.52)",
              marginLeft:6, alignSelf:"center", textTransform:"uppercase" }}>Studio</span>
          </div>
        </div>

        {/* Center — headline over the orb (like Telefónica) */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:0 }}>

          {/* Headline — large, centered, sits over the orb */}
          <h1 style={{
            ...fi(.22),
            fontSize:"clamp(48px,8vw,108px)",
            fontWeight:600,
            lineHeight:.95,
            color:"#fff",
            textAlign:"center",
            letterSpacing:"-.025em",
            textShadow:"0 2px 40px rgba(20,40,160,.35)",
            marginBottom:2,
          }}>
            Your thinking.
          </h1>
          <h1 style={{
            ...fi(.32),
            fontSize:"clamp(48px,8vw,108px)",
            fontWeight:600,
            lineHeight:.95,
            letterSpacing:"-.025em",
            textAlign:"center",
            background:"linear-gradient(110deg, #ffe066 0%, #fff 38%, #cce0ff 78%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            animation:"shimmer 6s linear infinite",
            marginBottom:52,
          }}>
            Everywhere.
          </h1>

          {/* CTA — white pill, exactly like Telefónica */}
          <div style={{ ...fi(.52), pointerEvents:"auto" }}>
            <button className="cta-pill" onClick={() => navigate("/explore")}>
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>

          {/* Subtitle below button */}
          <div style={{ ...fi(.70), marginTop:20 }}>
            <p style={{ fontSize:12, letterSpacing:".10em", textTransform:"uppercase",
              color:"rgba(255,255,255,.38)", fontWeight:400, textAlign:"center" }}>
              Composed Intelligence for Thought Leaders
            </p>
          </div>
        </div>

        {/* Bottom wordmark */}
        <div style={{ display:"flex", justifyContent:"center", paddingBottom:28, ...fi(1.0) }}>
          <span style={{ fontSize:11, letterSpacing:".12em",
            color:"rgba(255,255,255,.28)", fontWeight:300 }}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
