import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO — EXPLORE PAGE v7
// Light-mode native. Luxury editorial. Unique canvas per section.
// Three acts: Watch / Work / Wrap.
// No emojis. No em-dashes. No floating orbs.
// ─────────────────────────────────────────────────────────────────────────────

// ── WATCH visualization: animated signal particles ─────────────────────────
function WatchCanvas({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const W = 420, H = 420;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Concentric radar rings + scanning sweep + dots
    const rings = 5;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const maxR = W * 0.42;
      const fg  = dark ? "rgba(74,144,245," : "rgba(58,123,213,";
      const dim = dark ? "rgba(74,144,245,0.08)" : "rgba(58,123,213,0.06)";

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = dark ? "rgba(74,144,245,0.04)" : "rgba(58,123,213,0.03)";
      ctx.fill();

      // Rings
      for (let i = 1; i <= rings; i++) {
        const r = (maxR * i) / rings;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = dim;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = dim;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

      // Sweep gradient
      const sweep = ctx.createConicalGradient
        ? (ctx as any).createConicalGradient(angle, cx, cy)
        : null;
      if (!sweep) {
        // Fallback: arc sweep
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        g.addColorStop(0, dark ? "rgba(74,144,245,0.18)" : "rgba(58,123,213,0.14)");
        g.addColorStop(1, "transparent");
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, angle - 1.1, angle);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }

      // Signal dots
      const signals = [
        { r: maxR * 0.28, a: 0.8,  size: 3.5, pulse: 1.4 },
        { r: maxR * 0.58, a: 2.3,  size: 2.5, pulse: 1.0 },
        { r: maxR * 0.71, a: 4.1,  size: 4.0, pulse: 1.8 },
        { r: maxR * 0.44, a: 5.0,  size: 2.0, pulse: 0.8 },
        { r: maxR * 0.85, a: 1.5,  size: 3.0, pulse: 1.2 },
        { r: maxR * 0.35, a: 3.6,  size: 2.2, pulse: 1.1 },
      ];
      const t = Date.now() * 0.001;
      signals.forEach(({ r, a, size, pulse }) => {
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        const pulsed = size + Math.sin(t * pulse + a) * 1.2;
        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, pulsed * 3.5);
        glow.addColorStop(0, dark ? "rgba(74,144,245,0.6)" : "rgba(58,123,213,0.5)");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, pulsed * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, pulsed, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `${fg}0.9)` : `${fg}0.85)`;
        ctx.fill();
      });

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `${fg}0.9)` : `${fg}0.85)`;
      ctx.fill();

      angle += 0.012;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [dark]);

  return (
    <canvas ref={ref} style={{ width: 420, height: 420, maxWidth: "100%" }} />
  );
}

