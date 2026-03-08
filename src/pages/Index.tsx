import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — Intro Hero  v4  "Polished & Magical"
//
// Design philosophy:
//  · The orb IS the hero — massive, luminous, takes up most of the screen
//  · Typography is refined and editorial, NOT competing with the orb
//  · Text sits in a clear Z-space above the orb, with glass-blur backdrop
//  · Background has real atmospheric depth — deep navy core, glowing halo
//  · A film-grain texture overlay adds premium physical texture
//  · Particles float in the bg, giving a sense of living space
//  · Everything breathes: entrance animations, hover states, pulse
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
//  WebGL Shader — Luminous Ribbed Sphere
// ═══════════════════════════════════════════════════════════════════════════
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;

#define PI  3.14159265359
#define TAU 6.28318530718

vec3 rotX(vec3 p, float a) {
  float c=cos(a),s=sin(a);
  return vec3(p.x, c*p.y-s*p.z, s*p.y+c*p.z);
}
vec3 rotY(vec3 p, float a) {
  float c=cos(a),s=sin(a);
  return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z);
}
float hash(float n) { return fract(sin(n)*43758.5453123); }

float orbSDF(vec3 p, float rx, float ry, float t) {
  vec3 lp = rotX(rotY(p,-ry),-rx);
  float r   = length(lp);
  float eps = 0.0001;
  float cosT = clamp(lp.y/max(r,eps),-1.,1.);
  float theta = acos(cosT);
  float phi   = atan(lp.z,lp.x);

  float scroll = t*0.22;
  float ribAngle = theta*7.0-scroll;

  float bandIdx  = floor(theta*7.0/PI);
  float waveFreq = 3.0+hash(bandIdx)*2.0;
  float waveAmp  = 0.018+hash(bandIdx+17.3)*0.012;
  float organic  = sin(phi*waveFreq+t*(0.15+hash(bandIdx)*0.1))*waveAmp;

  float breath = sin(t*0.28)*0.008;
  float morph  = sin(theta*3.0-t*0.12)*0.022;

  float rib1 = sin(ribAngle+organic*8.0);
  float rib2 = sin(ribAngle*0.5-t*0.10)*0.40;
  float micro = sin(ribAngle*2.2+phi*1.5+t*0.31)*0.12;

  float sinT = sin(theta);
  float pole = sinT*sinT*(3.0-2.0*sinT);
  float disp = (rib1*0.55+rib2+micro)*0.046*pole;
  disp += organic*pole*0.5;
  disp += morph*pole;
  disp += breath;

  return r-(0.720+disp);
}

vec3 calcNormal(vec3 p, float rx, float ry, float t) {
  const float e = 0.0008;
  const vec2 k = vec2(1.,-1.);
  return normalize(
    k.xyy*orbSDF(p+k.xyy*e,rx,ry,t)+
    k.yyx*orbSDF(p+k.yyx*e,rx,ry,t)+
    k.yxy*orbSDF(p+k.yxy*e,rx,ry,t)+
    k.xxx*orbSDF(p+k.xxx*e,rx,ry,t)
  );
}

