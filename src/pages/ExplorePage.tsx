import { useEffect, useRef, useState, createContext, useContext, Children } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";

// ─── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

// ─── WebGL Siri Orb - glass sphere + interior energy field (Apple-level) ───────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform vec2  u_idle;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform vec3  u_c4;
uniform float u_light;

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.0-1.0;
  uv.x*=u_res.x/u_res.y;
  vec3 ro=vec3(0.,0.,2.4);
  vec3 rd=normalize(vec3(uv,-1.7));
  float R=0.78,b=dot(ro,rd),c2=dot(ro,ro)-R*R;
  float disc=b*b-c2;
  if(disc<0.0){ gl_FragColor=vec4(0.); return; }
  float sqD=sqrt(disc);
  float t1=max(-b-sqD,0.0),t2=-b+sqD;
  if(t2<0.0){ gl_FragColor=vec4(0.); return; }
  vec3 pF=ro+rd*t1;
  vec3 N=normalize(pF);
  vec3 V=-rd;
  float NoV=max(dot(N,V),0.0);

  float rx=u_mouse.y*.9+u_idle.x;
  float ry=u_mouse.x*.9+u_idle.y;
  vec3 Nrot=N;
  Nrot.yz=rot2(rx)*N.yz;
  Nrot.xz=rot2(ry)*Nrot.xz;
  float phi=atan(Nrot.z,Nrot.x);
  float theta=acos(clamp(Nrot.y,-1.0,1.0));

  float breath = 0.86 + 0.10*sin(u_t*1.1)*sin(u_t*0.73) + 0.04*sin(u_t*2.3 + 0.8);
  float spd=1.0+u_energy*2.2;
  float orbRot = u_t * 0.055;
  float crr = cos(orbRot), srr = sin(orbRot);
  float t=u_t*spd*breath;

  float span=t2-t1;
  vec3 energyAcc=vec3(0.);
  float denAcc=0.0;
  const int steps=12;
  for(int i=0;i<steps;i++){
    float fi=float(i)/float(steps-1);
    float ti=t1+span*(fi*0.88+0.06);
    vec3 p=ro+rd*ti;
    p.xz = vec2(crr*p.x - srr*p.z, srr*p.x + crr*p.z);
    p.yz=rot2(rx)*p.yz;
    p.xz=rot2(ry)*p.xz;
    float r=length(p)/R;
    float phiP=atan(p.z,p.x);
    float thetaP=acos(clamp(p.y/(length(p)+1e-4),-1.0,1.0));

    float core=exp(-r*r*3.2)*(0.7+0.3*sin(t*0.9+1.2));
    float flowA=sin(phiP*2.5+t*1.1)*cos(thetaP*2.0-t*0.7)*0.5+0.5;
    float flowB=cos(phiP*3.5-t*0.9)*sin(thetaP*3.0+t*1.0)*0.5+0.5;
    float band=sin(phiP*5.0+thetaP*4.0+t*0.8)*0.5+0.5;
    float thread1 = sin(phiP*8.0 + thetaP*5.0 + u_t*1.8)*0.5 + 0.5;
    float thread2 = cos(phiP*6.0 - thetaP*7.0 - u_t*1.3)*0.5 + 0.5;
    float threads = thread1 * thread2 * smoothstep(0.3, 0.7, r) * smoothstep(1.0, 0.55, r);
    float layer2=(0.4+0.4*flowA)*(0.5+0.4*flowB)*smoothstep(0.2,0.85,r);
    float layer3=(0.35+0.35*band)*smoothstep(0.0,0.6,r)*smoothstep(1.0,0.5,r);

    vec3 coreCol=u_c1*1.2;
    vec3 midCol=mix(u_c2,u_c3,flowA);
    vec3 outerCol=mix(u_c4,u_c1,band*0.5+0.5);

    vec3 layerCol=coreCol*core+midCol*layer2*0.85+outerCol*layer3*0.6;
    float deepPulse = sin(r*4.0 - u_t*0.35 + phiP*1.5)*0.5 + 0.5;
    float deepGlow = exp(-r*r*1.8)*deepPulse*(0.5 + 0.3*sin(u_t*0.22));
    layerCol += u_c2 * deepGlow * 0.7;
    layerCol += mix(u_c3, u_c4, thread1) * threads * 0.45;
    float density=(core*1.2+layer2+layer3*0.7)*(1.0-fi*0.35)*(1.0+u_energy*0.4)*0.065;
    energyAcc+=layerCol*density;
    denAcc+=density;
  }
  energyAcc/=max(denAcc,0.001);
  energyAcc*=breath;
  energyAcc=pow(max(energyAcc,0.0),vec3(0.95));

  float wave1=sin(phi*3.0+t*1.4)*cos(theta*2.0-t*0.9);
  float wave2=sin(phi*5.0-t*1.1)*sin(theta*3.0+t*0.7);
  float wave3=cos(phi*2.0+t*0.8)*cos(theta*4.0-t*1.2);
  float wave=(wave1*0.5+wave2*0.35+wave3*0.25)*0.5+0.5;
  float flow=sin(phi*4.0+t*1.6)*0.5+0.5;
  float band=sin(theta*6.0+phi*2.0+t*1.0)*0.5+0.5;

  vec3 waveTint=mix(u_c1,u_c2,flow)*0.6+mix(u_c3,u_c4,band)*0.4;
  vec3 surfaceGlow=waveTint*(0.12+wave*0.18)*(1.0+u_energy*0.5)*breath;

  float fresnel=pow(1.0-NoV,2.6);
  float rim=pow(1.0-NoV,4.2);
  vec3 shellDark=mix(vec3(0.38,0.52,0.82),u_c1,0.35);
  vec3 shellLight=mix(vec3(0.85,0.90,0.98),u_c1,0.15);
  vec3 shell=mix(shellDark,shellLight,u_light);
  vec3 glassRim = shell*fresnel*1.65 + u_c1*rim*1.2 + u_c2*pow(1.0-NoV,6.0)*0.5;

  vec3 L1=normalize(vec3(-.5,.9,.6)),H1=normalize(L1+V);
  float s1=pow(max(dot(N,H1),0.0),240.)*1.6;
  vec3 L2=normalize(vec3(.6,.3,.85)),H2=normalize(L2+V);
  float s2=pow(max(dot(N,H2),0.0),90.)*0.45;
  vec3 spec=vec3(1.,0.98,0.96)*(s1+s2);

  float interiorMix=0.72*(1.0-fresnel*0.5)+0.15*NoV;
  vec3 col=energyAcc*interiorMix+surfaceGlow+glassRim+spec;
  float centerGlow=exp(-dot(uv,uv)*2.0)*breath*(0.45+u_energy*0.35);
  col += mix(u_c1, u_c2, 0.5) * centerGlow * 1.6;
  col += u_c1 * exp(-dot(uv,uv)*5.5) * breath * 0.35;

  col=mix(col,col*1.08,u_light);
  col=col/(col+0.88);
  col=pow(max(col,0.0),vec3(0.94));

  float edgeSoft=smoothstep(0.0,0.014,sqD);
  float alpha=(0.48+fresnel*0.35+rim*0.18+min(denAcc*4.0,0.12))*(1.0+u_energy*0.12);
  alpha=clamp(alpha*edgeSoft,0.0,0.94);
  gl_FragColor=vec4(col,alpha);
}`;

type OrbPalette = { c1:[number,number,number]; c2:[number,number,number]; c3:[number,number,number]; c4:[number,number,number]; glow:string; glowLight:string };

const PALETTES: Record<string, OrbPalette> = {
  hero:  { c1:[.98,.68,.08], c2:[1.0,.42,.04], c3:[.88,.58,.00], c4:[1.0,.82,.28], glow:"rgba(200,150,26,0.38)", glowLight:"rgba(180,120,10,0.28)" },
  watch: { c1:[74/255,144/255,245/255], c2:[.12,.58,.98], c3:[.35,.45,1.0], c4:[.50,.72,1.0], glow:"rgba(74,144,245,0.40)", glowLight:"rgba(50,100,220,0.22)" },
  work:  { c1:[13/255,140/255,158/255], c2:[.08,.62,.92], c3:[.00,.78,.70], c4:[.22,.72,.96], glow:"rgba(13,140,158,0.40)", glowLight:"rgba(8,110,125,0.22)" },
  wrap:  { c1:[160/255,128/255,245/255], c2:[.72,.22,.92], c3:[.42,.22,1.0], c4:[.82,.52,1.0], glow:"rgba(160,128,245,0.40)", glowLight:"rgba(120,90,220,0.22)" },
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
      uIdle=gl.getUniformLocation(prog,"u_idle"),
      uC1=gl.getUniformLocation(prog,"u_c1"),uC2=gl.getUniformLocation(prog,"u_c2"),
      uC3=gl.getUniformLocation(prog,"u_c3"),uC4=gl.getUniformLocation(prog,"u_c4"),
      uL=gl.getUniformLocation(prog,"u_light");
    const onMove=(e:MouseEvent)=>{ const r=canvas.getBoundingClientRect(); mouseRef.current={x:((e.clientX-r.left)/size)*2-1,y:-((e.clientY-r.top)/size)*2+1}; };
    window.addEventListener("mousemove",onMove);
    const start=performance.now();
    const loop=()=>{
      spring.current.tx=mouseRef.current.x*.32; spring.current.ty=mouseRef.current.y*.32; spring.current.step();
      const t=(performance.now()-start)*.001;
      const idleX=Math.sin(t*0.42)*0.16;
      const idleY=Math.cos(t*0.38)*0.16;
      gl.viewport(0,0,canvas.width,canvas.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,t); gl.uniform1f(uE,eRef.current); gl.uniform1f(uL,lRef.current);
      gl.uniform2f(uR,canvas.width,canvas.height); gl.uniform2f(uM,spring.current.x,spring.current.y);
      gl.uniform2f(uIdle!,idleX,idleY);
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
  return <div ref={ref} style={{textAlign:center?"center":"left",overflowWrap:"break-word",wordBreak:"break-word"}}>
    {text.split(" ").map((w,i)=>(
      <span key={i} style={{display:"inline-block",marginRight:"0.24em",opacity:vis?1:0,transform:vis?"none":"translateY(10px)",transition:`opacity .48s ${delay+i*.05}s ease, transform .48s ${delay+i*.05}s cubic-bezier(.16,1,.3,1)`,fontSize:size,fontWeight:weight,color,lineHeight:lh}}>{w}</span>
    ))}
  </div>;
}

// Simple centered divider between major sections
const SectionDivider = () => (
  <div style={{
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 48px",
  }}>
    <div style={{
      height: 1,
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
    }} />
  </div>
);

function FadeInSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = Children.toArray(children);

  return (
    <div ref={ref} style={style}>
      {items.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition:
              "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: visible ? `${index * 0.1}s` : "0s",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
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

function GateRow({num,name,desc,color,delay,lc,bc,last=false}:{num:string;name:string;desc:string;color:string;delay:number;lc:string;bc:string;last?:boolean}) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{ const el=ref.current;if(!el)return; const ob=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:.1}); ob.observe(el);return()=>ob.disconnect(); },[]);
  return <div ref={ref} style={{display:"grid",gridTemplateColumns:"36px 150px 1fr",gap:"0 18px",padding:"20px 0",borderBottom:last?"none":"1px solid rgba(255,255,255,0.04)",opacity:vis?1:0,transform:vis?"none":"translateX(-10px)",transition:`opacity .45s ${delay}s ease, transform .45s ${delay}s cubic-bezier(.16,1,.3,1)`}}>
    <span style={{fontSize:10,fontWeight:700,color:"#C8961A",letterSpacing:".08em"}}>{num}</span>
    <span style={{fontSize:13,fontWeight:600,color:"#ffffff"}}>{name}</span>
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
  const baseBg = "rgba(255,255,255,0.06)";
  const hoverBg = "rgba(255,255,255,0.12)";
  const baseColor = "rgba(255,255,255,0.3)";
  const hoverColor = "rgba(255,255,255,0.9)";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 50,
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: baseBg,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: baseColor,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "background 0.2s ease, color 0.2s ease, transform 0.18s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = hoverBg;
        el.style.color = hoverColor;
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = baseBg;
        el.style.color = baseColor;
        el.style.transform = "translateY(0)";
      }}
    >
      {dark ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke={lc} strokeWidth="2" />
          <path
            stroke={lc}
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            stroke={lc}
            strokeWidth="2"
            strokeLinecap="round"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          />
        </svg>
      )}
    </button>
  );
}
// ─── Continuous Rooms Section: single sticky left, stacked right panels ──────
function RoomsSection({ dark, T, lc, bc, orbSection, orbEnergy, watchRef, workRef, wrapRef }: {
  dark: boolean;
  T: Record<string,string>;
  lc: string; bc: string;
  orbSection: string; orbEnergy: number;
  watchRef: React.RefObject<HTMLElement | null>;
  workRef: React.RefObject<HTMLElement | null>;
  wrapRef: React.RefObject<HTMLElement | null>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0); // 0→1 across all three rooms
  const [revealProgress, setRevealProgress] = useState(0); // 0→1 as section enters viewport
  const [sectionInView, setSectionInView] = useState(false); // true while any part of rooms section is in viewport
  const isMobile = useMobile();

  useEffect(() => {
    const onScroll = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setSectionInView(rect.top < vh && rect.bottom > 0);
      // pct: 0 when top of wrapper hits viewport top, 1 when bottom exits
      const totalScroll = el.offsetHeight - vh;
      const scrolled = Math.max(0, -rect.top);
      setScrollPct(totalScroll > 0 ? Math.min(1, scrolled / totalScroll) : 0);
      // Reveal: section slowly appears as it enters from below (Apple-style scroll-linked)
      // 0 when section top is at 85% of viewport, 1 when section top is at 25%
      const rawReveal = (rect.top <= vh * 0.85) ? (vh * 0.85 - rect.top) / (vh * 0.6) : 0;
      setRevealProgress(Math.max(0, Math.min(1, rawReveal)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Interpolate bg color across three zones: 0–0.33 (watch), 0.33–0.66 (work), 0.66–1 (wrap)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
  const eased = scrollPct < 0.5 ? 2 * scrollPct * scrollPct : 1 - Math.pow(-2 * scrollPct + 2, 2) / 2;

  // Dark mode colors per zone
  const ZONES_DARK = [
    { bg: [4,12,26],   accent: [74,144,245],  glow: "rgba(74,144,245,0.35)"  }, // watch blue
    { bg: [3,14,16],   accent: [13,140,158],  glow: "rgba(13,140,158,0.35)"  }, // work teal
    { bg: [8,4,18],    accent: [160,128,245], glow: "rgba(160,128,245,0.35)" }, // wrap violet
  ];
  const ZONES_LIGHT = [
    { bg: [228,235,250], accent: [74,144,245],  glow: "rgba(74,144,245,0.20)"  },
    { bg: [216,239,242], accent: [13,140,158],  glow: "rgba(13,140,158,0.20)"  },
    { bg: [232,226,250], accent: [160,128,245], glow: "rgba(160,128,245,0.20)" },
  ];
  const ZONES = dark ? ZONES_DARK : ZONES_LIGHT;

  // Which zone and how far through it
  const zoneCount = ZONES.length;
  const rawZone = eased * (zoneCount - 1);
  const zoneIdx = Math.min(Math.floor(rawZone), zoneCount - 2);
  const zonePct = rawZone - zoneIdx;
  const zA = ZONES[zoneIdx], zB = ZONES[zoneIdx + 1];

  const bgR = Math.round(lerp(zA.bg[0], zB.bg[0], zonePct));
  const bgG = Math.round(lerp(zA.bg[1], zB.bg[1], zonePct));
  const bgB = Math.round(lerp(zA.bg[2], zB.bg[2], zonePct));
  const acR = Math.round(lerp(zA.accent[0], zB.accent[0], zonePct));
  const acG = Math.round(lerp(zA.accent[1], zB.accent[1], zonePct));
  const acB = Math.round(lerp(zA.accent[2], zB.accent[2], zonePct));

  const leftBg = `rgb(${bgR},${bgG},${bgB})`;
  const accentColor = `rgb(${acR},${acG},${acB})`;
  const glowColor = `rgba(${acR},${acG},${acB},${dark ? 0.38 : 0.22})`;

  // Current room label + name based on scroll position
  const roomIdx = scrollPct < 0.38 ? 0 : scrollPct < 0.72 ? 1 : 2;
  const roomNames  = ["WATCH", "WORK", "WRAP"];
  const roomNums   = ["Room One", "Room Two", "Room Three"];
  const roomSubs   = ["The Signal Room", "The Engine Room", "The Distribution Room"];
  const roomPals   = [PALETTES.watch, PALETTES.work, PALETTES.wrap];

  // For orb - smoothly blend palette based on scroll
  const currentPal = roomPals[roomIdx];
  const textColor = dark ? "#E8E8E6" : "#1a1a1a";

  // Apple-style ease-out for scroll reveal (smooth, refined)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedReveal = easeOutCubic(revealProgress);
  // Slight stagger: orb side leads, copy side follows (adds depth)
  const revealRight = easeOutCubic(Math.max(0, (revealProgress - 0.08) / 0.92));
  // Nav pill (outside wrapper): visible as soon as section enters viewport, hide when scrolled past
  const navOpacity = sectionInView && (revealProgress > 0.02 ? 1 : revealProgress / 0.02);

  return (
    <>
    <div
      id="rooms"
      ref={wrapperRef}
      className="rooms-wrapper"
      style={{
        display: "flex",
        position: "relative",
        overflowX: "clip",
        opacity: easedReveal,
        transform: `translateY(${(1 - easedReveal) * 36}px) scale(${0.987 + 0.013 * easedReveal})`,
        transformOrigin: "center top",
        willChange: revealProgress < 1 ? "opacity, transform" : "auto",
      }}
    >
      {/* Full-width gradient canvas: one background for the whole section, shifts with scroll (no container) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(
              ellipse 70% 60% at 28% 50%,
              ${glowColor.replace("0.38", "0.08").replace("0.22", "0.08")} 0%,
              rgba(${acR},${acG},${acB},${dark ? 0.03 : 0.02}) 35%,
              transparent 70%
            ),
            linear-gradient(180deg, rgb(${bgR},${bgG},${bgB}) 0%, ${T.bg} 100%)
          `,
          boxShadow: "inset 0 80px 60px -40px rgba(7,9,15,0.6), inset 0 -80px 60px -40px rgba(7,9,15,0.6)",
          transition: "background 0.35s ease, box-shadow 0.35s ease",
        }}
      />
      {/* Spacer for layout: nav pill is rendered outside wrapper as fixed sibling */}
      {!isMobile && <div style={{ width: "32vw", flexShrink: 0 }} />}
        {/* ── Right panels: stacked, normal flow; subtle stagger so copy follows orb ── */}
      <div
        style={{
          flex: isMobile ? 1 : "0 0 68vw",
          width: isMobile ? "100%" : "68vw",
          minWidth: 0,
          position: "relative",
          zIndex: 1,
          transform: `translateY(${(1 - revealRight) * 18}px)`,
          willChange: revealProgress < 1 ? "transform" : "auto",
        }}
      >

        {/* WATCH right */}
        <section ref={watchRef} id="room-watch" style={{
          minHeight: "130vh",
          padding: isMobile ? "48px 24px" : "64px max(48px, 5vw) 64px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          justifyContent: "center",
          position: "relative",
          maxWidth: isMobile ? "100%" : 680,
          margin: "0 auto",
          background: "transparent",
          overflow: "hidden",
        }}>
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: accentColor, textTransform: "uppercase", marginBottom: 10, fontWeight: 700, opacity: .7 }}>
                Room One
              </div>
              <div style={{ marginBottom: 14, filter: `drop-shadow(0 0 36px ${glowColor})` }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(200,150,26,0.35) 0%, rgba(200,150,26,0.1) 50%, transparent 70%)",
                  }}
                />
              </div>
              <div style={{ fontSize: "clamp(36px,8vw,44px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .9, color: textColor, textAlign: "center" }}>
                WATCH
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: textColor, opacity: .26, textTransform: "uppercase", marginTop: 8 }}>
                The Signal Room
              </div>
            </div>
          )}
          <WordReveal text="Before you write a single word, the system scans your category for what's moving." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={textColor} />
          <FadeUp delay={0.08}><p style={{ fontSize: 13, lineHeight: 1.82, color: T.textSub }}>You get structured intelligence, not a reading list. Every briefing is built for action, not review.</p></FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="What's Moving" desc="Developments shaping your category right now" accent={T.watchA} delay={0} lc={lc} bc={bc} />
            <FeatureLine num="02" title="Threats" desc="Items requiring defensive positioning or response" accent={T.watchA} delay={.06} lc={lc} bc={bc} />
            <FeatureLine num="03" title="Opportunities" desc="Scored by effort-to-impact ratio, highest leverage first" accent={T.watchA} delay={.12} lc={lc} bc={bc} />
            <FeatureLine num="04" title="Content Triggers" desc="Angles ready to hand directly to the production engine" accent={T.watchA} delay={.18} lc={lc} bc={bc} />
            <FeatureLine num="05" title="Event Radar" desc="Upcoming events filtered by proximity and relevance" accent={T.watchA} delay={.24} lc={lc} bc={bc} />
          </div>
          <FadeUp delay={0.12}>
            <div style={{ borderLeft: `2px solid ${T.watchA}45`, paddingLeft: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textColor, marginBottom: 5, letterSpacing: ".02em" }}>Source Verification</div>
              <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.74 }}>Every claim requires two or more independent, credible sources. Unverified intelligence never ships. This is a protocol, not a preference.</p>
            </div>
          </FadeUp>
        </section>

        {/* WORK right */}
        <section ref={workRef} id="room-work" style={{
          minHeight: "145vh",
          padding: isMobile ? "48px 24px" : "64px max(48px, 5vw) 64px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          justifyContent: "center",
          position: "relative",
          maxWidth: isMobile ? "100%" : 680,
          margin: "0 auto",
          background: "transparent",
          overflow: "hidden",
        }}>
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: accentColor, textTransform: "uppercase", marginBottom: 10, fontWeight: 700, opacity: .7 }}>
                Room Two
              </div>
              <div style={{ marginBottom: 14, filter: `drop-shadow(0 0 36px ${glowColor})` }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(200,150,26,0.35) 0%, rgba(200,150,26,0.1) 50%, transparent 70%)",
                  }}
                />
              </div>
              <div style={{ fontSize: "clamp(36px,8vw,44px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .9, color: textColor, textAlign: "center" }}>
                WORK
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: textColor, opacity: .26, textTransform: "uppercase", marginTop: 8 }}>
                The Engine Room
              </div>
            </div>
          )}
          <WordReveal text="A coordinated team of forty specialists transforms your raw thinking into publication-grade content." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={textColor} />
          <FadeUp delay={0.08}><p style={{ fontSize: 13, lineHeight: 1.82, color: T.textSub }}>Not a single prompt. A system of roles working in sequence. Voice DNA ensures every word sounds like you.</p></FadeUp>
          <FadeUp delay={0.12}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".18em", color: T.textFaint, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Output formats</div>
              <Ticker lc={lc} />
            </div>
          </FadeUp>
          <FadeUp delay={0.18}>
            <div style={{ borderTop: `1px solid ${bc}`, paddingTop: 28 }}>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: T.workA, textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>Voice DNA</div>
              <div style={{ marginBottom: 20 }}><WordReveal text="Every output sounds exactly like you." size={18} weight={700} color={textColor} lh={1.2} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {[["Vocabulary and Syntax", 88], ["Tonal Register", 94], ["Rhythm and Cadence", 91], ["Metaphor Patterns", 87], ["Structural Habits", 96]].map(([l, s], i) => (
                  <DnaBar key={i} label={l as string} score={s as number} delay={i * .06} accent={T.workA} lc={lc} />
                ))}
              </div>
            </div>
          </FadeUp>
        </section>

        {/* WRAP right */}
        <section ref={wrapRef} id="room-wrap" style={{
          minHeight: "120vh",
          padding: isMobile ? "48px 24px" : "64px max(48px, 5vw) 64px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          justifyContent: "center",
          position: "relative",
          maxWidth: isMobile ? "100%" : 680,
          margin: "0 auto",
          background: "transparent",
          overflow: "hidden",
        }}>
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: ".22em", color: accentColor, textTransform: "uppercase", marginBottom: 10, fontWeight: 700, opacity: .7 }}>
                Room Three
              </div>
              <div style={{ marginBottom: 14, filter: `drop-shadow(0 0 36px ${glowColor})` }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(200,150,26,0.35) 0%, rgba(200,150,26,0.1) 50%, transparent 70%)",
                  }}
                />
              </div>
              <div style={{ fontSize: "clamp(36px,8vw,44px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .9, color: textColor, textAlign: "center" }}>
                WRAP
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".16em", color: textColor, opacity: .26, textTransform: "uppercase", marginTop: 8 }}>
                The Distribution Room
              </div>
            </div>
          )}
          <WordReveal text="One idea becomes a complete publishing event." size="clamp(18px,2vw,24px)" weight={700} lh={1.22} color={textColor} />
          <FadeUp delay={0.08}><p style={{ fontSize: 13, lineHeight: 1.82, color: T.textSub }}>Articles, social posts, email sequences, video scripts. Formatted for every channel. Ready to ship. Nothing left for you to finish.</p></FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="Content Calendar" desc="Visual scheduling across all channels from a single canvas." accent={T.wrapA} delay={0} lc={lc} bc={bc} />
            <FeatureLine num="02" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." accent={T.wrapA} delay={.06} lc={lc} bc={bc} />
            <FeatureLine num="03" title="Performance Loop" desc="Engagement data flows back to sharpen your next strategy." accent={T.wrapA} delay={.12} lc={lc} bc={bc} />
            <FeatureLine num="04" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." accent={T.wrapA} delay={.18} lc={lc} bc={bc} />
          </div>
        </section>

      </div>
    </div>

    {/* Nav pill: sibling of rooms wrapper so it is not affected by wrapper opacity; visible when section in viewport */}
    {!isMobile && (
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "32vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          opacity: navOpacity,
          pointerEvents: "none",
          transition: "opacity 0.25s ease",
        }}
      >
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: ".22em", color: accentColor, textTransform: "uppercase", marginBottom: 14, fontWeight: 700, opacity: .7, transition: "color 0.4s ease" }}>
            {roomNums[roomIdx]}
          </div>
          <div style={{ filter: `drop-shadow(0 0 52px ${glowColor})`, marginBottom: 16, transition: "filter 0.4s ease" }}>
            <div className="orb-breathe-rooms">
              <SiriOrb
                size={240}
                energy={orbSection === "watch" || orbSection === "work" || orbSection === "wrap" ? orbEnergy : 0.1}
                palette={currentPal}
                dark={dark}
              />
            </div>
          </div>
          <div style={{ fontSize: "clamp(52px,6.5vw,84px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: textColor, textAlign: "center", transition: "opacity 0.3s", marginTop: 24 }}>
            {roomNames[roomIdx]}
          </div>
          <div style={{ fontSize: 9, letterSpacing: ".15em", color: textColor, opacity: .20, textTransform: "uppercase", marginTop: 8, fontWeight: 500 }}>
            {roomSubs[roomIdx]}
          </div>
          <div style={{ width: 28, height: 1, background: `linear-gradient(90deg,transparent,${accentColor},transparent)`, marginTop: 18, transition: "background 0.4s ease" }} />
        </div>
      </div>
    )}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [orbSection] = useState<"watch">("watch"); // kept for RoomsSection compat
  const [orbEnergy] = useState(0.35);
  const fromLandingZoom = location.state?.fromLandingZoom === true;
  const [entranceDone, setEntranceDone] = useState(false);
  const isMobile = useMobile();
  const [navScrolled, setNavScrolled] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const [roomsVisible, setRoomsVisible] = useState(false);
  const [roomsZoneInView, setRoomsZoneInView] = useState(false);
  const [activeRoom, setActiveRoom] = useState<"watch" | "work" | "wrap">("watch");
  const roomsSentinelRef = useRef<HTMLDivElement | null>(null);
  const watchRef = useRef<HTMLElement | null>(null);
  const workRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLElement | null>(null);

  const toggle = () => setDark(d => !d);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Lazy-load RoomsSection when its sentinel approaches the viewport
  useEffect(() => {
    if (roomsVisible) return;
    if (typeof IntersectionObserver === "undefined") {
      setRoomsVisible(true);
      return;
    }
    const el = roomsSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setRoomsVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "1200px 0px 1200px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [roomsVisible]);

  // Pills visible when any room section (WATCH / WORK / WRAP) is in view; activeRoom = section with most visibility
  const roomIntersectionRef = useRef({ watch: false, work: false, wrap: false, watchRatio: 0, workRatio: 0, wrapRatio: 0 });
  useEffect(() => {
    if (!roomsVisible || typeof IntersectionObserver === "undefined") return;
    let observer: IntersectionObserver | null = null;
    const frameId = requestAnimationFrame(() => {
      const elements = [watchRef.current, workRef.current, wrapRef.current].filter(Boolean) as HTMLElement[];
      if (elements.length === 0) return;
      observer = new IntersectionObserver(
        (entries) => {
          const state = roomIntersectionRef.current;
          entries.forEach((entry) => {
            const targetId = entry.target.id;
            const key = targetId === "room-watch" ? "watch" : targetId === "room-work" ? "work" : targetId === "room-wrap" ? "wrap" : null;
            if (key) {
              state[key as "watch" | "work" | "wrap"] = entry.isIntersecting;
              (state as Record<string, number>)[key + "Ratio"] = entry.intersectionRatio;
            }
          });
          const anyInView = state.watch || state.work || state.wrap;
          setRoomsZoneInView(anyInView);
          if (anyInView) {
            const best = (["watch", "work", "wrap"] as const).reduce((a, b) =>
              (state as Record<string, number>)[b + "Ratio"] > (state as Record<string, number>)[a + "Ratio"] ? b : a
            );
            setActiveRoom(best);
          }
        },
        { root: null, rootMargin: "0px", threshold: 0.1 }
      );
      elements.forEach((el) => observer!.observe(el));
    });
    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [roomsVisible]);
  useEffect(() => {
    document.body.setAttribute("data-explore-theme", dark ? "dark" : "light");
  }, [dark]);

  // Own document background for Explore: use backgroundColor only (never shorthand) and clear gradient. Clean up on unmount so studio/landing get a clean body.
  useEffect(() => {
    document.body.style.backgroundImage = "none";
    document.documentElement.style.backgroundImage = "none";
    document.body.style.backgroundColor = dark ? "#07090f" : "#F4F2ED";
    document.documentElement.style.backgroundColor = dark ? "#07090f" : "#F4F2ED";
    return () => {
      document.body.style.background = "";
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#F4F2ED";
      document.documentElement.style.background = "";
      document.documentElement.style.backgroundImage = "none";
      document.documentElement.style.backgroundColor = "#F4F2ED";
    };
  }, [dark]);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
       setShowScrollHint(window.scrollY <= 100);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => {
      const el = document.documentElement;
      const denom = el.scrollHeight - el.clientHeight;
      if (denom <= 0) {
        setScrollPct(0);
        return;
      }
      setScrollPct(el.scrollTop / denom);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Room pills: which room is in view (when rooms section is loaded)
  useEffect(() => {
    if (!roomsVisible) return;
    const ids: ("watch" | "work" | "wrap")[] = ["watch", "work", "wrap"];
    const check = () => {
      const vh = window.innerHeight;
      const center = vh * 0.4;
      let best: "watch" | "work" | "wrap" = "watch";
      let bestDist = Infinity;
      ids.forEach((room) => {
        const el = document.getElementById("room-" + room);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = room;
        }
      });
      setActiveRoom(best);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [roomsVisible]);

  // Fade in from dark when arriving from landing zoom transition
  useEffect(() => {
    if (!fromLandingZoom) {
      setEntranceDone(true);
      return;
    }
    setEntranceDone(false);
    let frameId = 0;
    let timeoutId: number | undefined;
    frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setEntranceDone(true);
      }, 50);
    });
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [fromLandingZoom]);

  // After the landing zoom fade-in completes, ensure no gradient lingers and document uses backgroundColor only
  useEffect(() => {
    if (!fromLandingZoom || !entranceDone) return;
    document.documentElement.style.background = "";
    document.documentElement.style.backgroundImage = "none";
    document.documentElement.style.backgroundColor = dark ? "#07090f" : "#F4F2ED";
    document.body.style.background = "";
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = dark ? "#07090f" : "#F4F2ED";
  }, [fromLandingZoom, entranceDone, dark]);

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
    watchBg:   dark ? "linear-gradient(170deg,#040c1a 0%,#030d0f 100%)" : "linear-gradient(170deg,#E8EEFA 0%,#DCF0F3 100%)",
    workBg:    dark ? "linear-gradient(170deg,#030d0f 0%,#080412 100%)" : "linear-gradient(170deg,#DCF0F3 0%,#EAE4F8 100%)",
    wrapBg:    dark ? "linear-gradient(170deg,#080412 0%,#07090f 100%)" : "linear-gradient(170deg,#EAE4F8 0%,#F4F2ED 100%)",
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
      <div
        className="noise-overlay"
        style={{
          background:"#07090f",
          fontFamily:"'Afacad Flux',sans-serif",
          color:T.text,
          backgroundColor:T.bg,
          overflowX:"clip",
          transition:"background .45s ease, color .3s ease" + (fromLandingZoom ? ", opacity 0.6s ease-out" : ""),
          opacity: fromLandingZoom ? (entranceDone ? 1 : 0) : 1,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&family=DM+Sans:wght@400;500;600&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          html{scroll-behavior:smooth;}
          ::selection{background:${T.gold}40;}
          ${!dark ? "*, *::before, *::after { cursor: auto !important; } a, button, [role='button'], [style*='cursor:pointer'], [style*='cursor: pointer'] { cursor: pointer !important; }" : ""}
          .noise-overlay::before{
            content:"";
            position:fixed;
            top:0;
            left:0;
            width:100%;
            height:100%;
            pointer-events:none;
            z-index:2;
            opacity:0.018;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            background-repeat:repeat;
          }
          .rooms-wrapper::before{
            content:"";
            position:absolute;
            top:0;
            left:0;
            width:100%;
            height:120px;
            pointer-events:none;
            z-index:1;
            background:linear-gradient(180deg,#07090f 0%,transparent 100%);
          }
          .rooms-wrapper::after{
            content:"";
            position:absolute;
            bottom:0;
            left:0;
            width:100%;
            height:120px;
            pointer-events:none;
            z-index:1;
            background:linear-gradient(0deg,#07090f 0%,transparent 100%);
          }
          @keyframes orbBreatheRooms {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.04); }
          }
          .orb-breathe-rooms { display: inline-block; animation: orbBreatheRooms 2.6s ease-in-out infinite; }
          @keyframes float {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50%      { transform: translateY(6px); opacity: 0.6; }
          }
        `}</style>

        {/* Scroll progress indicator */}
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            width: 2,
            height: "100vh",
            zIndex: 100,
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${scrollPct * 100}%`,
              background: "linear-gradient(to bottom, #4A90F5, #0D8C9E, #a080f5)",
              transition: "height 0.1s linear",
            }}
          />
        </div>

        {/* Room pills: fixed left nav whenever rooms zone (WATCH / WORK / WRAP) is in view */}
        {roomsVisible && roomsZoneInView && !isMobile && (
          <div
            style={{
              position: "fixed",
              left: 24,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 90,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {(["watch", "work", "wrap"] as const).map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => document.getElementById("room-" + room)?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: activeRoom === room ? "rgba(255,255,255,0.1)" : "transparent",
                  color: activeRoom === room ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (activeRoom !== room) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeRoom !== room) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  }
                }}
              >
                {room}
              </button>
            ))}
          </div>
        )}

        {/* NAV */}
        <nav style={{
          position:"fixed",
          top:0,
          left:0,
          width:"100%",
          zIndex:100,
          height:54,
          padding:"0 36px",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          background: navScrolled ? "rgba(7,9,15,0.85)" : "transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition:"background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}>
          <button onClick={()=>nav("/")} style={{background:"none",border:"none",display:"flex",alignItems:"baseline",cursor:"pointer",gap:0}}>
            <span style={{fontSize:15,fontWeight:800,color:T.text,letterSpacing:".04em"}}>EVERY</span>
            <span style={{fontSize:15,fontWeight:800,color:T.text,letterSpacing:".04em"}}>WHERE</span>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:".16em",color:T.textFaint,marginLeft:6,textTransform:"uppercase",alignSelf:"center"}}>Studio</span>
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <a href="#problem" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color .2s" }} onMouseEnter={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }} onMouseLeave={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Problem</a>
              <a href="#fw" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color .2s" }} onMouseEnter={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }} onMouseLeave={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Framework</a>
              <a href="#rooms" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color .2s" }} onMouseEnter={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }} onMouseLeave={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Rooms</a>
              <a href="#gates" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color .2s" }} onMouseEnter={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }} onMouseLeave={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Gates</a>
              <a href="#cta" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", transition: "color .2s" }} onMouseEnter={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }} onMouseLeave={e=>{ e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Contact</a>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>nav("/auth")} style={{background:T.ctaBg,border:"none",borderRadius:100,padding:"7px 22px",color:T.ctaText,fontSize:12,fontWeight:600,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"opacity .2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".80"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
              Get Early Access
            </button>
          </div>
        </nav>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"110px 40px 72px",position:"relative",overflow:"hidden"}}>
          {/* Cool blue ambient glow */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,background:dark?"radial-gradient(ellipse 70% 50% at 50% 52%, rgba(58,123,213,0.10) 0%, transparent 68%)":"radial-gradient(ellipse 70% 50% at 50% 52%, rgba(120,160,240,0.07) 0%, transparent 68%)"}} />
          {/* Warm brand halo behind headline */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 80% 60% at 50% 30%, rgba(200,150,26,0.03) 0%, transparent 70%)"}} />

          {/* Eyebrow: primary category label */}
          <div
            style={{
              position:"relative",
              zIndex:2,
              fontSize:13,
              letterSpacing:".25em",
              color:"#C8961A",
              textTransform:"uppercase",
              marginBottom:18,
              fontWeight:600,
              opacity:mounted?1:0,
              transform:mounted?"none":"translateY(4px)",
              transition:"opacity .8s .3s ease, transform .8s .3s cubic-bezier(.16,1,.3,1)",
            }}
          >
            COMPOSED INTELLIGENCE
          </div>

          {/* Headline */}
          <div style={{position:"relative",zIndex:2,textAlign:"center",opacity:mounted?1:0,transform:mounted?"none":"translateY(14px)",transition:"opacity .8s .35s ease, transform .8s .35s cubic-bezier(.16,1,.3,1)"}}>
            <div style={{fontSize:"clamp(48px,8vw,106px)",fontWeight:800,letterSpacing:"-.045em",lineHeight:.92,color:T.text,marginBottom:4}}>Your thinking.</div>
            <div style={{fontSize:"clamp(48px,8vw,106px)",fontWeight:800,letterSpacing:"-.045em",lineHeight:.92,color:T.gold,marginBottom:32}}>Composed.</div>
          </div>

          {/* Subhead */}
          <div style={{position:"relative",zIndex:2,maxWidth:500,textAlign:"center",marginBottom:38,opacity:mounted?1:0,transition:"opacity .8s .52s ease"}}>
            <p style={{fontSize:"clamp(14px,1.5vw,17px)",lineHeight:1.74,color:T.textSub,fontWeight:400}}>
              You have the ideas, the expertise, and the point of view. What you don't have is the system to turn all of that into content that actually lands.
            </p>
          </div>

          {/* CTAs */}
          <div style={{position:"relative",zIndex:2,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",opacity:mounted?1:0,transition:"opacity .8s .68s ease"}}>
            <button onClick={()=>nav("/auth")} style={{background:T.ctaBg,border:"none",borderRadius:100,padding:"12px 38px",fontSize:13,fontWeight:700,color:T.ctaText,fontFamily:"'Afacad Flux',sans-serif",cursor:"pointer",transition:"opacity .2s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".82"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
              Get Early Access
            </button>
            <button
              onClick={()=>document.getElementById("fw")?.scrollIntoView({behavior:"smooth"})}
              style={{
                background:"transparent",
                border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:100,
                padding:"16px 36px",
                fontSize:13,
                fontWeight:500,
                color:"rgba(255,255,255,0.75)",
                fontFamily:"'Afacad Flux',sans-serif",
                cursor:"pointer",
                transition:"all 0.25s ease",
              }}
              onMouseEnter={e=>{ const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.4)"; el.style.color="rgba(255,255,255,0.95)"; el.style.background="rgba(255,255,255,0.06)"; }}
              onMouseLeave={e=>{ const el = e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.2)"; el.style.color="rgba(255,255,255,0.75)"; el.style.background="transparent"; }}>
              See How It Works
            </button>
          </div>

          {/* Scroll cue */}
          <button
            type="button"
            onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              position: "absolute",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              opacity: showScrollHint ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
            aria-label="Scroll down"
          >
            <svg
              width="20"
              height="12"
              viewBox="0 0 20 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                display: "block",
                animation: "float 2.5s ease-in-out infinite",
                stroke: "rgba(255,255,255,0.4)",
              }}
              onMouseEnter={e => { (e.currentTarget as SVGElement).style.stroke = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as SVGElement).style.stroke = "rgba(255,255,255,0.4)"; }}
            >
              <path
                d="M3 3L10 9L17 3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* ══ SOCIAL PROOF BAR ════════════════════════════════════════════════ */}
        <section
          style={{
            padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px" }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.04em",
                fontWeight: 400,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              Used by executive coaches, consultants, and keynote speakers who charge $10K+ per engagement
            </p>
          </div>
        </section>

        {/* ══ PROBLEM ═══════════════════════════════════════════════════════════ */}
        <section
          id="problem"
          style={{
            padding: isMobile ? "80px 24px 80px" : "140px 48px 140px",
          }}
        >
          <div style={{maxWidth:880,margin:"0 auto"}}>
            <FadeInSection>
              <WordReveal text="You already know what to say." size="clamp(32px,4.5vw,54px)" weight={700} lh={1.04} color={T.text} />
              <div style={{marginTop:10,marginBottom:36}}>
                <WordReveal text="The hard part is everything after that." size="clamp(15px,1.7vw,20px)" weight={400} color={T.textSub} lh={1.4} delay={0.08} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr",gap:isMobile ? "24px" : "0 64px",maxWidth:800}}>
                <FadeUp delay={0.04}><p style={{fontSize:14,lineHeight:1.8,color:T.textSub}}>Every thought leader faces the same bottleneck. You have insights worth sharing, but turning them into polished, multi-format content takes a team you don't have and time you can't spare.</p></FadeUp>
                <FadeUp delay={0.10}><p style={{fontSize:14,lineHeight:1.8,color:T.textSub}}>AI tools move fast but flatten your voice into something generic. Ghostwriters get tone right but cost thousands a month and still need you to do half the work.</p></FadeUp>
              </div>
            </FadeInSection>
          </div>
        </section>

        <SectionDivider />

        {/* ══ FRAMEWORK ════════════════════════════════════════════════════════ */}
        <section
          id="fw"
          style={{
            padding: isMobile ? "80px 24px 80px" : "160px 48px 160px",
            background: "#07090f",
          }}
        >
          <div style={{maxWidth:920,margin:"0 auto"}}>
            <FadeInSection>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:11,letterSpacing:".15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:18,fontWeight:500}}>The Framework</div>
                <div style={{fontSize:"clamp(36px,5vw,68px)",fontWeight:800,letterSpacing:"-.04em",lineHeight:.94,color:T.text,marginBottom:4}}>One idea in.</div>
                <div style={{fontSize:"clamp(36px,5vw,68px)",fontWeight:800,letterSpacing:"-.04em",lineHeight:.94,color:T.gold,marginBottom:20}}>Communications out.</div>
                <p style={{fontSize:14,color:T.textSub,maxWidth:420,margin:"0 auto",lineHeight:1.72}}>EVERYWHERE Studio bridges what you know and what the world sees.</p>
              </div>
            </FadeInSection>
            {/* Counters */}
            <FadeInSection style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",marginTop:48,borderTop:`1px solid ${bc}`}}>
              <div style={{padding:isMobile ? "24px 16px" : "36px 28px",borderRight:`1px solid ${bc}`}}><Counter target={40} suffix="+" label="AI Specialists" accent={T.watchA} /></div>
              <div style={{padding:isMobile ? "24px 16px" : "36px 28px",borderRight:`1px solid ${bc}`}}><Counter target={10} label="Output Formats" accent={T.workA} /></div>
              <div style={{padding:isMobile ? "24px 16px" : "36px 28px"}}><Counter target={7} label="Quality Gates" accent={T.wrapA} /></div>
            </FadeInSection>
          </div>
        </section>

        {/* ══ ROOMS: single continuous left column (lazy-loaded) ═══════════════ */}
        <div ref={roomsSentinelRef}>
          {roomsVisible ? (
            <RoomsSection dark={dark} T={T} lc={lc} bc={bc} orbSection={orbSection} orbEnergy={orbEnergy} watchRef={watchRef} workRef={workRef} wrapRef={wrapRef} />
          ) : (
            <div style={{ minHeight: "300vh", background: "#07090f" }} />
          )}
        </div>

        <SectionDivider />

        {/* ══ QUALITY GATES ════════════════════════════════════════════════════ */}
        <section
          id="gates"
          style={{
            padding: isMobile ? "80px 24px 80px" : "140px 48px 140px",
            background:"#07090f",
          }}
        >
          <div style={{maxWidth:800,margin:"0 auto"}}>
            <FadeInSection>
              <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr",gap:"36px 60px",alignItems:"end",marginBottom:44}}>
                <div>
                  <FadeUp>
                    <div style={{display:"inline-flex",alignItems:"center",fontSize:11,letterSpacing:".15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:14,fontWeight:500,borderLeft:"2px solid #C8961A",paddingLeft:12}}>
                      Quality Gates
                    </div>
                  </FadeUp>
                  <WordReveal text="Nothing ships without passing the gates." size="clamp(24px,3.2vw,40px)" weight={700} lh={1.08} color={T.text} />
                </div>
                <FadeUp delay={0.1}><p style={{fontSize:13,lineHeight:1.75,color:T.textSub}}>7 checks before anything reaches your audience. No AI tells. No off-brand moments. No weak writing.</p></FadeUp>
              </div>
            </FadeInSection>
            <div style={{borderTop:`1px solid ${bc}`}}>
              <FadeInSection>
                {[["01","Strategy","Does this serve your goals?","#3A7BD5"],["02","Voice","Does this sound like you?","#0D8C9E"],["03","Accuracy","Are the facts verified?","#C8961A"],["04","AI Tells","Could anyone spot the AI?","#e8506a"],["05","Audience","Will this resonate?","#A080F5"],["06","Platform","Is this native to the channel?","#4ab8f5"],["07","Impact","Will this move people to action?","#10b981"]].map(([num,name,desc,color],i,arr)=>(
                  <GateRow key={i} num={num} name={name} desc={desc} color={color} delay={0.03+i*.05} lc={lc} bc={bc} last={i===arr.length-1} />
                ))}
              </FadeInSection>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ══ COMPOUND ═════════════════════════════════════════════════════════ */}
        <section
          style={{
            padding: isMobile ? "80px 24px 80px" : "140px 48px 80px",
          }}
        >
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <FadeInSection>
              <div style={{fontSize:9,letterSpacing:".2em",color:T.textFaint,textTransform:"uppercase",marginBottom:16,fontWeight:500}}>Compound Advantage</div>
              <WordReveal text="Why It Compounds" size="clamp(34px,4.5vw,58px)" weight={700} lh={1.0} color={T.text} />
              <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
                <FadeUp delay={0.06}><p style={{fontSize:15,lineHeight:1.78,color:T.textSub}}>Most tools make content faster. EVERYWHERE Studio makes it better, and the difference grows with every piece you publish.</p></FadeUp>
                <FadeUp delay={0.12}><p style={{fontSize:15,lineHeight:1.78,color:T.textSub}}>Your Voice DNA sharpens. Quality gates calibrate. The intelligence layer learns the contours of your category with increasing precision.</p></FadeUp>
              </div>
              <FadeUp delay={0.24}>
                <div style={{marginTop:44, textAlign:"center"}}>
                  <div
                    style={{
                      height:1,
                      maxWidth:500,
                      margin:"40px auto",
                      background:"linear-gradient(90deg, transparent, rgba(200,150,26,0.25), transparent)",
                    }}
                  />
                  <div
                    style={{
                      maxWidth:700,
                      margin:"64px auto 0 auto",
                      fontSize:"clamp(24px,3vw,32px)",
                      fontFamily:"'Cormorant Garamond', serif",
                      fontStyle:"italic",
                      color:"#C8961A",
                      lineHeight:1.5,
                      letterSpacing:"0.01em",
                      textAlign:"center",
                    }}
                  >
                    Competitors can copy the output format. They cannot copy the system underneath it.
                  </div>
                  <div
                    style={{
                      height:1,
                      maxWidth:500,
                      margin:"40px auto",
                      background:"linear-gradient(90deg, transparent, rgba(200,150,26,0.25), transparent)",
                    }}
                  />
                </div>
              </FadeUp>
            </FadeInSection>
          </div>
        </section>

        <SectionDivider />

        {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
        <section
          id="cta"
          style={{
            padding: isMobile ? "100px 24px 80px" : "180px 48px 120px",
            textAlign:"center",
            background:dark?"linear-gradient(180deg,#07090f 0%,#08102a 100%)":"linear-gradient(180deg,#F4F2ED 0%,#E8ECF8 100%)",
          }}
        >
          <div style={{maxWidth:540,margin:"0 auto"}}>
            <FadeInSection>
              <div style={{fontSize:11,letterSpacing:".15em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:24,fontWeight:500}}>Let's Talk</div>
              <WordReveal text="Your ideas deserve a system built to carry them." size="clamp(28px,4vw,52px)" weight={700} lh={1.02} color={T.text} center />
              <FadeUp delay={0.18}><p style={{fontSize:15,lineHeight:1.68,color:T.textSub,marginTop:18,marginBottom:44}}>If you're ready to stop carrying the mountain alone, let's have a conversation.</p></FadeUp>
              <FadeUp delay={0.26}>
                <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:48,flexWrap:"wrap"}}>
                  <button
                    onClick={()=>{ window.location.href = "mailto:mark@everywhereStudio.com"; }}
                    style={{
                      background:"#C8961A",
                      border:"none",
                      borderRadius:100,
                      padding:"16px 40px",
                      fontSize:15,
                      fontWeight:600,
                      color:"#07090f",
                      fontFamily:"'DM Sans', sans-serif",
                      cursor:"pointer",
                      transition:"all 0.25s ease",
                    }}
                    onMouseEnter={e=>{
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "#d4a52e";
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = "0 8px 30px rgba(200,150,26,0.3)";
                    }}
                    onMouseLeave={e=>{
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "#C8961A";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    Let's Talk
                  </button>
                  <button
                    onClick={()=>nav("/studio/dashboard")}
                    style={{
                      background:"transparent",
                      border:"1px solid rgba(255,255,255,0.2)",
                      borderRadius:100,
                      padding:"16px 40px",
                      fontSize:15,
                      fontWeight:500,
                      color:"rgba(255,255,255,0.7)",
                      fontFamily:"'DM Sans', sans-serif",
                      cursor:"pointer",
                      transition:"all 0.25s ease",
                    }}
                    onMouseEnter={e=>{
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.4)";
                      el.style.color = "#ffffff";
                      el.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={e=>{
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.2)";
                      el.style.color = "rgba(255,255,255,0.7)";
                      el.style.background = "transparent";
                    }}
                  >
                    Open Studio
                  </button>
                </div>
              </FadeUp>
            </FadeInSection>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            background:"#07090f",
            borderTop:"1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              maxWidth:1200,
              margin:"0 auto",
              padding:"48px 64px",
              display:"flex",
              flexDirection:"column",
              gap:24,
              fontFamily:"'DM Sans', sans-serif",
            }}
          >
            <div
              style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap:"wrap",
                rowGap:12,
              }}
            >
              <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
                <span style={{ fontSize:14, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"#ffffff" }}>EVERY</span>
                <span style={{ fontSize:14, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.42)" }}>WHERE</span>
                <span style={{ fontSize:9, fontWeight:600, letterSpacing:"0.18em", color:"rgba(255,255,255,0.4)", marginLeft:8, textTransform:"uppercase" }}>Studio</span>
              </div>
              <div style={{ fontSize:12, fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.7)" }}>
                Composed Intelligence
              </div>
            </div>

            <div
              style={{
                height:1,
                borderTop:"1px solid rgba(255,255,255,0.04)",
                margin:"24px 0",
              }}
            />

            <div
              style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap:"wrap",
                rowGap:8,
              }}
            >
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>2026 Mixed Grill LLC</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Santa Barbara, CA</span>
            </div>
          </div>
        </footer>

        {/* Subtle global theme toggle: bottom-left icon-only */}
        <ThemeToggle lc={T.text} />
      </div>
    </ThemeCtx.Provider>
  );
}
