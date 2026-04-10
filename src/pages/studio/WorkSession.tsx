/**
 * WorkSession.tsx, v7.0 Quality Checkpoint Framework
 *
 * Flow:
 *   Intake  -> /api/chat (Reed conversation, READY_TO_GENERATE detection)
 *   Outline -> client-side state built from Reed's readiness summary
 *   Edit    -> /api/generate (draft generation + back-of-house auto-revision)
 *   Review  -> /api/run-pipeline (7 checkpoints + Impact Score + Human Voice Test)
 *   Review  includes export (save to Supabase outputs table + copy/download + send to Wrap)
 */

import {
  useState, useRef, useEffect, useLayoutEffect, useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import { useMobile } from "../../hooks/useMobile";
import { saveSession, loadSession, clearSession } from "../../lib/sessionPersistence";

import OutputTypePicker, { OUTPUT_TYPES, PROJECT_TYPE_IDS } from "../../components/studio/OutputTypePicker";
import "./shared.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "var(--font)";

type WorkStage = "Intake" | "Outline" | "Edit" | "Review";
const STAGES: WorkStage[] = ["Intake", "Outline", "Edit", "Review"];

type Format =
  | "LinkedIn" | "Newsletter" | "Podcast" | "Sunday Story"
  | "Article" | "Email" | "Thread" | "Video Script"
  | "Case Study" | "One-Pager" | "Presentation" | "Book Chapter";

const DEFAULT_FORMATS: Format[] = [];
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

const WORD_TARGETS: Record<string, number> = {
  essay: 2500, podcast: 1500, video_script: 800, email: 300,
  presentation: 1200, proposal: 1500, one_pager: 400, report: 2000,
  executive_summary: 500, case_study: 1200, sow: 1500,
  meeting: 600, bio: 400, white_paper: 3000, session_brief: 600,
  freestyle: 700,
};

const TEMPLATES = ["Essay", "LinkedIn Post", "Newsletter Issue", "Podcast Script", "Case Study", "One-Pager", "Email"];

/** Parse podcast script into structured sections from [OPEN], [HOOK], [BODY], [CLOSE] markers */
function parsePodcastSections(draft: string): { open: string; hook: string; body: string[]; close: string } {
  const sections: { open: string; hook: string; body: string[]; close: string } = {
    open: "", hook: "", body: [], close: "",
  };
  // Split on section markers
  const markerPattern = /\[(OPEN|HOOK|BODY|CLOSE|SEGMENT BREAK|PAUSE)\]/gi;
  let currentSection = "";
  let lastIndex = 0;
  let match;
  const chunks: Array<{ section: string; text: string }> = [];

  // Find all markers and collect text between them
  while ((match = markerPattern.exec(draft)) !== null) {
    if (currentSection && lastIndex < match.index) {
      const text = draft.slice(lastIndex, match.index).trim();
      if (text) chunks.push({ section: currentSection, text });
    }
    currentSection = match[1].toUpperCase();
    lastIndex = match.index + match[0].length;
  }
  // Remaining text after last marker
  if (currentSection && lastIndex < draft.length) {
    const text = draft.slice(lastIndex).trim();
    if (text) chunks.push({ section: currentSection, text });
  }

  // If no markers found, treat entire text as body
  if (chunks.length === 0) {
    const lines = draft.split("\n").filter(Boolean);
    return { open: lines[0] || "", hook: lines[1] || "", body: lines.slice(2), close: "" };
  }

  for (const chunk of chunks) {
    switch (chunk.section) {
      case "OPEN": sections.open = chunk.text; break;
      case "HOOK": sections.hook = chunk.text; break;
      case "CLOSE": sections.close = chunk.text; break;
      default: sections.body.push(chunk.text); break;
    }
  }
  return sections;
}

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

/** Render inline markdown (bold, italic, blockquote) as React elements */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle blockquote prefix
  const isBlockquote = text.startsWith("> ");
  const content = isBlockquote ? text.slice(2) : text;
  // Handle heading prefixes (strip #)
  const headingMatch = content.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const headText = headingMatch[2];
    const fontSize = level === 1 ? 18 : level === 2 ? 15 : 14;
    return <span style={{ fontWeight: 700, fontSize, color: "var(--fg)" }}>{headText}</span>;
  }
  // Split on **bold** and *italic* markers
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const rendered = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "var(--fg)" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
  if (isBlockquote) {
    return <span style={{ borderLeft: "3px solid var(--gold-bright)", paddingLeft: 12, display: "block", fontStyle: "normal", color: "var(--fg-2)" }}>{rendered}</span>;
  }
  return <>{rendered}</>;
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
  role: "reed" | "user";
  content: string;
  isChallenge?: boolean;
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
      // Try resources table first (preferred, structured DNA)
      const { data } = await supabase
        .from("resources")
        .select("resource_type, content")
        .eq("user_id", userId);

      if (data && data.length > 0) {
        const voice = data.filter(r => r.resource_type === "voice_dna").map(r => r.content || "").join("\n").trim();
        const brand = data.filter(r => r.resource_type === "brand_dna").map(r => r.content || "").join("\n").trim();
        const method = data.filter(r => r.resource_type === "method_dna").map(r => r.content || "").join("\n").trim();
        if (voice) setVoiceDnaMd(voice);
        if (brand) setBrandDnaMd(brand);
        if (method) setMethodDnaMd(method);
        if (voice || brand) return;
      }

      // Fallback: load from profiles table (onboarding data)
      const { data: profile } = await supabase
        .from("profiles")
        .select("voice_dna_md, brand_dna_md, voice_profile")
        .eq("id", userId)
        .single();

      if (profile) {
        if (profile.voice_dna_md) setVoiceDnaMd(profile.voice_dna_md);
        if (profile.brand_dna_md) setBrandDnaMd(profile.brand_dna_md);
        if (!profile.voice_dna_md && profile.voice_profile) {
          const vp = profile.voice_profile as Record<string, any>;
          const vpMd = Object.entries(vp)
            .filter(([, v]) => v && typeof v === "string")
            .map(([k, v]) => `**${k}**: ${v}`)
            .join("\n");
          if (vpMd) setVoiceDnaMd(vpMd);
        }
      }
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
        border: active ? "1px solid rgba(245,198,66,0.25)" : "1px solid var(--glass-border)",
        background: active ? "rgba(245,198,66,0.1)" : "var(--glass-card)",
        color: active ? "var(--gold)" : "var(--fg-3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.12s", fontFamily: FONT,
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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
      borderTop: "1px solid var(--glass-border)", padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 4,
      flexShrink: 0, background: "var(--glass-topbar)",
      backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !disabled) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder}
          readOnly={disabled}
          style={{
            flex: 1, background: "var(--glass-input)", border: "1px solid var(--glass-border)",
            borderRadius: 10, padding: "0 12px", fontSize: 13, color: "var(--fg)",
            fontFamily: FONT, outline: "none", height: 36, transition: "border-color 0.12s",
            opacity: disabled ? 0.5 : 1,
            backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.5)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--glass-border)"; }}
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
                    border: on ? "1px solid rgba(245,198,66,0.25)" : "1px solid var(--glass-border)",
                    background: on ? "rgba(245,198,66,0.1)" : "var(--glass-card)",
                    color: on ? "#9A7030" : "var(--fg-3)", fontWeight: on ? 600 : 400,
                    textAlign: "center" as const, transition: "all 0.1s",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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
                  border: selectedTemplate === t ? "1px solid rgba(74,144,217,0.2)" : "1px solid var(--glass-border)",
                  background: selectedTemplate === t ? "rgba(74,144,217,0.06)" : "var(--glass-card)",
                  color: selectedTemplate === t ? "var(--fg)" : "var(--fg-2)",
                  fontWeight: selectedTemplate === t ? 600 : 400, transition: "all 0.1s",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--glass-card)", border: "1px solid var(--glass-border)", borderRadius: 6, marginBottom: 4, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
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

// ── Per-format improve cards (Review sidebar) ────────────────
// ── Draft flag counting ──────────────────────────────────────
const PASSIVE_REGEX = /(was\s+\w+ed\b|were\s+\w+ed\b|has been\s+\w+ed\b|have been\s+\w+ed\b|had been\s+\w+ed\b|is being\s+\w+ed\b|are being\s+\w+ed\b|was being\s+\w+ed\b|never made it anywhere)/i;
const CLICHE_REGEX = /(lost opportunity|game.?changer|at the end of the day|touch base|move the needle|deep dive|circle back|low.?hanging fruit|synergy|leverage|paradigm shift|think outside|best practices|value.?add)/i;

function countDraftFlags(draft: string, dismissedFlags: Set<string>, fixedFlags: Map<string, string>): { must: number; style: number } {
  if (!draft) return { must: 0, style: 0 };
  let must = 0;
  let style = 0;
  const paragraphs = draft.split("\n").filter(Boolean).slice(1);

  paragraphs.forEach((para, i) => {
    const isSubhead = para.length < 60 && !para.endsWith(".");
    if (isSubhead) return;

    if (para.match(/(\d+%\s+of\s+\w+[^.]*)/) && !fixedFlags.has(`must-${i}`) && !dismissedFlags.has(`must-${i}`)) {
      must++;
    }
    if (para.match(PASSIVE_REGEX) && !fixedFlags.has(`style-${i}`) && !dismissedFlags.has(`style-${i}`)) {
      style++;
    }
    if (para.match(CLICHE_REGEX) && !fixedFlags.has(`cliche-${i}`) && !dismissedFlags.has(`cliche-${i}`)) {
      style++;
    }
  });

  return { must, style };
}

