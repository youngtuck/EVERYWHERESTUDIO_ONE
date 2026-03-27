import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import { useToast } from "../../context/ToastContext";
import EverywhereMarkIcon from "../../components/studio/EverywhereMarkIcon";
import { DEFAULT_SOURCES, DEFAULT_KEYWORDS, DEFAULT_CONFIG } from "../../lib/defaultWatchSources";
import type { WatchSource } from "../../lib/defaultWatchSources";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "'Afacad Flux', sans-serif";

type Tab = "briefing" | "sources" | "settings";

type Signal = {
  title: string;
  summary: string;
  track?: string;
  score?: number;
  relevance?: string;
  cta_prompt?: string;
  severity?: string;
  angle?: string;
  format?: string;
  cta_label?: string;
};

type BriefingData = {
  date_label?: string;
  signals_count?: number;
  sections?: {
    whats_moving?: Signal[];
    threats?: Signal[];
    opportunities?: Signal[];
    content_triggers?: Signal[];
    event_radar?: Signal[];
  };
};

type BriefingRow = {
  user_id: string;
  generated_at: string;
  date_label: string;
  briefing: BriefingData;
  signals_count?: number;
};

type WatchConfig = {
  keywords: string[];
  watchlist: { competitors: string[]; industryOrgs: string[]; techInfra: string[]; thoughtLeaders: string[] };
  signalRanking: { relevance: number; actionability: number; urgency: number };
  tonePreferences: string[];
};

type SourceRow = { id?: string; name: string; type: string; track: string };

const TRACK_COLORS: Record<string, { bg: string; fg: string }> = {
  competitor: { bg: "rgba(229,57,53,0.1)", fg: "#E53935" },
  thought_leader: { bg: "rgba(200,150,26,0.1)", fg: "var(--gold)" },
  tech_infra: { bg: "rgba(107,127,242,0.1)", fg: "var(--cornflower)" },
  industry: { bg: "rgba(160,128,245,0.1)", fg: "#A080F5" },
  general: { bg: "var(--bg-2)", fg: "var(--fg-3)" },
};

const LOADING_MESSAGES = [
  "Scanning your category...",
  "Monitoring competitor signals...",
  "Identifying content opportunities...",
  "Verifying sources...",
  "Analyzing threat landscape...",
  "Compiling your briefing...",
];

const SOURCE_TYPES = ["blog", "newsletter", "podcast", "substack", "publication"] as const;
const WATCHLIST_CATS = [
  { key: "competitors" as const, label: "Competitors" },
  { key: "industryOrgs" as const, label: "Industry Orgs" },
  { key: "techInfra" as const, label: "Tech & Infra" },
  { key: "thoughtLeaders" as const, label: "Thought Leaders" },
];

function TrackBadge({ track }: { track: string }) {
  const c = TRACK_COLORS[track] ?? TRACK_COLORS.general;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", background: c.bg, color: c.fg }}>
      {track.replace("_", " ")}
    </span>
  );
}

function TagPill({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 16, fontSize: 12, color: "var(--fg-2)", transition: "all 0.15s ease" }}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--fg-3)", fontSize: 14, lineHeight: 1 }} aria-label={`Remove ${label}`}>
          x
        </button>
      )}
    </span>
  );
}

function getTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase();
}

