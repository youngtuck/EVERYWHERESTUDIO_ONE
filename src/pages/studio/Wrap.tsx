/**
 * Wrap.tsx, Turn exported drafts into deliverables.
 * Shows user's actual exported content from Work sessions,
 * or a clean empty state if no content has been exported yet.
 */
import { useState, useLayoutEffect, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./shared.css";

const FONT = "var(--font)";

const TEMPLATES = [
  { name: "LinkedIn Post", format: "Plain text" },
  { name: "Sunday Story", format: "HTML" },
  { name: "Executive Brief", format: "HTML" },
  { name: "The Edition", format: "Full package" },
  { name: "One-Pager", format: "HTML" },
];

interface OutputItem {
  id: string;
  title: string;
  content: string;
  output_type: string;
  created_at: string;
  score?: number;
}

// ── Wrap dashboard panel ──────────────────────────────────────
function WrapDashboard({
  selectedOutput,
  selectedTemplate,
  onSelectTemplate,
}: {
  selectedOutput: OutputItem | null;
  selectedTemplate: string;
  onSelectTemplate: (t: string) => void;
}) {
  const DpLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>
      {children}
    </div>
  );

  return (
    <>
      {/* Source */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Source</DpLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6 }}>
          <svg style={{ width: 12, height: 12, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {selectedOutput ? selectedOutput.title : "No content selected"}
          </span>
        </div>
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Templates</DpLabel>
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
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function WrapPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { setDashContent, setDashOpen } = useShell();
  const { user } = useAuth();

  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("LinkedIn Post");
  const [copied, setCopied] = useState(false);

  // Fetch outputs from Supabase
  const fetchOutputs = useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("outputs")
      .select("id, title, content, output_type, created_at, score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setOutputs((data as OutputItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  // Refetch every time the page is navigated to (location.key changes on each navigation)
  useEffect(() => {
    fetchOutputs();
  }, [fetchOutputs, location.key]);

  // Auto-select the most recent export
  useEffect(() => {
    const wrapOutputId = sessionStorage.getItem("ew-wrap-output-id");
    if (wrapOutputId) {
      setSelectedId(wrapOutputId);
      sessionStorage.removeItem("ew-wrap-output-id");
    } else if (outputs.length > 0 && !selectedId) {
      setSelectedId(outputs[0].id);
    }
  }, [outputs, selectedId]);

  const selectedOutput = outputs.find(o => o.id === selectedId) || null;

  // Dashboard panel
  useLayoutEffect(() => {
    setDashOpen(true);
    setDashContent(
      <WrapDashboard
        selectedOutput={selectedOutput}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />
    );
    return () => setDashContent(null);
  }, [selectedOutput, selectedTemplate, setDashContent, setDashOpen]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 13, fontFamily: FONT }}>Loading...</div>;
  }

  if (outputs.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", flex: 1, padding: 40, textAlign: "center",
        fontFamily: FONT,
      }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>&#10022;</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
          Ready to wrap.
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", maxWidth: 320, lineHeight: 1.5, marginBottom: 24 }}>
          Complete a Work session and export your content. Your finished pieces will appear here for final formatting and distribution.
        </div>
        <button
          onClick={() => nav("/studio/work")}
          style={{
            padding: "10px 24px", borderRadius: 8,
            background: "var(--gold-bright)", border: "none",
            color: "var(--fg)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT,
          }}
        >
          Go to Work
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    if (!selectedOutput) return;
    navigator.clipboard.writeText(selectedOutput.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Left: content list */}
      <div style={{ width: selectedOutput ? 280 : "100%", maxWidth: selectedOutput ? 280 : 700, flexShrink: 0, overflowY: "auto", padding: "24px 16px", borderRight: selectedOutput ? "1px solid var(--line)" : "none", transition: "width 0.2s" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 12, fontFamily: FONT }}>Your Content</div>
        {outputs.map(o => {
          const active = selectedId === o.id;
          return (
            <div
              key={o.id}
              onClick={() => setSelectedId(active ? null : o.id)}
              style={{
                padding: "10px 12px", border: active ? "1px solid var(--gold)" : "1px solid var(--line)",
                borderRadius: 8, marginBottom: 6, cursor: "pointer",
                background: active ? "rgba(245,198,66,0.04)" : "var(--surface)",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "var(--line-2)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? "var(--gold)" : "var(--line)"; }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", fontFamily: FONT }}>{o.title || "Untitled"}</div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 3, display: "flex", gap: 6, fontFamily: FONT }}>
                <span>{o.output_type || "freestyle"}</span>
                <span>&middot;</span>
                <span>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                {typeof o.score === "number" && o.score > 0 && (
                  <>
                    <span>&middot;</span>
                    <span style={{ color: o.score >= 75 ? "var(--blue)" : "var(--gold)" }}>Score: {o.score}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: content preview and actions */}
      {selectedOutput && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", fontFamily: FONT }}>
          {/* Header with actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>{selectedOutput.title || "Untitled"}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleCopy}
                style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem("ew-reopen-output-id", selectedOutput.id);
                  sessionStorage.setItem("ew-reopen-title", selectedOutput.title);
                  nav("/studio/work");
                }}
                style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "none", background: "var(--fg)", color: "var(--surface)", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}
              >
                Reopen in Work
              </button>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 16 }}>
            {selectedOutput.output_type || "freestyle"} &middot; {new Date(selectedOutput.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            {typeof selectedOutput.score === "number" && selectedOutput.score > 0 && (
              <span style={{ color: selectedOutput.score >= 75 ? "var(--blue)" : "var(--gold)", marginLeft: 8 }}>Score: {selectedOutput.score}</span>
            )}
          </div>

          {/* Content preview */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "22px 26px", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7,
            fontFamily: FONT,
          }}>
            {selectedOutput.content ? selectedOutput.content.split("\n").filter(Boolean).map((p, i) => (
              <p key={i} style={{ margin: 0, marginTop: i > 0 ? 10 : 0 }}>{p}</p>
            )) : <span style={{ color: "var(--fg-3)" }}>No content available.</span>}
          </div>
        </div>
      )}

      {/* Empty state when nothing is selected */}
      {!selectedOutput && outputs.length > 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontSize: 13, fontFamily: FONT }}>
          Select a piece to preview and export.
        </div>
      )}
    </div>
  );
}
