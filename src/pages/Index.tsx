import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// THE EVERYWHERE SIGNAL FIELD
// Full-screen cursor-reactive displacement field. Thousands of contour lines
// warp around the cursor like a gravitational lens. The orb sits at center,
// field lines curving around it. Pure sensation. No objects, no boxes.
// ─────────────────────────────────────────────────────────────────────────────

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// The orb shader — same iridescent blue as before, no black box
const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;

#define PI  3.14159265359
#define TAU 6.28318530718

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 rotX(vec3 p,float a){ p.yz=rot2(a)*p.yz; return p; }
vec3 rotY(vec3 p,float a){ p.xz=rot2(a)*p.xz; return p; }

float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  return noise(p)*.5+noise(p*2.1+vec2(1.7,9.2))*.25+noise(p*4.3+vec2(8.3,2.8))*.125;
}
vec3 thinFilm(float cosA,float thick){
  float opd=2.*thick*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-cosA*cosA)));
  vec3 phase=TAU*opd/vec3(.650,.550,.450);
  return .5+.5*cos(phase);
}
vec3 interior(vec3 lp,float t){
  float r=length(lp);
  float phi=atan(lp.z,lp.x), theta=acos(clamp(lp.y/max(r,.001),-1.,1.));
  float f1=fbm(vec2(phi*1.1+t*.07,theta*1.6+t*.045));
  float f2=fbm(vec2(phi*.8-t*.055,theta*1.2-t*.038)+vec2(3.1,7.4));
  float f3=fbm(vec2(phi*1.8+t*.09,theta*2.2+t*.06)+vec2(5.9,2.2));
  float r1=pow(max(0.,1.-abs(f1-.54)*5.5),2.0);
  float r2=pow(max(0.,1.-abs(f2-.47)*6.5),2.3);
  float r3=pow(max(0.,1.-abs(f3-.51)*5.0),1.8);
  vec3 c1=vec3(.20,.55,1.00)*r1*1.6;
  vec3 c2=vec3(.10,.30,.95)*r2*1.3;
  vec3 c3=vec3(.55,.80,1.00)*r3*.85;
  float core=exp(-r*r*2.5)*(.45+.55*sin(t*.38+.8));
  vec3 coreCol=vec3(.08,.14,.60)*core*2.2;
  vec3 base=vec3(.02,.03,.14)*(.4+.6*(1.-r));
  return base+coreCol+c1+c2+c3;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;
  float ar=u_res.x/u_res.y; uv.x*=ar;
  float rx=u_rotXY.x, ry=u_rotXY.y, t=u_t;
  float R=0.72;
  vec3 ro=vec3(0.,0.,2.3), rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, disc=b*b-c;
  if(disc<0.0){gl_FragColor=vec4(0.);return;}
  float sqrtD=sqrt(disc);
  float edgeAA=smoothstep(0.,.004,sqrtD);
  float t1=max(-b-sqrtD,0.), t2=-b+sqrtD;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  vec3 pF=ro+rd*t1, N=normalize(pF), V=-rd;
  float NoV=max(dot(N,V),0.);
  vec3 lp=rotX(rotY(pF,-ry),-rx);
  float phi_s=atan(lp.z,lp.x), theta_s=acos(clamp(lp.y/max(length(lp),.001),-1.,1.));
  float thickN=fbm(vec2(phi_s*.6+t*.020,theta_s*1.0-t*.015));
  float thick=.28+thickN*.65;
  vec3 film=thinFilm(NoV,thick);
  float F0=.06, fresnel=F0+(1.-F0)*pow(1.-NoV,4.0);
  float rim=pow(1.-NoV,5.5)*1.1; fresnel=min(fresnel+rim,.98);
  vec3 shellBase=mix(vec3(.06,.10,.42),vec3(.55,.68,.96),NoV*.6);
  vec3 shellCol=mix(shellBase,film*vec3(.95,1.,.98),.82);
  vec3 Lk=normalize(vec3(-.42,.78,.48)), H=normalize(Lk+V);
  shellCol+=vec3(1.,1.,1.)*pow(max(dot(N,H),0.),180.)*1.3;
  shellCol+=vec3(.65,.80,1.)*pow(max(dot(N,normalize(vec3(.70,.12,.52)+V)),0.),55.)*.4;
  vec3 intCol=vec3(0.);
  float span=t2-t1;
  for(int i=0;i<6;i++){
    float fi=float(i)/5.;
    vec3 sp=ro+rd*(t1+span*(fi*.82+.09));
    vec3 slp=rotX(rotY(sp,-ry),-rx);
    intCol+=interior(slp,t)*(1.-fi*.35);
  }
  intCol/=4.2;
  float shellOp=mix(.50,.92,fresnel);
  vec3 col=mix(intCol,shellCol,shellOp);
  col+=vec3(.25,.50,1.0)*rim*.60;
  col=max(col,vec3(0.));
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col=clamp(col,0.,1.);
  float alpha=edgeAA*(.90+fresnel*.10);
  gl_FragColor=vec4(col*alpha,alpha);
}
`;

// Spring physics
class Spring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(){ this.vx+=(this.tx-this.x)*.062; this.vy+=(this.ty-this.y)*.062; this.vx*=.86; this.vy*=.86; this.x+=this.vx; this.y+=this.vy; }
}

// The orb WebGL canvas — transparent bg, no box
function OrbCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf = useRef(0);
  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true })!;
    if (!gl) return;
    const mkS = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      const log = gl.getShaderInfoLog(s); if (log?.trim()) console.error(log); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, ORB_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const uT = gl.getUniformLocation(prog, "u_t");
    const uR = gl.getUniformLocation(prog, "u_res");
    const uRot = gl.getUniformLocation(prog, "u_rotXY");
    const onMove = (e: MouseEvent) => {
      spring.current.tx = (e.clientY / window.innerHeight - .5) * 2 * .55;
      spring.current.ty = (e.clientX / window.innerWidth - .5) * 2 * .55;
    };
    window.addEventListener("mousemove", onMove);
    const draw = (ts: number) => {
      spring.current.step();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * .001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uRot, spring.current.x, spring.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);
  return (
    <canvas ref={ref} style={{
      width: size, height: size, display: "block",
      filter: "drop-shadow(0 0 55px rgba(80,130,255,0.65)) drop-shadow(0 0 130px rgba(50,90,255,0.30))",
    }} />
  );
}

// ── THE SIGNAL FIELD ─────────────────────────────────────────────────────────
// Canvas of cursor-reactive contour lines. The orb sits at center.
// Lines curve around the cursor (gravity lens) and around the orb (field source).
function SignalField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
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

    // Smooth mouse tracking
    const targetMouse = { x: 0.5, y: 0.5 };
    const onMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const t = ts * 0.001;
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // Smooth mouse lerp
      mouse.current.x += (targetMouse.x - mouse.current.x) * 0.06;
      mouse.current.y += (targetMouse.y - mouse.current.y) * 0.06;

      const mx = mouse.current.x * W;
      const my = mouse.current.y * H;

      // Draw the background gradient
      const bg = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .5, Math.max(W, H) * .75);
      bg.addColorStop(0,   "#4a5fd4");
      bg.addColorStop(.30, "#3a4ec8");
      bg.addColorStop(.60, "#2b3db5");
      bg.addColorStop(.85, "#1c2c9e");
      bg.addColorStop(1,   "#111f88");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── SIGNAL FIELD LINES ─────────────────────────────────────────────────
      // Horizontal contour lines that warp based on:
      // 1. Cursor position (gravity lens effect)
      // 2. Orb at center (field source — lines curve around it)
      // 3. Slow time drift (alive feel)

      const orbX = W * 0.5;
      const orbY = H * 0.5;
      const orbR = Math.min(W, H) * 0.22; // orb's visual radius in field space

      const LINES = 52;        // number of contour lines
      const STEPS = 220;       // points per line (resolution)
      const LINE_SPACING = H / (LINES + 1);

      for (let li = 0; li < LINES; li++) {
        const baseY = (li + 1) * LINE_SPACING;
        // Distance from center line (0 = middle line)
        const centerDist = Math.abs(li - LINES / 2) / (LINES / 2);

        // Line brightness: brighter near center, dimmer at edges
        const alpha = 0.08 + (1 - centerDist) * 0.22;

        ctx.beginPath();
        let started = false;

        for (let si = 0; si <= STEPS; si++) {
          const px = (si / STEPS) * W;
          let py = baseY;

          // ── Cursor displacement ──────────────────────────────────────────
          // Gaussian lens: lines bend toward/away from cursor
          const dxM = px - mx, dyM = py - my;
          const distM = Math.sqrt(dxM * dxM + dyM * dyM);
          const lensR = W * 0.28;
          const lensFalloff = Math.exp(-(distM * distM) / (lensR * lensR * 0.5));
          // Push lines away from cursor (repulsion)
          const cursorPush = lensFalloff * (baseY - my) * 0.35;

          // ── Orb field displacement ───────────────────────────────────────
          // Lines bulge around the orb (field source)
          const dxO = px - orbX, dyO = py - orbY;
          const distO = Math.sqrt(dxO * dxO + dyO * dyO);
          // Smooth falloff around orb — lines curve around it
          const orbField = Math.exp(-(distO * distO) / (orbR * orbR * 1.8));
          // Vertical push away from orb center
          const orbPush = orbField * (baseY - orbY) * 1.2;
          // Horizontal push (barrel distortion around orb)
          const orbPushX = orbField * dxO * 0.15;

          // ── Time-based organic drift ──────────────────────────────────────
          const wave1 = Math.sin(px * 0.003 + t * 0.4 + li * 0.12) * 4.5;
          const wave2 = Math.sin(px * 0.007 - t * 0.28 + li * 0.08) * 2.0;
          const wave3 = Math.sin(px * 0.012 + t * 0.55 + li * 0.20) * 1.2;

          py += cursorPush + orbPush + wave1 + wave2 + wave3;
          const adjustedX = px + orbPushX;

          // ── Skip drawing inside the orb ──────────────────────────────────
          const dxSkip = adjustedX - orbX, dySkip = py - orbY;
          const distSkip = Math.sqrt(dxSkip * dxSkip + dySkip * dySkip);
          if (distSkip < orbR * 0.82) {
            started = false;
            ctx.stroke();
            ctx.beginPath();
            continue;
          }

          if (!started) {
            ctx.moveTo(adjustedX, py);
            started = true;
          } else {
            ctx.lineTo(adjustedX, py);
          }
        }

        // Line color: bright electric blue, varies slightly by position
        const hue = 220 + centerDist * 20;
        const lightness = 55 + (1 - centerDist) * 25;
        ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 0.65 + (1 - centerDist) * 0.5;
        ctx.stroke();
      }

      // ── Orb glow in the field gap ──────────────────────────────────────────
      const orbGlow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 2.2);
      const breathe = 0.92 + Math.sin(t * 0.28) * 0.08;
      orbGlow.addColorStop(0,   `rgba(80,130,255,${0.18 * breathe})`);
      orbGlow.addColorStop(0.4, `rgba(60,100,240,${0.08 * breathe})`);
      orbGlow.addColorStop(1,   "rgba(40,70,200,0)");
      ctx.fillStyle = orbGlow;
      ctx.fillRect(0, 0, W, H);

      // ── Edge vignette ──────────────────────────────────────────────────────
      const vig = ctx.createRadialGradient(W * .5, H * .5, W * .28, W * .5, H * .5, Math.max(W, H) * .72);
      vig.addColorStop(0, "rgba(0,0,20,0)");
      vig.addColorStop(1, "rgba(5,8,40,0.48)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [orbSize, setOrbSize] = useState(480);

  useEffect(() => {
    const calc = () => setOrbSize(Math.min(
      window.innerWidth * 0.52,
      window.innerHeight * 0.70,
      580,
    ));
    calc();
    window.addEventListener("resize", calc);
    const t = setTimeout(() => setReady(true), 100);
    return () => { window.removeEventListener("resize", calc); clearTimeout(t); };
  }, []);

  const fi = (d: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(16px)",
    transition: `opacity .9s ${d}s cubic-bezier(.16,1,.3,1), transform .9s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      position: "relative", fontFamily: "'Afacad Flux', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(255,220,80,.28); color: #fff; }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .cta-pill {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.92); border: none; color: #1e2da0;
          font-family: 'Afacad Flux', sans-serif;
          font-size: 16px; font-weight: 600; letter-spacing: .01em;
          padding: 15px 44px; border-radius: 100px; cursor: pointer;
          box-shadow: 0 6px 30px rgba(10,20,130,.35), 0 2px 8px rgba(255,255,255,.15);
          transition: background .22s, transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
        }
        .cta-pill:hover {
          background: #fff;
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 14px 50px rgba(10,20,130,.45), 0 0 40px rgba(100,150,255,.25);
        }
        .arr { font-size: 18px; display: inline-block; transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .cta-pill:hover .arr { transform: translateX(5px); }
      `}</style>

      {/* Signal field — full screen, interactive */}
      <SignalField />

      {/* Orb — dead center, transparent canvas on the field */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <OrbCanvas size={orbSize} />
      </div>

      {/* UI layer */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 28, ...fi(.08) }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.95)" }}>EVERY</span>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.42)" }}>WHERE</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", color: "rgba(255,255,255,.38)", marginLeft: 6, alignSelf: "center", textTransform: "uppercase" }}>Studio™</span>
          </div>
        </div>

        {/* Center: headline + CTA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{
            ...fi(.25),
            fontSize: "clamp(48px, 8vw, 112px)",
            fontWeight: 700, lineHeight: .95, letterSpacing: "-.035em",
            color: "#fff", textAlign: "center",
            textShadow: "0 2px 40px rgba(10,20,120,.55)",
            marginBottom: 0,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.38),
            fontSize: "clamp(48px, 8vw, 112px)",
            fontWeight: 700, lineHeight: .95, letterSpacing: "-.035em",
            textAlign: "center", marginBottom: 52,
            background: "linear-gradient(110deg, #ffe47a 0%, #fff 38%, #c8e0ff 80%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 5s linear infinite",
          }}>Everywhere.</h1>

          <div style={{ ...fi(.55), pointerEvents: "auto" }}>
            <button className="cta-pill" onClick={() => navigate("/explore")}>
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>
        </div>

        {/* Bottom wordmark */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 26, ...fi(.95) }}>
          <span style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.30)", fontWeight: 400 }}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
