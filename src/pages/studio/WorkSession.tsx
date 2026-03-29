/**
 * WorkSession.tsx
 * Full Work pipeline: Intake → Outline → Edit → Review → Export
 * Matches wireframe v7.23 exactly.
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import "./shared.css";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

interface ChatMessage {
  role: "watson" | "user";
  text: string;
}

interface OutlineRow {
  label: string;
  content: string;
  indent?: boolean;
}

interface EditFlag {
  id: string;
  type: "must" | "style";
  text: string;
  flagMsg: string;
  suggestion: string;
  replacement: string;
  dismissed: boolean;
  fixed: boolean;
}

interface ReviewTab {
  id: string;
  label: string;
  reviewed: boolean;
  exported: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const LENS_OPTIONS = [
  {
    id: "a",
    title: "The Infrastructure Reframe",
    desc: "Opens with the myth, pivots to structural diagnosis, closes with the system as solution. Strong for LinkedIn.",
    outline: [
      { label: "Title", content: "The thinking is in your head. It belongs in the world." },
      { label: "Hook", content: "The myth: you don't need more time or motivation." },
      { label: "Body", content: "The diagnosis: this is a structural problem." },
      { label: "", content: "Why willpower can't bridge the gap.", indent: true },
      { label: "", content: "What infrastructure actually looks like — concrete, not aspirational.", indent: true },
      { label: "Stakes", content: "The cost of not building it." },
      { label: "", content: "Every week without it, someone else says what you've been thinking.", indent: true },
      { label: "Close", content: "The thinking is in your head. It belongs in the world." },
    ] as OutlineRow[],
  },
  {
    id: "b",
    title: "The Articulation Gap",
    desc: "Leads with the emotional experience — ideas trapped, Sunday night feeling. Builds empathy before the reframe. Better for newsletter.",
    outline: [
      { label: "Title", content: "You've said it perfectly. It never made it out." },
      { label: "Hook", content: "Sunday night. Three ideas worth writing about. None of them made it out." },
      { label: "Body", content: "The gap has a name: the articulation problem." },
      { label: "", content: "It's not about having nothing to say.", indent: true },
      { label: "", content: "It's about the distance between the thought and the audience.", indent: true },
      { label: "Stakes", content: "What it costs to keep the thinking to yourself." },
      { label: "", content: "Someone else is saying what you've been thinking — and getting credit for it.", indent: true },
      { label: "Close", content: "The infrastructure exists. The gap can close." },
    ] as OutlineRow[],
  },
];

const REVIEW_CONTENT: Record<string, string[]> = {
  LinkedIn: [
    "The thinking is in your head. It belongs in the world.",
    "You said it perfectly in a meeting. That version never gets out.",
    "Most people think this is a motivation problem. The cause is structural.",
    "Discipline gets you to the blank page. It does not close the gap. That gap is an engineering problem.",
    "Every week without it, someone else says what you have been thinking.",
  ],
  Newsletter: [
    "The Articulation Gap",
    "John Gilmore Executive Edge — March 28",
    "I have been thinking about something I hear constantly from clients. Brilliant thinking that never makes it to an audience.",
    "You said it perfectly in a meeting. That version never gets out. This week I want to talk about why — and what to do about it.",
    "Discipline gets you to the blank page. Infrastructure gets you to your audience.",
  ],
  Podcast: [
    "Script — The Thinking Trap",
    "Podcast script — Adapted for audio",
    "Hey, welcome back. I want to start today with something I hear from almost every executive I work with.",
    "They have the ideas. Sometimes brilliant ones. And somehow those ideas never make it out of their head.",
    "It is a structural problem. And structure can be built.",
  ],
  "Sunday Story": [
    "The Mountain Between Knowing and Saying",
    "Sunday Story — March 28, 2026",
    "There is a thing that happens in rooms where smart people gather. Someone says something that shifts the whole conversation. And then the meeting ends. And that insight dissolves.",
    "Not because it was not valuable. Because there was no infrastructure to carry it forward.",
    "We call it the articulation gap. And it is not what most people think it is.",
  ],
};

const EXPORT_PREVIEWS: Record<string, React.ReactNode> = {
  LinkedIn: (
    <div>
      <p style={{ fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>The thinking is in your head. It belongs in the world.</p>
      <p style={{ color: "var(--fg-2)", lineHeight: 1.7 }}>You said it perfectly in a meeting. On a plane. Walking out of a conversation that changed the room. That version never gets out.</p>
      <p style={{ color: "var(--fg-2)", lineHeight: 1.7, marginTop: 10 }}>Most people think this is a motivation problem. It is not. It is structural.</p>
      <p style={{ color: "var(--fg-2)", lineHeight: 1.7, marginTop: 10 }}>The people who show up everywhere built the operation. Every week without it, someone else says what you have been thinking.</p>
      <p style={{ color: "var(--blue)", fontWeight: 600, marginTop: 14 }}>What does your infrastructure look like?</p>
    </div>
  ),
  Newsletter: (
    <div>
      <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>John Gilmore · Executive Edge · March 28</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", marginBottom: 12 }}>The Articulation Gap</div>
      <div style={{ width: 28, height: 3, background: "var(--gold-bright)", marginBottom: 16, borderRadius: 2 }} />
      <p style={{ color: "var(--fg-2)", lineHeight: 1.75 }}>I have been thinking about something I hear constantly from clients. Brilliant thinking that never makes it to an audience.</p>
      <div style={{ background: "var(--bg-2)", borderLeft: "3px solid var(--gold-bright)", padding: "10px 14px", borderRadius: "0 6px 6px 0", margin: "16px 0" }}>
        <p style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600, lineHeight: 1.6 }}>The gap is not a motivation problem. It is structural. And structure can be built.</p>
      </div>
    </div>
  ),
  Podcast: (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>Podcast Script</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 18 }}>The Thinking Trap</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "OPEN", color: "var(--fg-3)", text: "Hey, welcome back. I want to start today with something I hear from almost every executive I work with." },
          { label: "PAUSE", color: "var(--line-2)", text: "[beat]", italic: true },
          { label: "HOOK", color: "var(--gold)", text: "It is a structural problem. And structure can be built.", bold: true },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: s.color, width: 44, flexShrink: 0, paddingTop: 2 }}>{s.label}</span>
            <p style={{ fontSize: 13, color: s.bold ? "var(--fg)" : "var(--fg-2)", fontWeight: s.bold ? 600 : 400, fontStyle: s.italic ? "italic" : "normal", lineHeight: 1.7 }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  "Sunday Story": (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 20 }}>Sunday, March 28, 2026</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", lineHeight: 1.2, marginBottom: 8 }}>The Mountain Between Knowing and Saying</div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 20, fontStyle: "italic" }}>On the gap between having something to say and getting it into the world.</div>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.8 }}>There is a thing that happens in rooms where smart people gather. Someone says something that shifts the whole conversation. And then the meeting ends. And that insight dissolves.</p>
    </div>
  ),
};

const TEMPLATES = ["Thought Leadership", "Case Study Narrative", "Weekly Insight", "Contrarian Take", "Origin Story"];
const REVIEW_IMPROVEMENTS: Record<string, { pts: string; title: string; desc: string }[]> = {
  LinkedIn: [
    { pts: "+4 pts · LinkedIn", title: "Tighten the close", desc: "One sharper final sentence closes the gap between agreement and action." },
    { pts: "+2 pts · LinkedIn", title: "Add one concrete example", desc: "A single sharp image in the body moves readers from interest to action." },
  ],
  Newsletter: [
    { pts: "+5 pts · Newsletter", title: "Personalize the opening", desc: "Newsletter readers expect a direct address. One sentence that speaks to them specifically." },
  ],
  Podcast: [
    { pts: "+8 pts · Podcast", title: "Conversational transition", desc: "Two sentences read as written, not spoken. Watson can soften them for audio." },
  ],
  "Sunday Story": [
    { pts: "+2 pts · Sunday Story", title: "Deepen the opening image", desc: "One more sensory detail in the first paragraph pulls readers fully in." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PANEL COMPONENTS (injected into right panel per stage)
// ─────────────────────────────────────────────────────────────────────────────

function DpLabel({ children, collapsible, open, onToggle }: {
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      onClick={collapsible ? onToggle : undefined}
      style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase" as const, color: "var(--fg-3)",
        marginBottom: 6, display: "flex", justifyContent: "space-between",
        alignItems: "center", cursor: collapsible ? "pointer" : "default",
        userSelect: "none" as const,
      }}
    >
      <span>{children}</span>
      {collapsible && (
        <span style={{
          fontSize: 16, color: open ? "var(--fg)" : "var(--fg-3)",
          fontWeight: 600, lineHeight: 1,
          transform: open ? "rotate(90deg)" : "none",
          transition: "transform 0.15s", display: "inline-block",
        }}>›</span>
      )}
    </div>
  );
}

function DpSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ marginBottom: 14, ...style }}>{children}</div>;
}

// ── Intake dashboard ──────────────────────────────────────────
function IntakeDash({
  selectedFormats,
  onToggleFormat,
  selectedTemplate,
  onSelectTemplate,
}: {
  selectedFormats: Format[];
  onToggleFormat: (f: Format) => void;
  selectedTemplate: string;
  onSelectTemplate: (t: string) => void;
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
                  key={f}
                  onClick={() => onToggleFormat(f)}
                  style={{
                    fontSize: 10, padding: "4px 6px", borderRadius: 4,
                    border: on ? "1px solid var(--gold-bright)" : "1px solid var(--line)",
                    background: on ? "rgba(245,198,66,0.1)" : "var(--surface)",
                    color: on ? "#9A7030" : "var(--fg-3)",
                    fontWeight: on ? 600 : 400,
                    cursor: "pointer", textAlign: "center" as const,
                    transition: "all 0.1s",
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
        <DpLabel collapsible open={templatesOpen} onToggle={() => setTemplatesOpen(o => !o)}>
          Templates{" "}
          <span
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 9, fontWeight: 400, color: "var(--blue)", cursor: "pointer", marginLeft: 6, textTransform: "none" as const, letterSpacing: 0 }}
          >
            Edit
          </span>
        </DpLabel>
        {templatesOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
            {TEMPLATES.map(t => (
              <div
                key={t}
                onClick={() => onSelectTemplate(t)}
                style={{
                  padding: "5px 9px", borderRadius: 5,
                  border: selectedTemplate === t ? "1px solid var(--blue)" : "1px solid var(--line)",
                  background: selectedTemplate === t ? "rgba(74,144,217,0.05)" : "var(--surface)",
                  color: selectedTemplate === t ? "var(--fg)" : "var(--fg-2)",
                  fontWeight: selectedTemplate === t ? 600 : 400,
                  fontSize: 11, cursor: "pointer", transition: "all 0.1s",
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
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5 }}>
              <FileIcon />
              <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>HBR_Thought_Leadership.pdf</span>
              <span style={{ fontSize: 9, color: "var(--fg-3)" }}>340 KB</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 4 }}>Session only — not saved to Project Files</div>
          </div>
        )}
      </DpSection>

      <DpSection>
        <DpLabel collapsible open={projectFilesOpen} onToggle={() => setProjectFilesOpen(o => !o)}>Project Files</DpLabel>
        {projectFilesOpen && (
          <div style={{ marginTop: 6, fontSize: 10, color: "var(--blue)", lineHeight: 1.9 }}>
            ✓ Voice DNA · John Gilmore v2<br />
            ✓ Brand Guide<br />
            ✓ Maui Studiomind
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
            border: "1px solid var(--gold-bright)",
            background: "rgba(245,198,66,0.05)",
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
  mustCount,
  styleCount,
  wordCount,
  selectedFormats,
}: {
  mustCount: number;
  styleCount: number;
  wordCount: number;
  selectedFormats: Format[];
}) {
  const optimum = 700;
  const over = wordCount - optimum;
  const fillPct = Math.min((wordCount / (optimum * 1.5)) * 100, 100);
  const wordMap: Partial<Record<Format, string>> = {
    LinkedIn: "700 words", Newsletter: "800 words",
    Podcast: "1,200 words", "Sunday Story": "1,500 words",
  };

  return (
    <>
      <DpSection>
        <DpLabel>Voice match</DpLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg viewBox="0 0 100 60" width="48" height="29">
            <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
            <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--blue)" strokeWidth="10" strokeLinecap="round" strokeDasharray="141" strokeDashoffset="16" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>89%</span>
          <span style={{ fontSize: 9, color: "var(--fg-3)" }}>prelim</span>
        </div>
      </DpSection>

      <DpSection>
        <DpLabel>Flags</DpLabel>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 4,
            background: "rgba(245,198,66,0.1)", border: "1px solid rgba(245,198,66,0.35)",
            fontSize: 10, color: "#9A7030",
          }}>
            <span>{mustCount}</span> must fix
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 4,
            background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.2)",
            fontSize: 10, color: "var(--blue)",
          }}>
            <span>{styleCount}</span> style
          </div>
        </div>
      </DpSection>

      <DpSection>
        <DpLabel>Words</DpLabel>
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: "var(--fg)" }}>{wordCount}</span>
            <span style={{ color: "var(--gold)" }}>{over > 0 ? `+${over}` : ""}</span>
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
  activeTab,
  reviewedTabs,
  improvements,
  onFix,
  onSkip,
  onExportAll,
  exported,
}: {
  activeTab: string;
  reviewedTabs: Record<string, boolean>;
  improvements: { pts: string; title: string; desc: string; done: boolean }[];
  onFix: (i: number) => void;
  onSkip: (i: number) => void;
  onExportAll: () => void;
  exported: boolean;
}) {
  const allReviewed = Object.values(reviewedTabs).every(Boolean);
  const unreviewed = Object.values(reviewedTabs).filter(v => !v).length;

  return (
    <div style={{ paddingTop: 4 }}>
      {improvements.map((card, i) => (
        <div
          key={i}
          style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "12px 14px", marginBottom: 8,
            boxShadow: "var(--shadow-sm)",
            opacity: card.done ? 0.35 : 1,
            pointerEvents: card.done ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
        >
          <div style={{
            fontSize: 9, fontWeight: 700, color: "var(--blue)",
            background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.15)",
            padding: "2px 7px", borderRadius: 10, marginBottom: 5,
            display: "inline-block", letterSpacing: "0.04em",
          }}>
            {card.pts}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>{card.title}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}>{card.desc}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button
              onClick={() => onFix(i)}
              style={{
                fontSize: 11, padding: "6px 14px", borderRadius: 5,
                background: "var(--fg)", border: "none", color: "var(--surface)",
                cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600, flex: 1,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--fg-2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--fg)"; }}
            >
              Fix this
            </button>
            <button
              onClick={() => onSkip(i)}
              style={{
                fontSize: 11, padding: "6px 14px", borderRadius: 5,
                background: "transparent", border: "1px solid var(--line)",
                color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)",
                transition: "all 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              Skip
            </button>
          </div>
        </div>
      ))}

      <div style={{
        fontSize: 10, color: allReviewed ? "var(--blue)" : "var(--fg-3)",
        marginTop: 12, marginBottom: 6,
        transition: "color 0.2s",
      }}>
        {exported
          ? "All formats exported to Session Files."
          : allReviewed
          ? "All formats reviewed — ready to export."
          : `${unreviewed} format${unreviewed !== 1 ? "s" : ""} still need review.`}
      </div>

      <button
        onClick={onExportAll}
        disabled={!allReviewed || exported}
        style={{
          width: "100%", padding: 10, borderRadius: 6,
          background: exported ? "rgba(74,144,217,0.12)" : allReviewed ? "var(--gold-bright)" : "var(--gold-bright)",
          border: exported ? "1px solid rgba(74,144,217,0.3)" : "none",
          fontSize: 12, fontWeight: 700,
          color: exported ? "var(--blue)" : "var(--fg)",
          cursor: allReviewed && !exported ? "pointer" : "not-allowed",
          fontFamily: "var(--font)",
          opacity: allReviewed ? 1 : 0.4,
          transition: "all 0.2s",
        }}
      >
        {exported ? "Exported" : "Export all"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <svg style={{ width: 13, height: 13, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg style={{ width: 13, height: 13, stroke: "#fff", strokeWidth: 2.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }} viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function MicIcon({ active }: { active?: boolean }) {
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

// ── Input Bar ─────────────────────────────────────────────────
function InputBar({
  placeholder,
  value,
  onChange,
  onSend,
  onEnter,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onEnter?: () => void;
}) {
  const [micActive, setMicActive] = useState(false);

  return (
    <div style={{
      borderTop: "1px solid var(--line)",
      padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 4,
      flexShrink: 0, background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder}
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "0 12px", fontSize: 13, color: "var(--fg)",
            fontFamily: "var(--font)", outline: "none", height: 36,
            transition: "border-color 0.12s",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.5)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Attach file"><AttachIcon /></IaBtn>
        <IaBtn
          title="Hold to speak"
          active={micActive}
          onMouseDown={() => setMicActive(true)}
          onMouseUp={() => setMicActive(false)}
          onMouseLeave={() => setMicActive(false)}
        >
          <MicIcon active={micActive} />
        </IaBtn>
        <button
          onClick={onSend}
          style={{
            width: 36, height: 36, borderRadius: 7,
            background: "var(--fg)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--fg-2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--fg)"; }}
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

function IaBtn({
  title, active, children, onMouseDown, onMouseUp, onMouseLeave,
}: {
  title?: string; active?: boolean; children: React.ReactNode;
  onMouseDown?: () => void; onMouseUp?: () => void; onMouseLeave?: () => void;
}) {
  return (
    <button
      title={title}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{
        width: 36, height: 36, borderRadius: 7,
        border: "1px solid var(--line)",
        background: active ? "rgba(245,198,66,0.1)" : "var(--surface)",
        borderColor: active ? "var(--gold-bright)" : "var(--line)",
        color: active ? "var(--gold)" : "var(--fg-3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.12s",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--fg-2)"; } }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Intake ────────────────────────────────────────────────────
function StageIntake({
  messages,
  onSend,
  onAdvance,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onAdvance: () => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Conversation */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Advance cta after enough messages */}
      {messages.length >= 5 && (
        <div style={{ padding: "0 14px 10px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onAdvance}
            style={{
              fontSize: 11, fontWeight: 600, padding: "7px 16px",
              borderRadius: 6, background: "var(--gold-bright)",
              border: "none", color: "var(--fg)", cursor: "pointer",
              fontFamily: "var(--font)", transition: "opacity 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Build outline →
          </button>
        </div>
      )}

      <InputBar
        placeholder="Keep going..."
        value={input}
        onChange={setInput}
        onSend={send}
      />
    </div>
  );
}

function ChatBubble({ role, text }: { role: "watson" | "user"; text: string }) {
  const isWatson = role === "watson";
  return (
    <div style={{
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      justifyContent: isWatson ? "flex-start" : "flex-end",
    }}>
      {isWatson && (
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "var(--blue)", flexShrink: 0, marginTop: 2,
        }}>W</div>
      )}
      <div style={{
        background: isWatson ? "rgba(74,144,217,0.07)" : "rgba(245,198,66,0.08)",
        border: isWatson ? "1px solid rgba(74,144,217,0.15)" : "1px solid rgba(245,198,66,0.2)",
        borderRadius: isWatson ? "0 10px 10px 10px" : "10px 0 10px 10px",
        padding: "10px 14px",
        maxWidth: "82%",
      }}>
        <p style={{ fontSize: 13, color: isWatson ? "var(--fg-2)" : "var(--fg)", lineHeight: 1.6 }}>{text}</p>
      </div>
      {!isWatson && (
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(245,198,66,0.15)", border: "1px solid rgba(245,198,66,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "var(--gold)", flexShrink: 0, marginTop: 2,
        }}>MS</div>
      )}
    </div>
  );
}

