import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — Intro Hero  v3
//
// The key insight from studying the Telefónica orb:
// Mouse rotates the ENTIRE 3D coordinate system of the sphere via a rotation
// matrix. The ribs stay "horizontal relative to the sphere", so as it tilts,
// they go diagonal — proving it's true 3D rotation, not a 2D shift.
//
// Added life: spring-physics rotation with inertia/momentum, organic band
// waviness along longitude, breathing pulse, caustic energy streaks.
// ─────────────────────────────────────────────────────────────────────────────

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;   // spring-physics rotation angles (radians)

#define PI  3.14159265359
#define TAU 6.28318530718

// ── 3D rotation matrices ─────────────────────────────────────────────────────
// Rotate point p around X axis by angle a
vec3 rotX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
}
// Rotate point p around Y axis by angle a
vec3 rotY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
}

// ── Organic band waviness along longitude ─────────────────────────────────────
// Hash for pseudo-random variation per band
float hash(float n) { return fract(sin(n) * 43758.5453123); }

// Ribbed sphere SDF with true 3D rotation
// p     = point in world space
// rx,ry = rotation angles (from spring-physics mouse)
float orbSDF(vec3 p, float rx, float ry, float t) {
  // Apply inverse rotation to bring point into sphere's local frame
  // (rotating the SDF space = rotating the object)
  vec3 lp = rotX(rotY(p, -ry), -rx);
  
  float r     = length(lp);
  float eps   = 0.0001;
  float cosT  = clamp(lp.y / max(r, eps), -1.0, 1.0);
  float theta = acos(cosT);                    // polar: 0=N pole, PI=S pole
  float phi   = atan(lp.z, lp.x);             // azimuthal: -PI..PI

  // ── Primary ribs — 7 bands, scrolling ─────────────────────────────────────
  float scroll  = t * 0.22;
  float numRibs = 7.0;
  float ribAngle = theta * numRibs - scroll;
  
  // Organic waviness: each band wobbles slightly in phi direction
  // This creates the non-perfectly-horizontal wiggle visible in reference
  float bandIdx = floor(theta * numRibs / PI);
  float waveFreq = 3.0 + hash(bandIdx) * 2.0;    // 3-5 waves per band
  float waveAmp  = 0.018 + hash(bandIdx + 17.3) * 0.012;
  float organic  = sin(phi * waveFreq + t * (0.15 + hash(bandIdx)*0.1)) * waveAmp;
  
  // Secondary slow morph — whole shape breathes
  float breath   = sin(t * 0.28) * 0.008;
  float morph    = sin(theta * 3.0 - t * 0.12) * 0.022;
  
  // Rib wave (displaced by organic wobble)
  float rib1    = sin(ribAngle + organic * 8.0);
  float rib2    = sin(ribAngle * 0.5 - t * 0.10) * 0.40;
  float micro   = sin(ribAngle * 2.2 + phi * 1.5 + t * 0.31) * 0.12;
  
  // Pole pinch: ribs narrow near poles naturally
  float sinT  = sin(theta);
  float pole  = sinT * sinT * (3.0 - 2.0*sinT);  // smoothstep-like 0..1..0
  float disp  = (rib1 * 0.55 + rib2 + micro) * 0.046 * pole;
  disp += organic * pole * 0.5;
  disp += morph * pole;
  disp += breath;
  
  // Sphere base radius with displacement
  return r - (0.720 + disp);
}

// ── Tetrahedron normal (4 SDF evaluations — fast & accurate) ─────────────────
vec3 calcNormal(vec3 p, float rx, float ry, float t) {
  const float e = 0.0008;
  const vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * orbSDF(p + k.xyy*e, rx, ry, t) +
    k.yyx * orbSDF(p + k.yyx*e, rx, ry, t) +
    k.yxy * orbSDF(p + k.yxy*e, rx, ry, t) +
    k.xxx * orbSDF(p + k.xxx*e, rx, ry, t)
  );
}

// ── Thin-film iridescence (rainbow caustic color) ─────────────────────────────
vec3 iridescent(float phase) {
  return vec3(
    0.5 + 0.5 * cos(TAU * (phase + 0.00)),
    0.5 + 0.5 * cos(TAU * (phase + 0.33)),
    0.5 + 0.5 * cos(TAU * (phase + 0.67))
  );
}

