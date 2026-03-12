import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Globe, FileText, Presentation, Pencil, Clipboard } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";
import type { BetterishScore, GateResult } from "../../lib/agents/types";
import { GateResultsPanel } from "../../components/pipeline/GateResultsPanel";
import { BetterishScoreCard } from "../../components/pipeline/BetterishScoreCard";
import { PipelineBlockedAlert } from "../../components/pipeline/PipelineBlockedAlert";

interface Output {
  id: string;
  title: string;
  content: string;
  output_type: string;
  score: number;
  created_at: string;
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
        fontFamily: "'DM Sans', sans-serif",
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
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 10,
  background: "#fff",
  fontSize: 13,
  fontWeight: 500,
  color: "#1a1a1a",
  cursor: "pointer" as const,
  transition: "all 0.2s ease",
  fontFamily: "'DM Sans', sans-serif",
};

const iconStyle = { width: 16, height: 16, color: "rgba(0,0,0,0.4)", flexShrink: 0 };

export default function OutputDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [pipelineRun, setPipelineRun] = useState<PipelineRunRow | null>(null);

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
    await navigator.clipboard.writeText(output.content);
    showToast("Copied!");
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
        <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;font-family:'DM Sans',sans-serif;">
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

    const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titleEscaped}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #fff; color: #1a1a1a; line-height: 1.7; margin: 0; padding: 0 24px 48px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .wordmark { font-size: 11px; letter-spacing: 0.12em; color: rgba(0,0,0,0.35); margin-bottom: 32px; }
    h1 { font-size: 28px; font-weight: 700; margin: 0 0 24px; letter-spacing: -0.02em; }
    h2 { font-size: 20px; font-weight: 600; margin: 32px 0 16px; padding-top: 8px; }
    h3 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; }
    p { margin: 0 0 16px; }
    a { color: #3A7BD5; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.06); font-size: 12px; color: rgba(0,0,0,0.4); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="wordmark">EVERYWHERE Studio</div>
    <h1>${titleEscaped}</h1>
    ${navHtml}
    <div class="content">${contentHtml}</div>
    <div class="footer">Composed Intelligence</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlString], { type: "text/html" });
    window.open(URL.createObjectURL(blob));
  }, [output]);

  const wrapAsGoogleDoc = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output.content);
    window.open("https://docs.google.com/document/create", "_blank");
    showToast("Content copied. Paste into your new Google Doc.");
  }, [output, showToast]);

  const wrapAsWordDoc = useCallback(() => {
    if (!output) return;
    const contentHtml = simpleMarkdownToHtml(output.content);
    const titleEscaped = escapeHtml(output.title);
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;max-width:6.5in;margin:1in;}h1{font-size:18pt;margin-bottom:12pt;}h2{font-size:14pt;margin-top:18pt;margin-bottom:8pt;}h3{font-size:12pt;margin-top:14pt;margin-bottom:6pt;}p{margin-bottom:8pt;}</style></head><body><h1>${titleEscaped}</h1>${contentHtml}</body></html>`;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.title.replace(/[^\w\s-]/g, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const wrapAsSlideDeck = useCallback(() => {
    showToast("Slide deck export coming soon.");
  }, [showToast]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
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
    output!.score >= 800
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
    if (v >= 80) return "#10b981";
    if (v >= 65) return "#3A7BD5";
    return "#C8961A";
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: isMobile ? "24px 16px" : "40px 32px",
        fontFamily: "'DM Sans', sans-serif",
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
            color: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(0,0,0,0.4)"; }}
        >
          <ArrowLeft size={16} /> The Vault
        </button>
        <button
          onClick={() => navigate(`/studio/work/new?type=${output!.output_type}`)}
          style={{
            border: "1px solid rgba(0,0,0,0.1)",
            background: "transparent",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            cursor: "pointer",
            color: "rgba(0,0,0,0.4)",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(0,0,0,0.4)"; }}
        >
          New Session
        </button>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {output!.title}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 14,
            color: "rgba(0,0,0,0.6)",
            lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif",
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
      </div>

      {/* WRAP AS toolbar */}
      <div
        style={{
          borderTop: "1px solid rgba(0,0,0,0.06)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "20px 0",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(0,0,0,0.3)",
            marginBottom: 12,
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          WRAP AS
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            onClick={wrapAsWebPage}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Globe style={iconStyle} /> Web Page
          </button>
          <button
            onClick={wrapAsGoogleDoc}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FileText style={iconStyle} /> Google Doc
          </button>
          <button
            onClick={wrapAsWordDoc}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FileText style={iconStyle} /> Word Doc
          </button>
          <button
            onClick={wrapAsSlideDeck}
            style={{ ...pillBase, position: "relative" as const, opacity: 0.5 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 8,
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(0,0,0,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              Soon
            </span>
            <Presentation style={iconStyle} /> Slide Deck
          </button>
          <button
            onClick={() => navigate(`/studio/wrap/visual/${output!.id}`)}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Pencil style={iconStyle} /> Visual
          </button>
          <button
            onClick={copyText}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Clipboard style={iconStyle} /> Copy Text
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="card"
        style={{ padding: isMobile ? "20px 16px" : "32px 36px" }}
      >
        <pre
          style={{
            fontFamily: "var(--font)",
            fontSize: isMobile ? 14 : 15,
            lineHeight: 1.8,
            color: "var(--fg)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
          }}
        >
          {output!.content}
        </pre>
      </div>

      {pipelineRun && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <BetterishScoreCard score={pipelineRun.betterish_score} />
          <GateResultsPanel results={pipelineRun.gate_results} blockedAt={pipelineRun.blocked_at || undefined} />
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

      {/* Quality gates */}
      {gateEntries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {gates?.summary && (
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-2)",
                marginBottom: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {gates.summary}
            </p>
          )}
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
                      fontFamily: "'DM Sans', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
