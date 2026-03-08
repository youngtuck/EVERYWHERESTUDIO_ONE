import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// ─────────────────────────────────────────────────────────────────────────────
// THE EVERYWHERE ORB
//
// A living energy entity: translucent iridescent shell containing flowing
// interior light. Like a thought made visible. Like signal made physical.
//
// Technique:
//  · Two-pass ray march: shell surface + interior volumetric glow
//  · Shell: thin-film iridescence (soap bubble) + soft alpha dissolution
//  · Interior: flowing FBM light ribbons in brand colors (indigo/blue/gold)
//  · Subpixel alpha antialiasing on the silhouette edge
//  · Spring-physics mouse reactivity tilts the whole entity
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

// ── Noise ──────────────────────────────────────────────────────────────────
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash11(float n){ return fract(sin(n)*43758.5453); }

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm3(vec2 p){
  return noise(p)*.5 + noise(p*2.1+vec2(1.7,9.2))*.25 + noise(p*4.3+vec2(8.3,2.8))*.125;
}

// ── Thin-film interference ─────────────────────────────────────────────────
vec3 thinFilm(float cosA, float thick){
  float opd = 2.*thick*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-cosA*cosA)));
  vec3 phase = TAU*opd/vec3(.650,.550,.450);
  return .5+.5*cos(phase);
}

// ── Interior energy field ──────────────────────────────────────────────────
// Flowing ribbons of light inside the sphere
vec3 interiorEnergy(vec3 p, float t){
  // Normalized position inside unit sphere
  float r = length(p);

  // Flow field — swirling FBM in 3D projected to 2D slices
  float phi   = atan(p.z, p.x);
  float theta = acos(clamp(p.y/max(r,.001),-1.,1.));

  // Multiple flow layers at different speeds and scales
  float flow1 = fbm3(vec2(phi*1.2 + t*.08,  theta*1.8 + t*.05));
  float flow2 = fbm3(vec2(phi*.7  - t*.06,  theta*1.3 - t*.04) + vec2(3.1,7.4));
  float flow3 = fbm3(vec2(phi*2.1 + t*.11,  theta*2.5 + t*.07) + vec2(5.9,2.2));

  // Ribbon-like structure: threshold the flow to get bands
  float ribbon1 = pow(max(0., 1. - abs(flow1 - .55)*6.), 2.2);
  float ribbon2 = pow(max(0., 1. - abs(flow2 - .48)*7.), 2.5);
  float ribbon3 = pow(max(0., 1. - abs(flow3 - .52)*5.), 1.8);

  // Brand color palette for ribbons:
  // Primary: electric indigo-blue
  // Secondary: deep violet
  // Accent: warm gold
  vec3 col1 = vec3(0.25, 0.55, 1.00) * ribbon1 * 1.8;  // electric blue
  vec3 col2 = vec3(0.55, 0.22, 0.90) * ribbon2 * 1.4;  // violet
  vec3 col3 = vec3(1.00, 0.75, 0.20) * ribbon3 * 1.0;  // gold accent

  // Soft core glow — deep indigo, brighter at center
  float coreGlow = exp(-r*r*2.8) * (.5 + .5*sin(t*.4));
  vec3 core = vec3(0.12, 0.20, 0.65) * coreGlow * 2.0;

  // Ambient fill — the dark base color (deep midnight blue)
  vec3 ambient = vec3(0.04, 0.06, 0.22) * (.3 + .7*(1.-r));

  return ambient + core + col1 + col2 + col3;
}