void main() {
  // Aspect-corrected UV [-aspect..aspect, -1..1]
  vec2 uv  = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  float ar = u_res.x / u_res.y;
  uv.x    *= ar;
  
  float rx = u_rotXY.x;   // X rotation (mouse Y → tilt forward/back)
  float ry = u_rotXY.y;   // Y rotation (mouse X → spin left/right)
  float t  = u_t;
  
  // Camera: fixed, looking straight at origin
  vec3 ro = vec3(0.0, 0.0, 2.15);
  vec3 rd = normalize(vec3(uv, -1.60));
  
  // ── Ray march ──────────────────────────────────────────────────────────────
  float dist = 0.0;
  bool  hit  = false;
  vec3  p;
  
  for (int i = 0; i < 100; i++) {
    p = ro + rd * dist;
    float d = orbSDF(p, rx, ry, t);
    if (abs(d) < 0.00035) { hit = true; break; }
    if (dist > 5.0) break;
    dist += d * 0.80;
  }
  
  if (!hit) { gl_FragColor = vec4(0.0); return; }
  
  // ── Surface properties ─────────────────────────────────────────────────────
  vec3 N = calcNormal(p, rx, ry, t);
  vec3 V = -rd;
  
  // Get the sphere's LOCAL coordinates for rib coloring
  vec3 lp    = rotX(rotY(p, -ry), -rx);
  float r    = length(lp);
  float cosT = clamp(lp.y / max(r, 0.0001), -1.0, 1.0);
  float theta = acos(cosT);
  float phi   = atan(lp.z, lp.x);
  
  // Rib phase for this pixel
  float scroll   = t * 0.22;
  float ribPhase = fract(theta * 7.0 / PI - scroll / TAU);
  // 0=valley, 0.5=ridge top, 1=back to valley
  float ridge = 1.0 - abs(ribPhase * 2.0 - 1.0);  // 0=valley, 1=ridge peak
  float ridgeSmooth = ridge * ridge * (3.0 - 2.0*ridge);  // smoothstep
  
  // Under-rib shadow: normal pointing downward in LOCAL space
  vec3 localN = rotX(rotY(N, -ry), -rx);
  float underShadow = max(0.0, -localN.y) * (1.0 - ridgeSmooth);
  
  // ── Lighting ───────────────────────────────────────────────────────────────
  // Key light: upper-left front
  vec3 L1    = normalize(vec3(-0.50,  0.72, 0.82));
  float ndl1 = max(dot(N, L1), 0.0);
  
  // Fill light: lower-right
  vec3 L2    = normalize(vec3( 0.62, -0.38, 0.58));
  float ndl2 = max(dot(N, L2), 0.0) * 0.25;
  
  // Back rim (creates glowing edge opposite key)
  vec3 L3    = normalize(vec3( 0.10,  0.20, -1.00));
  float ndl3 = max(dot(N, L3), 0.0) * 0.18;
  
  // Specular (Blinn-Phong, two lobes)
  vec3 H1    = normalize(L1 + V);
  float spec1 = pow(max(dot(N, H1), 0.0), 72.0) * 0.90;
  float spec2 = pow(max(dot(N, H1), 0.0), 480.0) * 0.65;  // tight glint
  
  // Fresnel: glass-edge brightness
  float NoV     = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - NoV, 4.0);
  
  // ── Base color ─────────────────────────────────────────────────────────────
  // Ridge top: bright pearl-white with light lavender
  vec3 ridgeCol  = vec3(0.82, 0.86, 1.00);
  // Valley: deeper blue (you can see into the groove)
  vec3 valleyCol = vec3(0.48, 0.56, 0.90);
  // Under-rib shadow (underside of each rib)
  vec3 shadowCol = vec3(0.32, 0.40, 0.80);
  
  // Light the ridge tops from key light
  ridgeCol = mix(ridgeCol, vec3(0.90, 0.90, 1.0), ndl1 * 0.30);
  
  vec3 base = mix(valleyCol, ridgeCol, ridgeSmooth);
  base = mix(base, shadowCol, underShadow * 0.68);
  
  // Subtle bg bleed through translucency at edges
  vec3 bgCol = vec3(0.24, 0.32, 0.82);
  base = mix(base, bgCol, (1.0 - NoV) * 0.06 + fresnel * 0.05);
  
  // ── Caustic iridescent streaks ──────────────────────────────────────────────
  // Phase varies with rib position, azimuthal angle, time drift
  // Appears concentrated at rib edges and forward-facing specular patches
  float iriPhase = ribPhase * 2.8 + phi * 0.15 + t * 0.07;
  vec3  iriCol   = iridescent(iriPhase);
  
  // Caustic mask: rib edges + specular-facing geometry
  float edgeMask   = smoothstep(0.30, 0.50, ribPhase) * smoothstep(0.70, 0.50, ribPhase);
  float specFacing = pow(max(dot(N, normalize(vec3(-0.3, 0.5, 0.9))), 0.0), 8.0);
  // Animate streaks: they travel along the surface
  float streakPhi  = phi + t * 0.12;
  float streakMask = smoothstep(0.6, 0.9, sin(streakPhi * 2.5 + theta * 3.0));
  float causticStr = (edgeMask * 0.65 + specFacing * 0.25 + streakMask * 0.10) * 0.20;
  
  // ── Energy / alive quality ──────────────────────────────────────────────────
  // Traveling bright spots ("generation" feel — data moving through the sphere)
  float energy = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    // Each spark travels along a rib at slightly different speed/phase
    float sparkTheta = fract(fi * 0.25 + t * (0.08 + fi * 0.02)) * PI;
    float sparkPhi   = fi * 1.57 + t * (0.15 + fi * 0.07);
    // Position on sphere surface in local coords
    float dTheta = abs(theta - sparkTheta);
    float dPhi   = abs(phi - sparkPhi);
    dPhi = min(dPhi, TAU - dPhi);  // wrap around
    float sparkDist = sqrt(dTheta*dTheta + dPhi*dPhi*0.3);
    float sparkGlow = exp(-sparkDist * 12.0) * (0.12 + sin(t * (1.2 + fi*0.3)) * 0.06);
    energy += sparkGlow;
  }
  
  // ── Global breathing / pulse ───────────────────────────────────────────────
  float breath = 0.96 + sin(t * 0.31) * 0.04 + sin(t * 0.71) * 0.015;
  
  // ── Assemble color ─────────────────────────────────────────────────────────
  vec3 col = base;
  
  // Diffuse shading
  col *= (ndl1 * 0.70 + ndl2 + ndl3 + 0.24) * breath;
  
  // Caustics (additive)
  col += iriCol * causticStr;
  
  // Energy sparks (additive — white-blue traveling glow)
  col += vec3(0.80, 0.88, 1.0) * energy;
  
  // Specular
  col += vec3(1.00, 0.99, 0.97) * spec1;   // warm white
  col += vec3(0.90, 0.93, 1.00) * spec2;   // cool glint
  
  // Fresnel rim glow
  vec3 rimCol = mix(vec3(0.60, 0.70, 1.0), vec3(0.85, 0.88, 1.0), fresnel);
  col += rimCol * fresnel * 0.60;
  
  // Prismatic edge (chromatic rim)
  float edgeDist = length(uv / vec2(ar, 1.0));
  float rimZone  = smoothstep(0.62, 0.80, edgeDist);
  col.r += rimZone * fresnel * 0.05;
  col.b += rimZone * fresnel * 0.10;
  
  // Tonemap — bright and airy
  col = col / (col + 0.42) * 1.32;
  col = clamp(col, 0.0, 1.0);
  
  // Alpha
  float edgeFade = 1.0 - smoothstep(0.68, 0.84, edgeDist);
  float alpha = (0.88 + fresnel * 0.12) * edgeFade;
  
  gl_FragColor = vec4(col, alpha);
}
`;

// ─── Spring physics for rotation ─────────────────────────────────────────────
// Returns smoothly interpolated rotation angles with inertia
class SpringVec2 {
  x = 0; y = 0;          // current position
  vx = 0; vy = 0;        // velocity
  tx = 0; ty = 0;        // target
  stiffness = 0.08;      // spring force (0=limp, 1=instant)
  damping = 0.78;        // velocity decay (0=bouncy, 1=overdamped)

  setTarget(tx: number, ty: number) { this.tx = tx; this.ty = ty; }

  step() {
    this.vx += (this.tx - this.x) * this.stiffness;
    this.vy += (this.ty - this.y) * this.stiffness;
    this.vx *= this.damping;
    this.vy *= this.damping;
    this.x  += this.vx;
    this.y  += this.vy;
  }
}

// ─── WebGL Orb Component ──────────────────────────────────────────────────────
function RibbedOrb({ size }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spring    = useRef(new SpringVec2());
  const raf       = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: false, antialias: true,
    });
    if (!gl) return;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      const log = gl.getShaderInfoLog(s);
      if (log?.trim()) console.error("Shader compile:", log);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    const linkLog = gl.getProgramInfoLog(prog);
    if (linkLog?.trim()) console.error("Link:", linkLog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT    = gl.getUniformLocation(prog, "u_t");
    const uR    = gl.getUniformLocation(prog, "u_res");
    const uRot  = gl.getUniformLocation(prog, "u_rotXY");

    // Mouse → target rotation angles
    // Mouse at center = (0,0) = facing straight
    // Mouse at extreme corners = ±maxAngle
    const MAX_ANGLE = 0.52;  // ~30 degrees max tilt

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;   // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;   // -1..1 (inverted Y)
      // rx (tilt forward/back) driven by mouse Y
      // ry (spin left/right) driven by mouse X
      spring.current.setTarget(ny * MAX_ANGLE, nx * MAX_ANGLE);
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      spring.current.step();
      const { x: rx, y: ry } = spring.current;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,   ts * 0.001);
      gl.uniform2f(uR,   canvas.width, canvas.height);
      gl.uniform2f(uRot, rx, ry);
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
      ref={canvasRef}
      style={{
        width: size, height: size, display: "block",
        filter: [
          "drop-shadow(0 0 55px rgba(140,175,255,0.60))",
          "drop-shadow(0 0 120px rgba(90,130,255,0.28))",
          "drop-shadow(0 0 6px rgba(255,255,255,0.18))",
        ].join(" "),
      }}
    />
  );
}

// ─── 2D canvas: background + satellite blobs + orbit dot rings ───────────────
function SceneCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null);
  const raf    = useRef(0);
  const angles = useRef([0, 1.3, 2.7, 4.0, 5.4, 0.7, 3.5]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const blobs = [
      { oR:.52, spd:.00040, ph:0,   r:.100, rgb:[130,155,255], a:.50 },
      { oR:.42, spd:-.00028,ph:2.0, r:.068, rgb:[110,140,250], a:.40 },
      { oR:.62, spd:.00022, ph:1.1, r:.130, rgb:[145,165,255], a:.34 },
      { oR:.48, spd:-.00036,ph:3.8, r:.048, rgb:[120,150,255], a:.28 },
      { oR:.70, spd:.00018, ph:2.5, r:.090, rgb:[100,130,240], a:.22 },
      { oR:.38, spd:-.00050,ph:5.1, r:.036, rgb:[160,175,255], a:.26 },
      { oR:.78, spd:.00013, ph:4.2, r:.060, rgb:[110,145,248], a:.17 },
    ];

    const rings = [
      { r:.30, dots:50,  dotR:1.4, a:.26 },
      { r:.41, dots:66,  dotR:1.0, a:.18 },
      { r:.53, dots:84,  dotR:.78, a:.12 },
      { r:.65, dots:106, dotR:.60, a:.08 },
    ];

    const draw = (ts: number) => {
      const t  = ts * .001;
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const cx = W * .5;
      const cy = H * .5;
      const base = Math.min(W, H) * .30;

      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createRadialGradient(cx, cy*.88, 0, cx, cy, Math.max(W,H)*.86);
      bg.addColorStop(0,   "#4a5fd4");
      bg.addColorStop(.30, "#3d52cc");
      bg.addColorStop(.65, "#2e43c0");
      bg.addColorStop(1,   "#1e2da0");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const vig = ctx.createRadialGradient(cx, cy, base*.2, cx, cy, Math.max(W,H)*.72);
      vig.addColorStop(0, "rgba(55,80,210,.00)");
      vig.addColorStop(1, "rgba(10,16,78,.40)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // Orbit dot rings
      rings.forEach(ring => {
        const rPx = base * (ring.r / .30);
        const rY  = rPx * .26;
        for (let i = 0; i < ring.dots; i++) {
          const angle = (i / ring.dots) * Math.PI * 2 + t * .062;
          const depth = (Math.sin(angle) + 1.5) / 2.5;
          ctx.globalAlpha = ring.a * depth;
          ctx.fillStyle = "#b8c8ff";
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle)*rPx, cy + Math.sin(angle)*rY, ring.dotR, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // Satellite blobs
      blobs.forEach((b, i) => {
        angles.current[i] += b.spd;
        const angle = angles.current[i];
        const rPx  = base * (b.oR / .30);
        const rY   = rPx * .26;
        const bx   = cx + Math.cos(angle) * rPx;
        const by   = cy + Math.sin(angle) * rY;
        const bR   = base * b.r;
        const depth = (Math.sin(angle) + 1.0) * .5;
        const [r,g,bv] = b.rgb;
        const gr = ctx.createRadialGradient(bx-bR*.22, by-bR*.22, 0, bx, by, bR*1.35);
        gr.addColorStop(0,   `rgba(${r},${g},${bv},.92)`);
        gr.addColorStop(.45, `rgba(${r},${g},${bv},.50)`);
        gr.addColorStop(1,   `rgba(${r},${g},${bv},0)`);
        ctx.globalAlpha = b.a * (.45 + depth * .55);
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

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [ready,   setReady]   = useState(false);
  const [orbSize, setOrbSize] = useState(560);

  useEffect(() => {
    const calc = () => setOrbSize(Math.min(
      window.innerWidth * 0.70,
      window.innerHeight * 0.82,
      740,
    ));
    calc();
    window.addEventListener("resize", calc);
    const t = setTimeout(() => setReady(true), 100);
    return () => { window.removeEventListener("resize", calc); clearTimeout(t); };
  }, []);

  const fi = (d: number) => ({
    opacity:   ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 1s ${d}s cubic-bezier(.16,1,.3,1), transform 1s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden",
      position:"relative", fontFamily:"'Afacad Flux',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(255,230,100,.30);color:#fff;}
        @keyframes shimmer{to{background-position:200% center;}}

        .cta-pill{
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.93);border:none;color:#3244c8;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:500;letter-spacing:.01em;
          padding:15px 42px;border-radius:100px;cursor:pointer;
          box-shadow:0 4px 28px rgba(28,44,160,.28);
          transition:background .22s,transform .38s cubic-bezier(.16,1,.3,1),box-shadow .38s;
        }
        .cta-pill:hover{
          background:#fff;
          transform:translateY(-3px);
          box-shadow:0 14px 52px rgba(28,44,160,.38);
        }
        .cta-pill .arr{font-size:18px;transition:transform .38s cubic-bezier(.16,1,.3,1);}
        .cta-pill:hover .arr{transform:translateX(5px);}
      `}</style>

      {/* Background + satellites */}
      <SceneCanvas />

      {/* Orb — centered */}
      <div style={{ position:"fixed", inset:0, zIndex:2, pointerEvents:"none",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <RibbedOrb size={orbSize} />
      </div>

      {/* UI overlay */}
      <div style={{ position:"fixed", inset:0, zIndex:10, pointerEvents:"none",
        display:"flex", flexDirection:"column" }}>

        {/* Logo */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:30, ...fi(.10) }}>
          <div style={{ display:"flex", alignItems:"baseline" }}>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-.02em",
              color:"rgba(255,255,255,.96)" }}>EVERY</span>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-.02em",
              color:"rgba(255,255,255,.50)" }}>WHERE</span>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:".14em",
              color:"rgba(255,255,255,.50)", marginLeft:6, alignSelf:"center",
              textTransform:"uppercase" }}>Studio</span>
          </div>
        </div>

        {/* Center — headline + button */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center" }}>

          <h1 style={{
            ...fi(.22),
            fontSize:"clamp(48px,8vw,110px)",
            fontWeight:600, lineHeight:.94, letterSpacing:"-.025em",
            color:"#fff", textAlign:"center",
            textShadow:"0 2px 40px rgba(20,40,160,.35)",
            marginBottom:2,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.34),
            fontSize:"clamp(48px,8vw,110px)",
            fontWeight:600, lineHeight:.94, letterSpacing:"-.025em",
            textAlign:"center", marginBottom:52,
            background:"linear-gradient(115deg,#ffe566 0%,#fff 38%,#cce4ff 80%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            animation:"shimmer 6s linear infinite",
          }}>Everywhere.</h1>

          <div style={{ ...fi(.52), pointerEvents:"auto" }}>
            <button className="cta-pill" onClick={() => navigate("/explore")}>
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>

          <div style={{ ...fi(.70), marginTop:20 }}>
            <p style={{ fontSize:11, letterSpacing:".12em", textTransform:"uppercase",
              color:"rgba(255,255,255,.36)", fontWeight:400, textAlign:"center" }}>
              Composed Intelligence for Thought Leaders
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display:"flex", justifyContent:"center",
          paddingBottom:26, ...fi(1.0) }}>
          <span style={{ fontSize:10, letterSpacing:".12em",
            color:"rgba(255,255,255,.26)", fontWeight:300 }}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
