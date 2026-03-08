import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE v9
// Apple AirPods-grade scroll experience.
// Scroll-scrubbed Siri orb · Sticky section panels · Word-by-word reveals
// Scroll-linked counters · Generative canvas visuals · No stock photos.
// ─────────────────────────────────────────────────────────────────────────────

// ── WebGL Siri Orb ────────────────────────────────────────────────────────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const SIRI_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform vec3  u_tint;
#define PI  3.14159265358979

mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float lobe(vec3 p, vec3 center, float radius){
  float d = length(p - center);
  return exp(-d*d / (radius*radius));
}

void main(){
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  uv.x *= u_res.x / u_res.y;

  vec3 ro = vec3(0., 0., 2.4);
  vec3 rd = normalize(vec3(uv, -1.7));

  float R = 0.78;
  float b = dot(ro, rd);
  float c = dot(ro, ro) - R*R;
  float disc = b*b - c;
  if(disc < 0.0){ gl_FragColor = vec4(0.); return; }

  float sqD = sqrt(disc);
  float edgeAA = smoothstep(0., 0.005, sqD);
  float t1 = max(-b - sqD, 0.0);
  float t2 = -b + sqD;
  if(t2 < 0.0){ gl_FragColor = vec4(0.); return; }

  vec3 hitFront = ro + rd * t1;
  vec3 N = normalize(hitFront);
  vec3 V = -rd;
  float NoV = max(dot(N, V), 0.0);

  float rx = u_mouse.y * 0.9;
  float ry = u_mouse.x * 0.9;

  float spd = 1.0 + u_energy * 2.8;
  float t = u_t * spd;

  vec3 c1 = vec3(sin(t*0.41+0.0)*0.38, cos(t*0.37+1.1)*0.35, sin(t*0.29+2.3)*0.30);
  vec3 c2 = vec3(sin(t*0.53+3.5)*0.42, cos(t*0.44+0.7)*0.38, sin(t*0.35+1.8)*0.32);
  vec3 c3 = vec3(cos(t*0.38+2.1)*0.36, sin(t*0.61+4.2)*0.30, cos(t*0.47+0.4)*0.34);
  vec3 c4 = vec3(cos(t*0.28+5.1)*0.40, sin(t*0.33+2.8)*0.36, cos(t*0.52+3.3)*0.28);

  vec3 col1 = mix(vec3(0.95, 0.18, 0.32), u_tint, 0.55);
  vec3 col2 = mix(vec3(0.10, 0.85, 0.90), u_tint, 0.45);
  vec3 col3 = mix(vec3(0.55, 0.28, 1.00), u_tint, 0.60);
  vec3 col4 = mix(vec3(0.20, 0.60, 1.00), u_tint, 0.50);

  float span = t2 - t1;
  vec3 interior = vec3(0.);
  for(int i = 0; i < 12; i++){
    float fi = float(i) / 11.0;
    vec3 p = ro + rd * (t1 + span * (fi * 0.88 + 0.06));
    p.yz = rot2(rx) * p.yz;
    p.xz = rot2(ry) * p.xz;
    float l1 = lobe(p, c1, 0.36);
    float l2 = lobe(p, c2, 0.40);
    float l3 = lobe(p, c3, 0.33);
    float l4 = lobe(p, c4, 0.38);
    float depth = 1.0 - fi * 0.5;
    interior += (col1*l1*1.8 + col2*l2*1.6 + col3*l3*1.5 + col4*l4*1.4) * depth;
  }
  interior /= 12.0;
  interior *= 1.0 + u_energy * 0.9;

  float fresnel = pow(1.0 - NoV, 3.5);
  vec3 shellTint = mix(
    mix(vec3(0.60,0.75,1.00), u_tint, 0.3),
    vec3(0.90,0.95,1.00),
    fresnel
  );

  vec3 L1 = normalize(vec3(-0.5, 0.9, 0.6));
  vec3 H1 = normalize(L1 + V);
  float spec1 = pow(max(dot(N,H1),0.0), 220.0) * 2.2;
  vec3 L2 = normalize(vec3(0.7,0.2,0.8));
  vec3 H2 = normalize(L2 + V);
  float spec2 = pow(max(dot(N,H2),0.0), 80.0) * 0.5;

  float glassAlpha = 0.18 + fresnel * 0.68;
  vec3 transmitted = interior * (1.0 - glassAlpha * 0.6);
  vec3 reflected = shellTint * glassAlpha;
  vec3 col = transmitted + reflected;
  col += vec3(1.0,0.98,0.95) * (spec1 + spec2);

  float centerGlow = exp(-dot(uv,uv)*2.8) * 0.35 * (1.0 + u_energy * 0.6);
  col += mix(vec3(0.6,0.8,1.0), u_tint, 0.4) * centerGlow;

  col = col / (col + 0.9);
  col = pow(max(col,0.0), vec3(0.88));

  float alpha = edgeAA * (0.82 + fresnel * 0.18);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

class OrbSpring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(stiffness=0.062, damping=0.86){
    this.vx+=(this.tx-this.x)*stiffness; this.vy+=(this.ty-this.y)*stiffness;
    this.vx*=damping; this.vy*=damping;
    this.x+=this.vx; this.y+=this.vy;
  }
}

