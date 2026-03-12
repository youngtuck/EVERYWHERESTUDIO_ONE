import type { CSSProperties } from "react";

interface ProgressIndicatorProps {
  currentStep: number; // 1-based
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const pct = (clampedStep / totalSteps) * 100;

  const barTrack: CSSProperties = {
    width: "100%",
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  };

  const barFill: CSSProperties = {
    height: "100%",
    width: `${pct}%`,
    background: "#C8961A",
    transition: "width 0.3s cubic-bezier(.16,1,.3,1)",
  };

  const dotsWrap: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  };

  const dotBase: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.16)",
  };

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto 32px" }}>
      <div style={barTrack}>
        <div style={barFill} />
      </div>
      <div style={dotsWrap}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const step = idx + 1;
          const isActive = step === clampedStep;
          const isCompleted = step < clampedStep;
          const opacity = isCompleted ? 1 : isActive ? 0.9 : 0.35;
          const scale = isActive ? 1.2 : 1;
          const style: CSSProperties = {
            ...dotBase,
            background: isCompleted || isActive ? "#C8961A" : dotBase.background,
            opacity,
            transform: `scale(${scale})`,
            transition: "all 0.2s ease",
          };
          return <div key={step} style={style} />;
        })}
      </div>
    </div>
  );
}

