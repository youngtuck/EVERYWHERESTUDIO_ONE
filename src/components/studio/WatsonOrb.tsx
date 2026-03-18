import { useEffect, useRef } from 'react';

export default function WatsonOrb({ size = 120 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const s = size * 2;
    canvas.width = s * dpr;
    canvas.height = s * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId: number;

    function draw() {
      ctx!.clearRect(0, 0, s, s);
      const cx = s / 2;
      const cy = s / 2;
      const t = frame * 0.008;
      const baseRadius = size * 0.38;

      // Outer glow layers
      for (let i = 4; i >= 0; i--) {
        const glowRadius = baseRadius + i * 12 + Math.sin(t * 0.7 + i) * 4;
        const alpha = 0.03 - i * 0.005;
        const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, `rgba(74, 144, 217, ${alpha + 0.02})`);
        gradient.addColorStop(0.5, `rgba(74, 144, 217, ${alpha})`);
        gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Main orb with organic distortion
      const points = 128;
      ctx!.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave1 = Math.sin(angle * 3 + t * 1.2) * 3;
        const wave2 = Math.sin(angle * 5 - t * 0.8) * 2;
        const wave3 = Math.sin(angle * 7 + t * 1.5) * 1.5;
        const r = baseRadius + wave1 + wave2 + wave3;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();

      // Orb gradient fill
      const orbGrad = ctx!.createRadialGradient(
        cx - baseRadius * 0.3, cy - baseRadius * 0.3, 0,
        cx, cy, baseRadius * 1.2
      );
      orbGrad.addColorStop(0, 'rgba(120, 180, 240, 0.25)');
      orbGrad.addColorStop(0.3, 'rgba(74, 144, 217, 0.18)');
      orbGrad.addColorStop(0.6, 'rgba(74, 144, 217, 0.12)');
      orbGrad.addColorStop(1, 'rgba(27, 38, 59, 0.08)');
      ctx!.fillStyle = orbGrad;
      ctx!.fill();

      // Inner highlight
      const highlightGrad = ctx!.createRadialGradient(
        cx - baseRadius * 0.2, cy - baseRadius * 0.25, 0,
        cx, cy, baseRadius * 0.6
      );
      highlightGrad.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
      highlightGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');
      ctx!.fillStyle = highlightGrad;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius * 0.6, 0, Math.PI * 2);
      ctx!.fill();

      // Breathing pulse ring
      const pulseRadius = baseRadius + 8 + Math.sin(t * 0.5) * 10;
      const pulseAlpha = 0.06 + Math.sin(t * 0.5) * 0.03;
      ctx!.strokeStyle = `rgba(74, 144, 217, ${pulseAlpha})`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx!.stroke();

      // Gold accent shimmer (subtle, moves around the orb)
      const shimmerAngle = t * 0.3;
      const shimmerX = cx + Math.cos(shimmerAngle) * baseRadius * 0.7;
      const shimmerY = cy + Math.sin(shimmerAngle) * baseRadius * 0.5;
      const shimmerGrad = ctx!.createRadialGradient(shimmerX, shimmerY, 0, shimmerX, shimmerY, 15);
      shimmerGrad.addColorStop(0, 'rgba(245, 198, 66, 0.08)');
      shimmerGrad.addColorStop(1, 'rgba(245, 198, 66, 0)');
      ctx!.fillStyle = shimmerGrad;
      ctx!.beginPath();
      ctx!.arc(shimmerX, shimmerY, 15, 0, Math.PI * 2);
      ctx!.fill();

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size * 2,
        height: size * 2,
        pointerEvents: 'none',
      }}
    />
  );
}
