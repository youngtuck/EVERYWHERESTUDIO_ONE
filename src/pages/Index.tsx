import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

// ─── WebGL Orb — adapted from MAIA Orb v4 technique ─────────────────────────
// Uses simplex noise + fluid warp for smooth aurora-like motion.
// Brand palette: deep navy → gold → electric blue (not purple aurora).

const ORB_FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse; // normalized 0-1

// ── Simplex noise 3D (Ashima / Stefan Gustavson) ───────────────────────────
vec3 mod289(vec3 x){ return x - floor(x/289.0)*289.0; }
vec4 mod289v(vec4 x){ return x - floor(x/289.0)*289.0; }
vec4 perm(vec4 x){ return mod289v((x*34.0+1.0)*x); }

float noise3(vec3 v){
  vec3 i = floor(v + dot(v, vec3(1.0/3.0)));
  vec3 x0 = v - i + dot(i, vec3(1.0/6.0));
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + 1.0/6.0;
  vec3 x2 = x0 - i2 + 1.0/3.0;
  vec3 x3 = x0 - 0.5;
  i = mod289(i);
  vec4 p = perm(perm(perm(
    i.z + vec4(0.0,i1.z,i2.z,1.0))
    + i.y + vec4(0.0,i1.y,i2.y,1.0))
    + i.x + vec4(0.0,i1.x,i2.x,1.0));
  vec4 j = p - 49.0*floor(p/49.0);
  vec4 gx = floor(j/7.0);
  vec4 gy = j - 7.0*gx;
  vec4 ox = (gx*2.0+0.5)/7.0-1.0;
  vec4 oy = (gy*2.0+0.5)/7.0-1.0;
  vec4 h = 1.0-abs(ox)-abs(oy);
  vec4 b0 = vec4(ox.xy,oy.xy);
  vec4 b1 = vec4(ox.zw,oy.zw);
  vec4 s0 = floor(b0)*2.0+1.0;
  vec4 s1 = floor(b1)*2.0+1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 g0 = vec3(a0.xy,h.x);
  vec3 g1 = vec3(a0.zw,h.y);
  vec3 g2 = vec3(a1.xy,h.z);
  vec3 g3 = vec3(a1.zw,h.w);
  vec4 nr = 1.79284291400159-0.85373472095314*vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3));
  g0*=nr.x; g1*=nr.y; g2*=nr.z; g3*=nr.w;
  vec4 m = max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m = m*m*m*m;
  return 42.0*dot(m, vec4(dot(g0,x0),dot(g1,x1),dot(g2,x2),dot(g3,x3)));
}

// 3-octave FBM (fast)
float fbm3(vec3 p){
  return noise3(p)*0.55 + noise3(p*2.0+100.0)*0.30 + noise3(p*4.0+200.0)*0.15;
}

// Fluid warp — single pass (same as MAIA technique)
float fluid(vec3 p, float t){
  vec3 q = vec3(
    fbm3(p + vec3(0.0, 0.0, t*0.12)),
    fbm3(p + vec3(5.2, 1.3, t*0.10)),
    0.0
  );
  return fbm3(p + 3.0*q);
}

