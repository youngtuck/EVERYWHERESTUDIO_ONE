import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import { getScoreColor } from "../../utils/scoreColor";
import "./shared.css";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();
}

function typeToBadge(outputType: string): string {
  const map: Record<string, string> = {
    essay: "ES", podcast: "PO", podcast_script: "PO", social: "SO",
    newsletter: "NL", sunday_story: "SU", freestyle: "FR",
    linkedin_post: "LI", presentation: "PR", video: "VI",
  };
  return map[outputType] || outputType.slice(0, 2).toUpperCase();
}

function typeToLabel(outputType: string): string {
  return outputType.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

const QUICK_START = [
  { key: "essay", label: "Sunday Story" },
  { key: "podcast", label: "Podcast" },
  { key: "book", label: "Book" },
  { key: "website", label: "Website" },
  { key: "video_script", label: "Video Script" },
  { key: "newsletter", label: "Newsletter" },
  { key: "social", label: "Social Post" },
  { key: "presentation", label: "Presentation" },
  { key: "business", label: "Business" },
  { key: "freestyle", label: "Freestyle" },
];

interface OutputRow {
  id: string;
  title: string;
  output_type: string;
  score: number;
  created_at: string;
  gates?: { voice?: number; [key: string]: unknown } | null;
}

export default function Dashboard() {
  const nav = useNavigate();
  const isMobile = useMobile();
  const { user, displayName } = useAuth();

  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    try { return localStorage.getItem("ew-welcome-dismissed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("outputs")
          .select("id, title, output_type, score, gates, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (err) { setError(true); return; }
        setOutputs((data as OutputRow[]) || []);
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const firstName = displayName ? displayName.split(" ")[0] : "there";

  if (error) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px", textAlign: "center", fontFamily: "'Afacad Flux', sans-serif", fontSize: 15, color: "var(--fg-3)" }}>
        Could not load your dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "32px 20px" : "48px 24px", fontFamily: "'Afacad Flux', sans-serif" }}>

      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>
          {getDateLabel()}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {getGreeting()}, {firstName}.
        </h1>
      </div>

      {/* Watson input area */}
      <div
        onClick={() => nav("/studio/work")}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "16px 20px",
          cursor: "text",
          marginBottom: 16,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <span style={{ fontSize: 15, color: "var(--fg-3)" }}>What do you want to work on?</span>
      </div>

      {/* Output type pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {QUICK_START.map(qs => (
          <button
            key={qs.key}
            onClick={() => nav(`/studio/work?type=${qs.key}`)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--fg-2)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
          >
            {qs.label}
          </button>
        ))}
      </div>

      {/* Spacer below input */}
      <div style={{ marginBottom: 48 }} />

      {/* Welcome section for first-time users */}
      {!loading && outputs.length === 0 && !welcomeDismissed && (
        <div style={{ position: "relative", marginBottom: 48, padding: 32, background: "linear-gradient(135deg, rgba(200, 150, 26, 0.04) 0%, rgba(107, 127, 242, 0.03) 100%)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <button onClick={() => { localStorage.setItem("ew-welcome-dismissed", "true"); setWelcomeDismissed(true); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>x</button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px" }}>
            Welcome to EVERYWHERE Studio.
          </h2>
          <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: 560, margin: "0 0 20px" }}>You talk. Watson listens. Then 40 specialists turn what you said into publication-ready content. Every word yours. Every claim verified.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { title: "Train Your Voice", desc: "Upload writing samples so every output sounds like you.", href: "/onboarding?retrain=1" },
              { title: "Start a Session", desc: "Talk to Watson. One idea becomes publication-ready content.", href: "/studio/work" },
              { title: "Explore Resources", desc: "See what's already in your studio.", href: "/studio/resources" },
            ].map(card => (
              <button
                key={card.title}
                onClick={() => nav(card.href)}
                style={{
                  background: "var(--bg-2)", border: "1px solid var(--line)",
                  borderRadius: 8, padding: 16, textAlign: "left", cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif", transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>{card.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => { localStorage.setItem("ew-welcome-dismissed", "true"); setWelcomeDismissed(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            I'll explore on my own
          </button>
        </div>
      )}

      {/* Recent Work */}
      {!loading && outputs.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.04em", textTransform: "uppercase" as const, margin: 0 }}>
              Recent Work
            </h2>
            <button
              onClick={() => nav("/studio/outputs")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif", transition: "color 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-3)"; }}
            >
              View all
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {outputs.slice(0, 8).map(o => {
              const sc = getScoreColor(o.score);
              return (
                <button
                  key={o.id}
                  onClick={() => nav(`/studio/outputs/${o.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line)",
                    background: "transparent", border: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
                    cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif",
                    width: "100%", textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Type badge */}
                  <span style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: "var(--bg-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "var(--fg-3)",
                    letterSpacing: "0.04em", flexShrink: 0,
                  }}>
                    {typeToBadge(o.output_type)}
                  </span>
                  {/* Title */}
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {o.title}
                  </span>
                  {/* Score */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: sc.text, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {o.score}
                  </span>
                  {/* Time */}
                  <span style={{ fontSize: 12, color: "var(--fg-3)", flexShrink: 0, width: 60, textAlign: "right" as const }}>
                    {timeAgo(o.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--fg-3)", fontSize: 14 }}>
          Loading...
        </div>
      )}

      {/* Empty state (after welcome dismissed) */}
      {!loading && outputs.length === 0 && welcomeDismissed && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 15, color: "var(--fg-3)", marginBottom: 16 }}>No outputs yet. Start a session to create your first piece.</p>
          <button
            onClick={() => nav("/studio/work")}
            style={{
              background: "var(--gold)", color: "white", border: "none",
              borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Start a Session
          </button>
        </div>
      )}
    </div>
  );
}