export default function Watch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("briefing");
  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [config, setConfig] = useState<WatchConfig>(DEFAULT_CONFIG);
  const [profile, setProfile] = useState<{ full_name?: string | null; sentinel_topics?: string[] | null } | null>(null);

  // Input states
  const [newSource, setNewSource] = useState("");
  const [newSourceType, setNewSourceType] = useState<string>("blog");
  const [newKeyword, setNewKeyword] = useState("");
  const [newTone, setNewTone] = useState("");
  const [watchlistInputs, setWatchlistInputs] = useState({ competitors: "", industryOrgs: "", techInfra: "", thoughtLeaders: "" });

  // Load data on mount
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [bRes, pRes, sRes] = await Promise.all([
        supabase.from("sentinel_briefings").select("*").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("profiles").select("full_name, sentinel_topics, watch_config").eq("id", user.id).single(),
        supabase.from("watch_sources").select("*").eq("user_id", user.id),
      ]);
      if (bRes.data) setBriefing(bRes.data as BriefingRow);
      if (pRes.data) {
        setProfile(pRes.data);
        if (pRes.data.watch_config) setConfig(pRes.data.watch_config as WatchConfig);
      }
      if (sRes.data && sRes.data.length > 0) {
        setSources(sRes.data);
      } else if (pRes.data?.sentinel_topics?.length) {
        // Fallback: no watch_sources rows yet
        setSources([]);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  // Rotating loading messages
  useEffect(() => {
    if (!generating) return;
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 3000);
    return () => clearInterval(iv);
  }, [generating]);

  // Auto-save config
  const saveConfig = async (next: WatchConfig) => {
    setConfig(next);
    if (user) {
      await supabase.from("profiles").update({ watch_config: next }).eq("id", user.id);
    }
  };

  const [briefingError, setBriefingError] = useState<string | null>(null);

  const handleGetBriefing = async () => {
    if (!user) return;
    setGenerating(true);
    setMsgIdx(0);
    setBriefingError(null);
    try {
      // Try the new Sentinel engine first, fall back to the old endpoint
      const res = await fetchWithRetry(
        `${API_BASE}/api/run-sentinel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            sentinelConfig: {
              keywords: config.keywords.length > 0 ? config.keywords : DEFAULT_KEYWORDS,
              rankingWeights: config.signalRanking || { relevance: 5, actionability: 3, urgency: 2 },
              tracks: config.watchlist || {},
            },
            sources: sources.map(s => ({ type: s.type, name: s.name })),
          }),
        },
        { timeout: 120000 }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      if (data.error && !data.signals?.length) throw new Error(data.error);
      const now = new Date().toISOString();
      const row: BriefingRow = { user_id: user.id, generated_at: now, date_label: getTodayLabel(), briefing: data, signals_count: data.signals?.length ?? 0 };
      setBriefing(row);
      if (!data.cached) {
        await supabase.from("sentinel_briefings").insert({ user_id: user.id, generated_at: now, date_label: row.date_label, briefing: data, signals_count: data.signals?.length ?? 0 });
      }
      toast(data.cached ? "Showing cached briefing." : "Fresh briefing generated.", "success");
    } catch (err) {
      console.error("[Watch] Briefing failed:", err);
      const msg = err instanceof Error ? err.message : "Briefing generation failed.";
      setBriefingError(msg);
      toast(msg, "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadDefaultSources = async () => {
    if (!user) return;
    try {
      const sourcesWithUser = DEFAULT_SOURCES.map(s => ({
        user_id: user.id,
        name: s.name,
        type: s.type.charAt(0).toUpperCase() + s.type.slice(1), // Capitalize type for DB constraint
        track: s.track,
      }));
      const { error } = await supabase.from("watch_sources").insert(sourcesWithUser);
      if (error) {
        console.error("[Watch] Failed to load default sources:", error);
        toast("Failed to load sources. The table may not exist yet.", "error");
        return;
      }
      toast("Default sources loaded.");
      // Refresh sources
      const { data } = await supabase.from("watch_sources").select("*").eq("user_id", user.id).order("type", { ascending: true });
      if (data) setSources(data);
    } catch (err) {
      console.error("[Watch] Error loading defaults:", err);
      toast("Something went wrong loading sources.", "error");
    }
  };

  const addSource = async () => {
    if (!newSource.trim() || !user) return;
    const row = { user_id: user.id, name: newSource.trim(), type: newSourceType, track: "general" };
    const { data } = await supabase.from("watch_sources").insert(row).select().single();
    if (data) setSources(prev => [...prev, data]);
    setNewSource("");
  };

  const removeSource = async (id?: string, idx?: number) => {
    if (id) await supabase.from("watch_sources").delete().eq("id", id);
    setSources(prev => prev.filter((_, i) => i !== idx));
  };

  const loadDefaults = async () => {
    if (!user) return;
    const rows = DEFAULT_SOURCES.map(s => ({ user_id: user.id, name: s.name, type: s.type, track: s.track }));
    const { data } = await supabase.from("watch_sources").insert(rows).select();
    if (data) setSources(data);
    toast("Default sources loaded.", "success");
  };

  const allSignals = (): Signal[] => {
    const s = briefing?.briefing?.sections;
    if (!s) return [];
    return [...(s.whats_moving ?? []), ...(s.threats ?? []), ...(s.opportunities ?? []), ...(s.content_triggers ?? [])];
  };

  const contentSuggestions = briefing?.briefing?.sections?.content_triggers ?? [];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, fontFamily: FONT, color: "var(--fg-3)" }}>
        Loading...
      </div>
    );
  }

  // Shared styles
  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12, transition: "all 0.15s ease" };
  const input: React.CSSProperties = { padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, fontFamily: FONT, fontSize: 13, background: "var(--bg-2)", color: "var(--fg)", outline: "none", transition: "border-color 0.15s ease" };
  const goldBtn: React.CSSProperties = { padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#fff", fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s ease" };
  const tabPill = (active: boolean): React.CSSProperties => ({ padding: "6px 16px", borderRadius: 999, border: "1px solid " + (active ? "var(--gold)" : "var(--line)"), background: active ? "var(--gold)" : "transparent", color: active ? "#fff" : "var(--fg-2)", fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" });

  return (
    <div style={{ fontFamily: FONT, maxWidth: 960, margin: "0 auto", padding: isMobile ? "16px" : "24px 24px 60px" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em" }}>WATCH</h1>
          <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "4px 0 0" }}>{getTodayLabel()}</p>
        </div>
        <button type="button" onClick={handleGetBriefing} disabled={generating} style={{ ...goldBtn, opacity: generating ? 0.6 : 1, cursor: generating ? "wait" : "pointer" }}>
          {generating ? "Generating..." : "Get Briefing"}
        </button>
      </div>

      {/* TAB PILLS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["briefing", "sources", "settings"] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={tabPill(tab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* LOADING STATE */}
      {generating && (
        <div style={{ ...card, minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <EverywhereMarkIcon size={48} style={{ marginBottom: 20 }} />
          <p style={{ fontSize: 15, color: "var(--fg-2)", margin: 0, transition: "opacity 0.15s ease" }}>{LOADING_MESSAGES[msgIdx]}</p>
        </div>
      )}

      {/* BRIEFING TAB */}
      {tab === "briefing" && !generating && (
        <>
          {briefingError && (
            <div style={{ padding: "16px 20px", background: "rgba(229,57,53,0.06)", border: "1px solid rgba(229,57,53,0.2)", borderRadius: 8, color: "#D64545", fontSize: 14, marginBottom: 16 }}>
              {briefingError}
            </div>
          )}
          {!briefing ? (
            <div style={{ ...card, padding: 48, textAlign: "center" }}>
              <EverywhereMarkIcon size={40} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: "var(--fg-2)", margin: "0 0 16px" }}>No briefing yet. Generate one to see signals from your sources.</p>
              <button type="button" onClick={handleGetBriefing} style={goldBtn}>Get Briefing</button>
            </div>
          ) : (
            <>
              {/* Signal cards */}
              {allSignals().map((sig, i) => (
                <div key={i} style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {sig.track && <TrackBadge track={sig.track} />}
                    {sig.severity && <TrackBadge track={sig.severity === "High" ? "competitor" : sig.severity === "Medium" ? "thought_leader" : "general"} />}
                    {sig.score != null && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>Score: {sig.score}</span>}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>{sig.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", margin: "0 0 8px", lineHeight: 1.5 }}>{sig.summary}</p>
                  {sig.relevance && <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "0 0 8px" }}>{sig.relevance}</p>}
                  <button
                    type="button"
                    onClick={() => navigate("/studio/work", { state: { watchSignal: { headline: sig.title, summary: sig.summary, angle: sig.cta_prompt || sig.angle || sig.summary } } })}
                    style={{ background: "none", border: "1px solid var(--cornflower)", color: "var(--cornflower)", padding: "6px 14px", borderRadius: 8, fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" }}
                  >
                    Write about this
                  </button>
                </div>
              ))}

              {/* Content suggestions */}
              {contentSuggestions.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 12, letterSpacing: "-0.01em" }}>Content Suggestions</h2>
                  {contentSuggestions.map((ct, i) => (
                    <div key={i} style={{ ...card, cursor: "pointer" }} onClick={() => navigate("/studio/work", { state: { watchSignal: { headline: ct.title, summary: ct.angle || "", angle: ct.angle || "" } } })}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{ct.title}</h4>
                        {ct.format && <span style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase" }}>{ct.format}</span>}
                      </div>
                      {ct.angle && <p style={{ fontSize: 12, color: "var(--fg-2)", margin: "6px 0 0", lineHeight: 1.4 }}>{ct.angle}</p>}
                    </div>
                  ))}
                </div>
              )}

              {allSignals().length === 0 && (
                <div style={{ ...card, padding: 32, textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0 }}>This briefing has no signals. Try generating a fresh one.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* SOURCES TAB */}
      {tab === "sources" && (
        <>
          {sources.length === 0 ? (
            <div style={{ ...card, padding: 32, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--fg-2)", margin: "0 0 16px" }}>No sources configured yet.</p>
              <button type="button" onClick={handleLoadDefaultSources} style={goldBtn}>Load Default Sources</button>
            </div>
          ) : (
            SOURCE_TYPES.map(type => {
              const group = sources.filter(s => s.type === type);
              if (group.length === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>
                    {type}s
                  </h3>
                  {group.map((s, i) => {
                    const idx = sources.indexOf(s);
                    return (
                      <div
                        key={s.id || i}
                        style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}
                        className="watch-source-row"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, color: "var(--fg)" }}>{s.name}</span>
                          <TrackBadge track={s.track} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSource(s.id, idx)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 16, padding: "0 4px", opacity: 0.5, transition: "opacity 0.15s ease" }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; }}
                          aria-label={`Remove ${s.name}`}
                        >
                          x
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}

          {/* Add source */}
          <div style={{ ...card, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={newSource} onChange={e => setNewSource(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addSource(); }} placeholder="Add source..." style={{ ...input, flex: 1, minWidth: 160 }} />
            <select value={newSourceType} onChange={e => setNewSourceType(e.target.value)} style={{ ...input, cursor: "pointer" }}>
              {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={addSource} style={goldBtn}>Add</button>
          </div>
        </>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <>
          {/* Keywords */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: "0 0 12px" }}>Keywords</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {config.keywords.map((kw, i) => (
                <TagPill key={kw + i} label={kw} onRemove={() => { const next = { ...config, keywords: config.keywords.filter((_, j) => j !== i) }; saveConfig(next); }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newKeyword.trim()) { saveConfig({ ...config, keywords: [...config.keywords, newKeyword.trim()] }); setNewKeyword(""); } }} placeholder="Add keyword..." style={{ ...input, flex: 1 }} />
              <button type="button" onClick={() => { if (newKeyword.trim()) { saveConfig({ ...config, keywords: [...config.keywords, newKeyword.trim()] }); setNewKeyword(""); } }} style={goldBtn}>Add</button>
            </div>
          </div>

          {/* Watchlist */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: "0 0 12px" }}>Watchlist</h3>
            {WATCHLIST_CATS.map(cat => (
              <div key={cat.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg-3)", marginBottom: 6 }}>{cat.label}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {config.watchlist[cat.key].map((item, i) => (
                    <TagPill key={item + i} label={item} onRemove={() => { const next = { ...config, watchlist: { ...config.watchlist, [cat.key]: config.watchlist[cat.key].filter((_, j) => j !== i) } }; saveConfig(next); }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={watchlistInputs[cat.key]}
                    onChange={e => setWatchlistInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === "Enter" && watchlistInputs[cat.key].trim()) {
                        saveConfig({ ...config, watchlist: { ...config.watchlist, [cat.key]: [...config.watchlist[cat.key], watchlistInputs[cat.key].trim()] } });
                        setWatchlistInputs(prev => ({ ...prev, [cat.key]: "" }));
                      }
                    }}
                    placeholder={`Add to ${cat.label.toLowerCase()}...`}
                    style={{ ...input, flex: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Signal Ranking */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: "0 0 12px" }}>Signal Ranking</h3>
            {(["relevance", "actionability", "urgency"] as const).map(key => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 13, color: "var(--fg-2)", textTransform: "capitalize" }}>{key}</label>
                  <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{config.signalRanking[key]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={config.signalRanking[key]}
                  onChange={e => saveConfig({ ...config, signalRanking: { ...config.signalRanking, [key]: Number(e.target.value) } })}
                  style={{ width: "100%", accentColor: "var(--gold)" }}
                />
              </div>
            ))}
          </div>

          {/* Tone Preferences */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", margin: "0 0 12px" }}>Tone Preferences</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {config.tonePreferences.map((tone, i) => (
                <TagPill key={tone + i} label={tone} onRemove={() => { const next = { ...config, tonePreferences: config.tonePreferences.filter((_, j) => j !== i) }; saveConfig(next); }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newTone} onChange={e => setNewTone(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newTone.trim()) { saveConfig({ ...config, tonePreferences: [...config.tonePreferences, newTone.trim()] }); setNewTone(""); } }} placeholder="Add tone..." style={{ ...input, flex: 1 }} />
              <button type="button" onClick={() => { if (newTone.trim()) { saveConfig({ ...config, tonePreferences: [...config.tonePreferences, newTone.trim()] }); setNewTone(""); } }} style={goldBtn}>Add</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
