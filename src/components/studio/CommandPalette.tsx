import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STUDIO_LINKS: { path: string; label: string }[] = [
  { path: "/studio/dashboard", label: "Dashboard" },
  { path: "/studio/work", label: "New Session" },
  { path: "/studio/watch", label: "Watch" },
  { path: "/studio/outputs", label: "Outputs" },
  { path: "/studio/projects", label: "Projects" },
  { path: "/studio/lot", label: "The Lot" },
  { path: "/studio/resources", label: "Resources" },
  { path: "/studio/settings", label: "Settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const filtered = query.trim()
    ? STUDIO_LINKS.filter(
        (l) =>
          l.label.toLowerCase().includes(query.toLowerCase().trim())
      )
    : STUDIO_LINKS;

  const goTo = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      setSelectedIndex(0);
      if (path !== location.pathname) navigate(path);
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        goTo(filtered[selectedIndex].path);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, selectedIndex, goTo]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Quick navigation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        padding: 24,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(20, 30, 48, 0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          boxShadow: "0 16px 64px rgba(0,0,0,0.4)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .command-palette-input::placeholder { color: rgba(255,255,255,0.4); }
        `}</style>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <input
            type="text"
            placeholder="Go to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="command-palette-input"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "var(--font)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") e.preventDefault();
            }}
          />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, marginBottom: 0 }}>
            ↑↓ to move · Enter to go · Esc to close
          </p>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              No matches
            </div>
          ) : (
            filtered.map((link, i) => (
              <button
                key={link.path}
                type="button"
                onClick={() => goTo(link.path)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: i === selectedIndex ? "rgba(255,255,255,0.08)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.75)",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  setSelectedIndex(i);
                  if (i !== selectedIndex) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (i !== selectedIndex) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{link.label}</span>
                {location.pathname === link.path && (
                  <span style={{ fontSize: 13, color: "#F5C642", marginLeft: "auto" }}>Current</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
