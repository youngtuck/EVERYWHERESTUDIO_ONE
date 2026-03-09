import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface Output {
  id: string;
  title: string;
  output_type: string;
  score: number;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  essay: "#4A90D9", newsletter: "#50c8a0", presentation: "#F5A623",
  social: "#a080f5", podcast: "#F5C642", video: "#e85d75",
  sunday_story: "#F5C642", freestyle: "#4A90D9",
  linkedin_post: "#4A90D9", podcast_script: "#F5C642", twitter_thread: "#a080f5",
  substack_note: "#50c8a0", talk_outline: "#F5A623", email_campaign: "#0D8C9E",
  blog_post: "#4A90D9", executive_brief: "#6b4dd4", short_video: "#e85d75",
};

const TYPE_LABELS: Record<string, string> = {
  essay: "Essay", newsletter: "Newsletter", presentation: "Presentation",
  social: "Social", podcast: "Podcast", video: "Video",
  sunday_story: "Sunday Story", freestyle: "Freestyle",
  linkedin_post: "LinkedIn Post", podcast_script: "Podcast Script", twitter_thread: "Twitter Thread",
  substack_note: "Substack Note", talk_outline: "Talk Outline", email_campaign: "Email Campaign",
  blog_post: "Blog Post", executive_brief: "Executive Brief", short_video: "Short Video",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function OutputLibrary() {
  const navigate = useNavigate();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("outputs")
      .select("id, title, output_type, score, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOutputs(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = outputs.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.output_type === filter;
    return matchSearch && matchFilter;
  });

  const scoreColor = (s: number) => s >= 900 ? "#50c8a0" : s >= 800 ? "#4A90D9" : "#F5C642";

  return (
    <div style={{ padding: "0", maxWidth: "var(--studio-content-max)", margin: "0 auto", fontFamily: "var(--font)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--studio-gap)" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 4 }}>Outputs</h1>
          <p style={{ fontSize: 13, color: "var(--fg-3)", fontWeight: 400 }}>{outputs.length} pieces produced</p>
        </div>
        <button onClick={() => navigate("/studio/work/new")} className="btn-primary" style={{ padding: "9px 18px" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >New Session</button>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "var(--studio-gap-sm)", marginBottom: "var(--studio-gap)" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: .4 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search outputs…"
            className="input-field"
            style={{ paddingLeft: 32 }}
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field" style={{ minWidth: 120 }}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--gold, #C8961A)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading outputs…
        </div>
      ) : (
      <>
        {outputs.length === 0 ? (
          <div style={{ padding: 48, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
            <div
              className="card"
              style={{
                maxWidth: 420,
                width: "100%",
                padding: "32px 28px 28px",
                position: "relative",
                overflow: "hidden",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  opacity: 0.35,
                }}
              >
                <span
                  style={{
                    fontSize: 72,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.06)",
                    letterSpacing: "-0.08em",
                  }}
                >
                  0
                </span>
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>
                  Nothing here yet
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--fg-3)",
                    lineHeight: 1.6,
                    maxWidth: 320,
                    margin: "0 auto 20px",
                  }}
                >
                  Every output you create with Watson will appear here, scored and ready to use.
                </p>
                <button
                  onClick={() => navigate("/studio/work/new")}
                  className="btn-primary"
                  style={{ padding: "12px 24px" }}
                >
                  Start your first session
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map(o => (
              <button key={o.id} onClick={() => navigate(`/studio/outputs/${o.id}`)} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "none", border: "none", borderRadius: "var(--studio-radius)", padding: "12px 12px",
                cursor: "pointer", textAlign: "left", fontFamily: "var(--font)", width: "100%",
                transition: "background .12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[o.output_type] || "#4A90D9", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", fontWeight: 400, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                <span style={{ fontSize: 11, color: "var(--fg-3)", width: 90, flexShrink: 0 }}>{TYPE_LABELS[o.output_type] || o.output_type}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(o.score), width: 42, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{o.score}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                  background: "rgba(80,200,160,.1)",
                  color: "#50c8a0",
                  border: "1px solid rgba(80,200,160,.2)",
                }}>saved</span>
                <span style={{ fontSize: 11, color: "var(--fg-3)", width: 48, textAlign: "right", flexShrink: 0 }}>{formatDate(o.created_at)}</span>
              </button>
            ))}
            {filtered.length === 0 && outputs.length > 0 && (
              <div style={{ padding: "48px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
                No outputs match your search.
              </div>
            )}
          </div>
        )}
      </>
      )}
    </div>
  );
}
