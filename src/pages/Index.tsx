import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — Intro Hero  v5  "Restored & Polished"
//
// Restores: big bold equal-size headline, gold shimmer on "Everywhere."
// Fixes: orb back to correct size (~580px), layout properly stacked
// Keeps: 3D spring-physics rotation, energy sparks, luminous shader
// ─────────────────────────────────────────────────────────────────────────────

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
  float cosT = clamp(lp.y/max(r,0.0001),-1.,1.);
  float theta = acos(cosT);
  float phi   = atan(lp.z,lp.x);

  float scroll   = t * 0.22;
  float ribAngle = theta * 7.0 - scroll;

  float bandIdx  = floor(theta * 7.0 / PI);
  float waveFreq = 3.0 + hash(bandIdx) * 2.0;
  float waveAmp  = 0.018 + hash(bandIdx + 17.3) * 0.012;
  float organic  = sin(phi * waveFreq + t * (0.15 + hash(bandIdx)*0.1)) * waveAmp;

  float breath = sin(t * 0.28) * 0.008;
  float morph  = sin(theta * 3.0 - t * 0.12) * 0.022;

  float rib1 = sin(ribAngle + organic * 8.0);
  float rib2 = sin(ribAngle * 0.5 - t * 0.10) * 0.40;
  float micro = sin(ribAngle * 2.2 + phi * 1.5 + t * 0.31) * 0.12;

  float sinT = sin(theta);
  float pole = sinT * sinT * (3.0 - 2.0 * sinT);
  float disp = (rib1 * 0.55 + rib2 + micro) * 0.046 * pole;
  disp += organic * pole * 0.5;
  disp += morph * pole;
  disp += breath;

  return r - (0.720 + disp);
}

vec3 calcNormal(vec3 p, float rx, float ry, float t) {
  const float e = 0.0008;
  const vec2 k = vec2(1.,-1.);
  return normalize(
    k.xyy * orbSDF(p+k.xyy*e, rx,ry,t) +
    k.yyx * orbSDF(p+k.yyx*e, rx,ry,t) +
    k.yxy * orbSDF(p+k.yxy*e, rx,ry,t) +
    k.xxx * orbSDF(p+k.xxx*e, rx,ry,t)
  );
}

