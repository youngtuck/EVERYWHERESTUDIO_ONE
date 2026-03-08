import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

// ─────────────────────────────────────────────────────────────────────────────
// THE EVERYWHERE ORB — v6 "Entity in the Void"
//
// Philosophy: deep midnight background, orb as the only light source.
// Iridescent shell + flowing interior energy, perfectly smooth edge,
// glow baked into shader (no CSS filter artifacts).
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

float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  return noise(p)*.50 + noise(p*2.1+vec2(1.7,9.2))*.25 + noise(p*4.3+vec2(8.3,2.8))*.125;
}

// Thin-film iridescence — soap bubble / oilslick color shift
vec3 thinFilm(float cosA, float thick){
  float opd = 2.*thick*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-cosA*cosA)));
  vec3 phase = TAU*opd/vec3(.650,.550,.450);
  return .5+.5*cos(phase);
}

// Interior energy — flowing light ribbons in brand palette
vec3 interior(vec3 lp, float t){
  float r = length(lp);
  float phi   = atan(lp.z,lp.x);
  float theta = acos(clamp(lp.y/max(r,.001),-1.,1.));

  float f1 = fbm(vec2(phi*1.1 + t*.07,   theta*1.6 + t*.045));
  float f2 = fbm(vec2(phi*.8  - t*.055,  theta*1.2 - t*.038) + vec2(3.1,7.4));
  float f3 = fbm(vec2(phi*1.8 + t*.09,   theta*2.2 + t*.06)  + vec2(5.9,2.2));

  // Soft ribbon thresholding
  float r1 = pow(max(0., 1.-abs(f1-.54)*5.5), 2.0);
  float r2 = pow(max(0., 1.-abs(f2-.47)*6.5), 2.3);
  float r3 = pow(max(0., 1.-abs(f3-.51)*5.0), 1.8);

  // Brand palette: electric blue, deeper blue, cool ice blue
  vec3 c1 = vec3(.20,.55,1.00)*r1*1.6;   // electric blue
  vec3 c2 = vec3(.10,.30,.95)*r2*1.3;   // deep blue
  vec3 c3 = vec3(.55,.80,1.00)*r3*.85;   // ice blue

  // Core: deep indigo glow, breathing
  float core = exp(-r*r*2.5)*(.45+.55*sin(t*.38+.8));
  vec3 coreCol = vec3(.08,.14,.60)*core*2.2;

  // Dark base — midnight interior
  vec3 base = vec3(.02,.03,.14)*(.4+.6*(1.-r));

  return base + coreCol + c1 + c2 + c3;
}

