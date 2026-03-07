import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── WebGL Orb Shader ─────────────────────────────────────────────────────────
// Bright luminous orb — animated wave bands + fluid warp + gold caustics
// Background: deep electric indigo (not black)

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_mouse;

// ── Simplex noise 3D ──────────────────────────────────────────────────────────
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return mod289((x*34.+1.)*x);}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g,l.zxy),i2=max(g,l.zxy);
  vec3 x1=x0-i1+C.x,x2=x0-i2+C.y,x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  vec4 j=p-49.*floor(p/49.);
  vec4 x_=floor(j/7.),y_=j-7.*x_;
  vec4 ox=(x_*2.+.5)/7.-1.,oy=(y_*2.+.5)/7.-1.;
  vec4 h=1.-abs(ox)-abs(oy);
  vec4 b0=vec4(ox.xy,oy.xy),b1=vec4(ox.zw,oy.zw);
  vec4 s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 g0=vec3(a0.xy,h.x),g1=vec3(a0.zw,h.y),g2=vec3(a1.xy,h.z),g3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291-.85373472*vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3));
  g0*=norm.x;g1*=norm.y;g2*=norm.z;g3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  return 42.*dot(m*m*m*m,vec4(dot(g0,x0),dot(g1,x1),dot(g2,x2),dot(g3,x3)));
}