vec3 iridescent(float phase) {
  return vec3(
    0.5+0.5*cos(TAU*(phase+0.00)),
    0.5+0.5*cos(TAU*(phase+0.33)),
    0.5+0.5*cos(TAU*(phase+0.67))
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy/u_res)*2.0-1.0;
  float ar = u_res.x/u_res.y;
  uv.x *= ar;

  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  vec3 ro = vec3(0.,0.,2.15);
  vec3 rd = normalize(vec3(uv,-1.60));

  float dist=0.; bool hit=false; vec3 p;
  for(int i=0;i<110;i++){
    p=ro+rd*dist;
    float d=orbSDF(p,rx,ry,t);
    if(abs(d)<0.00030){hit=true;break;}
    if(dist>5.)break;
    dist+=d*0.82;
  }
  if(!hit){gl_FragColor=vec4(0.);return;}

  vec3 N = calcNormal(p,rx,ry,t);
  vec3 V = -rd;

  vec3 lp    = rotX(rotY(p,-ry),-rx);
  float r    = length(lp);
  float cosT = clamp(lp.y/max(r,.0001),-1.,1.);
  float theta = acos(cosT);
  float phi   = atan(lp.z,lp.x);

  float scroll   = t*0.22;
  float ribPhase = fract(theta*7.0/PI-scroll/TAU);
  float ridge    = 1.0-abs(ribPhase*2.0-1.0);
  float ridgeS   = ridge*ridge*(3.0-2.0*ridge);

  vec3 localN   = rotX(rotY(N,-ry),-rx);
  float underSh = max(0.,-localN.y)*(1.0-ridgeS);

  // ── Three-point lighting ──
  vec3 L1=normalize(vec3(-0.40,0.72,0.88)); float ndl1=max(dot(N,L1),0.);
  vec3 L2=normalize(vec3(0.68,-0.32,0.62)); float ndl2=max(dot(N,L2),0.)*0.30;
  vec3 L3=normalize(vec3(0.10,0.20,-1.00)); float ndl3=max(dot(N,L3),0.)*0.15;
  vec3 L4=normalize(vec3(0.,1.,0.3));       float ndl4=max(dot(N,L4),0.)*0.22;

  vec3  H1=normalize(L1+V);
  float spec1=pow(max(dot(N,H1),0.),55.)*1.15;
  float spec2=pow(max(dot(N,H1),0.),350.)*0.85;
  vec3  H2=normalize(L2+V);
  float spec3=pow(max(dot(N,H2),0.),110.)*0.28;

  float NoV    = max(dot(N,V),0.);
  float fresnel= pow(1.0-NoV,3.2);

  // ── Luminous pearl colors ──
  vec3 ridgeCol  = vec3(0.95,0.97,1.00);
  vec3 valleyCol = vec3(0.65,0.73,0.96);
  vec3 shadowCol = vec3(0.48,0.57,0.90);

  ridgeCol = mix(ridgeCol, vec3(1.,1.,1.), ndl1*0.38);
  vec3 base = mix(valleyCol,ridgeCol,ridgeS);
  base = mix(base,shadowCol,underSh*0.52);
  vec3 bgLeak = vec3(0.32,0.42,0.90);
  base = mix(base,bgLeak,(1.0-NoV)*0.035+fresnel*0.025);

  // ── Caustics ──
  float iriPhase  = ribPhase*2.8+phi*0.15+t*0.07;
  vec3  iriCol    = iridescent(iriPhase);
  float edgeMask  = smoothstep(.30,.50,ribPhase)*smoothstep(.70,.50,ribPhase);
  float specFace  = pow(max(dot(N,normalize(vec3(-.3,.5,.9))),0.),8.);
  float streakPhi = phi+t*0.12;
  float streakM   = smoothstep(.6,.9,sin(streakPhi*2.5+theta*3.));
  float cauStr    = (edgeMask*.65+specFace*.25+streakM*.10)*0.22;

  // ── Energy sparks ──
  float energy=0.;
  for(int i=0;i<4;i++){
    float fi=float(i);
    float sT=fract(fi*.25+t*(.08+fi*.02))*PI;
    float sP=fi*1.57+t*(.15+fi*.07);
    float dT=abs(theta-sT);
    float dP=abs(phi-sP); dP=min(dP,TAU-dP);
    float sd=sqrt(dT*dT+dP*dP*.3);
    energy+=exp(-sd*12.)*(.12+sin(t*(1.2+fi*.3))*.06);
  }

  float breath = 0.97+sin(t*0.31)*0.03+sin(t*0.71)*0.012;

  // ── Assemble ──
  vec3 col = base;
  col *= (ndl1*0.52+ndl2+ndl4+ndl3+0.55)*breath;
  col += iriCol*cauStr*1.5;
  col += vec3(.90,.95,1.)*energy*1.4;
  col += vec3(1.,.99,.97)*spec1;
  col += vec3(.94,.97,1.)*spec2;
  col += vec3(.88,.92,1.)*spec3;
  vec3 rimCol = mix(vec3(.72,.82,1.),vec3(.97,.98,1.),fresnel);
  col += rimCol*fresnel*0.82;
  float edgeDist = length(uv/vec2(ar,1.));
  float rimZone  = smoothstep(.60,.82,edgeDist);
  col.r += rimZone*fresnel*0.07;
  col.b += rimZone*fresnel*0.16;

  // Gamma + Reinhard
  col = pow(col,vec3(0.85));
  col = col/(col+0.25)*1.20;
  col = clamp(col,0.,1.);

  float edgeFade = 1.0-smoothstep(0.72,0.88,edgeDist);
  float alpha    = (0.92+fresnel*0.08)*edgeFade;

  gl_FragColor = vec4(col,alpha);
}
`;

// ═══════════════════════════════════════════════════════════════════════════
//  Spring physics
// ═══════════════════════════════════════════════════════════════════════════
class SpringVec2 {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  stiffness=0.075; damping=0.80;
  setTarget(tx:number,ty:number){this.tx=tx;this.ty=ty;}
  step(){
    this.vx+=(this.tx-this.x)*this.stiffness;
    this.vy+=(this.ty-this.y)*this.stiffness;
    this.vx*=this.damping; this.vy*=this.damping;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  WebGL Orb
// ═══════════════════════════════════════════════════════════════════════════
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

    const mkShader = (type:number, src:string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      const log = gl.getShaderInfoLog(s);
      if (log?.trim()) console.error("Shader:", log);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog,"a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT   = gl.getUniformLocation(prog,"u_t");
    const uR   = gl.getUniformLocation(prog,"u_res");
    const uRot = gl.getUniformLocation(prog,"u_rotXY");

    const MAX = 0.50;
    const onMove = (e:MouseEvent) => {
      const nx = (e.clientX/window.innerWidth  - 0.5)*2;
      const ny = (e.clientY/window.innerHeight - 0.5)*2;
      spring.current.setTarget(ny*MAX, nx*MAX);
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts:number) => {
      spring.current.step();
      const {x:rx, y:ry} = spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,  ts*0.001);
      gl.uniform2f(uR,  canvas.width, canvas.height);
      gl.uniform2f(uRot, rx, ry);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, [size]);

  return (
    <canvas ref={canvasRef} style={{
      width:size, height:size, display:"block",
      filter:[
        "drop-shadow(0 0 90px rgba(170,210,255,0.80))",
        "drop-shadow(0 0 200px rgba(110,160,255,0.45))",
        "drop-shadow(0 30px 80px rgba(30,50,190,0.55))",
      ].join(" "),
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Background scene — deep atmospheric bg + floating particles + halos
// ═══════════════════════════════════════════════════════════════════════════
function SceneCanvas() {
  const ref  = useRef<HTMLCanvasElement>(null);
  const raf  = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Floating dust particles
    const N = 55;
    const particles = Array.from({length:N}, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.6,
      vx: (Math.random()-0.5) * 0.00006,
      vy: -0.00004 - Math.random() * 0.00008,
      a: 0.06 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    // Satellite blobs — fewer, more intentional
    const blobs = [
      { oR:.54, spd:.00038, ph:0.0,  r:.082, a:.42 },
      { oR:.44, spd:-.00024,ph:2.1,  r:.056, a:.32 },
      { oR:.66, spd:.00019, ph:1.2,  r:.105, a:.26 },
      { oR:.46, spd:-.00032,ph:3.9,  r:.038, a:.22 },
      { oR:.74, spd:.00015, ph:2.6,  r:.072, a:.18 },
    ];
    const angles = blobs.map(b => b.ph);

    const draw = (ts:number) => {
      const t  = ts * 0.001;
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const base = Math.min(W, H) * 0.44;

      ctx.clearRect(0,0,W,H);

      // ── Deep atmospheric background ──
      // Outer deep navy
      const bg = ctx.createRadialGradient(cx, cy*0.85, 0, cx, cy, Math.max(W,H)*0.90);
      bg.addColorStop(0,   "#3a4fc8");   // bright indigo core
      bg.addColorStop(0.22,"#2e42bb");
      bg.addColorStop(0.50,"#1f31a4");
      bg.addColorStop(0.78,"#152490");
      bg.addColorStop(1,   "#0b1570");   // deep navy edge
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,W,H);

      // ── Orb halo — the light emanating from behind the orb ──
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, base*1.15);
      halo.addColorStop(0,   "rgba(120,160,255,0.22)");
      halo.addColorStop(0.35,"rgba(90,130,240,0.12)");
      halo.addColorStop(0.70,"rgba(60,100,220,0.05)");
      halo.addColorStop(1,   "rgba(30,60,180,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0,0,W,H);

      // ── Second halo pulse — breathes with time ──
      const pulse = 0.9 + Math.sin(t*0.35)*0.1;
      const halo2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, base*0.75*pulse);
      halo2.addColorStop(0,   "rgba(180,210,255,0.14)");
      halo2.addColorStop(0.50,"rgba(130,175,255,0.06)");
      halo2.addColorStop(1,   "rgba(80,130,240,0)");
      ctx.fillStyle = halo2;
      ctx.fillRect(0,0,W,H);

      // ── Subtle edge vignette ──
      const vig = ctx.createRadialGradient(cx, cy, base*0.6, cx, cy, Math.max(W,H)*0.72);
      vig.addColorStop(0, "rgba(0,0,40,0)");
      vig.addColorStop(1, "rgba(0,0,25,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0,0,W,H);

      // ── Floating particles ──
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02 || p.x > 1.02) p.x = Math.random();
        const flicker = 0.7 + 0.3 * Math.sin(t*1.8 + p.phase);
        ctx.globalAlpha = p.a * flicker;
        ctx.fillStyle = "#c8d8ff";
        ctx.beginPath();
        ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
        ctx.fill();
      });

      // ── Satellite blobs ──
      blobs.forEach((b, i) => {
        angles[i] += b.spd;
        const a   = angles[i];
        const rPx = base * (b.oR / 0.44);
        const rY  = rPx * 0.24;   // flattened ellipse
        const bx  = cx + Math.cos(a) * rPx;
        const by  = cy + Math.sin(a) * rY;
        const bR  = base * b.r;
        const depth = (Math.sin(a) + 1.0) * 0.5;
        const gr  = ctx.createRadialGradient(bx, by, 0, bx, by, bR*1.4);
        gr.addColorStop(0,   `rgba(140,170,255,0.85)`);
        gr.addColorStop(0.5, `rgba(120,155,250,0.40)`);
        gr.addColorStop(1,   `rgba(100,140,240,0)`);
        ctx.globalAlpha = b.a * (0.4 + depth*0.6);
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

// ═══════════════════════════════════════════════════════════════════════════
//  Film-grain noise overlay (SVG-based, no extra assets)
// ═══════════════════════════════════════════════════════════════════════════
function GrainOverlay() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:20, pointerEvents:"none",
      opacity:0.028,
      backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat:"repeat",
      backgroundSize:"180px 180px",
      mixBlendMode:"overlay",
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function Index() {
  const navigate = useNavigate();
  const [orbSize, setOrbSize] = useState(600);

  useEffect(() => {
    const calc = () => {
      // Orb should be large — ~85% of the shorter viewport dimension, max 820
      const s = Math.min(
        window.innerWidth  * 0.86,
        window.innerHeight * 0.94,
        820,
      );
      setOrbSize(s);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden",
      position:"relative", fontFamily:"'Afacad Flux',sans-serif",
      background:"#0b1570" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(200,220,255,.20); color:#fff; }

        /* ── Entrance animations ── */
        @keyframes fade-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes shimmer-x {
          0%   { background-position: 0% center; }
          50%  { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        @keyframes orb-pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.012); }
        }

        /* ── Orb layer ── */
        .orb-wrap {
          animation: fade-in 1.4s 0.1s both ease-out, orb-pulse 5s 2s ease-in-out infinite;
        }

        /* ── Logo ── */
        .logo-wrap {
          animation: fade-up 0.9s 0.15s both cubic-bezier(.16,1,.3,1);
        }

        /* ── Headline ── */
        .hero-headline {
          animation: fade-up 1.0s 0.3s both cubic-bezier(.16,1,.3,1);
          text-align:center;
        }
        .line1 {
          display:block;
          font-size: clamp(38px, 5.4vw, 78px);
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: rgba(255,255,255,0.82);
        }
        .line2 {
          display:block;
          font-size: clamp(46px, 6.8vw, 98px);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.0;
          background: linear-gradient(135deg,
            #ffffff  0%,
            #dce8ff  28%,
            #b8d0ff  52%,
            #e2ecff  75%,
            #ffffff  100%
          );
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fade-up 1.0s 0.3s both cubic-bezier(.16,1,.3,1),
                     shimmer-x 8s 1.4s ease-in-out infinite;
        }

        /* ── CTA ── */
        .cta-wrap {
          animation: fade-up 0.9s 0.55s both cubic-bezier(.16,1,.3,1);
        }
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          color: #fff;
          font-family: 'Afacad Flux', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.01em;
          padding: 13px 36px;
          border-radius: 100px;
          cursor: pointer;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow:
            0 2px 20px rgba(0,0,50,0.20),
            inset 0 1px 0 rgba(255,255,255,0.15);
          transition:
            background 0.25s,
            border-color 0.25s,
            transform 0.4s cubic-bezier(.16,1,.3,1),
            box-shadow 0.4s;
        }
        .cta-btn:hover {
          background: rgba(255,255,255,0.20);
          border-color: rgba(255,255,255,0.40);
          transform: translateY(-3px);
          box-shadow:
            0 8px 40px rgba(0,0,80,0.28),
            0 0 60px rgba(140,180,255,0.18),
            inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .cta-arr {
          font-size: 16px;
          opacity: 0.70;
          transition: transform 0.4s cubic-bezier(.16,1,.3,1), opacity 0.25s;
        }
        .cta-btn:hover .cta-arr {
          transform: translateX(4px);
          opacity: 1;
        }

        /* ── Sub-label ── */
        .sub-label {
          animation: fade-up 0.8s 0.80s both cubic-bezier(.16,1,.3,1);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }

        /* ── Bottom bar ── */
        .bottom-bar {
          animation: fade-up 0.8s 1.1s both cubic-bezier(.16,1,.3,1);
        }
      `}</style>

      {/* ── Layer 0: Atmospheric background + particles ── */}
      <SceneCanvas />

      {/* ── Layer 1: Orb — fills most of the screen ── */}
      <div className="orb-wrap" style={{
        position:"fixed", inset:0, zIndex:2, pointerEvents:"none",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <RibbedOrb size={orbSize} />
      </div>

      {/* ── Layer 2: UI — carefully layered above orb ── */}
      <div style={{
        position:"fixed", inset:0, zIndex:10,
        display:"flex", flexDirection:"column",
        alignItems:"center",
        pointerEvents:"none",
      }}>

        {/* Logo */}
        <div className="logo-wrap" style={{ paddingTop:28 }}>
          <div style={{
            display:"inline-flex", alignItems:"baseline", gap:0,
          }}>
            <span style={{
              fontSize:16, fontWeight:800, letterSpacing:"0.04em",
              color:"rgba(255,255,255,0.90)", textTransform:"uppercase",
            }}>Every</span>
            <span style={{
              fontSize:16, fontWeight:300, letterSpacing:"0.04em",
              color:"rgba(255,255,255,0.42)", textTransform:"uppercase",
            }}>where</span>
            <span style={{
              fontSize:8, fontWeight:600, letterSpacing:"0.22em",
              color:"rgba(255,255,255,0.35)", marginLeft:8,
              alignSelf:"center", textTransform:"uppercase",
            }}>Studio™</span>
          </div>
        </div>

        {/* ── Main content area: headline above orb center ── */}
        {/* Position at ~22% from top so headline floats above orb equator */}
        <div style={{
          position:"absolute",
          top:"18%",
          left:0, right:0,
          display:"flex", flexDirection:"column", alignItems:"center",
          gap:0,
        }}>
          <div className="hero-headline">
            <span className="line1">Your thinking.</span>
            <span className="line2">Everywhere.</span>
          </div>
        </div>

        {/* ── CTA + sub-label: float below orb equator ── */}
        <div style={{
          position:"absolute",
          bottom:"16%",
          left:0, right:0,
          display:"flex", flexDirection:"column", alignItems:"center",
          gap:14,
        }}>
          <div className="cta-wrap" style={{ pointerEvents:"auto" }}>
            <button className="cta-btn" onClick={() => navigate("/explore")}>
              Explore Everywhere
              <span className="cta-arr">→</span>
            </button>
          </div>
          <p className="sub-label">
            Composed Intelligence for Thought Leaders
          </p>
        </div>

        {/* Bottom wordmark */}
        <div className="bottom-bar" style={{
          position:"absolute", bottom:20, left:0, right:0,
          display:"flex", justifyContent:"center",
        }}>
          <span style={{
            fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase",
            color:"rgba(255,255,255,0.18)", fontWeight:300,
          }}>
            Everywhere Studio™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>

      </div>

      {/* ── Layer 3: Film grain ── */}
      <GrainOverlay />

    </div>
  );
}
