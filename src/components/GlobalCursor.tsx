import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ── Global Custom Cursor ───────────────────────────────────────────────────
// Single dot + ring cursor that works across all pages.
// On landing "/" the cursor is white to show on the dark indigo bg.
// On studio/explore pages the cursor is dark (charcoal) to show on light bg.
// The ring lerps behind the dot for a soft trailing feel.

export default function GlobalCursor() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isDarkPage = location.pathname === "/explore" || isLanding;

  useEffect(() => {
    // Create cursor elements once
    let dot = document.getElementById("ew-cursor-dot") as HTMLDivElement | null;
    let ring = document.getElementById("ew-cursor-ring") as HTMLDivElement | null;

    if (!dot) {
      dot = document.createElement("div");
      dot.id = "ew-cursor-dot";
      document.body.appendChild(dot);
    }
    if (!ring) {
      ring = document.createElement("div");
      ring.id = "ew-cursor-ring";
      document.body.appendChild(ring);
    }

    return () => {
      // Don't remove on route change — they persist
    };
  }, []);

  useEffect(() => {
    const dot = document.getElementById("ew-cursor-dot") as HTMLDivElement;
    const ring = document.getElementById("ew-cursor-ring") as HTMLDivElement;
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    const INTERACTIVE = "a,button,input,textarea,select,[role='button'],[tabindex]";

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;

      const target = e.target as Element;
      const isHover = target?.closest(INTERACTIVE);
      document.body.classList.toggle("cursor-hover", !!isHover);
    };

    const draw = () => {
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Update cursor color based on page
  useEffect(() => {
    document.body.classList.toggle("cursor-on-dark", isDarkPage);
    document.body.classList.toggle("cursor-on-light", !isDarkPage);
  }, [isDarkPage]);

  return null;
}