float fbm(vec3 p){
  return snoise(p)*.55+snoise(p*2.+100.)*.30+snoise(p*4.+200.)*.15;
}
float fluid(vec3 p,float t){
  vec3 q=vec3(fbm(p+vec3(0.,0.,t*.11)),fbm(p+vec3(5.2,1.3,t*.09)),0.);
  return fbm(p+2.8*q);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  // Mouse parallax — subtle shift
  vec2 mOff=(u_mouse-.5)*.07;
  vec2 c=(uv-.5)*2.-mOff;
  float d=length(c);

  // Sphere mask
  float mask=1.-smoothstep(.80,.87,d);
  if(mask<.001){gl_FragColor=vec4(0.);return;}

  float t=u_t;
  float z=sqrt(max(0.,1.-d*d*1.3));
  vec3 N=normalize(vec3(c,z));
  vec3 sph=vec3(c,z);
  vec3 wp=sph*1.55*(1.+sin(t*.28)*.007);

  // Fluid warp layers
  float f1=fluid(wp,t);
  float f2=snoise(sph*2.6+vec3(t*.12,t*.08,t*.10));
  float flow=f1*.68+f2*.32;

  // ── EVERYWHERE palette: pearl-white core, electric blue bands, gold fire ──
  // Base: luminous white-blue (like the Telefónica orb but with more character)
  vec3 pearl   = vec3(0.95,0.97,1.00);
  vec3 iceBlue = vec3(0.55,0.72,0.98);
  vec3 deepBlue= vec3(0.20,0.38,0.85);
  vec3 gold    = vec3(0.98,0.82,0.30);
  vec3 teal    = vec3(0.22,0.78,0.85);

  // Mix by fluid value
  float fm=smoothstep(-.2,.7,flow);
  vec3 base=mix(
    mix(pearl,iceBlue,fm*.7),
    mix(deepBlue,gold,smoothstep(.3,.9,f2)),
    fm*.45
  );
  // Depth tint — deeper blue toward edge
  base=mix(base,deepBlue,(1.-z)*.35);
  // Polar brightening
  base=mix(base,pearl,pow(z,.8)*.4);

  // Luminance from fluid
  float lum=.50+smoothstep(.1,.6,flow)*.42-smoothstep(.0,-.5,f1)*.3;
  vec3 col=base*lum;

  // Shadow pockets (depth)
  col=mix(col,vec3(.06,.10,.28),smoothstep(.4,-.2,f1)*.35);

  // Core scatter — pearl white center glow
  col+=pearl*exp(-d*d*3.0)*.12;
  // Gold caustic veins
  col+=gold*exp(-d*d*5.0)*max(flow*.8,0.)*.10;
  // Teal scatter
  col+=teal*exp(-d*d*4.0)*.04;

  // ── Wave band overlay (the signature Telefónica look) ────────────────────
  // Horizontal undulating bands clipped to sphere
  for(int b=0;b<7;b++){
    float bf=float(b);
    float bandY=-.75+bf*.26+sin(t*.14+bf*.7)*.025;
    float bandW=.04;
    // Wave deformation
    float wave=sin(c.x*3.5+t*.5+bf*1.1)*.035
              +sin(c.x*6.0-t*.3+bf*.8)*.015;
    float inside=1.-smoothstep(0.,bandW*.5,abs(c.y-bandY-wave));
    // Make bands pearl-white to ice-blue
    vec3 bandCol=mix(pearl,iceBlue,bf/6.);
    float bandAlpha=inside*.08*(1.-d*.6);
    col=mix(col,col+bandCol,bandAlpha);
  }

  // ── Light streaks / caustics ──────────────────────────────────────────────
  for(int s=0;s<5;s++){
    float sf=float(s);
    float ang=sf*1.26+t*.10;
    float rx=cos(ang)*.35,ry=sin(ang*.7)*.20;
    vec2 sp=vec2(rx,ry-.1);
    float dd=length(c-sp);
    float streak=exp(-dd*dd*55.)*(.07+sin(t*.6+sf)*.04);
    col+=pearl*streak;
  }

  // ── Glass rim — bright electric edge ─────────────────────────────────────
  float rimZone=smoothstep(.70,.83,d)*smoothstep(.88,.80,d);
  vec3 rimCol=mix(iceBlue,pearl,.4);
  col+=rimCol*rimZone*.65;
  // Fresnel
  float fresnel=pow(1.-z,3.5);
  col+=rimCol*fresnel*.35;
  // Gold rim highlight (one arc)
  float goldArc=sin(atan(c.y,c.x)*2.+t*.3)*.5+.5;
  col+=gold*rimZone*goldArc*.25;

  // ── Specular highlights ───────────────────────────────────────────────────
  vec3 L1=normalize(vec3(-.5,.65,.62));
  col+=vec3(1.,1.,1.)*pow(max(dot(N,L1),0.),42.)*.70;
  vec3 L2=normalize(vec3(.55,.35,.80));
  col+=vec3(.85,.92,1.)*pow(max(dot(N,L2),0.),90.)*.30;

  // Global pulse + edge roll-off
  col*=.92+sin(t*.22)*.08;
  col*=mix(1.,.65,pow(d,2.5));

  // Tonemap (keep bright — not too aggressive)
  col=col/(col+.60)*1.25;
  col=clamp(col,0.,1.);

  gl_FragColor=vec4(col*mask,mask);
}
`;

function OrbCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const target = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true })!;
    if (!gl) return;

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT = gl.getUniformLocation(prog, "u_t");
    const uR = gl.getUniformLocation(prog, "u_res");
    const uM = gl.getUniformLocation(prog, "u_mouse");

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX / window.innerWidth, y: 1 - e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const m = mouse.current, tm = target.current;
      m.x += (tm.x - m.x) * .05;
      m.y += (tm.y - m.y) * .05;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * .001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uM, m.x, m.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);

  return (
    <canvas ref={ref} style={{
      width: size, height: size, display: "block",
      filter: "drop-shadow(0 0 60px rgba(180,210,255,0.5)) drop-shadow(0 0 120px rgba(100,160,255,0.25))",
    }} />
  );
}

// ─── 2D scene: bg, satellites, orbit dots ────────────────────────────────────
function SceneCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const angles = useRef([0, 1.3, 2.7, 4.0, 5.4, 0.7, 3.5]);

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

    // Satellite blob configs — same color family as bg (indigo/violet/blue)
    const blobs = [
      { orbitR:.52, speed:.00040, phase:0,   r:.100, col:"rgba(130,155,255", base:.50 },
      { orbitR:.42, speed:-.00028,phase:2.0, r:.065, col:"rgba(110,140,250", base:.40 },
      { orbitR:.60, speed:.00022, phase:1.1, r:.130, col:"rgba(145,165,255", base:.35 },
      { orbitR:.48, speed:-.00035,phase:3.8, r:.048, col:"rgba(120,150,255", base:.30 },
      { orbitR:.68, speed:.00018, phase:2.5, r:.085, col:"rgba(100,130,240", base:.22 },
      { orbitR:.38, speed:-.00050,phase:5.1, r:.036, col:"rgba(160,175,255", base:.28 },
      { orbitR:.76, speed:.00014, phase:4.2, r:.058, col:"rgba(110,145,248", base:.18 },
    ];

    // Dotted orbit rings
    const rings = [
      { r:.30, dots:50,  dotR:1.4, alpha:.28 },
      { r:.40, dots:68,  dotR:1.1, alpha:.20 },
      { r:.50, dots:86,  dotR:.85, alpha:.14 },
      { r:.62, dots:108, dotR:.65, alpha:.09 },
    ];

    const draw = (ts: number) => {
      const t = ts * .001;
      const W = window.innerWidth, H = window.innerHeight;
      const cx = W * .5, cy = H * .5;
      const base = Math.min(W, H) * .30;

      ctx.clearRect(0, 0, W, H);

      // ── Vivid electric-indigo background ──────────────────────────────────
      const bg = ctx.createRadialGradient(cx, cy*.9, 0, cx, cy, Math.max(W,H)*.8);
      bg.addColorStop(0,   "#4a5fd4");  // bright cornflower center
      bg.addColorStop(.35, "#3a4ec8");  // rich indigo
      bg.addColorStop(.70, "#2d3db8");  // deeper
      bg.addColorStop(1,   "#1e2a9a");  // dark indigo edge
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle radial vignette overlay (slightly darker edges, like Telefónica)
      const vig = ctx.createRadialGradient(cx, cy, base*.3, cx, cy, Math.max(W,H)*.7);
      vig.addColorStop(0, "rgba(80,100,220,.0)");
      vig.addColorStop(1, "rgba(15,20,90,.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // ── Orbit dot rings ────────────────────────────────────────────────────
      rings.forEach(ring => {
        const rPx = base * (ring.r / .30);
        const rY  = rPx * .28; // elliptical perspective
        for (let i = 0; i < ring.dots; i++) {
          const angle = (i / ring.dots) * Math.PI * 2 + t * .07;
          const x = cx + Math.cos(angle) * rPx;
          const y = cy + Math.sin(angle) * rY;
          const depth = (Math.sin(angle) + 1.5) / 2.5;
          ctx.globalAlpha = ring.alpha * depth;
          ctx.fillStyle = "#c0ccff";
          ctx.beginPath();
          ctx.arc(x, y, ring.dotR, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // ── Satellite blobs ────────────────────────────────────────────────────
      blobs.forEach((b, i) => {
        angles.current[i] += b.speed;
        const angle = angles.current[i];
        const rPx = base * (b.orbitR / .30);
        const rY  = rPx * .28;
        const bx  = cx + Math.cos(angle) * rPx;
        const by  = cy + Math.sin(angle) * rY;
        const bR  = base * b.r;
        const depth = (Math.sin(angle) + 1.0) * .5;
        const a = b.base * (.5 + depth * .5);

        const gr = ctx.createRadialGradient(bx - bR*.2, by - bR*.2, 0, bx, by, bR * 1.3);
        gr.addColorStop(0,   `${b.col},.9)`);
        gr.addColorStop(.45, `${b.col},.55)`);
        gr.addColorStop(1,   `${b.col},0)`);
        ctx.globalAlpha = a;
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(bx, by, bR, 0, Math.PI*2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [orbSize, setOrbSize] = useState(480);

  useEffect(() => {
    const calc = () => setOrbSize(Math.min(window.innerWidth * .62, window.innerHeight * .74, 680));
    calc();
    window.addEventListener("resize", calc);
    const t = setTimeout(() => setReady(true), 120);
    return () => { window.removeEventListener("resize", calc); clearTimeout(t); };
  }, []);

  const fi = (d: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 1s ${d}s cubic-bezier(.16,1,.3,1), transform 1s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", position:"relative", fontFamily:"'Afacad Flux',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(255,220,100,.35);color:#fff;}
        @keyframes shimmer{to{background-position:200% center;}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(.7);}}

        .cta-pill{
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.15);
          border:1.5px solid rgba(255,255,255,.55);
          color:#fff;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:500;letter-spacing:.05em;
          padding:14px 36px;border-radius:100px;cursor:pointer;
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          transition:background .3s,border-color .3s,transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s;
          text-shadow:0 1px 8px rgba(0,0,0,.2);
        }
        .cta-pill:hover{
          background:rgba(255,255,255,.25);
          border-color:rgba(255,255,255,.85);
          transform:translateY(-3px);
          box-shadow:0 12px 50px rgba(60,80,200,.4),0 4px 24px rgba(255,255,255,.15);
        }
        .cta-pill .arr{transition:transform .35s cubic-bezier(.16,1,.3,1);font-size:20px;}
        .cta-pill:hover .arr{transform:translateX(5px);}
      `}</style>

      {/* Scene background + satellites + rings */}
      <SceneCanvas />

      {/* Orb — centered, fixed */}
      <div style={{
        position:"fixed", inset:0, zIndex:2, pointerEvents:"none",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <OrbCanvas size={orbSize} />
      </div>

      {/* Text overlay ON the orb — exactly like Telefónica */}
      <div style={{
        position:"fixed", inset:0, zIndex:10, pointerEvents:"none",
        display:"flex", flexDirection:"column",
      }}>
        {/* Logo — top center */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:28, ...fi(.1) }}>
          {/* Wordmark — since Logo component might not render well on bright bg */}
          <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", color:"rgba(255,255,255,.95)" }}>EVERY</span>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", color:"rgba(255,255,255,.55)" }}>WHERE</span>
            <span style={{ fontSize:11, fontWeight:600, letterSpacing:".12em", color:"rgba(255,255,255,.55)", marginLeft:6, alignSelf:"center", textTransform:"uppercase" }}>Studio</span>
          </div>
        </div>

        {/* Center — headline ON the orb + button below */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          {/* Headline — large, centered, sits over the orb */}
          <h1 style={{
            ...fi(.28),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700,
            lineHeight:.95,
            color:"#fff",
            textAlign:"center",
            letterSpacing:"-.035em",
            textShadow:"0 2px 30px rgba(20,40,140,.4)",
            marginBottom:0,
          }}>
            Your thinking.
          </h1>
          <h1 style={{
            ...fi(.40),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700,
            lineHeight:.95,
            letterSpacing:"-.035em",
            textAlign:"center",
            // Warm gold-white gradient for "Everywhere."
            background:"linear-gradient(110deg,#ffe47a 0%,#fff 40%,#c8e0ff 80%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            animation:"shimmer 5s linear infinite",
            marginBottom:48,
          }}>
            Everywhere.
          </h1>

          {/* CTA button — below headline, pointerEvents re-enabled */}
          <div style={{ ...fi(.58), pointerEvents:"auto" }}>
            <button className="cta-pill" onClick={() => navigate("/explore")}>
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{ display:"flex", justifyContent:"center", paddingBottom:28, ...fi(1.0) }}>
          <span style={{
            fontSize:12, letterSpacing:".12em",
            color:"rgba(255,255,255,.45)", fontWeight:400,
          }}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
