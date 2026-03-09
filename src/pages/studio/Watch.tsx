import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SENTINEL - WATCH PAGE
// Intelligence monitoring. Briefings. Signals. Fish scores.
// ─────────────────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  category: "moving" | "threat" | "opportunity" | "trigger" | "event";
  title: string;
  body: string;
  source?: string;
  fish?: number;
  date: string;
  sources?: number;
  expanded?: boolean;
}

const MOCK_BRIEFING: Signal[] = [
  {
    id: "1", category: "moving",
    title: "AI content tools see 40% enterprise adoption surge in Q1",
    body: "Enterprise software buyers are consolidating their AI tooling stack, with content production tools seeing the steepest adoption curve. Vendors without differentiated voice features are losing deals to platforms with verifiable authenticity layers.",
    source: "Forrester Research", date: "Mar 7", sources: 3,
  },
  {
    id: "2", category: "moving",
    title: "LinkedIn algorithm shifts favor original narrative content",
    body: "Platform data shows a significant algorithmic boost for posts with sustained first-person narrative structure over 150 words. Generic AI-detectable content sees 60% reduced reach. Native video with captions showing the largest absolute gains.",
    source: "Social Media Examiner", date: "Mar 6", sources: 2,
  },
  {
    id: "3", category: "moving",
    title: "Newsletter open rates recover as inbox filtering improves",
    body: "After two years of decline, average B2B newsletter open rates are climbing back above 28% for segmented lists. Writers with consistent voice and irregular send cadence outperforming scheduled mass sends by significant margins.",
    source: "Mailchimp / Litmus", date: "Mar 5", sources: 4,
  },
  {
    id: "4", category: "threat",
    title: "Commoditization pressure on thought leadership content",
    body: "The market is flooded with AI-generated frameworks and listicles. Audiences are developing strong filters for generic strategic content. Original research, lived experience, and distinct voice are becoming the only moats.",
    source: "Content Marketing Institute", date: "Mar 6", sources: 2,
  },
  {
    id: "5", category: "threat",
    title: "Short-form video continues to compress written content attention",
    body: "Average time spent with long-form written content is down 18% year-over-year for professionals under 40. Hybrid content strategies (written anchor with video summary) showing strongest retention metrics.",
    source: "Reuters Institute", date: "Mar 5", sources: 3,
  },
  {
    id: "6", category: "opportunity", fish: 9,
    title: "Podcast listenership for business content at all-time high",
    body: "B2B podcast consumption up 31% in 2025. Guests with existing written content authority convert at 3x the rate of guest-only speakers. Your existing essay library is a ready-made podcast content bank.",
    source: "Edison Research", date: "Mar 7", sources: 3,
  },
  {
    id: "7", category: "opportunity", fish: 8,
    title: "Conference speakers with pre-event content see 2x engagement",
    body: "Data from 12 major business conferences shows speakers who publish content in the 30 days before their talk receive substantially higher session attendance and post-event connection requests.",
    source: "Event Marketer", date: "Mar 6", sources: 2,
  },
  {
    id: "8", category: "opportunity", fish: 7,
    title: "Executive ghostwriting demand up 55% on key platforms",
    body: "LinkedIn creator economy is creating strong demand for executives who publish consistently. Agencies report 55% increase in ghostwriting inquiries. Leaders who write their own content with AI assistance are commanding premium positioning.",
    source: "PR Week", date: "Mar 5", sources: 2,
  },
  {
    id: "9", category: "trigger",
    title: "The 'authenticity gap' in AI content becomes mainstream narrative",
    body: "Major business press now covering the delta between AI-written and human-written content as a strategic business risk. Strong angle for an essay: what real authenticity looks like in an AI-saturated landscape.",
    source: "Harvard Business Review", date: "Mar 7", sources: 2,
  },
  {
    id: "10", category: "trigger",
    title: "New Pew study on trust in expert content opens a useful door",
    body: "73% of professionals report they trust content more when it comes with clear evidence of lived experience. Compelling setup for a piece on the difference between credentials and credibility.",
    source: "Pew Research", date: "Mar 6", sources: 1,
  },
  {
    id: "11", category: "event",
    title: "SXSW 2026 call for speaker submissions open through April 15",
    body: "Theme this year: The Human-AI Creative Partnership. 8,000 attendees, strong business track. Your work on voice authenticity is a direct fit for 3 listed session categories.",
    source: "SXSW Official", date: "Mar 7", sources: 1,
  },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  moving:      { label: "What's Moving",      color: "#4A90D9", bg: "rgba(74,144,217,.10)", desc: "Developments shaping your landscape" },
  threat:      { label: "Threats",            color: "#e85d75", bg: "rgba(232,93,117,.10)", desc: "Risks worth watching" },
  opportunity: { label: "Opportunities",      color: "#50c8a0", bg: "rgba(80,200,160,.10)", desc: "Scored by effort-to-impact ratio" },
  trigger:     { label: "Content Triggers",   color: "#F5C642", bg: "rgba(245,198,66,.10)", desc: "Angles with source material ready" },
  event:       { label: "Event Radar",        color: "#a080f5", bg: "rgba(160,128,245,.10)", desc: "Relevant events near you" },
};