// ── EVERYWHERE color palettes (gold / blue / deep navy) ────────────────────
// Primary: deep navy through electric blue to gold
vec3 palGold(float t){
  // Cycles: near-black → deep navy → cornflower blue → gold
  return vec3(
    0.42 + 0.42*cos(6.283*(t*0.9 + 0.62)),
    0.40 + 0.38*cos(6.283*(t*0.8 + 0.48)),
    0.18 + 0.22*cos(6.283*(t*1.0 + 0.22))
  );
}
// Secondary: electric blue through teal
vec3 palBlue(float t){
  return vec3(
    0.18 + 0.28*cos(6.283*(t*0.7 + 0.58)),
    0.38 + 0.35*cos(6.283*(t*0.9 + 0.38)),
    0.62 + 0.32*cos(6.283*(t*1.1 + 0.10))
  );
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  
  // Mouse parallax — shift sample slightly toward cursor
  vec2 mouseOffset = (u_mouse - 0.5) * 0.06;
  vec2 c = (uv - 0.5) * 2.0 - mouseOffset;
  float dist = length(c);

  // Sphere mask with soft edge
  float mask = 1.0 - smoothstep(0.79, 0.86, dist);
  if(mask < 0.001){ gl_FragColor = vec4(0.0); return; }

  float t = u_time;

  // Sphere surface normal
  float z = sqrt(max(0.0, 1.0 - dist*dist*1.35));
  vec3 N = normalize(vec3(c, z));
  vec3 sph = vec3(c, z);

  // Breathing scale
  vec3 wp = sph * 1.6 * (1.0 + sin(t*0.28)*0.007);

  // Fluid layers
  float f1 = fluid(wp, t);
  float f2 = noise3(sph*2.8 + vec3(t*0.13, t*0.09, t*0.11));
  float flow = f1*0.7 + f2*0.3;

  // Color mix — EVERYWHERE palette
  vec3 c1 = palGold(flow*0.8 + t*0.016 + dist*0.25);
  vec3 c2 = palBlue(f2*0.7 - t*0.012 + atan(c.y, c.x)*0.10);
  float dm = smoothstep(-0.2, 0.6, flow);
  vec3 base = mix(c1, c2, dm*0.65);
  // Add depth variation on z
  base = mix(base, palGold(f2*0.5 + t*0.020 + z*0.4), (1.0-z)*0.22);

  // Luminance
  float lum = 0.40 + smoothstep(0.15, 0.55, flow)*0.48 - smoothstep(0.0, -0.4, f1)*0.45;
  vec3 col = base * lum;

  // Deep interior shadow (adds depth)
  col = mix(col, vec3(0.005, 0.010, 0.028), smoothstep(0.4, -0.3, f1)*0.45);

  // Core scatter glow
  col += base * exp(-dist*dist*2.5)*0.10;
  // Gold core inner light
  col += vec3(0.95, 0.78, 0.22) * exp(-dist*dist*5.0)*0.06;
  // Blue atmospheric scatter
  col += vec3(0.20, 0.42, 0.80) * exp(-dist*dist*3.5)*0.05;

  // Glass rim — gold-tinged
  float rimBlend = smoothstep(0.68, 0.82, dist) * smoothstep(0.86, 0.79, dist);
  vec3 rimCol = mix(
    palGold(atan(c.y, c.x)*0.5 + t*0.04 + flow*0.4),
    vec3(0.88, 0.92, 1.0),
    0.30
  );
  col += rimCol * rimBlend * 0.52;

  // Fresnel rim (edge glow)
  float fresnel = pow(1.0 - z, 4.0);
  col += rimCol * fresnel * 0.30;

  // Primary specular — warm light from upper-left
  vec3 L1 = normalize(vec3(-0.45, 0.60, 0.68));
  col += vec3(1.0, 0.95, 0.80) * pow(max(dot(N, L1), 0.0), 52.0) * 0.55;

  // Secondary specular — cool blue fill from right
  vec3 L2 = normalize(vec3(0.55, 0.28, 0.82));
  col += vec3(0.82, 0.90, 1.0) * pow(max(dot(N, L2), 0.0), 100.0) * 0.22;

  // Pulse modulation (subtle breathing glow)
  col *= 0.93 + sin(t*0.22)*0.07;

  // Edge darkening (like a real sphere)
  col *= mix(1.0, 0.68, pow(dist, 2.8));

  // Tonemap
  col = col / (col + 0.85) * 1.3;

  gl_FragColor = vec4(col * mask, mask);
}
`;

const ORB_VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Size the canvas — orb is centered, sized to ~55vh
    const setSize = () => {
      const size = Math.min(window.innerWidth * 0.58, window.innerHeight * 0.72, 700);
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) return;

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, ORB_VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, ORB_FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT = gl.getUniformLocation(prog, "u_time");
    const uR = gl.getUniformLocation(prog, "u_res");
    const uM = gl.getUniformLocation(prog, "u_mouse");

    // Track mouse globally
    const onMove = (e: MouseEvent) => {
      targetRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight, // flip Y for GL
      };
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      // Smooth lerp on mouse
      const m = mouseRef.current;
      const tm = targetRef.current;
      m.x += (tm.x - m.x) * 0.045;
      m.y += (tm.y - m.y) * 0.045;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * 0.001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uM, m.x, m.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        // Slight mouse parallax is handled inside shader — no extra CSS needed
        filter: "drop-shadow(0 0 80px rgba(74,144,217,0.35)) drop-shadow(0 0 30px rgba(245,198,66,0.15))",
      }}
    />
  );
}

// ─── Satellite orbs — pure CSS/canvas, no extra WebGL context ─────────────────
function SatelliteOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const angleRef = useRef([0, 1.3, 2.7, 4.1, 5.5]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const sats = [
      { speed: 0.0004,  ringR: 0.30, size: 0.038, alpha: 0.55, col: "#4A90D9" },
      { speed: -0.0003, ringR: 0.25, size: 0.028, alpha: 0.48, col: "#F5C642" },
      { speed: 0.00025, ringR: 0.38, size: 0.052, alpha: 0.38, col: "#4A90D9" },
      { speed: -0.0005, ringR: 0.32, size: 0.022, alpha: 0.30, col: "#188FA7" },
      { speed: 0.00035, ringR: 0.44, size: 0.034, alpha: 0.22, col: "#F5C642" },
    ];

    const rings = [
      { r: 0.28, dots: 55,  dotR: 1.3, alpha: 0.20 },
      { r: 0.36, dots: 72,  dotR: 1.0, alpha: 0.14 },
      { r: 0.45, dots: 92,  dotR: 0.8, alpha: 0.09 },
    ];

    const draw = (ts: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const baseR = Math.min(W, H) * 0.28;

      ctx.clearRect(0, 0, W, H);

      // Dotted orbit rings (elliptical, like Telefónica)
      const t = ts * 0.001;
      rings.forEach(ring => {
        const rPx = baseR * (ring.r / 0.28);
        const rY = rPx * 0.30; // flatten vertically

        for (let i = 0; i < ring.dots; i++) {
          const angle = (i / ring.dots) * Math.PI * 2 + t * 0.06;
          const x = cx + Math.cos(angle) * rPx;
          const y = cy + Math.sin(angle) * rY;
          // Perspective fade: brighter when "in front"
          const depth = (Math.sin(angle) + 1.4) / 2.4;
          ctx.globalAlpha = ring.alpha * depth;
          ctx.fillStyle = "#7ab0e8";
          ctx.beginPath();
          ctx.arc(x, y, ring.dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Satellite orbs
      sats.forEach((sat, i) => {
        angleRef.current[i] += sat.speed;
        const angle = angleRef.current[i];
        const rPx = baseR * (sat.ringR / 0.28);
        const rY = rPx * 0.30;

        const sx = cx + Math.cos(angle) * rPx;
        const sy = cy + Math.sin(angle) * rY;
        const sR = baseR * sat.size;

        // Depth from angle
        const depth = (Math.sin(angle) + 1.0) * 0.5;
        const alpha = sat.alpha * (0.5 + depth * 0.5);

        const grad = ctx.createRadialGradient(sx - sR*0.25, sy - sR*0.25, 0, sx, sy, sR * 1.2);
        grad.addColorStop(0, sat.col + "cc");
        grad.addColorStop(0.5, sat.col + "77");
        grad.addColorStop(1, sat.col + "00");

        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, sR, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const fadeIn = (delay: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0px)" : "translateY(16px)",
    transition: `opacity 1.1s ${delay}s cubic-bezier(.16,1,.3,1), transform 1.1s ${delay}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#07070d",
      fontFamily: "'Afacad Flux', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(245,198,66,.28); color: #fff; }

        @keyframes shimmer-text {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .enter-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.20);
          color: rgba(255,255,255,0.88);
          font-family: 'Afacad Flux', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.05em;
          padding: 14px 34px;
          border-radius: 100px;
          cursor: pointer;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background .3s, border-color .3s, transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
        }
        .enter-btn:hover {
          background: rgba(255,255,255,0.11);
          border-color: rgba(255,255,255,0.42);
          transform: translateY(-3px);
          box-shadow: 0 10px 50px rgba(74,144,217,0.28), 0 4px 20px rgba(245,198,66,0.12);
        }
        .enter-btn .arr {
          font-size: 18px;
          transition: transform .35s cubic-bezier(.16,1,.3,1);
        }
        .enter-btn:hover .arr { transform: translateX(5px); }
      `}</style>

      {/* Satellite canvas layer (behind orb, above bg) */}
      <SatelliteOrbs />

      {/* Orb — centered absolutely */}
      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        pointerEvents: "none",
      }}>
        <OrbCanvas />
      </div>

      {/* UI layer — above everything */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      }}>

        {/* Logo — top center */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 32,
          ...fadeIn(0.1),
        }}>
          <Logo size="md" onDark={true} />
        </div>

        {/* Center text + button */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0,
          paddingBottom: "14vh",
        }}>
          {/* Eyebrow */}
          <div style={{
            ...fadeIn(0.3),
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}>
            <div style={{ width: 18, height: 1, background: "rgba(255,255,255,.22)" }} />
            <span style={{
              fontSize: 11, fontWeight: 500,
              letterSpacing: "0.22em", color: "rgba(255,255,255,.38)",
              textTransform: "uppercase",
            }}>Composed Intelligence</span>
            <div style={{ width: 18, height: 1, background: "rgba(255,255,255,.22)" }} />
          </div>

          {/* Headline */}
          <h1 style={{
            ...fadeIn(0.45),
            fontSize: "clamp(36px,5.5vw,72px)",
            fontWeight: 800,
            lineHeight: 1.0,
            color: "#fff",
            textAlign: "center",
            letterSpacing: "-.03em",
            marginBottom: 6,
            textShadow: "0 2px 40px rgba(0,0,0,.8)",
          }}>
            Your thinking.
          </h1>
          <h1 style={{
            ...fadeIn(0.55),
            fontSize: "clamp(36px,5.5vw,72px)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-.03em",
            marginBottom: 40,
            textAlign: "center",
            background: "linear-gradient(110deg, #F5C642 5%, #7ab4f8 45%, #F5C642 90%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer-text 5s linear infinite",
          }}>
            Everywhere.
          </h1>

          {/* Button */}
          <div style={{ ...fadeIn(0.75), pointerEvents: "auto" }}>
            <button
              className="enter-btn"
              onClick={() => navigate("/explore")}
            >
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>
        </div>

        {/* Bottom caption */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: 32,
          ...fadeIn(1.1),
        }}>
          <span style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,.22)",
            fontWeight: 300,
          }}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
