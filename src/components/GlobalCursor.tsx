import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ── Global Custom Cursor ───────────────────────────────────────────────────
// Handles cursor on all pages EXCEPT "/" (Index.tsx owns the landing cursor).
// Zero delay dot (snaps instantly to mouse), ring has slight trail.
// Small profile: 4px dot, 18px ring.

export default function GlobalCursor() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isDarkPage = location.pathname === "/explore";

  // Show/hide GlobalCursor based on route — hide on landing
  useEffect(() => {
    const dot  = document.getElementById("ew-cursor-dot");
    const ring = document.getElementById("ew-cursor-ring");
    if (dot)  dot.style.opacity  = isLanding ? "0" : "1";
    if (ring) ring.style.opacity = isLanding ? "0" : "1";
  }, [isLanding]);

  useEffect(() => {
    // Create cursor elements once
    if (!document.getElementById("ew-cursor-dot")) {
      const dot = document.createElement("div");
      dot.id = "ew-cursor-dot";
      document.body.appendChild(dot);
    }
    if (!document.getElementById("ew-cursor-ring")) {
      const ring = document.createElement("div");
      ring.id = "ew-cursor-ring";
      document.body.appendChild(ring);
    }
  }, []);

  useEffect(() => {
    const dot  = document.getElementById("ew-cursor-dot")  as HTMLDivElement;
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
      // Snap dot instantly — zero delay
      dot.style.transform = `translate(${mx - 2}px, ${my - 2}px)`;

      const isHover = (e.target as Element)?.closest(INTERACTIVE);
      document.body.classList.toggle("cursor-hover", !!isHover);
    };

    const draw = () => {
      // Ring lerps with a gentle trail
      rx += (mx - rx) * 0.28;
      ry += (my - ry) * 0.28;
      ring.style.transform = `translate(${rx - 9}px, ${ry - 9}px)`;
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Update body class for cursor color — dark = light cursor, light = dark cursor
  // Explore: uses data-explore-theme. All other pages (Studio, auth): use data-theme on <html> from ThemeContext.
  useEffect(() => {
    const update = () => {
      if (location.pathname === "/") return;

      let isDark: boolean;
      if (location.pathname === "/explore") {
        isDark = document.body.getAttribute("data-explore-theme") !== "light";
      } else {
        isDark = document.documentElement.getAttribute("data-theme") === "dark";
      }
      document.body.classList.toggle("cursor-on-dark", isDark);
      document.body.classList.toggle("cursor-on-light", !isDark);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-explore-theme"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}
