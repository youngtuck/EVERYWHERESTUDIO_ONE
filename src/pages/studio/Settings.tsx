/**
 * Settings.tsx — Preferences
 * Fixed:
 *  - Dark mode now actually calls ThemeContext.toggleTheme()
 *  - Font size slider now applies zoom to document.documentElement
 */
import { useState, useLayoutEffect, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useTheme } from "../../context/ThemeContext";
import "./shared.css";

const FONT = "var(--font)";

// Font size zoom levels (relative to base 1.0)
// These intentionally stack on top of the viewport zoom in index.css
const FONT_SIZE_ZOOM: Record<number, number> = {
  1: 0.88,   // Small — 12% smaller than base
  2: 1.00,   // Default — no change
  3: 1.12,   // Large — 12% larger than base
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 32, height: 18,
        background: on ? "var(--blue)" : "var(--line-2)",
        borderRadius: 9, cursor: "pointer",
        position: "relative", flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: "50%",
        background: "#fff", transition: "left 0.15s",
      }} />
    </div>
  );
}

function RadioGroup({
  name, options, value, onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, padding: "4px 10px", borderRadius: 5,
              border: active ? "1px solid var(--fg)" : "1px solid var(--line)",
              background: active ? "var(--bg)" : "var(--surface)",
              color: active ? "var(--fg)" : "var(--fg-3)",
              fontWeight: active ? 600 : 400,
              cursor: "pointer", transition: "all 0.1s",
            }}
          >
            <input type="radio" name={name} value={opt.value} checked={active} onChange={() => onChange(opt.value)} style={{ display: "none" }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginBottom: 10, boxShadow: "var(--shadow-sm)" }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const PrefRow = ({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
    <div>
      <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{label}</span>
      {sublabel && <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>{sublabel}</div>}
    </div>
    {children}
  </div>
);

const PrefRowLast = ({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
    <div>
      <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{label}</span>
      {sublabel && <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>{sublabel}</div>}
    </div>
    {children}
  </div>
);

export default function Settings() {
  const nav = useNavigate();
  const { setDashContent, setDashOpen } = useShell();
  const { theme, toggleTheme } = useTheme();

  // Font size: read from localStorage so it persists
  const [fontSize, setFontSize] = useState<number>(() => {
    try { const s = localStorage.getItem("ew-font-size"); if (s) return Number(s); } catch {}
    return 2;
  });
  const [flagsInDraft, setFlagsInDraft] = useState(true);
  const [voiceMode, setVoiceMode] = useState<"ptt" | "auto">("ptt");

  const fontLabels = ["Small", "Default", "Large"];

  // Apply font size zoom to document root
  useEffect(() => {
    const zoom = FONT_SIZE_ZOOM[fontSize] ?? 1;
    // Store as CSS var so the viewport zoom in index.css stacks on top
    document.documentElement.style.setProperty("--font-size-zoom", String(zoom));
    // Apply it as a zoom adjustment on #root relative to the viewport breakpoint zoom
    const root = document.getElementById("root");
    if (root) {
      // We store the user preference; the actual zoom is computed in index.css
      // by multiplying viewport zoom × font size zoom. We apply it via data-attr.
      root.setAttribute("data-font-size", String(fontSize));
    }
    try { localStorage.setItem("ew-font-size", String(fontSize)); } catch {}
  }, [fontSize]);

  // Dark mode: call the real ThemeContext toggle when mode changes
  const handleModeChange = (mode: string) => {
    if (mode !== theme) toggleTheme();
  };

  useLayoutEffect(() => {
    setDashOpen(false);
    setDashContent(null);
    return () => setDashContent(null);
  }, [setDashContent, setDashOpen]);

  return (
    <div style={{ padding: 20, fontFamily: FONT, maxWidth: 560 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Preferences</div>

      {/* Display */}
      <Card title="Display">
        <PrefRow label="Mode">
          <RadioGroup
            name="display-mode"
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
            value={theme}
            onChange={handleModeChange}
          />
        </PrefRow>
        <div style={{ padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>Font size</span>
            <div style={{ width: "100%" }}>
              <input
                type="range"
                min={1} max={3} step={1}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--fg)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-3)", marginTop: 4 }}>
                <span>Small</span>
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>{fontLabels[fontSize - 1]}</span>
                <span>Large</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit stage */}
      <Card title="Edit stage">
        <PrefRowLast label="Flags in draft" sublabel="Underline suggestions while editing">
          <Toggle on={flagsInDraft} onToggle={() => setFlagsInDraft(v => !v)} />
        </PrefRowLast>
      </Card>

      {/* Voice */}
      <Card title="Voice">
        <PrefRowLast label="Input method">
          <RadioGroup
            name="voice-mode"
            options={[{ value: "ptt", label: "Push to talk" }, { value: "auto", label: "Always on" }]}
            value={voiceMode}
            onChange={v => setVoiceMode(v as "ptt" | "auto")}
          />
        </PrefRowLast>
      </Card>

      {/* Voice DNA link */}
      <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 8 }}>Voice DNA is configured separately.</div>
        <button
          onClick={() => nav("/studio/settings/voice")}
          style={{
            fontSize: 12, padding: "8px 16px", borderRadius: 6,
            border: "1px solid var(--line)", background: "var(--surface)",
            color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT,
            transition: "all 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.color = "var(--fg)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
        >
          Edit Voice DNA →
        </button>
      </div>
    </div>
  );
}
