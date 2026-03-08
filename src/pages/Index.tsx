import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// ─────────────────────────────────────────────────────────────────────────────
// LIQUID MERCURY ORB
// Technique: environment-mapped iridescent sphere with thin-film interference,
// flowing caustic light pools, and soft silhouette dissolution.
// No geometry ridges. No plastic surface. Pure light behavior.
// ─────────────────────────────────────────────────────────────────────────────
const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;

#define PI  3.14159265359
#define TAU 6.28318530718

// ── Rotation helpers ─────────────────────────────────────────────────────────
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 rotX(vec3 p,float a){ p.yz=rot2(a)*p.yz; return p; }
vec3 rotY(vec3 p,float a){ p.xz=rot2(a)*p.xz; return p; }

// ── Hash / noise ──────────────────────────────────────────────────────────────
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash(float n){ return fract(sin(n)*43758.5453); }

float smoothNoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(
    mix(hash(i),           hash(i+vec2(1,0)),f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)),f.x),
  f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){ v+=a*smoothNoise(p); p=p*2.1+vec2(3.1,1.7); a*=.5; }
  return v;
}

// ── Sphere SDF — barely any displacement, almost perfect sphere ───────────────
float sdf(vec3 p, float t){
  // Extremely subtle surface tension warp — NOT geometry ribs
  float n = fbm(vec2(atan(p.z,p.x)*0.8+t*0.04, acos(clamp(p.y/length(p),-1.,1.))*0.8+t*0.03));
  float warp = (n - 0.5) * 0.018; // max 0.9% of radius — just alive enough
  return length(p) - (0.72 + warp);
}

vec3 normal(vec3 p, float t){
  const float e=0.0012;
  return normalize(vec3(
    sdf(p+vec3(e,0,0),t)-sdf(p-vec3(e,0,0),t),
    sdf(p+vec3(0,e,0),t)-sdf(p-vec3(0,e,0),t),
    sdf(p+vec3(0,0,e),t)-sdf(p-vec3(0,0,e),t)
  ));
}

// ── Procedural HDR environment ────────────────────────────────────────────────
// This is what makes mercury look like mercury — it mirrors a rich world.
vec3 env(vec3 dir, float t){
  // Normalize to lat/lon
  float phi   = atan(dir.z, dir.x);
  float theta = acos(clamp(dir.y, -1., 1.));

  // Base sky: top=bright ice, bottom=deep indigo
  vec3 sky  = mix(vec3(0.06,0.10,0.55), vec3(0.85,0.92,1.00), smoothstep(.5,-.2,dir.y));
  // Bright "window" — off-top-left, warm white with slight gold
  float win = exp(-max(dot(dir, normalize(vec3(-0.5,0.8,0.4)))-0.0,0.)*12.);
  sky += vec3(1.0,0.97,0.88) * win * 1.8;
  // Secondary fill light — right side, cool blue-white  
  float fill= exp(-max(dot(dir, normalize(vec3(0.7,0.1,0.6)))-0.0,0.)*18.);
  sky += vec3(0.70,0.82,1.00) * fill * 0.6;
  // Floor bounce — warm gold-violet from below
  float floor_= smoothstep(-.1,.6,-dir.y);
  sky += mix(vec3(0.10,0.08,0.40), vec3(0.42,0.28,0.06), floor_*0.7) * floor_*0.5;
  // Flowing caustic bands in the environment (move with time)
  float causticEnv = fbm(vec2(phi*0.8+t*0.025, theta*1.1-t*0.018))*0.5+0.5;
  sky += vec3(0.80,0.90,1.00)*pow(causticEnv,3.)*0.35;

  return sky;
}

// ── Thin-film iridescence ─────────────────────────────────────────────────────
// Simulates soap-bubble / oilslick color shift based on viewing angle
vec3 thinFilm(float cosA, float thickness){
  // Optical path difference
  float opd = 2.0 * thickness * sqrt(max(0., 1.0 - (1.0/1.45)*(1.0/1.45)*(1.0-cosA*cosA)));
  // Phase per wavelength (R=650nm, G=550nm, B=450nm, normalized)
  vec3 phase = TAU * opd / vec3(0.650, 0.550, 0.450);
  // Reflectance via interference
  return vec3(0.5) + vec3(0.5)*cos(phase);
}