void main(){
  vec2 uv = (gl_FragCoord.xy/u_res)*2.-1.;
  float ar = u_res.x/u_res.y;
  uv.x *= ar;

  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  // Analytic sphere intersection — exact, no stepping, perfect silhouette
  float R  = 0.72;
  vec3 ro  = vec3(0.,0.,2.3);
  vec3 rd  = normalize(vec3(uv,-1.65));
  float b  = dot(ro,rd);
  float c  = dot(ro,ro)-R*R;
  float disc = b*b-c;

  // ── Background glow — baked into shader, no CSS filter needed ────────────
  // Soft bloom from orb center, even outside the sphere
  float distToCenter = length(uv/vec2(ar,1.));
  float bgGlow = exp(-distToCenter*distToCenter*1.8)*0.55;
  // Pulsing halo ring
  float haloR = .78 + sin(t*.22)*.04;
  float halo  = exp(-abs(distToCenter-haloR)*12.)*.18;
  // Color the glow: bright indigo
  vec3 bgCol = vec3(.22,.32,.88)*bgGlow + vec3(.18,.26,.78)*halo;
  // Subtle bloom in brand blue
  bgCol += vec3(.15,.28,.80)*exp(-distToCenter*distToCenter*3.8)*.25;

  if(disc < 0.0){
    // Outside sphere — just the bg glow
    // Feather at silhouette edge for smooth blending
    float edgeFade = smoothstep(-.002, .012, -disc);
    gl_FragColor = vec4(bgCol, edgeFade*0.95 + (1.-edgeFade)*min(bgGlow*1.4+halo*1.2,1.));
    return;
  }

  float sqrtD = sqrt(disc);
  float t1    = max(-b-sqrtD, 0.);
  float t2    = -b+sqrtD;
  if(t2<0.){ gl_FragColor=vec4(bgCol,min(bgGlow+halo,1.)); return; }

  // Subpixel silhouette AA — disc → 0 at edge
  float edgeAA = smoothstep(0., .004, sqrtD);

  vec3 pF = ro+rd*t1;
  vec3 N  = normalize(pF);
  vec3 V  = -rd;
  float NoV = max(dot(N,V),0.);

  // Rotate local space for spring-physics reactivity
  vec3 lp  = rotX(rotY(pF,-ry),-rx);
  float phi_s   = atan(lp.z,lp.x);
  float theta_s = acos(clamp(lp.y/max(length(lp),.001),-1.,1.));

  // ── Thin-film shell ───────────────────────────────────────────────────────
  float thickN = fbm(vec2(phi_s*.6+t*.020, theta_s*1.0-t*.015));
  float thick  = .28+thickN*.65;
  vec3  film   = thinFilm(NoV, thick);

  // Fresnel — glassy, high at rim
  float F0      = .06;
  float fresnel = F0+(1.-F0)*pow(1.-NoV,4.0);
  float rim     = pow(1.-NoV,5.5)*1.1;
  fresnel       = min(fresnel+rim,.98);

  // Shell color: iridescent film over deep base
  vec3 shellBase = mix(vec3(.06,.10,.42), vec3(.55,.68,.96), NoV*.6);
  vec3 shellCol  = mix(shellBase, film*vec3(.95,1.,.98), .82);

  // Key specular — bright white point (the "sun" in the glass)
  vec3 Lk = normalize(vec3(-.42,.78,.48));
  vec3 H  = normalize(Lk+V);
  shellCol += vec3(1.,1.,1.)*pow(max(dot(N,H),0.),180.)*1.3;
  // Soft secondary
  shellCol += vec3(.65,.80,1.)*pow(max(dot(N,normalize(vec3(.70,.12,.52)+V)),0.),55.)*.4;

  // ── Interior energy ───────────────────────────────────────────────────────
  vec3 intCol = vec3(0.);
  float span  = t2-t1;
  for(int i=0;i<6;i++){
    float fi = float(i)/5.;
    vec3 sp  = ro+rd*(t1+span*(fi*.82+.09));
    vec3 slp = rotX(rotY(sp,-ry),-rx);
    intCol  += interior(slp,t)*(1.-fi*.35);
  }
  intCol /= 4.2;

  // ── Shell opacity: more opaque overall, less crystal/glass ─────────────────
  float shellOp = mix(.50, .92, fresnel);
  vec3  col     = mix(intCol, shellCol, shellOp);

  // Rim glow — electric blue only
  vec3 rimGlow = vec3(.25,.50,1.0);
  col += rimGlow*rim*.60;

  // ── Tone map ──────────────────────────────────────────────────────────────
  col = max(col,vec3(0.));
  col = (col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col = clamp(col,0.,1.);

  // ── Alpha — smooth, no hard edge ─────────────────────────────────────────
  float alpha = edgeAA*(.90+fresnel*.10);
  // Blend bg glow into the alpha edge so it dissolves cleanly
  float blendZone = 1.-smoothstep(.0,.015,sqrtD);
  col  = mix(col,  bgCol, blendZone*.6);
  alpha = max(alpha, bgGlow*.7+halo*.5)*edgeAA + (1.-edgeAA)*(bgGlow*.8+halo*.6);

  gl_FragColor = vec4(col*alpha, alpha);
}
`;

// ── Spring physics ────────────────────────────────────────────────────────────
class Spring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(){
    this.vx+=(this.tx-this.x)*.062; this.vy+=(this.ty-this.y)*.062;
    this.vx*=.86; this.vy*=.86;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ── WebGL Orb — NO CSS filter, glow is inside shader ─────────────────────────
function OrbCanvas({ size }: { size: number }) {
  const ref    = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf    = useRef(0);

  useEffect(()=>{
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio||1;
    canvas.width  = Math.round(size*dpr);
    canvas.height = Math.round(size*dpr);

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
      spring.current.tx=ny*.55;
      spring.current.ty=nx*.55;
    };
    window.addEventListener("mousemove",onMove);

    const draw=(ts:number)=>{
      spring.current.step();
      const {x:rx,y:ry}=spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,ts*.001);
      gl.uniform2f(uR,canvas.width,canvas.height);
      gl.uniform2f(uRot,rx,ry);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("mousemove",onMove);};
  },[size]);

  // NO CSS filter — perfectly clean edge
  return <canvas ref={ref} style={{width:size,height:size,display:"block"}}/>;
}

// ── Background — deep midnight void, orb is the light source ─────────────────
function SceneCanvas() {
  const ref    = useRef<HTMLCanvasElement>(null);
  const raf    = useRef(0);
  const angles = useRef(Array.from({length:6},(_,i)=>i*1.05));

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

    // Minimal satellite blobs — barely visible, deep in the void
    const blobs=[
      {oR:.46,spd:.00028,r:.070,c:"rgba(60,80,200",  a:.18},
      {oR:.36,spd:-.00020,r:.045,c:"rgba(50,65,185",  a:.14},
      {oR:.55,spd:.00015,r:.090,c:"rgba(70,90,210",  a:.12},
      {oR:.42,spd:-.00024,r:.034,c:"rgba(55,72,195",  a:.10},
      {oR:.62,spd:.00012,r:.058,c:"rgba(45,62,178",  a:.09},
      {oR:.32,spd:-.00035,r:.026,c:"rgba(80,95,220",  a:.10},
    ];
    // Sparse distant stars
    const stars=Array.from({length:80},()=>({
      x:Math.random(),y:Math.random(),
      r:.2+Math.random()*.7,
      a:.04+Math.random()*.12,
      ph:Math.random()*Math.PI*2,
    }));

    const draw=(ts:number)=>{
      const t=ts*.001;
      const W=window.innerWidth,H=window.innerHeight;
      const cx=W*.5,cy=H*.5;
      const base=Math.min(W,H)*.30;
      ctx.clearRect(0,0,W,H);

      // ── Deep midnight void — matches explore page darkness ────────────────
      // Bright indigo bg
      const bg=ctx.createRadialGradient(cx,cy*.88,0,cx,cy,Math.max(W,H)*.88);
      bg.addColorStop(0,  "#4a5fd4");
      bg.addColorStop(.28,"#3a4ec8");
      bg.addColorStop(.58,"#2b3db5");
      bg.addColorStop(.82,"#1c2c9e");
      bg.addColorStop(1,  "#111f88");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Orb's light bleeding into scene — diffuse indigo from center
      const pulse=.90+Math.sin(t*.24)*.10;
      const orbLight=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.6*pulse);
      orbLight.addColorStop(0,  "rgba(55,80,200,0.18)");
      orbLight.addColorStop(.3, "rgba(40,60,170,0.08)");
      orbLight.addColorStop(.65,"rgba(25,38,130,0.03)");
      orbLight.addColorStop(1,  "rgba(10,15,80,0)");
      ctx.fillStyle=orbLight; ctx.fillRect(0,0,W,H);

      // Ground shadow — very subtle ellipse below orb, grounds it in space
      ctx.save();
      ctx.translate(cx, cy + base*.72);
      ctx.scale(1, .22);
      const shadow=ctx.createRadialGradient(0,0,0,0,0,base*.58);
      shadow.addColorStop(0,  "rgba(30,50,180,0.22)");
      shadow.addColorStop(.5, "rgba(20,35,140,0.08)");
      shadow.addColorStop(1,  "rgba(10,18,90,0)");
      ctx.fillStyle=shadow;
      ctx.beginPath(); ctx.arc(0,0,base*.58,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // Subtle satellite blobs — ghost-like, barely there
      blobs.forEach((b,i)=>{
        angles.current[i]+=b.spd;
        const a=angles.current[i];
        const rPx=base*(b.oR/.30),rY=rPx*.24;
        const bx=cx+Math.cos(a)*rPx,by=cy+Math.sin(a)*rY;
        const bR=base*b.r;
        const depth=(Math.sin(a)+1.)*.5;
        const gr=ctx.createRadialGradient(bx,by,0,bx,by,bR*1.2);
        gr.addColorStop(0,`${b.c},.70)`); gr.addColorStop(.5,`${b.c},.30)`); gr.addColorStop(1,`${b.c},0)`);
        ctx.globalAlpha=b.a*(.40+depth*.60);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Distant stars — sparse and dim
      stars.forEach(s=>{
        ctx.globalAlpha=s.a*(.55+.45*Math.sin(t*1.2+s.ph));
        ctx.fillStyle="#8090cc";
        ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2); ctx.fill();
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
  const [ready,   setReady]   = useState(false);
  const [orbSize, setOrbSize] = useState(520);

  useEffect(()=>{
    const calc=()=>setOrbSize(Math.min(
      window.innerWidth  * 0.58,
      window.innerHeight * 0.76,
      620,
    ));
    calc(); window.addEventListener("resize",calc);
    const t=setTimeout(()=>setReady(true),80);
    return()=>{window.removeEventListener("resize",calc);clearTimeout(t);};
  },[]);

  const fi=(d:number)=>({
    opacity:   ready?1:0,
    transform: ready?"translateY(0)":"translateY(14px)",
    transition:`opacity .9s ${d}s cubic-bezier(.16,1,.3,1),transform .9s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",
      position:"relative",fontFamily:"'Afacad Flux',sans-serif",
      background:"#060810"}}>

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
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.28);
          color:rgba(255,255,255,.92);
          font-family:'Afacad Flux',sans-serif;
          font-size:16px;font-weight:500;letter-spacing:.04em;
          padding:14px 42px;border-radius:100px;cursor:pointer;
          backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          transition:background .25s,border-color .25s,transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s;
        }
        .cta-pill:hover{
          background:rgba(255,255,255,.18);
          border-color:rgba(255,255,255,.55);
          transform:translateY(-3px);
          box-shadow:0 12px 48px rgba(60,100,255,.28),0 4px 20px rgba(255,255,255,.08);
        }
        .arr{font-size:18px;display:inline-block;transition:transform .4s cubic-bezier(.16,1,.3,1);}
        .cta-pill:hover .arr{transform:translateX(5px);}
      `}</style>

      <SceneCanvas/>

      {/* Orb — centered */}
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
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.90)"}}>EVERY</span>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.35)"}}>WHERE</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:".18em",
              color:"rgba(255,255,255,.28)",marginLeft:6,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center"}}>

          <h1 style={{
            ...fi(.25),
            fontSize:"clamp(48px,8vw,112px)",
            fontWeight:700,lineHeight:.95,letterSpacing:"-.035em",
            color:"#fff",textAlign:"center",
            textShadow:"0 2px 40px rgba(80,120,255,.35)",
            marginBottom:0,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.38),
            fontSize:"clamp(48px,8vw,112px)",
            fontWeight:700,lineHeight:.95,letterSpacing:"-.035em",
            textAlign:"center",marginBottom:52,
            // Gold shimmer — warm sweep, consistent with brand gold
            background:"linear-gradient(110deg,#ffe066 0%,#fff 40%,#d4e8ff 82%)",
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
            color:"rgba(255,255,255,.22)",fontWeight:400}}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
