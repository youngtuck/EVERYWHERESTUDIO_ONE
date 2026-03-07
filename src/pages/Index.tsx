import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

// ─── Orb Canvas ───────────────────────────────────────────────────────────────
// Pure 2D canvas — like Telefónica. Fast, smooth, zero lag.

function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });         // normalized 0-1
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
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

    // Track mouse — normalized to 0-1
    const onMove = (e: MouseEvent) => {
      targetRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove);

    // ── Satellite orbs config ─────────────────────────────────────
    const satellites = [
      { orbitR: 0.28, orbitSpeed: 0.0006, phase: 0,    r: 0.055, alpha: 0.55 },
      { orbitR: 0.22, orbitSpeed: -0.0004, phase: 2.1, r: 0.035, alpha: 0.45 },
      { orbitR: 0.34, orbitSpeed: 0.0003, phase: 1.0,  r: 0.07,  alpha: 0.38 },
      { orbitR: 0.40, orbitSpeed: -0.0005, phase: 4.2, r: 0.045, alpha: 0.3  },
      { orbitR: 0.46, orbitSpeed: 0.00035, phase: 3.3, r: 0.032, alpha: 0.22 },
    ];
    let satAngles = satellites.map(s => s.phase);

    // ── Orbit ring dots config ────────────────────────────────────
    const rings = [
      { r: 0.28, dots: 60,  dotR: 1.2, alpha: 0.22 },
      { r: 0.36, dots: 80,  dotR: 1.0, alpha: 0.16 },
      { r: 0.44, dots: 100, dotR: 0.8, alpha: 0.12 },
    ];

    // ── Draw loop ─────────────────────────────────────────────────
    const draw = (ts: number) => {
      tRef.current = ts * 0.001;
      const t = tRef.current;
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Lerp mouse
      const m = mouseRef.current;
      const tm = targetRef.current;
      m.x += (tm.x - m.x) * 0.04;
      m.y += (tm.y - m.y) * 0.04;

      // Orb center: screen center + gentle mouse offset
      const cx = W * 0.5 + (m.x - 0.5) * W * 0.06;
      const cy = H * 0.5 + (m.y - 0.5) * H * 0.06;

      // Base radius tied to shorter dimension
      const baseR = Math.min(W, H) * 0.22;

      ctx.clearRect(0, 0, W, H);

      // ── Background ─────────────────────────────────────────────
      const bg = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, Math.max(W,H)*0.75);
      bg.addColorStop(0, "#0d0d1a");
      bg.addColorStop(1, "#060608");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Ambient glow behind orb ────────────────────────────────
      const ambGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2.2);
      ambGlow.addColorStop(0, "rgba(74,144,217,0.12)");
      ambGlow.addColorStop(0.5, "rgba(74,100,200,0.06)");
      ambGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ambGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // ── Orbit ring dots ────────────────────────────────────────
      rings.forEach(ring => {
        const rPx = baseR * (ring.r / 0.22);
        for (let i = 0; i < ring.dots; i++) {
          const angle = (i / ring.dots) * Math.PI * 2 + t * 0.08;
          const x = cx + Math.cos(angle) * rPx;
          const y = cy + Math.sin(angle) * rPx * 0.28; // flatten to ellipse
          // Fade dots based on position (simulate 3D perspective)
          const perspAlpha = (Math.sin(angle) + 1.5) / 2.5;
          ctx.globalAlpha = ring.alpha * perspAlpha;
          ctx.fillStyle = "#6aA8e8";
          ctx.beginPath();
          ctx.arc(x, y, ring.dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // ── Satellite orbs ─────────────────────────────────────────
      satellites.forEach((sat, i) => {
        satAngles[i] += sat.orbitSpeed;
        const rPx = baseR * (sat.orbitR / 0.22);
        const sx = cx + Math.cos(satAngles[i]) * rPx;
        const sy = cy + Math.sin(satAngles[i]) * rPx * 0.3; // elliptical
        const sR = baseR * sat.r;

        // Depth cue: objects "behind" are smaller and more transparent
        const depth = (Math.sin(satAngles[i]) + 1) * 0.5; // 0=back 1=front

        const grad = ctx.createRadialGradient(sx - sR*0.25, sy - sR*0.25, 0, sx, sy, sR);
        grad.addColorStop(0, `rgba(160,190,255,${sat.alpha * (0.6 + depth * 0.4)})`);
        grad.addColorStop(0.5, `rgba(100,140,220,${sat.alpha * (0.4 + depth * 0.3)})`);
        grad.addColorStop(1, `rgba(60,80,180,0)`);

        ctx.globalAlpha = 0.7 + depth * 0.3;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, sR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Main orb ───────────────────────────────────────────────
      // Subtle breathing
      const breathe = 1 + Math.sin(t * 0.8) * 0.012;
      const R = baseR * breathe;

      // Outer soft glow ring
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
      outerGlow.addColorStop(0, "rgba(100,160,255,0.18)");
      outerGlow.addColorStop(0.5, "rgba(80,120,220,0.08)");
      outerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Main orb body — layered gradients for volume
      // Base: deep blue sphere
      const baseGrad = ctx.createRadialGradient(
        cx - R * 0.18, cy - R * 0.22, R * 0.05,
        cx, cy, R
      );
      baseGrad.addColorStop(0,   "rgba(200,220,255,0.95)");
      baseGrad.addColorStop(0.2, "rgba(140,180,240,0.92)");
      baseGrad.addColorStop(0.5, "rgba(90,135,215,0.90)");
      baseGrad.addColorStop(0.8, "rgba(60,95,190,0.88)");
      baseGrad.addColorStop(1,   "rgba(35,60,160,0.85)");

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // ── Horizontal wave bands on orb ──────────────────────────
      // Clip to orb circle for the wave effect
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Draw ~8 wave bands scrolling slowly
      const numBands = 9;
      for (let b = 0; b < numBands; b++) {
        const bandY = cy - R + (b / numBands) * R * 2 + Math.sin(t * 0.15) * R * 0.03;
        const bandH = R * 0.10;
        const waveAmt = R * 0.035 * Math.sin(b * 1.3 + t * 0.4);

        ctx.beginPath();
        ctx.moveTo(cx - R, bandY + waveAmt);

        // Sinusoidal wave path
        for (let x = -R; x <= R; x += 4) {
          const waveY = bandY + Math.sin((x / R) * Math.PI * 2 + t * 0.6 + b) * R * 0.018;
          ctx.lineTo(cx + x, waveY);
        }

        // Close the band
        ctx.lineTo(cx + R, bandY + bandH + waveAmt);
        for (let x = R; x >= -R; x -= 4) {
          const waveY = bandY + bandH + Math.sin((x / R) * Math.PI * 2 + t * 0.6 + b) * R * 0.018;
          ctx.lineTo(cx + x, waveY);
        }
        ctx.closePath();

        const bandAlpha = 0.06 + (b % 2 === 0 ? 0.03 : 0);
        ctx.fillStyle = `rgba(180,210,255,${bandAlpha})`;
        ctx.fill();
      }

      // ── Light streaks / caustics ───────────────────────────────
      for (let s = 0; s < 4; s++) {
        const streakAngle = (s / 4) * Math.PI + t * 0.12;
        const streakX = cx + Math.cos(streakAngle) * R * 0.4;
        const streakY = cy - R * 0.2 + Math.sin(streakAngle * 0.7) * R * 0.15;
        const streakLen = R * (0.12 + Math.sin(t * 0.5 + s) * 0.06);

        ctx.beginPath();
        ctx.ellipse(streakX, streakY, streakLen * 0.12, streakLen, -0.3, 0, Math.PI * 2);
        const streakGrad = ctx.createRadialGradient(streakX, streakY, 0, streakX, streakY, streakLen);
        streakGrad.addColorStop(0, `rgba(255,255,255,${0.14 + Math.sin(t*0.8+s)*0.06})`);
        streakGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = streakGrad;
        ctx.fill();
      }

      ctx.restore();

      // ── Rim light (bottom right glow) ─────────────────────────
      const rimGrad = ctx.createRadialGradient(
        cx + R * 0.55, cy + R * 0.5, 0,
        cx + R * 0.55, cy + R * 0.5, R * 0.7
      );
      rimGrad.addColorStop(0, "rgba(100,160,255,0.22)");
      rimGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // ── Gold accent (subtle, top highlight) ───────────────────
      const goldGrad = ctx.createRadialGradient(
        cx - R * 0.3, cy - R * 0.45, 0,
        cx - R * 0.3, cy - R * 0.45, R * 0.5
      );
      goldGrad.addColorStop(0, "rgba(245,198,66,0.18)");
      goldGrad.addColorStop(1, "rgba(245,198,66,0)");
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "block",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const ease = (delay: number) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0px)" : "translateY(18px)",
    transition: `opacity 1.1s ${delay}s cubic-bezier(.16,1,.3,1), transform 1.1s ${delay}s cubic-bezier(.16,1,.3,1)`,
  });

  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#060608",
      fontFamily: "'Afacad Flux', sans-serif",
      cursor: "default",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(245,198,66,.28); color: #fff; }

        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.7); }
        }

        .explore-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.9);
          font-family: 'Afacad Flux', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 14px 32px;
          border-radius: 100px;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: background .3s, border-color .3s, transform .3s, box-shadow .3s;
          text-decoration: none;
        }
        .explore-btn:hover {
          background: rgba(255,255,255,0.13);
          border-color: rgba(255,255,255,0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(74,144,217,0.25);
        }
        .explore-btn .arrow {
          transition: transform .3s cubic-bezier(.16,1,.3,1);
        }
        .explore-btn:hover .arrow {
          transform: translateX(4px);
        }
      `}</style>

      {/* The orb — full screen canvas */}
      <OrbCanvas />

      {/* Logo — top center */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 70,
        zIndex: 10,
        ...ease(0.1),
      }}>
        <Logo size="md" onDark={true} />
      </div>

      {/* Center content — title + button */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none",
        gap: 0,
      }}>
        {/* Tagline above */}
        <div style={{
          ...ease(0.3),
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{ width: 20, height: 1, background: "rgba(255,255,255,.25)" }} />
          Composed Intelligence
          <div style={{ width: 20, height: 1, background: "rgba(255,255,255,.25)" }} />
        </div>

        {/* Main headline */}
        <h1 style={{
          ...ease(0.5),
          fontSize: "clamp(48px, 8vw, 110px)",
          fontWeight: 700,
          lineHeight: 1.0,
          color: "#fff",
          textAlign: "center",
          letterSpacing: "-0.03em",
          marginBottom: 16,
          textShadow: "0 2px 40px rgba(0,0,0,0.6)",
        }}>
          Your thinking.
        </h1>
        <h1 style={{
          ...ease(0.6),
          fontSize: "clamp(48px, 8vw, 110px)",
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          marginBottom: 48,
          textAlign: "center",
          background: "linear-gradient(110deg, #F5C642 10%, #8ab4f8 55%, #F5C642 90%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 6s linear infinite",
          textShadow: "none",
        }}>
          Everywhere.
        </h1>

        {/* Button — needs pointer events */}
        <div style={{ ...ease(0.8), pointerEvents: "auto" }}>
          <button
            className="explore-btn"
            onClick={() => navigate("/explore")}
          >
            Explore Everywhere
            <span className="arrow" style={{ fontSize: 18, lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: "absolute",
        bottom: 36,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 10,
        ...ease(1.1),
      }}>
        <span style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.28)",
          fontWeight: 300,
        }}>
          EVERYWHERE STUDIO™ — Ideas to Impact
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