const FILTERS = ["all", "moving", "threat", "opportunity", "trigger", "event"] as const;

// ── Pill tag input (add via Enter or comma, remove via X) ─────────────────────
function PillSection({
  label,
  pills,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  pills: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = input.trim();
      if (v) { onAdd(v); setInput(""); }
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value.replace(/,/g, ""));
  const submitInput = () => {
    const v = input.trim();
    if (v) { onAdd(v); setInput(""); }
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {pills.map((p, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 20,
            padding: "5px 10px 5px 12px", fontSize: 12, color: "var(--fg)",
          }}>
            {p}
            <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${p}`} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%", border: "none", background: "var(--bg-3)",
              cursor: "pointer", color: "var(--fg-3)", padding: 0,
            }}><X size={10} strokeWidth={2.5} /></button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={submitInput}
          placeholder={placeholder}
          className="input-field"
          style={{ width: 140, padding: "6px 10px", fontSize: 12 }}
        />
      </div>
    </div>
  );
}

function FishScore({ score }: { score: number }) {
  const color = score >= 8 ? "#50c8a0" : score >= 6 ? "#F5C642" : "#e85d75";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `${color}18`, border: `1px solid ${color}30`,
      borderRadius: 20, padding: "2px 9px",
    }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: ".03em" }}>Fish {score}</span>
    </div>
  );
}

function SignalCard({ signal, onWrite }: { signal: Signal; onWrite: (s: Signal) => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[signal.category];

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: 12, overflow: "hidden",
      transition: "border-color .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      {/* Card header */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
              color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: 20,
            }}>{meta.label}</span>
            {signal.fish !== undefined && <FishScore score={signal.fish} />}
          </div>
          <span style={{ fontSize: 11, color: "var(--fg-3)", flexShrink: 0 }}>{signal.date}</span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", lineHeight: 1.45, marginBottom: 0, letterSpacing: "-.01em" }}>
          {signal.title}
        </h3>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div style={{ padding: "0 18px 14px", borderTop: "1px solid var(--line)" }}>
          <p style={{ fontSize: 13, lineHeight: 1.68, color: "var(--fg-2)", fontWeight: 300, marginBottom: 12, marginTop: 14 }}>{signal.body}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {signal.source && (
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
                Source: {signal.source}
                {signal.sources && signal.sources > 1 && ` + ${signal.sources - 1} more`}
              </span>
            )}
            {(signal.category === "trigger" || signal.category === "opportunity") && (
              <button onClick={() => onWrite(signal)} style={{
                marginLeft: "auto", background: "var(--fg)", border: "none",
                borderRadius: 7, padding: "6px 14px", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "var(--bg)",
                fontFamily: "var(--font)", transition: "opacity .15s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >Write from this signal</button>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setExpanded(e => !e)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", background: "none", border: "none",
        borderTop: "1px solid var(--line)", padding: "9px 18px",
        cursor: "pointer", fontFamily: "var(--font)",
        transition: "background .12s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{expanded ? "Collapse" : "Read briefing"}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

export default function Watch() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");
  const [configOpen, setConfigOpen] = useState(false);
  const [industries, setIndustries] = useState(["AI & Technology", "Content Strategy"]);
  const [topics, setTopics] = useState(["thought leadership", "AI content", "newsletter growth"]);
  const [people, setPeople] = useState(["Ann Handley", "Lenny Rachitsky"]);
  const [delivery, setDelivery] = useState<"daily" | "weekly" | "notable">("daily");

  const filtered = filter === "all" ? MOCK_BRIEFING : MOCK_BRIEFING.filter(s => s.category === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? MOCK_BRIEFING.length : MOCK_BRIEFING.filter(s => s.category === f).length;
    return acc;
  }, {} as Record<string, number>);

  const handleWrite = (signal: Signal) => {
    navigate(`/studio/work/new?type=essay&signal=${encodeURIComponent(signal.title)}`);
  };

  return (
    <div style={{ padding: "0 0 80px", fontFamily: "var(--font)" }}>
      {/* Configure slide-over */}
      {configOpen && (
        <>
          <div
            role="presentation"
            onClick={() => setConfigOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100,
              animation: "fadeIn 0.2s ease",
            }}
          />
          <div
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "100vw",
              background: "var(--bg)", borderLeft: "1px solid var(--line)", zIndex: 101,
              boxShadow: "-8px 0 24px rgba(0,0,0,0.12)", overflowY: "auto",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", margin: 0 }}>Sentinel configuration</h2>
              <button type="button" onClick={() => setConfigOpen(false)} aria-label="Close" style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36,
                borderRadius: "var(--studio-radius)", border: "none", background: "var(--bg-2)", cursor: "pointer", color: "var(--fg-2)",
              }}><X size={18} strokeWidth={2} /></button>
            </div>
            <div style={{ padding: "24px", flex: 1 }}>
              <PillSection
                label="Industries"
                pills={industries}
                onAdd={v => setIndustries(prev => [...prev, v])}
                onRemove={i => setIndustries(prev => prev.filter((_, j) => j !== i))}
                placeholder="Add industry…"
              />
              <PillSection
                label="Topics & Keywords"
                pills={topics}
                onAdd={v => setTopics(prev => [...prev, v])}
                onRemove={i => setTopics(prev => prev.filter((_, j) => j !== i))}
                placeholder="Add topic or keyword…"
              />
              <PillSection
                label="People to Watch"
                pills={people}
                onAdd={v => setPeople(prev => [...prev, v])}
                onRemove={i => setPeople(prev => prev.filter((_, j) => j !== i))}
                placeholder="Add person…"
              />
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 10 }}>Delivery</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["daily", "weekly", "notable"] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDelivery(opt)}
                      style={{
                        flex: 1, padding: "10px 12px", fontSize: 12, fontWeight: 500,
                        fontFamily: "var(--font)", border: "1px solid",
                        borderRadius: "var(--studio-radius)", cursor: "pointer",
                        background: delivery === opt ? "var(--fg)" : "var(--bg-2)",
                        color: delivery === opt ? "var(--bg)" : "var(--fg-2)",
                        borderColor: delivery === opt ? "var(--fg)" : "var(--line)",
                      }}
                    >
                      {opt === "daily" ? "Daily" : opt === "weekly" ? "Weekly" : "When Notable"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", padding: "12px" }}
                onClick={() => setConfigOpen(false)}
              >
                Save Configuration
              </button>
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </>
      )}

      {/* Page header */}
      <div style={{
        padding: "var(--studio-gap-lg) 0 20px",
        borderBottom: "1px solid var(--line)",
        background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: "var(--studio-content-max)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-.03em", marginBottom: 4 }}>Sentinel</h1>
              <p style={{ fontSize: 13, color: "var(--fg-3)", fontWeight: 300 }}>
                Morning briefing &nbsp;·&nbsp; Sunday, March 8, 2026 &nbsp;·&nbsp; {MOCK_BRIEFING.length} signals across 5 categories
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>Next briefing Tuesday</span>
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="btn-ghost"
                style={{ fontSize: 12, padding: "6px 14px" }}
              >
                Configure
              </button>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#50c8a0", boxShadow: "0 0 6px rgba(80,200,160,.5)" }} />
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const active = f === filter;
              const meta = f !== "all" ? CATEGORY_META[f] : null;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: active ? (meta ? meta.bg : "var(--bg-3)") : "transparent",
                  border: `1px solid ${active ? (meta ? meta.color + "44" : "var(--line-2)") : "var(--line)"}`,
                  borderRadius: 20, padding: "5px 12px", cursor: "pointer",
                  fontFamily: "var(--font)", fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? (meta ? meta.color : "var(--fg)") : "var(--fg-3)",
                  transition: "all .15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {f === "all" ? "All" : CATEGORY_META[f].label}
                  <span style={{
                    fontSize: 10, padding: "1px 5px", borderRadius: 10,
                    background: active ? "rgba(255,255,255,.2)" : "var(--bg-2)",
                    color: active ? "inherit" : "var(--fg-3)",
                  }}>{counts[f]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Signals grid */}
      <div style={{ maxWidth: "var(--studio-content-max)", margin: "28px auto 0", padding: 0 }}>
        {/* Category groups */}
        {filter === "all" ? (
          Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const signals = MOCK_BRIEFING.filter(s => s.category === cat);
            if (!signals.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 600, color: meta.color, letterSpacing: ".04em", textTransform: "uppercase" }}>{meta.label}</h2>
                  <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{meta.desc}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {signals.map(s => <SignalCard key={s.id} signal={s} onWrite={handleWrite} />)}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(s => <SignalCard key={s.id} signal={s} onWrite={handleWrite} />)}
          </div>
        )}
      </div>
    </div>
  );
}
