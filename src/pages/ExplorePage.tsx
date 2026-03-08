import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO -- EXPLORE PAGE
// Full original content restored + cinematic scroll transitions.
// Rules: no emojis, no em-dashes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Word-by-word reveal ───────────────────────────────────────────────────────
function RevealText({
  text, delay = 0, size = "inherit", weight = 400, color = "#fff",
  lineHeight = 1.2, maxWidth, center = false, italic = false,
}: {
  text: string; delay?: number; size?: string | number; weight?: number;
  color?: string; lineHeight?: number; maxWidth?: string; center?: boolean; italic?: boolean;
}) {
  const { ref, visible } = useReveal(0.12);
  const words = text.split(" ");
  return (
    <div ref={ref} style={{ maxWidth, textAlign: center ? "center" : "left" }}>
      {words.map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.28em",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: `opacity .55s ${delay + i * 0.035}s cubic-bezier(.16,1,.3,1), transform .55s ${delay + i * 0.035}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
          fontStyle: italic ? "italic" : "normal",
        }}>{w}</span>
      ))}
    </div>
  );
}

// ── Slide-up reveal wrapper ───────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up" }: { children: React.ReactNode; delay?: number; direction?: "up"|"left"|"right" }) {
  const { ref, visible } = useReveal(0.12);
  const transforms: Record<string, string> = {
    up:    "translateY(28px)",
    left:  "translateX(-28px)",
    right: "translateX(28px)",
  };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translate(0,0)" : transforms[direction],
      transition: `opacity .65s ${delay}s cubic-bezier(.16,1,.3,1), transform .65s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      {children}
    </div>
  );
}

// ── Feature list item ─────────────────────────────────────────────────────────
function FeatureItem({ text, accent, delay }: { text: string; accent: string; delay: number }) {
  const { ref, visible } = useReveal(0.2);
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px 22px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-16px)",
      transition: `all .50s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0, opacity: 0.8, display: "block" }} />
      <span style={{ fontSize: 14, color: "rgba(255,255,255,.62)", fontWeight: 300, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ num, label, delay }: { num: string; label: string; delay: number }) {
  const { ref, visible } = useReveal(0.3);
  return (
    <div ref={ref} style={{
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "24px 28px", textAlign: "center",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
      transition: `all .60s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: "clamp(34px,4.5vw,54px)", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-.03em" }}>{num}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.42)", marginTop: 6, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── Gate card ─────────────────────────────────────────────────────────────────
const GATES_DATA = [
  { num:"01", name:"Strategy",  desc:"Clear POV. Right moment. Right position in your category.", color:"#4a90f5" },
  { num:"02", name:"Voice",     desc:"Matches all three Voice DNA layers. Fidelity Score calculated here.", color:"#50c8a0" },
  { num:"03", name:"Accuracy",  desc:"All claims verifiable. No hallucinated data ships.", color:"#f5a623" },
  { num:"04", name:"AI Tells",  desc:"Seven synthetic patterns removed. Reads like you wrote it.", color:"#e85d75" },
  { num:"05", name:"Audience",  desc:"Calibrated for the specific person you're writing for.", color:"#a080f5" },
  { num:"06", name:"Platform",  desc:"Formatted and sized correctly for the destination.", color:"#4ab8f5" },
  { num:"07", name:"Impact",    desc:"Clear next step. The reader knows what to do next.", color:"#f5d020" },
];

function GateCard({ num, name, desc, color, delay }: { num: string; name: string; desc: string; color: string; delay: number }) {
  const { ref, visible } = useReveal(0.15);
  return (
    <div ref={ref} style={{
      padding: "28px 24px", borderRadius: 16, textAlign: "left",
      background: `${color}0e`, border: `1px solid ${color}28`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
      transition: `all .55s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", color: `${color}99`, marginBottom: 8, fontWeight: 600 }}>{num}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-.01em" }}>{name}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

// ── Format card ───────────────────────────────────────────────────────────────
const FORMATS_DATA = [
  { name:"LinkedIn Post",   desc:"Native. CTA-optimized." },
  { name:"Newsletter",      desc:"Story-forward. Audience-tuned." },
  { name:"Sunday Story",    desc:"10 pieces, one session." },
  { name:"Podcast Script",  desc:"SSML-ready." },
  { name:"Twitter Thread",  desc:"Hook, build, land." },
  { name:"Essay",           desc:"1200-2000 words, referenced." },
  { name:"Short Video",     desc:"Script, hook, caption." },
  { name:"Substack Note",   desc:"Brief. Personal. Punchy." },
  { name:"Talk Outline",    desc:"Built for the stage." },
  { name:"Email Campaign",  desc:"Sequence with intent." },
  { name:"Blog Post",       desc:"SEO-optimized." },
  { name:"Executive Brief", desc:"Decision-ready." },
];

function FormatCard({ name, desc, delay }: { name: string; desc: string; delay: number }) {
  const { ref, visible } = useReveal(0.1);
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "18px 16px", borderRadius: 10,
        background: hovered ? "rgba(74,144,245,0.10)" : "rgba(255,255,255,0.04)",
        border: hovered ? "1px solid rgba(74,144,245,0.30)" : "1px solid rgba(255,255,255,0.07)",
        transition: `all .20s ease, opacity .45s ${delay}s cubic-bezier(.16,1,.3,1), transform .45s ${delay}s cubic-bezier(.16,1,.3,1)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4, letterSpacing: "-.01em" }}>{name}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,.38)", lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

// ── Mini orb (WebGL) ──────────────────────────────────────────────────────────
const MV = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;
const MF = `
precision highp float;
uniform float u_t; uniform vec2 u_res; uniform float u_mode;
#define TAU 6.28318530718
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){return n(p)*.5+n(p*2.1+vec2(1.7,9.2))*.25+n(p*4.3)*.125;}
vec3 film(float c,float th){float o=2.*th*sqrt(max(0.,1.-(1./2.1025)*(1.-c*c)));return .5+.5*cos(TAU*o/vec3(.65,.55,.45));}
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.; uv.x*=u_res.x/u_res.y;
  vec3 ro=vec3(0.,0.,2.3),rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd),c=dot(ro,ro)-.78*.78,d=b*b-c;
  if(d<0.){gl_FragColor=vec4(0.);return;}
  float sq=sqrt(d),t1=max(-b-sq,0.),t2=-b+sq;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  float aa=smoothstep(0.,.005,sq);
  vec3 pF=ro+rd*t1,N=normalize(pF),V=-rd;
  float NoV=max(dot(N,V),0.);
  float phi=atan(pF.z,pF.x),th=acos(clamp(pF.y/max(length(pF),.001),-1.,1.));
  vec3 f=film(NoV,.28+fbm(vec2(phi*.6+u_t*.020,th-.015*u_t))*.65);
  float fr=min(.06+(1.-.06)*pow(1.-NoV,4.)+pow(1.-NoV,5.5)*1.1,.98);
  float m=mod(u_mode,3.);
  vec3 bA=mix(vec3(.06,.10,.42),vec3(.55,.68,.96),NoV*.6);
  vec3 bB=mix(vec3(.04,.22,.18),vec3(.25,.78,.65),NoV*.6);
  vec3 bC=mix(vec3(.22,.08,.42),vec3(.68,.52,.95),NoV*.6);
  vec3 base=m<1.?bA:m<2.?bB:bC;
  vec3 col=mix(base,f*.98,.82)+vec3(.25,.50,1.)*pow(1.-NoV,5.5)*1.1*.5;
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  gl_FragColor=vec4(clamp(col,0.,1.)*aa,aa);
}`;

function MiniOrb({ size, mode = 0 }: { size: number; mode?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size*dpr); c.height = Math.round(size*dpr);
    const gl = c.getContext("webgl",{alpha:true,premultipliedAlpha:false})!;
    if(!gl) return;
    const mkS = (t:number,s:string) => { const sh=gl.createShader(t)!; gl.shaderSource(sh,s); gl.compileShader(sh); return sh; };
    const p = gl.createProgram()!;
    gl.attachShader(p,mkS(gl.VERTEX_SHADER,MV)); gl.attachShader(p,mkS(gl.FRAGMENT_SHADER,MF));
    gl.linkProgram(p); gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const al=gl.getAttribLocation(p,"a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const uT=gl.getUniformLocation(p,"u_t"),uR=gl.getUniformLocation(p,"u_res"),uM=gl.getUniformLocation(p,"u_mode");
    const draw=(ts:number)=>{
      gl.viewport(0,0,c.width,c.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,ts*.001); gl.uniform2f(uR,c.width,c.height); gl.uniform1f(uM,mode);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  },[size,mode]);
  return <canvas ref={ref} style={{width:size,height:size,display:"block",filter:"drop-shadow(0 0 28px rgba(80,130,255,.55))"}} />;
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  const { ref, visible } = useReveal(0.5);
  return (
    <div ref={ref} style={{
      display:"flex", alignItems:"center", gap:20, maxWidth:960, margin:"0 auto", padding:"0 40px",
      opacity: visible ? 1 : 0, transition: "opacity .8s",
    }}>
      <div style={{flex:1, height:1, background:"rgba(255,255,255,.08)"}} />
      <span style={{fontSize:10, letterSpacing:".14em", color:"rgba(255,255,255,.24)", textTransform:"uppercase", whiteSpace:"nowrap"}}>{label}</span>
      <div style={{flex:1, height:1, background:"rgba(255,255,255,.08)"}} />
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, pct, note, delay }: { label: string; pct: number; note: string; delay: number }) {
  const { ref, visible } = useReveal(0.2);
  return (
    <div ref={ref} style={{ marginBottom: 20, opacity: visible ? 1 : 0, transition: `opacity .5s ${delay}s` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,.75)" }}>{label} Layer</span>
        <span style={{ fontSize:13, fontWeight:600, color:"#F5C642" }}>{pct}%</span>
      </div>
      <div style={{ height:3, background:"rgba(255,255,255,.08)", borderRadius:2, marginBottom:6, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:2,
          width: visible ? `${pct}%` : "0%",
          background:"linear-gradient(90deg,#F5C642,#ffe47a)",
          transition: `width 1.1s ${delay + 0.1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <p style={{ fontSize:11, color:"rgba(255,255,255,.32)", fontWeight:300 }}>{note}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate  = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const BG    = "#080b18";
  const BG2   = "#0b0f22";
  const BG3   = "#0d1228";

  return (
    <div style={{ fontFamily:"'Afacad Flux',sans-serif", background:BG, color:"#fff", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:rgba(255,220,80,.26); color:#fff; }
        html { scroll-behavior: smooth; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.35); font-weight:500; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        padding:"0 44px", height:60,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background: scrollY > 40 ? "rgba(8,11,24,0.90)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(18px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition:"all .35s ease",
      }}>
        <button onClick={() => navigate("/")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"baseline"}}>
          <span style={{fontSize:16,fontWeight:800,color:"rgba(255,255,255,.88)"}}>EVERY</span>
          <span style={{fontSize:16,fontWeight:800,color:"rgba(255,255,255,.30)"}}>WHERE</span>
          <span style={{fontSize:9,fontWeight:600,letterSpacing:".14em",color:"rgba(255,255,255,.24)",marginLeft:5,textTransform:"uppercase"}}>Studio</span>
        </button>
        <button onClick={() => navigate("/auth")} style={{
          background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.11)",
          borderRadius:100, padding:"8px 22px", color:"rgba(255,255,255,.75)",
          fontSize:14, fontWeight:500, fontFamily:"'Afacad Flux',sans-serif",
          transition:"background .2s",
        }}
          onMouseEnter={e=>{(e.target as HTMLElement).style.background="rgba(255,255,255,.13)";}}
          onMouseLeave={e=>{(e.target as HTMLElement).style.background="rgba(255,255,255,.07)";}}
        >Get Early Access</button>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"130px 44px 90px",
        background:`radial-gradient(ellipse at 50% 38%, #2535c8 0%, #131a6e 42%, ${BG} 72%)`,
        position:"relative", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", inset:0, opacity:0.035,
          backgroundImage:"linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
          backgroundSize:"60px 60px",
        }}/>
        <div style={{position:"relative",zIndex:2,textAlign:"center",maxWidth:820}}>
          <Reveal delay={0}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
              <MiniOrb size={110} mode={0} />
            </div>
          </Reveal>
          <RevealText text="One idea. Everywhere." size="clamp(52px,8vw,100px)" weight={700} lineHeight={.94} color="#fff" center delay={0.05} />
          <div style={{marginTop:22}}>
            <RevealText
              text="EVERYWHERE Studio orchestrates your thinking into content that reaches every audience you have, with the fidelity of your voice, the strategy of a team, and the speed of AI."
              size="clamp(16px,2.1vw,20px)" weight={400} lineHeight={1.65} color="rgba(255,255,255,.52)" center delay={0.25} maxWidth="660px"
            />
          </div>
          <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:52,flexWrap:"wrap"}}>
            {([["40", "Specialized Agents"],["12","Output Formats"],["07","Quality Gates"],["94.7","Voice Fidelity"]] as [string,string][]).map(([n,l],i) => (
              <StatCard key={i} num={n} label={l} delay={0.35 + i * 0.07} />
            ))}
          </div>
        </div>
        <div style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",opacity:.35,textAlign:"center"}}>
          <div style={{width:1,height:44,background:"rgba(255,255,255,.35)",margin:"0 auto 8px",animation:"float 2.2s ease-in-out infinite"}} />
          <div style={{fontSize:10,letterSpacing:".14em",color:"rgba(255,255,255,.45)",textTransform:"uppercase"}}>Scroll</div>
        </div>
      </section>

      <div style={{padding:"80px 0 60px"}}><SectionDivider label="The Three Rooms" /></div>

      {/* ── WATCH ─────────────────────────────────────────────────────────── */}
      <section style={{padding:"80px 44px 120px",background:BG2,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px 64px",alignItems:"center"}} className="section-grid">
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
            <div style={{animation:"float 4.2s ease-in-out infinite"}}>
              <MiniOrb size={220} mode={0} />
            </div>
            <Reveal delay={0.1}>
              <div style={{textAlign:"center"}}>
                <p className="eyebrow" style={{marginBottom:8,color:"rgba(100,160,255,.65)"}}>Room One</p>
                <div style={{fontSize:34,fontWeight:800,color:"#fff",letterSpacing:"-.02em"}}>WATCH</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.35)",marginTop:5}}>The Signal Room</div>
              </div>
            </Reveal>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:26}}>
            <RevealText text="Signal, not noise." size="clamp(26px,3.2vw,40px)" weight={700} lineHeight={1.1} color="#fff" delay={0.1} />
            <RevealText
              text="Before a word gets written, EVERYWHERE Studio does the intelligence work. Sentinel monitors your category overnight, surfacing what's moving, what's forming, what has your name on it."
              size={15} weight={300} lineHeight={1.72} color="rgba(255,255,255,.52)" delay={0.22}
            />
            <Reveal delay={0.32}>
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden",marginTop:8}}>
                {["Overnight category monitoring","Content triggers with ready angles","Competitor intelligence","Event radar with local scope","Fish Score signal ranking"].map((item,j) => (
                  <FeatureItem key={j} text={item} accent="#4a90f5" delay={0.32 + j * 0.06} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div style={{padding:"20px 0 60px"}}><SectionDivider label="Then" /></div>

      {/* ── WORK ──────────────────────────────────────────────────────────── */}
      <section style={{padding:"80px 44px 120px",background:BG3,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px 64px",alignItems:"center"}} className="section-grid">
          <div style={{display:"flex",flexDirection:"column",gap:26}}>
            <RevealText text="The interview before the essay." size="clamp(26px,3.2vw,40px)" weight={700} lineHeight={1.1} color="#fff" delay={0.1} />
            <RevealText
              text="Watson, your First Listener, interviews you. Not a form. Not a prompt. A conversation. Watson asks the questions that pull the real story out, the one that was stuck in your head."
              size={15} weight={300} lineHeight={1.72} color="rgba(255,255,255,.52)" delay={0.22}
            />
            <Reveal delay={0.3}>
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden",marginTop:8}}>
                {["Watson conversation-first production","Voice DNA, 3 layers deep","7 Quality Gates in sequence","Betterish Score 0 to 1000","12 output formats per session"].map((item,j) => (
                  <FeatureItem key={j} text={item} accent="#C8961A" delay={0.30 + j * 0.06} />
                ))}
              </div>
            </Reveal>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
            <div style={{animation:"float 4.8s ease-in-out infinite"}}>
              <MiniOrb size={220} mode={1} />
            </div>
            <Reveal delay={0.1}>
              <div style={{textAlign:"center"}}>
                <p className="eyebrow" style={{marginBottom:8,color:"rgba(200,150,26,.65)"}}>Room Two</p>
                <div style={{fontSize:34,fontWeight:800,color:"#fff",letterSpacing:"-.02em"}}>WORK</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.35)",marginTop:5}}>The Engine Room</div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Voice DNA */}
        <div style={{maxWidth:1120,margin:"72px auto 0"}}>
          <Reveal delay={0.1}>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"44px 52px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"start"}} className="voice-grid">
                <div>
                  <p className="eyebrow" style={{marginBottom:16}}>Voice DNA</p>
                  <RevealText text="It learns your voice. Permanently." size="clamp(26px,3vw,36px)" weight={700} lineHeight={1.1} color="#fff" delay={0.1} italic={false} />
                  <div style={{marginTop:14}}>
                    <RevealText
                      text="A 15-minute conversation. Three extracted layers. A Voice Fidelity Score that climbs with every session. The longer you use EVERYWHERE Studio, the more it sounds like you."
                      size={14} weight={300} lineHeight={1.72} color="rgba(255,255,255,.48)" delay={0.22}
                    />
                  </div>
                  <div style={{marginTop:20}}>
                    <RevealText
                      text="Competitors can copy the output format. They cannot copy the system underneath it."
                      size={13} weight={300} lineHeight={1.65} color="rgba(255,255,255,.32)" delay={0.32}
                    />
                  </div>
                  <Reveal delay={0.4}>
                    <div style={{marginTop:24,padding:"20px 24px",background:"rgba(245,198,66,.08)",border:"1px solid rgba(245,198,66,.18)",borderRadius:12}}>
                      <div style={{fontSize:11,letterSpacing:".1em",color:"rgba(245,198,66,.6)",textTransform:"uppercase",marginBottom:6}}>Voice Fidelity Score</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                        <span style={{fontSize:60,fontWeight:800,color:"#F5C642",letterSpacing:"-2px",lineHeight:1}}>94.7</span>
                        <span style={{fontSize:12,color:"rgba(255,255,255,.32)"}}>/ 100 &nbsp; +2.3 this week</span>
                      </div>
                    </div>
                  </Reveal>
                </div>
                <div style={{paddingTop:8}}>
                  <ScoreBar label="Voice"       pct={97} note="Rhythm, cadence, signature constructions"    delay={0.2} />
                  <ScoreBar label="Value"       pct={94} note="Positions, beliefs, what you will not compromise" delay={0.3} />
                  <ScoreBar label="Personality" pct={91} note="Tone, warmth, what makes you recognizable"   delay={0.4} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 12 Formats */}
      <section style={{padding:"80px 44px",background:BG,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{maxWidth:480,marginBottom:56}}>
            <p className="eyebrow" style={{marginBottom:16}}>Output Formats</p>
            <RevealText text="One idea, twelve formats." size="clamp(30px,4vw,52px)" weight={700} lineHeight={1.05} color="#fff" delay={0.1} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}} className="fmt-grid">
            {FORMATS_DATA.map((f,i) => <FormatCard key={i} name={f.name} desc={f.desc} delay={0.08 + i * 0.04} />)}
          </div>
        </div>
      </section>

      <div style={{padding:"20px 0 60px"}}><SectionDivider label="Then" /></div>

      {/* ── WRAP ──────────────────────────────────────────────────────────── */}
      <section style={{padding:"80px 44px 120px",background:BG2,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px 64px",alignItems:"center"}} className="section-grid">
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
            <div style={{animation:"float 5s ease-in-out infinite"}}>
              <MiniOrb size={220} mode={2} />
            </div>
            <Reveal delay={0.1}>
              <div style={{textAlign:"center"}}>
                <p className="eyebrow" style={{marginBottom:8,color:"rgba(160,128,245,.65)"}}>Room Three</p>
                <div style={{fontSize:34,fontWeight:800,color:"#fff",letterSpacing:"-.02em"}}>WRAP</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.35)",marginTop:5}}>The Distribution Room</div>
              </div>
            </Reveal>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:26}}>
            <RevealText text="Every audience it deserves." size="clamp(26px,3.2vw,40px)" weight={700} lineHeight={1.1} color="#fff" delay={0.1} />
            <RevealText
              text="Real publishing means every piece of thinking reaches every audience it deserves, in the format that audience actually uses, with nothing left on the table."
              size={15} weight={300} lineHeight={1.72} color="rgba(255,255,255,.52)" delay={0.22}
            />
            <Reveal delay={0.3}>
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden",marginTop:8}}>
                {["12 format outputs from one session","Platform-native formatting","One-click export to all channels","Impact tracking and performance loop","Content calendar and scheduling"].map((item,j) => (
                  <FeatureItem key={j} text={item} accent="#a080f5" delay={0.30 + j * 0.06} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 7 QUALITY GATES ───────────────────────────────────────────────── */}
      <section style={{padding:"100px 44px",background:BG3,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:920,margin:"0 auto",textAlign:"center"}}>
          <p className="eyebrow" style={{marginBottom:16}}>Quality Gates</p>
          <RevealText text="Seven gates. Everything clears all of them." size="clamp(30px,4.5vw,54px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.05} />
          <div style={{marginTop:14}}>
            <RevealText
              text="A pipeline, not a checklist. Each gate's output feeds the next. Nothing ships without clearing all seven."
              size={16} weight={300} lineHeight={1.65} color="rgba(255,255,255,.45)" center delay={0.2} maxWidth="600px"
            />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14,marginTop:52}}>
            {GATES_DATA.map((g,i) => <GateCard key={i} {...g} delay={0.08 + i * 0.06} />)}
          </div>
        </div>
      </section>

      {/* ── ABOUT MARK ────────────────────────────────────────────────────── */}
      <section style={{padding:"100px 44px",background:BG,borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <p className="eyebrow" style={{marginBottom:24}}>The Founder</p>
          <Reveal delay={0.1}>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:44,alignItems:"start"}} className="mark-grid">
              <div style={{
                width:72,height:72,borderRadius:12,background:"#111110",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                border:"1px solid rgba(240,180,41,0.22)",
              }}>
                <span style={{fontSize:22,fontWeight:800,color:"#F0B429",letterSpacing:"-0.5px"}}>MS</span>
              </div>
              <div>
                <RevealText text="Mark Sylvester" size="clamp(22px,2.5vw,34px)" weight={700} color="#fff" delay={0.15} />
                <Reveal delay={0.25}>
                  <blockquote style={{borderLeft:"2px solid rgba(240,180,41,.35)",paddingLeft:22,margin:"18px 0"}}>
                    <p style={{fontSize:17,lineHeight:1.78,color:"rgba(255,255,255,.80)",fontWeight:300,fontStyle:"italic"}}>
                      "I spent years helping others find and share their voice. EVERYWHERE Studio is what I wish I had. It doesn't replace the thinking. It removes every obstacle between the thinking and the audience."
                    </p>
                  </blockquote>
                </Reveal>
                <RevealText
                  text="Executive producer, TEDxSantaBarbara. Entrepreneur. Founder of Mixed Grill LLC."
                  size={14} weight={300} color="rgba(255,255,255,.38)" delay={0.4}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding:"120px 44px 100px",
        background:`radial-gradient(ellipse at 50% 100%, #2535c8 0%, #0d1040 48%, ${BG} 75%)`,
        textAlign:"center", borderTop:"1px solid rgba(255,255,255,.05)",
      }}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <Reveal delay={0}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:32}}>
              <MiniOrb size={96} mode={0} />
            </div>
          </Reveal>
          <RevealText
            text="Your thinking deserves to be everywhere."
            size="clamp(34px,5vw,64px)" weight={700} lineHeight={1.05} color="#fff" center delay={0.1}
          />
          <div style={{marginTop:14}}>
            <RevealText
              text="Join thought leaders building their content presence with EVERYWHERE Studio."
              size={17} weight={300} lineHeight={1.65} color="rgba(255,255,255,.48)" center delay={0.28}
            />
          </div>
          <Reveal delay={0.42}>
            <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:48,flexWrap:"wrap"}}>
              <button onClick={() => navigate("/auth")} style={{
                background:"#fff",border:"none",borderRadius:100,padding:"15px 48px",
                fontSize:15,fontWeight:700,color:"#1e2da0",fontFamily:"'Afacad Flux',sans-serif",
                boxShadow:"0 8px 40px rgba(80,100,255,.38)",transition:"all .3s cubic-bezier(.16,1,.3,1)",
              }}
                onMouseEnter={e=>{(e.target as HTMLElement).style.transform="translateY(-3px) scale(1.02)";}}
                onMouseLeave={e=>{(e.target as HTMLElement).style.transform="none";}}
              >Get Early Access</button>
              <button onClick={() => navigate("/studio/dashboard")} style={{
                background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.14)",
                borderRadius:100,padding:"15px 48px",fontSize:15,fontWeight:500,
                color:"rgba(255,255,255,.75)",fontFamily:"'Afacad Flux',sans-serif",
                transition:"background .2s",
              }}
                onMouseEnter={e=>{(e.target as HTMLElement).style.background="rgba(255,255,255,.13)";}}
                onMouseLeave={e=>{(e.target as HTMLElement).style.background="rgba(255,255,255,.07)";}}
              >Open Studio</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{padding:"28px 44px",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"baseline"}}>
          <span style={{fontSize:14,fontWeight:800,color:"rgba(255,255,255,.60)"}}>EVERY</span>
          <span style={{fontSize:14,fontWeight:800,color:"rgba(255,255,255,.22)"}}>WHERE</span>
          <span style={{fontSize:9,fontWeight:600,letterSpacing:".14em",color:"rgba(255,255,255,.18)",marginLeft:5,textTransform:"uppercase"}}>Studio</span>
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,.20)",letterSpacing:".04em"}}>2025 Mixed Grill LLC &nbsp;·&nbsp; Ideas to Impact</span>
      </footer>

      <style>{`
        @media(max-width:820px){
          .section-grid,.voice-grid,.mark-grid{grid-template-columns:1fr!important}
          .fmt-grid{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>
    </div>
  );
}