// ── WORK visualization: neural mesh / thought graph ────────────────────────
function WorkCanvas({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const W = 420, H = 420;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Nodes arranged in radial layers
    const layers = [
      [{ x: 0, y: 0, r: 7, label: "You" }],
      [
        { x: -80, y: -70, r: 5, label: "NL" },
        { x:  80, y: -80, r: 5, label: "ES" },
        { x: 110, y:  30, r: 5, label: "SS" },
        { x:  30, y: 105, r: 5, label: "LI" },
        { x: -90, y:  70, r: 5, label: "PC" },
        { x: -35, y:-110, r: 5, label: "VD" },
      ],
      [
        { x:-155, y: -50, r: 3.5, label: "" },
        { x:-110, y:-140, r: 3.5, label: "" },
        { x:  30, y:-165, r: 3.5, label: "" },
        { x: 165, y: -85, r: 3.5, label: "" },
        { x: 175, y:  65, r: 3.5, label: "" },
        { x:  80, y: 165, r: 3.5, label: "" },
        { x: -80, y: 160, r: 3.5, label: "" },
        { x:-165, y:  90, r: 3.5, label: "" },
      ],
    ];
    const cx = W / 2, cy = H / 2;
    const allNodes = ([] as typeof layers[0]).concat(...layers).map(n => ({ ...n, x: cx + n.x, y: cy + n.y }));
    const connections: [number, number][] = [];
    // Center to layer 1
    layers[1].forEach((_, i) => connections.push([0, 1 + i]));
    // Layer 1 to some layer 2
    const l1start = 1, l2start = 1 + layers[1].length;
    layers[2].forEach((_, i) => {
      connections.push([l1start + (i % layers[1].length), l2start + i]);
    });
    // Some layer 1 cross connections
    connections.push([l1start, l1start + 2]);
    connections.push([l1start + 1, l1start + 3]);
    connections.push([l1start + 4, l1start + 5]);

    const teal = dark ? "rgba(13,140,158," : "rgba(13,140,158,";

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Draw edges
      connections.forEach(([a, b]) => {
        const na = allNodes[a], nb = allNodes[b];
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + a * 0.7 + b * 0.5);
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = dark
          ? `rgba(13,140,158,${0.08 + pulse * 0.14})`
          : `rgba(13,140,158,${0.07 + pulse * 0.12})`;
        ctx.lineWidth = 0.8 + pulse * 0.6;
        ctx.stroke();
      });

      // Draw nodes
      allNodes.forEach((n, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 0.9);
        const rPulse = n.r * (1 + pulse * 0.25);

        // Glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rPulse * 4);
        g.addColorStop(0, `${teal}${0.4 + pulse * 0.25})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, rPulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, rPulse, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `${teal}0.85)` : `${teal}0.80)`;
        ctx.fill();

        // Label for layer 1 nodes
        if (n.label && n.r >= 4) {
          ctx.font = `${n.r === 7 ? "600" : "500"} ${n.r === 7 ? 11 : 9}px 'DM Sans', sans-serif`;
          ctx.fillStyle = dark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.92)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, n.x, n.y);
        }
      });

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [dark]);

  return (
    <canvas ref={ref} style={{ width: 420, height: 420, maxWidth: "100%" }} />
  );
}

// ── WRAP visualization: expanding rings / broadcast ────────────────────────
function WrapCanvas({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const W = 420, H = 420;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2;
    const violet = dark ? "rgba(160,128,245," : "rgba(120,80,220,";

    // Rings with staggered birth times
    const rings: { born: number; maxR: number; speed: number }[] = [
      { born: 0,   maxR: 170, speed: 0.6 },
      { born: 0.8, maxR: 170, speed: 0.6 },
      { born: 1.6, maxR: 170, speed: 0.6 },
      { born: 2.4, maxR: 170, speed: 0.6 },
    ];

    // Platform dots around outer edge
    const platforms = [
      { a: -0.5,  label: "LI" },
      { a:  0.4,  label: "NL" },
      { a:  1.3,  label: "YT" },
      { a:  2.1,  label: "TW" },
      { a:  3.0,  label: "SC" },
      { a:  4.0,  label: "SB" },
      { a:  4.9,  label: "IG" },
    ];

    let t = 0;
    const period = 3.2;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;

      // Expanding rings
      rings.forEach(({ born, maxR, speed }) => {
        const phase = ((t + born) % period) / period;
        const r = phase * maxR * speed * (period / speed);
        const clampedR = Math.min(r, maxR);
        const alpha = Math.max(0, 1 - clampedR / maxR);

        ctx.beginPath();
        ctx.arc(cx, cy, clampedR, 0, Math.PI * 2);
        ctx.strokeStyle = dark
          ? `${violet}${alpha * 0.55})`
          : `${violet}${alpha * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Inner filled circle
      const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
      innerGlow.addColorStop(0, dark ? `${violet}0.35)` : `${violet}0.28)`);
      innerGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `${violet}0.85)` : `${violet}0.80)`;
      ctx.fill();

      ctx.font = "600 10px 'DM Sans', sans-serif";
      ctx.fillStyle = dark ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EW", cx, cy);

      // Platform dots
      platforms.forEach(({ a, label }) => {
        const r = 148;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + a);

        // Connection line
        const linePhase = ((t + a * 0.3) % period) / period;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = dark
          ? `${violet}${0.05 + linePhase * 0.2})`
          : `${violet}${0.04 + linePhase * 0.16})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Dot
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, `${violet}${0.3 + pulse * 0.2})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `${violet}0.78)` : `${violet}0.72)`;
        ctx.fill();

        ctx.font = "500 7.5px 'DM Sans', sans-serif";
        ctx.fillStyle = dark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.90)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y);
      });

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [dark]);

  return (
    <canvas ref={ref} style={{ width: 420, height: 420, maxWidth: "100%" }} />
  );
}

