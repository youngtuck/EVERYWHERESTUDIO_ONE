/**
 * WorkSession.tsx, v7.0 Quality Checkpoint Framework
 *
 * Flow:
 *   Intake  -> /api/chat (Watson conversation, READY_TO_GENERATE detection)
 *   Outline -> client-side state built from Watson's readiness summary
 *   Edit    -> /api/generate (draft generation + back-of-house auto-revision)
 *   Review  -> /api/run-pipeline (7 checkpoints + Impact Score + Human Voice Test)
 *   Approve -> save to Supabase outputs table + copy/download + send to Wrap
 */

import {
  useState, useRef, useEffect, useLayoutEffect, useCallback,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import { useMobile } from "../../hooks/useMobile";
import { saveSession, loadSession, clearSession } from "../../lib/sessionPersistence";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import OutputTypePicker, { OUTPUT_TYPES, PROJECT_TYPE_IDS } from "../../components/studio/OutputTypePicker";
import "./shared.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "var(--font)";

type WorkStage = "Intake" | "Outline" | "Edit" | "Review" | "Approve";
const STAGES: WorkStage[] = ["Intake", "Outline", "Edit", "Review", "Approve"];

type Format =
  | "LinkedIn" | "Newsletter" | "Podcast" | "Sunday Story"
  | "Article" | "Email" | "Thread" | "Video Script"
  | "Case Study" | "One-Pager" | "Presentation" | "Book Chapter";

const DEFAULT_FORMATS: Format[] = ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"];
const ALL_FORMATS: Format[] = [
  "LinkedIn", "Newsletter", "Article", "Podcast",
  "Email", "Thread", "Video Script", "Case Study",
  "One-Pager", "Presentation", "Book Chapter", "Sunday Story",
];

const FORMAT_TO_OUTPUT_TYPE: Record<Format, string> = {
  LinkedIn: "socials", Newsletter: "newsletter", Podcast: "podcast",
  "Sunday Story": "essay", Article: "essay", Email: "newsletter",
  Thread: "socials", "Video Script": "video_script",
  "Case Study": "business", "One-Pager": "business",
  Presentation: "presentation", "Book Chapter": "book",
};

const TEMPLATES = ["Essay", "LinkedIn Post", "Newsletter Issue", "Podcast Script", "Case Study", "One-Pager", "Email"];

/** Strip markdown bold/italic markers from title text */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}

/** Map legacy agent names to function labels for old saved outputs */
const AGENT_TO_FUNCTION: Record<string, string> = {
  "Echo": "Deduplication",
  "Priya": "Research Validation",
  "Jordan": "Voice Authenticity",
  "David": "Engagement Optimization",
  "Elena": "SLOP Detection",
  "Natasha": "Editorial Excellence",
  "Marcus + Marshall": "Perspective and Risk",
  "Human Voice Test": "Human Voice Test",
};
function displayGateName(raw: string): string {
  return AGENT_TO_FUNCTION[raw] || raw;
}

const CHECKPOINT_LABELS: Record<string, string> = {
  "checkpoint-0": "Deduplication",
  "checkpoint-1": "Research Validation",
  "checkpoint-2": "Voice Authenticity",
  "checkpoint-3": "Engagement Optimization",
  "checkpoint-4": "SLOP Detection",
  "checkpoint-5": "Editorial Excellence",
  "checkpoint-6": "Perspective & Risk",
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "watson" | "user";
  content: string;
}

interface OutlineRow {
  label: string;
  content: string;
  indent?: boolean;
}

interface CheckpointResult {
  gate: string;
  status: "PASS" | "FAIL" | "FLAG";
  score: number;
  feedback: string;
  issues?: string[];
}

interface ImpactScore {
  total: number;  // 1-100, threshold 75
  verdict: "PUBLISH" | "REVISE" | "REJECT";
  topIssue?: string;
  gutCheck?: string;
  breakdown?: Record<string, number>;
}

interface HVTFlaggedLine {
  lineIndex: number;
  original: string;
  issue: string;
  vector: string;
  suggestion: string;
}

interface HVTResult {
  verdict: "PASSES" | "NEEDS_WORK";
  flaggedLines: HVTFlaggedLine[];
  score: number;
  feedback: string;
}

