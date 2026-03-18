import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("outputs")
      .select("id, title, output_type, score, created_at")
      .eq("user_id", user.id)
      .gte("score", 900)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOutputs((data as Output[]) ?? []);
        setLoading(false);
      });
  }, [user]);

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
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "#4A90D9" }}>{s.role}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", fontSize: 14, color: "var(--text-secondary)" }}>
          Loading...
        </div>
      ) : outputs.length === 0 ? (
        <div
          style={{
            background: "var(--surface-white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Nothing ready for Wrap yet
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 24,
              maxWidth: 400,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Content needs a Betterish score of 900+ to enter Wrap. Start a session with Watson to create something worth publishing.
          </p>
          <button
            onClick={() => navigate("/studio/work")}
            style={{
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
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Start Session
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
                  padding: "16px 20px",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 12,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
                  e.currentTarget.style.boxShadow = "none";
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
                    <div style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
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
                    {o.score}
                  </span>
                  <button
                    onClick={() => navigate(`/studio/outputs/${o.id}`)}
                    title="Review and publish this output"
                    style={{
                      background: "var(--gold-dark)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Afacad Flux', sans-serif",
                      whiteSpace: "nowrap",
                      transition: "opacity 0.15s ease",
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
    </div>
  );
}
