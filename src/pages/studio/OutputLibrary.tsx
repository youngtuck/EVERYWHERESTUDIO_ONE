import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import { getScoreColor } from "../../utils/scoreColor";
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
};

export default function OutputLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let query = supabase
      .from("outputs")
      .select("id, title, output_type, score, created_at")
      .order("created_at", { ascending: false });
    if (user) query = query.eq("user_id", user.id);
    query.then(({ data }) => {
      setOutputs(data ?? []);
      setLoading(false);
    });
  }, [user]);

  const filtered = outputs.filter((o) => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.output_type === filter;
    return matchSearch && matchFilter;
  });

  const transition = "all 0.15s ease";

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Outputs
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            {outputs.length} pieces produced
          </p>
        </div>
        <button
          onClick={() => navigate("/studio/work")}
          style={{
            background: "var(--text-primary)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          New Session
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outputs..."
            style={{
              width: "100%",
              padding: "10px 16px 10px 40px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--text-primary)",
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              outline: "none",
              transition,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--gold-dark)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            minWidth: 140,
            padding: "10px 36px 10px 16px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--text-primary)",
            background: "var(--surface-white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            appearance: "none",
            cursor: "pointer",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4.5L6 8L10 4.5' stroke='%239B9B9B' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Output List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="studio-skeleton"
              style={{
                height: 56,
                marginBottom: 0,
                borderBottom: "1px solid var(--border-subtle)",
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: "80px 0",
            textAlign: "center",
          }}
        >
          <FileText size={32} style={{ color: "var(--text-tertiary)" }} />
          <h2
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            No outputs yet
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Start a session with Watson to create your first piece.
          </p>
          <button
            onClick={() => navigate("/studio/work")}
            style={{
              marginTop: 20,
              background: "var(--gold-dark)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-light)";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--gold-dark)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Start Session
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((o) => {
            const sc = getScoreColor(o.score);
            return (
              <button
                key={o.id}
                onClick={() => navigate(`/studio/outputs/${o.id}`)}
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  borderTop: filtered[0]?.id === o.id ? "1px solid var(--border-subtle)" : "none",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  background: "transparent",
                  borderLeft: "none",
                  borderRight: "none",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.015)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: sc.fill,
                    flexShrink: 0,
                    marginRight: 16,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.title}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "var(--text-tertiary)",
                    width: 120,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {TYPE_LABELS[o.output_type] || o.output_type}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: sc.text,
                    width: 48,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {o.score}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 4,
                    background: "rgba(58, 154, 92, 0.1)",
                    color: "#3A9A5C",
                    width: 56,
                    textAlign: "center",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  saved
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    width: 72,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {timeAgo(o.created_at)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