// ── Outline ───────────────────────────────────────────────────
function StageOutline({
  selectedLens,
  onSelectLens,
  outlineRows,
  onUpdateRow,
  onAdvance,
}: {
  selectedLens: string;
  onSelectLens: (id: string) => void;
  outlineRows: OutlineRow[];
  onUpdateRow: (i: number, content: string) => void;
  onAdvance: () => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Lens cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {LENS_OPTIONS.map(lens => {
            const selected = selectedLens === lens.id;
            return (
              <div
                key={lens.id}
                onClick={() => onSelectLens(lens.id)}
                style={{
                  border: selected ? "1px solid var(--gold-bright)" : "1px solid var(--line)",
                  background: selected ? "rgba(245,198,66,0.03)" : "var(--surface)",
                  borderRadius: 8, padding: 14, cursor: "pointer",
                  transition: "all 0.15s", position: "relative",
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "rgba(245,198,66,0.4)"; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", lineHeight: 1.4, flex: 1 }}>{lens.title}</span>
                  {/* Vote buttons */}
                  <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                    {[true, false].map((up, vi) => (
                      <button
                        key={vi}
                        onClick={e => e.stopPropagation()}
                        title={up ? "Suggest more like this" : "Don't suggest this style"}
                        style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      >
                        <svg style={{ width: 14, height: 14, stroke: selected && up ? "var(--blue)" : "var(--line-2)", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
                          {up
                            ? <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></>
                            : <><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" /></>}
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}>{lens.desc}</div>
                {selected && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--gold)", marginTop: 8 }}>
                    Selected ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Outline structure */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, minHeight: 200 }}>
          {outlineRows.map((row, i) => (
            <OutlineRow
              key={i}
              label={row.label}
              content={row.content}
              indent={row.indent}
              onChange={c => onUpdateRow(i, c)}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid var(--line)", padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, background: "var(--bg)",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Watson to restructure — or click any line to edit..."
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "0 12px", fontSize: 12, color: "var(--fg)",
            fontFamily: "var(--font)", outline: "none", height: 36,
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Hold to speak"><MicIcon /></IaBtn>
        <button
          onClick={onAdvance}
          style={{
            width: 36, height: 36, borderRadius: 7,
            background: "var(--fg)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function OutlineRow({
  label, content, indent, onChange,
}: {
  label: string; content: string; indent?: boolean; onChange: (v: string) => void;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  return (
    <div
      style={{
        display: "flex", alignItems: "baseline", gap: 0,
        padding: "7px 0", borderBottom: "1px solid var(--line)",
        position: "relative",
      }}
    >
      {/* Label */}
      <div style={{
        width: 52, fontSize: 10, fontWeight: 600, color: "var(--line-2)",
        textTransform: "uppercase" as const, letterSpacing: "0.08em",
        flexShrink: 0, paddingTop: 1,
        display: "flex", alignItems: "flex-start", gap: 4,
      }}>
        <span
          onClick={() => setShowAlt(s => !s)}
          title="Brainstorm alternatives"
          style={{
            fontSize: 11, color: "var(--gold)", cursor: "pointer",
            opacity: 0, transition: "opacity 0.15s", lineHeight: 1, flexShrink: 0,
          }}
          className="os-brainstorm-btn"
        >↻</span>
        {label}
      </div>

      {/* Content */}
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
        {localContent}
      </div>
    </div>
  );
}

// ── Edit ──────────────────────────────────────────────────────
function StageEdit({
  flags,
  onFixFlag,
  onDismissFlag,
  onAdvance,
}: {
  flags: EditFlag[];
  onFixFlag: (id: string, replacement: string) => void;
  onDismissFlag: (id: string) => void;
  onAdvance: () => void;
}) {
  const [input, setInput] = useState("");
  const [activePop, setActivePop] = useState<string | null>(null);
  const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showPop = (id: string) => {
    Object.keys(hideTimers.current).forEach(k => {
      if (k !== id) {
        clearTimeout(hideTimers.current[k]);
        setActivePop(null);
      }
    });
    clearTimeout(hideTimers.current[id]);
    setActivePop(id);
  };

  const hidePop = (id: string) => {
    hideTimers.current[id] = setTimeout(() => setActivePop(null), 200);
  };

  const cancelHide = (id: string) => clearTimeout(hideTimers.current[id]);

  const draftParagraphs = [
    {
      text: "You've said it perfectly in a meeting. On a plane. Walking out of a conversation that changed the room. That version — the real one, in your voice —",
      flags: ["pop-b1"],
      afterFlag: " never made it anywhere.",
    },
    {
      text: "Most people think this is a motivation problem. ",
      flags: ["pop-r1"],
      afterFlag: ". They're wrong. It's structural.",
      flagText: "Studies show that 87% of executives feel underrepresented in public conversation",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", lineHeight: 1.3, marginBottom: 16 }}>
            The thinking is in your head. It belongs in the world.
          </div>

          {/* Paragraph 1 */}
          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75 }}>
            You've said it perfectly in a meeting. On a plane. Walking out of a conversation that changed the room. That version — the real one, in your voice —{" "}
            <FlagSpan
              id="pop-b1"
              type="style"
              active={activePop === "pop-b1"}
              flagMsg="Slightly passive. Consider making this more direct."
              suggestion='"never gets out" or "disappears"'
              replacement="never gets out"
              onShow={showPop}
              onHide={hidePop}
              onCancelHide={cancelHide}
              onFix={r => onFixFlag("pop-b1", r)}
              onDismiss={() => onDismissFlag("pop-b1")}
              dismissed={flags.find(f => f.id === "pop-b1")?.dismissed ?? false}
              fixed={flags.find(f => f.id === "pop-b1")?.fixed ?? false}
            >
              never made it anywhere
            </FlagSpan>
            .
          </p>

          {/* Paragraph 2 */}
          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, marginTop: 12 }}>
            Most people think this is a motivation problem.{" "}
            <FlagSpan
              id="pop-r1"
              type="must"
              active={activePop === "pop-r1"}
              flagMsg="No source found. Remove or verify before Review."
              suggestion='"Most executives I speak with..." (your observation, no citation needed)'
              replacement="Most executives I speak with feel underrepresented in public conversation"
              onShow={showPop}
              onHide={hidePop}
              onCancelHide={cancelHide}
              onFix={r => onFixFlag("pop-r1", r)}
              onDismiss={() => onDismissFlag("pop-r1")}
              dismissed={flags.find(f => f.id === "pop-r1")?.dismissed ?? false}
              fixed={flags.find(f => f.id === "pop-r1")?.fixed ?? false}
            >
              Studies show that 87% of executives feel underrepresented in public conversation
            </FlagSpan>
            . They're wrong. It's structural.
          </p>

          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: "16px 0 8px" }}>The myth of motivation</div>

          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75 }}>
            Discipline gets you to the blank page. It does not close the gap between a half-formed idea and a published piece that sounds like you. That gap is not a character test. It is an engineering problem.
          </p>

          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, marginTop: 12 }}>
            The people in your market who show up everywhere built the operation.{" "}
            <FlagSpan
              id="pop-b2"
              type="style"
              active={activePop === "pop-b2"}
              flagMsg='Voice drift — cliche. "Lost opportunity" is weak. You usually land harder.'
              suggestion={"Every week without it — someone else says what you've been thinking."}
              replacement="Every week without it, someone else says what you've been thinking"
              onShow={showPop}
              onHide={hidePop}
              onCancelHide={cancelHide}
              onFix={r => onFixFlag("pop-b2", r)}
              onDismiss={() => onDismissFlag("pop-b2")}
              dismissed={flags.find(f => f.id === "pop-b2")?.dismissed ?? false}
              fixed={flags.find(f => f.id === "pop-b2")?.fixed ?? false}
            >
              Every week without infrastructure is a week of lost opportunity
            </FlagSpan>
            .
          </p>
        </div>
      </div>

      {/* Advance button */}
      <div style={{ padding: "0 14px 0", display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
        <button
          onClick={onAdvance}
          style={{
            fontSize: 11, fontWeight: 600, padding: "7px 16px",
            borderRadius: 6, background: "var(--gold-bright)",
            border: "none", color: "var(--fg)", cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          Move to Review →
        </button>
      </div>

      <InputBar
        placeholder="Tell Watson what to change — or edit above..."
        value={input}
        onChange={setInput}
        onSend={() => setInput("")}
      />
    </div>
  );
}

function FlagSpan({
  id, type, active, children,
  flagMsg, suggestion, replacement,
  onShow, onHide, onCancelHide, onFix, onDismiss,
  dismissed, fixed,
}: {
  id: string; type: "must" | "style"; active: boolean; children: React.ReactNode;
  flagMsg: string; suggestion: string; replacement: string;
  onShow: (id: string) => void; onHide: (id: string) => void;
  onCancelHide: (id: string) => void; onFix: (r: string) => void;
  onDismiss: () => void; dismissed: boolean; fixed: boolean;
}) {
  if (fixed) return <>{replacement}</>;

  const isMust = type === "must";
  const underlineColor = dismissed ? "var(--line-2)" : isMust ? "var(--gold-bright)" : "var(--blue)";
  const underlineStyle = dismissed ? "dotted" : "solid";

  return (
    <span style={{ position: "relative" as const, display: "inline" }}>
      <span
        onMouseEnter={() => onShow(id)}
        onMouseLeave={() => onHide(id)}
        style={{
          textDecoration: "underline",
          textDecorationColor: underlineColor,
          textDecorationStyle: underlineStyle,
          textUnderlineOffset: 3,
          cursor: dismissed ? "default" : "pointer",
        }}
      >
        {children}
      </span>

      {active && !dismissed && (
        <span
          onMouseEnter={() => onCancelHide(id)}
          onMouseLeave={() => onHide(id)}
          style={{
            display: "block",
            position: "absolute" as const,
            bottom: "calc(100% + 6px)", left: 0,
            zIndex: 100, background: "var(--surface)",
            border: "1px solid var(--line)", borderRadius: 7,
            padding: "10px 12px", width: 260,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        >
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, display: "block", marginBottom: 4,
            color: isMust ? "var(--gold)" : "var(--blue)",
          }}>
            {isMust ? "Must fix — claim unverified" : "Style suggestion"}
          </span>
          <span style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.5, display: "block", marginBottom: 4 }}>{flagMsg}</span>
          <span style={{ fontSize: 11, color: "var(--fg)", fontStyle: "italic", display: "block", marginBottom: 8 }}>{suggestion}</span>
          <span style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onFix(replacement)}
              style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 4,
                background: "var(--fg)", border: "none", color: "var(--surface)",
                cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600,
              }}
            >Fix</button>
            <button
              onClick={onDismiss}
              style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 4,
                background: "transparent", border: "1px solid var(--line)",
                color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)",
              }}
            >Dismiss</button>
          </span>
        </span>
      )}
    </span>
  );
}

// ── Review ────────────────────────────────────────────────────
function StageReview({
  tabs, activeTab, onTabClick, onAdvance,
}: {
  tabs: ReviewTab[];
  activeTab: string;
  onTabClick: (id: string) => void;
  onAdvance: () => void;
}) {
  const content = REVIEW_CONTENT[activeTab] || REVIEW_CONTENT.LinkedIn;
  const [input, setInput] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Format tabs */}
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--line)",
        padding: "0 20px", flexShrink: 0,
        background: "var(--bg)", overflowX: "auto",
      }}>
        {tabs.map(tab => (
          <ReviewTabBtn
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            reviewed={tab.reviewed}
            exported={tab.exported}
            onClick={() => onTabClick(tab.id)}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", lineHeight: 1.3, marginBottom: 16 }}>
            {content[0]}
          </div>
          {content.slice(1).map((p, i) => (
            <p key={i} style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, marginTop: 12 }}>{p}</p>
          ))}
        </div>
      </div>

      {/* Advance */}
      <div style={{ padding: "0 14px 8px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onAdvance}
          style={{
            fontSize: 11, fontWeight: 600, padding: "7px 16px",
            borderRadius: 6, background: "var(--gold-bright)",
            border: "none", color: "var(--fg)", cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          Move to Export →
        </button>
      </div>

      <div style={{
        borderTop: "1px solid var(--line)", padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, background: "var(--bg)",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send back to Edit — tell Watson what to change..."
          style={{
            flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "0 12px", fontSize: 12, color: "var(--fg)",
            fontFamily: "var(--font)", outline: "none", height: 36,
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(245,198,66,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
        />
        <IaBtn title="Hold to speak"><MicIcon /></IaBtn>
        <button
          onClick={() => setInput("")}
          style={{
            width: 36, height: 36, borderRadius: 7,
            background: "var(--fg)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function ReviewTabBtn({
  label, active, reviewed, exported, onClick,
}: {
  label: string; active: boolean; reviewed: boolean; exported: boolean; onClick: () => void;
}) {
  const dotColor = exported ? "var(--blue)" : reviewed ? "var(--gold-bright)" : "var(--line)";
  return (
    <div
      onClick={onClick}
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
      {label}
      <span style={{
        display: "inline-block", width: 6, height: 6,
        borderRadius: "50%", background: dotColor,
        marginLeft: 5, verticalAlign: "middle",
        position: "relative", top: -1, transition: "background 0.2s",
      }} />
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────
function StageExport({
  tabs, activeTab, onTabClick,
}: {
  tabs: ReviewTab[];
  activeTab: string;
  onTabClick: (id: string) => void;
}) {
  const [exportedTabs, setExportedTabs] = useState<Record<string, boolean>>({});
  const labels: Record<string, string> = {
    LinkedIn: "LinkedIn Post", Newsletter: "Newsletter",
    Podcast: "Podcast Script", "Sunday Story": "Sunday Story",
  };

  const handleExport = (which: string) => {
    setExportedTabs(p => ({ ...p, [which]: true }));
  };

  const handleCopy = () => {
    const text = document.getElementById("export-preview-content")?.innerText ?? "";
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const previewNode = EXPORT_PREVIEWS[activeTab] || EXPORT_PREVIEWS.LinkedIn;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Format tabs */}
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--line)",
        padding: "0 20px", flexShrink: 0,
        background: "var(--bg)", overflowX: "auto",
      }}>
        {tabs.map(tab => (
          <ReviewTabBtn
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            reviewed={tab.reviewed}
            exported={exportedTabs[tab.id] ?? false}
            onClick={() => onTabClick(tab.id)}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", maxWidth: 660 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)" }}>{labels[activeTab] ?? activeTab}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 5,
                border: "1px solid var(--line)", background: "var(--surface)",
                color: "var(--fg-2)", cursor: "pointer", fontFamily: "var(--font)",
              }}
            >Copy</button>
            <button
              onClick={() => handleExport(activeTab)}
              style={{
                fontSize: 11, padding: "5px 14px", borderRadius: 5,
                border: exportedTabs[activeTab] ? "1px solid rgba(74,144,217,0.3)" : "none",
                background: exportedTabs[activeTab] ? "rgba(74,144,217,0.1)" : "var(--fg)",
                color: exportedTabs[activeTab] ? "var(--blue)" : "var(--surface)",
                cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {exportedTabs[activeTab] ? "Exported" : "Export"}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 18 }}>Saves to Session Files on export.</div>
        <div
          id="export-preview-content"
          style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "22px 26px", fontSize: 13,
            color: "var(--fg-2)", lineHeight: 1.7,
          }}
        >
          {previewNode}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: "watson", text: "What's on your mind?" },
  { role: "user", text: "I want to write about the gap between knowing what to say and getting it out into the world. Executives deal with this constantly — brilliant thinking that never reaches an audience." },
  { role: "watson", text: 'The HBR piece calls it the "articulation gap." Is your angle the psychological barrier, the structural problem, or the solution?' },
  { role: "user", text: "Structural. People think they need more time or motivation. They don't. They need infrastructure." },
  { role: "watson", text: "Good. That's a reframe — and a strong one. Who's the primary reader?" },
];

const INITIAL_FLAGS: EditFlag[] = [
  { id: "pop-b1", type: "style", text: "never made it anywhere", flagMsg: "Slightly passive. Consider making this more direct.", suggestion: '"never gets out" or "disappears"', replacement: "never gets out", dismissed: false, fixed: false },
  { id: "pop-r1", type: "must", text: "Studies show that 87% of executives feel underrepresented in public conversation", flagMsg: "No source found. Remove or verify before Review.", suggestion: '"Most executives I speak with..." (your observation, no citation needed)', replacement: "Most executives I speak with feel underrepresented in public conversation", dismissed: false, fixed: false },
  { id: "pop-b2", type: "style", text: "Every week without infrastructure is a week of lost opportunity", flagMsg: 'Voice drift — cliche. "Lost opportunity" is weak. You usually land harder.', suggestion: '"Every week without it, someone else says what you\'ve been thinking."', replacement: "Every week without it, someone else says what you've been thinking", dismissed: false, fixed: false },
];

const INITIAL_REVIEW_TABS: ReviewTab[] = [
  { id: "LinkedIn", label: "LinkedIn", reviewed: false, exported: false },
  { id: "Newsletter", label: "Newsletter", reviewed: false, exported: false },
  { id: "Podcast", label: "Podcast", reviewed: false, exported: false },
  { id: "Sunday Story", label: "Sunday Story", reviewed: false, exported: false },
];

export default function WorkSession() {
  const { setDashContent, setDashOpen } = useShell();
  const { displayName } = useAuth();
  const nav = useNavigate();

  // ── Stage state ──────────────────────────────────────────────
  const [stage, setStage] = useState<WorkStage>("Intake");

  // ── Intake ───────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const WATSON_RESPONSES = [
    "Interesting. What's the biggest misconception executives have about this problem?",
    "Good. Can you give me one specific example — a real moment where this played out?",
    "That's the hook. What do you want the reader to actually do differently after reading this?",
    "Understood. Let me build an outline from what you've shared.",
  ];
  const watsonIdx = useRef(0);

  const handleIntakeSend = (text: string) => {
    setMessages(m => [...m, { role: "user", text }]);
    const reply = WATSON_RESPONSES[watsonIdx.current % WATSON_RESPONSES.length];
    watsonIdx.current++;
    setTimeout(() => {
      setMessages(m => [...m, { role: "watson", text: reply }]);
    }, 600);
  };

  // ── Outline ──────────────────────────────────────────────────
  const [selectedLens, setSelectedLens] = useState("a");
  const [outlineRows, setOutlineRows] = useState<OutlineRow[]>(LENS_OPTIONS[0].outline);

  const handleSelectLens = (id: string) => {
    setSelectedLens(id);
    const lens = LENS_OPTIONS.find(l => l.id === id);
    if (lens) setOutlineRows(lens.outline);
  };

  const handleUpdateOutlineRow = (i: number, content: string) => {
    setOutlineRows(rows => rows.map((r, idx) => idx === i ? { ...r, content } : r));
  };

  // ── Edit flags ────────────────────────────────────────────────
  const [flags, setFlags] = useState<EditFlag[]>(INITIAL_FLAGS);
  const mustCount = flags.filter(f => f.type === "must" && !f.dismissed && !f.fixed).length;
  const styleCount = flags.filter(f => f.type === "style" && !f.dismissed && !f.fixed).length;
  const wordCount = 847;

  const handleFixFlag = (id: string, replacement: string) => {
    setFlags(fs => fs.map(f => f.id === id ? { ...f, fixed: true, replacement } : f));
  };
  const handleDismissFlag = (id: string) => {
    setFlags(fs => fs.map(f => f.id === id ? { ...f, dismissed: true } : f));
  };

  // ── Review ────────────────────────────────────────────────────
  const [reviewTabs, setReviewTabs] = useState<ReviewTab[]>(INITIAL_REVIEW_TABS);
  const [activeReviewTab, setActiveReviewTab] = useState("LinkedIn");
  const [reviewImprovements, setReviewImprovements] = useState<
    Record<string, { pts: string; title: string; desc: string; done: boolean }[]>
  >(
    Object.fromEntries(
      Object.entries(REVIEW_IMPROVEMENTS).map(([k, v]) => [k, v.map(x => ({ ...x, done: false }))])
    )
  );
  const [exportedAll, setExportedAll] = useState(false);

  const reviewedState = Object.fromEntries(reviewTabs.map(t => [t.id, t.reviewed]));

  const handleReviewTabClick = (id: string) => {
    setActiveReviewTab(id);
    // Check if all improvements for this tab are done, if so auto-mark reviewed
    const imps = reviewImprovements[id] || [];
    if (imps.every(i => i.done)) {
      setReviewTabs(tabs => tabs.map(t => t.id === id ? { ...t, reviewed: true } : t));
    }
  };

  const handleReviewFix = (tabId: string, impIdx: number) => {
    setReviewImprovements(prev => {
      const updated = { ...prev, [tabId]: prev[tabId].map((imp, i) => i === impIdx ? { ...imp, done: true } : imp) };
      const allDone = updated[tabId].every(i => i.done);
      if (allDone) {
        setReviewTabs(tabs => tabs.map(t => t.id === tabId ? { ...t, reviewed: true } : t));
      }
      return updated;
    });
  };

  const handleReviewSkip = (tabId: string, impIdx: number) => handleReviewFix(tabId, impIdx);

  const handleExportAll = () => {
    setExportedAll(true);
    setReviewTabs(tabs => tabs.map(t => ({ ...t, exported: true })));
    setTimeout(() => setStage("Export"), 1200);
  };

  // ── Export tabs ───────────────────────────────────────────────
  const [activeExportTab, setActiveExportTab] = useState("LinkedIn");

  // ── Formats + templates ───────────────────────────────────────
  const [selectedFormats, setSelectedFormats] = useState<Format[]>(DEFAULT_FORMATS);
  const [selectedTemplate, setSelectedTemplate] = useState("Weekly Insight");

  const toggleFormat = (f: Format) => {
    setSelectedFormats(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);
  };

  // ── Stage navigation ──────────────────────────────────────────
  const goToStage = useCallback((s: WorkStage) => {
    setStage(s);
    if (s === "Review") setActiveReviewTab("LinkedIn");
    if (s === "Export") setActiveExportTab("LinkedIn");
  }, []);

  // Expose stage to topbar breadcrumb
  useEffect(() => {
    (window as any).__ewWorkStage = stage;
    (window as any).__ewSetWorkStage = goToStage;
    return () => {
      delete (window as any).__ewWorkStage;
      delete (window as any).__ewSetWorkStage;
    };
  }, [stage, goToStage]);

  // ── Inject dashboard panel ────────────────────────────────────
  useLayoutEffect(() => {
    setDashOpen(true);

    const currentImps = (reviewImprovements[activeReviewTab] || []);

    const dashNode = (() => {
      switch (stage) {
        case "Intake":
          return (
            <IntakeDash
              selectedFormats={selectedFormats}
              onToggleFormat={toggleFormat}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          );
        case "Outline":
          return <OutlineDash selectedFormats={selectedFormats} />;
        case "Edit":
          return (
            <EditDash
              mustCount={mustCount}
              styleCount={styleCount}
              wordCount={wordCount}
              selectedFormats={selectedFormats}
            />
          );
        case "Review":
          return (
            <ReviewDash
              activeTab={activeReviewTab}
              reviewedTabs={reviewedState}
              improvements={currentImps}
              onFix={i => handleReviewFix(activeReviewTab, i)}
              onSkip={i => handleReviewSkip(activeReviewTab, i)}
              onExportAll={handleExportAll}
              exported={exportedAll}
            />
          );
        case "Export":
          return (
            <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
              <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>Session Files</div>
              {selectedFormats.map(f => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "5px 8px", background: "var(--surface)",
                  border: "1px solid var(--line)", borderRadius: 5, marginBottom: 4,
                }}>
                  <FileIcon />
                  <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1 }}>{f}_Draft.md</span>
                  <span style={{ fontSize: 9, color: "var(--blue)", fontWeight: 600, cursor: "pointer" }}>Copy</span>
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    })();

    setDashContent(dashNode);
    return () => setDashContent(null);
  }, [
    stage, selectedFormats, selectedTemplate, mustCount, styleCount,
    activeReviewTab, reviewImprovements, exportedAll, reviewedState,
  ]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      height: "100%", overflow: "hidden", fontFamily: "var(--font)",
    }}>
      {stage === "Intake" && (
        <StageIntake
          messages={messages}
          onSend={handleIntakeSend}
          onAdvance={() => goToStage("Outline")}
        />
      )}
      {stage === "Outline" && (
        <StageOutline
          selectedLens={selectedLens}
          onSelectLens={handleSelectLens}
          outlineRows={outlineRows}
          onUpdateRow={handleUpdateOutlineRow}
          onAdvance={() => goToStage("Edit")}
        />
      )}
      {stage === "Edit" && (
        <StageEdit
          flags={flags}
          onFixFlag={handleFixFlag}
          onDismissFlag={handleDismissFlag}
          onAdvance={() => goToStage("Review")}
        />
      )}
      {stage === "Review" && (
        <StageReview
          tabs={reviewTabs}
          activeTab={activeReviewTab}
          onTabClick={handleReviewTabClick}
          onAdvance={() => goToStage("Export")}
        />
      )}
      {stage === "Export" && (
        <StageExport
          tabs={reviewTabs}
          activeTab={activeExportTab}
          onTabClick={setActiveExportTab}
        />
      )}
    </div>
  );
}
