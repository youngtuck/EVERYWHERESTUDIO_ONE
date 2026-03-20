import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Globe, FileText, Pencil, Clipboard } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";
import { useAuth } from "../../context/AuthContext";
import type { BetterishScore, GateResult } from "../../lib/agents/types";
import { CheckpointResultsPanel } from "../../components/pipeline/CheckpointResultsPanel";
import { BetterishScoreCard } from "../../components/pipeline/BetterishScoreCard";
import { PipelineBlockedAlert } from "../../components/pipeline/PipelineBlockedAlert";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:var(--fg)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;color:var(--fg)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:26px;font-weight:700;margin:32px 0 16px;color:var(--fg)">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--cornflower);padding-left:16px;margin:16px 0;color:var(--fg-2);font-style:italic">$1</blockquote>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px">')
    .replace(/\n/g, '<br/>');
}

interface Output {
  id: string;
  title: string;
  content: string;
  output_type: string;
  score: number;
  created_at: string;
  project_id?: string | null;
  gates?: {
    strategy?: number;
    voice?: number;
    accuracy?: number;
    ai_tells?: number;
    audience?: number;
    platform?: number;
    impact?: number;
    total?: number;
    summary?: string;
    [key: string]: unknown;
  } | null;
}

interface PipelineRunRow {
  status: "PASSED" | "BLOCKED" | "ERROR";
  gate_results: GateResult[];
  betterish_score: BetterishScore | null;
  blocked_at: string | null;
}

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.25s ease",
        background: "#1a1a1a",
        color: "#fff",
        padding: "10px 24px",
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'Afacad Flux', sans-serif",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}

// ─── Markdown / HTML helpers ────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function simpleMarkdownToHtml(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^###\s/.test(line)) {
      if (inParagraph) {
        out.push("</p>");
        inParagraph = false;
      }
      out.push(`<h3>${line.replace(/^###\s*/, "").trim()}</h3>`);
      continue;
    }
    if (/^##\s/.test(line)) {
      if (inParagraph) {
        out.push("</p>");
        inParagraph = false;
      }
      out.push(`<h2>${line.replace(/^##\s*/, "").trim()}</h2>`);
      continue;
    }
    if (/^#\s/.test(line)) {
      if (inParagraph) {
        out.push("</p>");
        inParagraph = false;
      }
      out.push(`<h1>${line.replace(/^#\s*/, "").trim()}</h1>`);
      continue;
    }

    if (trimmed === "") {
      if (inParagraph) {
        out.push("</p>");
        inParagraph = false;
      }
      continue;
    }

    let content = trimmed;
    content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    content = content.replace(/\*(.+?)\*/g, "<em>$1</em>");
    content = content.replace(/_(.+?)_/g, "<em>$1</em>");

    if (!inParagraph) {
      out.push("<p>");
      inParagraph = true;
    } else {
      out.push("<br/>");
    }
    out.push(content);
  }
  if (inParagraph) out.push("</p>");
  return out.join("");
}

function getHeadingsFromMarkdown(content: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const lineRe = /^##\s+(.+)$/gm;
  let m;
  while ((m = lineRe.exec(content)) !== null) {
    const text = m[1].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (id) headings.push({ id, text });
  }
  return headings;
}

const pillBase = {
  display: "inline-flex" as const,
  alignItems: "center" as const,
  gap: 8,
  padding: "10px 20px",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  background: "var(--surface-white)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--fg)",
  cursor: "pointer" as const,
  transition: "all 0.2s ease",
  fontFamily: "'Afacad Flux', sans-serif",
};

const iconStyle = { width: 16, height: 16, color: "var(--fg-3)", flexShrink: 0 };

const REFORMAT_TYPES = [
  "Essay",
  "Podcast",
  "Newsletter",
  "Social",
  "Video Script",
  "Presentation",
  "Book",
  "Business",
  "Freestyle",
];