// ── Word-by-word scroll reveal ─────────────────────────────────────────────
function Reveal({ text, delay = 0, size = "inherit", weight = 400, color = "inherit", lineHeight = 1.2, center = false, maxWidth }: {
  text: string; delay?: number; size?: string | number; weight?: number;
  color?: string; lineHeight?: number; center?: boolean; maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ maxWidth, textAlign: center ? "center" : "left" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.26em",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(12px)",
          transition: `opacity .5s ${delay + i * 0.032}s ease, transform .5s ${delay + i * 0.032}s cubic-bezier(.16,1,.3,1)`,
          fontSize: size, fontWeight: weight, color, lineHeight,
        }}>{w}</span>
      ))}
    </div>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(18px)",
      transition: `opacity .65s ${delay}s cubic-bezier(.16,1,.3,1), transform .65s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

function FeatureRow({ abbr, title, desc, delay = 0, accent, dark }: {
  abbr: string; title: string; desc: string; delay?: number; accent: string; dark: boolean;
}) {
  return (
    <FadeIn delay={delay}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: `${accent}14`, border: `1px solid ${accent}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: accent, letterSpacing: "0.05em",
        }}>{abbr}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: dark ? "#e8e8e6" : "#111110", marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 13, color: dark ? "rgba(240,240,238,0.45)" : "#6B6B68", lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </FadeIn>
  );
}

