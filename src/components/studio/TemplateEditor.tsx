/**
 * TemplateEditor: Shows editable template settings for the selected output type.
 *
 * Base templates are locked (can only be hidden).
 * Custom templates can be created from base.
 * Human Voice Test is LOCKED ON in every template, always.
 */

import { useState } from "react";

const FONT = "var(--font)";

export interface TemplateSettings {
  wordCountRange: [number, number];
  formatType: string;
  deliverables: string[];
  options: {
    cta: boolean;
    pullQuotes: boolean;
  };
  qualitySettings: {
    checkpointToggles: Record<string, boolean>;
    impactThreshold: number;
    humanVoiceTest: true; // Always true, locked
  };
  voiceDnaSource: string;
  brandDnaApplied: boolean;
}

export interface Template {
  id: string;
  outputType: string;
  name: string;
  isBase: boolean;
  isHidden: boolean;
  settings: TemplateSettings;
}

const DEFAULT_SETTINGS: TemplateSettings = {
  wordCountRange: [500, 2000],
  formatType: "standard",
  deliverables: ["Draft"],
  options: { cta: false, pullQuotes: false },
  qualitySettings: {
    checkpointToggles: {
      "Deduplication": true,
      "Research Validation": true,
      "Voice Authenticity": true,
      "Engagement Optimization": true,
      "SLOP Detection": true,
      "Editorial Excellence": true,
      "Perspective & Risk": true,
    },
    impactThreshold: 75,
    humanVoiceTest: true,
  },
  voiceDnaSource: "",
  brandDnaApplied: true,
};

interface TemplateEditorProps {
  template: Template;
  onSave: (updated: Template) => void;
  onSaveAsCustom: (name: string, settings: TemplateSettings) => void;
}

function LockIcon() {
  return (
    <svg style={{ width: 10, height: 10, stroke: "var(--fg-3)", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function TemplateEditor({ template, onSave, onSaveAsCustom }: TemplateEditorProps) {
  const [settings, setSettings] = useState<TemplateSettings>(template.settings || DEFAULT_SETTINGS);
  const [customName, setCustomName] = useState("");

  const checkpoints = Object.entries(settings.qualitySettings.checkpointToggles);

  const toggleCheckpoint = (name: string) => {
    if (template.isBase) return; // Base templates: checkpoints locked per output type
    setSettings(prev => ({
      ...prev,
      qualitySettings: {
        ...prev.qualitySettings,
        checkpointToggles: {
          ...prev.qualitySettings.checkpointToggles,
          [name]: !prev.qualitySettings.checkpointToggles[name],
        },
      },
    }));
  };

  return (
    <div style={{ fontFamily: FONT, fontSize: 11 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>
        Template: {template.name}
        {template.isBase && <span style={{ color: "var(--gold)", marginLeft: 6 }}>(base)</span>}
      </div>

      {/* Word count range */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 4 }}>Word count range</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="number"
            value={settings.wordCountRange[0]}
            onChange={e => setSettings(prev => ({ ...prev, wordCountRange: [+e.target.value, prev.wordCountRange[1]] }))}
            style={{ width: 60, padding: 4, fontSize: 10, borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg)", fontFamily: FONT }}
          />
          <span style={{ color: "var(--fg-3)" }}>to</span>
          <input
            type="number"
            value={settings.wordCountRange[1]}
            onChange={e => setSettings(prev => ({ ...prev, wordCountRange: [prev.wordCountRange[0], +e.target.value] }))}
            style={{ width: 60, padding: 4, fontSize: 10, borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg)", fontFamily: FONT }}
          />
        </div>
      </div>

      {/* Quality checkpoints */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 4 }}>Quality checkpoints</div>
        {checkpoints.map(([name, enabled]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => toggleCheckpoint(name)}
              disabled={template.isBase}
              style={{ accentColor: "var(--gold-bright)" }}
            />
            <span style={{ color: "var(--fg-2)", fontSize: 10 }}>{name}</span>
          </div>
        ))}
        {/* HVT always locked on */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
          <input type="checkbox" checked disabled style={{ accentColor: "var(--gold-bright)" }} />
          <span style={{ color: "var(--fg-2)", fontSize: 10 }}>Human Voice Test</span>
          <LockIcon />
          <span style={{ fontSize: 8, color: "var(--fg-3)" }}>always on</span>
        </div>
      </div>

      {/* Impact threshold */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 4 }}>Impact threshold</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            value={settings.qualitySettings.impactThreshold}
            onChange={e => setSettings(prev => ({
              ...prev,
              qualitySettings: { ...prev.qualitySettings, impactThreshold: Math.max(0, Math.min(100, +e.target.value)) },
            }))}
            min={0} max={100}
            style={{ width: 50, padding: 4, fontSize: 10, borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg)", fontFamily: FONT }}
          />
          <span style={{ color: "var(--fg-3)", fontSize: 10 }}>/ 100</span>
        </div>
      </div>

      {/* Options */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 4 }}>Options</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
          <input type="checkbox" checked={settings.options.cta} onChange={() => setSettings(prev => ({ ...prev, options: { ...prev.options, cta: !prev.options.cta } }))} style={{ accentColor: "var(--gold-bright)" }} />
          <span style={{ color: "var(--fg-2)", fontSize: 10 }}>Include CTA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
          <input type="checkbox" checked={settings.options.pullQuotes} onChange={() => setSettings(prev => ({ ...prev, options: { ...prev.options, pullQuotes: !prev.options.pullQuotes } }))} style={{ accentColor: "var(--gold-bright)" }} />
          <span style={{ color: "var(--fg-2)", fontSize: 10 }}>Pull quotes</span>
        </div>
      </div>

      {/* Save actions */}
      {!template.isBase && (
        <button
          onClick={() => onSave({ ...template, settings })}
          style={{
            width: "100%", padding: 8, borderRadius: 5,
            background: "var(--gold-bright)", border: "none",
            fontSize: 11, fontWeight: 600, color: "var(--fg)",
            cursor: "pointer", fontFamily: FONT, marginBottom: 6,
          }}
        >
          Save
        </button>
      )}

      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder="Custom template name"
          style={{ flex: 1, padding: 6, fontSize: 10, borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg)", fontFamily: FONT }}
        />
        <button
          onClick={() => { if (customName.trim()) { onSaveAsCustom(customName.trim(), settings); setCustomName(""); } }}
          disabled={!customName.trim()}
          style={{
            padding: "6px 10px", borderRadius: 4,
            background: customName.trim() ? "var(--surface)" : "var(--bg)",
            border: "1px solid var(--line)",
            fontSize: 10, fontWeight: 600, color: "var(--fg-2)",
            cursor: customName.trim() ? "pointer" : "not-allowed",
            fontFamily: FONT, whiteSpace: "nowrap",
          }}
        >
          Save as custom
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_SETTINGS };