void main(){
  vec2 uv = (gl_FragCoord.xy/u_res)*2.-1.;
  float ar = u_res.x/u_res.y;
  uv.x *= ar;

  // Spring-physics rotation comes in as u_rotXY
  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  // Camera — orthographic-ish, slightly converging
  vec3 ro = vec3(0.,0.,2.3);
  vec3 rd = normalize(vec3(uv,-1.7));

  // ── Ray march ──────────────────────────────────────────────────────────────
  float dist=0.; bool hit=false; vec3 p;
  for(int i=0;i<88;i++){
    p = ro+rd*dist;
    float d=sdf(p,t);
    if(d<0.0005){hit=true;break;}
    if(dist>5.) break;
    dist+=d*0.9;
  }

  if(!hit){gl_FragColor=vec4(0.);return;}

  // ── Surface ────────────────────────────────────────────────────────────────
  vec3 N = normal(p, t);
  vec3 V = -rd;

  // Apply spring rotation to the NORMAL SPACE for env sampling
  // (this makes the reflections slide as user tilts — key for mercury feel)
  vec3 Nr = rotX(rotY(N, ry), rx);
  vec3 Vr = rotX(rotY(V, ry), rx);

  float NoV   = max(dot(N, V), 0.0);
  float NoV_r = max(dot(Nr, Vr), 0.0);

  // ── Perfect mirror reflection direction ───────────────────────────────────
  vec3 R  = reflect(-V, N);
  vec3 Rr = rotX(rotY(R, ry), rx); // rotate into env space

  // ── Environment sample ────────────────────────────────────────────────────
  vec3 envRefl = env(Rr, t);

  // ── Thin-film interference ────────────────────────────────────────────────
  // Film thickness varies slowly across surface + time drift
  vec3 lp = rotX(rotY(p,-ry),-rx); // local point
  float phi_s  = atan(lp.z,lp.x);
  float theta_s= acos(clamp(lp.y/max(length(lp),0.001),-1.,1.));
  // Thickness field: slow flowing noise on sphere surface
  float thickNoise = fbm(vec2(phi_s*0.7+t*0.028, theta_s*1.2-t*0.019));
  float thickness = 0.28 + thickNoise * 0.55; // range ~0.28–0.83
  vec3 film = thinFilm(NoV, thickness);

  // ── Caustic light pools ────────────────────────────────────────────────────
  // Flowing bright patches — like sunlight through water on the surface
  float c1 = pow(max(0., fbm(vec2(phi_s*1.1+t*0.045, theta_s*1.8+t*0.032))-0.4)*1.66, 2.2);
  float c2 = pow(max(0., fbm(vec2(phi_s*0.9-t*0.038, theta_s*1.4-t*0.027))-0.45)*1.82, 2.5);
  vec3 caustics = (vec3(0.88,0.94,1.00)*c1 + vec3(1.00,0.96,0.80)*c2) * 0.55;

  // ── Fresnel ────────────────────────────────────────────────────────────────
  // Mercury has very high Fresnel — almost fully reflective at grazing angles
  float F0     = 0.62; // base reflectivity of mercury (vs glass ~0.04)
  float fresnel= F0 + (1.-F0)*pow(1.-NoV, 4.5);

  // ── Compose surface ────────────────────────────────────────────────────────
  // Dark interior where not reflecting — deep mirror-black like actual mercury
  vec3 mirrorBase = mix(vec3(0.02,0.03,0.12), vec3(0.08,0.10,0.25), NoV*0.6);

  vec3 col = mirrorBase;

  // Layer 1: environment reflection — this IS mercury
  col = mix(col, envRefl, fresnel * 0.95);

  // Layer 2: thin-film iridescence on top of reflection
  // Blend strength varies: stronger at mid-angles, fades at grazing/normal
  float filmStr = sin(NoV*PI)*0.72; // peaks at 90° viewing angle
  col = mix(col, col * (0.4 + film*1.4), filmStr * 0.65);

  // Layer 3: caustics — bright light pools on surface
  col += caustics * (0.5 + fresnel*0.5);

  // Layer 4: specular hotspot — sharp bright reflection of "window"
  vec3 L_key = normalize(vec3(-0.5,0.8,0.4)); // matches env window direction
  vec3 H     = normalize(L_key + V);
  float spec = pow(max(dot(N,H),0.), 180.) * 1.4;
  col += vec3(1.00,0.98,0.92) * spec;
  // Secondary soft spec
  vec3 L2 = normalize(vec3(0.7,0.1,0.6));
  vec3 H2 = normalize(L2+V);
  col += vec3(0.75,0.88,1.00) * pow(max(dot(N,H2),0.),60.) * 0.45;

  // ── Rim / edge treatment — soft dissolution, no hard circle ───────────────
  float edgeDist = length(uv/vec2(ar,1.));
  // Chromatic aberration at rim (real glass/mercury effect)
  float rimR = smoothstep(0.68, 0.82, edgeDist);
  float rimB = smoothstep(0.72, 0.86, edgeDist);
  col.r += rimR * 0.08;
  col.b += rimB * 0.15;
  // Soft atmospheric bleed — sphere color bleeds into bg at edge
  vec3 bgBleed = vec3(0.26,0.34,0.88);
  col = mix(col, bgBleed, smoothstep(0.62,0.80,edgeDist)*fresnel*0.4);

  // ── Tone mapping ──────────────────────────────────────────────────────────
  col = max(col, vec3(0.));
  // ACES-ish filmic — preserves the bright specular without blowing out
  col = (col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col = clamp(col,0.,1.);

  // ── Alpha — feathered edge, no hard cutoff ───────────────────────────────
  float alpha = (0.88 + fresnel*0.12) * (1.-smoothstep(0.70,0.87,edgeDist));

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Spring physics ────────────────────────────────────────────────────────────
class Spring {
  x=0; y=0; vx=0; vy=0; tx=0; ty=0;
  step(){
    this.vx+=(this.tx-this.x)*0.068; this.vy+=(this.ty-this.y)*0.068;
    this.vx*=0.84; this.vy*=0.84;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ── WebGL Orb ─────────────────────────────────────────────────────────────────
function OrbCanvas({ size }: { size: number }) {
  const ref    = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf    = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl",{alpha:true,premultipliedAlpha:false,antialias:true})!;
    if(!gl) return;

    const mkS=(t:number,src:string)=>{
      const s=gl.createShader(t)!;
      gl.shaderSource(s,src); gl.compileShader(s);
      const log=gl.getShaderInfoLog(s); if(log?.trim()) console.error("Shader err:",log);
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
      const nx=(e.clientX/window.innerWidth -.5)*2;
      const ny=(e.clientY/window.innerHeight-.5)*2;
      spring.current.tx= ny*0.52;
      spring.current.ty= nx*0.52;
    };
    window.addEventListener("mousemove",onMove);

    const draw=(ts:number)=>{
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
      // Glow that feels like the orb is emitting light, not just sitting there
      filter:[
        "drop-shadow(0 0 55px rgba(140,180,255,0.55))",
        "drop-shadow(0 0 120px rgba(80,120,255,0.28))",
        "drop-shadow(0 20px 60px rgba(20,40,160,0.45))",
      ].join(" "),
    }}/>
  );
}

// ── Background ────────────────────────────────────────────────────────────────
function SceneCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null);
  const raf    = useRef(0);
  const angles = useRef(Array.from({length:7},(_,i)=>i*0.9));

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
      {oR:.50,spd:.00038,r:.095,c:"rgba(120,148,255",a:.44},
      {oR:.40,spd:-.00026,r:.062,c:"rgba(100,132,248",a:.36},
      {oR:.58,spd:.00020,r:.125,c:"rgba(138,158,255",a:.28},
      {oR:.46,spd:-.00033,r:.045,c:"rgba(115,145,255",a:.24},
      {oR:.66,spd:.00016,r:.080,c:"rgba(95,125,238",a:.18},
      {oR:.36,spd:-.00048,r:.034,c:"rgba(155,168,255",a:.22},
      {oR:.74,spd:.00013,r:.055,c:"rgba(105,140,245",a:.15},
    ];
    const rings=[
      {r:.28,dots:48, dotR:1.3,a:.22},
      {r:.38,dots:64, dotR:1.0,a:.15},
      {r:.48,dots:82, dotR:.80,a:.10},
      {r:.60,dots:104,dotR:.60,a:.06},
    ];
    const pts=Array.from({length:50},()=>({
      x:Math.random(),y:Math.random(),
      r:.3+Math.random()*1.2,
      vy:-.000035-Math.random()*.000065,
      a:.04+Math.random()*.18,
      ph:Math.random()*Math.PI*2,
    }));

    const draw=(ts:number)=>{
      const t=ts*.001;
      const W=window.innerWidth,H=window.innerHeight;
      const cx=W*.5,cy=H*.5;
      const base=Math.min(W,H)*.30;
      ctx.clearRect(0,0,W,H);

      // Rich indigo bg
      const bg=ctx.createRadialGradient(cx,cy*.88,0,cx,cy,Math.max(W,H)*.88);
      bg.addColorStop(0,  "#4858d0");
      bg.addColorStop(.28,"#3848c4");
      bg.addColorStop(.58,"#2a38b0");
      bg.addColorStop(.82,"#1c2898");
      bg.addColorStop(1,  "#101880");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Soft orb glow on bg
      const pulse=.93+Math.sin(t*.28)*.07;
      const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.35*pulse);
      halo.addColorStop(0,  "rgba(120,160,255,0.14)");
      halo.addColorStop(.42,"rgba(80,120,240,0.06)");
      halo.addColorStop(1,  "rgba(50,90,210,0)");
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);

      // Vignette
      const vig=ctx.createRadialGradient(cx,cy,base*.22,cx,cy,Math.max(W,H)*.70);
      vig.addColorStop(0,"rgba(0,0,28,0)");
      vig.addColorStop(1,"rgba(4,6,44,0.42)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      // Orbit rings
      rings.forEach(ring=>{
        const rPx=base*(ring.r/.30),rY=rPx*.26;
        for(let i=0;i<ring.dots;i++){
          const a=(i/ring.dots)*Math.PI*2+t*.060;
          ctx.globalAlpha=ring.a*((Math.sin(a)+1.5)/2.5);
          ctx.fillStyle="#b8c6ff";
          ctx.beginPath(); ctx.arc(cx+Math.cos(a)*rPx,cy+Math.sin(a)*rY,ring.dotR,0,Math.PI*2); ctx.fill();
        }
      });

      // Satellite blobs
      blobs.forEach((b,i)=>{
        angles.current[i]+=b.spd;
        const a=angles.current[i];
        const rPx=base*(b.oR/.30),rY=rPx*.26;
        const bx=cx+Math.cos(a)*rPx,by=cy+Math.sin(a)*rY;
        const bR=base*b.r;
        const depth=(Math.sin(a)+1.)*.5;
        const gr=ctx.createRadialGradient(bx-bR*.2,by-bR*.2,0,bx,by,bR*1.3);
        gr.addColorStop(0,`${b.c},.86)`); gr.addColorStop(.44,`${b.c},.48)`); gr.addColorStop(1,`${b.c},0)`);
        ctx.globalAlpha=b.a*(.42+depth*.58);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Particles
      pts.forEach(p=>{
        p.y+=p.vy; if(p.y<-.02){p.y=1.02;p.x=Math.random();}
        ctx.globalAlpha=p.a*(.70+.30*Math.sin(t*1.75+p.ph));
        ctx.fillStyle="#c0d0ff";
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

// ── Main Page ─────────────────────────────────────────────────────────────────
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

      {/* Orb */}
      <div style={{position:"fixed",inset:0,zIndex:2,pointerEvents:"none",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <OrbCanvas size={orbSize}/>
      </div>

      {/* UI */}
      <div style={{position:"fixed",inset:0,zIndex:10,pointerEvents:"none",
        display:"flex",flexDirection:"column"}}>

        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:28,...fi(.08)}}>
          <div style={{display:"flex",alignItems:"baseline"}}>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.95)"}}>EVERY</span>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.45)"}}>WHERE</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:".18em",
              color:"rgba(255,255,255,.40)",marginLeft:6,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
          </div>
        </div>

        {/* Headline */}
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

        {/* Bottom */}
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
