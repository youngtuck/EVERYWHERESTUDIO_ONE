import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import { getScoreColor } from "../../utils/scoreColor";
import "./shared.css";
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
  const { user } = useAuth();

  const [outputs, setOutputs] = useState<OutputRow[]>([]);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ])
      .then(([outRes, profileRes]) => {
        if (outRes.error) throw outRes.error;
        setOutputs((outRes.data as OutputRow[]) || []);
        if (profileRes.data?.full_name)
          setProfileName((profileRes.data.full_name as string).split(" ")[0] || null);
        else if (user.email) setProfileName(user.email.split("@")[0]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = profileName || "there";
  const inProgress = outputs.filter((o) => (o.score ?? 0) < 900);
  const vault = outputs.filter((o) => (o.score ?? 0) >= 900);
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
          fontFamily: "'DM Sans', sans-serif",
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
        maxWidth: 720,
        margin: "0 auto",
        padding: isMobile ? "24px 16px" : "24px 24px",
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
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-tertiary)",
                marginBottom: 4,
              }}
            >
              {getDateLabel()}
            </div>
            <div
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: isMobile ? 20 : 24,
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
            className="btn-gold cta-new-session"
            style={{
              background: "var(--gold-dark)",
              color: "#fff",
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
              e.currentTarget.style.background = "var(--gold-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--gold-dark)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            + New Output
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            isMobile && typeof window !== "undefined" && window.innerWidth < 480
              ? "1fr"
              : "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {!loading &&
          [
            {
              key: "outputs",
              label: "OUTPUTS CREATED",
              value: outputsCreated,
              tooltip: "Total pieces of content produced through Watson.",
              subtitle:
                outputsCreated > 0 ? `${Math.min(outputsCreated, 99)} recent` : "Get started below",
              accent: "var(--work-teal)",
              color: "var(--text-primary)",
            },
            {
              key: "avg",
              label: "AVG BETTERISH",
              value: avgBetterish ?? "—",
              tooltip: "Average quality score across outputs. 900 is publication threshold.",
              subtitle:
                avgBetterish == null
                  ? "Complete a session"
                  : avgBetterish >= 900
                    ? "Publication ready"
                    : avgBetterish >= 700
                      ? "Getting close"
                      : "Room to improve",
              accent: getScoreColor(avgBetterish ?? 0).fill,
              color: avgBetterish != null ? getScoreColor(avgBetterish).text : "var(--text-primary)",
            },
            {
              key: "voice",
              label: "VOICE FIDELITY",
              value: voicePct != null ? `${voicePct}%` : "—",
              tooltip: "How closely the system matches your writing voice.",
              subtitle:
                voicePct == null
                  ? "Complete onboarding"
                  : voicePct >= 80
                    ? "Strong match"
                    : "Building",
              accent: "var(--wrap-violet)",
              color: "var(--text-primary)",
            },
            {
              key: "signals",
              label: "SIGNALS",
              value: "—",
              tooltip: "Intelligence signals from Sentinel Watch.",
              subtitle: "Coming soon",
              accent: "rgba(0,0,0,0.12)",
              color: "var(--text-tertiary)",
            },
          ].map((stat, i) => (
            <div
              key={stat.key}
              className="dashboard-fade-up"
              style={{
                animationDelay: `${i * 50}ms`,
                opacity: 0,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: "20px 24px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(0,0,0,0.45)",
                    marginBottom: 6,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "rgba(0,0,0,0.45)",
                    marginTop: 4,
                  }}
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
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
            }}
          >
            In progress
          </span>
          <button
            onClick={() => nav("/studio/outputs")}
            style={{
              fontFamily: "'DM Sans', sans-serif",
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
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            No work in progress.{" "}
            <button
              onClick={() => nav("/studio/work")}
              style={{
                fontFamily: "'DM Sans', sans-serif",
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
                  padding: "12px 16px",
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.04)",
                      color: "var(--text-secondary)",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
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
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
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
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        color: "var(--text-tertiary, var(--fg-3))",
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
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      color: scoreStyle.text,
                    }}
                  >
                    {o.score}
                  </span>
                  <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
                </div>
              </button>
            );
          })
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
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
            gap: 16,
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
                padding: 16,
                cursor: "pointer",
                textAlign: "left",
                transition,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginTop: 4,
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
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Sentinel Briefing
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Latest signal summary
            </div>
          </div>
          <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      )}
    </div>
  );
}
