import { useParams, useNavigate } from "react-router-dom";
import { Settings, Plus } from "lucide-react";

// Match Projects list; add outputs and watch config per project
const PROJECTS: Record<string, {
  name: string;
  desc: string;
  outputsCount: number;
  avgScore: number;
  lastActive: string;
  outputs: { id: string; title: string; type: string; score: number; date: string; status: "draft" | "published" }[];
  watchIndustries: string[];
  watchTopics: string[];
  watchPeople: string[];
}> = {
  "1": {
    name: "My Studio",
    desc: "General thought leadership content",
    outputsCount: 10,
    avgScore: 881,
    lastActive: "Mar 7",
    outputs: [
      { id: "1", title: "Why most advice is wrong about delegation", type: "essay", score: 847, date: "Mar 8", status: "published" },
      { id: "2", title: "The interview before the essay", type: "newsletter", score: 912, date: "Mar 7", status: "published" },
      { id: "4", title: "LinkedIn thread: AI tells to eliminate", type: "social", score: 861, date: "Mar 5", status: "published" },
      { id: "5", title: "Podcast episode 14: the authenticity gap", type: "podcast", score: 893, date: "Mar 4", status: "published" },
      { id: "6", title: "Sunday Story: the conversation I almost avoided", type: "sunday_story", score: 924, date: "Mar 2", status: "published" },
    ],
    watchIndustries: ["AI & Technology", "Content Strategy"],
    watchTopics: ["thought leadership", "AI content", "newsletter growth"],
    watchPeople: ["Ann Handley", "Lenny Rachitsky"],
  },
  "2": {
    name: "TEDx Content",
    desc: "TEDx Santa Barbara 2026 talk and surrounding content",
    outputsCount: 4,
    avgScore: 921,
    lastActive: "Feb 15",
    outputs: [
      { id: "3", title: "TEDx talk outline: composed intelligence", type: "presentation", score: 788, date: "Mar 6", status: "draft" },
      { id: "7", title: "What I know about slow thinking", type: "essay", score: 835, date: "Feb 28", status: "draft" },
    ],
    watchIndustries: ["Speaking", "Conferences"],
    watchTopics: ["TEDx", "keynote", "public speaking"],
    watchPeople: ["Chris Anderson"],
  },
  "3": {
    name: "Book Project",
    desc: "Working title: The Orchestrated Life",
    outputsCount: 2,
    avgScore: 0,
    lastActive: "Jan 12",
    outputs: [
      { id: "8", title: "Video script: one thing most consultants miss", type: "video", score: 802, date: "Feb 27", status: "draft" },
    ],
    watchIndustries: ["Publishing", "Non-fiction"],
    watchTopics: ["book launch", "author platform"],
    watchPeople: [],
  },
};

const TYPE_COLORS: Record<string, string> = {
  essay: "#4A90D9", newsletter: "#50c8a0", presentation: "#F5A623",
  social: "#a080f5", podcast: "#F5C642", video: "#e85d75",
  sunday_story: "#F5C642", freestyle: "#4A90D9",
};

const TYPE_LABELS: Record<string, string> = {
  essay: "Essay", newsletter: "Newsletter", presentation: "Presentation",
  social: "Social", podcast: "Podcast", video: "Video",
  sunday_story: "Sunday Story", freestyle: "Freestyle",
};

function scoreColor(s: number) {
  return s >= 900 ? "#50c8a0" : s >= 800 ? "#4A90D9" : "#F5C642";
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = id ? PROJECTS[id] : null;

  if (!project) {
    return (
      <div style={{ padding: "var(--studio-page-pad)", fontFamily: "var(--font)" }}>
        <button onClick={() => navigate("/studio/projects")} className="btn-ghost" style={{ marginBottom: 24 }}>
          ← Back to Projects
        </button>
        <p style={{ color: "var(--fg-3)", fontSize: 15 }}>Project not found.</p>
      </div>
    );
  }

  const { name, desc, outputsCount, avgScore, lastActive, outputs, watchIndustries, watchTopics, watchPeople } = project;

  return (
    <div style={{ maxWidth: "var(--studio-content-max)", margin: "0 auto", fontFamily: "var(--font)", paddingBottom: "var(--studio-gap-lg)" }}>
      {/* Header: name, description, settings */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: "var(--studio-gap-lg)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            {name}
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.5, margin: 0 }}>
            {desc}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {}}
          aria-label="Project settings"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: "var(--studio-radius)",
            border: "1px solid var(--line)", background: "var(--bg-2)",
            cursor: "pointer", color: "var(--fg-2)",
          }}
        >
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--studio-gap)", marginBottom: "var(--studio-gap-lg)" }}>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>Total outputs</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em" }}>{outputsCount}</div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>Avg Betterish score</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: avgScore > 0 ? scoreColor(avgScore) : "var(--fg-3)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {avgScore > 0 ? avgScore : "—"}
          </div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6 }}>Last active</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em" }}>{lastActive}</div>
        </div>
      </div>

      {/* Outputs section */}
      <section style={{ marginBottom: "var(--studio-gap-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Outputs</h2>
          <button
            type="button"
            onClick={() => navigate("/studio/work")}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13 }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Output
          </button>
        </div>
        <div className="card" style={{ overflow: "hidden", border: "1px solid var(--line)" }}>
          {outputs.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
              No outputs in this project yet. Click &quot;New Output&quot; to create one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {outputs.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/studio/outputs/${o.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "none", border: "none", borderBottom: "1px solid var(--line)",
                    padding: "12px 16px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font)", width: "100%",
                    transition: "background .12s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[o.type] || "#4A90D9", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-3)", width: 90, flexShrink: 0 }}>{TYPE_LABELS[o.type] || o.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(o.score), width: 42, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{o.score}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                    background: o.status === "published" ? "rgba(80,200,160,.1)" : "rgba(255,255,255,.06)",
                    color: o.status === "published" ? "#50c8a0" : "var(--fg-3)",
                    border: `1px solid ${o.status === "published" ? "rgba(80,200,160,.2)" : "var(--line)"}`,
                  }}>{o.status}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-3)", width: 48, textAlign: "right", flexShrink: 0 }}>{o.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Watch Configuration (read-only pills) */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em", marginBottom: 14 }}>Watch Configuration</h2>
        <div className="card" style={{ padding: "var(--studio-gap)", border: "1px solid var(--line)" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>Industries</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {watchIndustries.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--fg-3)" }}>None configured</span>
              ) : (
                watchIndustries.map((p, i) => (
                  <span key={i} style={{
                    display: "inline-block", padding: "5px 12px", borderRadius: 20,
                    background: "var(--bg-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--fg-2)",
                  }}>{p}</span>
                ))
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>Topics & keywords</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {watchTopics.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--fg-3)" }}>None configured</span>
              ) : (
                watchTopics.map((p, i) => (
                  <span key={i} style={{
                    display: "inline-block", padding: "5px 12px", borderRadius: 20,
                    background: "var(--bg-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--fg-2)",
                  }}>{p}</span>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>People to watch</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {watchPeople.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--fg-3)" }}>None configured</span>
              ) : (
                watchPeople.map((p, i) => (
                  <span key={i} style={{
                    display: "inline-block", padding: "5px 12px", borderRadius: 20,
                    background: "var(--bg-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--fg-2)",
                  }}>{p}</span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
