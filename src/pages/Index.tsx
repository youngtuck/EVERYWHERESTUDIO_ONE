import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── WebGL Shader ──────────────────────────────────────────────────────────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const FRAG = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;
uniform vec2  u_rotXY;

#define PI  3.14159265359
#define TAU 6.28318530718

vec3 rotX(vec3 p, float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 rotY(vec3 p, float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
float hash(float n){return fract(sin(n)*43758.5453);}

// Ribbed sphere SDF — gentle, smooth ribs like Telefónica
float orbSDF(vec3 p, float rx, float ry, float t) {
  // Rotate point into sphere's local frame (this is how 3D rotation works)
  vec3 lp = rotX(rotY(p, -ry), -rx);
  float r = length(lp);

  // Polar coordinates on sphere surface
  float cosT = clamp(lp.y / max(r, 0.0001), -1., 1.);
  float theta = acos(cosT);   // 0 = north pole, PI = south pole
  float phi   = atan(lp.z, lp.x);

  // 7 smooth horizontal ribs scrolling slowly downward
  float scroll = t * 0.20;
  float ribPhase = theta * 7.0 - scroll;

  // Pole pinch: ribs naturally narrow at poles (sin^2 envelope)
  float sinT = sin(theta);
  float pole  = sinT * sinT;

  // Rib wave: smooth sine — gentle displacement
  float rib = sin(ribPhase);

  // Very subtle organic wobble per-band (stops looking CG)
  float bandIdx = floor(theta * 7.0 / PI);
  float wobble  = sin(phi * (2.0 + hash(bandIdx)) + t * 0.12 + bandIdx) * 0.008;

  // Slow breathing morph
  float breath = sin(t * 0.25) * 0.006;

  // KEY: keep displacement SMALL — 0.028 max, scaled by pole pinch
  float disp = rib * 0.028 * pole + wobble * pole + breath;

  return r - (0.72 + disp);
}

vec3 calcNormal(vec3 p, float rx, float ry, float t) {
  const float e = 0.001;
  const vec2 k = vec2(1., -1.);
  return normalize(
    k.xyy * orbSDF(p + k.xyy*e, rx, ry, t) +
    k.yyx * orbSDF(p + k.yyx*e, rx, ry, t) +
    k.yxy * orbSDF(p + k.yxy*e, rx, ry, t) +
    k.xxx * orbSDF(p + k.xxx*e, rx, ry, t)
  );
}

vec3 iridescent(float phase) {
  return vec3(
    0.5 + 0.5*cos(TAU*(phase + 0.00)),
    0.5 + 0.5*cos(TAU*(phase + 0.33)),
    0.5 + 0.5*cos(TAU*(phase + 0.67))
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  float ar = u_res.x / u_res.y;
  uv.x *= ar;

  float rx = u_rotXY.x;
  float ry = u_rotXY.y;
  float t  = u_t;

  // Camera
  vec3 ro = vec3(0., 0., 2.2);
  vec3 rd = normalize(vec3(uv, -1.65));

  // Ray march
  float dist = 0.; bool hit = false; vec3 p;
  for (int i = 0; i < 96; i++) {
    p = ro + rd * dist;
    float d = orbSDF(p, rx, ry, t);
    if (d < 0.0004) { hit = true; break; }
    if (dist > 5.) break;
    dist += d * 0.85;
  }
  if (!hit) { gl_FragColor = vec4(0.); return; }

  vec3 N = calcNormal(p, rx, ry, t);
  vec3 V = -rd;

  // Local coords for rib coloring
  vec3  lp    = rotX(rotY(p, -ry), -rx);
  float cosT  = clamp(lp.y / max(length(lp), 0.0001), -1., 1.);
  float theta = acos(cosT);
  float phi   = atan(lp.z, lp.x);

  // Rib shading: which part of the rib are we on?
  float scroll   = t * 0.20;
  float ribPhase = fract(theta * 7.0 / PI - scroll / TAU);
  // 0 = valley, 1 = ridge top
  float ridge  = 0.5 + 0.5 * cos(ribPhase * TAU);
  float ridgeS = ridge * ridge * (3. - 2.*ridge); // smoothstep

  // Under-rib shadow (bottom face of each rib catches no light)
  vec3  localN  = rotX(rotY(N, -ry), -rx);
  float underSh = max(0., -localN.y) * (1. - ridgeS) * 0.6;

  // ── Lighting ──
  vec3 L1 = normalize(vec3(-0.4, 0.7, 0.9));
  vec3 L2 = normalize(vec3( 0.6,-0.3, 0.7));
  vec3 L3 = normalize(vec3( 0.0, 1.0, 0.2));
  float ndl1 = max(dot(N, L1), 0.);
  float ndl2 = max(dot(N, L2), 0.) * 0.28;
  float ndl3 = max(dot(N, L3), 0.) * 0.18;

  vec3  H1   = normalize(L1 + V);
  float spec1 = pow(max(dot(N,H1),0.), 60.) * 1.1;
  float spec2 = pow(max(dot(N,H1),0.), 320.) * 0.8;

  float NoV    = max(dot(N, V), 0.);
  float fresnel = pow(1. - NoV, 3.5);

  // ── Colors: pearl ridge, soft blue valley ──
  vec3 ridgeCol  = mix(vec3(0.91, 0.94, 1.00), vec3(1.,1.,1.), ndl1*0.4);
  vec3 valleyCol = vec3(0.60, 0.69, 0.95);
  vec3 shadowCol = vec3(0.44, 0.53, 0.88);

  vec3 base = mix(valleyCol, ridgeCol, ridgeS);
  base = mix(base, shadowCol, underSh);
  // Slight background-color bleed at edges (glass feel)
  base = mix(base, vec3(0.28, 0.38, 0.88), fresnel * 0.04);

  // ── Iridescent caustics on rib edges ──
  float iriPhase = ribPhase * 3.0 + phi * 0.12 + t * 0.06;
  vec3  iriCol   = iridescent(iriPhase);
  float edgeMask = smoothstep(0.25, 0.5, ribPhase) * smoothstep(0.75, 0.5, ribPhase);
  float cauStr   = edgeMask * 0.18;

  // ── Traveling energy sparks ──
  float energy = 0.;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float sT = fract(fi * 0.25 + t * (0.07 + fi*0.018)) * PI;
    float sP = fi * 1.57 + t * (0.13 + fi*0.06);
    float dT = abs(theta - sT);
    float dP = abs(phi - sP); dP = min(dP, TAU - dP);
    energy += exp(-sqrt(dT*dT + dP*dP*0.25) * 11.) * (0.10 + sin(t*(1.1+fi*0.28))*0.05);
  }

  float breathe = 0.97 + sin(t*0.30)*0.03 + sin(t*0.68)*0.01;

  // ── Assemble ──
  vec3 col = base;
  // Generous ambient so it never goes grey
  col *= (ndl1 * 0.50 + ndl2 + ndl3 + 0.56) * breathe;
  col += iriCol * cauStr * 1.4;
  col += vec3(0.88, 0.94, 1.0) * energy * 1.2;
  col += vec3(1., .99, .97) * spec1;
  col += vec3(.94, .97, 1.) * spec2;
  // Fresnel rim glow
  col += mix(vec3(.70,.80,1.), vec3(.96,.98,1.), fresnel) * fresnel * 0.75;

  // Edge chromatic aberration
  float edgeDist = length(uv / vec2(ar, 1.));
  col.r += smoothstep(.62,.84,edgeDist) * fresnel * 0.06;
  col.b += smoothstep(.62,.84,edgeDist) * fresnel * 0.14;

  // Tonemap
  col = pow(col, vec3(0.86));
  col = col / (col + 0.28) * 1.20;
  col = clamp(col, 0., 1.);

  float alpha = (0.92 + fresnel * 0.08) * (1. - smoothstep(0.73, 0.87, edgeDist));
  gl_FragColor = vec4(col, alpha);
}
`;

// ── Spring physics ──────────────────────────────────────────────────────────
class Spring {
  x=0; y=0; vx=0; vy=0; tx=0; ty=0;
  k=0.072; d=0.82;
  set(tx:number,ty:number){this.tx=tx;this.ty=ty;}
  step(){
    this.vx+=(this.tx-this.x)*this.k; this.vy+=(this.ty-this.y)*this.k;
    this.vx*=this.d; this.vy*=this.d;
    this.x+=this.vx; this.y+=this.vy;
  }
}

// ── WebGL Orb ───────────────────────────────────────────────────────────────
function OrbCanvas({ size }: { size: number }) {
  const ref    = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf    = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", { alpha:true, premultipliedAlpha:false, antialias:true })!;
    if (!gl) return;

    const mkS = (t:number, src:string) => {
      const s = gl.createShader(t)!;
      gl.shaderSource(s,src); gl.compileShader(s);
      const log=gl.getShaderInfoLog(s); if(log?.trim()) console.error(log);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al=gl.getAttribLocation(prog,"a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

    const uT=gl.getUniformLocation(prog,"u_t");
    const uR=gl.getUniformLocation(prog,"u_res");
    const uRot=gl.getUniformLocation(prog,"u_rotXY");

    // Mouse drives rotation: x→ry (spin), y→rx (tilt)
    const onMove=(e:MouseEvent)=>{
      const nx=(e.clientX/window.innerWidth -.5)*2;
      const ny=(e.clientY/window.innerHeight-.5)*2;
      spring.current.set(ny*0.48, nx*0.48);
    };
    window.addEventListener("mousemove",onMove);

    const draw=(ts:number)=>{
      spring.current.step();
      const {x:rx,y:ry}=spring.current;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts*0.001);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uRot, rx, ry);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("mousemove",onMove);};
  },[size]);

  return (
    <canvas ref={ref} style={{
      width:size, height:size, display:"block",
      filter:[
        "drop-shadow(0 0 65px rgba(160,200,255,0.68))",
        "drop-shadow(0 0 140px rgba(100,150,255,0.35))",
        "drop-shadow(0 18px 50px rgba(28,44,180,0.48))",
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
      {oR:.52,spd:.00040,r:.100,c:"rgba(130,155,255",a:.48},
      {oR:.42,spd:-.00028,r:.065,c:"rgba(110,140,250",a:.38},
      {oR:.60,spd:.00022,r:.130,c:"rgba(145,165,255",a:.30},
      {oR:.48,spd:-.00035,r:.048,c:"rgba(120,150,255",a:.26},
      {oR:.68,spd:.00018,r:.085,c:"rgba(100,130,240",a:.20},
      {oR:.38,spd:-.00050,r:.036,c:"rgba(160,175,255",a:.25},
      {oR:.76,spd:.00014,r:.058,c:"rgba(110,145,248",a:.16},
    ];
    const rings=[
      {r:.30,dots:50, dotR:1.4,a:.24},
      {r:.40,dots:68, dotR:1.1,a:.17},
      {r:.50,dots:86, dotR:.85,a:.11},
      {r:.62,dots:108,dotR:.65,a:.07},
    ];
    // Floating particles
    const pts=Array.from({length:55},()=>({
      x:Math.random(),y:Math.random(),
      r:.4+Math.random()*1.3,
      vy:-.00004-Math.random()*.00007,
      a:.05+Math.random()*.20,
      ph:Math.random()*Math.PI*2,
    }));

    const draw=(ts:number)=>{
      const t=ts*.001;
      const W=window.innerWidth,H=window.innerHeight;
      const cx=W*.5,cy=H*.5;
      const base=Math.min(W,H)*.30;
      ctx.clearRect(0,0,W,H);

      // Background: bright indigo center → deep navy edge
      const bg=ctx.createRadialGradient(cx,cy*.9,0,cx,cy,Math.max(W,H)*.85);
      bg.addColorStop(0,  "#4a5fd4");
      bg.addColorStop(.30,"#3a4ec8");
      bg.addColorStop(.60,"#2b3db5");
      bg.addColorStop(.85,"#1c2c9e");
      bg.addColorStop(1,  "#111f88");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Orb halo: soft light emanating from center
      const pulse=.94+Math.sin(t*.32)*.06;
      const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.3*pulse);
      halo.addColorStop(0,  "rgba(130,170,255,0.16)");
      halo.addColorStop(.45,"rgba(90,135,240,0.07)");
      halo.addColorStop(1,  "rgba(60,100,220,0)");
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H);

      // Edge vignette
      const vig=ctx.createRadialGradient(cx,cy,base*.25,cx,cy,Math.max(W,H)*.70);
      vig.addColorStop(0,"rgba(0,0,30,0)");
      vig.addColorStop(1,"rgba(5,8,48,0.45)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      // Orbit rings
      rings.forEach(ring=>{
        const rPx=base*(ring.r/.30),rY=rPx*.27;
        for(let i=0;i<ring.dots;i++){
          const a=(i/ring.dots)*Math.PI*2+t*.065;
          ctx.globalAlpha=ring.a*((Math.sin(a)+1.5)/2.5);
          ctx.fillStyle="#c0ccff";
          ctx.beginPath(); ctx.arc(cx+Math.cos(a)*rPx,cy+Math.sin(a)*rY,ring.dotR,0,Math.PI*2); ctx.fill();
        }
      });

      // Satellite blobs
      blobs.forEach((b,i)=>{
        angles.current[i]+=b.spd;
        const a=angles.current[i];
        const rPx=base*(b.oR/.30),rY=rPx*.27;
        const bx=cx+Math.cos(a)*rPx,by=cy+Math.sin(a)*rY;
        const bR=base*b.r;
        const depth=(Math.sin(a)+1.0)*.5;
        const gr=ctx.createRadialGradient(bx-bR*.2,by-bR*.2,0,bx,by,bR*1.3);
        gr.addColorStop(0,`${b.c},.88)`); gr.addColorStop(.45,`${b.c},.50)`); gr.addColorStop(1,`${b.c},0)`);
        ctx.globalAlpha=b.a*(.44+depth*.56);
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(bx,by,bR,0,Math.PI*2); ctx.fill();
      });

      // Floating particles
      pts.forEach(p=>{
        p.y+=p.vy; if(p.y<-.02){p.y=1.02;p.x=Math.random();}
        ctx.globalAlpha=p.a*(.72+.28*Math.sin(t*1.8+p.ph));
        ctx.fillStyle="#c8d8ff";
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

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate  = useNavigate();
  const [ready,  setReady]   = useState(false);
  const [orbSize,setOrbSize] = useState(500);

  useEffect(()=>{
    const calc=()=>setOrbSize(Math.min(
      window.innerWidth * 0.60,
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

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .cta-pill {
          display:inline-flex; align-items:center; gap:10px;
          background: rgba(255,255,255,.93);
          border: none; color: #2535b4;
          font-family: 'Afacad Flux', sans-serif;
          font-size: 16px; font-weight: 600; letter-spacing: .01em;
          padding: 15px 44px; border-radius: 100px; cursor: pointer;
          box-shadow: 0 6px 30px rgba(15,28,140,.32), 0 2px 8px rgba(255,255,255,.15);
          transition: background .22s, transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
        }
        .cta-pill:hover {
          background: #fff;
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 14px 50px rgba(15,28,140,.42), 0 0 40px rgba(140,180,255,.20);
        }
        .arr { font-size: 18px; display:inline-block; transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .cta-pill:hover .arr { transform: translateX(5px); }
      `}</style>

      <SceneCanvas />

      {/* Orb — centered behind text */}
      <div style={{position:"fixed",inset:0,zIndex:2,pointerEvents:"none",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <OrbCanvas size={orbSize}/>
      </div>

      {/* Text + UI — above orb */}
      <div style={{position:"fixed",inset:0,zIndex:10,pointerEvents:"none",
        display:"flex",flexDirection:"column"}}>

        {/* Logo */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:28,...fi(.08)}}>
          <div style={{display:"flex",alignItems:"baseline"}}>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.95)"}}>EVERY</span>
            <span style={{fontSize:20,fontWeight:800,letterSpacing:"-.01em",color:"rgba(255,255,255,.48)"}}>WHERE</span>
            <span style={{fontSize:10,fontWeight:600,letterSpacing:".18em",
              color:"rgba(255,255,255,.42)",marginLeft:6,alignSelf:"center",textTransform:"uppercase"}}>Studio™</span>
          </div>
        </div>

        {/* Center: headline ON the orb + button below */}
        <div style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center"}}>

          <h1 style={{
            ...fi(.25),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700, lineHeight:.95, letterSpacing:"-.035em",
            color:"#fff", textAlign:"center",
            textShadow:"0 2px 32px rgba(20,40,140,.40)",
            marginBottom:0,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.38),
            fontSize:"clamp(52px,8.5vw,118px)",
            fontWeight:700, lineHeight:.95, letterSpacing:"-.035em",
            textAlign:"center", marginBottom:50,
            // Warm gold sweep — the sheen Tucker liked
            background:"linear-gradient(110deg, #ffe47a 0%, #fff 38%, #c8e0ff 80%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
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
            color:"rgba(255,255,255,.38)",fontWeight:400}}>
            EVERYWHERE STUDIO™ &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