// ── Review helpers ────────────────────────────────────────────
function deriveReviewGateStatus(score: number): "Pass" | "Review" | "Fail" {
  if (score >= 70) return "Pass";
  if (score >= 50) return "Review";
  return "Fail";
}

function deriveReviewDisplayGates(
  checkpoints: CheckpointResult[],
  hvt: { verdict: string; score: number } | null,
): Array<{ name: string; status: "Pass" | "Review" | "Fail" }> {
  const find = (gate: string) => checkpoints.find(g => g.gate === gate);
  const slopGate = find("checkpoint-4");
  const voiceGate = find("checkpoint-2");
  const editGate = find("checkpoint-5");
  const engageGate = find("checkpoint-3");
  const dedup = find("checkpoint-0");

  // Humanization: whichever of editorial / engagement scored lower
  const humScore = Math.min(editGate?.score ?? 100, engageGate?.score ?? 100);

  return [
    { name: "SLOP Detection", status: deriveReviewGateStatus(slopGate?.score ?? 0) },
    { name: "Human Voice Test", status: hvt ? (hvt.verdict === "PASSES" ? "Pass" : deriveReviewGateStatus(hvt.score)) : deriveReviewGateStatus(voiceGate?.score ?? 0) },
    { name: "Humanization", status: deriveReviewGateStatus(humScore) },
    { name: "Deduplication", status: deriveReviewGateStatus(dedup?.score ?? 0) },
  ];
}

// ── Review dashboard ──────────────────────────────────────────
function ReviewDash({
  pipelineRun, running, onExportAll, allExported, onRaiseScore, fixingGate, rerunning,
}: {
  pipelineRun: PipelineRun | null; running: boolean;
  onExportAll: () => void; allExported: boolean;
  onRaiseScore: () => void;
  fixingGate: string | null;
  rerunning: boolean;
  prefillReed: (text: string) => void;
}) {
  const score = pipelineRun?.impactScore?.total ?? null;
  const scoreOk = score !== null && score >= 75;

  const displayGates = pipelineRun
    ? deriveReviewDisplayGates(pipelineRun.checkpointResults, pipelineRun.humanVoiceTest)
    : [];
  const nonPassGates = displayGates.filter(g => g.status !== "Pass");
  const allPass = nonPassGates.length === 0;

  // Reed's natural language assessment
  const reedMessage = (() => {
    if (!pipelineRun) return "";
    if (allPass && scoreOk) return "This is ready to publish. The writing is clean and the voice matches.";

    const issueDescriptions = nonPassGates.map(g => {
      const name = (g.name || "").toLowerCase();
      if (name.includes("dedup")) return "some repeated ideas";
      if (name.includes("research") || name.includes("validation")) return "an unverified claim";
      if (name.includes("voice")) return "a few lines that drift from your voice";
      if (name.includes("engagement") || name.includes("hook")) return "the opening could hit harder";
      if (name.includes("slop")) return "some AI-sounding language";
      if (name.includes("editorial")) return "a section that needs tightening";
      if (name.includes("perspective") || name.includes("risk")) return "a perspective gap";
      if (name.includes("human voice")) return "a few lines that read as generated";
      return g.name.toLowerCase();
    });

    if (issueDescriptions.length === 1) {
      return `Almost there. Reed found ${issueDescriptions[0]}. One fix and this is ready.`;
    }
    if (issueDescriptions.length <= 3) {
      return `A few things to address: ${issueDescriptions.join(", ")}. Let Reed handle it, or go back and edit.`;
    }
    return `${issueDescriptions.length} items need work. Let Reed fix them automatically for the fastest path to publish.`;
  })();

  return (
    <>
      {/* Running state */}
      {running && (
        <DpSection>
          <DpLabel>Reed is reviewing your draft...</DpLabel>
          <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "var(--glass-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "var(--gold-bright)", width: "60%", animation: "pulse-width 2s ease-in-out infinite" }} />
          </div>
        </DpSection>
      )}

      {/* Fixing/rerunning state */}
      {(fixingGate || rerunning) && !running && (
        <div style={{ fontSize: 11, color: "var(--gold-bright)", marginBottom: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ animation: "pulse-dot 1.5s infinite" }}>&#9679;</span>
          Reed is improving the draft...
        </div>
      )}

      {/* Results */}
      {pipelineRun && !running && (
        <>
          {/* Impact Score: single prominent number */}
          {score !== null && (
            <DpSection>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: scoreOk ? "#22C55E" : "var(--fg)" }}>
                  {Math.round(score)}
                </span>
                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>/ 100</span>
              </div>
              <div style={{ fontSize: 11, color: scoreOk ? "#22C55E" : "var(--fg-3)", fontWeight: 500 }}>
                {scoreOk ? "Ready to publish" : "Threshold is 75"}
              </div>
            </DpSection>
          )}

          {/* Reed's assessment in plain language */}
          {reedMessage && (
            <div style={{
              border: "1px solid rgba(74,144,217,0.25)", borderRadius: 8,
              padding: "10px 12px", background: "rgba(74,144,217,0.04)",
              marginBottom: 12,
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4A90D9", marginBottom: 6 }}>Reed</div>
              <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>{reedMessage}</div>
            </div>
          )}

          {/* Primary action buttons */}
          {!scoreOk && (
            <button
              onClick={onRaiseScore}
              disabled={!!fixingGate || rerunning}
              style={{
                width: "100%", padding: 10, borderRadius: 6, marginBottom: 8,
                background: "var(--fg)", border: "none",
                fontSize: 11, fontWeight: 700, color: "var(--gold)",
                cursor: fixingGate || rerunning ? "not-allowed" : "pointer",
                fontFamily: FONT, opacity: fixingGate || rerunning ? 0.5 : 1,
              }}
            >
              Let Reed fix it
            </button>
          )}

          {!scoreOk && (
            <button
              onClick={() => {
                (window as any).__ewSetWorkStage?.("Edit");
              }}
              style={{
                width: "100%", padding: 10, borderRadius: 6, marginBottom: 8,
                background: "var(--glass-card)", border: "1px solid var(--glass-border)",
                fontSize: 11, fontWeight: 600, color: "var(--fg-2)",
                cursor: "pointer", fontFamily: FONT,
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              }}
            >
              Go back to Edit
            </button>
          )}

          <button
            onClick={onExportAll}
            disabled={allExported}
            style={{
              width: "100%", padding: 10, borderRadius: 6,
              background: allExported ? "rgba(74,144,217,0.12)" : (scoreOk ? "var(--gold)" : "var(--surface)"),
              border: scoreOk ? "none" : "1px solid var(--glass-border)",
              fontSize: 12, fontWeight: 700,
              color: allExported ? "var(--blue)" : (scoreOk ? "var(--fg)" : "var(--fg)"),
              cursor: allExported ? "default" : "pointer",
              fontFamily: FONT, transition: "all 0.2s",
            }}
          >
            {allExported ? "Exported" : (scoreOk ? "Export all" : "Export anyway")}
          </button>
        </>
      )}
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

  const reedQuestionCount = messages.filter(m => m.role === "reed" && m.content.trim().endsWith("?")).length;
  const totalQuestions = 5;
  const progress = Math.min(reedQuestionCount / totalQuestions, 1);

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

  // Re-focus input after Reed finishes responding
  const prevSending = useRef(sending);
  useEffect(() => {
    if (prevSending.current && !sending) {
      setTimeout(() => {
        const textarea = document.querySelector('.reed-input') as HTMLTextAreaElement;
        if (textarea && !textarea.disabled) {
          textarea.focus();
        }
      }, 100);
    }
    prevSending.current = sending;
  }, [sending]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  // Welcome state: centered greeting + input, like Claude's empty chat
  if (!hasUserMessage && !sending) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", flex: 1, minHeight: 0, maxHeight: "100%", overflow: "hidden",
        background: "transparent", alignItems: "center", justifyContent: "center",
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
            {firstName ? `Hey ${firstName}, what are we writing?` : "What are we writing?"}
          </div>

          <div style={{
            fontSize: 13, color: "var(--fg-3)", marginBottom: 24,
            textAlign: "center" as const, lineHeight: 1.5,
          }}>
            Tell me what you are thinking about. I will ask a few questions, then build you an outline.
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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "transparent", minHeight: 0, maxHeight: "100%" }}>
      {/* Scrollable message area */}
      <div
        ref={scrollAreaRef}
        style={{
          flex: 1, minHeight: 0, overflowY: "auto",
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
          {messages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.content} userInitials={userInitials} isChallenge={m.isChallenge} />)}
          {sending && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingTop: 4 }}>
              <ReedAvatar />
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

      {/* Intake progress bar */}
      <div style={{
        padding: "8px 14px 0",
        background: "var(--glass-topbar)",
        borderTop: "1px solid var(--glass-border)",
        flexShrink: 0,
        backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
      }}>
        <div style={{ width: "100%", height: 4, background: "var(--glass-border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.round(progress * 100)}%`,
            background: "var(--gold-bright, #F5C642)", borderRadius: 2,
            transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 500, letterSpacing: "0.04em" }}>
            Question {Math.min(reedQuestionCount, totalQuestions)} of {totalQuestions}
          </span>
          <button
            onClick={onAdvance}
            style={{
              fontSize: 10, color: "var(--blue, #4A90D9)", background: "none",
              border: "none", cursor: "pointer", padding: 0, fontFamily: FONT,
              letterSpacing: "0.01em",
            }}
          >
            Just write it →
          </button>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px 24px", background: "transparent", flexShrink: 0, zIndex: 10 }}>
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

function ReedAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "linear-gradient(135deg, rgba(74,144,217,0.18) 0%, rgba(74,144,217,0.08) 100%)",
      border: "1px solid rgba(74,144,217,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color: "var(--blue)",
      flexShrink: 0, marginTop: 2, letterSpacing: "0.03em",
    }}>R</div>
  );
}

/** Parse Reed text: render **bold** as <strong>, strip raw **, detect questions vs statements, detect search indicators */
function ReedTextRenderer({ text }: { text: string }) {
  // Detect search/research lines
  const isSearchLine = (line: string) =>
    /^(searching|looking up|researching|checking|scanning|analyzing|pulling data)/i.test(line.trim());

  // Detect if a line ends with a question mark (Reed is asking the user)
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

        // If Reed is asking a question, render bold
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

function ChatBubble({ role, text, userInitials, isChallenge }: { role: "reed" | "user"; text: string; userInitials?: string; isChallenge?: boolean }) {
  const isReed = role === "reed";
  return (
    <div style={{
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      padding: "6px 0",
      justifyContent: isReed ? "flex-start" : "flex-end",
    }}>
      {isReed ? (
        <>
          <ReedAvatar />
          <div className="reed-bubble-wrap">
            {isChallenge && (
              <div style={{
                display: "inline-block",
                fontSize: 11, fontWeight: 500,
                color: "#fff", background: "var(--blue, #4A90D9)",
                borderRadius: 99, padding: "2px 10px",
                marginBottom: 6, fontFamily: FONT,
              }}>
                Reed is pushing back
              </div>
            )}
            <ReedTextRenderer text={text} />
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
      <div className="liquid-glass" style={{
        display: "flex", alignItems: "center", gap: 8,
        borderRadius: 16,
        padding: "10px 12px 10px 16px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onFocus={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 20px rgba(255,255,255,0.06)";
        }}
        onBlur={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { if (!disabled) onChange(e.target.value); }}
          onKeyDown={e => { if (!disabled) handleKey(e); }}
          placeholder={placeholder}
          readOnly={disabled}
          rows={1}
          className="reed-input"
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
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: value.trim() && !disabled ? "rgba(13,27,42,0.85)" : "rgba(0,0,0,0.08)",
            border: value.trim() && !disabled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
            cursor: value.trim() && !disabled ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s, border-color 0.15s",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <svg style={{ width: 13, height: 13, stroke: "#fff", strokeWidth: 2.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE: OUTLINE
// ─────────────────────────────────────────────────────────────────────────────

function StageOutline({
  outlineRows, onUpdateRow, onAdvance, building, angles, currentAngle, onSelectAngle,
}: {
  outlineRows: OutlineRow[]; onUpdateRow: (i: number, v: string) => void;
  onAdvance: () => void; building: boolean;
  angles?: { a: OutlineRow[]; b: OutlineRow[]; aMeta?: { name: string; description: string }; bMeta?: { name: string; description: string } } | null;
  currentAngle?: "a" | "b";
  onSelectAngle?: (angle: "a" | "b") => void;
}) {
  const [input, setInput] = useState("");
  const activeAngle = currentAngle || "a";

  const lensA = {
    title: angles?.aMeta?.name || (angles?.a.find(r => r.label === "Title")?.content) || outlineRows.find(r => r.label === "Title")?.content || "Angle A",
    desc: angles?.aMeta?.description || "Thesis-led structure. Strong opening statement, analytical flow.",
  };
  const lensB = {
    title: angles?.bMeta?.name || (angles?.b.find(r => r.label === "Title")?.content) || "Alternative angle",
    desc: angles?.bMeta?.description || "Hook-led structure. Emotional opening, narrative build, reflective close.",
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
                className={`lens-card${activeAngle === "a" ? " selected" : ""}`}
                onClick={() => onSelectAngle?.("a")}
              >
                <div className="lens-title-row">
                  <div className="lens-title">{lensA.title}</div>
                  <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={e => e.stopPropagation()} title="More like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: activeAngle === "a" ? "var(--blue)" : "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </button>
                    <button onClick={e => e.stopPropagation()} title="Less like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </button>
                  </div>
                </div>
                <div className="lens-desc">{lensA.desc}</div>
                {activeAngle === "a" && <div className="lens-selected-badge">SELECTED &#10003;</div>}
              </div>
              <div
                className={`lens-card${activeAngle === "b" ? " selected" : ""}`}
                onClick={() => onSelectAngle?.("b")}
              >
                <div className="lens-title-row">
                  <div className="lens-title">{lensB.title}</div>
                  <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={e => e.stopPropagation()} title="More like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: activeAngle === "b" ? "var(--blue)" : "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </button>
                    <button onClick={e => e.stopPropagation()} title="Less like this" style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--line-2)" }}>
                      <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </button>
                  </div>
                </div>
                <div className="lens-desc">{lensB.desc}</div>
                {activeAngle === "b" && <div className="lens-selected-badge">SELECTED &#10003;</div>}
              </div>
            </div>

            {/* Outline structure with brainstorm icons */}
            <div style={{ background: "var(--glass-card)", border: "1px solid var(--glass-border)", borderRadius: 8, padding: 14, minHeight: 200, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
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

      <div style={{ borderTop: "1px solid var(--glass-border)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--glass-topbar)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask Reed to restructure, or click any line to edit..."
          style={{ flex: 1, background: "var(--glass-input)", border: "1px solid var(--glass-border)", borderRadius: 10, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36, backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)" }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--glass-border)"; }}
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

  const handleRevise = () => {
    if (!input.trim() || generating) return;
    onRevise(input.trim());
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div className="edit-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {/* Version tabs */}
        {versions.length > 0 && !generating && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 16, paddingBottom: 12,
            borderBottom: "1px solid var(--glass-border)",
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
                  border: activeVersionIdx === i ? "1px solid var(--glass-border)" : "1px solid transparent",
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
                  border: "1px dashed var(--glass-border)",
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                  opacity: generating ? 0.5 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!generating) { e.currentTarget.style.borderColor = "var(--gold-bright)"; e.currentTarget.style.color = "var(--fg)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--fg-3)"; }}
              >
                + New version
              </button>
            )}
          </div>
        )}
        {generating ? (
          <GenerationProgress />
        ) : (
          <div className="draft-body" style={{ position: "relative" }}>
            {(() => {
              const lines = draft.split("\n");
              const rawTitle = lines[0] || "";
              const title = rawTitle.replace(/^\*+|\*+$/g, "").replace(/^#+\s*/, "").trim();
              const body = lines.slice(1).join("\n");
              return (
                <>
                  <input
                    value={title}
                    onChange={(e) => onDraftChange(e.target.value + "\n" + body)}
                    style={{
                      width: "100%",
                      fontFamily: "var(--font)",
                      fontSize: "clamp(22px, 3vw, 32px)",
                      fontWeight: 700,
                      color: "var(--fg)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: 0,
                      marginBottom: 16,
                      lineHeight: 1.2,
                    }}
                  />
                  <textarea
                    value={body}
                    onChange={(e) => onDraftChange(title + "\n" + e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 400,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "var(--font)",
                      fontSize: 15,
                      lineHeight: 1.75,
                      color: "var(--fg)",
                      padding: 0,
                    }}
                    spellCheck
                  />
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Word count bar visible in edit area */}
      {!generating && draft && (
        <div style={{
          padding: "6px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid var(--glass-border)", background: "var(--glass-topbar)", flexShrink: 0,
          backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
          fontSize: 11, color: "var(--fg-3)",
        }}>
          <span>{draft.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      )}

      {!generating && draft && <AdvanceButton label="Finish and Review &#8594;" onClick={onAdvance} />}

      <div style={{ borderTop: "1px solid var(--glass-border)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--glass-topbar)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRevise(); } }}
          placeholder="Tell Reed what to change, or edit above..."
          readOnly={generating}
          style={{ flex: 1, background: "var(--glass-input)", border: "1px solid var(--glass-border)", borderRadius: 10, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36, opacity: generating ? 0.5 : 1, backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)" }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--glass-border)"; }}
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
      <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--glass-border)", overflow: "hidden", marginBottom: 20 }}>
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
                border: isDone ? "none" : isActive ? "2px solid var(--gold-bright)" : "1px solid var(--glass-border)",
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
  const formatStatuses = selectedFormats.map(f => ({
    name: f,
    status: formatDrafts[f]?.status || "pending",
  }));
  const allFormatsComplete = formatStatuses.every(f => f.status === "done" || f.status === "error");

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
                border: "1px solid var(--glass-border)",
                background: f.status === "done" ? "rgba(74,144,217,0.06)" : "var(--glass-card)",
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

      {/* Quality Pipeline - simplified */}
      <div style={{ padding: "0", textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid var(--glass-border)",
          borderTopColor: "var(--gold-bright)",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px",
        }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
          Reed is reviewing your draft
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
          Checking voice, clarity, and originality
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Format-aware review preview ──────────────────────────────────────────────
function ReviewFormatPreview({
  format, draft, hvtFlaggedLines, onApplySuggestion, onDirectReplace, highlightedParas,
}: {
  format: string;
  draft: string;
  hvtFlaggedLines: Array<{ lineIndex: number; original: string; issue: string; vector: string; suggestion: string }>;
  onApplySuggestion?: (instruction: string) => void;
  onDirectReplace?: (original: string, replacement: string) => void;
  highlightedParas?: number[];
}) {
  const paragraphs = draft.split("\n").filter(Boolean);
  const title = cleanTitle(paragraphs[0] || "Draft");
  const body = paragraphs.slice(1);
  const [hoveredFlag, setHoveredFlag] = useState<number | null>(null);

  const renderPara = (p: string, i: number) => {
    const flagged = hvtFlaggedLines.find(f => p.includes(f.original) || f.original.includes(p.slice(0, 40)));
    const isHighlighted = highlightedParas?.includes(i + 1);

    // If no flag, render normally
    if (!flagged) {
      return (
        <div key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
          <p className={isHighlighted ? "para-highlight" : undefined}>
            {renderInlineMarkdown(p)}
          </p>
        </div>
      );
    }

    // Render flagged paragraphs as normal text (no visual flags)
    return (
      <div key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
        <p className={isHighlighted ? "para-highlight" : undefined}>
          {renderInlineMarkdown(p)}
        </p>
      </div>
    );
  };

  if (format === "Podcast" || format === "Podcast Script") {
    const podcast = parsePodcastSections(draft);
    return (
      <div className="draft-body">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 16 }}>Podcast Script Preview</div>
        {podcast.open && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 48, flexShrink: 0, paddingTop: 3 }}>OPEN</span>
            <div style={{ flex: 1 }}><p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>{renderInlineMarkdown(podcast.open)}</p></div>
          </div>
        )}
        {podcast.hook && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--gold-bright)", width: 48, flexShrink: 0, paddingTop: 3 }}>HOOK</span>
            <div style={{ flex: 1 }}><p style={{ fontSize: 14, color: "var(--fg)", fontWeight: 600, lineHeight: 1.7 }}>{renderInlineMarkdown(podcast.hook)}</p></div>
          </div>
        )}
        {podcast.body.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 48, flexShrink: 0, paddingTop: 3 }}>BODY</span>
            <div style={{ flex: 1 }}>{renderPara(p, i)}</div>
          </div>
        ))}
        {podcast.close && (
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--fg-3)", width: 48, flexShrink: 0, paddingTop: 3 }}>CLOSE</span>
            <div style={{ flex: 1 }}><p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>{renderInlineMarkdown(podcast.close)}</p></div>
          </div>
        )}
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
  onTabClick, onAdvance, onGoBack, onFix, onDirectReplace, formatDrafts,
}: {
  draft: string; pipelineRun: PipelineRun | null; running: boolean;
  activeTab: string; tabs: string[]; onTabClick: (t: string) => void;
  onAdvance: () => void; onGoBack: (instructions: string) => void;
  onFix: (instruction: string) => Promise<void>;
  onDirectReplace: (original: string, replacement: string) => void;
  formatDrafts: Record<string, { content: string; metadata: Record<string, string>; status: string }>;
}) {
  // Approve gate: both Impact Score >= 60 and HVT must PASS
  const scoreOk = (pipelineRun?.impactScore?.total ?? 0) >= 75;
  const hvtPasses = pipelineRun?.humanVoiceTest?.verdict === "PASSES";
  const canApprove = scoreOk && hvtPasses;
  const hvtFlaggedLines = pipelineRun?.humanVoiceTest?.flaggedLines || [];
  const [input, setInput] = useState("");
  const [reviewedTabs, setReviewedTabs] = useState<Set<string>>(new Set());
  const [hvtFixing, setHvtFixing] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* HVT suggestion fixing indicator */}
      {hvtFixing && (
        <div style={{
          padding: "8px 20px", background: "rgba(245,198,66,0.08)",
          borderBottom: "1px solid rgba(245,198,66,0.2)",
          fontSize: 11, color: "var(--gold-bright)", fontWeight: 500, flexShrink: 0,
        }}>
          Applying suggestion...
        </div>
      )}
      {/* Format tabs with status dots */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--glass-border)", padding: "0 20px", flexShrink: 0, background: "var(--glass-topbar)", overflowX: "auto", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`rev-tab${activeTab === tab ? " on" : ""}${reviewedTabs.has(tab) ? " reviewed" : ""}`}
            onClick={() => onTabClick(tab)}
          >
            {tab}<span className="tab-dot" />
          </button>
        ))}
      </div>

      {/* Draft preview */}
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
                    <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--glass-border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: "var(--gold-bright)", width: "60%", animation: "pulse-width 2s ease-in-out infinite" }} />
                    </div>
                  </div>
                );
              }

              return (
                <>
                  {metadata.subject && (
                    <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--glass-card)", borderRadius: 8, border: "1px solid var(--glass-border)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
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
                    <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--glass-card)", borderRadius: 8, border: "1px solid var(--glass-border)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
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
                      setHvtFixing(true);
                      try { await onFix(suggestion); } finally { setHvtFixing(false); }
                    }}
                    onDirectReplace={onDirectReplace}
                  />
                  {fd?.status === "error" && (
                    <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 8 }}>Format adaptation unavailable. Showing original draft.</div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      {!running && pipelineRun && (
        <div style={{ padding: "12px 28px 0", fontSize: 11, color: "var(--fg-3)" }}>
          {canApprove ? "Ready to export." : "Reed will tell you what needs attention."}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--glass-border)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: "var(--glass-topbar)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Send back to Edit, tell Reed what to change..."
          style={{ flex: 1, background: "var(--glass-input)", border: "1px solid var(--glass-border)", borderRadius: 10, padding: "0 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none", height: 36, backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)" }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--glass-border)"; }}
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

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CHIPS
// ─────────────────────────────────────────────────────────────────────────────