export default function OutputDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();
  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [pipelineRun, setPipelineRun] = useState<PipelineRunRow | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [reformatting, setReformatting] = useState(false);
  const [reformatType, setReformatType] = useState<string | null>(null);

  // Project assignment
  const [userProjects, setUserProjects] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name").eq("user_id", user.id).then(({ data }) => {
      if (data) setUserProjects(data);
    });
  }, [user]);

  const moveToProject = async (projectId: string) => {
    if (!output) return;
    await supabase.from("outputs").update({ project_id: projectId }).eq("id", output.id);
    setOutput({ ...output, project_id: projectId });
    showToast(`Moved to ${userProjects.find(p => p.id === projectId)?.name || "project"}`);
  };

  // Inline editing state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRescore, setShowRescore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteOutput = async () => {
    if (!output || !user) return;
    await supabase.from("pipeline_runs").delete().eq("output_id", output.id);
    await supabase.from("outputs").delete().eq("id", output.id).eq("user_id", user.id);
    showToast("Output deleted");
    navigate("/studio/outputs");
  };
  const [rescoring, setRescoring] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const startEditing = () => {
    setEditContent(output!.content);
    setEditing(true);
    setHasUnsavedChanges(false);
    setTimeout(() => editRef.current?.focus(), 100);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditContent("");
    setHasUnsavedChanges(false);
  };

  const saveEdits = async () => {
    if (!output || !editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("outputs")
      .update({ content: editContent.trim() })
      .eq("id", output.id);
    setSaving(false);
    if (!error) {
      setOutput({ ...output, content: editContent.trim() });
      setEditing(false);
      setHasUnsavedChanges(false);
      setShowRescore(true);
      showToast("Content updated");
    } else {
      showToast("Save failed. Try again.");
    }
  };

  const handleRescore = async () => {
    if (!output || !user) return;
    setRescoring(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationSummary: output.content, outputType: output.output_type, userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const newScore = data.score ?? output.score;
        await supabase.from("outputs").update({ score: newScore, gates: data.gates ?? null }).eq("id", output.id);
        setOutput({ ...output, score: newScore, gates: data.gates ?? output.gates });
        setShowRescore(false);
        showToast(`Score updated: ${newScore}`);
      }
    } catch {}
    setRescoring(false);
  };

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  }, []);

  useEffect(() => {
    if (!id || id === "new") {
      setLoading(false);
      setNotFound(true);
      return;
    }
    supabase
      .from("outputs")
      .select("*")
      .eq("id", id)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setOutput(data);
        // Load most recent pipeline run for this output, if any
        const { data: runs } = await supabase
          .from("pipeline_runs")
          .select("status, gate_results, betterish_score, blocked_at")
          .eq("output_id", id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (runs && runs.length > 0) {
          setPipelineRun(runs[0] as PipelineRunRow);
        }
        setLoading(false);
      });
  }, [id]);

  const copyText = useCallback(async () => {
    if (!output) return;
    // Strip basic markdown to plain text
    const plain = output.content
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1");
    await navigator.clipboard.writeText(plain);
    showToast("Copied to clipboard");
  }, [output, showToast]);

  const wrapAsWebPage = useCallback(() => {
    if (!output) return;
    let contentHtml = simpleMarkdownToHtml(output.content);
    const headings = getHeadingsFromMarkdown(output.content);
    const titleEscaped = escapeHtml(output.title);

    // Add id attributes to h2s for nav anchors
    headings.forEach(({ id, text }) => {
      const escapedText = escapeHtml(text);
      contentHtml = contentHtml.replace(
        new RegExp(`<h2>${escapedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h2>`, "i"),
        `<h2 id="${id}">${escapedText}</h2>`
      );
    });

    const navHtml =
      headings.length > 0
        ? `
    <nav style="position:sticky;top:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(0,0,0,0.06);padding:12px 0;margin-bottom:24px;z-index:10;">
      <div style="max-width:720px;margin:0 auto;padding:0 24px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;font-family:'Afacad Flux', sans-serif;">
          ${headings
            .map(
              (h) =>
                `<a href="#${h.id}" style="color:rgba(0,0,0,0.6);text-decoration:none;">${escapeHtml(h.text)}</a>`
            )
            .join("")}
        </div>
      </div>
    </nav>`
        : "";

    const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
    const dateStr = new Date(output.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titleEscaped}</title>
  <meta property="og:title" content="${titleEscaped}">
  <meta property="og:type" content="article">
  <meta property="og:description" content="${escapeHtml(output.content.slice(0, 160))}">
  <link href="https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Afacad Flux', -apple-system, sans-serif; background: #0D1B2A; color: #F0F0EE; line-height: 1.7; margin: 0; padding: 0; }
    .header { padding: 32px 24px 0; max-width: 720px; margin: 0 auto; }
    .wordmark { font-size: 12px; letter-spacing: -1px; text-transform: uppercase; margin-bottom: 40px; display: inline-flex; align-items: baseline; }
    .wordmark .ew { color: #4A90D9; font-weight: 700; }
    .wordmark .st { color: #F5C642; font-weight: 300; }
    .wordmark .tm { color: #F5C642; font-size: 6px; vertical-align: top; margin-left: 2px; }
    h1 { font-size: 32px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.02em; color: #fff; }
    .meta { font-size: 14px; color: rgba(240,240,238,0.4); margin-bottom: 32px; }
    .content-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px 48px; }
    .content { font-size: 16px; line-height: 1.7; color: rgba(240,240,238,0.85); }
    .content h2 { font-size: 22px; font-weight: 600; margin: 36px 0 16px; color: #fff; }
    .content h3 { font-size: 18px; font-weight: 600; margin: 28px 0 12px; color: #fff; }
    .content p { margin: 0 0 18px; }
    .content a { color: #4A90D9; }
    .footer { max-width: 720px; margin: 0 auto; padding: 32px 24px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: rgba(240,240,238,0.3); }
    @media(max-width:640px) { h1 { font-size: 24px; } .content { font-size: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="wordmark"><span class="ew">EVERYWHERE</span><span class="st">STUDIO<span class="tm">™</span></span></div>
    <h1>${titleEscaped}</h1>
    <div class="meta">${authorName ? escapeHtml(String(authorName)) + " &middot; " : ""}${dateStr}</div>
  </div>
  ${navHtml}
  <div class="content-wrap">
    <div class="content">${contentHtml}</div>
  </div>
  <div class="footer">Made with EVERYWHERE Studio</div>
</body>
</html>`;

    setPreviewHtml(htmlString);
  }, [output]);

  const wrapAsGoogleDoc = useCallback(async () => {
    if (!output) return;
    const html = `<h1>${escapeHtml(output.title)}</h1>${simpleMarkdownToHtml(output.content)}`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([output.content], { type: "text/plain" }),
        }),
      ]);
      showToast("Rich text copied. Open Google Docs and paste.");
    } catch {
      await navigator.clipboard.writeText(output.content);
      showToast("Content copied. Open Google Docs and paste.");
    }
  }, [output, showToast]);

  const wrapAsWordDoc = useCallback(() => {
    if (!output) return;
    const contentHtml = simpleMarkdownToHtml(output.content);
    const titleEscaped = escapeHtml(output.title);
    const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "EVERYWHERE Studio";
    const dateStr = new Date(output.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8">
<style>
  body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;max-width:6.5in;margin:1in;}
  h1{font-size:18pt;margin-bottom:6pt;}
  h2{font-size:14pt;margin-top:18pt;margin-bottom:8pt;}
  h3{font-size:12pt;margin-top:14pt;margin-bottom:6pt;}
  p{margin-bottom:8pt;}
  .meta{font-size:10pt;color:#666;margin-bottom:18pt;}
  .footer{margin-top:36pt;padding-top:12pt;border-top:1px solid #ddd;font-size:9pt;color:#999;}
</style></head>
<body>
  <h1>${titleEscaped}</h1>
  <div class="meta">${escapeHtml(String(authorName))} &middot; ${dateStr}</div>
  ${contentHtml}
  <div class="footer">Created with EVERYWHERE Studio</div>
</body></html>`;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.title.replace(/[^\w\s-]/g, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Word document downloaded");
  }, [output, user, showToast]);

  const handleReformat = useCallback(async (selectedType: string) => {
    if (!output || reformatting) return;
    setReformatting(true);
    setReformatType(selectedType);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationSummary: output.content,
          outputType: selectedType,
          userId: user?.id,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      const { error: saveError, data: saved } = await supabase
        .from("outputs")
        .insert({
          title: data.title || `${output.title} (${selectedType})`,
          content: data.content || data.text || "",
          output_type: selectedType.toLowerCase().replace(/\s+/g, "_"),
          score: data.score ?? 0,
          user_id: user?.id,
          gates: data.gates ?? null,
        })
        .select("id")
        .single();
      if (saveError || !saved) throw new Error("Failed to save output");
      showToast(`${selectedType} created!`);
      navigate(`/studio/output/${saved.id}`);
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.");
    } finally {
      setReformatting(false);
      setReformatType(null);
    }
  }, [output, reformatting, user, showToast, navigate]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid var(--gold, #C8961A)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (notFound)
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "var(--fg-3)", marginBottom: 16 }}>Output not found.</p>
        <button
          className="btn-ghost"
          onClick={() => navigate("/studio/outputs")}
        >
          Back to The Vault
        </button>
      </div>
    );

  const scoreColor =
    output!.score >= 900
      ? "#10b981"
      : output!.score >= 700
        ? "#3A7BD5"
        : "#C8961A";
  const gates =
    output!.gates && typeof output!.gates === "object" ? output!.gates : null;

  const gateEntries = gates
    ? [
        { key: "strategy", label: "Strategy", value: gates.strategy as number | undefined },
        { key: "voice", label: "Voice", value: gates.voice as number | undefined },
        { key: "accuracy", label: "Accuracy", value: gates.accuracy as number | undefined },
        { key: "ai_tells", label: "AI Tells", value: gates.ai_tells as number | undefined },
        { key: "audience", label: "Audience", value: gates.audience as number | undefined },
        { key: "platform", label: "Platform", value: gates.platform as number | undefined },
        { key: "impact", label: "Impact", value: gates.impact as number | undefined },
      ].filter((g) => typeof g.value === "number")
    : [];

  const gateBarColor = (v: number) => {
    if (v >= 80) return "#50c8a0";
    if (v >= 60) return "#4A90D9";
    return "#E53935";
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: isMobile ? "24px 16px" : "40px 32px",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      {/* Header: back link + New Session */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <button
          onClick={() => navigate("/studio/outputs")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            fontFamily: "'Afacad Flux', sans-serif",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          <ArrowLeft size={16} /> The Vault
        </button>
        <button
          onClick={() => navigate(`/studio/work/new?type=${output!.output_type}`)}
          style={{
            border: "1px solid var(--border-default)",
            background: "transparent",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            cursor: "pointer",
            color: "var(--fg-3)",
            fontFamily: "'Afacad Flux', sans-serif",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          New Session
        </button>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--fg)",
              letterSpacing: "-0.02em",
              margin: 0,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            {output!.title}
          </h1>
          {!editing && (
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={startEditing}
                title="Edit content directly"
                style={{
                  background: "none",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--fg-3)",
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--fg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--fg-3)"; }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => navigate("/studio/work", {
                  state: {
                    reviseOutputId: output!.id,
                    reviseContent: output!.content,
                    reviseTitle: output!.title,
                    reviseType: output!.output_type,
                    reviseScore: output!.score,
                  },
                })}
                title="Revise this content with Watson"
                style={{
                  background: "var(--gold-dark)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0D1B2A",
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Revise with Watson
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--danger)", fontFamily: "'Afacad Flux', sans-serif", padding: "6px 0", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Delete output
              </button>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 14,
            color: "var(--fg-2)",
            lineHeight: 1.25,
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          <span style={{ textTransform: "capitalize" }}>
            {output!.output_type.replace("_", " ")}
          </span>
          <span>
            {new Date(output!.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span style={{ fontWeight: 700, color: scoreColor }}>
            Score: {output!.score}
          </span>
        </div>
        {userProjects.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Project:</span>
            <select
              value={output!.project_id || ""}
              onChange={(e) => moveToProject(e.target.value)}
              style={{
                fontSize: 12, fontFamily: "'Afacad Flux', sans-serif", color: "var(--fg-2)",
                background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: 6,
                padding: "4px 8px", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">Unassigned</option>
              {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* WRAP AS toolbar */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "20px 0",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--fg-3)",
            marginBottom: 12,
            textTransform: "uppercase",
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          WRAP AS
        </div>
        <div
          className="wrap-as-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            onClick={wrapAsWebPage}
            title="Open as a standalone web page"
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Globe style={iconStyle} /> Web Page
          </button>
          <button
            onClick={wrapAsGoogleDoc}
            title="Copy content and open Google Docs"
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FileText style={iconStyle} /> Google Doc
          </button>
          <button
            onClick={wrapAsWordDoc}
            title="Download as a Word document"
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FileText style={iconStyle} /> Word Doc
          </button>
          <button
            onClick={() => navigate(`/studio/wrap/visual/${output!.id}`)}
            title="Open in the visual editor"
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Pencil style={iconStyle} /> Visual
          </button>
          <button
            onClick={copyText}
            title="Copy content to clipboard"
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Clipboard style={iconStyle} /> Copy Text
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {editing ? (
          <>
            {/* Edit toolbar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              padding: "10px 16px",
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-2)" }}>Editing</span>
                {hasUnsavedChanges && (
                  <span style={{ fontSize: 12, color: "var(--gold-dark)", fontStyle: "italic" }}>Unsaved changes</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-subtle)",
                    background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--fg-3)",
                    cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdits}
                  disabled={saving || !hasUnsavedChanges}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "none",
                    background: hasUnsavedChanges ? "var(--gold-dark)" : "var(--bg-3)",
                    color: hasUnsavedChanges ? "#0D1B2A" : "var(--fg-3)",
                    fontSize: 13, fontWeight: 700, cursor: hasUnsavedChanges ? "pointer" : "default",
                    fontFamily: "'Afacad Flux', sans-serif",
                  }}
                >
                  {saving ? "Saving..." : "Save edits"}
                </button>
              </div>
            </div>
            {/* Textarea editor */}
            <textarea
              ref={editRef}
              value={editContent}
              onChange={(e) => { setEditContent(e.target.value); setHasUnsavedChanges(true); }}
              style={{
                width: "100%",
                minHeight: 400,
                padding: isMobile ? "20px 16px" : "32px 36px",
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 15,
                lineHeight: 1.25,
                color: "var(--fg)",
                background: "var(--surface-white)",
                border: "1px solid var(--cornflower)",
                borderRadius: 8,
                resize: "vertical",
                outline: "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
            {/* Word/char count */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 8, fontSize: 12, color: "var(--fg-3)" }}>
              <span>{editContent.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>{editContent.length} characters</span>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: isMobile ? "20px 16px" : "32px 36px" }}>
            <div
              style={{
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.25,
                color: "var(--text-primary)",
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(output!.content) }}
            />
          </div>
        )}

        {/* Re-score prompt after editing */}
        {showRescore && !editing && (
          <div style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "rgba(74,144,217,0.06)",
            borderLeft: "3px solid var(--cornflower)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>
              Content edited. Re-score to update your Betterish score.
            </span>
            <button
              type="button"
              onClick={handleRescore}
              disabled={rescoring}
              style={{
                padding: "6px 16px", borderRadius: 6, border: "none",
                background: "var(--cornflower)", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: rescoring ? "default" : "pointer",
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              {rescoring ? "Scoring..." : "Re-score"}
            </button>
          </div>
        )}
      </div>

      {pipelineRun && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <BetterishScoreCard score={pipelineRun.betterish_score} />
          <CheckpointResultsPanel results={pipelineRun.gate_results} blockedAt={pipelineRun.blocked_at || undefined} />
          {pipelineRun.status === "BLOCKED" && (
            <PipelineBlockedAlert
              blockedAt={pipelineRun.blocked_at || undefined}
              feedback={
                pipelineRun.gate_results.find((g) => g.status === "FAIL")?.feedback ||
                pipelineRun.gate_results[pipelineRun.gate_results.length - 1]?.feedback
              }
            />
          )}
        </div>
      )}

      {/* Quality checkpoints */}
      {gateEntries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {gates?.summary && (
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-2)",
                marginBottom: 14,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              {gates.summary}
            </p>
          )}
          <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 11, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#50c8a0", flexShrink: 0 }} />
              80+ Strong
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#4A90D9", flexShrink: 0 }} />
              60-79 Developing
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#E53935", flexShrink: 0 }} />
              Below 60 Needs work
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gateEntries.map(({ key, label, value }) => {
              const v = value as number;
              const cl = gateBarColor(v);
              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 90,
                      fontSize: 12,
                      color: "var(--fg-3)",
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: "var(--bg-3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, v))}%`,
                        background: cl,
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 40,
                      textAlign: "right",
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                      color: cl,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    {v}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Web Preview (inline) */}
      {previewHtml && (
        <div style={{ marginTop: 24, maxWidth: 680, margin: "24px auto 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Web Preview</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  const blob = new Blob([previewHtml!], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${output!.title.replace(/[^\w\s-]/g, "")}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("HTML file downloaded");
                }}
                style={{ background: "none", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif" }}
              >
                Download HTML
              </button>
              <button onClick={() => setPreviewHtml(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)" }}>Close</button>
            </div>
          </div>
          <iframe
            srcDoc={previewHtml}
            title="Output preview"
            style={{ width: "100%", height: 600, border: "1px solid var(--border-subtle)", borderRadius: 12, background: "var(--surface-white)" }}
            sandbox="allow-same-origin"
          />
        </div>
      )}

      {/* Produce in another format */}
      <div style={{ marginTop: 32, maxWidth: 680, margin: "32px auto 0" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--fg-3)",
            marginBottom: 12,
            textTransform: "uppercase",
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          PRODUCE IN ANOTHER FORMAT
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {REFORMAT_TYPES.map((t) => (
            <button
              key={t}
              disabled={reformatting}
              onClick={() => handleReformat(t)}
              style={{
                ...pillBase,
                fontSize: 12,
                padding: "7px 14px",
                opacity: reformatting && reformatType !== t ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!reformatting) {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {reformatting && reformatType === t ? "Generating..." : t}
            </button>
          ))}
        </div>
      </div>

      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: "var(--surface-white)", borderRadius: 12, padding: 24, maxWidth: 400, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>Delete this output?</p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 20 }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--surface-white)", cursor: "pointer", fontSize: 14, fontFamily: "'Afacad Flux', sans-serif" }}>Cancel</button>
              <button type="button" onClick={handleDeleteOutput} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "var(--danger)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'Afacad Flux', sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
