import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getScoreColor } from "../../utils/scoreColor";
import { timeAgo } from "../../utils/timeAgo";
import "./shared.css";

interface Output {
  id: string;
  title: string;
  output_type: string;
  score: number;
  created_at: string;
  content?: string;
}

const TYPE_LABELS: Record<string, string> = {
  essay: "Essay",
  newsletter: "Newsletter",
  presentation: "Presentation",
  social: "Social",
  podcast: "Podcast",
  podcast_script: "Podcast Script",
  video: "Video",
  sunday_story: "Sunday Story",
  freestyle: "Freestyle",
  linkedin_post: "LinkedIn Post",
  twitter_thread: "Twitter Thread",
  substack_note: "Substack Note",
  talk_outline: "Talk Outline",
  email_campaign: "Email Campaign",
  blog_post: "Blog Post",
  executive_brief: "Executive Brief",
  short_video: "Short Video",
  book: "Book",
  website: "Website",
  video_script: "Video Script",
  socials: "Socials",
  business: "Business",
};

export default function Wrap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const outputIdParam = searchParams.get("outputId");
  const isExpressMode = searchParams.get("express") === "true";

  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [expressContent, setExpressContent] = useState("");
  const [wrapOutput, setWrapOutput] = useState<Output | null>(null);

  // Load specific output if outputId is provided
  useEffect(() => {
    if (outputIdParam && user) {
      supabase
        .from("outputs")
        .select("*")
        .eq("id", outputIdParam)
        .single()
        .then(({ data }) => {
          if (data) {
            setWrapOutput(data as Output);
          }
          setLoading(false);
        });
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (isExpressMode) {
      setLoading(false);
      return;
    }

    // Load all completed outputs (no score gate)
    supabase
      .from("outputs")
      .select("id, title, output_type, score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setOutputs((data as Output[]) ?? []);
        setLoading(false);
      });
  }, [user, outputIdParam, isExpressMode]);

  const goldBtn: React.CSSProperties = {
    background: "var(--gold-dark)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Afacad Flux', sans-serif",
    transition: "opacity 0.15s ease",
  };

  return (
    <div
      className="studio-page-transition"
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Wrap
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.6,
          }}
        >
          Final polish and delivery. Three specialists refine your content before it ships.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { name: "Byron", role: "Humanization", desc: "Adds natural rhythm, personality, and the human touches that AI misses" },
            { name: "Mira", role: "Format", desc: "Structures content for the specific output format and reading context" },
            { name: "Dmitri", role: "Platform", desc: "Optimizes for the target platform's conventions and audience expectations" },
          ].map((s) => (
            <div
              key={s.name}
              style={{
                flex: "1 1 200px",
                padding: "12px 14px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>{s.role}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Express mode: paste/upload content directly */}
      {isExpressMode && !wrapOutput && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "32px 24px",
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Paste or upload the content you want to visualize.
          </p>
          <textarea
            value={expressContent}
            onChange={(e) => setExpressContent(e.target.value)}
            placeholder="Paste your content here..."
            style={{
              width: "100%",
              minHeight: 200,
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--fg)",
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />
          <button
            onClick={() => {
              if (!expressContent.trim()) return;
              // TODO: Pass content to KAI visual generation
              navigate("/studio/wrap");
            }}
            disabled={!expressContent.trim()}
            style={{
              ...goldBtn,
              opacity: expressContent.trim() ? 1 : 0.5,
              cursor: expressContent.trim() ? "pointer" : "default",
            }}
          >
            Create Visual
          </button>
        </div>
      )}

      {/* Single output loaded by ID */}
      {wrapOutput && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{wrapOutput.title}</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>
                {TYPE_LABELS[wrapOutput.output_type] || wrapOutput.output_type}
                {wrapOutput.score ? ` · ${Math.round(wrapOutput.score / 10)}%` : ""}
              </div>
            </div>
            <button
              onClick={() => navigate(`/studio/outputs/${wrapOutput.id}`)}
              style={goldBtn}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Wrap and publish
            </button>
          </div>
          {wrapOutput.content && (
            <div style={{
              padding: 16,
              background: "var(--bg)",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--fg)",
              whiteSpace: "pre-wrap",
            }}>
              {wrapOutput.content}
            </div>
          )}
        </div>
      )}

      {/* Output list (no express, no single output) */}
      {!isExpressMode && !wrapOutput && (
        <>
          {loading ? (
            <div style={{ padding: "40px 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Loading...
            </div>
          ) : outputs.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 18, color: "var(--fg-2)", marginBottom: 8 }}>
                No content ready for Wrap yet.
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--fg-3)",
                  marginBottom: 24,
                  maxWidth: 400,
                  marginLeft: "auto",
                  marginRight: "auto",
                  lineHeight: 1.6,
                }}
              >
                Finish a session in Work and click "Move to Wrap," or paste content directly below.
              </p>
              <button
                onClick={() => navigate("/studio/work")}
                style={goldBtn}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Start a session
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {outputs.map((o) => {
                const sc = getScoreColor(o.score);
                return (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 24px",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>
                          {TYPE_LABELS[o.output_type] || o.output_type} · {timeAgo(o.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: "'Afacad Flux', sans-serif",
                          fontSize: 16,
                          fontWeight: 500,
                          color: sc.text,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {Math.round(o.score / 10)}%
                      </span>
                      <button
                        onClick={() => navigate(`/studio/outputs/${o.id}`)}
                        title="Review and publish this output"
                        style={{
                          ...goldBtn,
                          padding: "8px 16px",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                      >
                        Wrap and publish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
