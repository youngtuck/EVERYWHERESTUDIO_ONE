import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;
uniform float u_breath;
#define TAU 6.28318530718
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 rotX(vec3 p,float a){ p.yz=rot2(a)*p.yz; return p; }
vec3 rotY(vec3 p,float a){ p.xz=rot2(a)*p.xz; return p; }
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){ return noise(p)*.5+noise(p*2.1+vec2(1.7,9.2))*.25+noise(p*4.3+vec2(8.3,2.8))*.125; }
vec3 thinFilm(float cosA,float thick){
  float opd=2.*thick*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-cosA*cosA)));
  return .5+.5*cos(TAU*opd/vec3(.650,.550,.450));
}
vec3 interior(vec3 lp,float t){
  float r=length(lp);
  float phi=atan(lp.z,lp.x), theta=acos(clamp(lp.y/max(r,.001),-1.,1.));
  float f1=fbm(vec2(phi*1.1+t*.14,theta*1.6+t*.09));
  float f2=fbm(vec2(phi*.8-t*.11,theta*1.2-t*.07)+vec2(3.1,7.4));
  float f3=fbm(vec2(phi*1.8+t*.18,theta*2.2+t*.12)+vec2(5.9,2.2));
  float r1=pow(max(0.,1.-abs(f1-.54)*5.5),2.0);
  float r2=pow(max(0.,1.-abs(f2-.47)*6.5),2.3);
  float r3=pow(max(0.,1.-abs(f3-.51)*5.0),1.8);
  vec3 c1=vec3(.20,.55,1.00)*r1*1.6;
  vec3 c2=vec3(.10,.30,.95)*r2*1.3;
  vec3 c3=vec3(.55,.80,1.00)*r3*.85;
  float core=exp(-r*r*2.5)*(.45+.55*sin(t*.38+.8));
  float core2=exp(-r*r*1.8)*(.25+.35*sin(t*.72+.2));
  return vec3(.02,.03,.14)*(.4+.6*(1.-r))+vec3(.08,.14,.60)*core*2.2+vec3(.12,.20,.70)*core2*1.4+c1+c2+c3;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;
  float ar=u_res.x/u_res.y; uv.x*=ar;
  float rx=u_rotXY.x, ry=u_rotXY.y, t=u_t;
  float breath=0.96+u_breath*0.08;
  vec3 ro=vec3(0.,0.,2.3), rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd), c=dot(ro,ro)-.72*.72*breath*breath, disc=b*b-c;
  if(disc<0.0){gl_FragColor=vec4(0.);return;}
  float sqD=sqrt(disc);
  float edgeAA=smoothstep(0.,.004,sqD);
  float t1=max(-b-sqD,0.), t2=-b+sqD;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  vec3 pF=ro+rd*t1, N=normalize(pF), V=-rd;
  float NoV=max(dot(N,V),0.);
  vec3 lp=rotX(rotY(pF,-ry),-rx);
  float ps=atan(lp.z,lp.x), ts=acos(clamp(lp.y/max(length(lp),.001),-1.,1.));
  vec3 film=thinFilm(NoV,.28+fbm(vec2(ps*.6+t*.042,ts-.032*t))*.65);
  float fresnel=min(.06+(1.-.06)*pow(1.-NoV,4.0)+pow(1.-NoV,5.5)*1.1,.98);
  vec3 shellCol=mix(mix(vec3(.06,.10,.42),vec3(.55,.68,.96),NoV*.6),film*.98,.82);
  shellCol*=breath;
  vec3 Lk=normalize(vec3(-.42,.78,.48)), H=normalize(Lk+V);
  shellCol+=pow(max(dot(N,H),0.),180.)*1.3+vec3(.65,.80,1.)*pow(max(dot(N,normalize(vec3(.70,.12,.52)+V)),0.),55.)*.4;
  vec3 intCol=vec3(0.);
  float span=t2-t1;
  for(int i=0;i<6;i++){
    float fi=float(i)/5.;
    intCol+=interior(rotX(rotY(ro+rd*(t1+span*(fi*.82+.09)),-ry),-rx),t)*(1.-fi*.35);
  }
  intCol/=4.2;
  intCol*=breath;
  vec3 col=mix(intCol,shellCol,mix(.50,.92,fresnel));
  col+=vec3(.25,.50,1.0)*pow(1.-NoV,5.5)*1.1*.60*breath;
  col=max(col,vec3(0.));
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  gl_FragColor=vec4(clamp(col,0.,1.)*edgeAA*(.90+fresnel*.10),edgeAA*(.90+fresnel*.10));
}
`;

class Spring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(){ this.vx+=(this.tx-this.x)*.062; this.vy+=(this.ty-this.y)*.062; this.vx*=.86; this.vy*=.86; this.x+=this.vx; this.y+=this.vy; }
}

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
    const mkS = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
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
    const uBreath = gl.getUniformLocation(prog, "u_breath");
    const onMove = (e: MouseEvent) => {
      spring.current.tx = (e.clientY / window.innerHeight - .5) * 2 * .55;
      spring.current.ty = (e.clientX / window.innerWidth - .5) * 2 * .55;
    };
    window.addEventListener("mousemove", onMove);
    const draw = (ts: number) => {
      spring.current.step();
      const t = ts * 0.001;
      const breath = Math.sin(t * 0.75) * 0.5 + 0.5;
      const idleX = Math.sin(t * 0.42) * 0.14;
      const idleY = Math.cos(t * 0.38) * 0.14;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * .001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uRot, spring.current.x + idleX, spring.current.y + idleY);
      gl.uniform1f(uBreath!, breath);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);
  return (
    <canvas ref={ref} style={{
      width: size, height: size, display: "block",
    }} />
  );
}

// ── SIGNAL FIELD with fluid cursor physics ─────────────────────────────────
function SignalField() {
  const ref = useRef<HTMLCanvasElement>(null);
  // Use a smoother spring for the field lines - higher inertia = more fluid
  const mx = useRef(0.5);
  const my = useRef(0.5);
  const tvx = useRef(0.5);
  const tvy = useRef(0.5);
  const vx = useRef(0);
  const vy = useRef(0);
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
    const onMove = (e: MouseEvent) => {
      tvx.current = e.clientX / window.innerWidth;
      tvy.current = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const t = ts * 0.001;
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // Very soft spring - stiffness 0.028, damping 0.88
      // This gives the lines a heavy, fluid, mercury-like follow
      vx.current += (tvx.current - mx.current) * 0.028;
      vy.current += (tvy.current - my.current) * 0.028;
      vx.current *= 0.88;
      vy.current *= 0.88;
      mx.current += vx.current;
      my.current += vy.current;

      const cmx = mx.current * W;
      const cmy = my.current * H;

      // Background gradient
      const bg = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .5, Math.max(W, H) * .75);
      bg.addColorStop(0,   "#4a5fd4");
      bg.addColorStop(.30, "#3a4ec8");
      bg.addColorStop(.60, "#2b3db5");
      bg.addColorStop(.85, "#1c2c9e");
      bg.addColorStop(1,   "#111f88");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const orbX = W * 0.5;
      const orbY = H * 0.5;
      const orbR = Math.min(W, H) * 0.22;

      // Cursor influence radius - wider = more fluid sweep
      const lensR = W * 0.38;

      const LINES = 56;
      const STEPS = 280;
      const LINE_SPACING = H / (LINES + 1);

      for (let li = 0; li < LINES; li++) {
        const baseY = (li + 1) * LINE_SPACING;
        const centerDist = Math.abs(li - LINES / 2) / (LINES / 2);
        const alpha = 0.07 + (1 - centerDist) * 0.24;

        ctx.beginPath();
        let drawing = false;

        for (let si = 0; si <= STEPS; si++) {
          const px = (si / STEPS) * W;
          let py = baseY;

          // Cursor lens displacement - larger radius, softer falloff
          const dxM = px - cmx, dyM = py - cmy;
          const distM = Math.sqrt(dxM * dxM + dyM * dyM);
          const lensFalloff = Math.exp(-(distM * distM) / (lensR * lensR * 0.6));
          const cursorPush = lensFalloff * (baseY - cmy) * 0.42;

          // Orb field
          const dxO = px - orbX, dyO = py - orbY;
          const distO = Math.sqrt(dxO * dxO + dyO * dyO);
          const orbField = Math.exp(-(distO * distO) / (orbR * orbR * 1.8));
          const orbPushY = orbField * (baseY - orbY) * 1.2;
          const orbPushX = orbField * dxO * 0.15;

          // Organic time drift
          const wave1 = Math.sin(px * 0.0028 + t * 0.35 + li * 0.11) * 5.0;
          const wave2 = Math.sin(px * 0.0065 - t * 0.25 + li * 0.07) * 2.2;
          const wave3 = Math.sin(px * 0.011  + t * 0.50 + li * 0.18) * 1.1;

          py += cursorPush + orbPushY + wave1 + wave2 + wave3;
          const ax = px + orbPushX;

          // Gap around orb
          const dxS = ax - orbX, dyS = py - orbY;
          if (Math.sqrt(dxS * dxS + dyS * dyS) < orbR * 0.83) {
            if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false; }
            continue;
          }

          if (!drawing) { ctx.moveTo(ax, py); drawing = true; }
          else ctx.lineTo(ax, py);
        }

        const hue = 220 + centerDist * 18;
        const light = 58 + (1 - centerDist) * 22;
        ctx.strokeStyle = `hsla(${hue},85%,${light}%,${alpha})`;
        ctx.lineWidth = 0.6 + (1 - centerDist) * 0.55;
        ctx.stroke();
      }

      // Orb glow
      const breathe = 0.92 + Math.sin(t * 0.28) * 0.08;
      const orbGlow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 2.4);
      orbGlow.addColorStop(0,   `rgba(80,130,255,${0.18 * breathe})`);
      orbGlow.addColorStop(0.4, `rgba(60,100,240,${0.08 * breathe})`);
      orbGlow.addColorStop(1,   "rgba(40,70,200,0)");
      ctx.fillStyle = orbGlow;
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const vig = ctx.createRadialGradient(W*.5, H*.5, W*.28, W*.5, H*.5, Math.max(W,H)*.72);
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

// ── CUSTOM CURSOR ─────────────────────────────────────────────────────────────
function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos     = useRef({ x: -100, y: -100 });
  const ring    = useRef({ x: -100, y: -100 });
  const raf     = useRef(0);
  const isHover = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      // Check if over interactive element
      const el = document.elementFromPoint(e.clientX, e.clientY);
      isHover.current = !!(el?.closest("button, a, [role=button]"));
    };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      const dot  = dotRef.current;
      const ring = ringRef.current;
      if (!dot || !ring) { raf.current = requestAnimationFrame(tick); return; }

      // Dot: snappy - follows cursor directly
      dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;

      // Ring: lazy spring follow
      const rx = parseFloat(ring.dataset.x || String(pos.current.x));
      const ry = parseFloat(ring.dataset.y || String(pos.current.y));
      const nx = rx + (pos.current.x - rx) * 0.10;
      const ny = ry + (pos.current.y - ry) * 0.10;
      ring.dataset.x = String(nx);
      ring.dataset.y = String(ny);

      const scale = isHover.current ? 1.8 : 1;
      ring.style.transform = `translate(${nx - 18}px, ${ny - 18}px) scale(${scale})`;
      ring.style.opacity   = isHover.current ? "0.55" : "0.35";
      ring.style.borderColor = isHover.current ? "rgba(180,210,255,0.8)" : "rgba(140,180,255,0.6)";

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Dot - sharp, instant */}
      <div ref={dotRef} style={{
        position: "fixed", top: 0, left: 0,
        width: 8, height: 8, borderRadius: "50%",
        background: "rgba(200,220,255,0.95)",
        pointerEvents: "none", zIndex: 9999,
        transition: "width .2s, height .2s",
        boxShadow: "0 0 8px rgba(120,170,255,0.8)",
        willChange: "transform",
      }} />
      {/* Ring - lagging, atmospheric */}
      <div ref={ringRef} style={{
        position: "fixed", top: 0, left: 0,
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid rgba(140,180,255,0.6)",
        pointerEvents: "none", zIndex: 9998,
        transition: "border-color .3s, opacity .3s, transform .08s linear",
        willChange: "transform",
      }} />
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady]     = useState(false);
  const [orbSize, setOrbSize] = useState(480);

  useEffect(() => {
    const calc = () => setOrbSize(Math.min(window.innerWidth * 0.52, window.innerHeight * 0.70, 580));
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
      cursor: "none", // hide default cursor
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        * { cursor: none !important; }
        ::selection { background: rgba(255,220,80,.28); color: #fff; }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .cta-pill {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.92); border: none; color: #1e2da0;
          font-family: 'Afacad Flux', sans-serif;
          font-size: 16px; font-weight: 600; letter-spacing: .01em;
          padding: 15px 44px; border-radius: 100px;
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
        @keyframes orbBreathe {
          0%, 100% { filter: drop-shadow(0 0 55px rgba(80,130,255,0.65)) drop-shadow(0 0 130px rgba(50,90,255,0.30)); transform: scale(1); }
          50%      { filter: drop-shadow(0 0 70px rgba(90,150,255,0.75)) drop-shadow(0 0 160px rgba(60,100,255,0.38)); transform: scale(1.02); }
        }
        .orb-wrap {
          animation: orbBreathe 2.8s ease-in-out infinite;
        }
      `}</style>

      <CustomCursor />
      <SignalField />

      {/* Orb */}
      <div className="orb-wrap" style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <OrbCanvas size={orbSize} />
      </div>

      {/* UI */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 28, ...fi(.08) }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.95)" }}>EVERY</span>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.42)" }}>WHERE</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", color: "rgba(255,255,255,.38)", marginLeft: 6, alignSelf: "center", textTransform: "uppercase" }}>Studio</span>
          </div>
        </div>

        {/* Headline + CTA */}
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
              <span className="arr">-&gt;</span>
            </button>
          </div>
        </div>

        {/* Bottom label */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 26, ...fi(.95) }}>
          <span style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.30)", fontWeight: 400 }}>
            EVERYWHERE STUDIO &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
