/**
 * Watch.tsx, Sentinel Briefing + Sources
 * Phase 6: wired to real Supabase sentinel_briefings + /api/run-sentinel
 */
import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import { DEFAULT_SOURCES, DEFAULT_KEYWORDS } from "../../lib/defaultWatchSources";
import type { WatchSource } from "../../lib/defaultWatchSources";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "var(--font)";

// ── Types ──────────────────────────────────────────────────────
interface Signal {
  title: string;
  summary: string;
  implication?: string;
  priority?: "High" | "Medium" | "Low";
  severity?: string;
  effort?: number;
  impact?: number;
  cta_label?: string;
  cta_prompt?: string;
  recommended_action?: string;
  sources?: { name: string; url: string }[];
  track?: string;
}

interface BriefingData {
  date_label?: string;
  sections?: {
    whats_moving?: Signal[];
    threats?: Signal[];
    opportunities?: Signal[];
    content_triggers?: Signal[];
    event_radar?: Signal[];
  };
}

interface BriefingRow {
  generated_at: string;
  date_label: string;
  briefing: BriefingData;
  signals_count?: number;
}

type SourcePlatform = {
  label: string;
  id: string;
  items: string[];
  placeholder: string;
};

// ── Platform buckets ──────────────────────────────────────────
function buildPlatforms(sources: WatchSource[]): SourcePlatform[] {
  const byType: Record<string, string[]> = { blog: [], newsletter: [], podcast: [], substack: [], publication: [] };
  sources.forEach(s => { if (byType[s.type]) byType[s.type].push(s.name); });
  return [
    { label: "Blog", id: "blog", items: byType.blog, placeholder: "Add blog or URL..." },
    { label: "Newsletter", id: "newsletter", items: byType.newsletter, placeholder: "Add newsletter..." },
    { label: "Podcast", id: "podcast", items: byType.podcast, placeholder: "Add podcast..." },
    { label: "Publication", id: "pub", items: byType.publication, placeholder: "Add publication..." },
    { label: "Substack", id: "substack", items: byType.substack, placeholder: "Add Substack..." },
  ];
}

