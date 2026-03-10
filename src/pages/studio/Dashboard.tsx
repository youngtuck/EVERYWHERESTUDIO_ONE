import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Mic, Share2, Mail, ChevronRight } from "lucide-react";
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

// ── Quick Start config (4 cards only) ────────────────────────────────────────
const QUICK_START = [
  { key: "essay", label: "Essay", subtitle: "Long-form narrative", icon: FileText },
  { key: "podcast", label: "Podcast Script", subtitle: "Episode from any topic", icon: Mic },
  { key: "social", label: "Social Package", subtitle: "Multi-platform posts", icon: Share2 },
  { key: "newsletter", label: "Newsletter", subtitle: "Campaign-ready email", icon: Mail },
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
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: isMobile ? "24px 16px" : "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* 1. Greeting Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary, var(--fg-3))",
              marginBottom: 2,
            }}
          >
            {getDateLabel()}
          </div>
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: isMobile ? 20 : 22,
              fontWeight: 600,
              color: "var(--text-primary, #1a1a1a)",
            }}
          >
            {getGreeting()}, {firstName}.
          </div>
        </div>
        <button
          onClick={() => nav("/studio/work")}
          style={{
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
          + New Output
        </button>
      </div>

      {/* 2. Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            isMobile && typeof window !== "undefined" && window.innerWidth < 480
              ? "1fr"
              : isMobile
                ? "1fr 1fr"
                : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="dashboard-skeleton"
                style={{
                  borderRadius: 12,
                  height: 120,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))
          : [
              {
                label: "OUTPUTS CREATED",
                value: outputsCreated,
                subtitle:
                  outputsCreated > 0 ? `${Math.min(outputsCreated, 99)} recent` : "Get started below",
                barFill: "var(--work-teal)",
                barPct: Math.min(100, (outputsCreated / 50) * 100),
              },
              {
                label: "AVG BETTERISH",
                value: avgBetterish ?? "—",
                subtitle:
                  avgBetterish == null
                    ? "Complete a session"
                    : avgBetterish >= 800
                      ? "Publication ready"
                      : avgBetterish >= 600
                        ? "Getting close"
                        : "Room to improve",
                barFill: "var(--gold-dark)",
                barPct: avgBetterish != null ? (avgBetterish / 1000) * 100 : 0,
              },
              {
                label: "VOICE FIDELITY",
                value: voicePct != null ? `${voicePct}%` : "—",
                subtitle:
                  voicePct == null
                    ? "Complete onboarding"
                    : voicePct >= 80
                      ? "Strong match"
                      : "Building",
                barFill: "var(--wrap-violet)",
                barPct: voicePct ?? 0,
              },
              {
                label: "SIGNALS",
                value: "—",
                subtitle: "Coming soon",
                barFill: "var(--watch-blue)",
                barPct: 0,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="dashboard-fade-up"
                style={{
                  animationDelay: `${i * 50}ms`,
                  opacity: 0,
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary, var(--fg-3))",
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 28,
                    fontWeight: 600,
                    color: "var(--text-primary, #1a1a1a)",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 400,
                    color: "var(--text-tertiary, var(--fg-3))",
                    marginBottom: 8,
                  }}
                >
                  {stat.subtitle}
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: "rgba(0,0,0,0.04)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${stat.barPct}%`,
                      background: stat.barFill,
                      borderRadius: 2,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
      </div>

      {/* 3. Recent Activity */}
      <div style={{ marginBottom: 32 }}>
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
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary, var(--fg-3))",
            }}
          >
            RECENT
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
            View all
          </button>
        </div>

        {loading ? (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="dashboard-skeleton"
              style={{
                borderRadius: 12,
                height: 72,
                marginBottom: 8,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))
        ) : recentThree.length === 0 ? (
          <div
            style={{
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            No outputs yet. Start a session to create your first.{" "}
            <button
              onClick={() => nav("/studio/work")}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--gold-dark)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Start Session
            </button>
          </div>
        ) : (
          recentThree.map((o, i) => {
            const scoreStyle = getScoreColor(o.score);
            return (
              <button
                key={o.id}
                onClick={() => nav(`/studio/outputs/${o.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 40,
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                    <div
                      style={{
                        height: "100%",
                        width: `${(o.score / 1000) * 100}%`,
                        background: scoreStyle.fill,
                        borderRadius: 2,
                      }}
                    />
                    </div>
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
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-tertiary, var(--fg-3))" }} />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 4. Quick Start Grid */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary, var(--fg-3))",
            marginBottom: 12,
          }}
        >
          CREATE
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
          {QUICK_START.map(({ key, label, subtitle, icon: Icon }, i) => (
            <button
              key={key}
              onClick={() => nav(`/studio/work?type=${key}`)}
              style={{
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                textAlign: "left",
                transition,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold-dark)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
                const icon = e.currentTarget.querySelector(".quick-start-icon");
                if (icon) (icon as HTMLElement).style.color = "var(--gold-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                const icon = e.currentTarget.querySelector(".quick-start-icon");
                if (icon) (icon as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              <Icon
                size={20}
                className="quick-start-icon"
                style={{ color: "var(--text-secondary)", transition }}
              />
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary, #1a1a1a)",
                  marginTop: 12,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 400,
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

      {/* 5. Sentinel Briefing — only if data exists */}
      {hasSignals && (
        <button
          onClick={() => nav("/studio/watch")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            padding: 20,
            background: "var(--surface-white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "left",
            transition,
          }}
        >
          <span style={{ color: "var(--watch-blue)" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z" />
              <path d="M12 6v12" />
              <path d="M8 12h8" />
            </svg>
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Sentinel Briefing
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Latest signal summary
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
        </button>
      )}
    </div>
  );
}
