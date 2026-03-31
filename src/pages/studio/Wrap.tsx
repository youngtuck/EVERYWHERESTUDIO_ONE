/**
 * Wrap.tsx, Turn exported drafts into deliverables
 * Matches wireframe v7.23 exactly.
 */
import { useState, useLayoutEffect, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import "./shared.css";

type WrapFormat = "LinkedIn" | "Newsletter" | "Podcast" | "Sunday Story";
const WRAP_FORMATS: WrapFormat[] = ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"];

const SOURCE_FILES: Record<WrapFormat, string> = {
  LinkedIn: "LinkedIn_TheThinkingIsInYourHead.md",
  Newsletter: "Newsletter_TheArticulationGap.md",
  Podcast: "Podcast_Script_TheThinkingTrap.md",
  "Sunday Story": "SundayStory_TheMountain.md",
};

const TEMPLATES = [
  { name: "LinkedIn Post", format: "Plain text" },
  { name: "Sunday Story", format: "HTML" },
  { name: "Executive Brief", format: "HTML" },
  { name: "The Edition", format: "Full package" },
  { name: "One-Pager", format: "HTML" },
];

const FORMAT_LABEL: Record<WrapFormat, string> = {
  LinkedIn: "LinkedIn Post",
  Newsletter: "Newsletter",
  Podcast: "Podcast Script",
  "Sunday Story": "Sunday Story",
};

// ── Wrap previews (matches wireframe HTML exactly) ─────────────
function buildWrapPreviews(displayName: string): Record<WrapFormat, React.ReactNode> {
  return {
  LinkedIn: (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>LinkedIn Post</span>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>Plain text</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: "transparent", border: "1px solid var(--line)", color: "var(--fg-2)", cursor: "pointer", fontFamily: "var(--font)" }}>Copy</button>
          <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>Download</button>
        </div>
      </div>
      <div style={{ padding: "22px 26px", fontSize: 14, color: "var(--fg)", lineHeight: 1.65 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>The thinking is in your head. It belongs in the world.</p>
        <p style={{ color: "var(--fg-2)" }}>You said it perfectly in a meeting.</p>
        <p style={{ color: "var(--fg-2)", marginTop: 8 }}>That version, the real one, in your voice, never gets out.</p>
        <p style={{ color: "var(--fg-2)", marginTop: 12 }}>Most people think this is a motivation problem.</p>
        <p style={{ color: "var(--fg-2)", marginTop: 8 }}>It is not. It is structural.</p>
        <p style={{ color: "var(--blue)", fontWeight: 600, marginTop: 16 }}>What does your infrastructure look like?</p>
        <p style={{ color: "var(--fg-3)", fontSize: 11, marginTop: 16 }}>- {displayName}</p>
      </div>
    </div>
  ),
  Newsletter: (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>Newsletter</span>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>HTML</span>
        </div>
        <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>Download</button>
      </div>
      <div style={{ padding: "26px 30px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 16 }}>{displayName}, March 28</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", marginBottom: 12 }}>The Articulation Gap</div>
        <div style={{ width: 28, height: 3, background: "var(--gold-bright)", marginBottom: 18, borderRadius: 2 }} />
        <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, marginBottom: 12 }}>I have been thinking about something I hear constantly from clients. Brilliant thinking that never makes it to an audience.</p>
        <div style={{ background: "var(--bg)", borderLeft: "3px solid var(--gold-bright)", padding: "10px 14px", borderRadius: "0 6px 6px 0", margin: "16px 0" }}>
          <p style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600, lineHeight: 1.6 }}>The gap is not a motivation problem. It is structural. And structure can be built.</p>
        </div>
        <p style={{ fontSize: 11, color: "var(--fg-3)", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 16 }}>Unsubscribe</p>
      </div>
    </div>
  ),
  Podcast: (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg-3)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>Podcast Script</span>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>Plain text</span>
        </div>
        <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>Download</button>
      </div>
      <div style={{ padding: "22px 26px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Episode script</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 18 }}>The Thinking Trap</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "OPEN", color: "var(--fg-3)", text: "Hey, welcome back. I want to start today with something I hear from almost every executive I work with.", bold: false, italic: false },
            { label: "PAUSE", color: "var(--line-2)", text: "[beat]", bold: false, italic: true },
            { label: "HOOK", color: "var(--gold)", text: "It is a structural problem. And structure can be built.", bold: true, italic: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: s.color, width: 44, flexShrink: 0, paddingTop: 2 }}>{s.label}</span>
              <p style={{ fontSize: 13, color: s.bold ? "var(--fg)" : "var(--fg-2)", fontWeight: s.bold ? 600 : 400, fontStyle: s.italic ? "italic" : "normal", lineHeight: 1.7 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  "Sunday Story": (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>Sunday Story, The Edition</span>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>HTML</span>
        </div>
        <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}>Download</button>
      </div>
      <div style={{ padding: "30px 34px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 22 }}>Sunday, March 28, 2026</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--fg)", lineHeight: 1.15, marginBottom: 8 }}>The Mountain Between Knowing and Saying</div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 24, fontStyle: "italic" }}>On the gap between having something to say and getting it into the world.</div>
        <div style={{ width: 36, height: 1, background: "var(--line)", marginBottom: 22 }} />
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.8, marginBottom: 14 }}>There is a thing that happens in rooms where smart people gather. Someone says something that shifts the whole conversation. Everyone feels it.</p>
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.8 }}>And then the meeting ends. And that insight dissolves. Not because it was not valuable. Because there was no infrastructure to carry it forward.</p>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--fg-3)" }}>{displayName}</div>
      </div>
    </div>
  ),
  };
}