// ── Watch Dashboard Panel ─────────────────────────────────────
function WatchDashboard({
  sources, keywords, competitors, thoughtLeaders,
  onAddKeyword, onRemoveKeyword,
  onAddCompetitor, onRemoveCompetitor,
  onAddThoughtLeader, onRemoveThoughtLeader,
}: {
  sources: WatchSource[];
  keywords: string[];
  competitors: string[];
  thoughtLeaders: string[];
  onAddKeyword: (v: string) => void;
  onRemoveKeyword: (v: string) => void;
  onAddCompetitor: (v: string) => void;
  onRemoveCompetitor: (v: string) => void;
  onAddThoughtLeader: (v: string) => void;
  onRemoveThoughtLeader: (v: string) => void;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(true);
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [thoughtLeadersOpen, setThoughtLeadersOpen] = useState(false);
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const platforms = buildPlatforms(sources);

  const DpLabel = ({ children, open, onToggle }: { children: React.ReactNode; open: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" as const }}>
      <span>{children}</span>
      <span style={{ fontSize: 16, color: open ? "var(--fg)" : "var(--fg-3)", fontWeight: 600, lineHeight: 1, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>›</span>
    </div>
  );

  const AddRow = ({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) => {
    const [v, setV] = useState("");
    return (
      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onAdd(v); setV(""); } }} placeholder={placeholder} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 5, padding: "4px 8px", fontSize: 11, color: "var(--fg)", fontFamily: FONT, outline: "none" }} />
        <button onClick={() => { onAdd(v); setV(""); }} style={{ padding: "4px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", fontSize: 16, lineHeight: 1, cursor: "pointer" }}>+</button>
      </div>
    );
  };

  const SrcRow = ({ name, onRemove }: { name: string; onRemove?: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid var(--line)", fontSize: 11 }}>
      <span style={{ color: "var(--blue)", fontSize: 10, flexShrink: 0 }}>✓</span>
      <span style={{ flex: 1, color: "var(--fg-2)" }}>{name}</span>
      {onRemove && <span onClick={onRemove} style={{ fontSize: 12, color: "var(--fg-3)", cursor: "pointer" }}>×</span>}
    </div>
  );

  return (
    <>
      {/* Your Topics (keywords from onboarding) */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel open={keywordsOpen} onToggle={() => setKeywordsOpen(o => !o)}>Your Topics</DpLabel>
        {keywordsOpen && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 8, lineHeight: 1.4 }}>
              These topics drive your Watch briefings. Add or remove to refine what Sentinel tracks.
            </div>
            <AddRow placeholder="Add a topic..." onAdd={onAddKeyword} />
            {keywords.map(kw => <SrcRow key={kw} name={kw} onRemove={() => onRemoveKeyword(kw)} />)}
          </div>
        )}
      </div>

      {/* Sources */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel open={sourcesOpen} onToggle={() => setSourcesOpen(o => !o)}>Sources</DpLabel>
        {sourcesOpen && (
          <div style={{ marginTop: 6 }}>
            {platforms.filter(p => p.items.length > 0).map(plat => (
              <div key={plat.id}>
                <div onClick={() => setOpenPlatform(openPlatform === plat.id ? null : plat.id)} style={{ display: "flex", alignItems: "center", padding: "7px 4px", cursor: "pointer", borderBottom: "1px solid var(--line)", transition: "background 0.1s" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500 }}>{plat.label}</span>
                    <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{plat.items.length} sources</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--line-2)", transform: openPlatform === plat.id ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>›</span>
                </div>
                {openPlatform === plat.id && (
                  <div style={{ padding: "6px 0 8px 4px", borderBottom: "1px solid var(--line)", maxHeight: 180, overflowY: "auto" }}>
                    <AddRow placeholder={plat.placeholder} onAdd={() => {}} />
                    {plat.items.map(item => <SrcRow key={item} name={item} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Competitors */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel open={competitorsOpen} onToggle={() => setCompetitorsOpen(o => !o)}>Competitors</DpLabel>
        {competitorsOpen && (
          <div style={{ marginTop: 6 }}>
            <AddRow placeholder="Add competitor..." onAdd={onAddCompetitor} />
            {competitors.map(c => <SrcRow key={c} name={c} onRemove={() => onRemoveCompetitor(c)} />)}
          </div>
        )}
      </div>

      {/* Thought Leaders */}
      <div style={{ marginBottom: 14 }}>
        <DpLabel open={thoughtLeadersOpen} onToggle={() => setThoughtLeadersOpen(o => !o)}>Thought Leaders</DpLabel>
        {thoughtLeadersOpen && (
          <div style={{ marginTop: 6 }}>
            <AddRow placeholder="Add thought leader..." onAdd={onAddThoughtLeader} />
            {thoughtLeaders.map(tl => <SrcRow key={tl} name={tl} onRemove={() => onRemoveThoughtLeader(tl)} />)}
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 9, color: "var(--line-2)", textAlign: "center" as const, borderTop: "1px solid var(--line)" }}>
        © 2026 Mixed Grill, LLC
      </div>
    </>
  );
}

// ── Signal card components ────────────────────────────────────
function SignalCard({ signal, ctaLabel, ctaColor, onCta }: {
  signal: Signal; ctaLabel: string; ctaColor: string; onCta?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ flex: 1, fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5 }}>
        <strong style={{ color: "var(--fg)" }}>{signal.title}</strong>
        {signal.summary ? `, ${signal.summary}` : ""}
        {signal.implication && (
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 3, lineHeight: 1.4 }}>{signal.implication}</div>
        )}
        {signal.sources && signal.sources.length > 0 && (
          <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 3 }}>
            {signal.sources.map(s => s.name).join(" · ")}
          </div>
        )}
      </div>
      {onCta && (
        <button
          onClick={onCta}
          style={{
            fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const,
            padding: "3px 8px", borderRadius: 4, border: `1px solid ${ctaColor}33`,
            background: `${ctaColor}09`, color: ctaColor, flexShrink: 0,
            fontFamily: FONT, transition: "opacity 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function OpportunityRow({ signal, active }: { signal: Signal; active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", opacity: active ? 1 : 0.5 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "var(--blue)" : "var(--line-2)", flexShrink: 0, marginTop: 5 }} />
      <span style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5 }}>{signal.title}{signal.summary ? `, ${signal.summary}` : ""}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function Watch() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setDashContent, setDashOpen } = useShell();

  // Sources & config (real from Supabase or defaults)
  const [sources, setSources] = useState<WatchSource[]>(DEFAULT_SOURCES);
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS || []);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [thoughtLeaders, setThoughtLeaders] = useState<string[]>([]);

  // Load user's sentinel_topics from profile (overrides DEFAULT_KEYWORDS)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("sentinel_topics")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.sentinel_topics && Array.isArray(data.sentinel_topics) && data.sentinel_topics.length > 0) {
          setKeywords(data.sentinel_topics);
        }
      });
  }, [user]);

  // Briefing state
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [briefingDate, setBriefingDate] = useState("");
  const [briefingTime, setBriefingTime] = useState("Updated 6:00 AM");
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

  // Load latest briefing from Supabase
  useEffect(() => {
    if (!user) { setLoadingBriefing(false); return; }
    (async () => {
      // run-sentinel writes to watch_briefings with columns: briefing (jsonb), created_at
      // briefing column shape: { signals: [...], suggestions: [...] }
      const { data } = await supabase
        .from("watch_briefings")
        .select("briefing, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.briefing) {
        const b = data.briefing as any;
        // Transform { signals, suggestions } into BriefingData sections shape
        setBriefing({
          sections: {
            content_triggers: (b.signals || []).map((s: any) => ({
              title: s.headline || s.title || "",
              summary: s.relevance || s.description || "",
              cta_label: s.track === "competitor" ? "Note it" : "Use this",
            })),
            opportunities: (b.suggestions || []).map((s: any) => ({
              title: s.topic || s.title || "",
              summary: s.oneLiner || s.anglePrompt || "",
              priority: "High" as const,
            })),
            threats: (b.signals || [])
              .filter((s: any) => s.track === "competitor" || s.track === "thoughtLeader")
              .map((s: any) => ({
                title: s.source ? `${s.track === "competitor" ? "Competitor" : "Thought leader"}: ${s.source}` : s.headline || "",
                summary: s.relevance || "",
                priority: (s.scores?.composite ?? 0) >= 4 ? "High" as const : "Low" as const,
              })),
          },
        });
        setBriefingDate(new Date(data.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
        setBriefingTime(`Updated ${new Date(data.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
      }
      setLoadingBriefing(false);
    })();
  }, [user]);

  // Generate fresh briefing
  const handleGenerateBriefing = async () => {
    if (!user || generatingBriefing) return;
    setGeneratingBriefing(true);
    toast("Generating briefing...");

    try {
      const res = await fetchWithRetry(`${API_BASE}/api/run-sentinel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          forceRefresh: true,
          sentinelConfig: {
            keywords,
            rankingWeights: { relevance: 5, actionability: 3, urgency: 2 },
            tracks: { competitors, thoughtLeaders },
          },
          sources: sources.map(s => ({ name: s.name, type: s.type, track: s.track })),
        }),
      }, { timeout: 120000 });

      if (!res.ok) throw new Error(`Sentinel error ${res.status}`);
      const data = await res.json();

      // run-sentinel returns { signals: [...], suggestions: [...], cached: bool }
      if (data.signals || data.suggestions) {
        setBriefing({
          sections: {
            content_triggers: (data.signals || []).map((s: any) => ({
              title: s.headline || s.title || "",
              summary: s.relevance || s.description || "",
              cta_label: s.track === "competitor" ? "Note it" : "Use this",
            })),
            opportunities: (data.suggestions || []).map((s: any) => ({
              title: s.topic || s.title || "",
              summary: s.oneLiner || s.anglePrompt || "",
              priority: "High" as const,
            })),
            threats: (data.signals || [])
              .filter((s: any) => s.track === "competitor" || s.track === "thoughtLeader")
              .map((s: any) => ({
                title: s.source ? `${s.track === "competitor" ? "Competitor" : "Thought leader"}: ${s.source}` : s.headline || "",
                summary: s.relevance || "",
                priority: (s.scores?.composite ?? 0) >= 4 ? "High" as const : "Low" as const,
              })),
          },
        });
        const now = new Date();
        setBriefingDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
        setBriefingTime(`Updated ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
        toast("Briefing ready.");
      } else if (data.error) {
        toast(data.error, "error");
      }
    } catch (err) {
      toast("Could not generate briefing. Try again.", "error");
      console.error("[Watch][sentinel]", err);
    } finally {
      setGeneratingBriefing(false);
    }
  };

  // Inject dashboard panel
  useLayoutEffect(() => {
    setDashOpen(true);
    setDashContent(
      <WatchDashboard
        sources={sources}
        keywords={keywords}
        competitors={competitors}
        thoughtLeaders={thoughtLeaders}
        onAddKeyword={v => {
          const trimmed = v.trim();
          if (!trimmed) return;
          setKeywords(k => {
            if (k.includes(trimmed)) return k;
            const updated = [...k, trimmed];
            if (user) supabase.from("profiles").update({ sentinel_topics: updated }).eq("id", user.id);
            return updated;
          });
        }}
        onRemoveKeyword={v => {
          setKeywords(k => {
            const updated = k.filter(x => x !== v);
            if (user) supabase.from("profiles").update({ sentinel_topics: updated }).eq("id", user.id);
            return updated;
          });
        }}
        onAddCompetitor={v => setCompetitors(c => v.trim() && !c.includes(v.trim()) ? [...c, v.trim()] : c)}
        onRemoveCompetitor={v => setCompetitors(c => c.filter(x => x !== v))}
        onAddThoughtLeader={v => setThoughtLeaders(t => v.trim() && !t.includes(v.trim()) ? [...t, v.trim()] : t)}
        onRemoveThoughtLeader={v => setThoughtLeaders(t => t.filter(x => x !== v))}
      />
    );
    return () => setDashContent(null);
  }, [sources, keywords, competitors, thoughtLeaders, setDashContent, setDashOpen]);

  const now = new Date();
  const displayDate = briefingDate || now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Extract sections from live briefing or fall back to static demo
  const sections = briefing?.sections;
  // Only show real briefing data, no static fallbacks
  const contentTriggers = sections?.content_triggers ?? sections?.whats_moving ?? [];
  const opportunities = sections?.opportunities ?? [];
  const marketSignals = sections?.threats ?? [];

  const Card = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginBottom: 10, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 44, borderBottom: "1px solid var(--line)", flexShrink: 0, background: "var(--bg)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg)" }}>Briefing</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{displayDate} · {briefingTime}</span>
          <button
            onClick={handleGenerateBriefing}
            disabled={generatingBriefing || loadingBriefing}
            style={{
              fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 5,
              border: "1px solid var(--line)", background: "var(--surface)",
              color: "var(--fg-2)", cursor: generatingBriefing ? "not-allowed" : "pointer",
              fontFamily: FONT, opacity: generatingBriefing ? 0.5 : 1,
              transition: "all 0.1s",
            }}
            onMouseEnter={e => { if (!generatingBriefing) e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-2)"; }}
          >
            {generatingBriefing ? "Generating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {loadingBriefing ? (
          <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "40px 0", textAlign: "center" as const }}>Loading briefing...</div>
        ) : generatingBriefing ? (
          <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "40px 0", textAlign: "center" as const }}>
            Generating your briefing. This takes about 60 seconds...
          </div>
        ) : contentTriggers.length === 0 && opportunities.length === 0 && marketSignals.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "48px 24px" }}>
            <div style={{ fontSize: 28, color: "var(--line)", marginBottom: 16 }}>◉</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>No briefing yet</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6, marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>
              Add your keywords and sources in the dashboard panel, then hit Refresh to generate your first briefing.
            </div>
            <button
              onClick={handleGenerateBriefing}
              disabled={generatingBriefing}
              style={{
                fontSize: 12, fontWeight: 600, padding: "9px 20px", borderRadius: 6,
                background: "var(--fg)", border: "none", color: "var(--surface)",
                cursor: "pointer", fontFamily: "var(--font)",
              }}
            >
              Generate briefing
            </button>
          </div>
        ) : (
          <>
            {contentTriggers.length > 0 && (
              <Card title="Content Triggers">
                {contentTriggers.slice(0, 5).map((item, i) => (
                  <SignalCard
                    key={i}
                    signal={item}
                    ctaLabel={item.cta_label === "Note it" ? "Note it" : "Use this"}
                    ctaColor={item.cta_label === "Note it" ? "var(--gold)" : "var(--blue)"}
                    onCta={() => {
                      if (item.cta_label !== "Note it") {
                        sessionStorage.setItem("ew-signal-text", item.title);
                        sessionStorage.setItem("ew-signal-detail", item.summary || "");
                        nav("/studio/work");
                      }
                    }}
                  />
                ))}
              </Card>
            )}

            {opportunities.length > 0 && (
              <Card title="Opportunities">
                {opportunities.slice(0, 5).map((item, i) => (
                  <OpportunityRow key={i} signal={item} active={(item as any).priority !== "Low"} />
                ))}
              </Card>
            )}

            {marketSignals.length > 0 && (
              <Card title="Market Signals">
                {marketSignals.slice(0, 5).map((item, i) => (
                  <OpportunityRow key={i} signal={item} active={(item as any).priority === "High"} />
                ))}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