function ActionChips({ chips, onChipClick }: { chips: string[]; onChipClick: (text: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
      {chips.map(chip => (
        <div
          key={chip}
          onClick={() => onChipClick(chip)}
          style={{
            fontSize: 10, color: "var(--blue, #4A90D9)",
            padding: "4px 10px", borderRadius: 99,
            border: "1px solid rgba(74,144,217,0.3)",
            background: "rgba(74,144,217,0.04)",
            cursor: "pointer", transition: "all 0.12s",
            fontFamily: FONT,
          }}
        >
          {chip}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkSession() {
  const { setFeedbackContent, setDashOpen, setActiveDashTab, setReedPrefill, setReedThread } = useShell();
  const prefillReed = useCallback((text: string) => {
    setActiveDashTab("reed");
    setReedPrefill(text);
  }, [setActiveDashTab, setReedPrefill]);
  const { user, displayName } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
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
        role: m.role === "assistant" ? "reed" as const : "user" as const,
        content: m.content,
      }));
    }
    return [{ role: "reed", content: "Good to see you. What are you working on?" }];
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
  const [outlineAngles, setOutlineAngles] = useState<{ a: OutlineRow[]; b: OutlineRow[]; aMeta?: { name: string; description: string }; bMeta?: { name: string; description: string } } | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<"a" | "b">("a");
  const [buildingOutline, setBuildingOutline] = useState(false);

  // ── Edit ─────────────────────────────────────────────────────
  const [draft, setDraft] = useState(persisted?.generatedContent || "");
  const [draftVersions, setDraftVersions] = useState<Array<{ content: string; label: string }>>([]);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState("Writing draft...");
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
  const [fixedFlags, setFixedFlags] = useState<Map<string, string>>(new Map());

  // ── Review ───────────────────────────────────────────────────
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [formatDrafts, setFormatDrafts] = useState<Record<string, { content: string; metadata: Record<string, string>; status: "pending" | "generating" | "done" | "error" }>>({});
  const [fixingGate, setFixingGate] = useState<string | null>(null);
  const [rerunningPipeline, setRerunningPipeline] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState(selectedFormats[0] ?? "LinkedIn");
  const [hvtAttempts, setHvtAttempts] = useState(0);
  const [hvtRunning, setHvtRunning] = useState(false);

  // ── Background pipeline (Redesign 2: run quality check during generation) ──
  const [backgroundPipelineRun, setBackgroundPipelineRun] = useState<PipelineRun | null>(null);
  const [backgroundPipelineRunning, setBackgroundPipelineRunning] = useState(false);
  const [draftChangedSinceBackground, setDraftChangedSinceBackground] = useState(false);
  const backgroundDraftRef = useRef<string>("");

  // ── Export ────────────────────────────────────────────────────
  const [exportedTabs, setExportedTabs] = useState<Record<string, boolean>>({});
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
        role: m.role === "reed" ? "assistant" : "user",
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
  // We seed Reed with the context so the user lands in a live conversation.
  useEffect(() => {
    const signalText = sessionStorage.getItem("ew-signal-text");
    const signalDetail = sessionStorage.getItem("ew-signal-detail");
    if (!signalText) return;

    sessionStorage.removeItem("ew-signal-text");
    sessionStorage.removeItem("ew-signal-detail");

    const detail = signalDetail ? ` ${signalDetail}` : "";
    setMessages([
      { role: "reed", content: "Good to see you. What are you working on?" },
      { role: "user", content: `I want to write about this: ${signalText}.${detail}` },
      { role: "reed", content: `Good signal. Let me shape this into something worth publishing.\n\nTell me more about what you want to say.` },
    ]);
    // Keep stage at Intake so Reed continues the conversation naturally
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
          { role: "reed", content: "What's on your mind?" },
          { role: "user", content: `I want to continue working on: ${reopenTitle}` },
          { role: "reed", content: `Picking up where we left off. I've loaded your draft. Jump to Edit to continue, or tell me what you'd like to change.` },
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
      .filter(m => m.role === "user" || m.role === "reed")
      .map(m => `${m.role === "reed" ? "Reed" : "User"}: ${m.content}`)
      .join("\n\n")
  , [messages]);

  // ── INTAKE: Send message to Reed ────────────────────────────
  const handleIntakeSend = useCallback(async (text: string) => {
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIntakeSending(true);

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === "reed" ? "assistant" : "user", content: m.content })),
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "freestyle",
          voiceDnaMd,
          userId: user?.id,
          userName: displayName || undefined,
          systemMode: "CONTENT_PRODUCTION",
        }),
      }, { timeout: 60000 });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      // Sanitize: strip em-dashes, en-dashes, replace with commas or colons
      const reply = (data.reply ?? "").replace(/\u2014/g, ",").replace(/\u2013/g, ",");

      setMessages(prev => [...prev, { role: "reed", content: reply, isChallenge: data.isChallenge }]);

      if (data.readyToGenerate) {
        setIntakeReady(true);
        setReadySummary(reply);
      } else if (!intakeReady) {
        // Client-side fallback: detect readiness from conversation state
        const userMsgs = newMessages.filter(m => m.role === "user");
        const latestUserMsg = text.toLowerCase();
        const intentSignals = [
          "produce", "write it", "go ahead", "let's go", "build it", "generate",
          "ready", "do it", "make it", "ship it", "just write", "start writing",
          "that's it", "that's all", "nothing else", "good to go", "sounds good",
          "yes", "yeah", "yep", "let's do this", "proceed",
        ];
        const userWantsToGenerate = intentSignals.some(signal => latestUserMsg.includes(signal));

        const reedLower = reply.toLowerCase();
        const reedSignalsReady =
          reedLower.includes("anything you want to add") ||
          reedLower.includes("ready to produce") ||
          reedLower.includes("ready to write") ||
          reedLower.includes("i have what i need") ||
          reedLower.includes("i have enough") ||
          reedLower.includes("let me produce") ||
          reedLower.includes("shall i produce") ||
          reedLower.includes("here is what i will produce") ||
          reedLower.includes("here's what i'll produce");

        if ((userWantsToGenerate && userMsgs.length >= 2) || reedSignalsReady || userMsgs.length >= 5) {
          setIntakeReady(true);
          setReadySummary(reply);
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "reed", content: "Something went wrong. Please try again." }]);
      console.error("[WorkSession][intake]", err);
    } finally {
      setIntakeSending(false);
    }
  }, [messages, selectedFormats, voiceDnaMd, user?.id, outputType]);

  // ── INTAKE → OUTLINE: Build outline from conversation ─────────
  const handleBuildOutline = useCallback(async () => {
    goToStage("Outline");
    setBuildingOutline(true);

    try {
      const ot = outputType || (selectedFormats.length > 0
        ? FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "freestyle"
        : "freestyle");

      const res = await fetchWithRetry(`${API_BASE}/api/outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id,
          outputType: ot,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Outline API returned ${res.status}`);
      }

      const data = await res.json();

      const mapRows = (rows: Array<{ label: string; content: string; indent?: boolean }>): OutlineRow[] =>
        rows.map(r => ({ label: r.label || "", content: r.content || "", ...(r.indent ? { indent: true } : {}) }));

      const angleA = mapRows(data.angleA.rows);
      const angleB = mapRows(data.angleB.rows);

      setOutlineAngles({
        a: angleA,
        b: angleB,
        aMeta: { name: data.angleA.name, description: data.angleA.description },
        bMeta: { name: data.angleB.name, description: data.angleB.description },
      });
      setSelectedAngle("a");
      setOutlineRows(angleA);
    } catch (err: any) {
      console.error("[handleBuildOutline]", err);
      toast?.("Outline generation failed. Using fallback.", "error");

      // Fallback: minimal outline from user's first message
      const userMsgs = messages.filter(m => m.role === "user").map(m => m.content);
      const firstMsg = userMsgs.find(m => m.length > 20) || userMsgs[0] || "Untitled piece";
      const fallbackTitle = firstMsg.length > 80 ? firstMsg.slice(0, 77) + "..." : firstMsg;

      const fallback: OutlineRow[] = [
        { label: "Title", content: fallbackTitle },
        { label: "Hook", content: "Opening that earns the read" },
        { label: "Body", content: "Core argument" },
        { label: "Stakes", content: "Why this matters now" },
        { label: "Close", content: "Landing" },
      ];
      setOutlineAngles({
        a: fallback,
        b: fallback,
        aMeta: { name: "Draft Outline", description: "Fallback outline. Edit freely." },
        bMeta: { name: "Draft Outline", description: "Fallback outline. Edit freely." },
      });
      setSelectedAngle("a");
      setOutlineRows(fallback);
    } finally {
      setBuildingOutline(false);
    }
  }, [messages, selectedFormats, goToStage, outputType, user?.id, toast]);

  // ── BACKGROUND: Silent quality check after draft generation (Redesign 2) ──
  const handleBackgroundQualityCheck = useCallback(async (generatedDraft: string) => {
    if (!user || !generatedDraft) return;
    setBackgroundPipelineRunning(true);
    setBackgroundPipelineRun(null);
    backgroundDraftRef.current = generatedDraft;

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: generatedDraft,
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          voiceDnaMd,
          brandDnaMd,
          methodDnaMd,
          userId: user.id,
        }),
      }, { timeout: 175000 });

      if (!res.ok) throw new Error(`Background pipeline error ${res.status}`);
      const result = await res.json();

      const bgResult: PipelineRun = {
        status: result.status,
        checkpointResults: result.checkpointResults || [],
        impactScore: result.impactScore || null,
        humanVoiceTest: result.humanVoiceTest || null,
        blockedAt: result.blockedAt,
        finalDraft: result.finalDraft,
      };

      // If gates fail and score < 75, auto-revise in the background
      const score = result.impactScore?.total ?? 0;
      const failingGates = (result.checkpointResults || []).filter((g: CheckpointResult) => g.status !== "PASS");

      if (score < 75 && failingGates.length > 0 && backgroundDraftRef.current === generatedDraft) {
        const issues = failingGates
          .map((g: CheckpointResult) => `[${displayGateName(g.gate)}]: ${g.feedback}`)
          .join("\n");

        try {
          const revRes = await fetchWithRetry(`${API_BASE}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationSummary: "",
              outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
              originalDraft: result.finalDraft || generatedDraft,
              revisionNotes: `Fix these quality checkpoint issues while preserving the voice and argument:\n\n${issues}`,
              userId: user.id,
              maxTokens: 4096,
            }),
          }, { timeout: 90000 });

          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData.content && revData.content !== generatedDraft) {
              if (!draftChangedSinceBackground && backgroundDraftRef.current === generatedDraft) {
                setDraft(revData.content);
                backgroundDraftRef.current = revData.content;
                setDismissedFlags(new Set());
                setFixedFlags(new Map());
                setDraftVersions(prev => {
                  const updated = [...prev];
                  if (updated[0]) updated[0] = { ...updated[0], content: revData.content };
                  return updated;
                });
              }

              const reRes = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  draft: revData.content,
                  outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
                  voiceDnaMd,
                  brandDnaMd,
                  methodDnaMd,
                  userId: user.id,
                }),
              }, { timeout: 175000 });

              if (reRes.ok) {
                const reResult = await reRes.json();
                setBackgroundPipelineRun({
                  status: reResult.status,
                  checkpointResults: reResult.checkpointResults || [],
                  impactScore: reResult.impactScore || null,
                  humanVoiceTest: reResult.humanVoiceTest || null,
                  blockedAt: reResult.blockedAt,
                  finalDraft: reResult.finalDraft || revData.content,
                });
                return;
              }
            }
          }
        } catch (revErr) {
          console.warn("[Background auto-revise] Failed, using initial results:", revErr);
        }
      }

      setBackgroundPipelineRun(bgResult);
    } catch (err) {
      console.warn("[Background pipeline] Failed:", err);
    } finally {
      setBackgroundPipelineRunning(false);
    }
  }, [user, outputType, selectedFormats, voiceDnaMd, brandDnaMd, methodDnaMd, draftChangedSinceBackground]);

  // Track when user edits draft after background check started
  const handleDraftChangeWithTracking = useCallback((newDraft: string) => {
    setDraft(newDraft);
    if (backgroundDraftRef.current && newDraft !== backgroundDraftRef.current) {
      setDraftChangedSinceBackground(true);
    }
  }, []);

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
      setDismissedFlags(new Set());
      setFixedFlags(new Map());
      setDraftVersions([{ content: data.content || "", label: "Version 1" }]);
      setActiveVersionIdx(0);
      setGeneratingLabel("Done.");
      setDraftChangedSinceBackground(false);

      // Run quality gates in background (Redesign 2)
      if (data.content) {
        handleBackgroundQualityCheck(data.content);
      }

      // Save draft to Supabase immediately (fire and forget, don't block UI)
      if (user && data.content) {
        const title = outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled";
        const outputTypeId = outputType || "freestyle";
        supabase.from("outputs").insert({
          user_id: user.id,
          title: title.slice(0, 200),
          content: data.content,
          output_type: outputTypeId,
          output_type_id: outputTypeId,
          content_state: "in_progress",
          score: 0,
        }).select("id").single().then(({ data: savedOutput, error }) => {
          if (error) console.error("[Draft save] Error:", error.message, error.details, error.hint);
          if (savedOutput?.id) setOutputId(savedOutput.id);
        });
      }
    } catch (err: any) {
      toast("Draft generation failed. Please try again.", "error");
      setDraft("Could not generate draft. Please go back to Outline and try again.");
      console.error("[WorkSession][generate]", err);
    } finally {
      setGenerating(false);
    }
  }, [buildConvSummary, outlineRows, selectedFormats, user?.id, toast, goToStage, handleBackgroundQualityCheck]);

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
      setDismissedFlags(new Set());
      setFixedFlags(new Map());
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
  }, [draft, buildConvSummary, selectedFormats, user?.id, activeVersionIdx, toast]);

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
    const formatsToAdapt = selectedFormats.length > 0 ? selectedFormats : ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"] as Format[];
    const initial: Record<string, { content: string; metadata: Record<string, string>; status: "pending" | "generating" | "done" | "error" }> = {};
    formatsToAdapt.forEach(f => { initial[f] = { content: "", metadata: {}, status: "pending" }; });
    setFormatDrafts(initial);

    const promises = formatsToAdapt.map(async (format) => {
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

    // Start format adaptation in parallel
    handleFormatAdaptation();

    // If background pipeline already completed and user has not edited the draft, use cached results
    if (backgroundPipelineRun && !draftChangedSinceBackground) {
      setPipelineRun(backgroundPipelineRun);
      setHvtAttempts(1);

      // Use the background pipeline's final draft if it differs
      if (backgroundPipelineRun.finalDraft && backgroundPipelineRun.finalDraft !== draft) {
        setDraft(backgroundPipelineRun.finalDraft);
      }

      // Save to Supabase
      const title = outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled";
      const score = backgroundPipelineRun.impactScore?.total ?? 0;
      const outputTypeId = outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay";
      const outputCategory = OUTPUT_TYPES.find(t => t.id === outputTypeId)?.category?.toLowerCase() || null;

      if (outputId) {
        await supabase.from("outputs").update({
          content: backgroundPipelineRun.finalDraft || draft,
          score: Math.round(score),
          gates: backgroundPipelineRun.checkpointResults || null,
          content_state: score >= 60 ? "vault" : "in_progress",
          output_category: outputCategory,
        }).eq("id", outputId);
      } else {
        const { data: savedOutput } = await supabase.from("outputs").insert({
          user_id: user.id,
          title: title.slice(0, 200),
          content: backgroundPipelineRun.finalDraft || draft,
          output_type: outputTypeId,
          output_type_id: outputTypeId,
          output_category: outputCategory,
          project_id: projectId || undefined,
          score: Math.round(score),
          gates: backgroundPipelineRun.checkpointResults || null,
          content_state: score >= 60 ? "vault" : "in_progress",
        }).select("id").single();
        if (savedOutput?.id) setOutputId(savedOutput.id);
      }
      return;
    }

    // If background pipeline is still running, wait briefly then fall through to full pipeline
    setPipelineRunning(true);
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

      // Save/update in Supabase
      if (user) {
        const title = outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled";
        const score = result.impactScore?.total ?? 0;
        const outputTypeId = outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay";
        const outputCategory = OUTPUT_TYPES.find(t => t.id === outputTypeId)?.category?.toLowerCase() || null;

        if (outputId) {
          // Update existing record with pipeline results
          await supabase.from("outputs").update({
            content: result.finalDraft || draft,
            score: Math.round(score),
            gates: result.checkpointResults || null,
            content_state: score >= 60 ? "vault" : "in_progress",
            output_category: outputCategory,
          }).eq("id", outputId);
        } else {
          // Create new record
          const { data: savedOutput } = await supabase.from("outputs").insert({
            user_id: user.id,
            title: title.slice(0, 200),
            content: result.finalDraft || draft,
            output_type: outputTypeId,
            output_type_id: outputTypeId,
            output_category: outputCategory,
            project_id: projectId || undefined,
            score: Math.round(score),
            gates: result.checkpointResults || null,
            content_state: score >= 60 ? "vault" : "in_progress",
          }).select("id").single();

          if (savedOutput?.id) {
            setOutputId(savedOutput.id);
          }
        }
      }

      // Pipeline complete - no toast, results show in Review stage silently
    } catch (err: any) {
      toast("Pipeline encountered an error. Try again.", "error");
      console.error("[WorkSession][pipeline]", err);
    } finally {
      setPipelineRunning(false);
    }
  }, [draft, user, voiceDnaMd, brandDnaMd, methodDnaMd, selectedFormats, outputId, outlineRows, messages, toast, goToStage, handleFormatAdaptation, outputType, projectId, backgroundPipelineRun, draftChangedSinceBackground]);

  // ── REVIEW: Export all ─────────────────────────────────────────
  const handleExportAll = useCallback(() => {
    // 1. Mark all formats as exported (immediate, synchronous)
    const formats: Format[] = selectedFormats.length > 0
      ? selectedFormats
      : ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"];
    const exported: Record<string, boolean> = {};
    formats.forEach(f => { exported[f] = true; });
    setExportedTabs(exported);
    setAllExported(true);

    // 2. Store the draft in sessionStorage so Wrap can read it even if Supabase fails
    try {
      sessionStorage.setItem("ew-wrap-draft", draft || "");
      sessionStorage.setItem("ew-wrap-title", outlineRows[0]?.content || messages.find(m => m.role === "user")?.content?.slice(0, 80) || "Untitled");
      sessionStorage.setItem("ew-wrap-output-type", outputType || "freestyle");
      if (outputId) {
        sessionStorage.setItem("ew-wrap-output-id", outputId);
      }
      const adaptedContent: Record<string, string> = {};
      formats.forEach(f => {
        if (formatDrafts[f]?.status === "done" && formatDrafts[f]?.content) {
          adaptedContent[f] = formatDrafts[f].content;
        }
      });
      if (Object.keys(adaptedContent).length > 0) {
        sessionStorage.setItem("ew-wrap-formats", JSON.stringify(adaptedContent));
      }
    } catch (e) {
      console.warn("[Export] sessionStorage write failed:", e);
    }

    // 3. Navigate to Wrap IMMEDIATELY (do not wait for anything)
    nav("/studio/wrap");

    // 4. Save to Supabase in the background (fire and forget)
    if (user && draft) {
      const saveToSupabase = async () => {
        try {
          if (outputId) {
            await supabase.from("outputs").update({
              content: draft,
              content_state: "vault",
            }).eq("id", outputId);
          } else {
            const title = outlineRows[0]?.content || "Untitled";
            const outputTypeId = outputType || "freestyle";
            await supabase.from("outputs").insert({
              user_id: user.id,
              title: title.slice(0, 200),
              content: draft,
              output_type: outputTypeId,
              output_type_id: outputTypeId,
              content_state: "vault",
              score: pipelineRun?.impactScore?.total ?? 0,
            });
          }
        } catch (e) {
          console.error("[Export] Supabase save failed:", e);
        }
      };
      saveToSupabase();
    }
  }, [selectedFormats, outputId, nav, draft, user, outlineRows, outputType, pipelineRun, messages, formatDrafts]);

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

  // ── REVIEW → EDIT: Send back ──────────────────────────────────
  // ── NEW SESSION: Reset everything ────────────────────────────
  const handleNewSession = useCallback(() => {
    clearSession();
    setMessages([{ role: "reed", content: "Good to see you. What are you working on?" }]);
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
    setBackgroundPipelineRun(null);
    setBackgroundPipelineRunning(false);
    setDraftChangedSinceBackground(false);
    backgroundDraftRef.current = "";
    setHvtAttempts(0);
    setHvtRunning(false);
    setAllExported(false);
    setExportedTabs({});
    setOutputId(null);
    setProjectId(null);
    setDraftVersions([]);
    setActiveVersionIdx(0);
    setFormatDrafts({});
    setOutlineAngles(null);
    setSelectedAngle("a");
  }, []);

  // ── New Session from top nav ─────────────────────────────────
  useEffect(() => {
    const flag = sessionStorage.getItem("ew-new-session");
    if (!flag) return;
    sessionStorage.removeItem("ew-new-session");
    handleNewSession();
  }, [handleNewSession]);

  const handleGoBackToEdit = useCallback((instructions: string) => {
    // Clear stale Review data
    setPipelineRun(null);
    setFormatDrafts({});
    setAllExported(false);
    setExportedTabs({});
    setFixingGate(null);
    setRerunningPipeline(false);
    setDismissedFlags(new Set());
    setFixedFlags(new Map());

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

        // Immediately update the displayed format draft so user sees the change
        setFormatDrafts(prev => ({
          ...prev,
          [activeReviewTab]: {
            content: data.content,
            metadata: prev[activeReviewTab]?.metadata || {},
            status: "done" as const,
          },
        }));
        toast("Draft updated.");

        // Re-adapt the current format with the new draft (improves formatting)
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
        } catch { /* Non-critical: format re-adaptation failed, raw draft already shown */ }
      } else {
        toast("No changes detected.");
      }
    } catch (err: any) {
      console.error("[handleReviewFix]", err);
      toast("Fix failed. Try again.", "error");
      throw err;
    }
  }, [draft, buildConvSummary, outputType, selectedFormats, user?.id, voiceDnaMd, brandDnaMd, activeReviewTab, toast]);

  // ── REVIEW: Instant text replacement (Grammarly-style accept) ──
  const handleDirectReplace = useCallback((original: string, replacement: string) => {
    if (!draft || !original || !replacement) return;

    // Strategy 1: Direct string replacement on the entire draft
    let newDraft = draft;

    if (draft.includes(original)) {
      newDraft = draft.replace(original, replacement);
    } else if (draft.includes(original.trim())) {
      newDraft = draft.replace(original.trim(), replacement);
    } else {
      // Fallback: find the closest matching line
      const lines = draft.split("\n");
      const newLines = lines.map(line => {
        if (line.trim() === original.trim() || (original.length > 20 && line.includes(original.slice(0, 30)))) {
          return replacement;
        }
        return line;
      });
      newDraft = newLines.join("\n");
    }

    if (newDraft !== draft) {
      setDraft(newDraft);

      setFormatDrafts(prev => ({
        ...prev,
        [activeReviewTab]: {
          content: newDraft,
          metadata: prev[activeReviewTab]?.metadata || {},
          status: "done" as const,
        },
      }));
      toast("Fix applied.");
    } else {
      toast("Could not apply fix. Try using Ask Reed instead.", "info");
    }
  }, [draft, activeReviewTab, toast]);

  // ── REVIEW: Fix a specific checkpoint gate ─────────────────────
  // ── REVIEW: Re-run pipeline (all 7 gates) ──
  const handleRerunPipeline = useCallback(async () => {
    if (!draft || !user) return;
    setRerunningPipeline(true);
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
        }),
      }, { timeout: 180000 });

      if (!res.ok) throw new Error(`Pipeline re-run error ${res.status}`);
      const result = await res.json();

      setPipelineRun(prev => {
        const newResults = (result.checkpointResults || []) as CheckpointResult[];
        return {
          status: result.status || prev?.status || "BLOCKED",
          checkpointResults: newResults.length > 0 ? newResults : (prev?.checkpointResults || []),
          impactScore: result.impactScore || prev?.impactScore || null,
          humanVoiceTest: result.humanVoiceTest || prev?.humanVoiceTest || null,
          blockedAt: result.blockedAt || null,
          finalDraft: result.finalDraft || prev?.finalDraft,
        } as PipelineRun;
      });

      toast("Re-scored.");
    } catch (err: any) {
      console.error("[handleRerunPipeline]", err);
      toast("Re-score failed.", "error");
    } finally {
      setRerunningPipeline(false);
    }
  }, [draft, user, outputType, selectedFormats, voiceDnaMd, brandDnaMd, methodDnaMd, toast]);

  // ── REVIEW: Raise impact score (fix all non-passing gates + re-run pipeline) ──
  const handleRaiseScore = useCallback(async () => {
    if (!draft || !user || !pipelineRun) return;
    setFixingGate("raise-score");

    try {
      // Collect feedback from all non-passing gates
      const issues = pipelineRun.checkpointResults
        .filter(g => g.status !== "PASS")
        .map(g => `[${displayGateName(g.gate)}]: ${g.feedback}`)
        .join("\n");

      if (!issues) {
        // All gates pass, just re-run pipeline for fresh scores
        await handleRerunPipeline();
        return;
      }

      // Revise the draft
      const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: buildConvSummary(),
          outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
          originalDraft: draft,
          revisionNotes: `Fix these quality checkpoint issues while preserving the voice and argument:\n\n${issues}`,
          userId: user.id,
          maxTokens: 4096,
        }),
      }, { timeout: 90000 });

      if (!res.ok) throw new Error(`Fix error ${res.status}`);
      const data = await res.json();
      const newDraft = data.content;

      if (!newDraft || newDraft.trim() === draft.trim()) {
        toast("No changes detected. Try a different approach.");
        return;
      }

      setDraft(newDraft);
      setFormatDrafts(prev => ({
        ...prev,
        [activeReviewTab]: {
          content: newDraft,
          metadata: prev[activeReviewTab]?.metadata || {},
          status: "done" as const,
        },
      }));

      setFixingGate(null);

      // Count changes
      const oldWords = draft.split(/\s+/).length;
      const newWords = newDraft.split(/\s+/).length;
      const oldParagraphs = draft.split("\n").filter(Boolean).length;
      const newParagraphs = newDraft.split("\n").filter(Boolean).length;

      const changes: string[] = [];
      if (Math.abs(newWords - oldWords) > 10) {
        changes.push(newWords > oldWords ? `added ${newWords - oldWords} words` : `cut ${oldWords - newWords} words`);
      }
      if (oldParagraphs !== newParagraphs) {
        changes.push(`${newParagraphs} paragraphs (was ${oldParagraphs})`);
      }

      const failingGateNames = pipelineRun.checkpointResults
        .filter(g => g.status !== "PASS")
        .map(g => displayGateName(g.gate).toLowerCase());

      toast(
        changes.length > 0
          ? `Reed revised the draft: ${changes.join(", ")}. Addressed: ${failingGateNames.join(", ")}. Re-scoring...`
          : `Reed revised the draft to address ${failingGateNames.join(", ")}. Re-scoring...`
      );

      // Only re-run the gates that failed, not all 7
      const failedGateNames = pipelineRun?.checkpointResults
        ?.filter(g => g.status === "FAIL" || g.status === "FLAG")
        ?.map(g => g.gate)
        ?.filter(Boolean) || [];

      if (failedGateNames.length > 0) {
        const reRes = await fetchWithRetry(`${API_BASE}/api/run-pipeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft: newDraft,
            outputType: outputType || FORMAT_TO_OUTPUT_TYPE[selectedFormats[0]] || "essay",
            voiceDnaMd,
            brandDnaMd,
            methodDnaMd,
            userId: user.id,
            gateSubset: failedGateNames,
          }),
        }, { timeout: 60000 });

        if (!reRes.ok) throw new Error(`Re-score error ${reRes.status}`);
        const reResult = await reRes.json();

        setPipelineRun(prev => {
          // Merge: keep passing gates from previous run, update failed gates with new results
          const prevResults = prev?.checkpointResults || [];
          const newResults = (reResult.checkpointResults || []) as CheckpointResult[];
          const merged = prevResults.map(pg => {
            const updated = newResults.find(ng => ng.gate === pg.gate);
            return updated || pg;
          });
          // Add any new results not in previous
          for (const nr of newResults) {
            if (!merged.find(m => m.gate === nr.gate)) {
              merged.push(nr);
            }
          }
          return {
            status: reResult.status || prev?.status || "BLOCKED",
            checkpointResults: merged,
            impactScore: reResult.impactScore || prev?.impactScore || null,
            humanVoiceTest: reResult.humanVoiceTest || prev?.humanVoiceTest || null,
            blockedAt: reResult.blockedAt || null,
            finalDraft: reResult.finalDraft || prev?.finalDraft,
          } as PipelineRun;
        });

        toast("Re-scored.");

        // Update Supabase if we have an output
        if (outputId) {
          const newScore = reResult.impactScore?.total ?? pipelineRun?.impactScore?.total ?? 0;
          await supabase.from("outputs").update({
            content: newDraft,
            score: Math.round(newScore),
          }).eq("id", outputId);
        }
      } else {
        await handleRerunPipeline();
      }
    } catch (err: any) {
      console.error("[handleRaiseScore]", err);
      toast("Fix failed. Try again.", "error");
    } finally {
      setFixingGate(null);
    }
  }, [draft, user, pipelineRun, buildConvSummary, outputType, selectedFormats, toast, activeReviewTab, handleRerunPipeline, voiceDnaMd, brandDnaMd, methodDnaMd, outputId]);

  // ── Inject dashboard panel ────────────────────────────────────
  useLayoutEffect(() => {
    // Keep the Reed panel open across all stages
    setDashOpen(true);

    const dashNode = (() => {
      switch (stage) {
        case "Intake":
          return null;
        case "Outline":
          return <OutlineDash selectedFormats={selectedFormats} />;
        case "Edit": {
          const wordCount = (draft || "").split(/\s+/).filter(Boolean).length;
          const targetWords = WORD_TARGETS[outputType || "freestyle"] || 700;
          const flagCounts = countDraftFlags(draft, dismissedFlags, fixedFlags);

          return (
            <>
              {generating && (
                <DpSection>
                  <DpLabel>Generating</DpLabel>
                  <div style={{ fontSize: 11, color: "var(--gold-bright)", lineHeight: 1.6, fontWeight: 500 }}>{generatingLabel}</div>
                </DpSection>
              )}

              {!generating && wordCount > 0 && (
                <>
                  {/* FLAGS */}
                  <DpSection>
                    <DpLabel>Flags</DpLabel>
                    {(flagCounts.must > 0 || flagCounts.style > 0) ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        {flagCounts.must > 0 && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
                            borderRadius: 4, background: "rgba(245,198,66,0.1)", border: "1px solid rgba(245,198,66,0.35)",
                            fontSize: 10, color: "#9A7030",
                          }}>{flagCounts.must} must fix</div>
                        )}
                        {flagCounts.style > 0 && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
                            borderRadius: 4, background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.2)",
                            fontSize: 10, color: "var(--blue, #4A90D9)",
                          }}>{flagCounts.style} style</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "var(--fg-3)" }}>No flags detected</div>
                    )}
                  </DpSection>

                  {/* WORD COUNT */}
                  <DpSection>
                    <DpLabel>Word Count</DpLabel>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: "var(--fg)" }}>{wordCount}</span>
                      <span style={{ color: "var(--gold)" }}>
                        {wordCount > targetWords ? `+${wordCount - targetWords}` : wordCount < targetWords ? `-${targetWords - wordCount}` : "on target"}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: "var(--fg-3)", marginBottom: 4 }}>optimum {targetWords}</div>
                    <div style={{ height: 5, background: "var(--glass-border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        width: `${Math.min(100, (wordCount / targetWords) * 100)}%`,
                        background: wordCount > targetWords * 1.2 ? "rgba(245,198,66,0.5)" : "var(--blue, #4A90D9)",
                      }} />
                    </div>
                  </DpSection>

                  {/* BACKGROUND PIPELINE STATUS */}
                  {backgroundPipelineRun && (
                    <DpSection>
                      <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>&#10003;</span>
                        <span>Reed has reviewed your draft.</span>
                      </div>
                    </DpSection>
                  )}
                  {backgroundPipelineRunning && (
                    <DpSection>
                      <div style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ animation: "pulse 1.5s infinite" }}>&#9679;</span>
                        <span>Reed is reviewing your draft...</span>
                      </div>
                    </DpSection>
                  )}
                </>
              )}

              {/* ACTION CHIPS */}
              <ActionChips
                chips={[
                  "Fix the flagged lines",
                  "Tighten the hook",
                  `Tighten to ${targetWords}`,
                  "Expand, add an example",
                  "Check the voice match",
                  "Cut 100 words without losing the point",
                ]}
                onChipClick={(chip) => {
                  if (chip.startsWith("Tighten to")) {
                    prefillReed(`Tighten this to ${targetWords}. Cut what doesn't earn its place. Keep the voice.`);
                  } else if (chip.startsWith("Expand")) {
                    prefillReed(`Expand this. Add a second example and deepen the stakes. Stay under ${Math.round(targetWords * 1.3)} words.`);
                  } else {
                    prefillReed(chip);
                  }
                }}
              />
            </>
          );
        }
        case "Review":
          return (
            <ReviewDash
              pipelineRun={pipelineRun}
              running={pipelineRunning}
              onExportAll={handleExportAll}
              allExported={allExported}
              onRaiseScore={handleRaiseScore}
              fixingGate={fixingGate}
              rerunning={rerunningPipeline}
              prefillReed={prefillReed}
            />
          );
        default:
          return null;
      }
    })();

    setFeedbackContent(dashNode);
    return () => setFeedbackContent(null);
  }, [
    stage, selectedFormats, selectedTemplate, draft, generating, generatingLabel,
    pipelineRun, pipelineRunning, allExported, outputId,
    hvtAttempts, handleRerunHVT, hvtRunning, outputType,
    handleRaiseScore, fixingGate, handleRerunPipeline, rerunningPipeline,
    prefillReed, activeReviewTab, handleReviewFix, handleExportAll,
    dismissedFlags, fixedFlags, backgroundPipelineRun, backgroundPipelineRunning,
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
      const prev = {
        overflow: main.style.overflow,
        padding: main.style.padding,
        overflowY: main.style.overflowY,
      };
      main.style.overflow = "hidden";
      main.style.overflowY = "hidden";
      main.style.padding = "0";
      return () => {
        main.style.overflow = prev.overflow;
        main.style.overflowY = prev.overflowY;
        main.style.padding = prev.padding;
      };
    }
  }, []);

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column",
      overflow: "hidden", fontFamily: FONT,
    }}>
      <div style={{
        padding: "6px 20px",
        fontSize: 10, fontWeight: 600,
        color: "var(--fg-3)",
        letterSpacing: "0.05em",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ textTransform: "uppercase" as const }}>Working on:</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 99,
          background: "rgba(245,198,66,0.12)",
          border: "1px solid rgba(245,198,66,0.3)",
          fontSize: 10, fontWeight: 600, color: "#9A7030",
        }}>
          ■ {outputType ? OUTPUT_TYPES.find(t => t.id === outputType)?.label || outputType : "Freestyle"}
        </span>
      </div>
      {stage === "Intake" && (
        <StageIntake
          messages={messages}
          onSend={handleIntakeSend}
          sending={intakeSending}
          isReady={intakeReady}
          onAdvance={handleBuildOutline}
          userInitials={displayName ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2) : "U"}
          firstName={displayName ? displayName.split(" ")[0] : undefined}
          onFileAttach={async (files) => {
            const fileArr = Array.from(files);
            const names = fileArr.map(f => f.name);
            setSessionFiles(prev => [...prev, ...names]);

            // Read file contents and send to Reed
            const TEXT_EXTS = [".txt", ".md", ".csv", ".json", ".html", ".xml", ".yml", ".yaml"];
            const contents: string[] = [];

            for (const file of fileArr) {
              const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
              try {
                if (TEXT_EXTS.includes(ext) || file.type.startsWith("text/")) {
                  const text = await file.text();
                  if (text.trim()) {
                    contents.push(`[File: ${file.name}]\n${text.slice(0, 12000)}`);
                  }
                } else if (ext === ".pdf") {
                  // Read PDF as text (basic extraction)
                  const text = await file.text();
                  // PDF binary contains some readable text fragments
                  const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
                  if (readable.length > 50) {
                    contents.push(`[File: ${file.name}]\n${readable.slice(0, 12000)}`);
                  } else {
                    contents.push(`[File: ${file.name}] (PDF attached, ${(file.size / 1024).toFixed(0)}KB)`);
                  }
                } else if (ext === ".doc" || ext === ".docx") {
                  contents.push(`[File: ${file.name}] (Document attached, ${(file.size / 1024).toFixed(0)}KB)`);
                } else {
                  contents.push(`[File: ${file.name}] (${file.type || "file"} attached, ${(file.size / 1024).toFixed(0)}KB)`);
                }
              } catch {
                contents.push(`[File: ${file.name}] (Could not read file)`);
              }
            }

            if (contents.length > 0) {
              const fileMsg = contents.join("\n\n");
              handleIntakeSend(`I've attached the following content for this session:\n\n${fileMsg}`);
            }
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
          angles={outlineAngles}
          currentAngle={selectedAngle}
          onSelectAngle={(angle) => {
            setSelectedAngle(angle);
            if (outlineAngles) {
              setOutlineRows(angle === "a" ? [...outlineAngles.a] : [...outlineAngles.b]);
            }
          }}
        />
      )}
      {stage === "Edit" && (
        <StageEdit
          draft={draft}
          generating={generating}
          generatingLabel={generatingLabel}
          onDraftChange={handleDraftChangeWithTracking}
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
          tabs={selectedFormats.length > 0 ? selectedFormats : ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"] as Format[]}
          onTabClick={(t) => setActiveReviewTab(t as any)}
          onAdvance={() => handleExportAll()}
          onGoBack={handleGoBackToEdit}
          onFix={handleReviewFix}
          onDirectReplace={handleDirectReplace}
          formatDrafts={formatDrafts}
        />
      )}
    </div>
  );
}
