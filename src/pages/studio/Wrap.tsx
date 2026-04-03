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

  return (
    <div style={{ padding: "24px 32px", maxWidth: 700, fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Your Content</div>
      {outputs.map(o => {
        const active = selectedId === o.id;
        return (
          <div
            key={o.id}
            onClick={() => setSelectedId(o.id)}
            style={{
              padding: "14px 18px", border: active ? "1px solid var(--gold)" : "1px solid var(--line)",
              borderRadius: 8, marginBottom: 8, cursor: "pointer",
              background: active ? "rgba(245,198,66,0.04)" : "var(--surface)",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "var(--line-2)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? "var(--gold)" : "var(--line)"; }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{o.title || "Untitled"}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, display: "flex", gap: 8 }}>
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
  );
}