const TINTS: Record<string, [number,number,number]> = {
  hero:  [0.20, 0.55, 1.00],
  watch: [0.20, 0.55, 1.00],
  work:  [0.10, 0.85, 0.90],
  wrap:  [0.55, 0.28, 1.00],
};

function ScrollOrb({ size, energy, tint }: { size: number; energy: number; tint: [number,number,number] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new OrbSpring());
  const raf = useRef(0);
  const energyRef = useRef(energy);
  const tintRef = useRef(tint);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => { energyRef.current = energy; }, [energy]);
  useEffect(() => { tintRef.current = tint; }, [tint]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const mkS = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, SIRI_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uT     = gl.getUniformLocation(prog, "u_t");
    const uR     = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uEnergy= gl.getUniformLocation(prog, "u_energy");
    const uTint  = gl.getUniformLocation(prog, "u_tint");

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / size) * 2 - 1,
        y: -((e.clientY - rect.top) / size) * 2 + 1,
      };
    };
    window.addEventListener("mousemove", onMove);

    const start = performance.now();
    const loop = () => {
      spring.current.tx = mouseRef.current.x * 0.4;
      spring.current.ty = mouseRef.current.y * 0.4;
      spring.current.step();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, (performance.now() - start) * 0.001);
      gl.uniform1f(uEnergy, energyRef.current);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uMouse, spring.current.x, spring.current.y);
      const t = tintRef.current;
      gl.uniform3f(uTint, t[0], t[1], t[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: "block" }} />;
}

