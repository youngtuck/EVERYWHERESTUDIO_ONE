/**
 * Wrap.tsx, Format tabs + centered preview + export controls
 * Wired: format adaptation via /api/adapt-format, export to Supabase, per-format copy
 */
import { useState, useLayoutEffect, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { useMobile } from "../../hooks/useMobile";
import "./shared.css";

const FONT = "var(--font)";
const DEFAULT_FORMATS = ["LinkedIn", "Newsletter", "Podcast", "Sunday Story"];
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

interface OutputItem {
  id: string;
  title: string;
  content: string;
  output_type: string;
  created_at: string;
  score?: number;
}

interface FormatEntry {
  content: string;
  metadata: Record<string, string>;
  status: "pending" | "loading" | "done" | "error";
}

// ── Right Panel Dashboard ─────────────────────────────────────
function WrapDashPanel({
  outputType, formatCount, onExportAll, exported, exporting, prefillReed,
}: {
  outputType: string;
  formatCount: number;
  onExportAll: () => void;
  exported: boolean;
  exporting: boolean;
  prefillReed: (text: string) => void;
}) {
  const isFreestyle = !outputType || outputType === "freestyle";
  const DpLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>{children}</div>
  );

  const chips = [
    { label: "Adapt for podcast", prefill: "Adapt this piece into a podcast script. Natural spoken language, same argument." },
    { label: "Write the LinkedIn post", prefill: "Write the LinkedIn version of this piece. 150 words, punchy opening." },
    { label: "Write the email subject line", prefill: "Write 3 subject line options for the newsletter version of this piece." },
    { label: "What else can I make from this?", prefill: "What other content can I extract or adapt from this piece?" },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Mode</DpLabel>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 99,
          background: "rgba(245,198,66,0.12)", border: "1px solid rgba(245,198,66,0.3)",
          fontSize: 10, fontWeight: 600, color: "#9A7030",
        }}>
          {isFreestyle ? "Freestyle" : outputType}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <DpLabel>Ready to Export</DpLabel>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          {isFreestyle
            ? "Freestyle mode. No format review required. Reed has packaged your content for every channel. Export All gives you clean, formatted outputs ready to publish."
            : `Reed has formatted your content for ${formatCount} channel${formatCount !== 1 ? "s" : ""}. Review each tab, then export.`}
        </div>
      </div>

      <button
        onClick={onExportAll}
        disabled={exported || exporting}
        style={{
          width: "100%", padding: 8, borderRadius: 6, marginBottom: 12,
          background: exported ? "rgba(74,144,217,0.12)" : "var(--fg)",
          color: exported ? "var(--blue, #4A90D9)" : "var(--gold, #F5C642)",
          border: exported ? "1px solid rgba(74,144,217,0.3)" : "none",
          fontSize: 11, fontWeight: 700,
          cursor: exported || exporting ? "default" : "pointer",
          fontFamily: FONT, letterSpacing: "0.04em",
          opacity: exporting ? 0.6 : 1,
        }}
      >
        {exported ? "Exported" : exporting ? "Exporting..." : "Export All"}
      </button>

      <div style={{
        border: "1px solid rgba(74,144,217,0.25)", borderRadius: 8,
        padding: "10px 12px", background: "rgba(74,144,217,0.04)", marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4A90D9", marginBottom: 6 }}>Reed</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          This piece has good legs. The LinkedIn version is strong. The essay close would make a solid standalone Sunday post if you want to file it separately.
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {chips.map((chip, i) => (
          <button key={i} onClick={() => prefillReed(chip.prefill)} style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 99,
            background: "#EDF1F5", border: "1px solid #CBD5E1",
            color: "#334155", cursor: "pointer", fontFamily: "inherit",
          }}>{chip.label}</button>
        ))}
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function WrapPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { setFeedbackContent, setDashOpen, setReedPrefill, setActiveDashTab } = useShell();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionDraft, setSessionDraft] = useState<OutputItem | null>(null);
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [activeFormat, setActiveFormat] = useState(DEFAULT_FORMATS[0]);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formatContents, setFormatContents] = useState<Record<string, FormatEntry>>({});

  // Track which formats we've already started adapting to avoid duplicates
  const adaptingRef = useRef<Set<string>>(new Set());

  // Read session data passed from Work Export
  useEffect(() => {
    const wrapDraft = sessionStorage.getItem("ew-wrap-draft");
    const wrapTitle = sessionStorage.getItem("ew-wrap-title");
    const wrapOutputType = sessionStorage.getItem("ew-wrap-output-type");
    const wrapOutputId = sessionStorage.getItem("ew-wrap-output-id");
    const wrapFormats = sessionStorage.getItem("ew-wrap-formats");

    if (wrapDraft) {
      const sessionOutput: OutputItem = {
        id: wrapOutputId || "session-draft",
        title: wrapTitle || "Untitled",
        content: wrapDraft,
        output_type: wrapOutputType || "freestyle",
        created_at: new Date().toISOString(),
        score: 0,
      };
      setSessionDraft(sessionOutput);

      if (wrapFormats) {
        try {
          const parsed = JSON.parse(wrapFormats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFormats(parsed);
            setActiveFormat(parsed[0]);
          }
        } catch { /* use defaults */ }
      }

      setLoading(false);
      sessionStorage.removeItem("ew-wrap-draft");
      sessionStorage.removeItem("ew-wrap-title");
      sessionStorage.removeItem("ew-wrap-output-type");
      sessionStorage.removeItem("ew-wrap-output-id");
      sessionStorage.removeItem("ew-wrap-formats");
    }
  }, []);

  // Fetch outputs from Supabase (fallback)
  const fetchOutputs = useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("outputs")
      .select("id, title, content, output_type, created_at, score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error("[Wrap] Fetch error:", error);
        setOutputs((data as OutputItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!sessionDraft) fetchOutputs();
  }, [fetchOutputs, location.key, sessionDraft]);

  // Active content
  const activeOutput = sessionDraft || (outputs.length > 0 ? outputs[0] : null);
  const hasContent = !!activeOutput;

  // Adapt format via API
  const adaptFormat = useCallback(async (format: string) => {
    if (!activeOutput?.content || !user) return;
    if (adaptingRef.current.has(format)) return;
    adaptingRef.current.add(format);

    setFormatContents(prev => ({ ...prev, [format]: { content: "", metadata: {}, status: "loading" } }));

    try {
      const res = await fetch(`${API_BASE}/api/adapt-format`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: activeOutput.content,
          format,
          voiceDnaMd: "",
          brandDnaMd: "",
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error(`Adapt error ${res.status}`);
      const data = await res.json();

      setFormatContents(prev => ({
        ...prev,
        [format]: {
          content: data.content || activeOutput.content,
          metadata: data.metadata || {},
          status: "done",
        },
      }));
    } catch (err) {
      console.error("[Wrap] adapt error:", err);
      setFormatContents(prev => ({
        ...prev,
        [format]: { content: activeOutput.content, metadata: {}, status: "error" },
      }));
    } finally {
      adaptingRef.current.delete(format);
    }
  }, [activeOutput, user]);

  // Auto-adapt first format when content loads
  useEffect(() => {
    if (!activeOutput?.content) return;
    const entry = formatContents[activeFormat];
    if (!entry || entry.status === "pending") {
      adaptFormat(activeFormat);
    }
  }, [activeOutput, activeFormat, formatContents, adaptFormat]);

  // Handle format tab change
  const handleFormatChange = useCallback((format: string) => {
    setActiveFormat(format);
    const entry = formatContents[format];
    if (!entry || entry.status === "pending") {
      adaptFormat(format);
    }
  }, [formatContents, adaptFormat]);

  // Prefill Reed
  const prefillReed = useCallback((text: string) => {
    setReedPrefill(text);
    setActiveDashTab("reed");
  }, [setReedPrefill, setActiveDashTab]);

  // Export all formats
  const handleExportAll = useCallback(async () => {
    if (!activeOutput || !user) return;
    setExporting(true);

    try {
      // Adapt any pending formats first
      const pendingFormats = formats.filter(f => {
        const entry = formatContents[f];
        return !entry || entry.status !== "done";
      });
      for (const fmt of pendingFormats) {
        await adaptFormat(fmt);
      }

      // Save to Supabase
      if (activeOutput.id !== "session-draft") {
        await supabase.from("outputs").update({
          content_state: "vault",
          published_at: new Date().toISOString(),
        }).eq("id", activeOutput.id);
      }

      setExported(true);
      toast("All formats exported and saved.");
    } catch (err) {
      console.error("[Wrap] export error:", err);
      toast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  }, [activeOutput, user, formats, formatContents, adaptFormat, toast]);

  // Copy adapted content for active format
  const handleCopy = useCallback(() => {
    const textToCopy = formatContents[activeFormat]?.content || activeOutput?.content || "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast(`${activeFormat} version copied.`);
    }).catch(() => {});
  }, [activeFormat, formatContents, activeOutput, toast]);

  // Right panel dashboard
  useLayoutEffect(() => {
    setDashOpen(true);
    if (hasContent) {
      setFeedbackContent(
        <WrapDashPanel
          outputType={activeOutput?.output_type || "freestyle"}
          formatCount={formats.length}
          onExportAll={handleExportAll}
          exported={exported}
          exporting={exporting}
          prefillReed={prefillReed}
        />
      );
    } else {
      setFeedbackContent(null);
    }
    return () => setFeedbackContent(null);
  }, [activeOutput, formats, exported, exporting, hasContent, handleExportAll, prefillReed, setDashOpen, setFeedbackContent]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 13, fontFamily: FONT }}>Loading...</div>;
  }

  if (!hasContent) {
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
          Complete a Work session and export your content.
        </div>
        <button onClick={() => nav("/studio/work")} style={{
          padding: "10px 24px", borderRadius: 8,
          background: "var(--gold-bright, #F5C642)", border: "none",
          color: "var(--fg)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: FONT,
        }}>Go to Work</button>
        {outputs.length > 0 && (
          <button onClick={() => nav("/studio/outputs")} style={{
            marginTop: 12, background: "none", border: "none",
            fontSize: 12, color: "var(--fg-3)", cursor: "pointer",
            fontFamily: FONT, textDecoration: "underline",
          }}>Or select from your library</button>
        )}
      </div>
    );
  }

  // Display content: use adapted version if available, else raw
  const formatEntry = formatContents[activeFormat];
  const displayContent = formatEntry?.content || activeOutput.content || "";
  const displayMetadata = formatEntry?.metadata || {};
  const isAdapting = formatEntry?.status === "loading";
  const contentTitle = activeOutput.title || "Untitled";
  const contentParas = displayContent ? displayContent.split("\n").filter(Boolean) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
      {/* ── Format Tabs ── */}
      <div style={{
        display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)",
        padding: "0 20px", flexShrink: 0, background: "var(--bg)", overflowX: "auto",
      }}>
        {formats.map(fmt => (
          <button key={fmt} onClick={() => handleFormatChange(fmt)} style={{
            fontSize: 11, fontWeight: activeFormat === fmt ? 600 : 500,
            color: activeFormat === fmt ? "var(--fg)" : "var(--fg-3)",
            padding: "11px 14px",
            borderBottom: activeFormat === fmt ? "2px solid var(--fg)" : "2px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap" as const,
            transition: "all 0.1s", background: "none", border: "none",
            borderBottomStyle: "solid" as const, fontFamily: FONT,
          }}>{fmt}</button>
        ))}
      </div>

      {/* ── Content Preview ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: isMobile ? "24px 20px" : "32px 40px",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 580 }}>
          {isAdapting ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 13, color: "var(--fg-3)", animation: "pulse 2s ease-in-out infinite" }}>
                Adapting for {activeFormat}...
              </div>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
            </div>
          ) : contentParas.length > 0 ? (
            <>
              {/* Metadata (subject line, preview text) */}
              {displayMetadata.subject && (
                <div style={{ marginBottom: displayMetadata.preview ? 4 : 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.08em" }}>SUBJECT: </span>
                  <span style={{ fontSize: 11, color: "var(--fg)" }}>{displayMetadata.subject}</span>
                </div>
              )}
              {displayMetadata.preview && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.08em" }}>PREVIEW: </span>
                  <span style={{ fontSize: 11, color: "var(--fg-2)" }}>{displayMetadata.preview}</span>
                </div>
              )}

              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px", lineHeight: 1.3 }}>
                {contentTitle}
              </h1>
              {contentParas.map((p, i) => (
                <p key={i} style={{ fontSize: 13, lineHeight: 1.75, color: "var(--fg-2)", margin: 0, marginTop: i > 0 ? 12 : 0 }}>{p}</p>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <button onClick={handleCopy} style={{
                  fontSize: 11, padding: "6px 16px", borderRadius: 5,
                  border: "1px solid var(--line)", background: "var(--surface)",
                  color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT, fontWeight: 500,
                }}>{copied ? "Copied" : "Copy"}</button>
                <button onClick={() => {
                  sessionStorage.setItem("ew-reopen-output-id", activeOutput.id);
                  sessionStorage.setItem("ew-reopen-title", activeOutput.title);
                  nav("/studio/work");
                }} style={{
                  fontSize: 11, padding: "6px 16px", borderRadius: 5,
                  border: "none", background: "var(--fg)", color: "var(--surface)",
                  cursor: "pointer", fontFamily: FONT, fontWeight: 600,
                }}>Reopen in Work</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 28, color: "var(--gold, #F5C642)", marginBottom: 14 }}>&#10022;</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>Ready to wrap {activeFormat}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 16 }}>Choose a template in the dashboard, then hit Wrap it.</div>
              <button onClick={() => adaptFormat(activeFormat)} style={{
                fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 6,
                background: "var(--fg)", border: "none", color: "var(--surface)",
                cursor: "pointer", fontFamily: FONT,
              }}>Adapt for {activeFormat}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
