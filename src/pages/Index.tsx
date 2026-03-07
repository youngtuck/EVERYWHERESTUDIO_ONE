import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/landing/Nav";
import Footer from "../components/landing/Footer";

// ─── WebGL Scene Hook ──────────────────────────────────────────────────────────

function useWebGLScene(canvasRef: React.RefObject<HTMLCanvasElement>, scrollY: number) {
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) return;

    const vert = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    const frag = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_scroll;

      #define PI 3.14159265359
      #define TAU 6.28318530718

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5); }
      
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      
      float fbm(vec2 p) {
        float v=0.0, a=0.5;
        for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.1+vec2(1.3,0.7);a*=0.5;}
        return v;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - u_res*0.5) / min(u_res.x, u_res.y);
        float ar = u_res.x / u_res.y;
        float t = u_time * 0.25;
        float scroll = u_scroll * 0.0008;

        // Deep space background
        vec3 col = mix(vec3(0.03,0.03,0.06), vec3(0.01,0.01,0.03), length(uv));
        
        // Nebula
        vec2 nUV = uv*0.7 + vec2(t*0.04, -scroll*0.2);
        float neb = fbm(nUV + fbm(nUV + fbm(nUV)));
        col = mix(col, vec3(0.06,0.09,0.22)*neb, 0.6);
        
        // Central orb — shifts up as you scroll
        float orbY = -scroll * 0.35;
        vec2 oc = vec2(0.0, orbY);
        float orbR = max(0.24 - scroll*0.06, 0.04);
        float dist = length(uv - oc);
        
        // Orb body
        if(dist < orbR) {
          vec2 n2 = normalize(uv - oc);
          float surf = fbm(n2*3.5 + t*0.4) * fbm(n2*7.0 - t*0.25);
          vec3 gold = vec3(0.97, 0.79, 0.27);
          vec3 blue = vec3(0.29, 0.57, 0.86);
          vec3 teal = vec3(0.10, 0.56, 0.67);
          vec3 orbCol = mix(gold, mix(blue, teal, surf), smoothstep(0.0,1.0,surf));
          float rim = pow(1.0 - (dist/orbR), 2.5);
          col = mix(col, orbCol*0.75 + vec3(0.1,0.15,0.3)*rim, 0.9);
        }
        
        // Glow halo
        float glow = exp(-max(dist - orbR, 0.0) * 7.0);
        col += vec3(0.15,0.25,0.55) * glow * 0.25;
        col += vec3(0.97,0.79,0.27) * exp(-max(dist - orbR, 0.0) * 20.0) * 0.1;
        
        // Orbital rings (3)
        for(float i=0.0; i<3.0; i++) {
          float rr = 0.38 + i*0.16;
          float rw = 0.0015;
          float rd = abs(dist - rr);
          float alpha = sin(t*0.4 + i*2.1 + scroll*1.5)*0.5+0.5;
          vec3 rc = i<1.0 ? vec3(0.29,0.57,0.86) : i<2.0 ? vec3(0.97,0.79,0.27) : vec3(0.10,0.56,0.67);
          col += rc * exp(-rd*180.0) * alpha * 0.35;
        }
        
        // Satellite orbs (5)
        for(float i=0.0; i<5.0; i++) {
          float ang = TAU*i/5.0 + t*(0.08+i*0.025) + scroll*0.4;
          float rad = 0.52 + sin(t*0.18+i)*0.06;
          vec2 sp = vec2(cos(ang)*rad*ar, sin(ang)*rad + orbY);
          // Convert back to non-aspect uv
          vec2 spUV = vec2(sp.x/ar, sp.y);
          float sd = length(uv - spUV);
          float sr = 0.022 + sin(t+i*1.7)*0.006;
          col += (i<2.5 ? vec3(0.29,0.57,0.86) : vec3(0.97,0.79,0.27)) * exp(-max(sd-sr,0.0)*60.0) * 0.5;
          if(sd < sr) col = mix(col, (i<2.5 ? vec3(0.4,0.65,0.9) : vec3(1.0,0.85,0.35))*0.7, 0.75);
        }
        
        // Stars
        for(float i=0.0; i<100.0; i++) {
          vec2 sp = vec2(fract(hash(vec2(i,1.0)))*2.0-1.0, fract(hash(vec2(i,2.0))-scroll*0.0001*hash(vec2(i,3.0)))*2.0-1.0);
          float br = hash(vec2(i,5.0))*0.7+0.3;
          float tw = 0.6+0.4*sin(t*(1.0+hash(vec2(i,6.0))*3.0)+i);
          float sd = length(uv - sp);
          col += br*tw*0.5 / (sd*sd*350.0+0.1);
        }
        
        // Fine grid
        vec2 grid = fract(uv*18.0 + scroll*0.05);
        col += vec3(0.2,0.35,0.7) * (1.0-min(smoothstep(0.0,0.04,grid.x),smoothstep(0.0,0.04,grid.y))) * 0.025;
        
        // Vignette
        float vig = 1.0 - dot(uv*1.3, uv*1.3);
        col *= pow(max(vig,0.0), 0.4)*0.7 + 0.3;
        
        // Tone map + gamma
        col = col/(col+1.0);
        col = pow(col, vec3(0.4545));
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compileShader = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let curScroll = 0;

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      curScroll += (scrollRef.current - curScroll) * 0.06;

      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uScroll, curScroll);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current = scrollY;
  }, [scrollY]);
}