vec3 iridescent(float phase) {
  return vec3(
    0.5 + 0.5*cos(TAU*(phase+0.00)),
    0.5 + 0.5*cos(TAU*(phase+0.33)),
    0.5 + 0.5*cos(TAU*(phase+0.67))
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  float ar = u_res.x / u_res.y;
  uv.x *= ar;

  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  vec3 ro = vec3(0., 0., 2.15);
  vec3 rd = normalize(vec3(uv, -1.60));

  float dist = 0.; bool hit = false; vec3 p;
  for (int i = 0; i < 100; i++) {
    p = ro + rd * dist;
    float d = orbSDF(p, rx, ry, t);
    if (abs(d) < 0.00035) { hit = true; break; }
    if (dist > 5.) break;
    dist += d * 0.80;
  }
  if (!hit) { gl_FragColor = vec4(0.); return; }

  vec3 N = calcNormal(p, rx, ry, t);
  vec3 V = -rd;

  vec3  lp    = rotX(rotY(p,-ry),-rx);
  float r     = length(lp);
  float cosT  = clamp(lp.y/max(r,0.0001),-1.,1.);
  float theta = acos(cosT);
  float phi   = atan(lp.z, lp.x);

  float scroll   = t * 0.22;
  float ribPhase = fract(theta * 7.0 / PI - scroll / TAU);
  float ridge    = 1.0 - abs(ribPhase * 2.0 - 1.0);
  float ridgeS   = ridge * ridge * (3.0 - 2.0*ridge);

  vec3  localN  = rotX(rotY(N,-ry),-rx);
  float underSh = max(0., -localN.y) * (1.0 - ridgeS);

  // ── Three-point lighting ──
  vec3 L1 = normalize(vec3(-0.42, 0.72, 0.86)); float ndl1 = max(dot(N,L1),0.);
  vec3 L2 = normalize(vec3( 0.65,-0.34, 0.62)); float ndl2 = max(dot(N,L2),0.) * 0.30;
  vec3 L3 = normalize(vec3( 0.10, 0.20,-1.00)); float ndl3 = max(dot(N,L3),0.) * 0.14;
  vec3 L4 = normalize(vec3( 0.00, 1.00, 0.30)); float ndl4 = max(dot(N,L4),0.) * 0.20;

  vec3 H1    = normalize(L1+V);
  float spec1 = pow(max(dot(N,H1),0.), 55.) * 1.15;
  float spec2 = pow(max(dot(N,H1),0.), 350.) * 0.85;
  vec3 H2    = normalize(L2+V);
  float spec3 = pow(max(dot(N,H2),0.), 110.) * 0.25;

  float NoV    = max(dot(N,V), 0.);
  float fresnel = pow(1.0 - NoV, 3.2);

  // ── Luminous pearl colors ──
  vec3 ridgeCol  = vec3(0.94, 0.96, 1.00);
  vec3 valleyCol = vec3(0.62, 0.70, 0.94);
  vec3 shadowCol = vec3(0.46, 0.55, 0.88);

  ridgeCol = mix(ridgeCol, vec3(1.,1.,1.), ndl1 * 0.40);
  vec3 base = mix(valleyCol, ridgeCol, ridgeS);
  base = mix(base, shadowCol, underSh * 0.50);
  base = mix(base, vec3(0.30,0.40,0.88), (1.-NoV)*0.03 + fresnel*0.02);

  // ── Caustics ──
  float iriPhase = ribPhase*2.8 + phi*0.15 + t*0.07;
  vec3  iriCol   = iridescent(iriPhase);
  float edgeMask = smoothstep(.30,.50,ribPhase) * smoothstep(.70,.50,ribPhase);
  float specFace = pow(max(dot(N,normalize(vec3(-.3,.5,.9))),0.), 8.);
  float streakM  = smoothstep(.6,.9, sin((phi+t*0.12)*2.5 + theta*3.));
  float cauStr   = (edgeMask*.65 + specFace*.25 + streakM*.10) * 0.22;

  // ── Energy sparks (alive/generating feel) ──
  float energy = 0.;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float sT = fract(fi*.25 + t*(.08+fi*.02)) * PI;
    float sP = fi*1.57 + t*(.15+fi*.07);
    float dT = abs(theta - sT);
    float dP = abs(phi - sP); dP = min(dP, TAU-dP);
    energy += exp(-sqrt(dT*dT + dP*dP*.3) * 12.) * (.12 + sin(t*(1.2+fi*.3))*.06);
  }

  float breath = 0.97 + sin(t*0.31)*0.03 + sin(t*0.71)*0.012;

  vec3 col = base;
  col *= (ndl1*0.52 + ndl2 + ndl4 + ndl3 + 0.54) * breath;
  col += iriCol * cauStr * 1.5;
  col += vec3(.90,.95,1.) * energy * 1.4;
  col += vec3(1.,.99,.97) * spec1;
  col += vec3(.94,.97,1.) * spec2;
  col += vec3(.88,.92,1.) * spec3;
  col += mix(vec3(.72,.82,1.),vec3(.97,.98,1.),fresnel) * fresnel * 0.80;

  float edgeDist = length(uv / vec2(ar,1.));
  float rimZone  = smoothstep(.60,.82,edgeDist);
  col.r += rimZone * fresnel * 0.07;
  col.b += rimZone * fresnel * 0.16;

  col = pow(col, vec3(0.85));
  col = col / (col + 0.26) * 1.22;
  col = clamp(col, 0., 1.);

  float edgeFade = 1. - smoothstep(0.72, 0.88, edgeDist);
  float alpha    = (0.92 + fresnel*0.08) * edgeFade;

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Spring physics ──────────────────────────────────────────────────────────
class SpringVec2 {
  x=0; y=0; vx=0; vy=0; tx=0; ty=0;
  stiffness=0.075; damping=0.80;
  setTarget(tx:number,ty:number){this.tx=tx;this.ty=ty;}
  step(){
    this.vx+=(this.tx-this.x)*this.stiffness; this.vy+=(this.ty-this.y)*this.stiffness;
    this.vx*=this.damping; this.vy*=this.damping;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ── WebGL Orb ───────────────────────────────────────────────────────────────
function RibbedOrb({ size }: { size: number }) {
  const ref    = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new SpringVec2());
  const raf    = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", { alpha:true, premultipliedAlpha:false, antialias:true })!;
    if (!gl) return;

    const mkS = (type:number, src:string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s,src); gl.compileShader(s);
      const log = gl.getShaderInfoLog(s);
      if (log?.trim()) console.error("Shader:",log);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

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

    const onMove = (e:MouseEvent) => {
      const nx=(e.clientX/window.innerWidth-.5)*2;
      const ny=(e.clientY/window.innerHeight-.5)*2;
      spring.current.setTarget(ny*0.50, nx*0.50);
    };
    window.addEventListener("mousemove",onMove);

    const draw = (ts:number) => {
      spring.current.step();
      const {x:rx,y:ry} = spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,  ts*0.001);
      gl.uniform2f(uR,  canvas.width, canvas.height);
      gl.uniform2f(uRot, rx, ry);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(raf.current); window.removeEventListener("mousemove",onMove); };
  }, [size]);

  return (
    <canvas ref={ref} style={{
      width:size, height:size, display:"block",
      filter:[
        "drop-shadow(0 0 70px rgba(155,195,255,0.72))",
        "drop-shadow(0 0 160px rgba(100,150,255,0.38))",
        "drop-shadow(0 22px 55px rgba(30,48,185,0.50))",
      ].join(" "),
    }}/>
  );
}

