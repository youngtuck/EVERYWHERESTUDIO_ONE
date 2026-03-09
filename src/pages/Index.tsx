import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile";

// ── SIGNAL FIELD with fluid cursor physics ─────────────────────────────────
function SignalField({ zoomRef }: { zoomRef: React.RefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Use a smoother spring for the field lines - higher inertia = more fluid
  const mx = useRef(0.5);
  const my = useRef(0.5);
  const tvx = useRef(0.5);
  const tvy = useRef(0.5);
  const vx = useRef(0);
  const vy = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      tvx.current = e.clientX / window.innerWidth;
      tvy.current = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const t = ts * 0.001;
      const W = window.innerWidth, H = window.innerHeight;
      const zoom = zoomRef?.current ?? 0;
      const scale = 1 + zoom * 3.2;
      ctx.clearRect(0, 0, W, H);

      if (zoom > 0) {
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.scale(scale, scale);
        ctx.translate(-W * 0.5, -H * 0.5);
      }

      // Very soft spring - stiffness 0.028, damping 0.88
      // This gives the lines a heavy, fluid, mercury-like follow
      vx.current += (tvx.current - mx.current) * 0.028;
      vy.current += (tvy.current - my.current) * 0.028;
      vx.current *= 0.88;
      vy.current *= 0.88;
      mx.current += vx.current;
      my.current += vy.current;

      const cmx = mx.current * W;
      const cmy = my.current * H;

      // Background gradient
      const bg = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .5, Math.max(W, H) * .75);
      bg.addColorStop(0,   "#4a5fd4");
      bg.addColorStop(.30, "#3a4ec8");
      bg.addColorStop(.60, "#2b3db5");
      bg.addColorStop(.85, "#1c2c9e");
      bg.addColorStop(1,   "#111f88");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const orbX = W * 0.5;
      const orbY = H * 0.5;
      const orbR = Math.min(W, H) * 0.22;

      // Cursor influence radius - wider = more fluid sweep
      const lensR = W * 0.38;

      const LINES = 56;
      const STEPS = 280;
      const LINE_SPACING = H / (LINES + 1);

      for (let li = 0; li < LINES; li++) {
        const baseY = (li + 1) * LINE_SPACING;
        const centerDist = Math.abs(li - LINES / 2) / (LINES / 2);
        const alpha = 0.07 + (1 - centerDist) * 0.24;

        ctx.beginPath();
        let drawing = false;

        for (let si = 0; si <= STEPS; si++) {
          const px = (si / STEPS) * W;
          let py = baseY;

          // Cursor lens displacement - larger radius, softer falloff
          const dxM = px - cmx, dyM = py - cmy;
          const distM = Math.sqrt(dxM * dxM + dyM * dyM);
          const lensFalloff = Math.exp(-(distM * distM) / (lensR * lensR * 0.6));
          const cursorPush = lensFalloff * (baseY - cmy) * 0.42;

          // Orb field
          const dxO = px - orbX, dyO = py - orbY;
          const distO = Math.sqrt(dxO * dxO + dyO * dyO);
          const orbField = Math.exp(-(distO * distO) / (orbR * orbR * 1.8));
          const orbPushY = orbField * (baseY - orbY) * 1.2;
          const orbPushX = orbField * dxO * 0.15;

          // Organic time drift
          const wave1 = Math.sin(px * 0.0028 + t * 0.35 + li * 0.11) * 5.0;
          const wave2 = Math.sin(px * 0.0065 - t * 0.25 + li * 0.07) * 2.2;
          const wave3 = Math.sin(px * 0.011  + t * 0.50 + li * 0.18) * 1.1;

          py += cursorPush + orbPushY + wave1 + wave2 + wave3;
          const ax = px + orbPushX;

          // Gap around orb
          const dxS = ax - orbX, dyS = py - orbY;
          if (Math.sqrt(dxS * dxS + dyS * dyS) < orbR * 0.83) {
            if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false; }
            continue;
          }

          if (!drawing) { ctx.moveTo(ax, py); drawing = true; }
          else ctx.lineTo(ax, py);
        }

        const hue = 220 + centerDist * 18;
        const light = 58 + (1 - centerDist) * 22;
        ctx.strokeStyle = `hsla(${hue},85%,${light}%,${alpha})`;
        ctx.lineWidth = 0.6 + (1 - centerDist) * 0.55;
        ctx.stroke();
      }

      // Orb glow
      const breathe = 0.92 + Math.sin(t * 0.28) * 0.08;
      const orbGlow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 2.4);
      orbGlow.addColorStop(0,   `rgba(80,130,255,${0.18 * breathe})`);
      orbGlow.addColorStop(0.4, `rgba(60,100,240,${0.08 * breathe})`);
      orbGlow.addColorStop(1,   "rgba(40,70,200,0)");
      ctx.fillStyle = orbGlow;
      ctx.fillRect(0, 0, W, H);

      // Vignette
      const vig = ctx.createRadialGradient(W*.5, H*.5, W*.28, W*.5, H*.5, Math.max(W,H)*.72);
      vig.addColorStop(0, "rgba(0,0,20,0)");
      vig.addColorStop(1, "rgba(5,8,40,0.48)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      if (zoom > 0) {
        ctx.restore();
        // Fade to dark as we zoom in (last 50% of zoom) so next page can emerge from dark
        const fade = Math.max(0, (zoom - 0.5) / 0.5);
        ctx.fillStyle = `rgba(8,10,28,${fade * 0.98})`;
        ctx.fillRect(0, 0, W, H);
      }

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [ready, setReady]     = useState(false);
  const zoomRef = useRef(0);
  const [zoomingToExplore, setZoomingToExplore] = useState(false);
  const uiRef = useRef<HTMLDivElement>(null);
  const zoomRaf = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => { clearTimeout(t); };
  }, []);

  // Zoom-in transition when "Explore Everywhere" is clicked
  useEffect(() => {
    if (!zoomingToExplore) return;
    const duration = 1650;
    const startTime = performance.now();
    const easeIn = (t: number) => t * t * t;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const progress = easeIn(raw);
      zoomRef.current = progress;

      const uiEl = uiRef.current;
      if (uiEl) {
        uiEl.style.opacity = String(Math.max(0, 1 - progress * 1.8));
        uiEl.style.transition = "none";
      }

      if (raw >= 1) {
        zoomRef.current = 1;
        // Prevent white flash: paint document dark before route change so Explore first paint is dark
        document.documentElement.style.backgroundColor = "#07090f";
        document.body.style.backgroundColor = "#07090f";
        navigate("/explore", { state: { fromLandingZoom: true } });
        return;
      }
      zoomRaf.current = requestAnimationFrame(tick);
    };
    zoomRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(zoomRaf.current);
  }, [zoomingToExplore, navigate]);

  const fi = (d: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0)" : "translateY(16px)",
    transition: `opacity .9s ${d}s cubic-bezier(.16,1,.3,1), transform .9s ${d}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      position: "relative", fontFamily: "'Afacad Flux', sans-serif",
      /* Fallback if canvas fails to paint — prevents white screen */
      background: "linear-gradient(180deg, #1c2c9e 0%, #111f88 50%, #0d1a70 100%)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(255,220,80,.28); color: #fff; }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .cta-pill {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.92); border: none; color: #1e2da0;
          font-family: 'Afacad Flux', sans-serif;
          font-size: 16px; font-weight: 600; letter-spacing: .01em;
          padding: 15px 44px; border-radius: 100px;
          box-shadow: 0 6px 30px rgba(10,20,130,.35), 0 2px 8px rgba(255,255,255,.15);
          transition: background .22s, transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
        }
        .cta-pill:hover {
          background: #fff;
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 14px 50px rgba(10,20,130,.45), 0 0 40px rgba(100,150,255,.25);
        }
        .arr { font-size: 18px; display: inline-block; transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .cta-pill:hover .arr { transform: translateX(5px); }
      `}</style>

      {!isMobile && <SignalField zoomRef={zoomRef} />}

      {/* UI */}
      <div
        ref={uiRef}
        style={{
        position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 28, ...fi(.08) }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.95)" }}>EVERY</span>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: "rgba(255,255,255,.42)" }}>WHERE</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", color: "rgba(255,255,255,.38)", marginLeft: 6, alignSelf: "center", textTransform: "uppercase" }}>Studio</span>
          </div>
        </div>

        {/* Headline + CTA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{
            ...fi(.25),
            fontSize: "clamp(48px, 8vw, 112px)",
            fontWeight: 700, lineHeight: .95, letterSpacing: "-.035em",
            color: "#fff", textAlign: "center",
            textShadow: "0 2px 40px rgba(10,20,120,.55)",
            marginBottom: 0,
          }}>Your thinking.</h1>

          <h1 style={{
            ...fi(.38),
            fontSize: "clamp(48px, 8vw, 112px)",
            fontWeight: 700, lineHeight: .95, letterSpacing: "-.035em",
            textAlign: "center", marginBottom: 52,
            background: "linear-gradient(110deg, #ffe47a 0%, #fff 38%, #c8e0ff 80%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 5s linear infinite",
          }}>Everywhere.</h1>

          <div style={{ ...fi(.55), pointerEvents: zoomingToExplore ? "none" : "auto" }}>
            <button
              className="cta-pill"
              onClick={() => setZoomingToExplore(true)}
              disabled={zoomingToExplore}
              aria-busy={zoomingToExplore}
            >
              Explore Everywhere
              <span className="arr">-&gt;</span>
            </button>
          </div>
        </div>

        {/* Bottom label */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 26, ...fi(.95) }}>
          <span style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.30)", fontWeight: 400 }}>
            EVERYWHERE STUDIO &nbsp;·&nbsp; Ideas to Impact
          </span>
        </div>
      </div>
    </div>
  );
}
