/**
 * OutputLibrary.tsx — The Catalog
 * Phase 6: fully wired to Supabase outputs table.
 * Selecting a session opens detail in dashboard panel.
 * "Reopen in Work" navigates to WorkSession with session state.
 */
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useShell } from "../../components/studio/StudioShell";
import { useMobile } from "../../hooks/useMobile";
import { timeAgo } from "../../utils/timeAgo";
import "./shared.css";

const FONT = "var(--font)";

interface OutputRow {
  id: string;
  title: string;
  output_type: string;
  score: number;
  created_at: string;
  updated_at?: string;
  content?: string;
  content_state?: string;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}.${String(d.getFullYear()).slice(2)}`;
}

function formatFullDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function outputTypeToLabel(t: string): string {
  const map: Record<string, string> = {
    essay: "Essay", newsletter: "Newsletter", socials: "LinkedIn Post",
    podcast: "Podcast Script", presentation: "Presentation",
    video_script: "Video Script", business: "Business", book: "Book",
    freestyle: "Freestyle", sunday_story: "Sunday Story",
  };
  return map[t] || t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function scoreColor(score: number): string {
  if (score >= 90) return "var(--blue)";
  if (score >= 70) return "var(--gold)";
  return "var(--fg-3)";
}

// ── Session detail dashboard panel ────────────────────────────
function SessionDetailPanel({
  output, onReopen, onDelete, onBack,
}: {
  output: OutputRow;
  onReopen: () => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const formats = [outputTypeToLabel(output.output_type)];

  return (
    <>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--fg-3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", padding: 0, marginBottom: 12 }}
      >
        <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>
          {formatFullDate(output.created_at)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 10, lineHeight: 1.4 }}>{output.title}</div>

        {output.score > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: "var(--fg-3)" }}>Impact Score</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(output.score) }}>{output.score}%</span>
          </div>
        )}

        {formats.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "var(--glass-card)", border: "1px solid var(--glass-border)", borderRadius: 5, marginBottom: 4 }}>
            <svg style={{ width: 12, height: 12, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <span style={{ fontSize: 10, color: "var(--fg-2)", flex: 1 }}>{f}</span>
            <span
              onClick={() => { if (output.content) navigator.clipboard.writeText(output.content).catch(() => {}); }}
              style={{ fontSize: 9, color: "var(--blue)", cursor: "pointer", fontWeight: 600 }}
            >Copy</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={onReopen}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--glass-border)", background: "var(--glass-card)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}
          >
            Reopen in Work
          </button>
          <button
            onClick={onDelete}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)", fontSize: 11, color: "var(--danger)", cursor: "pointer", fontFamily: FONT }}
          >
            Delete session
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function OutputLibrary() {
  const nav = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setDashContent } = useShell();

  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Load outputs from Supabase
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("outputs")
        .select("id, title, output_type, score, created_at, updated_at, content_state")
        .eq("user_id", user.id)
        .in("content_state", ["vault", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(50);
      setOutputs((data as OutputRow[]) || []);
      if (data && data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    })();
  }, [user]);

  // Load content for selected output (for copy)
  const [selectedContent, setSelectedContent] = useState<string>("");
  useEffect(() => {
    if (!selectedId || !user) return;
    supabase.from("outputs").select("content").eq("id", selectedId).single().then(
      ({ data }) => { setSelectedContent(data?.content || ""); },
      (err) => console.error("Failed to load output content:", err)
    );
  }, [selectedId, user]);

  const selectedOutput = outputs.find(o => o.id === selectedId) ?? null;

  const handleReopen = useCallback(() => {
    if (!selectedOutput) return;
    // Store session context and navigate to work
    sessionStorage.setItem("ew-reopen-output-id", selectedOutput.id);
    sessionStorage.setItem("ew-reopen-title", selectedOutput.title);
    nav("/studio/work");
  }, [selectedOutput, nav]);

  const handleDelete = useCallback(async () => {
    if (!selectedOutput || !user) return;
    const confirmed = window.confirm(`Delete "${selectedOutput.title}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const { error } = await supabase.from("outputs").delete().eq("id", selectedOutput.id).eq("user_id", user.id);
      if (error) throw error;
      setOutputs(prev => prev.filter(o => o.id !== selectedOutput.id));
      setSelectedId(null);
      toast("Session deleted.");
    } catch (err) {
      console.error("Failed to delete output:", err);
      toast("Failed to delete session. Please try again.");
    }
  }, [selectedOutput, user, toast]);

  // Dashboard panel
  useLayoutEffect(() => {
    if (selectedOutput) {
      setDashContent(
        <SessionDetailPanel
          output={{ ...selectedOutput, content: selectedContent }}
          onReopen={handleReopen}
          onDelete={handleDelete}
          onBack={() => setSelectedId(null)}
        />
      );
    } else {
      setDashContent(
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
          Select a session to see its files.
        </div>
      );
    }
    return () => setDashContent(null);
  }, [selectedOutput, selectedContent, handleReopen, handleDelete, setDashContent]);

  const filtered = outputs.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: isMobile ? "20px 16px" : 20, fontFamily: FONT, maxWidth: isMobile ? "100%" : 680 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>The Catalog</div>
        <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{outputs.length} session{outputs.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Search */}
      {outputs.length > 6 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sessions..."
          style={{
            width: "100%", marginBottom: 12, background: "var(--glass-input)",
            border: "1px solid var(--glass-border)", borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none",
            backdropFilter: "var(--glass-blur-light)", WebkitBackdropFilter: "var(--glass-blur-light)",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(74,144,217,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--glass-border)"; }}
        />
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid var(--glass-border)" }}>
              <div style={{ width: 48, height: 10, background: "var(--bg-2)", borderRadius: 3 }} />
              <div style={{ flex: 1, height: 12, background: "var(--bg-2)", borderRadius: 3 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center" as const, padding: "48px 0", color: "var(--fg-3)", fontSize: 13 }}>
          {search ? "No sessions match your search." : "No sessions yet. Complete a Work session to see it here."}
        </div>
      ) : (
        <div className="liquid-glass-card" style={{ overflow: "hidden" }}>
          {filtered.map((output, i) => {
            const active = selectedId === output.id;
            return (
              <div
                key={output.id}
                onClick={() => setSelectedId(output.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 8px",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--glass-border)" : "none",
                  cursor: "pointer",
                  background: active ? "rgba(245,198,66,0.06)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)", flexShrink: 0, fontVariantNumeric: "tabular-nums", width: 48 }}>
                  {formatDateShort(output.created_at)}
                </span>
                <span style={{ fontSize: 12, color: active ? "var(--fg)" : "var(--fg-2)", flex: 1, lineHeight: 1.4, fontWeight: active ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {output.title || "Untitled"}
                </span>
                {output.score > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: scoreColor(output.score), flexShrink: 0 }}>
                    {output.score}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
