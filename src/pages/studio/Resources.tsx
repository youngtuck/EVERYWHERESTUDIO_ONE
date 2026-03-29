/**
 * Resources.tsx — Project Files
 * Matches wireframe v7.23 exactly.
 * Lists project files; selecting one opens detail in the dashboard panel.
 */
import { useState, useLayoutEffect } from "react";
import { useShell } from "../../components/studio/StudioShell";
import "./shared.css";

interface ProjectFile {
  id: string;
  title: string;
  meta: string;
  status: "Active" | "Inactive";
  detail: string;
}

const PROJECT_FILES: ProjectFile[] = [
  {
    id: "f1",
    title: "Voice DNA",
    meta: "John Gilmore · v2 · Updated Mar 2026",
    status: "Active",
    detail: "The voice signature for John Gilmore. Three-layer model: Voice Markers, Value Markers, Personality Markers. Plus subconscious markers including pronoun dominance and sentence-opening habits. Last updated March 2026.",
  },
  {
    id: "f2",
    title: "Brand Guide",
    meta: "dougcrawfordcoaching.com · Uploaded Feb 2026",
    status: "Active",
    detail: "Brand colors, typography, tone rules, and forbidden language for John Gilmore Coaching. Includes logo usage, primary palette, and the voice rules that govern all published content.",
  },
  {
    id: "f3",
    title: "Maui Studiomind Framework",
    meta: "Methodology · Uploaded Jan 2026",
    status: "Active",
    detail: "The core coaching methodology. Used to ground all content in the proprietary framework. Referenced in every piece to ensure alignment with the Studiomind approach.",
  },
];

function FileDetailPanel({ file }: { file: ProjectFile }) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 3 }}>{file.title}</div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 10 }}>{file.meta}</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.65 }}>{file.detail}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: "var(--font)" }}>View file</button>
          <button style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: "var(--font)" }}>Replace file</button>
          <button style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)", fontSize: 11, color: "var(--danger)", cursor: "pointer", fontFamily: "var(--font)" }}>Remove from project</button>
        </div>
      </div>
    </>
  );
}

export default function Resources() {
  const { setDashContent, setDashOpen } = useShell();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedFile = PROJECT_FILES.find(f => f.id === selectedId) ?? null;

  useLayoutEffect(() => {
    if (selectedFile) {
      setDashOpen(true);
      setDashContent(<FileDetailPanel file={selectedFile} />);
    } else {
      setDashOpen(false);
      setDashContent(
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>Select a file to see details.</div>
      );
    }
    return () => setDashContent(null);
  }, [selectedFile, setDashContent, setDashOpen]);

  const FileRow = ({ file }: { file: ProjectFile }) => {
    const active = selectedId === file.id;
    return (
      <div
        onClick={() => setSelectedId(file.id)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 4px", borderBottom: "1px solid var(--line)",
          cursor: "pointer", borderRadius: 5,
          background: active ? "rgba(245,198,66,0.06)" : "transparent",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(245,198,66,0.06)" : "transparent"; }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: active ? "var(--fg)" : "var(--fg-2)", fontWeight: 500, marginBottom: 2 }}>{file.title}</div>
          <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{file.meta}</div>
        </div>
        <span style={{ fontSize: 9, color: "var(--blue)", fontWeight: 600, whiteSpace: "nowrap" as const }}>{file.status}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: 20, fontFamily: "var(--font)", maxWidth: 680 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Project Files</div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 10 }}>
        {PROJECT_FILES.map(file => <FileRow key={file.id} file={file} />)}
      </div>

      {/* Upload area */}
      <div style={{
        marginTop: 10, border: "1px dashed var(--line-2)",
        borderRadius: 7, padding: 16, textAlign: "center" as const, cursor: "pointer",
        transition: "border-color 0.12s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-2)"; }}
      >
        <svg style={{ width: 20, height: 20, stroke: "var(--line-2)", strokeWidth: 1.75, fill: "none", margin: "0 auto 8px", display: "block" }} viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={{ fontSize: 11, color: "var(--fg-3)" }}>
          <span style={{ color: "var(--blue)", fontWeight: 600 }}>Upload a file</span> — PDF, doc, deck, or any reference
        </p>
      </div>
    </div>
  );
}
