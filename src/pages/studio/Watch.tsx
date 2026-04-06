/**
 * Watch.tsx, Sentinel Briefing + Research + Settings
 * Rewritten to match Alpha 3.001 wireframe: three center tabs, simplified right panel
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
import { useMobile } from "../../hooks/useMobile";
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

// ── Signal card components (kept from original) ────────────────
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
        <button onClick={onCta} style={{
          fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const,
          padding: "3px 8px", borderRadius: 4, border: `1px solid ${ctaColor}33`,
          background: `${ctaColor}09`, color: ctaColor, flexShrink: 0,
          fontFamily: FONT, transition: "opacity 0.1s",
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >{ctaLabel}</button>
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

// ── Briefing Card ──────────────────────────────────────────────
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginBottom: 10, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Settings Add Row ───────────────────────────────────────────
function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} placeholder={placeholder} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "var(--fg)", fontFamily: FONT, outline: "none" }} />
      <button onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }} style={{ padding: "4px 9px", borderRadius: 4, background: "var(--fg)", border: "none", color: "var(--surface)", fontSize: 16, lineHeight: 1, cursor: "pointer" }}>+</button>
    </div>
  );
}

// ── Tag Chips ──────────────────────────────────────────────────
function TagChips({ items, onRemove, chipStyle }: { items: string[]; onRemove: (v: string) => void; chipStyle?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
      {items.map(item => (
        <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--fg-2)", background: "var(--bg)", border: "1px solid var(--line)", padding: "3px 8px", borderRadius: 4, ...chipStyle }}>
          {item}
          <span onClick={() => onRemove(item)} style={{ cursor: "pointer", color: "var(--fg-3)", fontSize: 12, lineHeight: 1 }}>&times;</span>
        </span>
      ))}
    </div>
  );
}

// ── Source Rows (newsletter/podcast/pub style) ─────────────────
function SourceRows({ items, onRemove, borderColor }: { items: string[]; onRemove: (v: string) => void; borderColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 10 }}>
      {items.map(item => (
        <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderLeft: `3px solid ${borderColor}`, borderBottom: "1px solid var(--line)" }}>
          <span style={{ flex: 1, fontSize: 11, color: "var(--fg-2)" }}>{item}</span>
          <span onClick={() => onRemove(item)} style={{ cursor: "pointer", color: "var(--fg-3)", fontSize: 12, lineHeight: 1 }}>&times;</span>
        </div>
      ))}
    </div>
  );
}

// ── Right Panel: Watch Dashboard ──────────────────────────────
function WatchRightPanel({ briefing, contentTriggers, opportunities, prefillReed }: {
  briefing: BriefingData | null;
  contentTriggers: Signal[];
  opportunities: Signal[];
  prefillReed: (text: string) => void;
}) {
  const signalCount = contentTriggers.length;
  const topSignal = contentTriggers[0]?.title || "";
  const topOpp = opportunities[0]?.title || "";
  const hasBriefing = signalCount > 0 || opportunities.length > 0;

  const signalSummary = hasBriefing
    ? `Reed has read your sources. ${signalCount} signal${signalCount !== 1 ? "s" : ""} surfaced above threshold.${topSignal ? ` Top signal: ${topSignal}.` : ""}`
    : "No briefing generated yet. Run a briefing to see signal analysis.";

  const weekSummary = hasBriefing
    ? `${signalCount} signal${signalCount !== 1 ? "s" : ""} flagged as high relevance.${topOpp ? ` Top opportunity: ${topOpp}.` : ""}`
    : "Run a briefing to see this week's analysis.";

  const reedAssessment = hasBriefing
    ? `The strongest signal this week is ${topSignal || "in your queue"}. ${topOpp ? `Consider writing about ${topOpp}.` : "Review signals to find your next piece."}`
    : "Run your first briefing. Reed will analyze your sources and surface what matters.";

  const chips = [
    { label: "Turn signal into brief", prefill: "Turn the strongest signal this week into a content brief for me." },
    { label: "What should I write about?", prefill: "Based on this week's signals, what's the most timely thing for me to write about?" },
    { label: "Who went quiet?", prefill: "Which competitors went quiet this week and what does that mean for my positioning?" },
  ];

  const DpSection = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>{children}</div>
  );
  const DpLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>{children}</div>
  );

  return (
    <>
      <DpSection>
        <DpLabel>Signal Review</DpLabel>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>{signalSummary}</div>
      </DpSection>

      <DpSection>
        <DpLabel>This Week</DpLabel>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>{weekSummary}</div>
      </DpSection>

      <div style={{
        border: "1px solid rgba(74,144,217,0.25)", borderRadius: 8,
        padding: "10px 12px", background: "rgba(74,144,217,0.04)", marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4A90D9", marginBottom: 6 }}>Reed</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>{reedAssessment}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {chips.map((chip, i) => (
          <button key={i} onClick={() => prefillReed(chip.prefill)} style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 99,
            background: "#EDF1F5", border: "1px solid #CBD5E1",
            color: "#334155", cursor: "pointer", fontFamily: "inherit",
          }}>{chip.label}</button>
        ))}
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function Watch() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setDashContent, setDashOpen, setFeedbackContent, setReedPrefill, setActiveDashTab } = useShell();
  const isMobile = useMobile();

  const [activeTab, setActiveTab] = useState<"briefing" | "research" | "settings">("briefing");

  // Sources & config
  const [sources, setSources] = useState<WatchSource[]>(DEFAULT_SOURCES);
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS || []);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [thoughtLeaders, setThoughtLeaders] = useState<string[]>([]);
  const [newsletters, setNewsletters] = useState<string[]>([]);
  const [podcasts, setPodcasts] = useState<string[]>([]);
  const [publications, setPublications] = useState<string[]>([]);
  const [substacks, setSubstacks] = useState<string[]>([]);
  const [redditCommunities, setRedditCommunities] = useState<string[]>([]);

  // Initialize source lists from DEFAULT_SOURCES
  useEffect(() => {
    const byType: Record<string, string[]> = { newsletter: [], podcast: [], publication: [], substack: [] };
    DEFAULT_SOURCES.forEach(s => { if (byType[s.type]) byType[s.type].push(s.name); });
    setNewsletters(byType.newsletter);
    setPodcasts(byType.podcast);
    setPublications(byType.publication);
    setSubstacks(byType.substack);
  }, []);

  // Load user's sentinel_topics from profile
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

  // Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [researchMessage, setResearchMessage] = useState("");

  // Load latest briefing from Supabase
  useEffect(() => {
    if (!user) { setLoadingBriefing(false); return; }
    (async () => {
      const { data } = await supabase
        .from("watch_briefings")
        .select("briefing, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.briefing) {
        const b = data.briefing as any;
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

  // Keyword persistence helpers
  const addKeyword = (v: string) => {
    if (!v) return;
    setKeywords(k => {
      if (k.includes(v)) return k;
      const updated = [...k, v];
      if (user) supabase.from("profiles").update({ sentinel_topics: updated }).eq("id", user.id);
      return updated;
    });
  };
  const removeKeyword = (v: string) => {
    setKeywords(k => {
      const updated = k.filter(x => x !== v);
      if (user) supabase.from("profiles").update({ sentinel_topics: updated }).eq("id", user.id);
      return updated;
    });
  };
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => {
    if (!v) return;
    setter(prev => prev.includes(v) ? prev : [...prev, v]);
  };
  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => {
    setter(prev => prev.filter(x => x !== v));
  };

  // Prefill Reed and switch to Ask Reed tab
  const prefillReed = (text: string) => {
    setReedPrefill(text);
    setActiveDashTab("reed");
  };

  // Extract briefing sections
  const sections = briefing?.sections;
  const contentTriggers = sections?.content_triggers ?? sections?.whats_moving ?? [];
  const opportunities = sections?.opportunities ?? [];
  const marketSignals = sections?.threats ?? [];

  const now = new Date();
  const displayDate = briefingDate || now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Inject right panel dashboard
  useLayoutEffect(() => {
    setDashOpen(true);
    setFeedbackContent(
      <WatchRightPanel
        briefing={briefing}
        contentTriggers={contentTriggers}
        opportunities={opportunities}
        prefillReed={prefillReed}
      />
    );
    return () => setFeedbackContent(null);
  }, [briefing, contentTriggers, opportunities, setDashOpen, setFeedbackContent, setReedPrefill, setActiveDashTab]);

  // ── Settings tab content ─────────────────────────────────────
  const SettingsLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>{children}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "0 20px", background: "var(--bg)", flexShrink: 0 }}>
        {(["briefing", "research", "settings"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            fontSize: 11, fontWeight: activeTab === tab ? 600 : 500,
            color: activeTab === tab ? "var(--fg)" : "var(--fg-3)",
            padding: "11px 14px", borderBottom: activeTab === tab ? "2px solid var(--fg)" : "2px solid transparent",
            cursor: "pointer", transition: "color 0.1s, border-color 0.1s",
            background: "none", border: "none", borderBottomStyle: "solid",
            fontFamily: FONT,
          }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}

        {/* Right-side controls */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {activeTab === "briefing" && (
            <>
              <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{displayDate} · {briefingTime}</span>
              <button onClick={handleGenerateBriefing} disabled={generatingBriefing || loadingBriefing} style={{
                fontSize: 10, fontWeight: 600, padding: "4px 14px", borderRadius: 5,
                background: "var(--fg)", color: "var(--gold, #F5C642)", border: "none",
                cursor: generatingBriefing ? "not-allowed" : "pointer", fontFamily: FONT,
                letterSpacing: "0.02em", opacity: generatingBriefing ? 0.5 : 1,
              }}>{generatingBriefing ? "Running..." : "Run Brief"}</button>
            </>
          )}
          {activeTab === "settings" && (
            <>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)" }}>FREQ</span>
              {["Daily", "Weekly", "Real-time"].map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--fg-2)", cursor: "pointer" }}>
                  <input type="radio" name="freq" defaultChecked={opt === "Daily"} style={{ accentColor: "var(--blue, #4A90D9)" }} />{opt}
                </label>
              ))}
              <button style={{
                fontSize: 10, fontWeight: 600, padding: "4px 14px", borderRadius: 5,
                background: "var(--fg)", color: "var(--gold, #F5C642)", border: "none",
                cursor: "pointer", fontFamily: FONT, letterSpacing: "0.02em",
              }}>Save</button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* ── BRIEFING TAB ── */}
        {activeTab === "briefing" && (
          <div style={{ padding: 20 }}>
            {loadingBriefing ? (
              <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "40px 0", textAlign: "center" as const }}>Loading briefing...</div>
            ) : generatingBriefing ? (
              <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "40px 0", textAlign: "center" as const }}>
                Generating your briefing. This takes about 60 seconds...
              </div>
            ) : contentTriggers.length === 0 && opportunities.length === 0 && marketSignals.length === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "48px 24px" }}>
                <div style={{ fontSize: 28, color: "var(--line)", marginBottom: 16 }}>&#9673;</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>No briefing yet</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6, marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>
                  Add your keywords and sources in the Settings tab, then hit Run Brief to generate your first briefing.
                </div>
                <button onClick={handleGenerateBriefing} disabled={generatingBriefing} style={{
                  fontSize: 12, fontWeight: 600, padding: "9px 20px", borderRadius: 6,
                  background: "var(--fg)", border: "none", color: "var(--surface)",
                  cursor: "pointer", fontFamily: FONT,
                }}>Generate briefing</button>
              </div>
            ) : (
              <>
                {contentTriggers.length > 0 && (
                  <Card title="Content Triggers">
                    {contentTriggers.slice(0, 5).map((item, i) => (
                      <SignalCard key={i} signal={item}
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
        )}

        {/* ── RESEARCH TAB ── */}
        {activeTab === "research" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: 20, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Research a person, publication, or topic</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 12 }}>Reed searches across podcasts, newsletters, Substack, Reddit, and publications. You decide what to follow.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={researchQuery} onChange={e => setResearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && researchQuery.trim()) { setResearchMessage(`Searching for '${researchQuery.trim()}' across sources. Results will appear here when the research API is connected.`); } }}
                  placeholder="e.g. Scott Galloway, Stratechery, fractional CAIO..."
                  style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "var(--fg)", fontFamily: FONT, outline: "none" }} />
                <button onClick={() => { if (researchQuery.trim()) setResearchMessage(`Searching for '${researchQuery.trim()}' across sources. Results will appear here when the research API is connected.`); }}
                  style={{ padding: "8px 16px", borderRadius: 6, background: "var(--fg)", color: "var(--surface)", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Search</button>
              </div>
            </div>

            {researchMessage && (
              <div style={{ padding: "10px 20px", background: "rgba(74,144,217,0.05)", borderBottom: "1px solid rgba(74,144,217,0.15)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--fg)", flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, flex: 1 }}>{researchMessage}</div>
                </div>
              </div>
            )}

            {!researchMessage && (
              <div style={{ fontSize: 11, color: "var(--fg-3)", textAlign: "center" as const, paddingTop: 40 }}>
                Search to see results. Reed will help you decide what is worth following.
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
              {/* LEFT COLUMN */}
              <div>
                <SettingsLabel>Keywords</SettingsLabel>
                <div style={{ fontSize: 11, color: "var(--fg-2)", marginBottom: 10 }}>Reed watches these terms across all sources.</div>
                <TagChips items={keywords} onRemove={removeKeyword} />
                <AddRow placeholder="Add a keyword..." onAdd={addKeyword} />

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Newsletters</SettingsLabel>
                  <SourceRows items={newsletters} onRemove={removeItem(setNewsletters)} borderColor="rgba(74,144,217,0.4)" />
                  <AddRow placeholder="Add newsletter..." onAdd={addItem(setNewsletters)} />
                </div>

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Podcasts</SettingsLabel>
                  <SourceRows items={podcasts} onRemove={removeItem(setPodcasts)} borderColor="rgba(196,154,32,0.4)" />
                  <AddRow placeholder="Add podcast..." onAdd={addItem(setPodcasts)} />
                </div>

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Reddit Communities</SettingsLabel>
                  <TagChips items={redditCommunities} onRemove={removeItem(setRedditCommunities)} />
                  <AddRow placeholder="e.g. r/consulting..." onAdd={addItem(setRedditCommunities)} />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                <SettingsLabel>Competitors</SettingsLabel>
                <TagChips items={competitors} onRemove={removeItem(setCompetitors)} chipStyle={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#991B1B" }} />
                <AddRow placeholder="Add competitor..." onAdd={addItem(setCompetitors)} />

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Thought Leaders</SettingsLabel>
                  <TagChips items={thoughtLeaders} onRemove={removeItem(setThoughtLeaders)} chipStyle={{ background: "rgba(245,198,66,0.08)", border: "1px solid rgba(245,198,66,0.3)", color: "#92400E" }} />
                  <AddRow placeholder="Add thought leader..." onAdd={addItem(setThoughtLeaders)} />
                </div>

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Publications</SettingsLabel>
                  <SourceRows items={publications} onRemove={removeItem(setPublications)} borderColor="rgba(74,144,217,0.3)" />
                  <AddRow placeholder="Add publication..." onAdd={addItem(setPublications)} />
                </div>

                <div style={{ marginTop: 20 }}>
                  <SettingsLabel>Substack</SettingsLabel>
                  <SourceRows items={substacks} onRemove={removeItem(setSubstacks)} borderColor="rgba(168,85,247,0.3)" />
                  <AddRow placeholder="Add Substack..." onAdd={addItem(setSubstacks)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