// ── Wrap dashboard panel ──────────────────────────────────────
function WrapDashboard({
  activeFormat,
  selectedTemplate,
  onSelectTemplate,
  onWrap,
  wrapped,
  onReset,
  copyToClipboard,
  downloadFile,
  onToggleCopy,
  onToggleDownload,
}: {
  activeFormat: WrapFormat;
  selectedTemplate: string;
  onSelectTemplate: (t: string) => void;
  onWrap: () => void;
  wrapped: boolean;
  onReset: () => void;
  copyToClipboard: boolean;
  downloadFile: boolean;
  onToggleCopy: () => void;
  onToggleDownload: () => void;
}) {
  const sourceFile = SOURCE_FILES[activeFormat];
  const formatLabel = FORMAT_LABEL[activeFormat];

  const DpLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {children}
    </div>
  );

  return (
    <>
      {/* Source file */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Source</DpLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6 }}>
          <svg style={{ width: 12, height: 12, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{sourceFile}</span>
        </div>
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel>
          <span>Templates</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--blue)", cursor: "pointer", textTransform: "none" as const, letterSpacing: 0 }}>Manage</span>
        </DpLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TEMPLATES.map(t => (
            <div
              key={t.name}
              onClick={() => onSelectTemplate(t.name)}
              style={{
                padding: "9px 12px", borderRadius: 7,
                border: selectedTemplate === t.name ? "1px solid var(--gold-bright)" : "1px solid var(--line)",
                background: selectedTemplate === t.name ? "rgba(245,198,66,0.05)" : "var(--surface)",
                cursor: "pointer", transition: "all 0.1s",
              }}
              onMouseEnter={e => { if (selectedTemplate !== t.name) e.currentTarget.style.borderColor = "var(--line-2)"; }}
              onMouseLeave={e => { if (selectedTemplate !== t.name) e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>{t.name}</span>
                <span style={{ fontSize: 9, color: "var(--fg-3)" }}>{t.format}</span>
              </div>
            </div>
          ))}
          <div
            style={{
              padding: "5px 9px", borderRadius: 5,
              border: "1px dashed var(--line)", textAlign: "center" as const,
              cursor: "pointer", fontSize: 10, color: "var(--fg-3)", marginTop: 2,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            + Add template
          </div>
        </div>
      </div>

      {/* Also */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Also</DpLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: "Copy to clipboard", checked: copyToClipboard, toggle: onToggleCopy },
            { label: "Download file", checked: downloadFile, toggle: onToggleDownload },
          ].map(item => (
            <label key={item.label} onClick={item.toggle} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "var(--fg-2)" }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.toggle}
                style={{ accentColor: "var(--blue)", width: 13, height: 13, flexShrink: 0, cursor: "pointer" }}
              />
              {item.label}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 4 }}>Always saves to Session Files.</div>
      </div>

      {/* Wrap action */}
      <div id="wrap-action-sec">
        {wrapped ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(74,144,217,0.06)", border: "1px solid rgba(74,144,217,0.2)", borderRadius: 6 }}>
            <svg style={{ width: 14, height: 14, stroke: "var(--blue)", strokeWidth: 2.5, fill: "none" }} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)" }}>Wrapped and saved</span>
            <button onClick={onReset} style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>Reset</button>
          </div>
        ) : (
          <button
            onClick={onWrap}
            style={{
              width: "100%", padding: 10, borderRadius: 6,
              background: "var(--gold-bright)", border: "none",
              fontSize: 12, fontWeight: 700, color: "var(--fg)",
              cursor: "pointer", fontFamily: "var(--font)",
              transition: "opacity 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {activeFormat === "Sunday Story" ? "Wrap as Sunday Story" : `Wrap ${activeFormat}`}
          </button>
        )}
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function WrapPage() {
  const nav = useNavigate();
  const { setDashContent, setDashOpen } = useShell();
  const { displayName } = useAuth();

  const [activeFormat, setActiveFormat] = useState<WrapFormat>("LinkedIn");
  const [selectedTemplate, setSelectedTemplate] = useState("LinkedIn Post");
  const [wrapping, setWrapping] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const [copyToClipboard, setCopyToClipboard] = useState(true);
  const [downloadFile, setDownloadFile] = useState(true);
  const [pipelineSource, setPipelineSource] = useState<string | null>(null);

  // Pick up handoff from Pipeline
  useEffect(() => {
    const outputId = sessionStorage.getItem("ew-wrap-output-id");
    const title = sessionStorage.getItem("ew-wrap-title");
    if (outputId) {
      sessionStorage.removeItem("ew-wrap-output-id");
      sessionStorage.removeItem("ew-wrap-title");
      setPipelineSource(title || "Pipeline draft");
    }
  }, []);

  const handleTabClick = (format: WrapFormat) => {
    setActiveFormat(format);
    setWrapped(false);
    // Set default template per format
    const defaults: Record<WrapFormat, string> = {
      LinkedIn: "LinkedIn Post", Newsletter: "Newsletter",
      Podcast: "Podcast Script", "Sunday Story": "Sunday Story",
    };
    setSelectedTemplate(defaults[format]);
  };

  const handleWrap = () => {
    setWrapping(true);
    setTimeout(() => {
      setWrapping(false);
      setWrapped(true);
    }, 1200);
  };

  const handleReset = () => {
    setWrapped(false);
  };

  useLayoutEffect(() => {
    setDashOpen(true);
    setDashContent(
      <WrapDashboard
        activeFormat={activeFormat}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        onWrap={handleWrap}
        wrapped={wrapped}
        onReset={handleReset}
        copyToClipboard={copyToClipboard}
        downloadFile={downloadFile}
        onToggleCopy={() => setCopyToClipboard(v => !v)}
        onToggleDownload={() => setDownloadFile(v => !v)}
      />
    );
    return () => setDashContent(null);
  }, [activeFormat, selectedTemplate, wrapped, copyToClipboard, downloadFile, setDashContent, setDashOpen]);

  const TabBtn = ({ format }: { format: WrapFormat }) => {
    const active = activeFormat === format;
    return (
      <div
        onClick={() => handleTabClick(format)}
        style={{
          fontSize: 11, fontWeight: active ? 600 : 500,
          color: active ? "var(--fg)" : "var(--fg-3)",
          padding: "12px 14px",
          borderBottom: active ? "2px solid var(--fg)" : "2px solid transparent",
          cursor: "pointer", whiteSpace: "nowrap" as const,
          flexShrink: 0, transition: "all 0.1s",
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--fg-2)"; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--fg-3)"; }}
      >
        {format}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: "var(--font)" }}>
      {/* Format tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "0 20px", flexShrink: 0, background: "var(--bg)", overflowX: "auto" }}>
        {WRAP_FORMATS.map(f => <TabBtn key={f} format={f} />)}
      </div>

      {/* Stage area */}
      <div
        style={{
          flex: 1, overflowY: "auto",
          padding: "32px 40px",
          display: "flex",
          alignItems: wrapped ? "flex-start" : "center",
          justifyContent: wrapped ? "flex-start" : "center",
          transition: "align-items 0.2s",
        }}
      >
        {wrapping ? (
          <div style={{ textAlign: "center" as const, color: "var(--fg-3)", fontSize: 13 }}>
            <div style={{ fontSize: 28, color: "var(--gold-bright)", marginBottom: 14 }}>✦</div>
            Wrapping...
          </div>
        ) : wrapped ? (
          <div style={{ width: "100%", maxWidth: 580 }}>
            {buildWrapPreviews(displayName)[activeFormat]}
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 580, textAlign: "center" as const }}>
            {pipelineSource && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                background: "rgba(245,198,66,0.08)", border: "1px solid rgba(245,198,66,0.25)",
                borderRadius: 6, fontSize: 11, color: "var(--gold)", fontWeight: 500, marginBottom: 16,
              }}>
                <svg style={{ width: 12, height: 12, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                From Pipeline: {pipelineSource}
              </div>
            )}
            <div style={{ fontSize: 28, color: "var(--line)", marginBottom: 14 }}>✦</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
              Ready to wrap {activeFormat}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6 }}>
              Choose a template in the dashboard,<br />then hit Wrap it.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
