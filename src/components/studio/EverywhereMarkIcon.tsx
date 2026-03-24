import { CSSProperties } from "react";

interface Props {
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export default function EverywhereMarkIcon({ size = 32, style, className }: Props) {
  return (
    <>
      <style>{`
        @keyframes evMorph {
          0%, 100% {
            border-radius: 50%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 60% 40% 55% 45% / 55% 45% 60% 40%;
            transform: rotate(15deg) scale(1.02);
          }
          50% {
            border-radius: 40% 60% 45% 55% / 50% 55% 45% 50%;
            transform: rotate(-10deg) scale(0.98);
          }
          75% {
            border-radius: 55% 45% 50% 50% / 40% 60% 45% 55%;
            transform: rotate(5deg) scale(1.01);
          }
        }
        @keyframes evColorShift {
          0%, 100% { background: #C8961A; }
          33% { background: #D4A832; }
          66% { background: #BF8A15; }
        }
      `}</style>
      <div
        className={className}
        style={{
          width: size,
          height: size,
          background: "#C8961A",
          animation: "evMorph 10s ease-in-out infinite, evColorShift 15s ease-in-out infinite",
          flexShrink: 0,
          ...style,
        }}
      />
    </>
  );
}
