import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

// ─── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

// ─── WebGL Siri Orb ────────────────────────────────────────────────────────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform vec3  u_c4;
uniform float u_light;

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float lobe(vec3 p, vec3 c, float r){ float d=length(p-c); return exp(-d*d/(r*r)); }

void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.0-1.0;
  uv.x*=u_res.x/u_res.y;
  vec3 ro=vec3(0.,0.,2.4);
  vec3 rd=normalize(vec3(uv,-1.7));
  float R=0.78,b=dot(ro,rd),c2=dot(ro,ro)-R*R;
  float disc=b*b-c2;
  if(disc<0.0){ gl_FragColor=vec4(0.); return; }
  float sqD=sqrt(disc);
  float edge=smoothstep(0.,0.005,sqD);
  float t1=max(-b-sqD,0.0),t2=-b+sqD;
  if(t2<0.0){ gl_FragColor=vec4(0.); return; }
  vec3 N=normalize(ro+rd*t1),V=-rd;
  float NoV=max(dot(N,V),0.0);
  float breath=0.82+0.18*sin(u_t*1.1+.4)*sin(u_t*.7);
  float spd=(0.55+u_energy*1.9)*breath;
  float t=u_t*spd;
  vec3 p1=vec3(sin(t*.41+0.)*0.38,cos(t*.37+1.1)*0.35,sin(t*.29+2.3)*.30);
  vec3 p2=vec3(sin(t*.53+3.5)*0.42,cos(t*.44+.7)*0.38,sin(t*.35+1.8)*.32);
  vec3 p3=vec3(cos(t*.38+2.1)*0.36,sin(t*.61+4.2)*0.30,cos(t*.47+.4)*.34);
  vec3 p4=vec3(cos(t*.28+5.1)*0.40,sin(t*.33+2.8)*0.36,cos(t*.52+3.3)*.28);
  float rx=u_mouse.y*.9,ry=u_mouse.x*.9;
  float span=t2-t1;
  vec3 col=vec3(0.);
  for(int i=0;i<16;i++){
    float fi=float(i)/15.0;
    vec3 p=ro+rd*(t1+span*(fi*.9+.05));
    p.yz=rot2(rx)*p.yz; p.xz=rot2(ry)*p.xz;
    float l1=lobe(p,p1,.37),l2=lobe(p,p2,.41),l3=lobe(p,p3,.34),l4=lobe(p,p4,.39);
    float depth=1.0-fi*.45;
    col+=(u_c1*l1*2.1+u_c2*l2*1.8+u_c3*l3*1.7+u_c4*l4*1.6)*depth;
  }
  col/=16.0; col*=(1.0+u_energy*.8)*breath;
  float fresnel=pow(1.0-NoV,3.2);
  // Light mode: much lighter shell with cool white
  vec3 shellDark=mix(mix(vec3(.55,.72,.95),u_c1,.2),vec3(.9,.94,1.),fresnel);
  vec3 shellLight=mix(mix(vec3(.88,.92,1.),u_c1,.12),vec3(1.,1.,1.),fresnel);
  vec3 shell=mix(shellDark,shellLight,u_light);
  vec3 L1=normalize(vec3(-.5,.9,.6)),H1=normalize(L1+V);
  float s1=pow(max(dot(N,H1),0.0),200.)*2.2;
  vec3 L2=normalize(vec3(.7,.2,.8)),H2=normalize(L2+V);
  float s2=pow(max(dot(N,H2),0.0),70.)*.45;
  float ga=mix(0.18+fresnel*.65, 0.28+fresnel*.55, u_light);
  col=col*(1.-ga*.5)+shell*ga;
  col+=vec3(1.,.98,.95)*(s1+s2);
  float glow_r=exp(-dot(uv,uv)*2.6);
  col+=mix(u_c1,vec3(.5,.75,1.),.35)*glow_r*.38*(1.+u_energy*.5);
  // Light mode: slightly brighter overall
  col=mix(col, col*1.15, u_light);
  col=col/(col+0.85);
  col=pow(max(col,0.),vec3(.88));
  float alpha=edge*(0.80+fresnel*.20);
  gl_FragColor=vec4(col*alpha,alpha);
}`;

type OrbPalette = { c1:[number,number,number]; c2:[number,number,number]; c3:[number,number,number]; c4:[number,number,number]; glow:string; glowLight:string };

const PALETTES: Record<string, OrbPalette> = {
  hero:  { c1:[.98,.68,.08], c2:[1.0,.42,.04], c3:[.88,.58,.00], c4:[1.0,.82,.28], glow:"rgba(200,150,26,0.38)", glowLight:"rgba(180,120,10,0.28)" },
  watch: { c1:[.18,.55,1.0], c2:[.08,.74,.96], c3:[.32,.38,1.0], c4:[.48,.78,1.0], glow:"rgba(74,144,245,0.40)", glowLight:"rgba(50,100,220,0.22)" },
  work:  { c1:[.04,.80,.86], c2:[.10,.58,1.0], c3:[.00,.88,.62], c4:[.28,.72,.94], glow:"rgba(13,140,158,0.40)", glowLight:"rgba(8,110,125,0.22)" },
  wrap:  { c1:[.60,.26,1.0], c2:[.78,.18,.88], c3:[.38,.18,1.0], c4:[.84,.48,1.0], glow:"rgba(160,128,245,0.40)", glowLight:"rgba(120,90,220,0.22)" },
};

class Spring { x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(k=.058,d=.84){ this.vx+=(this.tx-this.x)*k;this.vy+=(this.ty-this.y)*k;this.vx*=d;this.vy*=d;this.x+=this.vx;this.y+=this.vy; }
}

function SiriOrb({ size, energy, palette, dark }: { size:number; energy:number; palette:OrbPalette; dark:boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new Spring());
  const raf = useRef(0);
  const eRef = useRef(energy); const pRef = useRef(palette); const lRef = useRef(dark ? 0.0 : 1.0);
  const mouseRef = useRef({x:0,y:0});
  useEffect(()=>{ eRef.current=energy; },[energy]);
  useEffect(()=>{ pRef.current=palette; },[palette]);
  useEffect(()=>{ lRef.current=dark?0.0:1.0; },[dark]);
  useEffect(()=>{
    const canvas=canvasRef.current!; const dpr=window.devicePixelRatio||1;
    canvas.width=size*dpr; canvas.height=size*dpr;
    const gl=canvas.getContext("webgl",{alpha:true,premultipliedAlpha:false}); if(!gl)return;
    const mkS=(type:number,src:string)=>{ const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);return s; };
    const prog=gl.createProgram()!;
    gl.attachShader(prog,mkS(gl.VERTEX_SHADER,VERT));gl.attachShader(prog,mkS(gl.FRAGMENT_SHADER,ORB_FRAG));
    gl.linkProgram(prog);gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const al=gl.getAttribLocation(prog,"a");gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const uT=gl.getUniformLocation(prog,"u_t"),uR=gl.getUniformLocation(prog,"u_res"),
      uM=gl.getUniformLocation(prog,"u_mouse"),uE=gl.getUniformLocation(prog,"u_energy"),
      uC1=gl.getUniformLocation(prog,"u_c1"),uC2=gl.getUniformLocation(prog,"u_c2"),
      uC3=gl.getUniformLocation(prog,"u_c3"),uC4=gl.getUniformLocation(prog,"u_c4"),
      uL=gl.getUniformLocation(prog,"u_light");
    const onMove=(e:MouseEvent)=>{ const r=canvas.getBoundingClientRect(); mouseRef.current={x:((e.clientX-r.left)/size)*2-1,y:-((e.clientY-r.top)/size)*2+1}; };
    window.addEventListener("mousemove",onMove);
    const start=performance.now();
    const loop=()=>{
      spring.current.tx=mouseRef.current.x*.32; spring.current.ty=mouseRef.current.y*.32; spring.current.step();
      gl.viewport(0,0,canvas.width,canvas.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,(performance.now()-start)*.001); gl.uniform1f(uE,eRef.current); gl.uniform1f(uL,lRef.current);
      gl.uniform2f(uR,canvas.width,canvas.height); gl.uniform2f(uM,spring.current.x,spring.current.y);
      const p=pRef.current; gl.uniform3f(uC1,...p.c1);gl.uniform3f(uC2,...p.c2);gl.uniform3f(uC3,...p.c3);gl.uniform3f(uC4,...p.c4);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4); raf.current=requestAnimationFrame(loop);
    };
    raf.current=requestAnimationFrame(loop);
    return()=>{ cancelAnimationFrame(raf.current); window.removeEventListener("mousemove",onMove); };
  },[size]);
  return <canvas ref={canvasRef} style={{width:size,height:size,display:"block"}} />;
}
// ─── UI Primitives ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay=0 }: { children:React.ReactNode; delay?:number }) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.1}); ob.observe(el);return()=>ob.disconnect(); },[]);
  return <div ref={ref} style={{opacity:vis?1:0,transform:vis?"none":"translateY(14px)",transition:`opacity .6s ${delay}s cubic-bezier(.16,1,.3,1), transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`}}>{children}</div>;
}

function WordReveal({ text, size, weight=700, color, lh=1.1, delay=0, center=false }:{text:string;size:string|number;weight?:number;color:string;lh?:number;delay?:number;center?:boolean}) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.06}); ob.observe(el);return()=>ob.disconnect(); },[]);
  return <div ref={ref} style={{textAlign:center?"center":"left"}}>
    {text.split(" ").map((w,i)=>(
      <span key={i} style={{display:"inline-block",marginRight:"0.24em",opacity:vis?1:0,transform:vis?"none":"translateY(10px)",transition:`opacity .48s ${delay+i*.025}s ease, transform .48s ${delay+i*.025}s cubic-bezier(.16,1,.3,1)`,fontSize:size,fontWeight:weight,color,lineHeight:lh}}>{w}</span>
    ))}
  </div>;
}

function Counter({ target, suffix="", label, accent }:{target:number;suffix?:string;label:string;accent:string}) {
  const ref=useRef<HTMLDivElement>(null); const [val,setVal]=useState(0); const [vis,setVis]=useState(false);
  const { dark } = useTheme();
  const lc = dark ? "#E8E8E6" : "#1a1a1a";
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.3}); ob.observe(el);return()=>ob.disconnect(); },[]);
  useEffect(()=>{ if(!vis)return; let start:number|null=null; const dur=1500;
    const step=(ts:number)=>{ if(!start)start=ts; const p=Math.min((ts-start)/dur,1),e=1-Math.pow(1-p,3); setVal(Math.round(e*target)); if(p<1)requestAnimationFrame(step); };
    requestAnimationFrame(step); },[vis,target]);
  return <div ref={ref} style={{textAlign:"center"}}>
    <div style={{fontSize:"clamp(44px,5vw,72px)",fontWeight:800,letterSpacing:"-.05em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
      <span style={{color:accent}}>{val}</span><span style={{color:lc,opacity:.5}}>{suffix}</span>
    </div>
    <div style={{fontSize:9,letterSpacing:".16em",color:lc,opacity:.28,textTransform:"uppercase",marginTop:10,fontWeight:600}}>{label}</div>
  </div>;
}

function FeatureLine({num,title,desc,accent,delay=0,lc,bc}:{num:string;title:string;desc:string;accent:string;delay?:number;lc:string;bc:string}) {
  return <FadeUp delay={delay}>
    <div style={{display:"grid",gridTemplateColumns:"26px 1fr",gap:"0 16px",paddingBottom:13,paddingTop:2,borderBottom:`1px solid ${bc}`}}>
      <span style={{fontSize:10,fontWeight:700,color:accent,opacity:.5,letterSpacing:".06em",paddingTop:1}}>{num}</span>
      <div><span style={{fontSize:13,fontWeight:600,color:lc}}>{title}</span><span style={{fontSize:12,color:lc,opacity:.36,lineHeight:1.6,marginLeft:7}}>{desc}</span></div>
    </div>
  </FadeUp>;
}

function GateRow({num,name,desc,color,delay,lc,bc}:{num:string;name:string;desc:string;color:string;delay:number;lc:string;bc:string}) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.1}); ob.observe(el);return()=>ob.disconnect(); },[]);
  return <div ref={ref} style={{display:"grid",gridTemplateColumns:"36px 150px 1fr",gap:"0 18px",padding:"15px 0",borderBottom:`1px solid ${bc}`,opacity:vis?1:0,transform:vis?"none":"translateX(-10px)",transition:`opacity .45s ${delay}s ease, transform .45s ${delay}s cubic-bezier(.16,1,.3,1)`}}>
    <span style={{fontSize:10,fontWeight:700,color,opacity:.5,letterSpacing:".08em"}}>{num}</span>
    <span style={{fontSize:13,fontWeight:700,color:lc}}>{name}</span>
    <span style={{fontSize:12,color:lc,opacity:.36,lineHeight:1.65}}>{desc}</span>
  </div>;
}

function DnaBar({label,score,delay=0,accent,lc}:{label:string;score:number;delay?:number;accent:string;lc:string}) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.2}); ob.observe(el);return()=>ob.disconnect(); },[]);
  return <div ref={ref} style={{display:"flex",alignItems:"center",gap:12,opacity:vis?1:0,transform:vis?"none":"translateX(-8px)",transition:`opacity .6s ${delay}s ease, transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`}}>
    <div style={{fontSize:11,color:lc,opacity:.28,width:155,flexShrink:0}}>{label}</div>
    <div style={{flex:1,height:1,background:`${lc}14`,position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",background:`linear-gradient(90deg,${accent},${accent}55)`,width:vis?`${score}%`:"0%",transition:`width 1.2s ${delay+.1}s cubic-bezier(.16,1,.3,1)`}} />
    </div>
    <div style={{fontSize:10,fontWeight:700,color:lc,opacity:.45,width:22,textAlign:"right"}}>{score}</div>
  </div>;
}

function Ticker({ lc }:{lc:string}) {
  const fs=["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"];
  const d=[...fs,...fs];
  return <div style={{overflow:"hidden",maskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)",WebkitMaskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)"}}>
    <style>{`@keyframes ew-t{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ew-t{display:flex;width:max-content;animation:ew-t 30s linear infinite}.ew-t:hover{animation-play-state:paused}`}</style>
    <div className="ew-t">
      {d.map((f,i)=><span key={i} style={{display:"inline-flex",alignItems:"center",fontSize:11,fontWeight:500,color:lc,opacity:.20,padding:"4px 18px",whiteSpace:"nowrap",letterSpacing:".03em"}}>{f}<span style={{display:"inline-block",width:1,height:8,background:`${lc}20`,margin:"0 0 0 18px"}}/></span>)}
    </div>
  </div>;
}

function Wordmark({ lc }:{lc:string}) {
  const ws=["Studio","Intelligence","System"]; const [idx,setIdx]=useState(0); const [fading,setFading]=useState(false);
  useEffect(()=>{ const t=setInterval(()=>{ setFading(true);setTimeout(()=>{setIdx(i=>(i+1)%3);setFading(false);},380); },2800); return()=>clearInterval(t); },[]);
  return <span style={{opacity:fading?0:.32,transform:fading?"translateY(-3px)":"none",transition:"opacity .38s, transform .38s",color:lc,fontWeight:300}}>{ws[idx]}</span>;
}

function ThemeToggle({ lc }:{lc:string}) {
  const { dark, toggle } = useTheme();
  return <button onClick={toggle} title={dark?"Switch to light mode":"Switch to dark mode"} style={{background:"none",border:`1px solid ${lc}20`,borderRadius:100,cursor:"pointer",padding:"5px 12px",display:"flex",alignItems:"center",gap:7,fontSize:11,fontWeight:500,color:lc,opacity:.60,transition:"all .2s",fontFamily:"'Afacad Flux',sans-serif"}}
    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.opacity="1"; (e.currentTarget as HTMLElement).style.borderColor=`${lc}40`; }}
    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.opacity=".60"; (e.currentTarget as HTMLElement).style.borderColor=`${lc}20`; }}>
    {dark
      ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke={lc} strokeWidth="2"/><path stroke={lc} strokeWidth="2" strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>Light</>
      : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path stroke={lc} strokeWidth="2" strokeLinecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Dark</>}
  </button>;
}
// ─── Room Orb panels — full-height sticky with SiriOrb centered ────────────────
function RoomPanel({ name, subtitle, palette, accent, bg, energy, dark, children }: {
  name:string; subtitle:string; palette:OrbPalette; accent:string; bg:string; energy:number; dark:boolean; children:React.ReactNode;
}) {
  const glow = dark ? palette.glow : palette.glowLight;
  const lc = dark ? "#E8E8E6" : "#1a1a1a";
  const num = name === "WATCH" ? "Room One" : name === "WORK" ? "Room Two" : "Room Three";
  return (
    <div style={{position:"sticky",top:0,height:"100vh",width:"48%",flexShrink:0,overflow:"hidden",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
      {children}
      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
        <div style={{fontSize:9,letterSpacing:".22em",color:accent,textTransform:"uppercase",marginBottom:14,fontWeight:700,opacity:.65}}>{num}</div>
        <div style={{filter:`drop-shadow(0 0 56px ${glow})`,marginBottom:16}}>
          <SiriOrb size={200} energy={energy} palette={palette} dark={dark} />
        </div>
        <div style={{fontSize:"clamp(52px,6.5vw,84px)",fontWeight:800,letterSpacing:"-.05em",lineHeight:.88,color:lc,textAlign:"center"}}>{name}</div>
        <div style={{fontSize:9,letterSpacing:".14em",color:lc,opacity:.22,textTransform:"uppercase",marginTop:10,fontWeight:500}}>{subtitle}</div>
        <div style={{width:28,height:1,background:`linear-gradient(90deg,transparent,${accent},transparent)`,marginTop:18}} />
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [orbSection, setOrbSection] = useState<"hero"|"watch"|"work"|"wrap">("hero");
  const [orbEnergy, setOrbEnergy] = useState(0.10);
  const [scrollY, setScrollY] = useState(0);

  const watchRef = useRef<HTMLDivElement>(null);
  const workRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const toggle = () => setDark(d => !d);
  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),80); return()=>clearTimeout(t); },[]);

  useEffect(()=>{
    const onScroll=()=>{
      const sy=window.scrollY; setScrollY(sy);
      const vh=window.innerHeight;
      const getT=(el:HTMLElement|null)=>el?.getBoundingClientRect().top??null;
      const getB=(el:HTMLElement|null)=>el?.getBoundingClientRect().bottom??null;
      const getH=(el:HTMLElement|null)=>el?.getBoundingClientRect().height??null;
      const wT=getT(wrapRef.current),wB=getB(wrapRef.current),wH=getH(wrapRef.current);
      const kT=getT(workRef.current),kB=getB(workRef.current),kH=getH(workRef.current);
      const aT=getT(watchRef.current),aB=getB(watchRef.current),aH=getH(watchRef.current);
      if(wT!=null&&wT<vh*.7&&wB!=null&&wB>0&&wH!=null){
        const p=Math.max(0,Math.min(1,-wT/(wH-vh)));
        setOrbSection("wrap");setOrbEnergy(Math.min(1,p*1.0+.15));
      } else if(kT!=null&&kT<vh*.7&&kB!=null&&kB>0&&kH!=null){
        const p=Math.max(0,Math.min(1,-kT/(kH-vh)));
        setOrbSection("work");setOrbEnergy(Math.min(1,p*1.0+.15));
      } else if(aT!=null&&aT<vh*.7&&aB!=null&&aB>0&&aH!=null){
        const p=Math.max(0,Math.min(1,-aT/(aH-vh)));
        setOrbSection("watch");setOrbEnergy(Math.min(1,p*1.0+.15));
      } else {
        setOrbSection("hero");setOrbEnergy(.10);
      }
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  // Theme tokens
  const T = {
    bg:        dark ? "#07090f" : "#F4F2ED",
    bgAlt:     dark ? "#09101e" : "#ECE9E2",
    text:      dark ? "#E8E8E6" : "#1C1C1A",
    textSub:   dark ? "rgba(232,232,230,0.44)" : "rgba(28,28,26,0.52)",
    textFaint: dark ? "rgba(232,232,230,0.20)" : "rgba(28,28,26,0.28)",
    gold:      dark ? "#C8961A" : "#996A00",
    line:      dark ? "rgba(255,255,255,0.065)" : "rgba(0,0,0,0.09)",
    navBg:     dark ? "rgba(7,9,15,0.92)" : "rgba(244,242,237,0.92)",
    ctaBg:     dark ? "#E8E8E6" : "#1C1C1A",
    ctaText:   dark ? "#07090f" : "#F4F2ED",
    watchBg:   dark ? "linear-gradient(170deg,#040c1a 0%,#050d1c 100%)" : "linear-gradient(170deg,#E8EEFA 0%,#DDE6F5 100%)",
    workBg:    dark ? "linear-gradient(170deg,#030d0f 0%,#040c0e 100%)" : "linear-gradient(170deg,#DCF0F3 0%,#D1EBF0 100%)",
    wrapBg:    dark ? "linear-gradient(170deg,#080412 0%,#070312 100%)" : "linear-gradient(170deg,#EAE4F8 0%,#E2DAF5 100%)",
    watchA:    "#4A90F5",
    workA:     "#0D8C9E",
    wrapA:     "#A080F5",
  };

  const lc = T.text;
  const bc = T.line;
  const hPal = PALETTES.hero;
  const pal = PALETTES[orbSection];
  const heroGlow = dark ? hPal.glow : hPal.glowLight;

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      <div style={{fontFamily:"'Afacad Flux',sans-serif",background:T.bg,color:T.text,overflowX:"hidden",transition:"background .45s ease, color .3s ease"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          html{scroll-behavior:smooth;}
          ::selection{background:${T.gold}40;}
        `}</style>

        {/* NAV */}
        <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:54,padding:"0 36px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.navBg,backdropFilter:"blur(22px)",borderBottom:`1px solid ${bc}`,transition:"background .45s"}}>
          <button onClick={()=>nav("/")} style={{background:"none",border:"none",display:"flex",alignItems:"baseline",cursor:"pointer",gap:0}}>
            <span style={{fontSize:15,fontWeight:800,color:T.text,letterSpacing:".04em"}}>EVERY</span>
            <Wordmark lc={T.text} />
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <ThemeToggle lc={T.text} />
            <button onClick={()=>nav("/auth")} style={{background:T.ctaBg,border:"none",borderRadius:100,padding:"7px 22px",color:T.ctaText,fontSize:12,fontWeight:600,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"opacity .2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".80"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
              Get Early Access
            </button>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"110px 40px 72px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:dark?"radial-gradient(ellipse 70% 50% at 50% 52%, rgba(58,123,213,0.10) 0%, transparent 68%)":"radial-gradient(ellipse 70% 50% at 50% 52%, rgba(120,160,240,0.07) 0%, transparent 68%)"}} />

          {/* Orb */}
          <div style={{marginBottom:24,opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",transition:"opacity .9s .1s ease, transform .9s .1s cubic-bezier(.16,1,.3,1)",filter:`drop-shadow(0 0 64px ${heroGlow})`}}>
            <SiriOrb size={210} energy={orbEnergy} palette={hPal} dark={dark} />
          </div>

          {/* Eyebrow */}
          <div style={{fontSize:10,letterSpacing:".22em",color:T.textFaint,textTransform:"uppercase",marginBottom:18,fontWeight:500,opacity:mounted?1:0,transition:"opacity .8s .3s ease"}}>
            Composed Intelligence
          </div>

          {/* Headline */}
          <div style={{textAlign:"center",opacity:mounted?1:0,transform:mounted?"none":"translateY(14px)",transition:"opacity .8s .35s ease, transform .8s .35s cubic-bezier(.16,1,.3,1)"}}>
            <div style={{fontSize:"clamp(48px,8vw,106px)",fontWeight:800,letterSpacing:"-.045em",lineHeight:.92,color:T.text,marginBottom:4}}>Your thinking.</div>
            <div style={{fontSize:"clamp(48px,8vw,106px)",fontWeight:800,letterSpacing:"-.045em",lineHeight:.92,color:T.gold,marginBottom:32}}>Composed.</div>
          </div>

          {/* Subhead */}
          <div style={{maxWidth:500,textAlign:"center",marginBottom:38,opacity:mounted?1:0,transition:"opacity .8s .52s ease"}}>
            <p style={{fontSize:"clamp(14px,1.5vw,17px)",lineHeight:1.74,color:T.textSub,fontWeight:400}}>
              You have the ideas, the expertise, and the point of view. What you don't have is the system to turn all of that into content that actually lands.
            </p>
          </div>

          {/* CTAs */}
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",opacity:mounted?1:0,transition:"opacity .8s .68s ease"}}>
            <button onClick={()=>nav("/auth")} style={{background:T.ctaBg,border:"none",borderRadius:100,padding:"12px 38px",fontSize:13,fontWeight:700,color:T.ctaText,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"opacity .2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".82"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
              Get Early Access
            </button>
            <button onClick={()=>document.getElementById("fw")?.scrollIntoView({behavior:"smooth"})} style={{background:"transparent",border:`1px solid ${T.text}18`,borderRadius:100,padding:"12px 38px",fontSize:13,fontWeight:500,color:T.textSub,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=`${T.text}35`; (e.currentTarget as HTMLElement).style.color=T.text; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=`${T.text}18`; (e.currentTarget as HTMLElement).style.color=T.textSub; }}>
              See How It Works
            </button>
          </div>

          {/* Scroll cue */}
          <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:7,opacity:.18}}>
            <svg width="14" height="20" viewBox="0 0 16 22" fill="none"><rect x="1" y="1" width="14" height="20" rx="7" stroke={T.text} strokeWidth="1.2"/><circle cx="8" cy="7" r="2" fill={T.text}/></svg>
          </div>
        </section>

        {/* ══ PROBLEM ═══════════════════════════════════════════════════════════ */}
        <section style={{padding:"72px 48px 64px",borderTop:`1px solid ${bc}`}}>
          <div style={{maxWidth:880,margin:"0 auto"}}>
            <WordReveal text="You already know what to say." size="clamp(32px,4.5vw,54px)" weight={700} lh={1.04} color={T.text} />
            <div style={{marginTop:10,marginBottom:36}}>
              <WordReveal text="The hard part is everything after that." size="clamp(15px,1.7vw,20px)" weight={400} color={T.textSub} lh={1.4} delay={0.08} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 64px",maxWidth:800}}>
              <FadeUp delay={0.04}><p style={{fontSize:14,lineHeight:1.8,color:T.textSub}}>Every thought leader faces the same bottleneck. You have insights worth sharing, but turning them into polished, multi-format content takes a team you don't have and time you can't spare.</p></FadeUp>
              <FadeUp delay={0.10}><p style={{fontSize:14,lineHeight:1.8,color:T.textSub}}>AI tools move fast but flatten your voice into something generic. Ghostwriters get tone right but cost thousands a month and still need you to do half the work.</p></FadeUp>
            </div>
          </div>
        </section>

        {/* ══ FRAMEWORK ════════════════════════════════════════════════════════ */}
        <section id="fw" style={{padding:"64px 48px 56px",borderTop:`1px solid ${bc}`}}>
          <div style={{maxWidth:920,margin:"0 auto"}}>
            <FadeUp>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:9,letterSpacing:".22em",color:T.textFaint,textTransform:"uppercase",marginBottom:18,fontWeight:500}}>The Framework</div>
                <div style={{fontSize:"clamp(36px,5vw,68px)",fontWeight:800,letterSpacing:"-.04em",lineHeight:.94,color:T.text,marginBottom:4}}>One idea in.</div>
                <div style={{fontSize:"clamp(36px,5vw,68px)",fontWeight:800,letterSpacing:"-.04em",lineHeight:.94,color:T.gold,marginBottom:20}}>Communications out.</div>
                <p style={{fontSize:14,color:T.textSub,maxWidth:420,margin:"0 auto",lineHeight:1.72}}>EVERYWHERE Studio bridges what you know and what the world sees.</p>
              </div>
            </FadeUp>
            {/* Counters */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",marginTop:48,borderTop:`1px solid ${bc}`}}>
              <div style={{padding:"36px 28px",borderRight:`1px solid ${bc}`}}><Counter target={40} suffix="+" label="AI Specialists" accent={T.watchA} /></div>
              <div style={{padding:"36px 28px",borderRight:`1px solid ${bc}`}}><Counter target={12} label="Output Formats" accent={T.workA} /></div>
              <div style={{padding:"36px 28px"}}><Counter target={7} label="Quality Gates" accent={T.wrapA} /></div>
            </div>
          </div>
        </section>

        {/* ══ WATCH ════════════════════════════════════════════════════════════ */}
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${T.watchA}44,transparent)`}} />
        <div ref={watchRef} style={{display:"flex",minHeight:"130vh"}}>
          <RoomPanel name="WATCH" subtitle="The Signal Room" palette={PALETTES.watch} accent={T.watchA} bg={T.watchBg} energy={orbSection==="watch"?orbEnergy:.10} dark={dark}>
            {/* subtle radial ambient */}
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 60% at 50% 50%, ${T.watchA}12 0%, transparent 70%)`,pointerEvents:"none"}} />
          </RoomPanel>
          <div style={{flex:1,padding:"64px 52px 64px 56px",display:"flex",flexDirection:"column",gap:32,justifyContent:"center",borderLeft:`1px solid ${T.watchA}12`}}>
            <WordReveal text="Before you write a single word, the system scans your category for what's moving." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={T.text} />
            <FadeUp delay={0.08}><p style={{fontSize:13,lineHeight:1.82,color:T.textSub}}>You get structured intelligence, not a reading list. Every briefing is built for action, not review.</p></FadeUp>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              <FeatureLine num="01" title="What's Moving" desc="Developments shaping your category right now" accent={T.watchA} delay={0} lc={lc} bc={bc} />
              <FeatureLine num="02" title="Threats" desc="Items requiring defensive positioning or response" accent={T.watchA} delay={.06} lc={lc} bc={bc} />
              <FeatureLine num="03" title="Opportunities" desc="Scored by effort-to-impact ratio, highest leverage first" accent={T.watchA} delay={.12} lc={lc} bc={bc} />
              <FeatureLine num="04" title="Content Triggers" desc="Angles ready to hand directly to the production engine" accent={T.watchA} delay={.18} lc={lc} bc={bc} />
              <FeatureLine num="05" title="Event Radar" desc="Upcoming events filtered by proximity and relevance" accent={T.watchA} delay={.24} lc={lc} bc={bc} />
            </div>
            <FadeUp delay={0.12}>
              <div style={{borderLeft:`2px solid ${T.watchA}45`,paddingLeft:18}}>
                <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:5,letterSpacing:".02em"}}>Source Verification</div>
                <p style={{fontSize:12,color:T.textSub,lineHeight:1.74}}>Every claim requires two or more independent, credible sources. Unverified intelligence never ships. This is a protocol, not a preference.</p>
              </div>
            </FadeUp>
          </div>
        </div>

        {/* ══ WORK ═════════════════════════════════════════════════════════════ */}
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${T.workA}44,transparent)`}} />
        <div ref={workRef} style={{display:"flex",minHeight:"145vh"}}>
          <RoomPanel name="WORK" subtitle="The Engine Room" palette={PALETTES.work} accent={T.workA} bg={T.workBg} energy={orbSection==="work"?orbEnergy:.10} dark={dark}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 60% at 50% 50%, ${T.workA}10 0%, transparent 70%)`,pointerEvents:"none"}} />
          </RoomPanel>
          <div style={{flex:1,padding:"64px 52px 64px 56px",display:"flex",flexDirection:"column",gap:32,justifyContent:"center",borderLeft:`1px solid ${T.workA}12`}}>
            <WordReveal text="A coordinated team of forty specialists transforms your raw thinking into publication-grade content." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={T.text} />
            <FadeUp delay={0.08}><p style={{fontSize:13,lineHeight:1.82,color:T.textSub}}>Not a single prompt. A system of roles working in sequence. Voice DNA ensures every word sounds like you.</p></FadeUp>
            <FadeUp delay={0.12}>
              <div>
                <div style={{fontSize:9,letterSpacing:".18em",color:T.textFaint,textTransform:"uppercase",marginBottom:10,fontWeight:500}}>Output formats</div>
                <Ticker lc={lc} />
              </div>
            </FadeUp>
            <FadeUp delay={0.18}>
              <div style={{borderTop:`1px solid ${bc}`,paddingTop:28}}>
                <div style={{fontSize:9,letterSpacing:".2em",color:T.workA,textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Voice DNA</div>
                <div style={{marginBottom:20}}><WordReveal text="Every output sounds exactly like you." size={18} weight={700} color={T.text} lh={1.2} /></div>
                <div style={{display:"flex",flexDirection:"column",gap:13}}>
                  {[["Vocabulary and Syntax",88],["Tonal Register",94],["Rhythm and Cadence",91],["Metaphor Patterns",87],["Structural Habits",96]].map(([l,s],i)=>(
                    <DnaBar key={i} label={l as string} score={s as number} delay={i*.06} accent={T.workA} lc={lc} />
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>

        {/* ══ WRAP ═════════════════════════════════════════════════════════════ */}
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${T.wrapA}44,transparent)`}} />
        <div ref={wrapRef} style={{display:"flex",minHeight:"120vh"}}>
          <RoomPanel name="WRAP" subtitle="The Distribution Room" palette={PALETTES.wrap} accent={T.wrapA} bg={T.wrapBg} energy={orbSection==="wrap"?orbEnergy:.10} dark={dark}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 60% at 50% 50%, ${T.wrapA}10 0%, transparent 70%)`,pointerEvents:"none"}} />
          </RoomPanel>
          <div style={{flex:1,padding:"64px 52px 64px 56px",display:"flex",flexDirection:"column",gap:32,justifyContent:"center",borderLeft:`1px solid ${T.wrapA}12`}}>
            <WordReveal text="One idea becomes a complete publishing event." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={T.text} />
            <FadeUp delay={0.08}><p style={{fontSize:13,lineHeight:1.82,color:T.textSub}}>Articles, social posts, email sequences, video scripts. Formatted for every channel. Ready to ship. Nothing left for you to finish.</p></FadeUp>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              <FeatureLine num="01" title="Content Calendar" desc="Visual scheduling across all channels from a single canvas." accent={T.wrapA} delay={0} lc={lc} bc={bc} />
              <FeatureLine num="02" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." accent={T.wrapA} delay={.06} lc={lc} bc={bc} />
              <FeatureLine num="03" title="Performance Loop" desc="Engagement data flows back to sharpen your next strategy." accent={T.wrapA} delay={.12} lc={lc} bc={bc} />
              <FeatureLine num="04" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." accent={T.wrapA} delay={.18} lc={lc} bc={bc} />
            </div>
          </div>
        </div>

        {/* ══ QUALITY GATES ════════════════════════════════════════════════════ */}
        <section style={{padding:"80px 48px 88px",background:dark?"linear-gradient(180deg,#080311 0%,#07090f 100%)":"linear-gradient(180deg,#E9E4F5 0%,#F4F2ED 100%)",borderTop:`1px solid ${bc}`}}>
          <div style={{maxWidth:800,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"36px 60px",alignItems:"end",marginBottom:44}}>
              <div>
                <FadeUp><div style={{fontSize:9,letterSpacing:".2em",color:T.wrapA,textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Quality Gates</div></FadeUp>
                <WordReveal text="Nothing ships without passing the gates." size="clamp(24px,3.2vw,40px)" weight={700} lh={1.08} color={T.text} />
              </div>
              <FadeUp delay={0.1}><p style={{fontSize:13,lineHeight:1.75,color:T.textSub}}>7 checks before anything reaches your audience. No AI tells. No off-brand moments. No weak writing.</p></FadeUp>
            </div>
            <div style={{borderTop:`1px solid ${bc}`}}>
              {[["01","Strategy","Does this serve your goals?","#3A7BD5"],["02","Voice","Does this sound like you?","#0D8C9E"],["03","Accuracy","Are the facts verified?","#C8961A"],["04","AI Tells","Could anyone spot the AI?","#e8506a"],["05","Audience","Will this resonate?","#A080F5"],["06","Platform","Is this native to the channel?","#4ab8f5"],["07","Impact","Will this move people to action?","#10b981"]].map(([num,name,desc,color],i)=>(
                <GateRow key={i} num={num} name={name} desc={desc} color={color} delay={0.03+i*.05} lc={lc} bc={bc} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ COMPOUND ═════════════════════════════════════════════════════════ */}
        <section style={{padding:"80px 48px 72px",borderTop:`1px solid ${bc}`}}>
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <FadeUp><div style={{fontSize:9,letterSpacing:".2em",color:T.textFaint,textTransform:"uppercase",marginBottom:16,fontWeight:500}}>Compound Advantage</div></FadeUp>
            <WordReveal text="Why It Compounds" size="clamp(34px,4.5vw,58px)" weight={700} lh={1.0} color={T.text} />
            <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
              <FadeUp delay={0.06}><p style={{fontSize:15,lineHeight:1.78,color:T.textSub}}>Most tools make content faster. EVERYWHERE Studio makes it better — and the difference grows with every piece you publish.</p></FadeUp>
              <FadeUp delay={0.12}><p style={{fontSize:15,lineHeight:1.78,color:T.textSub}}>Your Voice DNA sharpens. Quality gates calibrate. The intelligence layer learns the contours of your category with increasing precision.</p></FadeUp>
            </div>
            <FadeUp delay={0.24}>
              <div style={{marginTop:44,padding:"28px 0",borderTop:`1px solid ${bc}`,borderBottom:`1px solid ${bc}`,textAlign:"center"}}>
                <div style={{fontSize:"clamp(15px,1.8vw,22px)",fontWeight:600,lineHeight:1.45,color:T.gold,fontStyle:"italic"}}>
                  "Competitors can copy the output format. They cannot copy the system underneath it."
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
        <section style={{padding:"100px 48px 88px",textAlign:"center",borderTop:`1px solid ${bc}`,background:dark?"linear-gradient(180deg,#07090f 0%,#08102a 100%)":"linear-gradient(180deg,#F4F2ED 0%,#E8ECF8 100%)"}}>
          <div style={{maxWidth:540,margin:"0 auto"}}>
            <FadeUp><div style={{fontSize:9,letterSpacing:".2em",color:T.textFaint,textTransform:"uppercase",marginBottom:24,fontWeight:500}}>Let's Talk</div></FadeUp>
            <WordReveal text="Your ideas deserve a system built to carry them." size="clamp(28px,4vw,52px)" weight={700} lh={1.02} color={T.text} center />
            <FadeUp delay={0.18}><p style={{fontSize:15,lineHeight:1.68,color:T.textSub,marginTop:18,marginBottom:44}}>If you're ready to stop carrying the mountain alone, let's have a conversation.</p></FadeUp>
            <FadeUp delay={0.26}>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>nav("/auth")} style={{background:T.ctaBg,border:"none",borderRadius:100,padding:"14px 46px",fontSize:13,fontWeight:700,color:T.ctaText,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"opacity .2s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".82"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>Let's Talk</button>
                <button onClick={()=>nav("/studio/dashboard")} style={{background:"transparent",border:`1px solid ${T.text}18`,borderRadius:100,padding:"14px 46px",fontSize:13,fontWeight:500,color:T.textSub,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=`${T.text}35`; (e.currentTarget as HTMLElement).style.color=T.text; }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=`${T.text}18`; (e.currentTarget as HTMLElement).style.color=T.textSub; }}>Open Studio</button>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{padding:"20px 36px",borderTop:`1px solid ${bc}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"baseline",gap:0}}>
            <span style={{fontSize:12,fontWeight:800,color:T.text,opacity:.45}}>EVERY</span>
            <span style={{fontSize:12,fontWeight:800,color:T.text,opacity:.16}}>WHERE</span>
            <span style={{fontSize:8,fontWeight:600,letterSpacing:".16em",color:T.textFaint,marginLeft:5,textTransform:"uppercase"}}>Studio</span>
          </div>
          <span style={{fontSize:10,color:T.textFaint,letterSpacing:".04em"}}>2026 Mixed Grill LLC · Composed Intelligence</span>
        </footer>
      </div>
    </ThemeCtx.Provider>
  );
}
