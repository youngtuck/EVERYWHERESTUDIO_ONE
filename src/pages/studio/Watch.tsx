import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import Tooltip from "../../components/Tooltip";
import LoadingAnimation from "../../components/studio/LoadingAnimation";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

const WATCH_BLUE = "#4A90F5";
const HEADER_BG = "#0D1B2A";
const SENTINEL_LOADING_MESSAGES = [
  "Scanning your category...",
  "Monitoring competitor signals...",
  "Identifying content opportunities...",
  "Verifying sources...",
  "Analyzing threat landscape...",
  "Compiling your briefing...",
];

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

type SentinelSeedResponse = {
  industries?: string[];
  topics?: string[];
  people?: string[];
  competitors?: string[];
  contentTriggers?: string[];
};

function flattenSeedResponse(data: SentinelSeedResponse): string[] {
  const out: string[] = [];
  [data.industries, data.topics, data.people, data.competitors, data.contentTriggers].forEach((arr) => {
    if (Array.isArray(arr)) arr.forEach((s) => { if (s && String(s).trim()) out.push(String(s).trim()); });
  });
  return out;
}

export default function Watch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string | null; sentinel_topics?: string[] | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loadingFadeOut, setLoadingFadeOut] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const completingStarted = useRef(false);

  const [setupLinkedInUrl, setSetupLinkedInUrl] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError] = useState("");
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [startWatchingLoading, setStartWatchingLoading] = useState(false);

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
  const usingDefaultTopics = !profile?.sentinel_topics?.length;
  const topics = (profile?.sentinel_topics?.length ? profile.sentinel_topics : defaultTopics) as string[];
  const needsSetup = profile != null && (!profile.sentinel_topics || profile.sentinel_topics.length === 0);

  const handleAnalyzeLinkedIn = async () => {
    if (!setupLinkedInUrl.trim() || !setupLinkedInUrl.includes("linkedin.com")) {
      setSeedError("Enter a valid LinkedIn profile URL.");
      return;
    }
    setSeedError("");
    setSeedLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sentinel-seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInUrl: setupLinkedInUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSuggestedTopics(flattenSeedResponse(data));
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Failed to analyze URL.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleAutoDetectVoiceDna = async () => {
    if (!user) return;
    setSeedError("");
    setSeedLoading(true);
    try {
      const { data: resources } = await supabase
        .from("resources")
        .select("content")
        .eq("user_id", user.id)
        .eq("resource_type", "voice_dna");
      const voiceDnaContent = (resources || [])
        .map((r: { content?: string }) => r.content || "")
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 30000);
      if (!voiceDnaContent.trim()) {
        setSeedError("No Voice DNA resources found. Add Voice DNA in Studio Resources first.");
        setSeedLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/sentinel-seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceDnaContent, userName: profile?.full_name || "there" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSuggestedTopics(flattenSeedResponse(data));
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Failed to detect from Voice DNA.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleStartWatching = async () => {
    if (!user || suggestedTopics.length === 0) return;
    setStartWatchingLoading(true);
    setSeedError("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ sentinel_topics: suggestedTopics })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, sentinel_topics: suggestedTopics } : null));
      setSuggestedTopics([]);
      setGenerating(true);
      const res = await fetch(`${API_BASE}/api/sentinel-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: profile?.full_name || "there",
          topics: suggestedTopics,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const now = new Date().toISOString();
      setBriefing({
        user_id: user.id,
        generated_at: now,
        date_label: data.date_label || getTodayDateLabel(),
        briefing: data,
        signals_count: data.signals_count ?? 0,
      });

      // Persist to Supabase
      await supabase.from("sentinel_briefings").insert({
        user_id: user.id,
        generated_at: now,
        date_label: data.date_label || getTodayDateLabel(),
        briefing: data,
        signals_count: data.signals_count ?? 0,
      });

      setGenerating(false);
      setCompleting(true);
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Failed to save or generate briefing.");
      setGenerating(false);
    } finally {
      setStartWatchingLoading(false);
    }
  };

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
      const now = new Date().toISOString();
      const row: BriefingRow = {
        user_id: user.id,
        generated_at: now,
        date_label: data.date_label || getTodayDateLabel(),
        briefing: data,
        signals_count: data.signals_count ?? 0,
      };
      setBriefing(row);

      // Persist to Supabase so it survives page refresh
      await supabase.from("sentinel_briefings").insert({
        user_id: user.id,
        generated_at: now,
        date_label: row.date_label,
        briefing: data,
        signals_count: data.signals_count ?? 0,
      });

      setGenerating(false);
      setCompleting(true);
    } catch (err) {
      console.error("[Watch] generate failed", err);
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!generating && !completing) return;
    const t = setInterval(() => {
      setStatusIndex((i) => (i + 1) % SENTINEL_LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(t);
  }, [generating, completing]);

  useEffect(() => {
    if (!completing || completingStarted.current) return;
    completingStarted.current = true;
    const t1 = setTimeout(() => setLoadingFadeOut(true), 600);
    return () => clearTimeout(t1);
  }, [completing]);

  useEffect(() => {
    if (!loadingFadeOut) return;
    const t = setTimeout(() => {
      setCompleting(false);
      setLoadingFadeOut(false);
      completingStarted.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [loadingFadeOut]);

  const openWorkWithPrompt = (ctaPrompt: string) => {
    navigate(`/studio/work?prompt=${encodeURIComponent(ctaPrompt)}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", fontFamily: "'Afacad Flux', sans-serif", color: "var(--text-secondary)" }}>
        Loading…
      </div>
    );
  }

  const dateLabel = hasTodayBriefing ? (briefing.briefing.date_label ?? briefing.date_label) : getTodayDateLabel();
  const showSentinelLoading = generating || completing;

  return (
    <div style={{ fontFamily: "'Afacad Flux', sans-serif",  }}>
      <style>{`
        @keyframes sentinel-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes sentinel-ring-1 { to { transform: rotate(360deg); } }
        @keyframes sentinel-ring-2 { to { transform: rotate(-360deg); } }
        @keyframes sentinel-ring-3 { to { transform: rotate(360deg); } }
        @keyframes sentinel-progress-loading {
          0% { width: 0%; }
          100% { width: 85%; }
        }
        .sentinel-orb-pulse { animation: sentinel-pulse 3s ease-in-out infinite; }
        .sentinel-ring-1 { animation: sentinel-ring-1 4s linear infinite; }
        .sentinel-ring-2 { animation: sentinel-ring-2 7s linear infinite; }
        .sentinel-ring-3 { animation: sentinel-ring-3 12s linear infinite; }
        .sentinel-rings-completing .sentinel-ring-1 { animation-duration: 2s; }
        .sentinel-rings-completing .sentinel-ring-2 { animation-duration: 3.5s; }
        .sentinel-rings-completing .sentinel-ring-3 { animation-duration: 6s; }
        .sentinel-progress-fill-loading { animation: sentinel-progress-loading 15s ease-out forwards; }
        .sentinel-progress-fill-complete { width: 100% !important; transition: width 300ms ease-out; animation: none; }
        @keyframes sentinel-status-fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .sentinel-status-text { animation: sentinel-status-fadein 0.5s ease-out forwards; }
      `}</style>
      {/* Header — exact layout */}
      <header
        style={{
          background: HEADER_BG,
          color: "#fff",
          padding: "24px 24px 32px",
          marginBottom: 24,
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8961A", marginBottom: 8 }}>
            INTELLIGENCE BRIEFING
          </div>
          <h1 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {dateLabel}
            {usingDefaultTopics && hasTodayBriefing && (
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#F5C642", background: "rgba(245,198,66,0.12)", padding: "3px 10px", borderRadius: 4 }}>
                Sample
              </span>
            )}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Verified by Priya Protocol — all claims require 2+ independent sources
            </p>
            {!needsSetup && !generating && (
              <button
                type="button"
                onClick={handleGenerateNow}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              >
                Refresh briefing
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 60px", position: "relative" }}>
        {needsSetup && (
          <div
            style={{
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Set up your Watch
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px" }}>
              Seed Sentinel with topics from your LinkedIn profile or Voice DNA so it knows what to monitor.
            </p>
            {suggestedTopics.length === 0 ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Paste your LinkedIn URL
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="url"
                      value={setupLinkedInUrl}
                      onChange={(e) => setSetupLinkedInUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "10px 12px",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 8,
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 14,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAnalyzeLinkedIn}
                      disabled={seedLoading}
                      style={{
                        background: WATCH_BLUE,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: seedLoading ? "wait" : "pointer",
                      }}
                    >
                      {seedLoading ? "Analyzing…" : "Analyze"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Or use your Studio content
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectVoiceDna}
                    disabled={seedLoading}
                    style={{
                      background: "transparent",
                      color: WATCH_BLUE,
                      border: `1px solid ${WATCH_BLUE}`,
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: seedLoading ? "wait" : "pointer",
                    }}
                  >
                    {seedLoading ? "Detecting…" : "Auto-detect from Voice DNA"}
                  </button>
                </div>
                {seedError && (
                  <p style={{ fontSize: 13, color: "#D64545", margin: "0 0 16px" }}>{seedError}</p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
                  Review and edit your topics, then click Start Watching.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {suggestedTopics.map((topic, i) => (
                    <span
                      key={`${topic}-${i}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "var(--surface-secondary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 20,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => setSuggestedTopics((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          color: "var(--text-tertiary)",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newTopicInput.trim()) {
                          setSuggestedTopics((prev) => [...prev, newTopicInput.trim()]);
                          setNewTopicInput("");
                        }
                      }
                    }}
                    placeholder="Add a topic"
                    style={{
                      width: 180,
                      padding: "8px 12px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTopicInput.trim()) {
                        setSuggestedTopics((prev) => [...prev, newTopicInput.trim()]);
                        setNewTopicInput("");
                      }
                    }}
                    style={{
                      background: "transparent",
                      color: WATCH_BLUE,
                      border: `1px solid ${WATCH_BLUE}`,
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleStartWatching}
                  disabled={startWatchingLoading || suggestedTopics.length === 0}
                  style={{
                    background: WATCH_BLUE,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: startWatchingLoading ? "wait" : "pointer",
                  }}
                >
                  {startWatchingLoading ? "Starting…" : "Start Watching"}
                </button>
                {seedError && (
                  <p style={{ fontSize: 13, color: "#D64545", margin: "16px 0 0" }}>{seedError}</p>
                )}
              </>
            )}
          </div>
        )}
        {!needsSetup && showSentinelLoading && (
          <div
            style={{
              background: "#07090F",
              borderRadius: 16,
              minHeight: 420,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              transition: "opacity 400ms ease-out",
              opacity: loadingFadeOut ? 0 : 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            <LoadingAnimation variant="sentinel" message={SENTINEL_LOADING_MESSAGES[statusIndex]} />
          </div>
        )}
        {!needsSetup && !hasTodayBriefing && !showSentinelLoading && (
          <div
            style={{
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
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
                fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: generating ? "wait" : "pointer",
              }}
            >
              Generate Now
            </button>
          </div>
        )}
        {!needsSetup && hasTodayBriefing && (
          <div
            style={{
              opacity: showSentinelLoading && !loadingFadeOut ? 0 : 1,
              transition: "opacity 400ms ease-out",
              pointerEvents: showSentinelLoading && !loadingFadeOut ? "none" : "auto",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 32, alignItems: "start" }}>
            {/* Left: What's Moving + Threats */}
            <div>
              {(sections.whats_moving?.length ?? 0) > 0 && (
                <SectionTitle label="What's Moving" color={WATCH_BLUE} tooltip="Key shifts in your category and what they mean." />
              )}
              {(sections.whats_moving ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: WATCH_BLUE, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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

              {(sections.threats?.length ?? 0) > 0 && <SectionTitle label="Threats" color="#D64545" style={{ marginTop: 32 }} tooltip="Risks and competitive moves to watch." />}
              {(sections.threats ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16, borderLeft: "4px solid #D64545" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#D64545", textTransform: "uppercase" }}>{item.severity}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "8px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>{item.summary}</p>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>{item.recommended_action}</p>
                </Card>
              ))}
            </div>

            {/* Right: Opportunities + Content Triggers + Event Radar */}
            <div>
              {(sections.opportunities?.length ?? 0) > 0 && <SectionTitle label="Opportunities" color="#3A9A5C" tooltip="Content and growth opportunities to act on." />}
              {(sections.opportunities ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 14, color: "var(--text-tertiary)" }}>
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
                <SectionTitle label="Content Triggers" color="#0D8C9E" style={{ marginTop: 32 }} tooltip="Moments that warrant a piece of content." />
              )}
              {(sections.content_triggers ?? []).map((item, i) => (
                <Card key={i} style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0D8C9E", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.format}</span>
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
                <SectionTitle label="Event Radar" color="#A080F5" style={{ marginTop: 32 }} tooltip="Upcoming events relevant to your focus." />
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
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  label,
  color,
  tooltip,
  style = {},
}: {
  label: string;
  color: string;
  tooltip?: string;
  style?: React.CSSProperties;
}) {
  const labelEl = (
    <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color }}>
      {label}
    </span>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, ...style }}>
      {tooltip ? <Tooltip text={tooltip} position="top">{labelEl}</Tooltip> : labelEl}
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