void main(){
  vec2 uv = (gl_FragCoord.xy/u_res)*2.-1.;
  float ar = u_res.x/u_res.y;
  uv.x *= ar;

  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  // ── Ray setup ─────────────────────────────────────────────────────────────
  vec3 ro = vec3(0.,0.,2.3);
  vec3 rd = normalize(vec3(uv,-1.65));

  // ── Analytically intersect sphere (no ray marching needed for perfect sphere) ──
  // This is the key to crisp, antialiased edges — analytic intersection = exact
  float R  = 0.720;  // sphere radius
  float b  = dot(ro, rd);
  float c  = dot(ro, ro) - R*R;
  float disc = b*b - c;

  if(disc < 0.0){
    gl_FragColor = vec4(0.);
    return;
  }

  float sqrtDisc = sqrt(disc);
  float t1 = -b - sqrtDisc; // front hit
  float t2 = -b + sqrtDisc; // back hit

  // Subpixel antialias: fade alpha at silhouette
  // disc approaches 0 at the silhouette edge
  // Use sqrt(disc) as a soft distance to edge
  float edgeAA = smoothstep(0., 0.0035, sqrtDisc);  // 2-3 subpixel feather

  if(t2 < 0.0){ gl_FragColor = vec4(0.); return; }
  t1 = max(t1, 0.0);

  vec3 pFront = ro + rd*t1;
  vec3 pBack  = ro + rd*t2;

  // ── Surface normal (front hit) ────────────────────────────────────────────
  vec3 N = normalize(pFront);
  vec3 V = -rd;

  // Apply spring rotation to normal for env reflection
  vec3 Nr = rotX(rotY(N, ry), rx);
  vec3 Vr = rotX(rotY(V, ry), rx);

  float NoV = max(dot(N,V), 0.);

  // ── Thin-film shell ───────────────────────────────────────────────────────
  // Film thickness varies by position + time (slow drift)
  // Rotate local point for the thickness field
  vec3 lp = rotX(rotY(pFront,-ry),-rx);
  float phi_s   = atan(lp.z,lp.x);
  float theta_s = acos(clamp(lp.y/max(length(lp),.001),-1.,1.));

  float thickFlow = fbm3(vec2(phi_s*.65 + t*.022, theta_s*1.1 - t*.016));
  float thick = .30 + thickFlow * .60;

  vec3 film = thinFilm(NoV, thick);

  // Shell Fresnel — high base reflectivity like glass/soap
  float F0      = 0.055;
  float fresnel = F0 + (1.-F0)*pow(1.-NoV, 4.2);
  // Boost at silhouette for that glowing edge
  float rimBump = pow(1.-NoV, 6.0) * 1.2;
  fresnel = min(fresnel + rimBump, 1.0);

  // Shell iridescent color — film modulates a base indigo
  vec3 shellBase = mix(vec3(.15,.22,.72), vec3(.80,.88,1.), NoV*.5);
  vec3 shellCol  = mix(shellBase, film * vec3(.90,.95,1.05), .78);

  // Sharp specular hotspot
  vec3 L_key = normalize(vec3(-.45,.80,.45));
  vec3 H     = normalize(L_key+V);
  float spec = pow(max(dot(N,H),0.), 160.) * 1.2;
  shellCol += vec3(1.,1.,1.) * spec;

  // ── Interior volume ───────────────────────────────────────────────────────
  // Sample interior energy at multiple depths along the ray
  // Simple 4-sample integration through the sphere volume
  vec3 intColor = vec3(0.);
  float intDepth = t2 - t1;

  // Rotate the ray direction for interior (spring physics affects interior too)
  for(int i=0;i<6;i++){
    float fi = float(i)/5.;
    vec3 sampleP = ro + rd*(t1 + intDepth*(fi*.85+.08));
    // Rotate sample point into local spring-physics space
    vec3 localP = rotX(rotY(sampleP,-ry),-rx);
    vec3 energy = interiorEnergy(localP, t);
    // Weight by distance from center (more energy near center)
    float w = 1. - fi*.4;
    intColor += energy * w;
  }
  intColor /= 4.5; // normalize

  // ── Shell transparency ────────────────────────────────────────────────────
  // Shell is semi-transparent — interior shows through, more at center
  // At grazing angles (rim), shell is more opaque/reflective
  // At center (normal incidence), shell is more transparent
  float shellOpacity = mix(0.18, 0.72, fresnel);

  // Composite: interior + shell overlay
  vec3 col = intColor;

  // Add shell as an overlay — iridescent film over the energy
  col = mix(col, shellCol, shellOpacity);

  // Extra rim glow — bright electric edge blending into background
  vec3 rimGlow = mix(vec3(.28,.45,1.0), vec3(.60,.40,.95), sin(t*.3)*.5+.5);
  col += rimGlow * (rimBump * .55);

  // ── Tone mapping ──────────────────────────────────────────────────────────
  // Filmic — keeps the bright ribbons vivid without blowing out
  col = max(col, vec3(0.));
  col = (col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col = clamp(col, 0., 1.);

  // ── Alpha — analytic AA, soft edge ───────────────────────────────────────
  // Core alpha: fully opaque sphere coverage
  // Edge feather: subpixel smooth from analytic disc
  float alpha = edgeAA;

  // Additional soft vignette at rim: shell dissolves into background
  float rimFade = smoothstep(.68, .84, length(uv/vec2(ar,1.)));
  // Don't cut alpha — let the interior show as glow bleeding into bg
  alpha = alpha * (1. - rimFade*.35);

  // Breathing pulse on alpha (very subtle — just alive)
  float breathe = .97 + sin(t*.28)*.03 + sin(t*.71)*.01;
  alpha *= breathe;

  gl_FragColor = vec4(col*alpha, alpha);
}
`;

// ── Spring physics ────────────────────────────────────────────────────────────
class Spring {
  x=0; y=0; vx=0; vy=0; tx=0; ty=0;
  step(){
    this.vx+=(this.tx-this.x)*.065; this.vy+=(this.ty-this.y)*.065;
    this.vx*=.85; this.vy*=.85;
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
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const gl = canvas.getContext("webgl",{alpha:true,premultipliedAlpha:false,antialias:true})!;
    if(!gl) return;

    const mkS=(type:number,src:string)=>{
      const s=gl.createShader(type)!;
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
      const nx=(e.clientX/window.innerWidth -.5)*2;
      const ny=(e.clientY/window.innerHeight-.5)*2;
      spring.current.tx= ny*0.55;
      spring.current.ty= nx*0.55;
    };
    window.addEventListener("mousemove",onMove);

    const draw=(ts:number)=>{
      spring.current.step();
      const {x:rx,y:ry}=spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts*.001);
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
      // Glow: the orb radiates outward into the background — entity feel
      filter:[
        "drop-shadow(0 0 40px rgba(80,120,255,0.60))",
        "drop-shadow(0 0 100px rgba(60,90,255,0.30))",
        "drop-shadow(0 0 200px rgba(40,70,220,0.15))",
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
      {oR:.50,spd:.00036,r:.095,c:"rgba(100,128,245",a:.40},
      {oR:.40,spd:-.00024,r:.060,c:"rgba( 85,112,238",a:.32},
      {oR:.58,spd:.00019,r:.118,c:"rgba(118,140,252",a:.26},
      {oR:.46,spd:-.00031,r:.044,c:"rgba(100,125,248",a:.22},
      {oR:.66,spd:.00015,r:.078,c:"rgba( 80,108,232",a:.17},
      {oR:.36,spd:-.00046,r:.032,c:"rgba(140,155,255",a:.20},
      {oR:.74,spd:.00012,r:.052,c:"rgba( 90,122,240",a:.13},
    ];
    const rings=[
      {r:.28,dots:46, dotR:1.2,a:.20},
      {r:.38,dots:62, dotR:.95,a:.13},
      {r:.48,dots:80, dotR:.75,a:.08},
      {r:.60,dots:102,dotR:.58,a:.05},
    ];
    const pts=Array.from({length:48},()=>({
      x:Math.random(),y:Math.random(),
      r:.3+Math.random()*1.1,
      vy:-.00003-Math.random()*.00006,
      a:.04+Math.random()*.16,
      ph:Math.random()*Math.PI*2,
    }));

    const draw=(ts:number)=>{
      const t=ts*.001;
      const W=window.innerWidth,H=window.innerHeight;
      const cx=W*.5,cy=H*.5;
      const base=Math.min(W,H)*.30;
      ctx.clearRect(0,0,W,H);

      // Deep rich indigo — darker than before so orb pops
      const bg=ctx.createRadialGradient(cx,cy*.88,0,cx,cy,Math.max(W,H)*.88);
      bg.addColorStop(0,  "#3d4ec8");
      bg.addColorStop(.28,"#2e3eb8");
      bg.addColorStop(.58,"#2030a8");
      bg.addColorStop(.82,"#152290");
      bg.addColorStop(1,  "#0d1678");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Orb glow — diffuse light emanating from center (entity presence)
      const pulse=.92+Math.sin(t*.26)*.08;
      const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.45*pulse);
      halo.addColorStop(0,  "rgba(80,130,255,0.22)");
      halo.addColorStop(.35,"rgba(60,100,240,0.10)");
      halo.addColorStop(.70,"rgba(40, 70,200,0.04)");
      halo.addColorStop(1,  "rgba(20, 40,160,0)");
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);

      // Vignette
      const vig=ctx.createRadialGradient(cx,cy,base*.2,cx,cy,Math.max(W,H)*.68);
      vig.addColorStop(0,"rgba(0,0,24,0)");
      vig.addColorStop(1,"rgba(3,5,40,0.50)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      // Orbit rings
      rings.forEach(ring=>{
        const rPx=base*(ring.r/.30),rY=rPx*.26;
        for(let i=0;i<ring.dots;i++){
          const a=(i/ring.dots)*Math.PI*2+t*.058;
          ctx.globalAlpha=ring.a*((Math.sin(a)+1.5)/2.5);
          ctx.fillStyle="#a8b8f8";
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
        gr.addColorStop(0,`${b.c},.84)`); gr.addColorStop(.44,`${b.c},.46)`); gr.addColorStop(1,`${b.c},0)`);
        ctx.globalAlpha=b.a*(.44+depth*.56);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Particles
      pts.forEach(p=>{
        p.y+=p.vy; if(p.y<-.02){p.y=1.02;p.x=Math.random();}
        ctx.globalAlpha=p.a*(.68+.32*Math.sin(t*1.7+p.ph));
        ctx.fillStyle="#b0c4ff";
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
      window.innerWidth  * 0.58,
      window.innerHeight * 0.74,
      620,
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
          border:none;color:#1e2da0;
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:600;letter-spacing:.01em;
          padding:15px 44px;border-radius:100px;cursor:pointer;
          box-shadow:0 6px 30px rgba(10,20,130,.35),0 2px 8px rgba(255,255,255,.15);
          transition:background .22s,transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s;
        }
        .cta-pill:hover{
          background:#fff;
          transform:translateY(-3px) scale(1.015);
          box-shadow:0 14px 50px rgba(10,20,130,.45),0 0 40px rgba(100,150,255,.25);
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
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.42)"}}>WHERE</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:".18em",
              color:"rgba(255,255,255,.38)",marginLeft:6,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
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
            textShadow:"0 2px 32px rgba(10,20,120,.50)",
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
            color:"rgba(255,255,255,.32)",fontWeight:400}}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