// ── Canvas Visualizations ─────────────────────────────────────────────────────
function WatchCanvasFull() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; };
    resize();
    const ctx = c.getContext("2d")!;
    const ro = new ResizeObserver(resize); ro.observe(c);
    let angle = 0;
    const draw = () => {
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W/2, cy = H/2, maxR = Math.min(W, H) * 0.44;
      for (let i = 1; i <= 7; i++) {
        ctx.beginPath(); ctx.arc(cx, cy, (maxR * i) / 7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74,144,245,${0.04 + (i/7)*0.06})`; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.strokeStyle = "rgba(74,144,245,0.07)"; ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI*2; a += Math.PI/6) {
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a)); ctx.stroke();
      }
      const sweep = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      sweep.addColorStop(0, "rgba(74,144,245,0.22)"); sweep.addColorStop(1, "transparent");
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle - 1.2, angle); ctx.closePath();
      ctx.fillStyle = sweep; ctx.fill(); ctx.restore();
      const signals = [
        {r:maxR*0.28,a:0.8,size:3.5,pulse:1.4},{r:maxR*0.58,a:2.3,size:2.5,pulse:1.0},
        {r:maxR*0.71,a:4.1,size:4.0,pulse:1.8},{r:maxR*0.44,a:5.0,size:2.0,pulse:0.8},
        {r:maxR*0.85,a:1.5,size:3.0,pulse:1.2},{r:maxR*0.35,a:3.6,size:2.2,pulse:1.1},
        {r:maxR*0.62,a:0.3,size:2.8,pulse:1.6},{r:maxR*0.90,a:3.1,size:2.0,pulse:0.9},
      ];
      const t = Date.now() * 0.001;
      signals.forEach(({ r, a, size, pulse }) => {
        const x = cx + r * Math.cos(a); const y = cy + r * Math.sin(a);
        const p = size + Math.sin(t * pulse + a) * 1.2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p * 5);
        g.addColorStop(0, "rgba(74,144,245,0.5)"); g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(x, y, p * 5, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, p, 0, Math.PI*2);
        ctx.fillStyle = "rgba(74,144,245,0.9)"; ctx.fill();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
      ctx.fillStyle = "rgba(74,144,245,1)"; ctx.fill();
      angle += 0.01;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function WorkCanvasFull() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; };
    resize();
    const ctx = c.getContext("2d")!;
    const ro = new ResizeObserver(resize); ro.observe(c);
    const connections: [number,number][] = [];
    [0,1,2,3,4,5].forEach(i => connections.push([0, 1+i]));
    [0,1,2,3,4,5,6,7].forEach(i => connections.push([1+(i%6), 7+i]));
    connections.push([1,3],[2,4],[5,6]);
    let t = 0;
    const draw = () => {
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H); t += 0.008;
      const cx = W/2, cy = H/2, sc = Math.min(W,H)/420;
      const rawLayers = [
        [{x:0,y:0,r:7,label:"You"}],
        [{x:-80,y:-70,r:5,label:"NL"},{x:80,y:-80,r:5,label:"ES"},{x:110,y:30,r:5,label:"SS"},
         {x:30,y:105,r:5,label:"LI"},{x:-90,y:70,r:5,label:"PC"},{x:-35,y:-110,r:5,label:"VD"}],
        [{x:-155,y:-50,r:3.5,label:""},{x:-110,y:-140,r:3.5,label:""},{x:30,y:-165,r:3.5,label:""},
         {x:165,y:-85,r:3.5,label:""},{x:175,y:65,r:3.5,label:""},{x:80,y:165,r:3.5,label:""},
         {x:-80,y:160,r:3.5,label:""},{x:-165,y:90,r:3.5,label:""}],
      ];
      const nodes = ([] as typeof rawLayers[0]).concat(...rawLayers).map(n=>({...n,x:cx+n.x*sc,y:cy+n.y*sc,r:n.r*sc}));
      connections.forEach(([a,b])=>{
        const na=nodes[a],nb=nodes[b];
        const pulse=0.5+0.5*Math.sin(t*2+a*0.7+b*0.5);
        ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb.x,nb.y);
        ctx.strokeStyle=`rgba(13,140,158,${0.06+pulse*0.14})`;ctx.lineWidth=0.8+pulse*0.6;ctx.stroke();
      });
      nodes.forEach((n,i)=>{
        const pulse=0.5+0.5*Math.sin(t*1.5+i*0.9);
        const rP=n.r*(1+pulse*0.25);
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,rP*5);
        g.addColorStop(0,`rgba(13,140,158,${0.4+pulse*0.25})`);g.addColorStop(1,"transparent");
        ctx.beginPath();ctx.arc(n.x,n.y,rP*5,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.beginPath();ctx.arc(n.x,n.y,rP,0,Math.PI*2);ctx.fillStyle="rgba(13,140,158,0.85)";ctx.fill();
        if(n.label&&n.r>=2){
          ctx.font=`600 ${Math.max(8,n.r*1.4)}px 'DM Sans',sans-serif`;
          ctx.fillStyle="rgba(255,255,255,0.9)";ctx.textAlign="center";ctx.textBaseline="middle";
          ctx.fillText(n.label,n.x,n.y);
        }
      });
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(raf.current);ro.disconnect();};
  },[]);
  return <canvas ref={ref} style={{width:"100%",height:"100%",display:"block"}}/>;
}

function WrapCanvasFull() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(()=>{
    const c=ref.current!;
    const dpr=window.devicePixelRatio||1;
    const resize=()=>{c.width=c.offsetWidth*dpr;c.height=c.offsetHeight*dpr;};
    resize();
    const ctx=c.getContext("2d")!;
    const ro=new ResizeObserver(resize);ro.observe(c);
    const platforms=[
      {a:-0.5,label:"LI"},{a:0.4,label:"NL"},{a:1.3,label:"YT"},
      {a:2.1,label:"TW"},{a:3.0,label:"SC"},{a:4.0,label:"SB"},{a:4.9,label:"IG"},
    ];
    const rings=[{born:0},{born:0.8},{born:1.6},{born:2.4}];
    let t=0;const period=3.2;
    const draw=()=>{
      const W=c.width,H=c.height;
      ctx.clearRect(0,0,W,H);t+=0.016;
      const cx=W/2,cy=H/2,maxR=Math.min(W,H)*0.4,sc=Math.min(W,H)/420;
      rings.forEach(({born})=>{
        const phase=((t+born)%period)/period;
        const r=Math.min(phase*maxR*0.6*(period/0.6),maxR);
        const alpha=Math.max(0,1-r/maxR);
        ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle=`rgba(160,128,245,${alpha*0.55})`;ctx.lineWidth=1.5;ctx.stroke();
      });
      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,38*sc);
      glow.addColorStop(0,"rgba(160,128,245,0.35)");glow.addColorStop(1,"transparent");
      ctx.beginPath();ctx.arc(cx,cy,38*sc,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy,16*sc,0,Math.PI*2);ctx.fillStyle="rgba(160,128,245,0.85)";ctx.fill();
      ctx.font=`600 ${10*sc}px 'DM Sans',sans-serif`;
      ctx.fillStyle="rgba(255,255,255,0.9)";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("EW",cx,cy);
      platforms.forEach(({a,label})=>{
        const r=148*sc,x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);
        const pulse=0.5+0.5*Math.sin(t*1.2+a);
        const linePhase=((t+a*0.3)%period)/period;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);
        ctx.strokeStyle=`rgba(160,128,245,${0.04+linePhase*0.18})`;ctx.lineWidth=0.7;ctx.stroke();
        const g=ctx.createRadialGradient(x,y,0,x,y,16*sc);
        g.addColorStop(0,`rgba(160,128,245,${0.3+pulse*0.2})`);g.addColorStop(1,"transparent");
        ctx.beginPath();ctx.arc(x,y,16*sc,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.beginPath();ctx.arc(x,y,7*sc,0,Math.PI*2);ctx.fillStyle="rgba(160,128,245,0.78)";ctx.fill();
        ctx.font=`500 ${7.5*sc}px 'DM Sans',sans-serif`;
        ctx.fillStyle="rgba(255,255,255,0.85)";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(label,x,y);
      });
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(raf.current);ro.disconnect();};
  },[]);
  return <canvas ref={ref} style={{width:"100%",height:"100%",display:"block"}}/>;
}

// ── Scroll-tied word reveal ───────────────────────────────────────────────────
function ScrollWords({ text, scrollProgress, startAt, endAt, size, weight = 700, color = "#E8E8E6", lineHeight = 1.1 }: {
  text: string; scrollProgress: number; startAt: number; endAt: number;
  size: string | number; weight?: number; color?: string; lineHeight?: number;
}) {
  const words = text.split(" ");
  const range = endAt - startAt;
  return (
    <div style={{ lineHeight, fontSize: size, fontWeight: weight, color }}>
      {words.map((word, i) => {
        const wordStart = startAt + (i / words.length) * range;
        const wordEnd = wordStart + range / words.length * 1.8;
        const p = Math.min(1, Math.max(0, (scrollProgress - wordStart) / (wordEnd - wordStart)));
        return (
          <span key={i} style={{
            display: "inline-block", marginRight: "0.28em",
            opacity: p, transform: `translateY(${(1-p)*12}px)`,
            transition: "none", willChange: "opacity, transform",
          }}>{word}</span>
        );
      })}
    </div>
  );
}

// ── Intersection reveal ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)",
      transition: `opacity .7s ${delay}s cubic-bezier(.16,1,.3,1), transform .7s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

function Reveal({ text, delay = 0, size = "inherit", weight = 400, color = "inherit", lineHeight = 1.2, center = false }: {
  text: string; delay?: number; size?: string | number; weight?: number;
  color?: string; lineHeight?: number; center?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ textAlign: center ? "center" : "left" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.26em",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)",
          transition: `opacity .55s ${delay + i * 0.028}s ease, transform .55s ${delay + i * 0.028}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

// ── Scroll counter ────────────────────────────────────────────────────────────
function ScrollCounter({ target, scrollProgress, startAt, endAt, suffix = "", label }: {
  target: number; scrollProgress: number; startAt: number; endAt: number; suffix?: string; label: string;
}) {
  const p = Math.min(1, Math.max(0, (scrollProgress - startAt) / (endAt - startAt)));
  const val = Math.round(p * target);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(52px,6vw,84px)", fontWeight: 800, letterSpacing: "-.05em", color: "#E8E8E6", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {val}{suffix}
      </div>
      <div style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(232,232,230,0.28)", textTransform: "uppercase", marginTop: 10, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Feature line ──────────────────────────────────────────────────────────────
function FeatureLine({ num, title, desc, delay = 0, accent }: {
  num: string; title: string; desc: string; delay?: number; accent: string;
}) {
  return (
    <FadeIn delay={delay}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0 20px", paddingBottom: 18, paddingTop: 4, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: accent, opacity: 0.65, letterSpacing: ".06em" }}>{num}</span>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#E8E8E6" }}>{title}</span>
          <span style={{ fontSize: 13, color: "rgba(232,232,230,0.42)", lineHeight: 1.6, marginLeft: 10 }}>{desc}</span>
        </div>
      </div>
    </FadeIn>
  );
}

// ── Gate row ──────────────────────────────────────────────────────────────────
function GateRow({ num, name, desc, color, delay }: { num: string; name: string; desc: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "grid", gridTemplateColumns: "36px 160px 1fr", gap: "0 28px", padding: "20px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      opacity: vis ? 1 : 0, transform: vis ? "translateX(0)" : "translateX(-14px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, opacity: 0.65, letterSpacing: ".08em" }}>{num}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#E8E8E6" }}>{name}</span>
      <span style={{ fontSize: 13, color: "rgba(232,232,230,0.42)", lineHeight: 1.6 }}>{desc}</span>
    </div>
  );
}

// ── DNA bar ───────────────────────────────────────────────────────────────────
function DnaBar({ label, score, delay = 0, accent }: { label: string; score: number; delay?: number; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "center", gap: 16,
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(-8px)",
      transition: `opacity .6s ${delay}s ease, transform .6s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 12, color: "rgba(232,232,230,0.38)", width: 180, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)", position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          width: vis ? `${score}%` : "0%",
          transition: `width 1.2s ${delay + 0.1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#E8E8E6", width: 24, textAlign: "right" }}>{score}</div>
    </div>
  );
}

// ── Output formats ticker ─────────────────────────────────────────────────────
function OutputTicker() {
  const formats = ["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"];
  const doubled = [...formats, ...formats];
  return (
    <div style={{ overflow: "hidden", maskImage: "linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)", WebkitMaskImage: "linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)" }}>
      <style>{`@keyframes ew-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ew-ticker{display:flex;width:max-content;animation:ew-ticker 28s linear infinite}.ew-ticker:hover{animation-play-state:paused}`}</style>
      <div className="ew-ticker">
        {doubled.map((f,i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: "rgba(232,232,230,0.28)", padding: "6px 24px", whiteSpace: "nowrap", letterSpacing: ".03em" }}>
            {f}<span style={{ display: "inline-block", width: 1, height: 10, background: "rgba(255,255,255,0.1)", margin: "0 0 0 24px" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Wordmark rotator ──────────────────────────────────────────────────────────
function WordmarkRotator() {
  const words = ["Studio","Intelligence","System"];
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setFading(true); setTimeout(() => { setIdx(i => (i+1)%words.length); setFading(false); }, 380); }, 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: "inline-block", opacity: fading ? 0 : 1, transform: fading ? "translateY(-3px)" : "translateY(0)", transition: "opacity .38s ease, transform .38s ease", color: "rgba(232,232,230,0.38)", fontWeight: 300 }}>
      {words[idx]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [orbSection, setOrbSection] = useState<"hero"|"watch"|"work"|"wrap">("hero");
  const [orbEnergy, setOrbEnergy] = useState(0.1);

  const watchRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const totalH = document.body.scrollHeight - window.innerHeight;
      setScrollY(sy);
      setScrollProgress(sy / Math.max(totalH, 1));

      const getRect = (el: HTMLElement | null) => el?.getBoundingClientRect() ?? null;
      const watchEl = getRect(watchRef.current);
      const workEl = getRect(workRef.current);
      const wrapEl = getRect(wrapRef.current);
      const vh = window.innerHeight;

      if (wrapEl && wrapEl.top < vh * 0.65 && wrapEl.bottom > 0) {
        const p = Math.max(0, Math.min(1, -wrapEl.top / (wrapEl.height - vh)));
        setOrbSection("wrap"); setOrbEnergy(Math.min(1, p * 1.4 + 0.1));
      } else if (workEl && workEl.top < vh * 0.65 && workEl.bottom > 0) {
        const p = Math.max(0, Math.min(1, -workEl.top / (workEl.height - vh)));
        setOrbSection("work"); setOrbEnergy(Math.min(1, p * 1.4 + 0.1));
      } else if (watchEl && watchEl.top < vh * 0.65 && watchEl.bottom > 0) {
        const p = Math.max(0, Math.min(1, -watchEl.top / (watchEl.height - vh)));
        setOrbSection("watch"); setOrbEnergy(Math.min(1, p * 1.4 + 0.1));
      } else {
        setOrbSection("hero"); setOrbEnergy(0.1);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tint = TINTS[orbSection];
  const navBg = scrollY > 40 ? "rgba(7,9,15,0.92)" : "transparent";
  const line = "rgba(255,255,255,0.07)";
  const watchAccent = "#4A90F5";
  const workAccent = "#0D8C9E";
  const wrapAccent = "#A080F5";

  const orbGlowColor = orbSection === "watch" ? "rgba(74,144,245,0.35)" : orbSection === "work" ? "rgba(13,140,158,0.35)" : "rgba(160,128,245,0.35)";

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif", background: "#07090f", color: "#E8E8E6", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg, backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? `1px solid ${line}` : "none", transition: "all .4s ease",
      }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", display: "flex", alignItems: "baseline", cursor: "pointer" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#E8E8E6", letterSpacing: ".04em" }}>EVERY</span>
          <WordmarkRotator />
        </button>
        <button onClick={() => nav("/auth")} style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 100, padding: "7px 22px", color: "rgba(255,255,255,0.82)",
          fontSize: 13, fontWeight: 500, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer",
          backdropFilter: "blur(8px)", transition: "all .2s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
        >Get Early Access</button>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "130px 48px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(58,123,213,0.08) 0%, transparent 70%)" }} />

        {/* Sticky scroll-following orb */}
        <div style={{ position: "sticky", top: "calc(50vh - 130px)", zIndex: 10, display: "flex", justifyContent: "center", marginBottom: -260, pointerEvents: "none" }}>
          <div style={{ filter: `drop-shadow(0 0 80px ${orbGlowColor})`, transition: "filter 1.4s cubic-bezier(.16,1,.3,1)" }}>
            <ScrollOrb size={260} energy={orbEnergy} tint={tint} />
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 5, textAlign: "center", maxWidth: 900, marginTop: 60 }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", color: "rgba(232,232,230,0.28)", textTransform: "uppercase", marginBottom: 44, fontWeight: 500, opacity: Math.max(0, 1 - scrollY / 300) }}>
            Composed Intelligence
          </div>

          <div style={{ marginBottom: 36, opacity: Math.max(0, 1 - scrollY / 400) }}>
            <div style={{ fontSize: "clamp(56px,9vw,112px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .88, marginBottom: 8 }}>
              <ScrollWords text="Your thinking." scrollProgress={scrollProgress} startAt={0} endAt={0.06} size="1em" weight={800} color="#E8E8E6" lineHeight={.88} />
            </div>
            <div style={{ fontSize: "clamp(56px,9vw,112px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .88 }}>
              <ScrollWords text="Composed." scrollProgress={scrollProgress} startAt={0.01} endAt={0.07} size="1em" weight={800} color="#C8961A" lineHeight={.88} />
            </div>
          </div>

          <div style={{ maxWidth: 560, margin: "0 auto 40px", opacity: Math.max(0, 1 - scrollY / 350) }}>
            <Reveal text="You have the ideas, the expertise, and the point of view. What you don't have is the system to turn all of that into content that actually lands." size="clamp(15px,1.7vw,18px)" weight={400} lineHeight={1.75} color="rgba(232,232,230,0.50)" center delay={0.3} />
          </div>

          <div style={{ opacity: Math.max(0, 1 - scrollY / 300) }}>
            <FadeIn delay={0.5}>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => nav("/auth")} style={{ background: "#fff", border: "none", borderRadius: 100, padding: "13px 40px", fontSize: 14, fontWeight: 600, color: "#07090f", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".85"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>Get Early Access</button>
                <button onClick={() => document.getElementById("framework")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "13px 40px", fontSize: 14, fontWeight: 500, color: "rgba(232,232,230,0.60)", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)"; (e.currentTarget as HTMLElement).style.color = "#E8E8E6"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(232,232,230,0.60)"; }}>See How It Works</button>
              </div>
            </FadeIn>
          </div>

          <div style={{ marginTop: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: Math.max(0, 1 - scrollY / 200) * 0.3 }}>
            <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
              <rect x="1" y="1" width="14" height="20" rx="7" stroke="#E8E8E6" strokeWidth="1.2"/>
              <circle cx="8" cy="7" r="2" fill="#E8E8E6"/>
            </svg>
            <span style={{ fontSize: 9, letterSpacing: ".18em", color: "rgba(232,232,230,0.35)", textTransform: "uppercase" }}>Scroll</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          THE PROBLEM
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "140px 48px", borderTop: `1px solid ${line}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px 80px", alignItems: "start" }}>
          <div>
            <Reveal text="You already know what to say." size="clamp(32px,4.5vw,54px)" weight={700} lineHeight={1.05} color="#E8E8E6" delay={0.05} />
            <div style={{ marginTop: 16 }}>
              <Reveal text="The hard part is everything after that." size="clamp(17px,2vw,21px)" weight={400} lineHeight={1.5} color="rgba(232,232,230,0.35)" delay={0.15} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
            <Reveal text="Every thought leader faces the same bottleneck. You have insights worth sharing, but turning them into polished, multi-format content takes a team you don't have and time you can't spare." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.12} />
            <Reveal text="The AI tools move fast, but they flatten your voice into something generic. Ghostwriters get the tone right, but they cost $9,000 a month and still need you to do half the work." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.22} />
            <Reveal text="There's a gap between what exists and what you actually need. EVERYWHERE Studio was built to fill it." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.32} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FRAMEWORK + SCROLL-LINKED COUNTERS
      ══════════════════════════════════════════════════════ */}
      <section id="framework" style={{ padding: "80px 48px 0", borderTop: `1px solid ${line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center", paddingBottom: 64 }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".22em", color: "rgba(232,232,230,0.25)", textTransform: "uppercase", marginBottom: 28, fontWeight: 500 }}>The Framework</div>
          </FadeIn>
          <div style={{ fontSize: "clamp(44px,6.5vw,84px)", fontWeight: 800, letterSpacing: "-.04em", lineHeight: .92, marginBottom: 28 }}>
            <ScrollWords text="One idea in." scrollProgress={scrollProgress} startAt={0.08} endAt={0.16} size="1em" weight={800} color="#E8E8E6" />
            <ScrollWords text="Communications out." scrollProgress={scrollProgress} startAt={0.12} endAt={0.20} size="1em" weight={800} color="#C8961A" />
          </div>
          <FadeIn delay={0.2}>
            <div style={{ fontSize: 16, color: "rgba(232,232,230,0.38)", maxWidth: 460, margin: "0 auto" }}>
              EVERYWHERE Studio is the bridge between what you know and what the world sees.
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Counters */}
      <section style={{ padding: "60px 48px 100px", borderBottom: `1px solid ${line}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            <div style={{ padding: "48px 40px", borderRight: `1px solid ${line}` }}>
              <ScrollCounter target={40} scrollProgress={scrollProgress} startAt={0.12} endAt={0.22} suffix="+" label="AI Specialists" />
            </div>
            <div style={{ padding: "48px 40px", borderRight: `1px solid ${line}` }}>
              <ScrollCounter target={12} scrollProgress={scrollProgress} startAt={0.14} endAt={0.24} label="Output Formats" />
            </div>
            <div style={{ padding: "48px 40px" }}>
              <ScrollCounter target={7} scrollProgress={scrollProgress} startAt={0.16} endAt={0.26} label="Quality Gates" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WATCH — STICKY LEFT PANEL
      ══════════════════════════════════════════════════════ */}
      <div ref={watchRef} style={{ display: "flex", minHeight: "200vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", width: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(160deg, #060a18 0%, #070d1f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.55 }}><WatchCanvasFull /></div>
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 48px" }}>
            <div style={{ fontSize: 10, letterSpacing: ".24em", color: watchAccent, textTransform: "uppercase", marginBottom: 16, fontWeight: 600, opacity: 0.8 }}>Room One</div>
            <div style={{ fontSize: "clamp(60px,7vw,96px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: "#E8E8E6" }}>WATCH</div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(232,232,230,0.25)", textTransform: "uppercase", marginTop: 14, fontWeight: 500 }}>The Signal Room</div>
            <div style={{ width: 40, height: 1, background: `linear-gradient(90deg,transparent,${watchAccent},transparent)`, margin: "24px auto 0" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "120px 64px 120px 72px", display: "flex", flexDirection: "column", gap: 52, justifyContent: "center" }}>
          <Reveal text="Before you write a single word, the system scans your category for what's moving." size="clamp(20px,2.2vw,28px)" weight={700} lineHeight={1.2} color="#E8E8E6" delay={0.05} />
          <Reveal text="You get structured intelligence, not a reading list. Every briefing is built for action, not review." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.1} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="What's Moving" desc="Developments shaping your category right now" delay={0.06} accent={watchAccent} />
            <FeatureLine num="02" title="Threats" desc="Items requiring defensive positioning or response" delay={0.12} accent={watchAccent} />
            <FeatureLine num="03" title="Opportunities" desc="Scored on effort-to-impact ratio, highest leverage first" delay={0.18} accent={watchAccent} />
            <FeatureLine num="04" title="Content Triggers" desc="Angles ready to hand directly to the production engine" delay={0.24} accent={watchAccent} />
            <FeatureLine num="05" title="Event Radar" desc="Upcoming events filtered by proximity and relevance" delay={0.30} accent={watchAccent} />
          </div>
          <FadeIn delay={0.1}>
            <div style={{ borderLeft: `2px solid ${watchAccent}`, paddingLeft: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8E6", marginBottom: 8 }}>Source Verification</div>
              <div style={{ fontSize: 13, color: "rgba(232,232,230,0.42)", lineHeight: 1.7 }}>Every claim in every briefing requires two or more independent, credible sources. Unverified intelligence never ships. This is not a preference. It is a protocol.</div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div style={{ borderLeft: `2px solid rgba(74,144,245,0.28)`, paddingLeft: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8E6", marginBottom: 8 }}>Opportunity Scoring</div>
              <div style={{ fontSize: 13, color: "rgba(232,232,230,0.42)", lineHeight: 1.7 }}>Every opportunity is scored one through ten on its effort-to-impact ratio. High-leverage surfaces first. Low-leverage gets suppressed so it never wastes your attention.</div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          WORK — STICKY LEFT PANEL
      ══════════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: `linear-gradient(90deg,transparent,rgba(13,140,158,0.35),transparent)` }} />
      <div ref={workRef} style={{ display: "flex", minHeight: "220vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", width: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(160deg, #060f10 0%, #050e12 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.42 }}><WorkCanvasFull /></div>
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 48px" }}>
            <div style={{ fontSize: 10, letterSpacing: ".24em", color: workAccent, textTransform: "uppercase", marginBottom: 16, fontWeight: 600, opacity: 0.8 }}>Room Two</div>
            <div style={{ fontSize: "clamp(60px,7vw,96px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: "#E8E8E6" }}>WORK</div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(232,232,230,0.25)", textTransform: "uppercase", marginTop: 14, fontWeight: 500 }}>The Engine Room</div>
            <div style={{ width: 40, height: 1, background: `linear-gradient(90deg,transparent,${workAccent},transparent)`, margin: "24px auto 0" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "120px 64px 120px 72px", display: "flex", flexDirection: "column", gap: 52, justifyContent: "center" }}>
          <Reveal text="A coordinated team of forty specialists transforms your raw thinking into publication-grade content." size="clamp(20px,2.2vw,28px)" weight={700} lineHeight={1.2} color="#E8E8E6" delay={0.05} />
          <Reveal text="Not a single prompt. A system of roles working in sequence. Voice DNA ensures every word sounds like you. Quality gates ensure every piece meets your standards." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.1} />
          <FadeIn delay={0.1}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: "rgba(232,232,230,0.22)", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>Output formats</div>
              <OutputTicker />
            </div>
          </FadeIn>
          <FadeIn delay={0.12}>
            <div style={{ borderTop: `1px solid ${line}`, paddingTop: 48 }}>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: workAccent, textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>Voice DNA</div>
              <Reveal text="Every output sounds exactly like you." size={22} weight={700} color="#E8E8E6" delay={0.05} />
              <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 18 }}>
                {[["Vocabulary and Syntax",88],["Tonal Register",94],["Rhythm and Cadence",91],["Metaphor Patterns",87],["Structural Habits",96]].map(([label, score], i) => (
                  <DnaBar key={i} label={label as string} score={score as number} delay={i*0.08} accent={workAccent} />
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          WRAP — STICKY LEFT PANEL
      ══════════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: `linear-gradient(90deg,transparent,rgba(160,128,245,0.35),transparent)` }} />
      <div ref={wrapRef} style={{ display: "flex", minHeight: "200vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", width: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(160deg, #0a0614 0%, #090514 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.52 }}><WrapCanvasFull /></div>
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 48px" }}>
            <div style={{ fontSize: 10, letterSpacing: ".24em", color: wrapAccent, textTransform: "uppercase", marginBottom: 16, fontWeight: 600, opacity: 0.8 }}>Room Three</div>
            <div style={{ fontSize: "clamp(60px,7vw,96px)", fontWeight: 800, letterSpacing: "-.05em", lineHeight: .88, color: "#E8E8E6" }}>WRAP</div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(232,232,230,0.25)", textTransform: "uppercase", marginTop: 14, fontWeight: 500 }}>The Distribution Room</div>
            <div style={{ width: 40, height: 1, background: `linear-gradient(90deg,transparent,${wrapAccent},transparent)`, margin: "24px auto 0" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "120px 64px 120px 72px", display: "flex", flexDirection: "column", gap: 52, justifyContent: "center" }}>
          <Reveal text="One idea becomes a complete publishing event." size="clamp(20px,2.2vw,28px)" weight={700} lineHeight={1.2} color="#E8E8E6" delay={0.05} />
          <Reveal text="Articles, social posts, email sequences, video scripts. Formatted for every channel. Ready to ship." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.1} />
          <Reveal text="Nothing is left on the table. Nothing is left for you to finish." size={15} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.38)" delay={0.15} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <FeatureLine num="01" title="Content Calendar" desc="Visual scheduling across all your channels from a single canvas." delay={0.08} accent={wrapAccent} />
            <FeatureLine num="02" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." delay={0.14} accent={wrapAccent} />
            <FeatureLine num="03" title="Performance Loop" desc="Engagement data flows back to sharpen your next content strategy." delay={0.20} accent={wrapAccent} />
            <FeatureLine num="04" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." delay={0.26} accent={wrapAccent} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          7 QUALITY GATES
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "120px 48px 140px", background: "linear-gradient(180deg, #090514 0%, #07090f 100%)", borderTop: `1px solid ${line}` }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px 64px", alignItems: "end", marginBottom: 64 }}>
            <div>
              <FadeIn delay={0}>
                <div style={{ fontSize: 10, letterSpacing: ".2em", color: wrapAccent, textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>Quality Gates</div>
              </FadeIn>
              <Reveal text="Nothing ships without passing the gates." size="clamp(28px,3.8vw,48px)" weight={700} lineHeight={1.06} color="#E8E8E6" delay={0.08} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Reveal text="Every piece of content runs through 7 checks before it reaches your audience. No AI tells. No off-brand moments. No weak writing." size={14} weight={400} lineHeight={1.7} color="rgba(232,232,230,0.42)" delay={0.18} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${line}` }}>
            {[["01","Strategy","Does this serve your goals?","#3A7BD5"],["02","Voice","Does this sound like you?","#0D8C9E"],["03","Accuracy","Are the facts correct?","#C8961A"],["04","AI Tells","Could anyone spot the AI?","#e85d75"],["05","Audience","Will this resonate?","#A080F5"],["06","Platform","Is this native to the channel?","#4ab8f5"],["07","Impact","Will this move people to action?","#10b981"]].map(([num,name,desc,color],i) => (
              <GateRow key={i} num={num} name={name} desc={desc} color={color} delay={0.04 + i*0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY IT COMPOUNDS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "120px 48px", borderTop: `1px solid ${line}`, background: "#07090f" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".2em", color: "rgba(232,232,230,0.25)", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>Compound Advantage</div>
          </FadeIn>
          <Reveal text="Why It Compounds" size="clamp(40px,5.5vw,70px)" weight={700} lineHeight={1.0} color="#E8E8E6" delay={0.05} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 48 }}>
            <Reveal text="Most tools make content faster. EVERYWHERE Studio makes it better — and the difference grows with every piece you publish." size={16} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.1} />
            <Reveal text="Your Voice DNA sharpens over time. The quality gates calibrate to your rising standards. The intelligence layer learns the contours of your category with increasing precision." size={16} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.18} />
            <Reveal text="The result is a widening moat: the longer you use the system, the further it pulls ahead of anything else available — for you, specifically, and for no one else." size={16} weight={400} lineHeight={1.75} color="rgba(232,232,230,0.48)" delay={0.26} />
          </div>
          <FadeIn delay={0.4}>
            <div style={{ marginTop: 64, padding: "40px 0", borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, textAlign: "center" }}>
              <div style={{ fontSize: "clamp(18px,2.2vw,26px)", fontWeight: 600, lineHeight: 1.4, color: "#C8961A", fontStyle: "italic", letterSpacing: "-.01em" }}>
                "Competitors can copy the output format. They cannot copy the system underneath it."
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "140px 48px 120px", textAlign: "center", background: "linear-gradient(180deg,#07090f 0%,#0a0d1a 100%)", borderTop: `1px solid ${line}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".2em", color: "rgba(232,232,230,0.22)", textTransform: "uppercase", marginBottom: 32, fontWeight: 500 }}>Let's Talk</div>
          </FadeIn>
          <Reveal text="Your ideas deserve a system built to carry them." size="clamp(36px,5vw,64px)" weight={700} lineHeight={1.0} color="#E8E8E6" center delay={0.08} />
          <div style={{ marginTop: 24, marginBottom: 20 }}>
            <Reveal text="If you're ready to stop carrying the mountain alone, let's have a conversation." size={16} weight={400} lineHeight={1.65} color="rgba(232,232,230,0.40)" center delay={0.22} />
          </div>
          <FadeIn delay={0.42}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 52 }}>
              <button onClick={() => nav("/auth")} style={{ background: "#fff", border: "none", borderRadius: 100, padding: "16px 52px", fontSize: 15, fontWeight: 700, color: "#07090f", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "opacity .2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".85"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>Let's Talk</button>
              <button onClick={() => nav("/studio/dashboard")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "16px 52px", fontSize: 15, fontWeight: 500, color: "rgba(232,232,230,0.50)", fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#E8E8E6"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(232,232,230,0.50)"; }}>Open Studio</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px 48px", borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "#07090f" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#E8E8E6", opacity: 0.65 }}>EVERY</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#E8E8E6", opacity: 0.22 }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".16em", color: "rgba(232,232,230,0.22)", marginLeft: 5, textTransform: "uppercase" }}>Studio</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(232,232,230,0.22)", letterSpacing: ".04em" }}>2026 Mixed Grill LLC · Composed Intelligence</span>
      </footer>
    </div>
  );
}