interface PipelineRun {
  status: "PASSED" | "BLOCKED" | "ERROR";
  checkpointResults: CheckpointResult[];
  impactScore: ImpactScore | null;
  humanVoiceTest: HVTResult | null;
  blockedAt?: string;
  finalDraft?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/** Load user's Voice DNA + Brand DNA from Supabase resources table */
function useUserDNA(userId: string | undefined) {
  const [voiceDnaMd, setVoiceDnaMd] = useState("");
  const [brandDnaMd, setBrandDnaMd] = useState("");
  const [methodDnaMd, setMethodDnaMd] = useState("");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("resources")
        .select("resource_type, content")
        .eq("user_id", userId);
      if (!data) return;
      setVoiceDnaMd(data.filter(r => r.resource_type === "voice_dna").map(r => r.content || "").join("\n"));
      setBrandDnaMd(data.filter(r => r.resource_type === "brand_dna").map(r => r.content || "").join("\n"));
      setMethodDnaMd(data.filter(r => r.resource_type === "method_dna").map(r => r.content || "").join("\n"));
    })();
  }, [userId]);

  return { voiceDnaMd, brandDnaMd, methodDnaMd };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg style={{ width: 13, height: 13, stroke: "#fff", strokeWidth: 2.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg style={{ width: 15, height: 15, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg style={{ width: 12, height: 12, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IaBtn({ title, active, children, onMouseDown, onMouseUp, onMouseLeave, onClick }: {
  title?: string; active?: boolean; children: React.ReactNode;
  onMouseDown?: () => void; onMouseUp?: () => void;
  onMouseLeave?: () => void; onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
      style={{
        width: 36, height: 36, borderRadius: 7,
        border: "1px solid var(--line)",
        background: active ? "rgba(245,198,66,0.1)" : "var(--surface)",
        borderColor: active ? "var(--gold-bright)" : "var(--line)",
        color: active ? "var(--gold)" : "var(--fg-3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.12s", fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );
}

function AdvanceButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div style={{ padding: "0 14px 8px", display: "flex", justifyContent: "flex-end" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          fontSize: 11, fontWeight: 600, padding: "7px 16px",
          borderRadius: 6, background: disabled ? "var(--line)" : "var(--gold-bright)",
          border: "none", color: disabled ? "var(--fg-3)" : "var(--fg)",
          cursor: disabled ? "not-allowed" : "pointer", fontFamily: FONT,
          transition: "opacity 0.1s",
        }}
      >
        {label}
      </button>
    </div>
  );
}

function LoadingDots({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, color: "var(--fg-3)" }}>
      <span style={{ animation: "pulse 1.5s infinite", display: "inline-block" }}>●</span>
      <span style={{ animation: "pulse 1.5s 0.3s infinite", display: "inline-block" }}>●</span>
      <span style={{ animation: "pulse 1.5s 0.6s infinite", display: "inline-block" }}>●</span>
      <span style={{ marginLeft: 6 }}>{label}</span>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.2} 50%{opacity:1} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT BAR
// ─────────────────────────────────────────────────────────────────────────────

function InputBar({
  placeholder, value, onChange, onSend, disabled,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  onSend: () => void; disabled?: boolean;
}) {
  const [micActive, setMicActive] = useState(false);

  return (
    <div style={{
      borderTop: "1px solid var(--line)", padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 4,
      flexShrink: 0, background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !disabled) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "0 12px", fontSize: 13, color: "var(--fg)",
            fontFamily: FONT, outline: "none", height: 36, transition: "border-color 0.12s",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.5)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Attach file"><AttachIcon /></IaBtn>
        <IaBtn
          title="Hold to speak" active={micActive}
          onMouseDown={() => setMicActive(true)}
          onMouseUp={() => setMicActive(false)}
          onMouseLeave={() => setMicActive(false)}
        >
          <MicIcon />
        </IaBtn>
        <button
          onClick={onSend}
          disabled={disabled}
          style={{
            width: 36, height: 36, borderRadius: 7,
            background: disabled ? "var(--line)" : "var(--fg)", border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "background 0.1s",
          }}
        >
          <SendIcon />
        </button>
      </div>
      <div style={{ fontSize: 9, color: "var(--fg-3)", textAlign: "right" as const, paddingRight: 80, letterSpacing: "0.04em" }}>
        Hold to speak · Release to send
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PANEL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function DpLabel({ children, collapsible, open, onToggle, action }: {
  children: React.ReactNode; collapsible?: boolean; open?: boolean;
  onToggle?: () => void; action?: React.ReactNode;
}) {
  return (
    <div
      onClick={collapsible ? onToggle : undefined}
      style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
        color: "var(--fg-3)", marginBottom: 6, display: "flex", justifyContent: "space-between",
        alignItems: "center", cursor: collapsible ? "pointer" : "default", userSelect: "none" as const,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{children}{action}</span>
      {collapsible && (
        <span style={{ fontSize: 16, color: open ? "var(--fg)" : "var(--fg-3)", fontWeight: 600, lineHeight: 1, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>›</span>
      )}
    </div>
  );
}

function DpSection({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}>{children}</div>;
}

// ── Intake dashboard ──────────────────────────────────────────
function IntakeDash({
  selectedFormats, onToggleFormat, selectedTemplate, onSelectTemplate,
  sessionFiles, outputType, onSelectOutputType,
}: {
  selectedFormats: Format[]; onToggleFormat: (f: Format) => void;
  selectedTemplate: string; onSelectTemplate: (t: string) => void;
  sessionFiles: string[];
  outputType: string | null; onSelectOutputType: (id: string) => void;
}) {
  const [openSection, setOpenSection] = useState<string>("outputType");
  const toggle = (section: string) => setOpenSection(prev => prev === section ? "" : section);

  return (
    <>
      <DpSection>
        <DpLabel collapsible open={openSection === "outputType"} onToggle={() => toggle("outputType")}>Output Type</DpLabel>
        {openSection === "outputType" && (
          <div style={{ marginTop: 6 }}>
            <OutputTypePicker selected={outputType} onSelect={onSelectOutputType} compact />
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel collapsible open={openSection === "outputs"} onToggle={() => toggle("outputs")}>Formats</DpLabel>
        {openSection === "outputs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
            {ALL_FORMATS.map(f => {
              const on = selectedFormats.includes(f);
              return (
                <div
                  key={f} onClick={() => onToggleFormat(f)}
                  style={{
                    fontSize: 10, padding: "4px 6px", borderRadius: 4, cursor: "pointer",
                    border: on ? "1px solid var(--gold-bright)" : "1px solid var(--line)",
                    background: on ? "rgba(245,198,66,0.1)" : "var(--surface)",
                    color: on ? "#9A7030" : "var(--fg-3)", fontWeight: on ? 600 : 400,
                    textAlign: "center" as const, transition: "all 0.1s",
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel
          collapsible open={openSection === "templates"} onToggle={() => toggle("templates")}
          action={<span style={{ fontSize: 9, fontWeight: 400, color: "var(--blue)", cursor: "pointer", marginLeft: 6, textTransform: "none" as const, letterSpacing: 0 }}>Edit</span>}
        >Templates</DpLabel>
        {openSection === "templates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
            {TEMPLATES.map(t => (
              <div
                key={t} onClick={() => onSelectTemplate(t)}
                style={{
                  padding: "5px 9px", borderRadius: 5, cursor: "pointer", fontSize: 11,
                  border: selectedTemplate === t ? "1px solid var(--blue)" : "1px solid var(--line)",
                  background: selectedTemplate === t ? "rgba(74,144,217,0.05)" : "var(--surface)",
                  color: selectedTemplate === t ? "var(--fg)" : "var(--fg-2)",
                  fontWeight: selectedTemplate === t ? 600 : 400, transition: "all 0.1s",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel collapsible open={openSection === "sessionFiles"} onToggle={() => toggle("sessionFiles")}>Session Files</DpLabel>
        {openSection === "sessionFiles" && (
          <div style={{ marginTop: 6 }}>
            {sessionFiles.length === 0 ? (
              <div style={{ fontSize: 9, color: "var(--fg-3)" }}>No files attached yet.</div>
            ) : sessionFiles.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5, marginBottom: 4 }}>
                <FileIcon />
                <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f}</span>
              </div>
            ))}
            <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 4 }}>Session only, not saved to Project Files</div>
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel collapsible open={openSection === "projectFiles"} onToggle={() => toggle("projectFiles")}>Project Files</DpLabel>
        {openSection === "projectFiles" && (
          <div style={{ marginTop: 6, fontSize: 10, color: "var(--blue)", lineHeight: 1.9 }}>
            ✓ Voice DNA<br />✓ Brand Guide
          </div>
        )}
      </DpSection>
    </>
  );
}

// ── Outline dashboard ─────────────────────────────────────────
function OutlineDash({ selectedFormats }: { selectedFormats: Format[] }) {
  const wordMap: Partial<Record<Format, string>> = {
    LinkedIn: "700 words", Newsletter: "800 words",
    Podcast: "1,200 words", "Sunday Story": "1,500 words",
  };
  return (
    <DpSection>
      <DpLabel>Selected outputs</DpLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {selectedFormats.map(f => (
          <div key={f} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "5px 8px", borderRadius: 5,
            border: "1px solid var(--gold-bright)", background: "rgba(245,198,66,0.05)",
          }}>
            <span style={{ fontSize: 11, color: "var(--fg)", fontWeight: 500 }}>{f}</span>
            <span style={{ fontSize: 10, color: "var(--blue)" }}>{wordMap[f] ?? "~"}</span>
          </div>
        ))}
      </div>
    </DpSection>
  );
}

// ── Edit dashboard ────────────────────────────────────────────
function EditDash({
  wordCount, selectedFormats, generating, generatingLabel,
}: {
  wordCount: number; selectedFormats: Format[]; generating: boolean; generatingLabel: string;
}) {
  const optimum = 700;
  const fillPct = Math.min((wordCount / (optimum * 1.5)) * 100, 100);
  const wordMap: Partial<Record<Format, string>> = {
    LinkedIn: "700 words", Newsletter: "800 words",
    Podcast: "1,200 words", "Sunday Story": "1,500 words",
  };
  // Simulated voice match and flags (in production these come from the pipeline)
  const voiceMatch = wordCount > 0 ? 89 : 0;
  const mustFixFlags = 2;
  const styleFlags = 3;

  return (
    <>
      {generating && (
        <DpSection>
          <DpLabel>Generating</DpLabel>
          <div style={{ fontSize: 11, color: "var(--gold-bright)", lineHeight: 1.6, fontWeight: 500 }}>{generatingLabel}</div>
        </DpSection>
      )}

      {/* Voice match gauge (wireframe v7.23) */}
      {!generating && wordCount > 0 && (
        <DpSection>
          <DpLabel>Voice match</DpLabel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <svg viewBox="0 0 100 60" width="48" height="29">
              <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
              <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--blue)" strokeWidth="10" strokeLinecap="round" strokeDasharray="141" strokeDashoffset={141 - (voiceMatch / 100) * 141} />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{voiceMatch}%</span>
            <span style={{ fontSize: 9, color: "var(--fg-3)" }}>prelim</span>
          </div>
        </DpSection>
      )}

      {/* Flags (wireframe v7.23) */}
      {!generating && wordCount > 0 && (
        <DpSection>
          <DpLabel>Flags</DpLabel>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
              borderRadius: 4, background: "rgba(245,198,66,0.1)", border: "1px solid rgba(245,198,66,0.35)",
              fontSize: 10, color: "#9A7030",
            }}>{mustFixFlags} must fix</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
              borderRadius: 4, background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.2)",
              fontSize: 10, color: "var(--blue)",
            }}>{styleFlags} style</div>
          </div>
        </DpSection>
      )}

      <DpSection>
        <DpLabel>Words</DpLabel>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: "var(--fg)" }}>{wordCount}</span>
            {wordCount > optimum && <span style={{ color: "var(--gold)" }}>+{wordCount - optimum}</span>}
          </div>
          <div style={{ fontSize: 9, color: "var(--fg-3)", marginBottom: 4 }}>optimum {optimum}</div>
          <div style={{ height: 5, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fillPct}%`, background: "rgba(245,198,66,0.35)", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>
      </DpSection>

      <DpSection>
        <DpLabel>Outputs in queue</DpLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {selectedFormats.map(f => (
            <div key={f} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--fg-2)" }}>{f}</span>
              <span style={{ color: "var(--blue)", fontSize: 10 }}>{wordMap[f] ?? "~"}</span>
            </div>
          ))}
        </div>
      </DpSection>
    </>
  );
}

// ── Review dashboard ──────────────────────────────────────────
function ReviewDash({
  pipelineRun, running, onExportAll, allExported, hvtAttempts, onRerunHVT, hvtRunning,
}: {
  pipelineRun: PipelineRun | null; running: boolean;
  onExportAll: () => void; allExported: boolean;
  hvtAttempts: number; onRerunHVT: () => void; hvtRunning: boolean;
}) {
  const score = pipelineRun?.impactScore?.total ?? null;
  const hvt = pipelineRun?.humanVoiceTest;
  const hvtPasses = hvt?.verdict === "PASSES";
  const scoreOk = score !== null && score >= 75;
  const canApprove = scoreOk && hvtPasses;
  const passed = pipelineRun?.status === "PASSED" && canApprove;
  const allGatesPass = pipelineRun?.checkpointResults?.every(g => g.status === "PASS" || g.status === "FLAG") ?? false;
  const canExport = pipelineRun && !running && !allExported && canApprove;

  return (
    <>
      {running && (
        <DpSection>
          <DpLabel>Running checkpoints</DpLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {["Deduplication", "Research Validation", "Voice Authenticity", "Engagement Optimization", "SLOP Detection", "Editorial Excellence", "Perspective & Risk"].map((name, i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--fg-3)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--line-2)", animation: `pulse ${0.5 * i + 1}s infinite` }} />
                {name}
              </div>
            ))}
          </div>
        </DpSection>
      )}

      {pipelineRun && !running && (
        <>
          {score !== null && (
            <DpSection>
              <DpLabel>Impact Score</DpLabel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <svg viewBox="0 0 100 60" width="48" height="29">
                  <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke={score >= 90 ? "var(--blue)" : score >= 75 ? "var(--gold)" : "var(--danger)"} strokeWidth="10" strokeLinecap="round" strokeDasharray="141" strokeDashoffset={141 - (score / 100) * 141} />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{score}</span>
                <span style={{ fontSize: 9, color: "var(--fg-3)" }}>/100</span>
              </div>
              <div style={{ fontSize: 10, color: score >= 90 ? "var(--blue)" : "var(--gold)", marginTop: 4, fontWeight: 600 }}>
                {pipelineRun.impactScore?.verdict ?? (score >= 75 ? "PUBLISH" : "REVISE")}
              </div>
              {pipelineRun.impactScore?.topIssue && (
                <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.5 }}>{pipelineRun.impactScore.topIssue}</div>
              )}
            </DpSection>
          )}

          <DpSection>
            <DpLabel>Checkpoints</DpLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {pipelineRun.checkpointResults.map((gate, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", borderBottom: "1px solid var(--line)", fontSize: 10 }}>
                  <span style={{
                    color: gate.status === "PASS" ? "var(--blue)" : gate.status === "FLAG" ? "var(--gold)" : "var(--danger)",
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {gate.status === "PASS" ? "✓" : gate.status === "FLAG" ? "⚑" : "✗"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--fg-2)", fontWeight: 500 }}>{displayGateName(gate.gate)}</div>
                    {gate.feedback && gate.status !== "PASS" && (
                      <div style={{ color: "var(--fg-3)", marginTop: 2, lineHeight: 1.4 }}>{gate.feedback.slice(0, 120)}{gate.feedback.length > 120 ? "..." : ""}</div>
                    )}
                  </div>
                  <span style={{ color: "var(--fg-3)", flexShrink: 0 }}>{gate.score}</span>
                </div>
              ))}
            </div>
          </DpSection>

          {/* Human Voice Test status */}
          {hvt && (
            <DpSection>
              <DpLabel>Human Voice Test</DpLabel>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: hvtPasses ? "var(--blue)" : "var(--gold)",
                marginBottom: 4,
              }}>
                {hvtPasses ? "PASSES" : "NEEDS WORK"}
              </div>
              {!hvtPasses && hvt.flaggedLines.length > 0 && (
                <div style={{ fontSize: 10, color: "var(--fg-3)", lineHeight: 1.5, marginBottom: 6 }}>
                  {hvt.flaggedLines.length} line{hvt.flaggedLines.length !== 1 ? "s" : ""} flagged
                </div>
              )}
              {!hvtPasses && hvtAttempts < 3 && (
                <button
                  onClick={onRerunHVT}
                  disabled={hvtRunning}
                  style={{
                    width: "100%", padding: 6, borderRadius: 5,
                    background: "rgba(245,198,66,0.12)", border: "1px solid var(--gold)",
                    fontSize: 10, fontWeight: 600, color: "var(--gold)",
                    cursor: hvtRunning ? "not-allowed" : "pointer",
                    fontFamily: FONT, marginBottom: 4,
                  }}
                >
                  {hvtRunning ? "Running..." : "Rerun Voice Test"}
                </button>
              )}
              {!hvtPasses && hvtAttempts >= 3 && (
                <div style={{ fontSize: 10, color: "var(--danger)", lineHeight: 1.5, fontWeight: 600 }}>
                  Voice issues are structural. Consider a full rewrite.
                </div>
              )}
            </DpSection>
          )}

          {pipelineRun.blockedAt && (
            <DpSection>
              <DpLabel>Blocked at</DpLabel>
              <div style={{ fontSize: 10, color: "var(--danger)", lineHeight: 1.5 }}>{pipelineRun.blockedAt}</div>
            </DpSection>
          )}
        </>
      )}

      <div style={{ fontSize: 10, color: allExported ? "var(--blue)" : "var(--fg-3)", marginBottom: 6, transition: "color 0.2s" }}>
        {allExported ? "All formats exported to Session Files." : running ? "Pipeline in progress. This takes 2-3 minutes." : pipelineRun ? (passed ? "Pipeline passed. Ready to export." : canApprove ? "Pipeline passed. Ready to export." : "Pipeline complete. Review results above.") : "Run pipeline to check your draft."}
      </div>

      <button
        onClick={onExportAll}
        disabled={!canExport || running}
        style={{
          width: "100%", padding: 10, borderRadius: 6,
          background: allExported ? "rgba(74,144,217,0.12)" : canExport ? "var(--gold-bright)" : "var(--surface)",
          border: allExported ? "1px solid rgba(74,144,217,0.3)" : canExport ? "none" : "1px solid var(--line)",
          fontSize: 12, fontWeight: 700,
          color: allExported ? "var(--blue)" : canExport ? "var(--fg)" : "var(--fg-3)",
          cursor: canExport ? "pointer" : "not-allowed",
          opacity: !pipelineRun && !running ? 0.4 : 1,
          transition: "all 0.2s", fontFamily: FONT,
        }}
      >
        {allExported ? "Exported" : "Export all"}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: INTAKE
// ─────────────────────────────────────────────────────────────────────────────

function StageIntake({
  messages, onSend, sending, isReady, onAdvance, userInitials, firstName, onFileAttach, onNewSession,
}: {
  messages: ChatMessage[]; onSend: (text: string) => void;
  sending: boolean; isReady: boolean; onAdvance: () => void; userInitials?: string; firstName?: string;
  onFileAttach?: (files: FileList) => void; onNewSession?: () => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  // Welcome state: show centered greeting until user sends first message
  const hasUserMessage = messages.some(m => m.role === "user");

  // Only scroll when a new message is added, not on every render
  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== prevMsgCount.current || sending) {
      prevMsgCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length, sending]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  // Welcome state: centered greeting + input, like Claude's empty chat
  if (!hasUserMessage && !sending) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", flex: 1, overflow: "hidden",
        background: "var(--bg)", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          width: "100%", maxWidth: 680, padding: "0 24px",
          marginBottom: 40,
        }}>
          {/* Greeting */}
          <div style={{
            fontSize: 26, fontWeight: 600, color: "var(--fg)",
            marginBottom: 8, fontFamily: FONT,
            textAlign: "center" as const,
          }}>
            {firstName ? `Good to see you, ${firstName}.` : "What's on your mind?"}
          </div>

          <div style={{
            fontSize: 13, color: "var(--fg-3)", marginBottom: 32,
            textAlign: "center" as const, lineHeight: 1.5,
          }}>
            Start with an idea, a transcript, or just start talking.
          </div>

          {/* Centered input bar */}
          <div style={{ width: "100%" }}>
            <ChatInputBar
              placeholder="What's on your mind?"
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={sending}
              autoFocus
              onFileAttach={onFileAttach}
            />
          </div>
        </div>
      </div>
    );
  }

  // Active chat state: messages + input bar at bottom
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "var(--bg)" }}>
      {/* New Session button */}
      {hasUserMessage && onNewSession && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 24px 0", flexShrink: 0, maxWidth: 748, margin: "0 auto", width: "100%" }}>
          <button
            onClick={() => {
              if (window.confirm("Start a new session? Your current conversation will be cleared.")) {
                onNewSession();
              }
            }}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: isMobile ? "4px 10px" : "5px 12px",
              fontSize: isMobile ? 10 : 11,
              fontWeight: 600,
              fontFamily: FONT,
              color: "var(--fg-3)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            + New Session
          </button>
        </div>
      )}
      {/* Scrollable message area */}
      <div
        ref={scrollAreaRef}
        style={{
          flex: 1, overflowY: "auto",
          padding: "20px 24px",
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: messages.length <= 3 ? "flex-end" : "flex-start",
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 700,
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 10 : 14,
        }}>
          {messages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.content} userInitials={userInitials} />)}
          {sending && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingTop: 4 }}>
              <WatsonAvatar />
              <LoadingDots label="" />
            </div>
          )}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* "Build outline" appears above the input when ready */}
      {isReady && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 24px 0" }}>
          <button
            onClick={onAdvance}
            style={{
              fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 6,
              background: "var(--gold-bright)", border: "none", color: "var(--fg)",
              cursor: "pointer", fontFamily: FONT, letterSpacing: "0.01em",
            }}
          >
            Build outline →
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px 24px", background: "var(--bg)", flexShrink: 0, borderTop: "1px solid var(--line)", position: "sticky" as const, bottom: 0, zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <ChatInputBar
            placeholder="What's on your mind?"
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={sending}
            autoFocus
            onFileAttach={onFileAttach}
          />
        </div>
      </div>
    </div>
  );
}

function WatsonAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "linear-gradient(135deg, rgba(74,144,217,0.18) 0%, rgba(74,144,217,0.08) 100%)",
      border: "1px solid rgba(74,144,217,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color: "var(--blue)",
      flexShrink: 0, marginTop: 2, letterSpacing: "0.03em",
    }}>W</div>
  );
}

/** Parse Watson text: render **bold** as <strong>, strip raw **, detect questions vs statements, detect search indicators */
function WatsonTextRenderer({ text }: { text: string }) {
  // Detect search/research lines
  const isSearchLine = (line: string) =>
    /^(searching|looking up|researching|checking|scanning|analyzing|pulling data)/i.test(line.trim());

  // Detect if a line ends with a question mark (Watson is asking the user)
  const isQuestion = (line: string) => /\?\s*$/.test(line.trim());

  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, li) => {
        if (!line.trim()) return <br key={li} />;

        // Search/research indicator
        if (isSearchLine(line)) {
          return (
            <div key={li} style={{
              fontSize: 11, color: "var(--blue)", fontStyle: "normal",
              padding: "3px 0", display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg style={{ width: 12, height: 12, stroke: "var(--blue)", strokeWidth: 2, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {line}
            </div>
          );
        }

        // Parse markdown bold: **text** becomes <strong>text</strong>
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pi} style={{ fontWeight: 600, color: "var(--fg)" }}>{part.slice(2, -2)}</strong>;
          }
          return <span key={pi}>{part}</span>;
        });

        // If Watson is asking a question, render bold
        if (isQuestion(line)) {
          return (
            <div key={li} style={{ fontWeight: 600, color: "var(--fg)" }}>
              {rendered}
            </div>
          );
        }

        return <div key={li}>{rendered}</div>;
      })}
    </>
  );
}

function ChatBubble({ role, text, userInitials }: { role: "watson" | "user"; text: string; userInitials?: string }) {
  const isWatson = role === "watson";
  return (
    <div style={{
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      padding: "6px 0",
      justifyContent: isWatson ? "flex-start" : "flex-end",
    }}>
      {isWatson ? (
        <>
          <WatsonAvatar />
          <div className="watson-bubble-wrap">
            <WatsonTextRenderer text={text} />
          </div>
        </>
      ) : (
        <>
          <div className="user-bubble-wrap">
            <p>{text}</p>
          </div>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(245,198,66,0.15)",
            border: "1px solid rgba(245,198,66,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "var(--gold)",
            flexShrink: 0, marginTop: 2,
          }}>{userInitials || "U"}</div>
        </>
      )}
    </div>
  );
}

// Clean, centered input bar for the chat interface
function ChatInputBar({
  placeholder, value, onChange, onSend, disabled, autoFocus, onFileAttach,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  onSend: () => void; disabled?: boolean; autoFocus?: boolean;
  onFileAttach?: (files: FileList) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wire up real voice input
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput((transcript) => {
    onChange(transcript);
  });

  // Focus on mount when autoFocus is set
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  const handleMicDown = () => {
    if (!isSupported) return;
    startListening();
  };

  const handleMicUp = () => {
    if (!isSupported) return;
    stopListening();
    // Auto-send after voice stops if there's content
    setTimeout(() => {
      if (value.trim()) onSend();
    }, 300);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFileAttach) {
      onFileAttach(files);
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(245,198,66,0.10)",
        border: "1px solid rgba(245,198,66,0.35)",
        borderRadius: 12,
        padding: "8px 10px 8px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
        onFocus={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,198,66,0.6)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(245,198,66,0.12)";
        }}
        onBlur={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,198,66,0.35)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="watson-input"
          style={{
            flex: 1, resize: "none",
            background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: "var(--fg)", fontFamily: FONT,
            lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
            opacity: disabled ? 0.5 : 1,
          }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <IaBtn title="Attach file" onClick={handleFileClick}><AttachIcon /></IaBtn>
        <IaBtn
          title={isSupported ? "Hold to speak" : "Voice not supported in this browser"}
          active={isListening}
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          onMouseLeave={handleMicUp}
        >
          <MicIcon />
        </IaBtn>
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: value.trim() && !disabled ? "var(--fg)" : "var(--line)",
            border: "none", cursor: value.trim() && !disabled ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <svg style={{ width: 13, height: 13, stroke: "#fff", strokeWidth: 2.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <div style={{ fontSize: 9, color: isListening ? "var(--gold)" : "var(--fg-3)", textAlign: "center" as const, letterSpacing: "0.04em", transition: "color 0.15s" }}>
        {isListening ? "Listening... release to send" : "Hold to speak · Release to send"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: OUTLINE
// ─────────────────────────────────────────────────────────────────────────────

function StageOutline({
  outlineRows, onUpdateRow, onAdvance, building,
}: {
  outlineRows: OutlineRow[]; onUpdateRow: (i: number, v: string) => void;
  onAdvance: () => void; building: boolean;
}) {
  const [input, setInput] = useState("");
  const [selectedLens, setSelectedLens] = useState<"a" | "b">("a");

  // Generate a second angle from the outline rows (simplified: reword each row)
  const lensA = {
    title: outlineRows.find(r => r.label.toLowerCase() === "title")?.content || "Angle A",
    desc: "Opens with the core thesis, pivots to diagnosis, closes with the system as solution. Strong for LinkedIn.",
  };
  const lensB = {
    title: outlineRows.length > 1
      ? (outlineRows.find(r => r.label.toLowerCase() === "hook")?.content || "Alternative angle")
      : "Alternative angle",
    desc: "Leads with the emotional experience, builds empathy before the reframe. Better for newsletter.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {building ? (
          <LoadingDots label="Building outline from your conversation..." />
        ) : (
          <>
            {/* Lens cards: two angles side by side */}
            <div className="lens-row">
              <div
                className={`lens-card${selectedLens === "a" ? " selected" : ""}`}
                onClick={() => setSelectedLens("a")}
              >
                <div className="lens-title-row">
                  <div className="lens-title">{lensA.title}</div>
                  <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={e => e.stopPropagation()} title="More like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: selectedLens === "a" ? "var(--blue)" : "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </button>
                    <button onClick={e => e.stopPropagation()} title="Less like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </button>
                  </div>
                </div>
                <div className="lens-desc">{lensA.desc}</div>
                {selectedLens === "a" && <div className="lens-selected-badge">Selected &#10003;</div>}
              </div>
              <div
                className={`lens-card${selectedLens === "b" ? " selected" : ""}`}
                onClick={() => setSelectedLens("b")}
              >
                <div className="lens-title-row">
                  <div className="lens-title">{lensB.title}</div>
                  <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={e => e.stopPropagation()} title="More like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: selectedLens === "b" ? "var(--blue)" : "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </button>
                    <button onClick={e => e.stopPropagation()} title="Less like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </button>
                  </div>
                </div>
                <div className="lens-desc">{lensB.desc}</div>
                {selectedLens === "b" && <div className="lens-selected-badge">Selected &#10003;</div>}
              </div>
            </div>

            {/* Outline structure with brainstorm icons */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, minHeight: 200 }}>
              {outlineRows.map((row, i) => (
                <OutlineRowComponent
                  key={i}
                  label={row.label}
                  content={row.content}
                  indent={row.indent}
                  onChange={v => onUpdateRow(i, v)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!building && <AdvanceButton label="Write draft &#8594;" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask Watson to restructure, or click any line to edit..."
          style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36 }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Hold to speak"><MicIcon /></IaBtn>
        <button onClick={onAdvance} disabled={building} style={{ width: 36, height: 36, borderRadius: 7, background: building ? "var(--line)" : "var(--fg)", border: "none", cursor: building ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

/** Outline row with brainstorm hover icon matching wireframe v7.23 */
function OutlineRowComponent({ label, content, indent, onChange }: {
  label: string; content: string; indent?: boolean; onChange: (v: string) => void;
}) {
  const [showBrainstorm, setShowBrainstorm] = useState(false);

  return (
    <div
      className="os-row"
      onMouseEnter={() => setShowBrainstorm(true)}
      onMouseLeave={() => setShowBrainstorm(false)}
    >
      <div className="os-label">
        {label && (
          <span
            className="os-brainstorm"
            style={{ opacity: showBrainstorm ? 1 : 0 }}
            onClick={e => { e.stopPropagation(); /* future: open brainstorm popover */ }}
            title="Brainstorm alternatives"
          >&#8635;</span>
        )}
        {label}
      </div>
      <div
        className={`os-content${indent ? " os-indent" : ""}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={e => onChange((e.target as HTMLDivElement).textContent || "")}
      >
        {content}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: EDIT
// ─────────────────────────────────────────────────────────────────────────────

function StageEdit({
  draft, generating, generatingLabel, onDraftChange, onAdvance, onRevise,
  versions, activeVersionIdx, onVersionSelect, onGenerateVersion, canGenerateMore,
}: {
  draft: string; generating: boolean; generatingLabel: string;
  onDraftChange: (v: string) => void; onAdvance: () => void;
  onRevise: (instructions: string) => void;
  versions: Array<{ content: string; label: string }>;
  activeVersionIdx: number;
  onVersionSelect: (idx: number) => void;
  onGenerateVersion: () => void;
  canGenerateMore: boolean;
}) {
  const [input, setInput] = useState("");
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
  const [fixedFlags, setFixedFlags] = useState<Map<string, string>>(new Map());
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRevise = () => {
    if (!input.trim() || generating) return;
    onRevise(input.trim());
    setInput("");
  };

  const showPopover = (id: string) => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    setActivePopover(id);
  };
  const delayHidePopover = (id: string) => {
    popoverTimerRef.current = setTimeout(() => {
      setActivePopover(prev => prev === id ? null : prev);
    }, 200);
  };
  const cancelHide = () => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
  };
  const handleFix = (id: string, replacement: string) => {
    setFixedFlags(prev => new Map(prev).set(id, replacement));
    setActivePopover(null);
  };
  const handleDismiss = (id: string) => {
    setDismissedFlags(prev => new Set(prev).add(id));
    setActivePopover(null);
  };

  // Render a flagged span with popover
  const FlagSpan = ({ id, type, text, message, suggestion }: {
    id: string; type: "must" | "style"; text: string; message: string; suggestion: string;
  }) => {
    const isDismissed = dismissedFlags.has(id);
    const fixedText = fixedFlags.get(id);
    const displayText = fixedText || text;
    const className = isDismissed ? "flag-dismissed" : type === "must" ? "flag-r" : "flag-b";

    return (
      <span
        className={className}
        style={{ position: "relative", cursor: "pointer" }}
        onMouseEnter={() => !isDismissed && !fixedText && showPopover(id)}
        onMouseLeave={() => delayHidePopover(id)}
      >
        {displayText}
        {activePopover === id && !isDismissed && !fixedText && (
          <span
            className="flag-pop"
            style={{ display: "block" }}
            onMouseEnter={cancelHide}
            onMouseLeave={() => delayHidePopover(id)}
          >
            <span className={`fp-type ${type === "must" ? "gold" : "blue"}`}>
              {type === "must" ? "Must fix" : "Style suggestion"}
            </span>
            <span className="fp-msg">{message}</span>
            <span className="fp-suggestion">{suggestion}</span>
            <span className="fp-actions">
              <button className="fp-fix" onClick={() => handleFix(id, suggestion)}>Fix</button>
              <button className="fp-dismiss" onClick={() => handleDismiss(id)}>Dismiss</button>
            </span>
          </span>
        )}
      </span>
    );
  };

  // Parse draft and inject flags into rendered output
  const renderDraftWithFlags = () => {
    if (!draft) return <div style={{ color: "var(--fg-3)", fontSize: 13 }}>No draft yet.</div>;

    const paragraphs = draft.split("\n").filter(Boolean);
    const title = cleanTitle(paragraphs[0] || "");
    const body = paragraphs.slice(1);

    return (
      <>
        <div className="draft-title-text">{title}</div>
        {body.map((para, i) => {
          const isSubhead = para.length < 60 && !para.endsWith(".");
          if (isSubhead) {
            return <div key={i} className="draft-subhead">{para}</div>;
          }

          // Scan for potential flag patterns in text
          // Flag: unverified statistics/claims (must fix)
          const statMatch = para.match(/(\d+%\s+of\s+\w+[^.]*)/);
          // Flag: cliche/weak phrases (style)
          const clicheMatch = para.match(/(lost opportunity|game.?changer|at the end of the day|touch base|move the needle)/i);
          // Flag: passive voice (style)
          const passiveMatch = para.match(/(never made it anywhere|was done by|been completed|were given)/i);

          if (statMatch && !fixedFlags.has(`must-${i}`) && !dismissedFlags.has(`must-${i}`)) {
            const idx = para.indexOf(statMatch[1]);
            return (
              <p key={i} style={{ marginTop: 12, position: "relative" }}>
                {para.slice(0, idx)}
                <FlagSpan
                  id={`must-${i}`}
                  type="must"
                  text={statMatch[1]}
                  message="No source found. Remove or verify before Review."
                  suggestion={`Most executives I speak with ${statMatch[1].replace(/\d+%\s+of\s+/, "").toLowerCase()}`}
                />
                {para.slice(idx + statMatch[1].length)}
              </p>
            );
          }

          if (passiveMatch && !fixedFlags.has(`style-${i}`) && !dismissedFlags.has(`style-${i}`)) {
            const idx = para.indexOf(passiveMatch[1]);
            return (
              <p key={i} style={{ marginTop: 12, position: "relative" }}>
                {para.slice(0, idx)}
                <FlagSpan
                  id={`style-${i}`}
                  type="style"
                  text={passiveMatch[1]}
                  message="Slightly passive. Consider making this more direct."
                  suggestion="never gets out"
                />
                {para.slice(idx + passiveMatch[1].length)}
              </p>
            );
          }

          if (clicheMatch && !fixedFlags.has(`cliche-${i}`) && !dismissedFlags.has(`cliche-${i}`)) {
            const idx = para.indexOf(clicheMatch[1]);
            return (
              <p key={i} style={{ marginTop: 12, position: "relative" }}>
                {para.slice(0, idx)}
                <FlagSpan
                  id={`cliche-${i}`}
                  type="style"
                  text={clicheMatch[1]}
                  message="Voice drift. You usually land harder."
                  suggestion="Every week without it, someone else says what you have been thinking."
                />
                {para.slice(idx + clicheMatch[1].length)}
              </p>
            );
          }

          return <p key={i} style={{ marginTop: 12 }}>{fixedFlags.get(`must-${i}`) || fixedFlags.get(`style-${i}`) || fixedFlags.get(`cliche-${i}`) || para}</p>;
        })}
      </>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div className="edit-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {/* Version tabs */}
        {versions.length > 0 && !generating && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 16, paddingBottom: 12,
            borderBottom: "1px solid var(--line)",
          }}>
            {versions.map((v, i) => (
              <button
                key={i}
                onClick={() => onVersionSelect(i)}
                style={{
                  padding: "4px 12px", borderRadius: 6,
                  fontSize: 11, fontWeight: activeVersionIdx === i ? 600 : 400,
                  color: activeVersionIdx === i ? "var(--fg)" : "var(--fg-3)",
                  background: activeVersionIdx === i ? "var(--surface)" : "transparent",
                  border: activeVersionIdx === i ? "1px solid var(--line)" : "1px solid transparent",
                  cursor: "pointer", fontFamily: FONT,
                  transition: "all 0.15s ease",
                }}
              >
                {v.label}
              </button>
            ))}
            {canGenerateMore && (
              <button
                onClick={onGenerateVersion}
                disabled={generating}
                style={{
                  padding: "4px 12px", borderRadius: 6,
                  fontSize: 11, fontWeight: 500,
                  color: "var(--fg-3)",
                  background: "transparent",
                  border: "1px dashed var(--line)",
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                  opacity: generating ? 0.5 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!generating) { e.currentTarget.style.borderColor = "var(--gold-bright)"; e.currentTarget.style.color = "var(--fg)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-3)"; }}
              >
                + New version
              </button>
            )}
          </div>
        )}
        {generating ? (
          <GenerationProgress />
        ) : (
          <div className="draft-body">
            {renderDraftWithFlags()}
          </div>
        )}
      </div>

      {!generating && draft && <AdvanceButton label="Move to Review &#8594;" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRevise(); } }}
          placeholder="Tell Watson what to change, or edit above..."
          disabled={generating}
          style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36, opacity: generating ? 0.5 : 1 }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Hold to speak"><MicIcon /></IaBtn>
        <button
          onClick={handleRevise}
          disabled={generating}
          style={{ width: 36, height: 36, borderRadius: 7, background: generating ? "var(--line)" : "var(--fg)", border: "none", cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ── Review progress (format adaptation + quality pipeline) ───────────────────
// ── Generation progress (Edit stage) ─────────────────────────────────────────
function GenerationProgress() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - startRef.current), 400);
    return () => clearInterval(interval);
  }, []);

  const PHASES = [
    { at: 0, label: "Loading Voice DNA", sub: "Matching your communication patterns" },
    { at: 3000, label: "Building structure", sub: "Organizing ideas from your conversation" },
    { at: 8000, label: "Writing first draft", sub: "Generating content in your voice" },
    { at: 15000, label: "Refining language", sub: "Checking tone and word choice" },
    { at: 22000, label: "Final polish", sub: "Cleaning up formatting" },
  ];

  const currentPhase = [...PHASES].reverse().find(p => elapsed >= p.at) || PHASES[0];
  const phaseIdx = PHASES.indexOf(currentPhase);
  const progress = Math.min(elapsed / 30000, 0.95);
  const eased = 1 - Math.pow(1 - progress, 2.5);

  return (
    <div style={{ padding: "40px 28px", maxWidth: 480 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{currentPhase.label}</div>
      <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 20 }}>{currentPhase.sub}</div>
      <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--line)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: "100%", borderRadius: 2, background: "var(--gold-bright)", width: `${Math.round(eased * 100)}%`, transition: "width 0.4s ease-out" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PHASES.map((phase, i) => {
          const isDone = i < phaseIdx;
          const isActive = i === phaseIdx;
          return (
            <div key={phase.label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: isDone ? 0.35 : isActive ? 1 : 0.2, transition: "all 0.4s ease" }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: isDone ? "none" : isActive ? "2px solid var(--gold-bright)" : "1px solid var(--line)",
                background: isDone ? "var(--gold-bright)" : "transparent",
                transition: "all 0.3s ease",
              }}>
                {isDone && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold-bright)", animation: "pulse-dot 1s ease-in-out infinite" }} />}
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--fg)" : "var(--fg-3)" }}>{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Review progress (format adaptation + quality pipeline) ───────────────────
function ReviewProgress({
  pipelineRunning, formatDrafts, selectedFormats,
}: {
  pipelineRunning: boolean;
  formatDrafts: Record<string, { content: string; metadata: Record<string, string>; status: string }>;
  selectedFormats: string[];
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!pipelineRunning) { setElapsed(0); return; }
    startRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => clearInterval(interval);
  }, [pipelineRunning]);

  const STEPS = [
    { label: "Deduplication", at: 0 },
    { label: "Research validation", at: 15000 },
    { label: "Voice authenticity", at: 30000 },
    { label: "Engagement", at: 45000 },
    { label: "SLOP detection", at: 60000 },
    { label: "Editorial excellence", at: 75000 },
    { label: "Perspective", at: 90000 },
    { label: "Impact Score", at: 110000 },
    { label: "Human Voice Test", at: 130000 },
  ];

  const currentStepIdx = STEPS.reduce((acc, s, i) => elapsed >= s.at ? i : acc, 0);
  const pipelineProgress = Math.min(elapsed / 160000, 0.95);
  const easedPipeline = 1 - Math.pow(1 - pipelineProgress, 2);

  const formatStatuses = selectedFormats.map(f => ({
    name: f,
    status: formatDrafts[f]?.status || "pending",
  }));
  const allFormatsComplete = formatStatuses.every(f => f.status === "done" || f.status === "error");

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const timeStr = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 600 }}>
      {/* Format Adaptation */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg)", letterSpacing: "0.03em", marginBottom: 12 }}>
          {allFormatsComplete ? "Formats adapted" : "Adapting formats"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {formatStatuses.map((f, i) => (
            <div
              key={f.name}
              className="progress-card"
              style={{
                padding: "10px 14px", borderRadius: 8,
                border: "1px solid var(--line)",
                background: f.status === "done" ? "rgba(74,144,217,0.06)" : "var(--surface)",
                transition: "all 0.4s ease",
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: f.status === "done" ? "var(--blue)" : f.status === "generating" ? "var(--gold-bright)" : "var(--line)",
                  transition: "all 0.4s ease",
                }}>
                  {f.status === "done" && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                  {f.status === "generating" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white", animation: "pulse-dot 1s ease-in-out infinite" }} />
                  )}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: f.status === "generating" ? 600 : 400,
                  color: f.status === "done" ? "var(--blue)" : f.status === "generating" ? "var(--fg)" : "var(--fg-3)",
                  transition: "all 0.3s ease",
                }}>
                  {f.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Pipeline */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg)", letterSpacing: "0.03em" }}>Quality pipeline</div>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{timeStr}</span>
        </div>
        <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--line)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", borderRadius: 2, background: "var(--gold-bright)", width: `${Math.round(easedPipeline * 100)}%`, transition: "width 0.5s ease-out" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STEPS.map((step, i) => {
            const isActive = i === currentStepIdx;
            const isDone = i < currentStepIdx;
            return (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", opacity: isDone ? 0.4 : isActive ? 1 : 0.25, transition: "all 0.4s ease" }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: isDone ? "none" : isActive ? "2px solid var(--gold-bright)" : "1px solid var(--line)",
                  background: isDone ? "var(--gold-bright)" : "transparent",
                  transition: "all 0.3s ease",
                }}>
                  {isDone && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                  {isActive && (
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold-bright)" }} />
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--fg)" : "var(--fg-3)" }}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Format-aware review preview ──────────────────────────────────────────────
function ReviewFormatPreview({
  format, draft, hvtFlaggedLines, onApplySuggestion,
}: {
  format: string;
  draft: string;
  hvtFlaggedLines: Array<{ lineIndex: number; original: string; issue: string; vector: string; suggestion: string }>;
  onApplySuggestion?: (instruction: string) => void;
}) {
  const paragraphs = draft.split("\n").filter(Boolean);
  const title = cleanTitle(paragraphs[0] || "Draft");
  const body = paragraphs.slice(1);

  const renderPara = (p: string, i: number) => {
    const flagged = hvtFlaggedLines.find(f => p.includes(f.original) || f.original.includes(p.slice(0, 40)));
    return (
      <div key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
        <p style={flagged ? { borderBottom: "2px solid var(--gold)", paddingBottom: 2, background: "rgba(245,198,66,0.06)" } : undefined}>{p}</p>
        {flagged && (
          <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 4, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>{flagged.vector}:</span> {flagged.issue}
            {flagged.suggestion && (
              <div style={{ color: "var(--fg-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>Suggestion: {flagged.suggestion}</span>
                {onApplySuggestion && (
                  <button
                    onClick={() => onApplySuggestion(`Replace the flagged line "${flagged.original.slice(0, 60)}..." with something like: ${flagged.suggestion}`)}
                    style={{
                      fontSize: 9, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 4,
                      background: "rgba(245,198,66,0.15)",
                      border: "1px solid rgba(245,198,66,0.3)",
                      color: "var(--gold-bright)",
                      cursor: "pointer", fontFamily: FONT,
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (format === "Podcast" || format === "Podcast Script") {
    return (
      <div className="draft-body">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 16 }}>Podcast Script Preview</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 48, flexShrink: 0, paddingTop: 3 }}>OPEN</span>
          <div style={{ flex: 1 }}><p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>Hey, welcome back. Today I want to start with something that keeps coming up.</p></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--gold-bright)", width: 48, flexShrink: 0, paddingTop: 3 }}>HOOK</span>
          <div style={{ flex: 1 }}><p style={{ fontSize: 14, color: "var(--fg)", fontWeight: 600, lineHeight: 1.7 }}>{title}</p></div>
        </div>
        {body.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 48, flexShrink: 0, paddingTop: 3 }}>{i === body.length - 1 ? "CLOSE" : "BODY"}</span>
            <div style={{ flex: 1 }}>{renderPara(p, i)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (format === "Sunday Story") {
    return (
      <div className="draft-body">
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 20 }}>
          Sunday, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
        <div className="draft-title-text" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>{title}</div>
        {body.map((p, i) => renderPara(p, i))}
      </div>
    );
  }

  if (format === "Newsletter" || format === "Newsletter Issue") {
    return (
      <div className="draft-body">
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>Newsletter Preview</div>
        <div className="draft-title-text" style={{ fontSize: 18, marginBottom: 12 }}>{title}</div>
        <div style={{ width: 28, height: 3, background: "var(--gold-bright)", marginBottom: 16, borderRadius: 2 }} />
        {body.map((p, i) => renderPara(p, i))}
      </div>
    );
  }

  // Default: LinkedIn / generic
  return (
    <div className="draft-body">
      <div className="draft-title-text">{title}</div>
      {body.map((p, i) => renderPara(p, i))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: REVIEW
// ─────────────────────────────────────────────────────────────────────────────

function StageReview({
  draft, pipelineRun, running, activeTab, tabs,
  onTabClick, onAdvance, onGoBack, onFix, formatDrafts,
}: {
  draft: string; pipelineRun: PipelineRun | null; running: boolean;
  activeTab: string; tabs: string[]; onTabClick: (t: string) => void;
  onAdvance: () => void; onGoBack: (instructions: string) => void;
  onFix: (instruction: string) => Promise<void>;
  formatDrafts: Record<string, { content: string; metadata: Record<string, string>; status: string }>;
}) {
  // Approve gate: both Impact Score >= 75 and HVT must PASS
  const scoreOk = (pipelineRun?.impactScore?.total ?? 0) >= 75;
  const hvtPasses = pipelineRun?.humanVoiceTest?.verdict === "PASSES";
  const canApprove = scoreOk && hvtPasses;
  const hvtFlaggedLines = pipelineRun?.humanVoiceTest?.flaggedLines || [];
  const [input, setInput] = useState("");
  const [reviewedTabs, setReviewedTabs] = useState<Set<string>>(new Set());

  // Per-format improve suggestions (matching wireframe v7.23)
  const improveCards: Record<string, { pts: number; title: string; desc: string }[]> = {
    LinkedIn: [
      { pts: 12, title: "Sharpen the closing question", desc: "The close is directional but not decisive. A sharper final question drives more engagement." },
      { pts: 5, title: "Tighten the hook", desc: "First two sentences could be condensed. The insight lands faster if the setup is shorter." },
    ],
    Newsletter: [
      { pts: 5, title: "Personalize the opening", desc: "Newsletter readers expect a direct address. One sentence that speaks to them specifically." },
    ],
    Podcast: [
      { pts: 8, title: "Conversational transition", desc: "Two sentences read as written, not spoken. Watson can soften them for audio." },
    ],
    "Sunday Story": [
      { pts: 2, title: "Deepen the opening image", desc: "One more sensory detail in the first paragraph pulls readers fully in." },
    ],
  };

  const currentCards = improveCards[activeTab] || [];
  const [fixedCards, setFixedCards] = useState<Set<number>>(new Set());
  const [fixing, setFixing] = useState<number | null>(null);

  const handleFix = async (cardIdx: number) => {
    const card = currentCards[cardIdx];
    if (!card || fixing !== null) return;
    setFixing(cardIdx);
    try {
      await onFix(`${card.title}: ${card.desc}`);
      setFixedCards(prev => new Set(prev).add(cardIdx));
      setReviewedTabs(prev => new Set(prev).add(activeTab));
    } catch { /* If fix fails, don't mark as fixed */ }
    finally { setFixing(null); }
  };

  const handleSkip = (cardIdx: number) => {
    setFixedCards(prev => new Set(prev).add(cardIdx));
    setReviewedTabs(prev => new Set(prev).add(activeTab));
  };

  const allReviewed = tabs.every(t => reviewedTabs.has(t));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* HVT suggestion fixing indicator */}
      {fixing === -1 && (
        <div style={{
          padding: "8px 20px", background: "rgba(245,198,66,0.08)",
          borderBottom: "1px solid rgba(245,198,66,0.2)",
          fontSize: 11, color: "var(--gold-bright)", fontWeight: 500, flexShrink: 0,
        }}>
          Applying suggestion...
        </div>
      )}
      {/* Format tabs with status dots */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "0 20px", flexShrink: 0, background: "var(--bg)", overflowX: "auto" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`rev-tab${activeTab === tab ? " on" : ""}${reviewedTabs.has(tab) ? " reviewed" : ""}`}
            onClick={() => { onTabClick(tab); setFixedCards(new Set()); }}
          >
            {tab}<span className="tab-dot" />
          </button>
        ))}
      </div>

      {/* Draft preview + improve cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {running ? (
          <ReviewProgress pipelineRunning={running} formatDrafts={formatDrafts} selectedFormats={tabs} />
        ) : (
          <>
            {(() => {
              const fd = formatDrafts[activeTab];
              const isAdapting = fd?.status === "generating" || fd?.status === "pending";
              const adaptedContent = fd?.status === "done" ? fd.content : draft;
              const metadata = fd?.metadata || {};

              if (isAdapting) {
                return (
                  <div style={{ padding: "20px 0" }}>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 8 }}>Adapting for {activeTab}...</div>
                    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: "var(--gold-bright)", width: "60%", animation: "pulse-width 2s ease-in-out infinite" }} />
                    </div>
                  </div>
                );
              }

              return (
                <>
                  {metadata.subject && (
                    <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>Subject line</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{metadata.subject}</div>
                      {metadata.preview && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginTop: 8, marginBottom: 4 }}>Preview text</div>
                          <div style={{ fontSize: 12, color: "var(--fg-2)" }}>{metadata.preview}</div>
                        </>
                      )}
                    </div>
                  )}
                  {metadata.episodeTitle && (
                    <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>Episode title</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{metadata.episodeTitle}</div>
                    </div>
                  )}
                  {metadata.subtitle && (
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 16 }}>{metadata.subtitle}</div>
                  )}
                  <ReviewFormatPreview
                    format={activeTab}
                    draft={adaptedContent}
                    hvtFlaggedLines={hvtFlaggedLines}
                    onApplySuggestion={async (suggestion) => {
                      setFixing(-1);
                      try { await onFix(suggestion); } finally { setFixing(null); }
                    }}
                  />
                  {fd?.status === "error" && (
                    <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 8 }}>Format adaptation unavailable. Showing original draft.</div>
                  )}
                </>
              );
            })()}

            {/* Improve cards */}
            {currentCards.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {currentCards.map((card, ci) => (
                  <div key={ci} className={`rev-improve-card${fixedCards.has(ci) ? " done" : ""}`}>
                    <div className="ric-pts">+{card.pts} pts · {activeTab}</div>
                    <div className="ric-title">{card.title}</div>
                    <div className="ric-desc">{card.desc}</div>
                    <div className="ric-actions">
                      <button className="ric-fix" disabled={fixing !== null} onClick={() => handleFix(ci)}>{fixing === ci ? "Revising..." : "Fix this"}</button>
                      <button className="ric-skip" disabled={fixing !== null} onClick={() => handleSkip(ci)}>Skip</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Review progress hint */}
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 12, marginBottom: 6 }}>
              {allReviewed ? "All formats reviewed. Ready to export." : "Review all formats before exporting."}
            </div>
          </>
        )}
      </div>

      {!running && pipelineRun && canApprove && <AdvanceButton label="Approve &amp; Wrap &#8594;" onClick={onAdvance} />}
      {!running && pipelineRun && !canApprove && (
        <div style={{ padding: "0 14px 8px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: "var(--fg-3)" }}>
              {!scoreOk && "Impact Score below 75%."}
              {!scoreOk && !hvtPasses && " "}
              {!hvtPasses && "Human Voice Test needs work."}
            </span>
            <button
              disabled
              style={{
                padding: "8px 22px", borderRadius: 6,
                background: "var(--surface)", border: "1px solid var(--line)",
                fontSize: 12, fontWeight: 700, color: "var(--fg-3)",
                cursor: "not-allowed", fontFamily: FONT, opacity: 0.6,
              }}
            >
              Approve &amp; Wrap (blocked)
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={onAdvance}
              style={{
                padding: "6px 16px", borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--line)",
                fontSize: 11, fontWeight: 500, color: "var(--fg-3)",
                cursor: "pointer", fontFamily: FONT,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bright)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-3)"; }}
            >
              Export anyway
            </button>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Send back to Edit, tell Watson what to change..."
          style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36 }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Hold to speak"><MicIcon /></IaBtn>
        <button
          onClick={() => { if (input.trim()) { onGoBack(input.trim()); setInput(""); } }}
          style={{ width: 36, height: 36, borderRadius: 7, background: "var(--fg)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function ReviewTabBtn({ label, active, reviewed, exported, onClick }: { label: string; active: boolean; reviewed: boolean; exported: boolean; onClick: () => void }) {
  const dotColor = exported ? "var(--blue)" : reviewed ? "var(--gold-bright)" : "var(--line)";
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: active ? 600 : 500,
        color: active ? "var(--fg)" : "var(--fg-3)",
        padding: "12px 14px",
        borderBottom: active ? "2px solid var(--fg)" : "2px solid transparent",
        cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.1s",
      }}
    >
      {label}
      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: dotColor, marginLeft: 5, verticalAlign: "middle", position: "relative", top: -1, transition: "background 0.2s" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: EXPORT
// ─────────────────────────────────────────────────────────────────────────────

// Output handoff suggestions based on current output type
const HANDOFF_MAP: Record<string, { label: string; targetType: string; prompt: string }[]> = {
  proposal: [
    { label: "Turn this into a Statement of Work", targetType: "sow", prompt: "Ready to turn this into a Statement of Work?" },
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
  report: [
    { label: "Create an Executive Summary", targetType: "executive_summary", prompt: "Create an Executive Summary?" },
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
  case_study: [
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
  essay: [
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
  newsletter: [
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
  presentation: [
    { label: "Create an Executive Summary", targetType: "executive_summary", prompt: "Create an Executive Summary?" },
    { label: "Adapt for Social Media", targetType: "social_media", prompt: "Adapt for social media?" },
  ],
};

function StageExport({
  draft, title, formats, activeTab, onTabClick, exportedTabs, onExport, onCopy, outputId,
  currentOutputType, onHandoff,
}: {
  draft: string; title: string; formats: string[];
  activeTab: string; onTabClick: (t: string) => void;
  exportedTabs: Record<string, boolean>; onExport: (format: string) => void;
  onCopy: () => void; outputId: string | null;
  currentOutputType?: string | null; onHandoff?: (targetType: string) => void;
}) {
  const labels: Record<string, string> = {
    LinkedIn: "LinkedIn Post", Newsletter: "Newsletter",
    Podcast: "Podcast Script", "Sunday Story": "Sunday Story",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "0 20px", flexShrink: 0, background: "var(--bg)", overflowX: "auto" }}>
        {formats.map(tab => (
          <ReviewTabBtn
            key={tab} label={tab}
            active={activeTab === tab}
            reviewed 
            exported={exportedTabs[tab] ?? false}
            onClick={() => onTabClick(tab)}
          />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", maxWidth: 660 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>{labels[activeTab] ?? activeTab}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={onCopy}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}
            >Copy</button>
            <button
              onClick={() => onExport(activeTab)}
              style={{
                fontSize: 11, padding: "5px 14px", borderRadius: 5,
                border: exportedTabs[activeTab] ? "1px solid rgba(74,144,217,0.3)" : "none",
                background: exportedTabs[activeTab] ? "rgba(74,144,217,0.1)" : "var(--fg)",
                color: exportedTabs[activeTab] ? "var(--blue)" : "var(--surface)",
                cursor: "pointer", fontFamily: FONT, fontWeight: 600, transition: "all 0.15s",
              }}
            >
              {exportedTabs[activeTab] ? "Exported" : "Export"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 18 }}>
          Saves to Session Files on export.{outputId && <span style={{ color: "var(--blue)", marginLeft: 6 }}>Saved to Catalog.</span>}
        </div>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 8, padding: "22px 26px", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7,
          fontFamily: FONT,
        }}>
          {draft ? (
            <ExportPreview format={activeTab} draft={draft} title={title} />
          ) : "No content yet."}
        </div>

        {/* What's Next: Output handoff suggestions */}
        {currentOutputType && HANDOFF_MAP[currentOutputType] && HANDOFF_MAP[currentOutputType].length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-2)", marginBottom: 8 }}>What's Next</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {HANDOFF_MAP[currentOutputType].map(h => (
                <button
                  key={h.targetType}
                  onClick={() => onHandoff?.(h.targetType)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 6,
                    border: "1px solid var(--line)", background: "var(--surface)",
                    cursor: "pointer", fontFamily: FONT, textAlign: "left",
                    transition: "all 0.12s",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{h.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gold)", fontWeight: 600 }}>Start</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PREVIEW, format-specific rendering matching wireframe v7.23
// ─────────────────────────────────────────────────────────────────────────────

function ExportPreview({ format, draft, title }: { format: string; draft: string; title: string }) {
  const paragraphs = draft.split("\n").filter(Boolean);
  const firstLine = cleanTitle(paragraphs[0] || title);
  const bodyParas = paragraphs.slice(1);

  if (format === "Podcast" || format === "Podcast Script") {
    return (
      <>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 14 }}>
          Podcast Script · {title}
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 44, flexShrink: 0, paddingTop: 2 }}>OPEN</span>
          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>Hey, welcome back. I want to start today with something I hear from almost every executive I work with.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--gold)", width: 44, flexShrink: 0, paddingTop: 2 }}>HOOK</span>
          <p style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600, lineHeight: 1.7 }}>{firstLine}</p>
        </div>
        {bodyParas.slice(0, 3).map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 44, flexShrink: 0, paddingTop: 2 }}>BODY</span>
            <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>{p}</p>
          </div>
        ))}
      </>
    );
  }

  if (format === "Sunday Story") {
    return (
      <>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 20 }}>
          Sunday, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", lineHeight: 1.2, marginBottom: 8 }}>{firstLine}</div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 20, fontStyle: "normal" }}>
          On the gap between having something to say and getting it into the world.
        </div>
        {bodyParas.map((p, i) => (
          <p key={i} style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.8, marginTop: i > 0 ? 12 : 0 }}>{p}</p>
        ))}
      </>
    );
  }

  if (format === "Newsletter") {
    return (
      <>
        <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>
          {title} · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", marginBottom: 12 }}>{firstLine}</div>
        <div style={{ width: 28, height: 3, background: "var(--gold-bright)", marginBottom: 16, borderRadius: 2 }} />
        {bodyParas.map((p, i) => (
          <p key={i} style={{ marginTop: i > 0 ? 10 : 0 }}>{p}</p>
        ))}
      </>
    );
  }

  // Default: LinkedIn
  return (
    <>
      <p style={{ fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>{firstLine}</p>
      {bodyParas.map((p, i) => (
        <p key={i} style={{ marginTop: 10 }}>{p}</p>
      ))}
      <p style={{ marginTop: 14, color: "var(--blue)", fontWeight: 600 }}>What does your infrastructure look like?</p>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkSession() {
  const { setDashContent, setDashOpen } = useShell();
  const { user, displayName } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { voiceDnaMd, brandDnaMd, methodDnaMd } = useUserDNA(user?.id);

  // ── Restore persisted session on mount ────────────────────────
  const restored = useRef(false);
  const persisted = !restored.current ? loadSession() : null;

  // ── Stage state ──────────────────────────────────────────────
  const [stage, setStage] = useState<WorkStage>(
    (persisted?.phase === "complete" ? "Edit" : persisted?.phase === "generating" ? "Edit" : "Intake") as WorkStage
  );

  // ── Intake ───────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (persisted?.messages && persisted.messages.length > 0) {
      return persisted.messages.map(m => ({
        role: m.role === "assistant" ? "watson" as const : "user" as const,
        content: m.content,
      }));
    }
    return [{ role: "watson", content: "Good to see you. What are you working on?" }];
  });
  const [intakeSending, setIntakeSending] = useState(false);
  const [intakeReady, setIntakeReady] = useState(persisted?.isReady ?? false);
  const [readySummary, setReadySummary] = useState("");

  // ── Output type (CO-003) ─────────────────────────────────────
  const [outputType, setOutputType] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // ── Formats + templates ───────────────────────────────────────
  const [selectedFormats, setSelectedFormats] = useState<Format[]>(DEFAULT_FORMATS);
  const [selectedTemplate, setSelectedTemplate] = useState("Weekly Insight");
  const [sessionFiles, setSessionFiles] = useState<string[]>([]);

  const toggleFormat = (f: Format) => {
    setSelectedFormats(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);
  };

  // ── Outline ──────────────────────────────────────────────────
  const [outlineRows, setOutlineRows] = useState<OutlineRow[]>([]);
  const [buildingOutline, setBuildingOutline] = useState(false);

  // ── Edit ─────────────────────────────────────────────────────
  const [draft, setDraft] = useState(persisted?.generatedContent || "");
  const [draftVersions, setDraftVersions] = useState<Array<{ content: string; label: string }>>([]);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState("Writing draft...");

  // ── Review ───────────────────────────────────────────────────
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [formatDrafts, setFormatDrafts] = useState<Record<string, { content: string; metadata: Record<string, string>; status: "pending" | "generating" | "done" | "error" }>>({});
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState(selectedFormats[0] ?? "LinkedIn");
  const [hvtAttempts, setHvtAttempts] = useState(0);
  const [hvtRunning, setHvtRunning] = useState(false);

  // ── Export ────────────────────────────────────────────────────
  const [exportedTabs, setExportedTabs] = useState<Record<string, boolean>>({});
  const [activeExportTab, setActiveExportTab] = useState(selectedFormats[0] ?? "LinkedIn");
  const [outputId, setOutputId] = useState<string | null>(persisted?.generatedOutputId || null);
  const [allExported, setAllExported] = useState(false);

  // Mark restored so we don't re-read persisted on re-renders
  useEffect(() => { restored.current = true; }, []);

  // ── Auto-save session on every meaningful state change ─────────
  useEffect(() => {
    if (!restored.current) return; // skip the initial mount
    const hasContent = messages.length > 1 || draft;
    if (!hasContent) return;

    saveSession({
      messages: messages.map((m, i) => ({
        id: String(i),
        role: m.role === "watson" ? "assistant" : "user",
        content: m.content,
        ts: Date.now(),
      })),
      input: "",
      outputType: selectedFormats[0] || "LinkedIn",
      sessionTitle: outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 60) || "",
      phase: draft ? "complete" : "input",
      generatedContent: draft,
      generatedScore: 0,
      generatedOutputId: outputId || "",
      generatedGates: null,
      isReady: intakeReady,
      timestamp: Date.now(),
    });
  }, [messages, draft, intakeReady, outputId, stage]);

  // ── Stage navigation ──────────────────────────────────────────
  const goToStage = useCallback((s: WorkStage) => {
    setStage(s);
  }, []);

  // ── Prefill from Watch/Pipeline signal ───────────────────────
  // When "Use this in Work" is clicked from Watch or TheLot,
  // sessionStorage has the signal title and detail.
  // We seed Watson with the context so the user lands in a live conversation.
  useEffect(() => {
    const signalText = sessionStorage.getItem("ew-signal-text");
    const signalDetail = sessionStorage.getItem("ew-signal-detail");
    if (!signalText) return;

    sessionStorage.removeItem("ew-signal-text");
    sessionStorage.removeItem("ew-signal-detail");

    const detail = signalDetail ? ` ${signalDetail}` : "";
    setMessages([
      { role: "watson", content: "Good to see you. What are you working on?" },
      { role: "user", content: `I want to write about this: ${signalText}.${detail}` },
      { role: "watson", content: `Good signal. Let me shape this into something worth publishing.\n\nTell me more about what you want to say.` },
    ]);
    // Keep stage at Intake so Watson continues the conversation naturally
  }, []);

  // ── Reopen from Catalog or Pipeline ──────────────────────────
  // When a user hits "Reopen in Work" from OutputLibrary or TheLot,
  // sessionStorage has the output ID and title. Load the draft and
  // drop into Edit stage so they can continue from where they left off.
  useEffect(() => {
    const reopenId = sessionStorage.getItem("ew-reopen-output-id");
    const reopenTitle = sessionStorage.getItem("ew-reopen-title");
    if (!reopenId || !user) return;

    // Clear immediately so navigating away and back doesn't retrigger
    sessionStorage.removeItem("ew-reopen-output-id");
    sessionStorage.removeItem("ew-reopen-title");

    (async () => {
      const { data } = await supabase
        .from("outputs")
        .select("id, title, content, output_type")
        .eq("id", reopenId)
        .eq("user_id", user.id)
        .single();

      if (!data) return;

      // Seed the conversation with the title as context
      if (reopenTitle) {
        setMessages([
          { role: "watson", content: "What's on your mind?" },
          { role: "user", content: `I want to continue working on: ${reopenTitle}` },
          { role: "watson", content: `Picking up where we left off. I've loaded your draft. Jump to Edit to continue, or tell me what you'd like to change.` },
        ]);
      }

      // Load the draft and jump to Edit
      if (data.content) {
        setDraft(data.content);
        setOutputId(data.id);
        goToStage("Edit");
      }
    })();
  }, [user, goToStage]);

  // Expose to StudioTopBar breadcrumb
  useEffect(() => {
    (window as any).__ewWorkStage = stage;
    (window as any).__ewSetWorkStage = goToStage;
    return () => {
      delete (window as any).__ewWorkStage;
      delete (window as any).__ewSetWorkStage;
    };
  }, [stage, goToStage]);

  // ── Build conversation summary for API calls ──────────────────
  const buildConvSummary = useCallback(() =>
    messages
      .filter(m => m.role === "user" || m.role === "watson")
      .map(m => `${m.role === "watson" ? "Watson" : "User"}: ${m.content}`)
      .join("\n\n")
  , [messages]);

  // ── INTAKE: Send message to Watson ────────────────────────────
  const handleIntakeSend = useCallback(async (text: string) => {
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIntakeSending(true);

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === "watson" ? "assistant" : "user", content: m.content })),
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "freestyle",
          voiceDnaMd,
          userId: user?.id,
          systemMode: "CONTENT_PRODUCTION",
        }),
      }, { timeout: 60000 });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      // Sanitize: strip em-dashes, en-dashes, replace with commas or colons
      const reply = (data.reply ?? "").replace(/\u2014/g, ",").replace(/\u2013/g, ",");

      setMessages(prev => [...prev, { role: "watson", content: reply }]);

      if (data.readyToGenerate) {
        setIntakeReady(true);
        setReadySummary(reply);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "watson", content: "Something went wrong. Please try again." }]);
      console.error("[WorkSession][intake]", err);
    } finally {
      setIntakeSending(false);
    }
  }, [messages, selectedFormats, voiceDnaMd, user?.id, outputType]);

  // ── INTAKE → OUTLINE: Build outline from conversation ─────────
  const handleBuildOutline = useCallback(async () => {
    goToStage("Outline");
    setBuildingOutline(true);

    // Build outline from Watson's ready summary using a structured parse
    const summary = readySummary || buildConvSummary();

    // Parse Watson's checklist output for Thesis/Audience/Hook/Format
    const thesis = summary.match(/thesis:?\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || "Core argument";
    const audience = summary.match(/audience:?\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || "Your target reader";
    const hook = summary.match(/hook:?\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || "Opening that earns the read";
    const formatLine = summary.match(/format:?\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || selectedFormats[0];

    // Build a standard editorial outline
    const rows: OutlineRow[] = [
      { label: "Title", content: thesis },
      { label: "Hook", content: hook },
      { label: "Body", content: "The core argument and diagnosis." },
      { label: "", content: "Supporting evidence and examples.", indent: true },
      { label: "", content: "Concrete implications for the reader.", indent: true },
      { label: "Stakes", content: "What changes if the reader acts on this." },
      { label: "", content: "The cost of inaction.", indent: true },
      { label: "Close", content: thesis },
    ];

    setOutlineRows(rows);
    setBuildingOutline(false);
  }, [readySummary, buildConvSummary, selectedFormats, goToStage]);

  // ── OUTLINE → EDIT: Generate draft ───────────────────────────
  const handleGenerateDraft = useCallback(async () => {
    goToStage("Edit");
    setGenerating(true);
    setGeneratingLabel("Generating draft...");
    setDraft("");

    const convSummary = buildConvSummary();
    const outlineForAPI = outlineRows.map((row, i) => ({
      section: row.label || `Section ${i + 1}`,
      beats: [row.content].filter(Boolean),
      purpose: "",
    }));

    try {
      setGeneratingLabel("Writing in your voice...");
      const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: convSummary,
          outputType: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          outline: outlineForAPI,
          thesis: outlineRows[0]?.content || "",
          userId: user?.id,
          maxTokens: 4096,
        }),
      }, { timeout: 90000 });

      if (!res.ok) throw new Error(`Generate error ${res.status}`);
      const data = await res.json();

      setDraft(data.content || "");
      setDraftVersions([{ content: data.content || "", label: "Version 1" }]);
      setActiveVersionIdx(0);
      setGeneratingLabel("Done.");
    } catch (err: any) {
      toast("Draft generation failed. Please try again.", "error");
      setDraft("Could not generate draft. Please go back to Outline and try again.");
      console.error("[WorkSession][generate]", err);
    } finally {
      setGenerating(false);
    }
  }, [buildConvSummary, outlineRows, selectedFormats, user?.id, toast, goToStage]);

  // ── EDIT: Revise draft ────────────────────────────────────────
  const handleRevise = useCallback(async (instructions: string) => {
    if (!draft) return;
    setGenerating(true);
    setGeneratingLabel("Revising...");

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: buildConvSummary(),
          outputType: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          originalDraft: draft,
          revisionNotes: instructions,
          userId: user?.id,
          maxTokens: 4096,
        }),
      }, { timeout: 90000 });

      if (!res.ok) throw new Error(`Revision error ${res.status}`);
      const data = await res.json();
      const revised = data.content || draft;
      setDraft(revised);
      setDraftVersions(prev => {
        const updated = [...prev];
        if (updated[activeVersionIdx]) {
          updated[activeVersionIdx] = { ...updated[activeVersionIdx], content: revised };
        }
        return updated;
      });
    } catch (err: any) {
      toast("Revision failed. Your draft is unchanged.", "error");
      console.error("[WorkSession][revise]", err);
    } finally {
      setGenerating(false);
    }
  }, [draft, buildConvSummary, selectedFormats, user?.id, toast]);

  // ── EDIT → REVIEW: Run pipeline ──────────────────────────────
  // ── EDIT: Generate another draft version ─────────────────────
  const handleGenerateVersion = useCallback(async () => {
    if (!draft || generating) return;
    setGenerating(true);
    setGeneratingLabel("Generating another version...");

    try {
      const versionNum = draftVersions.length + 1;
      const variationInstruction = versionNum === 2
        ? "Write a distinctly different version of this content. Change the opening hook, restructure the argument flow, and try a different closing. Same core message, different execution."
        : "Write a third variation. Try a bolder, more unexpected angle. Change the structure significantly. Take a creative risk with the opening.";

      const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: buildConvSummary(),
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          originalDraft: draft,
          revisionNotes: variationInstruction,
          userId: user?.id,
          maxTokens: 4096,
        }),
      }, { timeout: 90000 });

      if (!res.ok) throw new Error(`Version error ${res.status}`);
      const data = await res.json();
      const newContent = data.content || "";

      if (newContent) {
        const newVersions = [...draftVersions, { content: newContent, label: `Version ${versionNum}` }];
        setDraftVersions(newVersions);
        setActiveVersionIdx(newVersions.length - 1);
        setDraft(newContent);
      }
    } catch (err: any) {
      toast("Failed to generate another version.", "error");
      console.error("[WorkSession][version]", err);
    } finally {
      setGenerating(false);
    }
  }, [draft, generating, draftVersions, buildConvSummary, outputType, selectedFormats, user?.id, toast]);

  // ── EDIT → REVIEW: Run pipeline ──────────────────────────────
  // ── Format adaptation (parallel with pipeline) ──────────────
  const handleFormatAdaptation = useCallback(async () => {
    if (!draft || !user) return;
    const initial: Record<string, { content: string; metadata: Record<string, string>; status: "pending" | "generating" | "done" | "error" }> = {};
    selectedFormats.forEach(f => { initial[f] = { content: "", metadata: {}, status: "pending" }; });
    setFormatDrafts(initial);

    const promises = selectedFormats.map(async (format) => {
      setFormatDrafts(prev => ({ ...prev, [format]: { ...prev[format], status: "generating" } }));
      try {
        const res = await fetchWithRetry(`${API_BASE}/api/adapt-format`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft, format, voiceDnaMd, brandDnaMd, userId: user.id }),
        }, { timeout: 60000 });
        if (!res.ok) throw new Error(`Adapt error ${res.status}`);
        const data = await res.json();
        setFormatDrafts(prev => ({ ...prev, [format]: { content: data.content || draft, metadata: data.metadata || {}, status: "done" } }));
      } catch (err) {
        console.error(`[adapt-format] ${format} failed:`, err);
        setFormatDrafts(prev => ({ ...prev, [format]: { content: draft, metadata: {}, status: "error" } }));
      }
    });
    await Promise.allSettled(promises);
  }, [draft, user, selectedFormats, voiceDnaMd, brandDnaMd]);

  // ── EDIT -> REVIEW: Run pipeline ──────────────────────────────
  const handleRunPipeline = useCallback(async () => {
    goToStage("Review");
    if (!draft || !user) return;
    setPipelineRunning(true);
    // Start format adaptation in parallel with pipeline
    handleFormatAdaptation();
    setPipelineRun(null);

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          voiceDnaMd,
          brandDnaMd,
          methodDnaMd,
          userId: user.id,
          outputId: outputId || undefined,
        }),
      }, { timeout: 175000 });

      if (!res.ok) throw new Error(`Pipeline error ${res.status}`);
      const result = await res.json();

      setPipelineRun({
        status: result.status,
        checkpointResults: result.checkpointResults || [],
        impactScore: result.impactScore || null,
        humanVoiceTest: result.humanVoiceTest || null,
        blockedAt: result.blockedAt,
        finalDraft: result.finalDraft,
      });
      setHvtAttempts(1);

      // Use the pipeline's final draft if it differs
      if (result.finalDraft && result.finalDraft !== draft) {
        setDraft(result.finalDraft);
      }

      // Save to Supabase
      if (user) {
        const title = outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled";
        const score = result.impactScore?.total ?? 0;
        const outputTypeId = outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay";
        const outputCategory = OUTPUT_TYPES.find(t => t.id === outputTypeId)?.category?.toLowerCase() || null;
        const { data: savedOutput } = await supabase.from("outputs").insert({
          user_id: user.id,
          title: title.slice(0, 200),
          content: result.finalDraft || draft,
          output_type: outputTypeId,
          output_category: outputCategory,
          output_type_id: outputTypeId,
          project_id: projectId || undefined,
          score,
          gates: result.checkpointResults || null,
          content_state: score >= 75 ? "vault" : "in_progress",
        }).select("id").single();

        if (savedOutput?.id) {
          setOutputId(savedOutput.id);
        }
      }

      // Pipeline complete - no toast, results show in Review stage silently
    } catch (err: any) {
      toast("Pipeline encountered an error. Try again.", "error");
      console.error("[WorkSession][pipeline]", err);
    } finally {
      setPipelineRunning(false);
    }
  }, [draft, user, voiceDnaMd, brandDnaMd, methodDnaMd, selectedFormats, outputId, outlineRows, messages, toast, goToStage]);

  // ── REVIEW: Export all ─────────────────────────────────────────
  const handleExportAll = useCallback(() => {
    const exported: Record<string, boolean> = {};
    selectedFormats.forEach(f => { exported[f] = true; });
    setExportedTabs(exported);
    setAllExported(true);
    setTimeout(() => goToStage("Approve"), 1200);
  }, [selectedFormats, goToStage]);

  // ── REVIEW: Rerun Human Voice Test only ───────────────────────
  const handleRerunHVT = useCallback(async () => {
    if (!draft || !user || hvtAttempts >= 3) return;
    setHvtRunning(true);

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          outputType: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          voiceDnaMd,
          userId: user.id,
          hvtOnly: true,
        }),
      }, { timeout: 60000 });

      if (!res.ok) throw new Error(`HVT rerun error ${res.status}`);
      const result = await res.json();
      const newAttempt = hvtAttempts + 1;
      setHvtAttempts(newAttempt);

      if (result.humanVoiceTest) {
        setPipelineRun(prev => prev ? {
          ...prev,
          humanVoiceTest: result.humanVoiceTest,
          status: prev.impactScore && prev.impactScore.total >= 75 && result.humanVoiceTest.verdict === "PASSES"
            ? "PASSED" : prev.status,
        } : prev);
      }
    } catch (err: any) {
      toast("Voice test rerun failed. Try again.", "error");
      console.error("[WorkSession][hvt-rerun]", err);
    } finally {
      setHvtRunning(false);
    }
  }, [draft, user, hvtAttempts, selectedFormats, voiceDnaMd, toast]);

  // ── EXPORT: Copy to clipboard ─────────────────────────────────
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(draft).then(() => toast("Copied to clipboard")).catch(() => {});
  }, [draft, toast]);

  // ── EXPORT: Individual export ─────────────────────────────────
  const handleExport = useCallback(async (format: string) => {
    setExportedTabs(prev => ({ ...prev, [format]: true }));
    // If we have an outputId, update the record
    if (outputId) {
      await supabase.from("outputs").update({ content_state: "vault" }).eq("id", outputId);
    }
    toast(`${format} exported.`);
  }, [outputId, toast]);

  // ── REVIEW → EDIT: Send back ──────────────────────────────────
  // ── NEW SESSION: Reset everything ────────────────────────────
  const handleNewSession = useCallback(() => {
    clearSession();
    setMessages([{ role: "watson", content: "Good to see you. What are you working on?" }]);
    setStage("Intake");
    setIntakeSending(false);
    setIntakeReady(false);
    setReadySummary("");
    setOutputType(null);
    setSelectedFormats(DEFAULT_FORMATS);
    setSessionFiles([]);
    setOutlineRows([]);
    setDraft("");
    setGenerating(false);
    setPipelineRun(null);
    setPipelineRunning(false);
    setHvtAttempts(0);
    setHvtRunning(false);
    setAllExported(false);
    setExportedTabs({});
    setOutputId(null);
    setProjectId(null);
    setDraftVersions([]);
    setActiveVersionIdx(0);
    setFormatDrafts({});
  }, []);

  const handleGoBackToEdit = useCallback((instructions: string) => {
    goToStage("Edit");
    handleRevise(instructions);
  }, [goToStage, handleRevise]);

  // ── REVIEW: Fix a specific improvement card ─────────────────────
  const handleReviewFix = useCallback(async (instruction: string) => {
    if (!draft) throw new Error("No draft to fix");

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: buildConvSummary(),
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          originalDraft: draft,
          revisionNotes: `Apply this specific improvement to the draft. Keep everything else the same. Only change what is necessary to address this note: ${instruction}`,
          userId: user?.id,
          maxTokens: 4096,
        }),
      }, { timeout: 90000 });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Fix error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data.content && data.content !== draft) {
        setDraft(data.content);
        toast("Draft updated.");

        // Re-adapt the current format with the new draft
        try {
          const adaptRes = await fetchWithRetry(`${API_BASE}/api/adapt-format`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft: data.content, format: activeReviewTab, voiceDnaMd, brandDnaMd, userId: user?.id }),
          }, { timeout: 60000 });
          if (adaptRes.ok) {
            const adaptData = await adaptRes.json();
            setFormatDrafts(prev => ({
              ...prev,
              [activeReviewTab]: { content: adaptData.content || data.content, metadata: adaptData.metadata || {}, status: "done" as const },
            }));
          }
        } catch { /* Non-critical: format re-adaptation failed */ }
      } else {
        toast("No changes detected.");
      }
    } catch (err: any) {
      console.error("[handleReviewFix]", err);
      toast("Fix failed. Try again.", "error");
      throw err;
    }
  }, [draft, buildConvSummary, outputType, selectedFormats, user?.id, voiceDnaMd, brandDnaMd, activeReviewTab, toast]);

  // ── Inject dashboard panel ────────────────────────────────────
  useLayoutEffect(() => {
    if (stage === "Review" || stage === "Approve") {
      setDashOpen(true);
    } else {
      setDashOpen(false);
    }

    const dashNode = (() => {
      switch (stage) {
        case "Intake":
          return (
            <IntakeDash
              selectedFormats={selectedFormats}
              onToggleFormat={toggleFormat}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              sessionFiles={sessionFiles}
              outputType={outputType}
              onSelectOutputType={setOutputType}
            />
          );
        case "Outline":
          return <OutlineDash selectedFormats={selectedFormats} />;
        case "Edit":
          return (
            <EditDash
              wordCount={draft ? draft.split(/\s+/).filter(Boolean).length : 0}
              selectedFormats={selectedFormats}
              generating={generating}
              generatingLabel={generatingLabel}
            />
          );
        case "Review":
          return (
            <ReviewDash
              pipelineRun={pipelineRun}
              running={pipelineRunning}
              onExportAll={handleExportAll}
              allExported={allExported}
              hvtAttempts={hvtAttempts}
              onRerunHVT={handleRerunHVT}
              hvtRunning={hvtRunning}
            />
          );
        case "Approve":
          return (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>Session Files</div>
              {selectedFormats.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5, marginBottom: 4 }}>
                  <FileIcon />
                  <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1 }}>{f}_Draft.md</span>
                  <span
                    onClick={() => navigator.clipboard.writeText(draft).then(() => toast("Copied")).catch(() => {})}
                    style={{ fontSize: 9, color: "var(--blue)", fontWeight: 600, cursor: "pointer" }}
                  >Copy</span>
                </div>
              ))}
              {outputId && (
                <button
                  onClick={() => nav(`/studio/outputs/${outputId}`)}
                  style={{ marginTop: 8, fontSize: 11, padding: "6px 12px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT, width: "100%" }}
                >
                  View in Catalog →
                </button>
              )}
            </div>
          );
        default:
          return null;
      }
    })();

    setDashContent(dashNode);
    return () => setDashContent(null);
  }, [
    stage, selectedFormats, selectedTemplate, draft, generating, generatingLabel,
    pipelineRun, pipelineRunning, allExported, outputId,
    hvtAttempts, handleRerunHVT, hvtRunning, outputType,
  ]);

  // Auto-open dashboard when pipeline finishes in Review
  useEffect(() => {
    if (stage === "Review" && pipelineRun && !pipelineRunning) {
      setDashOpen(true);
    }
  }, [stage, pipelineRun, pipelineRunning, setDashOpen]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // Lock parent main scroll when WorkSession is active
  useEffect(() => {
    const main = document.querySelector(".studio-main-inner") as HTMLElement;
    if (main) {
      main.style.overflow = "hidden";
      return () => { main.style.overflow = ""; };
    }
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: FONT,
    }}>
      {stage === "Intake" && (
        <StageIntake
          messages={messages}
          onSend={handleIntakeSend}
          sending={intakeSending}
          isReady={intakeReady}
          onAdvance={handleBuildOutline}
          userInitials={displayName ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2) : "U"}
          firstName={displayName ? displayName.split(" ")[0] : undefined}
          onFileAttach={(files) => {
            const names = Array.from(files).map(f => f.name);
            setSessionFiles(prev => [...prev, ...names]);
          }}
          onNewSession={handleNewSession}
        />
      )}
      {stage === "Outline" && (
        <StageOutline
          outlineRows={outlineRows}
          onUpdateRow={(i, v) => setOutlineRows(rows => rows.map((r, idx) => idx === i ? { ...r, content: v } : r))}
          onAdvance={handleGenerateDraft}
          building={buildingOutline}
        />
      )}
      {stage === "Edit" && (
        <StageEdit
          draft={draft}
          generating={generating}
          generatingLabel={generatingLabel}
          onDraftChange={setDraft}
          onAdvance={handleRunPipeline}
          onRevise={handleRevise}
          versions={draftVersions}
          activeVersionIdx={activeVersionIdx}
          onVersionSelect={(idx) => {
            setActiveVersionIdx(idx);
            setDraft(draftVersions[idx].content);
          }}
          onGenerateVersion={handleGenerateVersion}
          canGenerateMore={draftVersions.length < 3 && !generating}
        />
      )}
      {stage === "Review" && (
        <StageReview
          draft={draft}
          pipelineRun={pipelineRun}
          running={pipelineRunning}
          activeTab={activeReviewTab}
          tabs={selectedFormats}
          onTabClick={(t) => setActiveReviewTab(t as any)}
          onAdvance={() => goToStage("Approve")}
          onGoBack={handleGoBackToEdit}
          onFix={handleReviewFix}
          formatDrafts={formatDrafts}
        />
      )}
      {stage === "Approve" && (
        <StageExport
          draft={formatDrafts[activeExportTab]?.status === "done" ? formatDrafts[activeExportTab].content : draft}
          title={outlineRows[0]?.content || "Draft"}
          formats={selectedFormats}
          activeTab={activeExportTab}
          onTabClick={(t) => setActiveExportTab(t as any)}
          exportedTabs={exportedTabs}
          onExport={handleExport}
          onCopy={handleCopy}
          outputId={outputId}
          currentOutputType={outputType}
          onHandoff={(targetType) => {
            // Store handoff context and start a new session
            sessionStorage.setItem("ew-handoff-source-id", outputId || "");
            sessionStorage.setItem("ew-handoff-target-type", targetType);
            setOutputType(targetType);
            setStage("Intake");
            setMessages([{ role: "watson", content: "Good to see you. What are you working on?" }]);
            setDraft("");
            setPipelineRun(null);
            setHvtAttempts(0);
          }}
        />
      )}
    </div>
  );
}
