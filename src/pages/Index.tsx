import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// ─────────────────────────────────────────────────────────────────────────────
// LIQUID MERCURY ORB  v2 — "Elevated"
//
// Perf: FBM 3 octaves, full native DPR for crisp rendering
// Visual: vivid iridescence, caustic rings, luminous emission, clean edge fade
// ─────────────────────────────────────────────────────────────────────────────
const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;

#define PI  3.14159265359
#define TAU 6.28318530718

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 rotX(vec3 p,float a){ p.yz=rot2(a)*p.yz; return p; }
vec3 rotY(vec3 p,float a){ p.xz=rot2(a)*p.xz; return p; }

// ── Lean 3-octave FBM ────────────────────────────────────────────────────────
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float sn(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  return sn(p)*.52 + sn(p*2.1+vec2(3.1,1.7))*.30 + sn(p*4.3+vec2(7.2,4.1))*.18;
}

// ── Sphere — minimal warp so it stays round ──────────────────────────────────
float sdf(vec3 p, float n){
  return length(p) - (0.720 + (n-0.5)*0.014);
}

vec3 calcN(vec3 p, float t, float n){
  const float e=0.0014;
  // Cheaper normal — use pre-sampled noise offset
  return normalize(vec3(
    sdf(p+vec3(e,0,0),n)-sdf(p-vec3(e,0,0),n),
    sdf(p+vec3(0,e,0),n)-sdf(p-vec3(0,e,0),n),
    sdf(p+vec3(0,0,e),n)-sdf(p-vec3(0,0,e),n)
  ));
}

// ── Rich procedural environment — the world the sphere mirrors ───────────────
vec3 env(vec3 dir, float t){
  // Sky gradient: ice-white zenith → vivid electric blue equator → violet nadir
  float up = dir.y * 0.5 + 0.5;
  vec3 sky = mix(
    mix(vec3(0.12,0.08,0.45), vec3(0.28,0.18,0.80), up*0.7),   // lower: violet→indigo
    mix(vec3(0.50,0.65,1.00), vec3(0.88,0.94,1.00), up),        // upper: blue→ice
    smoothstep(0.0, 0.6, up)
  );

  // Key light: bright warm-white off upper-left — sharp and strong
  float key  = exp(-max(dot(dir,normalize(vec3(-0.55,0.75,0.35)))-0.,0.)*9.);
  sky += vec3(1.00,0.97,0.88)*key*2.4;

  // Fill: cool blue-cyan from right — soft
  float fill = exp(-max(dot(dir,normalize(vec3(0.75,0.15,0.55)))-0.,0.)*16.);
  sky += vec3(0.55,0.78,1.00)*fill*0.7;

  // Rim: warm gold-orange from lower-right (gives mercury that depth)
  float rim  = exp(-max(dot(dir,normalize(vec3(0.5,-0.6,0.4)))-0.,0.)*20.);
  sky += vec3(0.90,0.62,0.18)*rim*0.5;

  // Flowing light bands in the environment — give reflections shimmer
  float bands = fbm(vec2(atan(dir.z,dir.x)*0.6+t*0.018, acos(clamp(dir.y,-1.,1.))*0.7+t*0.012));
  sky += vec3(0.70,0.85,1.00)*pow(bands,2.2)*0.45;

  return sky;
}

// ── Thin-film iridescence — physically modeled, vivid ───────────────────────
vec3 thinFilm(float cosA, float d){
  // d = film thickness (0.1–1.0)
  float opd = 2.0*d*sqrt(max(0., 1.0-(cosA*cosA)/(1.45*1.45)));
  vec3 ph = TAU*opd/vec3(0.640, 0.530, 0.440);
  // Full amplitude interference — vivid colors
  return 0.5 + 0.5*cos(ph + vec3(0.0, 0.8, 1.8));
}

