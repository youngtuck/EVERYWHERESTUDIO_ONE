import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

// Match OutputLibrary ids; add body + project for detail view
const OUTPUTS: Record<string, { title: string; type: string; score: number; date: string; status: "draft" | "published"; project: string }> = {
  "1": { title: "Why most advice is wrong about delegation", type: "essay", score: 847, date: "Mar 8", status: "published", project: "Thought Leadership" },
  "2": { title: "The interview before the essay", type: "newsletter", score: 912, date: "Mar 7", status: "published", project: "My Studio" },
  "3": { title: "TEDx talk outline: composed intelligence", type: "presentation", score: 788, date: "Mar 6", status: "draft", project: "My Studio" },
  "4": { title: "LinkedIn thread: AI tells to eliminate", type: "social", score: 861, date: "Mar 5", status: "published", project: "Thought Leadership" },
  "5": { title: "Podcast episode 14: the authenticity gap", type: "podcast", score: 893, date: "Mar 4", status: "published", project: "My Studio" },
  "6": { title: "Sunday Story: the conversation I almost avoided", type: "sunday_story", score: 924, date: "Mar 2", status: "published", project: "Thought Leadership" },
  "7": { title: "What I know about slow thinking", type: "essay", score: 835, date: "Feb 28", status: "draft", project: "My Studio" },
  "8": { title: "Video script: one thing most consultants miss", type: "video", score: 802, date: "Feb 27", status: "draft", project: "My Studio" },
};

const TYPE_LABELS: Record<string, string> = {
  essay: "Essay", newsletter: "Newsletter", presentation: "Presentation",
  social: "Social", podcast: "Podcast", video: "Video",
  sunday_story: "Sunday Story", freestyle: "Freestyle",
};

const LOREM_BODY = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla facilisi. Ut convallis, sem sit amet interdum consectetuer, odio augue aliquam leo, nec molestie tortor nibh sit amet orci. Maecenas tempus tellus eget condimentum rhoncus. Aenean vel massa quis mauris vehicula lacinia.`;

function scoreColor(score: number) {
  return score >= 900 ? "#10b981" : score >= 800 ? "#3A7BD5" : score >= 700 ? "#C8961A" : score >= 500 ? "#9ca3af" : "#ef4444";
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 32, height: 3, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${score / 10}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}

export default function OutputDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const output = id ? OUTPUTS[id] : null;
  const body = LOREM_BODY;
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const copyToClipboard = () => {
    const text = `${output?.title ?? "Output"}\n\n${body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!output) {
    return (
      <div style={{ padding: "var(--studio-page-pad)", fontFamily: "var(--font)" }}>
        <button onClick={() => navigate("/studio/outputs")} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Outputs
        </button>
        <p style={{ color: "var(--fg-3)", fontSize: 15 }}>Output not found.</p>
      </div>
    );
  }

  const typeLabel = TYPE_LABELS[output.type] ?? output.type;

  return (
    <div style={{ minHeight: "100%", fontFamily: "var(--font)", display: "flex", flexDirection: "column" }}>
      {/* Header bar: back, title, score badge, status pill, Publish */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 0 20px",
        borderBottom: "1px solid var(--line)",
        marginBottom: "var(--studio-gap)",
        flexWrap: "wrap",
      }}>
        <button
          onClick={() => navigate("/studio/outputs")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: "var(--studio-radius)",
            background: "var(--bg-2)", border: "1px solid var(--line)",
            cursor: "pointer", color: "var(--fg-2)",
          }}
          aria-label="Back to outputs"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 style={{
          flex: 1, minWidth: 0, fontSize: 18, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {output.title}
        </h1>
        <ScoreBadge score={output.score} />
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100,
          background: output.status === "published" ? "rgba(16,185,129,0.12)" : "var(--bg-2)",
          color: output.status === "published" ? "#10b981" : "var(--fg-3)",
          border: `1px solid ${output.status === "published" ? "rgba(16,185,129,0.25)" : "var(--line)"}`,
        }}>
          {output.status}
        </span>
        <button
          className="btn-primary"
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600 }}
          onClick={() => {}}
          disabled={output.status === "published"}
        >
          {output.status === "published" ? "Published" : "Publish"}
        </button>
      </header>

      {/* Main + sidebar layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "var(--studio-gap-lg)", alignItems: "start" }}>
        {/* Full-width document view */}
        <article className="card" style={{ padding: "var(--studio-gap-lg)", border: "1px solid var(--line)", overflow: "hidden" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.2 }}>
            {output.title}
          </h2>
          <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--fg-2)", whiteSpace: "pre-wrap" }}>
            {body}
          </div>
        </article>

        {/* Right sidebar 280px */}
        <aside className="card" style={{ padding: "var(--studio-gap)", border: "1px solid var(--line)", position: "sticky", top: "var(--studio-gap)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 4 }}>Type</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{typeLabel}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 4 }}>Word count</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{wordCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 4 }}>Date created</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{output.date}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 4 }}>Project</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{output.project}</div>
            </div>
            <button
              onClick={copyToClipboard}
              className="btn-ghost"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