// ─── Intersection hook ────────────────────────────────────────────────────────

function useVisible(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Hero({ onEnter }: { onEnter: () => void }) {
  const [in_, setIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIn(true), 120); return () => clearTimeout(t); }, []);

  const t = (delay: number) => ({
    opacity: in_ ? 1 : 0,
    transform: in_ ? "none" : "translateY(32px)",
    transition: `opacity 1s ${delay}s cubic-bezier(.16,1,.3,1), transform 1s ${delay}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <section style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Badge */}
      <div style={{ ...t(0.15), display: "flex", alignItems: "center", gap: 8,
        background: "rgba(245,198,66,.1)", border: "1px solid rgba(245,198,66,.28)",
        borderRadius: 100, padding: "6px 16px", marginBottom: 44 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5C642",
          boxShadow: "0 0 8px #F5C642", animation: "pls 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.13em",
          color: "#F5C642", textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>
          Composed Intelligence
        </span>
      </div>

      {/* Headline */}
      <h1 style={{ ...t(0.3), fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(60px,9.5vw,136px)", fontWeight: 800, lineHeight: .92,
        textAlign: "center", color: "#fff", margin: "0 0 28px",
        letterSpacing: "-.035em", maxWidth: 920 }}>
        <span style={{ display: "block" }}>Your ideas.</span>
        <span style={{ display: "block", background: "linear-gradient(120deg,#F5C642 0%,#4A90D9 50%,#F5C642 100%)",
          backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shim 5s ease-in-out infinite" }}>
          Everywhere.
        </span>
      </h1>

      {/* Sub */}
      <p style={{ ...t(0.5), fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(16px,2vw,21px)", color: "rgba(255,255,255,.5)",
        textAlign: "center", maxWidth: 500, lineHeight: 1.55, margin: "0 0 52px", fontWeight: 300 }}>
        One voice. Forty agents. Every format, every platform — composed perfectly every time.
      </p>

      {/* CTAs */}
      <div style={{ ...t(0.7), display: "flex", gap: 14, alignItems: "center" }}>
        <button onClick={onEnter}
          style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.03em", color: "#000", background: "#F5C642", border: "none",
            borderRadius: 100, padding: "15px 34px", cursor: "pointer",
            transition: "all .3s ease" }}
          onMouseEnter={e => { const el = e.target as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 0 40px rgba(245,198,66,.55)"; }}
          onMouseLeave={e => { const el = e.target as HTMLElement; el.style.transform=""; el.style.boxShadow=""; }}>
          Enter the Studio
        </button>
        <button
          style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, fontWeight: 400,
            color: "rgba(255,255,255,.65)", background: "transparent",
            border: "1px solid rgba(255,255,255,.18)", borderRadius: 100,
            padding: "15px 34px", cursor: "pointer", transition: "all .3s ease" }}
          onMouseEnter={e => { const el = e.target as HTMLElement; el.style.borderColor="rgba(255,255,255,.45)"; el.style.color="rgba(255,255,255,.9)"; }}
          onMouseLeave={e => { const el = e.target as HTMLElement; el.style.borderColor="rgba(255,255,255,.18)"; el.style.color="rgba(255,255,255,.65)"; }}>
          See how it works ↓
        </button>
      </div>

      {/* Scroll cue */}
      <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        opacity: in_ ? .45 : 0, transition: "opacity 1.2s 1.8s" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(255,255,255,.5)",
          textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>Scroll</span>
        <div style={{ width: 1, height: 52,
          background: "linear-gradient(to bottom, rgba(255,255,255,.5), transparent)",
          animation: "sc 1.6s ease-in-out infinite" }} />
      </div>
    </section>
  );
}

function Pillars() {
  const { ref, visible } = useVisible(0.15);

  const items = [
    { word: "WATCH", sub: "Sentinel Intelligence", color: "#4A90D9",
      desc: "Your AI strategist tracks trends, gaps, and opportunities — surfaced before your competitors see them." },
    { word: "WORK", sub: "40-Agent Orchestra", color: "#F5C642",
      desc: "Speak. Every word activates 40 specialized agents working in parallel — strategy, voice, quality, all at once." },
    { word: "WRAP", sub: "Everywhere Distribution", color: "#188FA7",
      desc: "12 formats. Every platform. Scheduled, optimized, and tracked. Your thinking composed for every audience." },
  ];

  return (
    <section ref={ref} style={{ padding: "110px 40px", maxWidth: 1200, margin: "0 auto",
      width: "100%", position: "relative", zIndex: 10 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
        opacity: visible ? 1 : 0, transition: "opacity .8s" }}>
        <div style={{ width: 32, height: 1, background: "#4A90D9" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#4A90D9",
          textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>The System</span>
      </div>

      <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(42px,6.5vw,92px)", fontWeight: 800, color: "#fff",
        lineHeight: 1.0, letterSpacing: "-.035em", margin: "0 0 72px",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
        transition: "all .9s .1s cubic-bezier(.16,1,.3,1)" }}>
        Three rooms.<br />
        <span style={{ color: "rgba(255,255,255,.3)" }}>One studio.</span>
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
        {items.map((item, i) => (
          <div key={item.word}
            style={{ padding: "52px 40px", borderTop: `2px solid ${item.color}`,
              background: "rgba(255,255,255,.03)", backdropFilter: "blur(10px)",
              opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(36px)",
              transition: `all .9s ${0.2+i*.12}s cubic-bezier(.16,1,.3,1)`,
              cursor: "default" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.03)"; }}>
            <div style={{ fontSize: "clamp(52px,5.5vw,76px)", fontWeight: 900,
              fontFamily: "'Afacad Flux',sans-serif", color: item.color, lineHeight: 1,
              letterSpacing: "-.04em", marginBottom: 8 }}>
              {item.word}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
              color: "rgba(255,255,255,.35)", textTransform: "uppercase",
              fontFamily: "'Afacad Flux',sans-serif", marginBottom: 28 }}>
              {item.sub}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.68, color: "rgba(255,255,255,.55)",
              fontFamily: "'Afacad Flux',sans-serif", fontWeight: 300, margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function VoiceDNA() {
  const { ref, visible } = useVisible(0.2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const layers = [
        { col: "#4A90D9", amp: 18, freq: .016, ph: 0, lw: 2, a: .9 },
        { col: "#F5C642", amp: 12, freq: .027, ph: Math.PI*.65, lw: 1.5, a: .7 },
        { col: "#188FA7", amp: 26, freq: .009, ph: Math.PI*1.3, lw: 1.5, a: .5 },
      ];

      layers.forEach(l => {
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const y = H/2 + Math.sin(x*l.freq+t+l.ph)*l.amp
            + Math.sin(x*l.freq*2.2+t*1.4+l.ph)*l.amp*.38
            + Math.sin(x*l.freq*.45+t*.55+l.ph)*l.amp*.55;
          x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = l.col;
        ctx.lineWidth = l.lw;
        ctx.globalAlpha = visible ? l.a : 0;
        ctx.shadowBlur = 14;
        ctx.shadowColor = l.col;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Dots
      [.12,.32,.52,.72,.88].forEach((xr, i) => {
        const x = xr*W;
        const y = H/2 + Math.sin(x*.016+t)*18;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        ctx.fillStyle = "#F5C642";
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#F5C642";
        ctx.globalAlpha = visible ? 1 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = visible ? .4 : 0;
        ctx.fillStyle = "#fff";
        ctx.font = `10px 'Afacad Flux', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(["Cadence","Depth","Clarity","Authority","Warmth"][i], x, H*.86);
        ctx.globalAlpha = 1;
      });

      t += .014;
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  return (
    <section ref={ref} style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto",
      width: "100%", position: "relative", zIndex: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        {/* Left */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
            opacity: visible ? 1 : 0, transition: "opacity .8s" }}>
            <div style={{ width: 32, height: 1, background: "#F5C642" }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#F5C642",
              textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>Voice DNA</span>
          </div>

          <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
            fontSize: "clamp(38px,5vw,68px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.08, letterSpacing: "-.035em", margin: "0 0 24px",
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
            transition: "all .9s .1s cubic-bezier(.16,1,.3,1)" }}>
            Every word.<br />
            <span style={{ color: "rgba(255,255,255,.3)" }}>Still you.</span>
          </h2>

          <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16, color: "rgba(255,255,255,.5)",
            lineHeight: 1.7, margin: "0 0 40px", fontWeight: 300,
            opacity: visible ? 1 : 0, transition: "opacity .9s .2s" }}>
            Three invisible layers capture not just what you say, but how you think, what you value, and the texture of how ideas move through you. Your Voice Fidelity Score guarantees no AI tell — ever.
          </p>

          {/* Score card */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 20,
            padding: "20px 28px", background: "rgba(245,198,66,.07)",
            border: "1px solid rgba(245,198,66,.18)", borderLeft: "3px solid #F5C642",
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-20px)",
            transition: "all .9s .3s cubic-bezier(.16,1,.3,1)" }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#F5C642",
                fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1, letterSpacing: "-.04em" }}>94.7</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", letterSpacing: "0.15em",
                textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif", marginTop: 4 }}>
                Voice Fidelity Score
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: "rgba(255,255,255,.1)" }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)",
              fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1.55 }}>
              Indistinguishable<br />from human writing
            </div>
          </div>
        </div>

        {/* Right — waveform */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(36px)",
          transition: "all 1s .2s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
            padding: "40px 32px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", letterSpacing: "0.2em",
                textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>
                Voice Pattern Analysis
              </span>
              <span style={{ fontSize: 10, color: "#4A90D9", fontFamily: "'Afacad Flux',sans-serif",
                letterSpacing: "0.1em" }}>● Live</span>
            </div>
            <canvas ref={canvasRef} style={{ width: "100%", height: 120, display: "block" }} />
            <div style={{ display: "flex", gap: 20, marginTop: 20, paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,.05)" }}>
              {[["#4A90D9","Linguistic"],["#F5C642","Contextual"],["#188FA7","Behavioral"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 2, background: c }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.38)",
                    fontFamily: "'Afacad Flux',sans-serif" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QualityGates() {
  const { ref, visible } = useVisible(0.2);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setActive(p => (p+1)%7), 1900);
    return () => clearInterval(t);
  }, [visible]);

  const gates = [
    ["Strategy", 98], ["Voice", 94], ["Accuracy", 99],
    ["AI Tells", 97], ["Audience", 95], ["Platform", 96], ["Impact", 92],
  ];

  return (
    <section ref={ref} style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto",
      width: "100%", position: "relative", zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
        opacity: visible ? 1 : 0, transition: "opacity .8s" }}>
        <div style={{ width: 32, height: 1, background: "#188FA7" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#188FA7",
          textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>7 Quality Gates</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
        <div>
          <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
            fontSize: "clamp(38px,5vw,68px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.08, letterSpacing: "-.035em", margin: "0 0 24px",
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
            transition: "all .9s .1s cubic-bezier(.16,1,.3,1)" }}>
            Nothing leaves<br />
            <span style={{ color: "rgba(255,255,255,.3)" }}>without passing.</span>
          </h2>
          <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16,
            color: "rgba(255,255,255,.5)", lineHeight: 1.7, fontWeight: 300,
            opacity: visible ? 1 : 0, transition: "opacity .9s .2s", margin: 0 }}>
            Every output passes seven quality gates before you ever see it. Below 800 on the Betterish scale, it loops back through the agents for refinement. No compromises.
          </p>
        </div>

        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(36px)",
          transition: "all 1s .2s cubic-bezier(.16,1,.3,1)" }}>
          {gates.map(([name, score], i) => (
            <div key={name}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer" }}
              onMouseEnter={() => setActive(i)}>
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                border: `1px solid ${active===i?"#4A90D9":"rgba(255,255,255,.1)"}`,
                background: active===i?"rgba(74,144,217,.15)":"transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: active===i?"#4A90D9":"rgba(255,255,255,.3)",
                fontFamily: "'Afacad Flux',sans-serif", fontWeight: 500, flexShrink: 0,
                transition: "all .3s" }}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: active===i?600:400,
                    color: active===i?"#fff":"rgba(255,255,255,.5)",
                    fontFamily: "'Afacad Flux',sans-serif", transition: "all .3s" }}>{name}</span>
                  <span style={{ fontSize: 14, color: active===i?"#F5C642":"rgba(255,255,255,.3)",
                    fontFamily: "'Afacad Flux',sans-serif", fontWeight: 600,
                    transition: "all .3s" }}>{score}</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2,
                    width: visible ? `${score}%` : "0%",
                    background: active===i?"linear-gradient(to right,#4A90D9,#F5C642)":"rgba(255,255,255,.15)",
                    transition: `width 1s ${0.3+i*.07}s cubic-bezier(.16,1,.3,1), background .3s` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Formats() {
  const { ref, visible } = useVisible(0.1);
  const fmts = [
    ["LinkedIn Post","#4A90D9"],["Newsletter","#F5C642"],["Sunday Story","#188FA7"],["Podcast Script","#4A90D9"],
    ["Twitter Thread","#F5C642"],["Essay","#188FA7"],["Short Video","#4A90D9"],["Substack Note","#F5C642"],
    ["Talk Outline","#188FA7"],["Email Campaign","#4A90D9"],["Blog Post","#F5C642"],["Executive Brief","#188FA7"],
  ];

  return (
    <section ref={ref} style={{ padding: "120px 40px", maxWidth: 1200, margin: "0 auto",
      width: "100%", position: "relative", zIndex: 10, textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        marginBottom: 14, opacity: visible ? 1 : 0, transition: "opacity .8s" }}>
        <div style={{ width: 32, height: 1, background: "#F5C642" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#F5C642",
          textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>12 Formats</span>
        <div style={{ width: 32, height: 1, background: "#F5C642" }} />
      </div>

      <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(42px,6.5vw,92px)", fontWeight: 800, color: "#fff",
        lineHeight: 1.0, letterSpacing: "-.035em", margin: "0 0 72px",
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
        transition: "all .9s .1s cubic-bezier(.16,1,.3,1)" }}>
        One idea.<br />
        <span style={{ color: "rgba(255,255,255,.3)" }}>Every format.</span>
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
        {fmts.map(([name, col], i) => (
          <div key={name}
            style={{ padding: "28px 24px", background: "rgba(255,255,255,.03)",
              borderBottom: "2px solid transparent", textAlign: "left",
              opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)",
              transition: `all .6s ${i*.035}s cubic-bezier(.16,1,.3,1)`,
              cursor: "default" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background="rgba(255,255,255,.065)"; el.style.borderBottomColor=col; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background="rgba(255,255,255,.03)"; el.style.borderBottomColor="transparent"; }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: col, marginBottom: 12 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,.68)",
              fontFamily: "'Afacad Flux',sans-serif" }}>{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FounderStats() {
  const { ref, visible } = useVisible(0.2);

  return (
    <section ref={ref} style={{ padding: "120px 40px 160px", maxWidth: 1200, margin: "0 auto",
      width: "100%", position: "relative", zIndex: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
            opacity: visible ? 1 : 0, transition: "opacity .8s" }}>
            <div style={{ width: 32, height: 1, background: "#4A90D9" }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: "#4A90D9",
              textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>The Founder</span>
          </div>
          <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
            fontSize: "clamp(34px,4.5vw,60px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.1, letterSpacing: "-.035em", margin: "0 0 24px",
            opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)",
            transition: "all .9s .1s cubic-bezier(.16,1,.3,1)" }}>
            Mark Sylvester<br />
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: ".68em" }}>Composer. Founder.</span>
          </h2>
          <p style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 16, color: "rgba(255,255,255,.5)",
            lineHeight: 1.7, fontWeight: 300, opacity: visible ? 1 : 0, transition: "opacity .9s .2s" }}>
            TEDxSantaBarbara producer. Serial entrepreneur. EVERYWHERE Studio was built because Mark needed it himself — a system that amplifies thinking without diluting voice.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(36px)",
          transition: "all 1s .2s cubic-bezier(.16,1,.3,1)" }}>
          {[["40","AI Agents","#F5C642"],["12","Output Formats","#4A90D9"],
            ["7","Quality Gates","#188FA7"],["∞","Scale","#F5C642"]].map(([n,l,c]) => (
            <div key={l} style={{ padding: "40px 32px", background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: c,
                fontFamily: "'Afacad Flux',sans-serif", lineHeight: 1, letterSpacing: "-.04em",
                marginBottom: 8 }}>{n}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)", letterSpacing: "0.08em",
                textTransform: "uppercase", fontFamily: "'Afacad Flux',sans-serif" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onEnter }: { onEnter: () => void }) {
  const { ref, visible } = useVisible(0.2);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section ref={ref} style={{ minHeight: "70vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", textAlign: "center",
      padding: "100px 40px", position: "relative", zIndex: 10 }}>
      {/* Grid bg */}
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(74,144,217,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(74,144,217,.05) 1px,transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)" }} />

      <h2 style={{ fontFamily: "'Afacad Flux',sans-serif",
        fontSize: "clamp(48px,7.5vw,104px)", fontWeight: 800, color: "#fff",
        lineHeight: .92, letterSpacing: "-.04em", margin: "0 0 28px", maxWidth: 820,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(36px)",
        transition: "all 1s cubic-bezier(.16,1,.3,1)" }}>
        Ready to compose<br />
        <span style={{ background: "linear-gradient(135deg,#F5C642,#4A90D9)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          your intelligence?
        </span>
      </h2>

      <p style={{ fontSize: 18, color: "rgba(255,255,255,.42)", fontFamily: "'Afacad Flux',sans-serif",
        fontWeight: 300, maxWidth: 440, lineHeight: 1.6, margin: "0 0 52px",
        opacity: visible ? 1 : 0, transition: "opacity 1s .2s" }}>
        Join the founders, executives, and creators transforming raw thinking into compounding authority.
      </p>

      {!done ? (
        <div style={{ display: "flex", gap: 0,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)",
          transition: "all 1s .3s cubic-bezier(.16,1,.3,1)" }}>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, color: "#fff",
              background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)",
              borderRight: "none", padding: "15px 24px", borderRadius: "100px 0 0 100px",
              outline: "none", width: 284 }} />
          <button onClick={() => { if(email.includes("@")) setDone(true); }}
            style={{ fontFamily: "'Afacad Flux',sans-serif", fontSize: 15, fontWeight: 700,
              color: "#000", background: "#F5C642", border: "none", padding: "15px 28px",
              borderRadius: "0 100px 100px 0", cursor: "pointer" }}>
            Request Access
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px 32px", background: "rgba(245,198,66,.1)",
          border: "1px solid rgba(245,198,66,.28)", borderRadius: 100, color: "#F5C642",
          fontFamily: "'Afacad Flux',sans-serif", fontSize: 15 }}>
          ✓ You're on the list — we'll be in touch.
        </div>
      )}
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useWebGLScene(canvasRef, scrollY);

  return (
    <div style={{ background: "#060608", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        @keyframes pls { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }
        @keyframes shim { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes sc { 0%{transform:scaleY(1);opacity:1} 50%{transform:scaleY(.25);opacity:.25} 100%{transform:scaleY(1);opacity:1} }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        * { box-sizing:border-box; }
        ::selection { background:rgba(245,198,66,.3); color:#fff; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(74,144,217,.3); border-radius:4px; }
      `}</style>

      {/* Fixed WebGL canvas */}
      <canvas ref={canvasRef} style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: 0, pointerEvents: "none",
      }} />

      {/* All content above canvas */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Nav />
        <Hero onEnter={() => navigate("/studio/dashboard")} />

        {/* Marquee */}
        <div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,.06)",
          borderBottom: "1px solid rgba(255,255,255,.06)", padding: "16px 0",
          background: "rgba(0,0,0,.35)", backdropFilter: "blur(10px)", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", gap: 52, animation: "mq 22s linear infinite",
            whiteSpace: "nowrap", width: "max-content" }}>
            {[...Array(4)].fill(["Composed Intelligence","Voice DNA","40 Agents","12 Formats",
              "7 Quality Gates","Ideas to Impact","Your Thinking. Orchestrated.","WATCH · WORK · WRAP"]).flat()
              .map((item, i) => (
              <span key={i} style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
                color: i%3===0?"#F5C642":i%3===1?"#4A90D9":"rgba(255,255,255,.28)",
                fontFamily: "'Afacad Flux',sans-serif", fontWeight: 500 }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <Pillars />
        <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(74,144,217,.28),transparent)", margin:"0 40px" }} />
        <VoiceDNA />
        <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(245,198,66,.28),transparent)", margin:"0 40px" }} />
        <QualityGates />
        <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(24,143,167,.28),transparent)", margin:"0 40px" }} />
        <Formats />
        <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(74,144,217,.2),transparent)", margin:"0 40px" }} />
        <FounderStats />
        <FinalCTA onEnter={() => navigate("/studio/dashboard")} />

        <Footer />
      </div>
    </div>
  );
}
