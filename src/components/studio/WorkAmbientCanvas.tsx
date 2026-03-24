import { useEffect, useRef } from "react";

interface Line {
  x: number;
  y: number;
  vx: number;
  amp: number;
  period: number;
  phase: number;
  color: string;
  width: number;
}

export default function WorkAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate lines
    const lines: Line[] = [];
    for (let i = 0; i < 25; i++) {
      const isGold = Math.random() > 0.5;
      lines.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: 0.1 + Math.random() * 0.2,
        amp: 30 + Math.random() * 30,
        period: 8 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2,
        color: isGold ? "rgba(200, 150, 26, 0.06)" : "rgba(107, 127, 242, 0.04)",
        width: 0.5 + Math.random() * 0.5,
      });
    }

    let animId: number;
    let t = 0;

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);
      t += 0.016;

      for (const line of lines) {
        line.x += line.vx;
        if (line.x > w + 50) line.x = -50;

        const baseY = line.y;
        ctx!.strokeStyle = line.color;
        ctx!.lineWidth = line.width;
        ctx!.beginPath();

        for (let px = 0; px < w; px += 4) {
          const offsetY = Math.sin((px * 0.005) + (t / line.period) + line.phase) * line.amp;
          const x = px;
          const y = baseY + offsetY;
          if (px === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,
      }}
    />
  );
}