function GateCard({ num, name, desc, color, delay, dark }: {
  num: string; name: string; desc: string; color: string; delay: number; dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      padding: "22px 20px", borderRadius: 14, textAlign: "left",
      background: dark ? `${color}0c` : `${color}08`,
      border: `1px solid ${color}${dark ? "28" : "20"}`,
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(14px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>
      <div style={{ fontSize: 9, letterSpacing: ".14em", color: `${color}${dark ? "99" : "80"}`, marginBottom: 8, fontWeight: 700 }}>{num}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: dark ? "#e8e8e6" : "#111110", marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, color: dark ? "rgba(240,240,238,0.38)" : "#6B6B68", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

function DnaBar({ label, score, delay = 0, dark }: { label: string; score: number; delay?: number; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 12,
      opacity: vis ? 1 : 0, transition: `opacity .5s ${delay}s ease` }}>
      <div style={{ fontSize: 12, color: dark ? "rgba(240,240,238,0.48)" : "#6B6B68", width: 154, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 2, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: dark ? "linear-gradient(90deg, #4a90f5, #90c8ff)" : "linear-gradient(90deg, #3A7BD5, #6EB8FF)",
          width: vis ? `${score}%` : "0%",
          transition: `width 1.1s ${delay + 0.1}s cubic-bezier(.16,1,.3,1)`,
        }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#e8e8e6" : "#111110", width: 24, textAlign: "right" }}>{score}</div>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────
function SectionDivider({ label, dark }: { label: string; dark: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, maxWidth: 1080, margin: "0 auto", padding: "0 40px" }}>
      <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
      <span style={{ fontSize: 9, letterSpacing: ".2em", color: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Sync with GlobalCursor
  useEffect(() => {
    document.body.classList.toggle("cursor-on-dark", dark);
    document.body.classList.toggle("cursor-on-light", !dark);
  }, [dark]);

  const bg      = dark ? "#0C0C0A" : "#FAFAF8";
  const fg      = dark ? "#E8E8E6" : "#111110";
  const fg2     = dark ? "rgba(232,232,230,0.50)" : "#6B6B68";
  const fg3     = dark ? "rgba(232,232,230,0.28)" : "#9B9B98";
  const line    = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const surface = dark ? "#151513" : "#FFFFFF";
  const navBg   = scrollY > 40
    ? (dark ? "rgba(12,12,10,0.92)" : "rgba(250,250,248,0.94)")
    : "transparent";

  // Section backgrounds
  const secBg1 = dark
    ? "linear-gradient(180deg, #0C0C0A 0%, #0a0e1a 100%)"
    : "linear-gradient(180deg, #FAFAF8 0%, #F0F5FF 100%)";
  const secBg2 = dark
    ? "linear-gradient(180deg, #0a0e1a 0%, #081418 100%)"
    : "linear-gradient(180deg, #F0F5FF 0%, #F0F8F8 100%)";
  const secBg3 = dark
    ? "linear-gradient(180deg, #081418 0%, #100a22 100%)"
    : "linear-gradient(180deg, #F0F8F8 0%, #F5F0FF 100%)";

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif", background: bg, color: fg, overflowX: "hidden", transition: "background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg,
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? `1px solid ${line}` : "none",
        transition: "all .4s ease",
      }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: fg, letterSpacing: "-.01em", opacity: 0.9 }}>EVERY</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: fg2, letterSpacing: "-.01em", opacity: 0.5 }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".18em", color: fg3, marginLeft: 6, textTransform: "uppercase" }}>Studio</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Theme toggle */}
          <button
            onClick={() => setDark(d => !d)}
            style={{
              width: 36, height: 20, borderRadius: 10, border: `1px solid ${line}`,
              background: dark ? "#3A7BD5" : "rgba(0,0,0,0.08)",
              position: "relative", cursor: "pointer", transition: "all .25s",
            }}
            title={dark ? "Switch to light" : "Switch to dark"}
          >
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: dark ? "#fff" : "#111",
              position: "absolute", top: 2, left: dark ? 18 : 2,
              transition: "left .25s cubic-bezier(.16,1,.3,1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8,
            }}>{dark ? "●" : "○"}</div>
          </button>

          <button
            onClick={() => nav("/auth")}
            style={{
              background: dark ? "rgba(255,255,255,0.08)" : "#111110",
              border: "none", borderRadius: 100, padding: "7px 22px",
              color: dark ? "rgba(255,255,255,0.82)" : "#FAFAF8",
              fontSize: 13, fontWeight: 500, fontFamily: "'Afacad Flux',sans-serif",
              transition: "opacity .2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".78"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >
            Get Early Access
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "130px 40px 100px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Soft gradient bg */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: dark
            ? "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(58,123,213,0.12) 0%, transparent 70%)"
            : "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(58,123,213,0.07) 0%, transparent 70%)",
        }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 860 }}>
          {/* Label */}
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".22em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 28, fontWeight: 600 }}>
              Orchestrated Intelligence
            </div>
          </FadeIn>

          <Reveal
            text="One idea. Everywhere."
            size="clamp(52px,8.5vw,108px)" weight={700} lineHeight={.92}
            color={fg} center delay={0.05}
          />

          <div style={{ marginTop: 24 }}>
            <Reveal
              text="EVERYWHERE Studio orchestrates your thinking into content that lands everywhere your audience is. The fidelity of your voice. The strategy of a team. The speed of AI."
              size="clamp(16px,2vw,19px)" weight={400} lineHeight={1.7}
              color={fg2} center delay={0.22} maxWidth="640px"
            />
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 0, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[["40+","Intelligent Agents"],["12","Output Formats"],["7","Quality Gates"],["94.7","Voice Fidelity"]].map(([n,l],i) => (
              <FadeIn key={i} delay={0.38 + i * 0.07}>
                <div style={{
                  padding: "18px 32px", textAlign: "center",
                  borderRight: i < 3 ? `1px solid ${line}` : "none",
                }}>
                  <div style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: fg, letterSpacing: "-.04em", lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 10, color: fg3, marginTop: 5, letterSpacing: ".08em", textTransform: "uppercase" }}>{l}</div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* CTA */}
          <FadeIn delay={0.65}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 44, flexWrap: "wrap" }}>
              <button
                onClick={() => nav("/auth")}
                style={{
                  background: dark ? "#fff" : "#111110",
                  border: "none", borderRadius: 100, padding: "13px 40px",
                  fontSize: 14, fontWeight: 600,
                  color: dark ? "#0C0C0A" : "#FAFAF8",
                  fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer",
                  transition: "opacity .2s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                Get Early Access
              </button>
              <button
                onClick={() => document.getElementById("watch-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  background: "transparent",
                  border: `1px solid ${line}`,
                  borderRadius: 100, padding: "13px 40px",
                  fontSize: 14, fontWeight: 500,
                  color: fg2, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer",
                  transition: "border-color .2s, color .2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fg3; (e.currentTarget as HTMLElement).style.color = fg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = line; (e.currentTarget as HTMLElement).style.color = fg2; }}
              >
                See How It Works
              </button>
            </div>
          </FadeIn>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", opacity: 0.3, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
            <rect x="1" y="1" width="14" height="20" rx="7" stroke={fg} strokeWidth="1.2"/>
            <circle cx="8" cy="7" r="2" fill={fg}/>
          </svg>
          <span style={{ fontSize: 9, letterSpacing: ".18em", color: fg3, textTransform: "uppercase" }}>Scroll</span>
        </div>
      </section>

      <div style={{ padding: "80px 0 64px" }}><SectionDivider label="The Three Rooms" dark={dark} /></div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 1 — WATCH                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="watch-section" style={{ padding: "0 40px 120px", background: secBg1, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 80px", alignItems: "center" }}>
            {/* Canvas side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <WatchCanvas dark={dark} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>Room One</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: fg, letterSpacing: "-.03em", lineHeight: 1 }}>WATCH</div>
                <div style={{ fontSize: 13, color: fg3, marginTop: 6 }}>The Signal Room</div>
              </div>
            </div>

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Reveal
                text="Your Sentinel scans the world so you never miss a signal."
                size="clamp(22px,2.8vw,34px)" weight={700} lineHeight={1.18} color={fg} delay={0.08}
              />
              <Reveal
                text="While you sleep, WATCH monitors hundreds of sources. Industry news, competitor moves, trending conversations. It surfaces only what matters to your work."
                size={15} weight={400} lineHeight={1.72} color={fg2} delay={0.24}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
                <FeatureRow abbr="SB" title="Sentinel Briefings" desc="AI-curated signal reports delivered to your studio every morning." delay={0.08} accent="#3A7BD5" dark={dark} />
                <FeatureRow abbr="IG" title="Interest Graph" desc="Learns what matters to your audience and filters everything else out." delay={0.16} accent="#3A7BD5" dark={dark} />
                <FeatureRow abbr="FS" title="Fish Score" desc="Rates each signal by relevance, timeliness, and content potential." delay={0.24} accent="#3A7BD5" dark={dark} />
                <FeatureRow abbr="WS" title="Write From Signal" desc="One tap turns any signal into a fully sourced content brief." delay={0.32} accent="#3A7BD5" dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ padding: "0 0 80px" }}><SectionDivider label="Next" dark={dark} /></div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 2 — WORK                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 40px 120px", background: secBg2, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 80px", alignItems: "center" }}>
            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Reveal
                text="Forty agents transform your voice into twelve formats."
                size="clamp(22px,2.8vw,34px)" weight={700} lineHeight={1.18} color={fg} delay={0.08}
              />
              <Reveal
                text="WORK is the engine room. Tell Watson what you are thinking. A rough idea, a voice memo, a half-formed thesis. The agent orchestra turns it into everything."
                size={15} weight={400} lineHeight={1.72} color={fg2} delay={0.24}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                {["LinkedIn Post","Newsletter","Sunday Story","Podcast Script","Twitter Thread","Essay","Short Video","Substack Note","Talk Outline","Email Campaign","Blog Post","Executive Brief"].map((f, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "4px 11px", borderRadius: 100,
                    background: dark ? "rgba(13,140,158,0.10)" : "rgba(13,140,158,0.07)",
                    border: `1px solid ${dark ? "rgba(13,140,158,0.22)" : "rgba(13,140,158,0.18)"}`,
                    color: dark ? "rgba(232,232,230,0.62)" : "#4B4B48", letterSpacing: ".01em",
                  }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Canvas side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <WorkCanvas dark={dark} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#0D8C9E", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>Room Two</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: fg, letterSpacing: "-.03em", lineHeight: 1 }}>WORK</div>
                <div style={{ fontSize: 13, color: fg3, marginTop: 6 }}>The Engine Room</div>
              </div>
            </div>
          </div>

          {/* Voice DNA */}
          <div style={{ marginTop: 72 }}>
            <FadeIn delay={0.1}>
              <div style={{
                background: dark ? "rgba(255,255,255,0.03)" : surface,
                border: `1px solid ${line}`,
                borderRadius: 20, padding: "36px 44px",
                boxShadow: dark ? "none" : "0 2px 20px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".16em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Voice DNA</div>
                    <Reveal text="Every output sounds exactly like you." size={22} weight={700} color={fg} delay={0.1} />
                    <div style={{ marginTop: 10 }}>
                      <Reveal text="We capture your authentic voice across five dimensions. No matter the format, readers will know it is you." size={14} weight={400} color={fg2} lineHeight={1.65} delay={0.22} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <DnaBar label="Vocabulary and Syntax" score={88} delay={0.08} dark={dark} />
                    <DnaBar label="Tonal Register" score={94} delay={0.16} dark={dark} />
                    <DnaBar label="Rhythm and Cadence" score={91} delay={0.24} dark={dark} />
                    <DnaBar label="Metaphor Patterns" score={87} delay={0.32} dark={dark} />
                    <DnaBar label="Structural Habits" score={96} delay={0.40} dark={dark} />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div style={{ padding: "0 0 80px" }}><SectionDivider label="Next" dark={dark} /></div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACT 3 — WRAP                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 40px 120px", background: secBg3, transition: "background .3s" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px 80px", alignItems: "center" }}>
            {/* Canvas side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <WrapCanvas dark={dark} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: ".22em", color: "#7850DC", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>Room Three</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: fg, letterSpacing: "-.03em", lineHeight: 1 }}>WRAP</div>
                <div style={{ fontSize: 13, color: fg3, marginTop: 6 }}>The Distribution Room</div>
              </div>
            </div>

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Reveal
                text="Schedule, deploy, measure. Your thinking in the world."
                size="clamp(22px,2.8vw,34px)" weight={700} lineHeight={1.18} color={fg} delay={0.08}
              />
              <Reveal
                text="WRAP closes the loop. Schedule posts across platforms, deliver newsletters, track what lands. The data feeds back into WATCH so your next idea is sharper than the last."
                size={15} weight={400} lineHeight={1.72} color={fg2} delay={0.24}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
                <FeatureRow abbr="CC" title="Content Calendar" desc="Visual scheduling across all your channels from a single canvas." delay={0.08} accent="#7850DC" dark={dark} />
                <FeatureRow abbr="OD" title="One-Click Deploy" desc="Publish to LinkedIn, newsletter, Substack, social simultaneously." delay={0.16} accent="#7850DC" dark={dark} />
                <FeatureRow abbr="PL" title="Performance Loop" desc="Engagement data flows back to sharpen your next content strategy." delay={0.24} accent="#7850DC" dark={dark} />
                <FeatureRow abbr="FW" title="The Flywheel" desc="Every post makes the next one better. Ideas compound over time." delay={0.32} accent="#7850DC" dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 QUALITY GATES ─────────────────────────────────────── */}
      <section style={{
        padding: "100px 40px 120px",
        background: dark
          ? `linear-gradient(180deg, #100a22 0%, #0C0C0A 100%)`
          : `linear-gradient(180deg, #F5F0FF 0%, #FAFAF8 100%)`,
        transition: "background .3s",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#7850DC", textTransform: "uppercase", marginBottom: 18, fontWeight: 600 }}>Quality Gates</div>
          </FadeIn>
          <Reveal
            text="Nothing ships without passing the gates."
            size="clamp(28px,4.5vw,52px)" weight={700} lineHeight={1.06} color={fg} center delay={0.08}
          />
          <div style={{ marginTop: 14, marginBottom: 52 }}>
            <Reveal
              text="Every piece of content runs through 7 quality gates before it reaches your audience. No AI tells. No off-brand moments. No weak writing."
              size={15} weight={400} lineHeight={1.65} color={fg2} center delay={0.22}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              ["01","Strategy", "Does this serve your goals?",           "#3A7BD5"],
              ["02","Voice",    "Does this sound like you?",             "#0D8C9E"],
              ["03","Accuracy", "Are the facts correct?",                "#C8961A"],
              ["04","AI Tells", "Could anyone spot the AI?",             "#e85d75"],
              ["05","Audience", "Will this resonate?",                   "#7850DC"],
              ["06","Platform", "Is this native to the channel?",        "#4ab8f5"],
              ["07","Impact",   "Will this move people to action?",      "#10b981"],
            ].map(([num, name, desc, color], i) => (
              <GateCard key={i} num={num} name={name} desc={desc} color={color} delay={0.05 + i * 0.055} dark={dark} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 40px 90px",
        background: dark
          ? "linear-gradient(180deg, #0C0C0A 0%, #0C0C0A 100%)"
          : "linear-gradient(180deg, #FAFAF8 0%, #FAFAF8 100%)",
        textAlign: "center",
        borderTop: `1px solid ${line}`,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn delay={0}>
            <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#3A7BD5", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>Get Started</div>
          </FadeIn>
          <Reveal
            text="Your thinking deserves to be everywhere."
            size="clamp(32px,5vw,62px)" weight={700} lineHeight={1.06} color={fg} center delay={0.08}
          />
          <div style={{ marginTop: 16 }}>
            <Reveal
              text="Join thought leaders building their content presence with EVERYWHERE Studio."
              size={16} weight={400} lineHeight={1.65} color={fg2} center delay={0.24}
            />
          </div>
          <FadeIn delay={0.45}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 44, flexWrap: "wrap" }}>
              <button
                onClick={() => nav("/auth")}
                style={{
                  background: dark ? "#fff" : "#111110",
                  border: "none", borderRadius: 100, padding: "14px 44px",
                  fontSize: 14, fontWeight: 700,
                  color: dark ? "#0C0C0A" : "#FAFAF8",
                  fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer",
                  transition: "opacity .2s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                Get Early Access
              </button>
              <button
                onClick={() => nav("/studio/dashboard")}
                style={{
                  background: "transparent", border: `1px solid ${line}`,
                  borderRadius: 100, padding: "14px 44px",
                  fontSize: 14, fontWeight: 500,
                  color: fg2, fontFamily: "'Afacad Flux',sans-serif", cursor: "pointer",
                  transition: "border-color .2s, color .2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fg3; (e.currentTarget as HTMLElement).style.color = fg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = line; (e.currentTarget as HTMLElement).style.color = fg2; }}
              >
                Open Studio
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{
        padding: "24px 48px",
        borderTop: `1px solid ${line}`,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: fg, opacity: 0.65 }}>EVERY</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: fg, opacity: 0.22 }}>WHERE</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".16em", color: fg3, marginLeft: 5, textTransform: "uppercase" }}>Studio</span>
        </div>
        <span style={{ fontSize: 11, color: fg3, letterSpacing: ".04em" }}>
          2025 Mixed Grill LLC · Ideas to Impact
        </span>
      </footer>
    </div>
  );
}