// ── Background canvas ────────────────────────────────────────────────────────
function SceneCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null);
  const raf    = useRef(0);
  const angles = useRef([0,1.3,2.7,4.0,5.4,0.7,3.5]);

  useEffect(()=>{
    const canvas = ref.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = Math.min(window.devicePixelRatio,2);

    const resize = () => {
      canvas.width  = window.innerWidth*dpr;
      canvas.height = window.innerHeight*dpr;
      canvas.style.width  = window.innerWidth+"px";
      canvas.style.height = window.innerHeight+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener("resize",resize);

    // Floating dust particles
    const particles = Array.from({length:60},()=>({
      x:Math.random(), y:Math.random(),
      r:0.5+Math.random()*1.4,
      vy:-0.00004-Math.random()*0.00007,
      a:0.05+Math.random()*0.22,
      ph:Math.random()*Math.PI*2,
    }));

    const blobs = [
      {oR:.52,spd:.00040,r:.100,a:.48},
      {oR:.42,spd:-.00028,r:.068,a:.38},
      {oR:.62,spd:.00022,r:.130,a:.30},
      {oR:.48,spd:-.00036,r:.048,a:.26},
      {oR:.70,spd:.00018,r:.090,a:.20},
      {oR:.38,spd:-.00050,r:.036,a:.24},
      {oR:.78,spd:.00013,r:.060,a:.16},
    ];

    const rings = [
      {r:.30,dots:50, dotR:1.4,a:.22},
      {r:.41,dots:66, dotR:1.0,a:.15},
      {r:.53,dots:84, dotR:.78,a:.10},
      {r:.65,dots:106,dotR:.60,a:.06},
    ];

    const draw = (ts:number) => {
      const t  = ts*.001;
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const cx = W*.5, cy = H*.5;
      const base = Math.min(W,H)*.30;

      ctx.clearRect(0,0,W,H);

      // Atmospheric deep bg
      const bg = ctx.createRadialGradient(cx,cy*.88,0,cx,cy,Math.max(W,H)*.88);
      bg.addColorStop(0,  "#3e53cc");
      bg.addColorStop(.25,"#3245c0");
      bg.addColorStop(.55,"#2236ae");
      bg.addColorStop(.82,"#182898");
      bg.addColorStop(1,  "#0e1c80");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Soft orb halo behind the sphere
      const pulse = 0.92+Math.sin(t*.35)*.08;
      const halo = ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.4*pulse);
      halo.addColorStop(0,  "rgba(140,175,255,0.18)");
      halo.addColorStop(.4, "rgba(100,145,240,0.08)");
      halo.addColorStop(1,  "rgba(70,110,220,0)");
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);

      // Edge vignette
      const vig = ctx.createRadialGradient(cx,cy,base*.3,cx,cy,Math.max(W,H)*.72);
      vig.addColorStop(0,"rgba(0,0,40,0)");
      vig.addColorStop(1,"rgba(5,10,55,0.48)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      // Orbit rings
      rings.forEach(ring=>{
        const rPx=base*(ring.r/.30), rY=rPx*.26;
        for(let i=0;i<ring.dots;i++){
          const a=(i/ring.dots)*Math.PI*2+t*.062;
          const depth=(Math.sin(a)+1.5)/2.5;
          ctx.globalAlpha=ring.a*depth;
          ctx.fillStyle="#b8c8ff";
          ctx.beginPath();
          ctx.arc(cx+Math.cos(a)*rPx, cy+Math.sin(a)*rY, ring.dotR,0,Math.PI*2);
          ctx.fill();
        }
      });

      // Satellite blobs
      blobs.forEach((b,i)=>{
        angles.current[i]+=b.spd;
        const a=angles.current[i];
        const rPx=base*(b.oR/.30), rY=rPx*.26;
        const bx=cx+Math.cos(a)*rPx, by=cy+Math.sin(a)*rY;
        const bR=base*b.r;
        const depth=(Math.sin(a)+1.0)*.5;
        const gr=ctx.createRadialGradient(bx-bR*.2,by-bR*.2,0,bx,by,bR*1.35);
        gr.addColorStop(0,  "rgba(140,165,255,.90)");
        gr.addColorStop(.45,"rgba(120,150,250,.48)");
        gr.addColorStop(1,  "rgba(100,135,240,0)");
        ctx.globalAlpha=b.a*(.42+depth*.58);
        ctx.fillStyle=gr;
        ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Floating particles
      particles.forEach(p=>{
        p.y+=p.vy;
        if(p.y<-0.02){p.y=1.02;p.x=Math.random();}
        const flicker=0.72+0.28*Math.sin(t*1.9+p.ph);
        ctx.globalAlpha=p.a*flicker;
        ctx.fillStyle="#c8d8ff";
        ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.r,0,Math.PI*2); ctx.fill();
      });

      ctx.globalAlpha=1;
      raf.current=requestAnimationFrame(draw);
    };

    raf.current=requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(raf.current); window.removeEventListener("resize",resize); };
  },[]);

  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const [orbSize, setOrbSize] = useState(520);

  useEffect(()=>{
    const calc = () => setOrbSize(Math.min(
      window.innerWidth  * 0.56,
      window.innerHeight * 0.78,
      600,
    ));
    calc();
    window.addEventListener("resize",calc);
    return ()=>window.removeEventListener("resize",calc);
  },[]);

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",
      position:"relative",fontFamily:"'Afacad Flux',sans-serif",background:"#0e1c80"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(255,220,80,.22);color:#fff;}

        @keyframes fade-up {
          from{opacity:0;transform:translateY(16px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes fade-in {
          from{opacity:0;} to{opacity:1;}
        }

        /* Gold shimmer sweep — warm yellow-to-white-to-gold */
        @keyframes gold-sweep {
          0%   { background-position: -150% center; }
          100% { background-position:  250% center; }
        }

        .headline-1 {
          display:block;
          font-size: clamp(52px, 8.2vw, 112px);
          font-weight: 700;
          line-height: 0.94;
          letter-spacing: -0.035em;
          color: #fff;
          text-shadow: 0 2px 50px rgba(20,40,180,.45);
          animation: fade-up 0.9s 0.25s both cubic-bezier(.16,1,.3,1);
        }
        .headline-2 {
          display:block;
          font-size: clamp(52px, 8.2vw, 112px);
          font-weight: 700;
          line-height: 0.94;
          letter-spacing: -0.035em;
          /* Gold shimmer — warm metallic sweep */
          background: linear-gradient(105deg,
            #fff6cc  0%,
            #ffd966  12%,
            #ffe680  20%,
            #ffffff  35%,
            #fff3b0  50%,
            #ffc933  62%,
            #ffe066  75%,
            #fff6cc  100%
          );
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation:
            fade-up 0.9s 0.38s both cubic-bezier(.16,1,.3,1),
            gold-sweep 4s 1.4s ease-in-out infinite;
          text-shadow: none;
        }

        .logo-wrap {
          animation: fade-up 0.8s 0.1s both cubic-bezier(.16,1,.3,1);
        }
        .orb-wrap {
          animation: fade-in 1.2s 0.05s both ease-out;
        }
        .cta-wrap {
          animation: fade-up 0.8s 0.55s both cubic-bezier(.16,1,.3,1);
        }
        .sub-wrap {
          animation: fade-up 0.7s 0.75s both cubic-bezier(.16,1,.3,1);
        }
        .bot-wrap {
          animation: fade-up 0.7s 1.0s both cubic-bezier(.16,1,.3,1);
        }

        .cta-btn {
          display:inline-flex; align-items:center; gap:11px;
          background: rgba(255,255,255,0.93);
          border:none; color:#2535b4;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px; font-weight:600; letter-spacing:.01em;
          padding:15px 44px; border-radius:100px; cursor:pointer;
          box-shadow: 0 6px 32px rgba(15,30,150,.32), 0 2px 10px rgba(255,255,255,.18);
          transition: background .22s, transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
        }
        .cta-btn:hover {
          background:#fff;
          transform:translateY(-3px) scale(1.015);
          box-shadow: 0 14px 52px rgba(15,30,150,.42), 0 0 50px rgba(150,190,255,.22);
        }
        .cta-arr {
          font-size:18px;
          transition: transform .4s cubic-bezier(.16,1,.3,1);
          display:inline-block;
        }
        .cta-btn:hover .cta-arr { transform:translateX(5px); }
      `}</style>

      {/* Bg */}
      <SceneCanvas />

      {/* UI — full-screen flex column, center-aligned */}
      <div style={{
        position:"fixed",inset:0,zIndex:10,
        display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        gap:0,
        pointerEvents:"none",
      }}>

        {/* Logo — pinned to top */}
        <div className="logo-wrap" style={{
          position:"absolute",top:28,left:0,right:0,
          display:"flex",justifyContent:"center",
        }}>
          <div style={{display:"inline-flex",alignItems:"baseline"}}>
            <span style={{fontSize:17,fontWeight:800,letterSpacing:"-.005em",color:"rgba(255,255,255,.95)"}}>EVERY</span>
            <span style={{fontSize:17,fontWeight:800,letterSpacing:"-.005em",color:"rgba(255,255,255,.42)"}}>WHERE</span>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:".20em",color:"rgba(255,255,255,.40)",
              marginLeft:7,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
          </div>
        </div>

        {/* Headline — above orb */}
        <div style={{textAlign:"center",marginBottom:"-4%",zIndex:12}}>
          <span className="headline-1">Your thinking.</span>
          <span className="headline-2">Everywhere.</span>
        </div>

        {/* Orb — behind / below text overlap */}
        <div className="orb-wrap" style={{zIndex:2,pointerEvents:"none"}}>
          <RibbedOrb size={orbSize}/>
        </div>

        {/* CTA + sub */}
        <div style={{
          display:"flex",flexDirection:"column",alignItems:"center",gap:16,
          marginTop:"-3%",zIndex:12,pointerEvents:"auto",
        }}>
          <div className="cta-wrap">
            <button className="cta-btn" onClick={()=>navigate("/explore")}>
              Explore Everywhere
              <span className="cta-arr">→</span>
            </button>
          </div>
          <p className="sub-wrap" style={{
            fontSize:10,letterSpacing:".16em",textTransform:"uppercase",
            color:"rgba(255,255,255,.32)",fontWeight:400,
          }}>
            Composed Intelligence for Thought Leaders
          </p>
        </div>

        {/* Bottom bar */}
        <div className="bot-wrap" style={{
          position:"absolute",bottom:20,left:0,right:0,
          display:"flex",justifyContent:"center",
        }}>
          <span style={{
            fontSize:9,letterSpacing:".15em",textTransform:"uppercase",
            color:"rgba(255,255,255,.18)",fontWeight:300,
          }}>
            Everywhere Studio™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>

      </div>
    </div>
  );
}
