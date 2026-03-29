/**
 * WorkSession.tsx — Phase 5: Fully wired to real API
 *
 * Flow:
 *   Intake  → /api/chat (Watson conversation, READY_TO_GENERATE detection)
 *   Outline → client-side state built from Watson's readiness summary
 *   Edit    → /api/generate (draft generation + back-of-house auto-revision)
 *   Review  → /api/run-pipeline (7 specialist gates + Betterish score)
 *   Export  → save to Supabase outputs table + copy/download
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
import { saveSession, loadSession, clearSession } from "../../lib/sessionPersistence";
import "./shared.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "var(--font)";

type WorkStage = "Intake" | "Outline" | "Edit" | "Review" | "Export";
const STAGES: WorkStage[] = ["Intake", "Outline", "Edit", "Review", "Export"];

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

const TEMPLATES = ["Thought Leadership", "Case Study Narrative", "Weekly Insight", "Contrarian Take", "Origin Story"];

const GATE_LABELS: Record<string, string> = {
  "gate-0": "Echo — Deduplication",
  "gate-1": "Priya — Research",
  "gate-2": "Jordan — Voice DNA",
  "gate-3": "David — Hook & Engagement",
  "gate-4": "Elena — SLOP Detection",
  "gate-5": "Natasha — Editorial",
  "gate-6": "Marcus + Marshall — Perspective",
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

interface GateResult {
  gate: string;
  status: "PASS" | "FAIL" | "FLAG";
  score: number;
  feedback: string;
  issues?: string[];
}

interface BetterishScore {
  total: number;
  verdict: "PUBLISH" | "REVISE" | "REJECT";
  topIssue?: string;
  gutCheck?: string;
  breakdown?: Record<string, number>;
}

interface PipelineRun {
  status: "PASSED" | "BLOCKED" | "ERROR";
  gateResults: GateResult[];
  betterishScore: BetterishScore | null;
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
  sessionFiles,
}: {
  selectedFormats: Format[]; onToggleFormat: (f: Format) => void;
  selectedTemplate: string; onSelectTemplate: (t: string) => void;
  sessionFiles: string[];
}) {
  const [outputsOpen, setOutputsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [sessionFilesOpen, setSessionFilesOpen] = useState(false);
  const [projectFilesOpen, setProjectFilesOpen] = useState(false);

  return (
    <>
      <DpSection>
        <DpLabel collapsible open={outputsOpen} onToggle={() => setOutputsOpen(o => !o)}>Outputs</DpLabel>
        {outputsOpen && (
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
          collapsible open={templatesOpen} onToggle={() => setTemplatesOpen(o => !o)}
          action={<span style={{ fontSize: 9, fontWeight: 400, color: "var(--blue)", cursor: "pointer", marginLeft: 6, textTransform: "none" as const, letterSpacing: 0 }}>Edit</span>}
        >Templates</DpLabel>
        {templatesOpen && (
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
        <DpLabel collapsible open={sessionFilesOpen} onToggle={() => setSessionFilesOpen(o => !o)}>Session Files</DpLabel>
        {sessionFilesOpen && (
          <div style={{ marginTop: 6 }}>
            {sessionFiles.length === 0 ? (
              <div style={{ fontSize: 9, color: "var(--fg-3)" }}>No files attached yet.</div>
            ) : sessionFiles.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5, marginBottom: 4 }}>
                <FileIcon />
                <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f}</span>
              </div>
            ))}
            <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 4 }}>Session only — not saved to Project Files</div>
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel collapsible open={projectFilesOpen} onToggle={() => setProjectFilesOpen(o => !o)}>Project Files</DpLabel>
        {projectFilesOpen && (
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

  return (
    <>
      {generating && (
        <DpSection>
          <DpLabel>Generating</DpLabel>
          <div style={{ fontSize: 11, color: "var(--blue)", lineHeight: 1.6 }}>{generatingLabel}</div>
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
  pipelineRun, running, onExportAll, allExported,
}: {
  pipelineRun: PipelineRun | null; running: boolean;
  onExportAll: () => void; allExported: boolean;
}) {
  const score = pipelineRun?.betterishScore?.total ?? null;
  const passed = pipelineRun?.status === "PASSED";
  const allGatesPass = pipelineRun?.gateResults?.every(g => g.status === "PASS" || g.status === "FLAG") ?? false;
  const canExport = pipelineRun && !running && !allExported;

  return (
    <>
      {running && (
        <DpSection>
          <DpLabel>Running checkpoints</DpLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {["Echo", "Priya", "Jordan", "David", "Elena", "Natasha", "Marcus + Marshall"].map((name, i) => (
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
              <DpLabel>Betterish Score</DpLabel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <svg viewBox="0 0 100 60" width="48" height="29">
                  <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke={score >= 900 ? "var(--blue)" : score >= 700 ? "var(--gold)" : "var(--danger)"} strokeWidth="10" strokeLinecap="round" strokeDasharray="141" strokeDashoffset={141 - (score / 1000) * 141} />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{score}</span>
                <span style={{ fontSize: 9, color: "var(--fg-3)" }}>/1000</span>
              </div>
              <div style={{ fontSize: 10, color: score >= 900 ? "var(--blue)" : "var(--gold)", marginTop: 4, fontWeight: 600 }}>
                {pipelineRun.betterishScore?.verdict ?? (score >= 900 ? "PUBLISH" : "REVISE")}
              </div>
              {pipelineRun.betterishScore?.topIssue && (
                <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.5 }}>{pipelineRun.betterishScore.topIssue}</div>
              )}
            </DpSection>
          )}

          <DpSection>
            <DpLabel>Checkpoints</DpLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {pipelineRun.gateResults.map((gate, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", borderBottom: "1px solid var(--line)", fontSize: 10 }}>
                  <span style={{
                    color: gate.status === "PASS" ? "var(--blue)" : gate.status === "FLAG" ? "var(--gold)" : "var(--danger)",
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {gate.status === "PASS" ? "✓" : gate.status === "FLAG" ? "⚑" : "✗"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--fg-2)", fontWeight: 500 }}>{gate.gate.replace("gate-", "").replace(/-/g, " ")}</div>
                    {gate.feedback && gate.status !== "PASS" && (
                      <div style={{ color: "var(--fg-3)", marginTop: 2, lineHeight: 1.4 }}>{gate.feedback.slice(0, 120)}{gate.feedback.length > 120 ? "..." : ""}</div>
                    )}
                  </div>
                  <span style={{ color: "var(--fg-3)", flexShrink: 0 }}>{gate.score}</span>
                </div>
              ))}
            </div>
          </DpSection>

          {pipelineRun.blockedAt && (
            <DpSection>
              <DpLabel>Blocked at</DpLabel>
              <div style={{ fontSize: 10, color: "var(--danger)", lineHeight: 1.5 }}>{pipelineRun.blockedAt}</div>
            </DpSection>
          )}
        </>
      )}

      <div style={{ fontSize: 10, color: allExported ? "var(--blue)" : "var(--fg-3)", marginBottom: 6, transition: "color 0.2s" }}>
        {allExported ? "All formats exported to Session Files." : running ? "Running 7 checkpoints..." : pipelineRun ? (passed ? "Pipeline passed. Ready to export." : "Pipeline complete. Review results above.") : "Run pipeline to check your draft."}
      </div>

      <button
        onClick={onExportAll}
        disabled={!canExport || running}
        style={{
          width: "100%", padding: 10, borderRadius: 6,
          background: allExported ? "rgba(74,144,217,0.12)" : canExport ? "var(--gold-bright)" : "var(--gold-bright)",
          border: allExported ? "1px solid rgba(74,144,217,0.3)" : "none",
          fontSize: 12, fontWeight: 700,
          color: allExported ? "var(--blue)" : "var(--fg)",
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
  messages, onSend, sending, isReady, onAdvance,
}: {
  messages: ChatMessage[]; onSend: (text: string) => void;
  sending: boolean; isReady: boolean; onAdvance: () => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.content} />)}
        {sending && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--blue)", flexShrink: 0 }}>W</div>
            <LoadingDots label="" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isReady && (
        <div style={{ padding: "0 14px 8px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onAdvance}
            style={{
              fontSize: 11, fontWeight: 600, padding: "7px 16px", borderRadius: 6,
              background: "var(--gold-bright)", border: "none", color: "var(--fg)",
              cursor: "pointer", fontFamily: FONT,
            }}
          >
            Build outline →
          </button>
        </div>
      )}

      <InputBar
        placeholder="What's on your mind?"
        value={input} onChange={setInput}
        onSend={handleSend} disabled={sending}
      />
    </div>
  );
}

function ChatBubble({ role, text }: { role: "watson" | "user"; text: string }) {
  const isWatson = role === "watson";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: isWatson ? "flex-start" : "flex-end" }}>
      {isWatson && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--blue)", flexShrink: 0, marginTop: 2 }}>W</div>
      )}
      <div style={{
        background: isWatson ? "rgba(74,144,217,0.07)" : "rgba(245,198,66,0.08)",
        border: isWatson ? "1px solid rgba(74,144,217,0.15)" : "1px solid rgba(245,198,66,0.2)",
        borderRadius: isWatson ? "0 10px 10px 10px" : "10px 0 10px 10px",
        padding: "10px 14px", maxWidth: "82%",
      }}>
        <p style={{ fontSize: 13, color: isWatson ? "var(--fg-2)" : "var(--fg)", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>{text}</p>
      </div>
      {!isWatson && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(245,198,66,0.15)", border: "1px solid rgba(245,198,66,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--gold)", flexShrink: 0, marginTop: 2 }}>ME</div>
      )}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {building ? (
          <LoadingDots label="Building outline from your conversation..." />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, minHeight: 200 }}>
            {outlineRows.map((row, i) => (
              <OutlineRowComponent key={i} label={row.label} content={row.content} indent={row.indent} onChange={v => onUpdateRow(i, v)} />
            ))}
          </div>
        )}
      </div>

      {!building && <AdvanceButton label="Write draft →" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask Watson to restructure — or click any line to edit..."
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

function OutlineRowComponent({ label, content, indent, onChange }: { label: string; content: string; indent?: boolean; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 0, padding: "7px 0", borderBottom: "1px solid var(--line)", position: "relative" }}>
      <div style={{ width: 52, fontSize: 10, fontWeight: 600, color: "var(--line-2)", textTransform: "uppercase" as const, letterSpacing: "0.08em", flexShrink: 0, paddingTop: 1 }}>
        {label}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={e => onChange((e.target as HTMLDivElement).textContent || "")}
        style={{
          flex: 1, fontSize: indent ? 12 : 13,
          color: indent ? "var(--fg-3)" : "var(--fg)",
          lineHeight: 1.5, fontWeight: indent ? 400 : 500,
          paddingLeft: indent ? 24 : 0,
          outline: "none", cursor: "text", borderRadius: 3, padding: "1px 4px",
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--bg-2)"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}
        onFocus={e => { (e.target as HTMLElement).style.background = "var(--bg-2)"; }}
        onBlur={e => { (e.target as HTMLElement).style.background = "transparent"; }}
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
}: {
  draft: string; generating: boolean; generatingLabel: string;
  onDraftChange: (v: string) => void; onAdvance: () => void;
  onRevise: (instructions: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleRevise = () => {
    if (!input.trim() || generating) return;
    onRevise(input.trim());
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {generating ? (
          <div style={{ maxWidth: 580 }}>
            <LoadingDots label={generatingLabel} />
          </div>
        ) : (
          <div style={{ maxWidth: 580 }}>
            {draft ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => onDraftChange((e.target as HTMLDivElement).innerText)}
                style={{
                  fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75,
                  outline: "none", whiteSpace: "pre-wrap" as const,
                  fontFamily: FONT,
                }}
              >
                {draft}
              </div>
            ) : (
              <div style={{ color: "var(--fg-3)", fontSize: 13 }}>No draft yet.</div>
            )}
          </div>
        )}
      </div>

      {!generating && draft && <AdvanceButton label="Move to Review →" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRevise(); } }}
          placeholder="Tell Watson what to change — or edit above..."
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

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: REVIEW
// ─────────────────────────────────────────────────────────────────────────────

function StageReview({
  draft, pipelineRun, running, activeTab, tabs,
  onTabClick, onAdvance, onGoBack,
}: {
  draft: string; pipelineRun: PipelineRun | null; running: boolean;
  activeTab: string; tabs: string[]; onTabClick: (t: string) => void;
  onAdvance: () => void; onGoBack: (instructions: string) => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Format tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "0 20px", flexShrink: 0, background: "var(--bg)", overflowX: "auto" }}>
        {tabs.map(tab => (
          <ReviewTabBtn key={tab} label={tab} active={activeTab === tab} reviewed={false} exported={false} onClick={() => onTabClick(tab)} />
        ))}
      </div>

      {/* Draft preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 580, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, whiteSpace: "pre-wrap" as const, fontFamily: FONT }}>
          {running ? <LoadingDots label="Running 7 checkpoints..." /> : draft || <span style={{ color: "var(--fg-3)" }}>No draft to review.</span>}
        </div>
      </div>

      {!running && pipelineRun && <AdvanceButton label="Move to Export →" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--bg)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Send back to Edit — tell Watson what to change..."
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

function StageExport({
  draft, title, formats, activeTab, onTabClick, exportedTabs, onExport, onCopy, outputId,
}: {
  draft: string; title: string; formats: string[];
  activeTab: string; onTabClick: (t: string) => void;
  exportedTabs: Record<string, boolean>; onExport: (format: string) => void;
  onCopy: () => void; outputId: string | null;
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
          whiteSpace: "pre-wrap" as const, fontFamily: FONT,
        }}>
          {draft || "No content yet."}
        </div>
      </div>
    </div>
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

  // ── Stage state ──────────────────────────────────────────────
  const [stage, setStage] = useState<WorkStage>("Intake");

  // ── Intake ───────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "watson", content: "What's on your mind?" },
  ]);
  const [intakeSending, setIntakeSending] = useState(false);
  const [intakeReady, setIntakeReady] = useState(false);
  const [readySummary, setReadySummary] = useState("");

  // ── Formats + templates ───────────────────────────────────────
  const [selectedFormats, setSelectedFormats] = useState<Format[]>(DEFAULT_FORMATS);
  const [selectedTemplate, setSelectedTemplate] = useState("Weekly Insight");
  const [sessionFiles] = useState<string[]>([]);

  const toggleFormat = (f: Format) => {
    setSelectedFormats(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);
  };

  // ── Outline ──────────────────────────────────────────────────
  const [outlineRows, setOutlineRows] = useState<OutlineRow[]>([]);
  const [buildingOutline, setBuildingOutline] = useState(false);

  // ── Edit ─────────────────────────────────────────────────────
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState("Writing draft...");

  // ── Review ───────────────────────────────────────────────────
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState(selectedFormats[0] ?? "LinkedIn");

  // ── Export ────────────────────────────────────────────────────
  const [exportedTabs, setExportedTabs] = useState<Record<string, boolean>>({});
  const [activeExportTab, setActiveExportTab] = useState(selectedFormats[0] ?? "LinkedIn");
  const [outputId, setOutputId] = useState<string | null>(null);
  const [allExported, setAllExported] = useState(false);

  // ── Stage navigation ──────────────────────────────────────────
  const goToStage = useCallback((s: WorkStage) => {
    setStage(s);
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
          outputType: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "freestyle",
          voiceDnaMd,
          userId: user?.id,
          systemMode: "CONTENT_PRODUCTION",
        }),
      }, { timeout: 60000 });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.reply ?? "";

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
  }, [messages, selectedFormats, voiceDnaMd, user?.id]);

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
      setDraft(data.content || draft);
    } catch (err: any) {
      toast("Revision failed. Your draft is unchanged.", "error");
      console.error("[WorkSession][revise]", err);
    } finally {
      setGenerating(false);
    }
  }, [draft, buildConvSummary, selectedFormats, user?.id, toast]);

  // ── EDIT → REVIEW: Run pipeline ──────────────────────────────
  const handleRunPipeline = useCallback(async () => {
    goToStage("Review");
    if (!draft || !user) return;
    setPipelineRunning(true);
    setPipelineRun(null);

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          outputType: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          voiceDnaMd,
          brandDnaMd,
          methodDnaMd,
          userId: user.id,
          outputId: outputId || undefined,
        }),
      }, { timeout: 180000 });

      if (!res.ok) throw new Error(`Pipeline error ${res.status}`);
      const result = await res.json();

      setPipelineRun({
        status: result.status,
        gateResults: result.gateResults || [],
        betterishScore: result.betterishScore || null,
        blockedAt: result.blockedAt,
        finalDraft: result.finalDraft,
      });

      // Use the pipeline's final draft if it differs
      if (result.finalDraft && result.finalDraft !== draft) {
        setDraft(result.finalDraft);
      }

      // Save to Supabase
      if (user) {
        const title = outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled";
        const score = result.betterishScore?.total ?? 0;
        const { data: savedOutput } = await supabase.from("outputs").insert({
          user_id: user.id,
          title: title.slice(0, 200),
          content: result.finalDraft || draft,
          output_type: FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          score,
          gates: result.gateResults || null,
          content_state: score >= 900 ? "vault" : "in_progress",
        }).select("id").single();

        if (savedOutput?.id) {
          setOutputId(savedOutput.id);
        }
      }

      toast(result.status === "PASSED" ? "All 7 checkpoints passed." : "Pipeline complete.");
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
    setTimeout(() => goToStage("Export"), 1200);
  }, [selectedFormats, goToStage]);

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
  const handleGoBackToEdit = useCallback((instructions: string) => {
    goToStage("Edit");
    handleRevise(instructions);
  }, [goToStage, handleRevise]);

  // ── Inject dashboard panel ────────────────────────────────────
  useLayoutEffect(() => {
    setDashOpen(true);

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
            />
          );
        case "Export":
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
  ]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden", fontFamily: FONT }}>
      {stage === "Intake" && (
        <StageIntake
          messages={messages}
          onSend={handleIntakeSend}
          sending={intakeSending}
          isReady={intakeReady}
          onAdvance={handleBuildOutline}
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
          onAdvance={() => goToStage("Export")}
          onGoBack={handleGoBackToEdit}
        />
      )}
      {stage === "Export" && (
        <StageExport
          draft={draft}
          title={outlineRows[0]?.content || "Draft"}
          formats={selectedFormats}
          activeTab={activeExportTab}
          onTabClick={(t) => setActiveExportTab(t as any)}
          exportedTabs={exportedTabs}
          onExport={handleExport}
          onCopy={handleCopy}
          outputId={outputId}
        />
      )}
    </div>
  );
}