void main(){
  vec2 uv = (gl_FragCoord.xy/u_res)*2.-1.;
  float ar = u_res.x/u_res.y;
  uv.x *= ar;

  float rx=u_rotXY.x, ry=u_rotXY.y, t=u_t;

  vec3 ro = vec3(0.,0.,2.25);
  vec3 rd = normalize(vec3(uv,-1.68));

  // ── Ray march ───────────────────────────────────────────────────────────────
  float dist=0.; bool hit=false; vec3 p;
  // Pre-compute surface noise at approximate hit point for reuse
  float surfN = 0.5;
  for(int i=0;i<72;i++){
    p=ro+rd*dist;
    float d=sdf(p, surfN);
    if(d<0.0006){hit=true;break;}
    if(dist>5.) break;
    // Only compute noise for last few steps (cheap early march)
    if(d<0.05){
      vec3 lp2=rotX(rotY(p,-ry),-rx);
      float th=acos(clamp(lp2.y/max(length(lp2),0.001),-1.,1.));
      float ph=atan(lp2.z,lp2.x);
      surfN=fbm(vec2(ph*0.7+t*0.022, th*1.1-t*0.016));
    }
    dist+=d*0.92;
  }
  if(!hit){gl_FragColor=vec4(0.);return;}

  // ── Surface data ────────────────────────────────────────────────────────────
  vec3 N = calcN(p, t, surfN);
  vec3 V = -rd;
  float NoV = max(dot(N,V),0.);

  // Local sphere coords
  vec3 lp = rotX(rotY(p,-ry),-rx);
  float r_  = max(length(lp),0.001);
  float theta = acos(clamp(lp.y/r_,-1.,1.));
  float phi   = atan(lp.z,lp.x);

  // Rotate N and V into env space (so reflections move with mouse)
  vec3 Nr = rotX(rotY(N,ry),rx);
  vec3 Vr = rotX(rotY(V,ry),rx);
  vec3 R  = reflect(-V,N);
  vec3 Rr = rotX(rotY(R,ry),rx);

  // ── Environment reflection ──────────────────────────────────────────────────
  vec3 envCol = env(Rr, t);
  vec3 envBot = env(-Rr, t); // transmission tint (subsurface feel)

  // ── Thin-film — vivid, travels across surface ───────────────────────────────
  // Thickness field: slow animated noise on sphere surface
  float thick = 0.15 + surfN*0.72; // range 0.15–0.87
  // Add a secondary slow drift for more movement
  float thick2 = fbm(vec2(phi*0.5-t*0.019, theta*0.8+t*0.014));
  thick = mix(thick, thick2, 0.35);
  vec3 film = thinFilm(NoV, thick);

  // ── Caustic rings — the signature touch ─────────────────────────────────────
  // Concentric rings radiating from the key specular reflection point
  // These pulse and travel outward slowly, like light rings on water
  vec3 L_key = normalize(vec3(-0.55,0.75,0.35));
  vec3 H_key = normalize(L_key+V);
  float specDot = max(dot(Nr, normalize(rotX(rotY(L_key,ry),rx)+Vr)), 0.);
  // Angular distance from specular peak on sphere surface
  float specAngle = acos(clamp(specDot,-1.,1.));
  // Rings: concentric waves outward from spec point
  float rings = 0.;
  for(int i=0;i<4;i++){
    float fi=float(i);
    float phase = specAngle*8. - t*(0.8+fi*0.22) - fi*1.4;
    rings += exp(-specAngle*specAngle*1.8) * max(0.,sin(phase)) * (0.28-fi*0.05);
  }
  // Additional wide soft ring
  float wideRing = exp(-pow(specAngle-0.6,2.)*8.) * (0.5+0.5*sin(specAngle*5.-t*0.6)) * 0.18;
  rings += wideRing;

  // ── Fresnel — high like actual mercury ──────────────────────────────────────
  float F0 = 0.58;
  float fresnel = F0 + (1.-F0)*pow(1.-NoV, 4.2);

  // ── Assembly ─────────────────────────────────────────────────────────────────
  // Start with deep mirror base
  vec3 mirrorDark = mix(vec3(0.03,0.04,0.16), vec3(0.10,0.12,0.30), NoV*0.5);
  vec3 col = mirrorDark;

  // 1. Primary reflection — the world in the mercury
  col = mix(col, envCol, fresnel*0.96);

  // 2. Thin-film iridescence — vivid overlay
  // Strongest at ~45° viewing angle (not straight on, not grazing)
  float filmMask = sin(NoV*PI); // 0 at edges, peaks at 90°
  // Multiply film into reflection — makes colors shift as you tilt
  col *= (0.35 + film*1.30) * mix(1., filmMask*0.8+0.2, 0.70);

  // 3. Caustic rings from specular point
  col += vec3(0.90,0.96,1.00)*rings*1.2;
  // Gold tint on the wide ring
  col += vec3(1.00,0.88,0.55)*wideRing*0.9;

  // 4. Sharp specular — the "sun" in the mercury
  vec3 H1=normalize(L_key+V);
  col += vec3(1.00,0.98,0.93)*pow(max(dot(N,H1),0.),240.)*1.8;
  // Secondary soft spec — cool blue
  vec3 L2=normalize(vec3(0.75,0.15,0.55));
  col += vec3(0.65,0.82,1.00)*pow(max(dot(N,normalize(L2+V)),0.),55.)*0.5;
  // Rim light — gold
  vec3 L3=normalize(vec3(0.5,-0.6,0.4));
  col += vec3(0.90,0.65,0.20)*pow(max(dot(N,normalize(L3+V)),0.),30.)*fresnel*0.4;

  // 5. Subsurface tint — very faint warm glow from inside
  col += mix(vec3(0.20,0.10,0.45), vec3(0.05,0.12,0.35), NoV) * (1.-fresnel) * 0.12;

  // ── Edge treatment ──────────────────────────────────────────────────────────
  float edgeDist = length(uv/vec2(ar,1.));

  // Chromatic rim — electric blue-violet at edge (not white)
  float rim = smoothstep(0.62, 0.84, edgeDist);
  col.r += rim*fresnel*0.04;
  col.b += rim*fresnel*0.22;
  col.g += rim*fresnel*0.08;

  // Bleed into background color at edge (kills hard circle)
  vec3 bgCol = mix(vec3(0.28,0.35,0.88), vec3(0.18,0.25,0.72), edgeDist);
  col = mix(col, bgCol, smoothstep(0.58,0.78,edgeDist)*fresnel*0.55);

  // ── Tone + output ───────────────────────────────────────────────────────────
  col = max(col, vec3(0.));
  // ACES filmic
  col = (col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  // Slight gamma lift for luminosity
  col = pow(clamp(col,0.,1.), vec3(0.92));

  // Feathered alpha — no hard cutoff, dissolves into background
  float alpha = (0.86 + fresnel*0.14) * smoothstep(0.88, 0.64, edgeDist);

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Spring ──────────────────────────────────────────────────────────────────
class Spring {
  x=0; y=0; vx=0; vy=0; tx=0; ty=0;
  step(){
    this.vx+=(this.tx-this.x)*0.065; this.vy+=(this.ty-this.y)*0.065;
    this.vx*=0.86; this.vy*=0.86;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ── Orb ─────────────────────────────────────────────────────────────────────
function OrbCanvas({ size }: { size: number }) {
  const ref    = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf    = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    // Cap at 1.5× — still sharp on retina, much faster on high-dpi screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const gl = canvas.getContext("webgl",{alpha:true,premultipliedAlpha:false,antialias:true})!;
    if(!gl) return;

    const mkS=(t:number,src:string)=>{
      const s=gl.createShader(t)!;
      gl.shaderSource(s,src); gl.compileShader(s);
      const log=gl.getShaderInfoLog(s); if(log?.trim()) console.error("Shader:",log);
      return s;
    };
    const prog=gl.createProgram()!;
    gl.attachShader(prog,mkS(gl.VERTEX_SHADER,VERT));
    gl.attachShader(prog,mkS(gl.FRAGMENT_SHADER,FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const al=gl.getAttribLocation(prog,"a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

    const uT  =gl.getUniformLocation(prog,"u_t");
    const uR  =gl.getUniformLocation(prog,"u_res");
    const uRot=gl.getUniformLocation(prog,"u_rotXY");

    const onMove=(e:MouseEvent)=>{
      spring.current.tx=(e.clientY/window.innerHeight-.5)*2*0.50;
      spring.current.ty=(e.clientX/window.innerWidth -.5)*2*0.50;
    };
    window.addEventListener("mousemove",onMove);

    let lastT=0;
    const draw=(ts:number)=>{
      // Throttle: skip frame if <10ms since last (cap at ~90fps)
      if(ts-lastT < 10){ raf.current=requestAnimationFrame(draw); return; }
      lastT=ts;
      spring.current.step();
      const {x:rx,y:ry}=spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts*0.001);
      gl.uniform2f(uR, canvas.width,canvas.height);
      gl.uniform2f(uRot,rx,ry);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("mousemove",onMove);};
  },[size]);

  return (
    <canvas ref={ref} style={{
      width:size, height:size, display:"block",
      // Multi-layer glow: the orb radiates light outward
      filter:[
        "drop-shadow(0 0 45px rgba(160,200,255,0.60))",
        "drop-shadow(0 0 100px rgba(100,140,255,0.30))",
        "drop-shadow(0 0 200px rgba(80,100,220,0.18))",
        "drop-shadow(0 16px 55px rgba(20,35,150,0.50))",
      ].join(" "),
    }}/>
  );
}

// ── Background ───────────────────────────────────────────────────────────────
function SceneCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null);
  const raf    = useRef(0);
  const state  = useRef({
    angles: Array.from({length:7},(_,i)=>i*0.9),
    pts: Array.from({length:52},()=>({
      x:Math.random(), y:Math.random(),
      r:.3+Math.random()*1.2,
      vy:-.000032-Math.random()*.000060,
      a:.04+Math.random()*.17,
      ph:Math.random()*Math.PI*2,
      flick: .5+Math.random()*.5,
    })),
  });

  useEffect(()=>{
    const canvas=ref.current!;
    const ctx=canvas.getContext("2d")!;
    const dpr=Math.min(window.devicePixelRatio,2);
    const resize=()=>{
      canvas.width=window.innerWidth*dpr; canvas.height=window.innerHeight*dpr;
      canvas.style.width=window.innerWidth+"px"; canvas.style.height=window.innerHeight+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize(); window.addEventListener("resize",resize);

    const blobs=[
      {oR:.50,spd:.00036,r:.092,c:"rgba(118,145,255",a:.42},
      {oR:.40,spd:-.00024,r:.060,c:"rgba(98,128,248",a:.34},
      {oR:.58,spd:.00019,r:.118,c:"rgba(135,155,255",a:.26},
      {oR:.46,spd:-.00031,r:.042,c:"rgba(112,140,255",a:.22},
      {oR:.65,spd:.00015,r:.076,c:"rgba(92,122,238",a:.17},
      {oR:.35,spd:-.00045,r:.032,c:"rgba(150,165,255",a:.20},
      {oR:.73,spd:.00012,r:.052,c:"rgba(102,136,245",a:.13},
    ];
    const rings=[
      {r:.27,dots:46, dotR:1.2,a:.20},
      {r:.37,dots:62, dotR:.95,a:.13},
      {r:.47,dots:80, dotR:.75,a:.09},
      {r:.59,dots:100,dotR:.56,a:.055},
    ];

    const draw=(ts:number)=>{
      const t=ts*.001;
      const W=window.innerWidth,H=window.innerHeight;
      const cx=W*.5,cy=H*.5;
      const base=Math.min(W,H)*.30;
      const {angles,pts}=state.current;
      ctx.clearRect(0,0,W,H);

      // Deep indigo bg — slightly warmer than before
      const bg=ctx.createRadialGradient(cx,cy*.86,0,cx,cy,Math.max(W,H)*.90);
      bg.addColorStop(0,  "#4a58d2");
      bg.addColorStop(.25,"#3a48c5");
      bg.addColorStop(.55,"#2c38b2");
      bg.addColorStop(.80,"#1e289e");
      bg.addColorStop(1,  "#111888");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Luminous orb emission — the orb brightens the scene around it
      const pulse=.92+Math.sin(t*.26)*.08;
      const emission=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.55*pulse);
      emission.addColorStop(0,  "rgba(200,220,255,0.16)");
      emission.addColorStop(.30,"rgba(140,180,255,0.09)");
      emission.addColorStop(.60,"rgba(90,130,240,0.04)");
      emission.addColorStop(1,  "rgba(50,90,210,0)");
      ctx.fillStyle=emission; ctx.fillRect(0,0,W,H);

      // Vignette
      const vig=ctx.createRadialGradient(cx,cy,base*.2,cx,cy,Math.max(W,H)*.68);
      vig.addColorStop(0,"rgba(0,0,25,0)");
      vig.addColorStop(1,"rgba(3,5,40,0.44)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      // Orbit rings
      rings.forEach(ring=>{
        const rPx=base*(ring.r/.30),rY=rPx*.26;
        for(let i=0;i<ring.dots;i++){
          const a=(i/ring.dots)*Math.PI*2+t*.058;
          ctx.globalAlpha=ring.a*((Math.sin(a)+1.5)/2.5);
          ctx.fillStyle="#b5c2ff";
          ctx.beginPath(); ctx.arc(cx+Math.cos(a)*rPx,cy+Math.sin(a)*rY,ring.dotR,0,Math.PI*2); ctx.fill();
        }
      });

      // Satellite blobs
      blobs.forEach((b,i)=>{
        angles[i]+=b.spd;
        const a=angles[i];
        const rPx=base*(b.oR/.30),rY=rPx*.26;
        const bx=cx+Math.cos(a)*rPx,by=cy+Math.sin(a)*rY;
        const bR=base*b.r;
        const depth=(Math.sin(a)+1.)*.5;
        const gr=ctx.createRadialGradient(bx-bR*.2,by-bR*.2,0,bx,by,bR*1.35);
        gr.addColorStop(0,`${b.c},.84)`); gr.addColorStop(.45,`${b.c},.46)`); gr.addColorStop(1,`${b.c},0)`);
        ctx.globalAlpha=b.a*(.40+depth*.60);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Particles — drift upward, flicker
      pts.forEach(p=>{
        p.y+=p.vy; if(p.y<-.02){p.y=1.02;p.x=Math.random();}
        ctx.globalAlpha=p.a*(p.flick+(.5-p.flick)*Math.abs(Math.sin(t*1.6+p.ph)));
        ctx.fillStyle="#bcceff";
        ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.r,0,Math.PI*2); ctx.fill();
      });

      ctx.globalAlpha=1;
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[]);

  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate  = useNavigate();
  const [ready,  setReady]   = useState(false);
  const [orbSize,setOrbSize] = useState(520);

  useEffect(()=>{
    const calc=()=>setOrbSize(Math.min(
      window.innerWidth  * 0.60,
      window.innerHeight * 0.76,
      640,
    ));
    calc(); window.addEventListener("resize",calc);
    const t=setTimeout(()=>setReady(true),80);
    return()=>{window.removeEventListener("resize",calc);clearTimeout(t);};
  },[]);

  const fi=(d:number)=>({
    opacity:    ready?1:0,
    transform:  ready?"translateY(0)":"translateY(14px)",
    transition: `opacity .9s ${d}s cubic-bezier(.16,1,.3,1), transform .9s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",
      position:"relative",fontFamily:"'Afacad Flux',sans-serif"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:rgba(255,220,80,.28);color:#fff;}
        @keyframes shimmer{
          0%  {background-position:-200% center;}
          100%{background-position: 200% center;}
        }
        .cta-pill{
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(255,255,255,.92);
          border:none;color:#2535b4;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:600;letter-spacing:.01em;
          padding:15px 44px;border-radius:100px;cursor:pointer;
          box-shadow:0 6px 30px rgba(15,28,140,.32),0 2px 8px rgba(255,255,255,.15);
          transition:background .22s,transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s;
        }
        .cta-pill:hover{
          background:#fff;
          transform:translateY(-3px) scale(1.015);
          box-shadow:0 14px 50px rgba(15,28,140,.42),0 0 40px rgba(140,180,255,.22);
        }
        .arr{font-size:18px;display:inline-block;transition:transform .4s cubic-bezier(.16,1,.3,1);}
        .cta-pill:hover .arr{transform:translateX(5px);}
      `}</style>

      <SceneCanvas/>

      <div style={{position:"fixed",inset:0,zIndex:2,pointerEvents:"none",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <OrbCanvas size={orbSize}/>
      </div>

      <div style={{position:"fixed",inset:0,zIndex:10,pointerEvents:"none",
        display:"flex",flexDirection:"column"}}>

        <div style={{display:"flex",justifyContent:"center",paddingTop:28,...fi(.08)}}>
          <div style={{display:"flex",alignItems:"baseline"}}>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.95)"}}>EVERY</span>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.45)"}}>WHERE</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:".18em",
              color:"rgba(255,255,255,.40)",marginLeft:6,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
          </div>
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center"}}>

          <h1 style={{
            ...fi(.25),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700,lineHeight:.95,letterSpacing:"-.035em",
            color:"#fff",textAlign:"center",
            textShadow:"0 2px 32px rgba(20,40,140,.40)",
            marginBottom:0,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.38),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700,lineHeight:.95,letterSpacing:"-.035em",
            textAlign:"center",marginBottom:50,
            background:"linear-gradient(110deg,#ffe47a 0%,#fff 38%,#c8e0ff 80%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"shimmer 5s linear infinite",
          }}>Everywhere.</h1>

          <div style={{...fi(.55),pointerEvents:"auto"}}>
            <button className="cta-pill" onClick={()=>navigate("/explore")}>
              Explore Everywhere
              <span className="arr">→</span>
            </button>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"center",paddingBottom:26,...fi(.95)}}>
          <span style={{fontSize:11,letterSpacing:".12em",
            color:"rgba(255,255,255,.35)",fontWeight:400}}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
