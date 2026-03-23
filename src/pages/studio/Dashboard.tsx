import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import { getScoreColor } from "../../utils/scoreColor";
import "./shared.css";
import LoadingAnimation from "../../components/studio/LoadingAnimation";
import "./dashboard.css";

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
    essay: "ES",
    podcast: "PO",
    podcast_script: "PO",
    social: "SO",
    newsletter: "NL",
    sunday_story: "SU",
    freestyle: "FR",
    linkedin_post: "LI",
    twitter_thread: "TW",
    substack_note: "SB",
    talk_outline: "TO",
    email_campaign: "EM",
    blog_post: "BL",
    executive_brief: "EX",
    short_video: "SV",
    presentation: "PR",
    video: "VI",
  };
  return map[outputType] || outputType.slice(0, 2).toUpperCase();
}

function typeToLabel(outputType: string): string {
  return outputType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const QUICK_START = [
  { key: "essay", label: "Sunday Story (Essay)", subtitle: "Weekly reflection in your voice" },
  { key: "podcast", label: "Get Current (Podcast)", subtitle: "One focused conversation per episode" },
  { key: "socials", label: "Signal Sweep (Socials)", subtitle: "Multi-platform posts from one idea" },
  { key: "newsletter", label: "Field Notes (Newsletter)", subtitle: "Story-forward update to your list" },
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
  const [hasWatchTopics, setHasWatchTopics] = useState(false);
  const [signalCount, setSignalCount] = useState<number | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    try { return localStorage.getItem("ew-welcome-dismissed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    Promise.all([
      supabase
        .from("outputs")
        .select("id, title, output_type, score, gates, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, sentinel_topics").eq("id", user.id).single(),
      supabase.from("sentinel_briefings").select("signals_count").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    ])
      .then(([outRes, profileRes, briefingRes]) => {
        if (outRes.error) throw outRes.error;
        setOutputs((outRes.data as OutputRow[]) || []);
        // Name now comes from AuthContext displayName
        setHasWatchTopics(Array.isArray(profileRes.data?.sentinel_topics) && profileRes.data.sentinel_topics.length > 0);
        setSignalCount(briefingRes?.data?.signals_count ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = displayName ? displayName.split(" ")[0] : "there";
  const inProgress = outputs.filter((o) => (o.score ?? 0) < 800);
  const vault = outputs.filter((o) => (o.score ?? 0) >= 800);
  const recentThree = outputs.slice(0, 3);
  const outputsCreated = outputs.length;
  const avgBetterish =
    outputs.length > 0
      ? Math.round(
          outputs.reduce((sum, o) => sum + (o.score || 0), 0) / outputs.length
        )
      : null;
  const withVoice = outputs.filter((o) => typeof o.gates?.voice === "number");
  const voiceFidelity =
    withVoice.length > 0
      ? withVoice.reduce((s, o) => s + (o.gates!.voice as number), 0) / withVoice.length
      : null;
  const voicePct =
    voiceFidelity != null && !Number.isNaN(voiceFidelity)
      ? Math.round(voiceFidelity)
      : null;
  const hasSignals = false; // no Watch data yet

  const transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

  if (error) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
          textAlign: "center",
          fontFamily: "'Afacad Flux', sans-serif",
          fontSize: 14,
          color: "var(--text-secondary)",
        }}
      >
        Could not load your dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div
      className="studio-page-transition"
      data-page="dashboard"
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "var(--font)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--fg-3)",
                marginBottom: 4,
              }}
            >
              {getDateLabel()}
            </div>
            <div
              style={{
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {getGreeting()}, {firstName}.
            </div>
          </div>
          <button
            onClick={() => nav("/studio/work")}
            title="Start a new Watson session with your idea"
            className="btn-gold cta-new-session"
            style={{
              background: "#F5C642",
              color: "#0D1B2A",
              padding: "12px 22px",
              borderRadius: 8,
              fontFamily: "var(--font)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e5b33a";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F5C642";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            + New Session
          </button>
        </div>
      </div>

      {/* Welcome section for first-run users */}
      {!loading && outputs.length === 0 && !welcomeDismissed && (
        <div style={{
          background: "var(--surface-white)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Welcome to your Studio, {firstName}.
          </h2>
          <p style={{ fontSize: 14, color: "var(--fg-3)", margin: "0 0 20px" }}>
            Three things to get started.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { title: "Train Your Voice", desc: "Upload writing samples so every output sounds like you.", href: "/onboarding?retrain=1" },
              { title: "Start a Session", desc: "Talk to Watson. One idea becomes publication-ready content.", href: "/studio/work" },
              { title: "Explore Resources", desc: "See what's already in your studio.", href: "/studio/resources" },
            ].map((card) => (
              <button
                key={card.title}
                onClick={() => nav(card.href)}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>{card.desc}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => { localStorage.setItem("ew-welcome-dismissed", "true"); setWelcomeDismissed(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            I'll explore on my own
          </button>
        </div>
      )}

      <div
        className="dashboard-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            isMobile && typeof window !== "undefined" && window.innerWidth < 480
              ? "1fr"
              : isMobile
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {!loading &&
          [
            {
              key: "outputs",
              label: "OUTPUTS",
              value: outputsCreated,
              subtitle:
                outputsCreated > 0 ? `${Math.min(outputsCreated, 99)} recent` : "Get started below",
              accent: "#4A90D9",
              color: "var(--text-primary)",
              tooltip: "Total pieces of content produced.",
            },
            {
              key: "avg",
              label: "AVG BETTERISH",
              value: avgBetterish ?? "—",
              subtitle:
                avgBetterish == null
                  ? "Complete a session"
                  : avgBetterish >= 800
                    ? "Publication ready"
                    : avgBetterish >= 700
                      ? "Getting close"
                      : "Room to improve",
              accent: "#F5C642",
              color: avgBetterish != null ? getScoreColor(avgBetterish).text : "var(--text-primary)",
              tooltip: "Average Betterish quality score. 800 is publication threshold.",
            },
            {
              key: "voice",
              label: "VOICE MATCH",
              value: voicePct != null ? `${voicePct}%` : "—",
              subtitle:
                voicePct == null
                  ? "Complete onboarding"
                  : voicePct >= 80
                    ? "Strong match"
                    : `Avg across ${withVoice.length} output${withVoice.length !== 1 ? "s" : ""}`,
              accent: "#4A90D9",
              color: "var(--text-primary)",
              tooltip: "Average voice match score across your generated content. See Voice DNA in Settings for your full voice profile.",
            },
            {
              key: "signals",
              label: "SIGNALS",
              value: signalCount != null ? signalCount : "—",
              subtitle: !hasWatchTopics
                ? "Set up Watch topics"
                : signalCount != null
                  ? `From latest briefing`
                  : "Briefing arrives at 7am",
              accent: signalCount != null ? "#4A90D9" : "rgba(0,0,0,0.1)",
              color: signalCount != null ? "var(--text-primary)" : "var(--text-tertiary)",
              tooltip: !hasWatchTopics
                ? "Configure Watch topics in Settings to activate Sentinel intelligence."
                : "Intelligence signals from your latest Sentinel briefing.",
            },
          ].map((stat, i) => (
            <div
              key={stat.key}
              title={stat.tooltip}
              className="dashboard-fade-up"
              style={{
                animationDelay: `${i * 50}ms`,
                opacity: 0,
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--fg-3)",
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: stat.color,
                    marginTop: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 12,
                    color: "var(--fg-3)",
                    marginTop: 6,
                    ...(stat.key === "signals" && !hasWatchTopics ? { color: "#4A90D9", cursor: "pointer", textDecoration: "underline" } : {}),
                  }}
                  onClick={stat.key === "signals" && !hasWatchTopics ? () => nav("/studio/settings") : undefined}
                >
                  {stat.subtitle}
                </div>
              </div>
              <div
                style={{
                  marginTop: 10,
                  height: 3,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.04)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    background: stat.accent,
                  }}
                />
              </div>
            </div>
          ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--fg-3)",
            }}
          >
            In progress
          </span>
          <button
            onClick={() => nav("/studio/outputs")}
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--gold-dark)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Open The Vault
          </button>
        </div>

        {loading ? null : inProgress.length === 0 ? (
          <div
            style={{
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            No work in progress.{" "}
            <button
              onClick={() => nav("/studio/work")}
              style={{
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--gold-dark)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Start session
            </button>
          </div>
        ) : (
          inProgress.slice(0, 3).map((o) => {
            const scoreStyle = getScoreColor(o.score);
            return (
              <button
                key={o.id}
                onClick={() => nav(`/studio/outputs/${o.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.8)",
                      color: "#fff",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {typeToBadge(o.output_type)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--text-primary, #1a1a1a)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.title.length > 50 ? o.title.slice(0, 50) + "…" : o.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 12,
                        color: "var(--fg-3)",
                        marginTop: 2,
                      }}
                    >
                      {typeToLabel(o.output_type)} · {timeAgo(o.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 16,
                      fontWeight: 500,
                      color: scoreStyle.text,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {o.score}
                  </span>
                  <ChevronRight size={14} style={{ color: "rgba(0,0,0,0.2)" }} />
                </div>
              </button>
            );
          })
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--fg-3)",
            marginBottom: 10,
          }}
        >
          Create
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile && typeof window !== "undefined" && window.innerWidth < 640
                ? "1fr"
                : "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {QUICK_START.map(({ key, label, subtitle }) => (
            <button
              key={key}
              onClick={() => nav(`/studio/work?type=${key}`)}
              style={{
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,0,0,0.16)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 12,
                  color: "var(--fg-3)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {hasSignals && (
        <button
          onClick={() => nav("/studio/watch")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: 16,
            background: "var(--surface-white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Sentinel Briefing
            </div>
            <div style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Latest signal summary
            </div>
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      )}
    </div>
  );
}
