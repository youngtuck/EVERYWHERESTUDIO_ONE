import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

const WATCH_BLUE = "#4A90F5";
const HEADER_BG = "#0D1B2A";

type Source = { name: string; url: string };
type WhatsMovingItem = { title: string; summary: string; implication: string; priority: "High" | "Medium" | "Low"; sources?: Source[] };
type ThreatItem = { title: string; summary: string; severity: string; recommended_action: string };
type OpportunityItem = { title: string; summary: string; effort: number; impact: number; cta_label: string; cta_prompt: string };
type ContentTriggerItem = { title: string; angle: string; format: string; cta_label: string };
type EventRadarItem = { title: string; date: string; relevance: string; action: string };

type BriefingSections = {
  whats_moving?: WhatsMovingItem[];
  threats?: ThreatItem[];
  opportunities?: OpportunityItem[];
  content_triggers?: ContentTriggerItem[];
  event_radar?: EventRadarItem[];
};

type BriefingRow = {
  id?: string;
  user_id: string;
  generated_at: string;
  date_label: string;
  briefing: {
    date_label?: string;
    generated_at?: string;
    verified_by?: string;
    sections?: BriefingSections;
    signals_count?: number;
  };
  signals_count?: number;
};

function isToday(isoString: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function getTodayDateLabel(): string {
  const d = new Date();
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

export default function Watch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string | null; sentinel_topics?: string[] | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [bRes, pRes] = await Promise.all([
        supabase
          .from("sentinel_briefings")
          .select("*")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("full_name, sentinel_topics").eq("id", user.id).single(),
      ]);
      if (bRes.data) setBriefing(bRes.data as BriefingRow);
      if (pRes.data) setProfile(pRes.data);
      setLoading(false);
    })();
  }, [user?.id]);

  const hasTodayBriefing = briefing && isToday(briefing.generated_at);
  const sections = briefing?.briefing?.sections ?? {};
  const defaultTopics = ["AI and technology", "thought leadership", "executive communication", "content strategy"];
  const topics = (profile?.sentinel_topics?.length ? profile.sentinel_topics : defaultTopics) as string[];

  const handleGenerateNow = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const url = `${API_BASE}/api/sentinel-generate`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: profile?.full_name || "there",
          topics,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBriefing({
        user_id: user.id,
        generated_at: new Date().toISOString(),
        date_label: data.date_label || getTodayDateLabel(),
        briefing: data,
        signals_count: data.signals_count ?? 0,
      });
    } catch (err) {
      console.error("[Watch] generate failed", err);
    } finally {
      setGenerating(false);
    }
  };

  const openWorkWithPrompt = (ctaPrompt: string) => {
    navigate(`/studio/work?prompt=${encodeURIComponent(ctaPrompt)}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans', sans-serif", color: "var(--text-secondary)" }}>
        Loading…
      </div>
    );
  }

  const dateLabel = hasTodayBriefing ? (briefing.briefing.date_label ?? briefing.date_label) : getTodayDateLabel();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      {/* Header — exact layout */}
      <header
        style={{
          background: HEADER_BG,
          color: "#fff",
          padding: "32px 24px 40px",
          marginBottom: 32,
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8961A", marginBottom: 8 }}>
            INTELLIGENCE BRIEFING
          </div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {dateLabel}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            Verified by Priya Kumar Protocol — all claims require 2+ independent sources
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
        {!hasTodayBriefing ? (
          <>
            <div
              style={{
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
              }}
            >
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
                Your morning briefing is being prepared
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: "0 0 24px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                Sentinel runs daily at 7:00 AM. Check back then.
              </p>
              <button
                type="button"
                onClick={handleGenerateNow}
                disabled={generating}
                style={{
                  background: WATCH_BLUE,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: generating ? "wait" : "pointer",
                }}
              >
                {generating ? "Generating…" : "Generate Now"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            {/* Left: What's Moving + Threats */}
            <div>
              {(sections.whats_moving?.length ?? 0) > 0 && (
                <SectionTitle label="What's Moving" color={WATCH_BLUE} />
              )}
              {(sections.whats_moving ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: WATCH_BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.priority}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>{item.summary}</p>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic", margin: "0 0 8px" }}>{item.implication}</p>
                  {item.sources?.length ? (
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {item.sources.map((s, j) => (
                        <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: WATCH_BLUE, marginRight: 12 }}>
                          {s.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}

              {(sections.threats?.length ?? 0) > 0 && <SectionTitle label="Threats" color="#D64545" style={{ marginTop: 32 }} />}
              {(sections.threats ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16, borderLeft: "4px solid #D64545" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#D64545", textTransform: "uppercase" }}>{item.severity}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "8px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>{item.summary}</p>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>{item.recommended_action}</p>
                </Card>
              ))}
            </div>

            {/* Right: Opportunities + Content Triggers + Event Radar */}
            <div>
              {(sections.opportunities?.length ?? 0) > 0 && <SectionTitle label="Opportunities" color="#3A9A5C" />}
              {(sections.opportunities ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                    <span>Effort: {item.effort}</span>
                    <span>Impact: {item.impact}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>{item.summary}</p>
                  <button
                    type="button"
                    onClick={() => openWorkWithPrompt(item.cta_prompt)}
                    style={{
                      background: "#3A9A5C",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {item.cta_label}
                  </button>
                </Card>
              ))}

              {(sections.content_triggers?.length ?? 0) > 0 && (
                <SectionTitle label="Content Triggers" color="#0D8C9E" style={{ marginTop: 32 }} />
              )}
              {(sections.content_triggers ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#0D8C9E", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.format}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "8px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" }}>{item.angle}</p>
                  <button
                    type="button"
                    onClick={() => openWorkWithPrompt(item.angle)}
                    style={{
                      background: "transparent",
                      color: "#0D8C9E",
                      border: "1px solid #0D8C9E",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {item.cta_label}
                  </button>
                </Card>
              ))}

              {(sections.event_radar?.length ?? 0) > 0 && (
                <SectionTitle label="Event Radar" color="#A080F5" style={{ marginTop: 32 }} />
              )}
              {(sections.event_radar ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{item.title}</h3>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>{item.date}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px" }}>{item.relevance}</p>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{item.action}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  label,
  color,
  style = {},
}: {
  label: string;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, ...style }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
