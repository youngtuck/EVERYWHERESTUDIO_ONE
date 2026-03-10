import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown } from "lucide-react";
import "./shared.css";

interface Signal {
  id: string;
  category: "moving" | "threat" | "opportunity" | "trigger" | "event";
  title: string;
  body: string;
  source?: string;
  fish?: number;
  date: string;
  sources?: number;
}

const MOCK_BRIEFING: Signal[] = [
  { id: "1", category: "moving", title: "AI content tools see 40% enterprise adoption surge in Q1", body: "Enterprise software buyers are consolidating their AI tooling stack, with content production tools seeing the steepest adoption curve.", source: "Forrester Research", date: "Mar 7", sources: 3 },
  { id: "2", category: "moving", title: "LinkedIn algorithm shifts favor original narrative content", body: "Platform data shows a significant algorithmic boost for posts with sustained first-person narrative structure over 150 words.", source: "Social Media Examiner", date: "Mar 6", sources: 2 },
  { id: "3", category: "moving", title: "Newsletter open rates recover as inbox filtering improves", body: "After two years of decline, average B2B newsletter open rates are climbing back above 28% for segmented lists.", source: "Mailchimp / Litmus", date: "Mar 5", sources: 4 },
  { id: "4", category: "threat", title: "Commoditization pressure on thought leadership content", body: "The market is flooded with AI-generated frameworks and listicles. Audiences are developing strong filters for generic strategic content.", source: "Content Marketing Institute", date: "Mar 6", sources: 2 },
  { id: "5", category: "threat", title: "Short-form video continues to compress written content attention", body: "Average time spent with long-form written content is down 18% year-over-year for professionals under 40.", source: "Reuters Institute", date: "Mar 5", sources: 3 },
  { id: "6", category: "opportunity", fish: 9, title: "Podcast listenership for business content at all-time high", body: "B2B podcast consumption up 31% in 2025. Guests with existing written content authority convert at 3x the rate.", source: "Edison Research", date: "Mar 7", sources: 3 },
  { id: "7", category: "opportunity", fish: 8, title: "Conference speakers with pre-event content see 2x engagement", body: "Data from 12 major business conferences shows speakers who publish content in the 30 days before their talk receive substantially higher session attendance.", source: "Event Marketer", date: "Mar 6", sources: 2 },
  { id: "8", category: "opportunity", fish: 7, title: "Executive ghostwriting demand up 55% on key platforms", body: "LinkedIn creator economy is creating strong demand for executives who publish consistently. Agencies report 55% increase in ghostwriting inquiries.", source: "PR Week", date: "Mar 5", sources: 2 },
  { id: "9", category: "trigger", title: "The authenticity gap in AI content becomes mainstream narrative", body: "Major business press now covering the delta between AI-written and human-written content as a strategic business risk.", source: "Harvard Business Review", date: "Mar 7", sources: 2 },
  { id: "10", category: "trigger", title: "New Pew study on trust in expert content opens a useful door", body: "73% of professionals report they trust content more when it comes with clear evidence of lived experience.", source: "Pew Research", date: "Mar 6", sources: 1 },
  { id: "11", category: "event", title: "SXSW 2026 call for speaker submissions open through April 15", body: "Theme this year: The Human-AI Creative Partnership. 8,000 attendees, strong business track.", source: "SXSW Official", date: "Mar 7", sources: 1 },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  moving:      { label: "What's Moving",      color: "#C8961A", bg: "rgba(200,150,26,0.1)", desc: "Developments shaping your landscape" },
  threat:      { label: "Threats",            color: "#D64545", bg: "rgba(214,69,69,0.1)", desc: "Risks worth watching" },
  opportunity: { label: "Opportunities",      color: "#3A9A5C", bg: "rgba(58,154,92,0.1)", desc: "Scored by effort-to-impact ratio" },
  trigger:     { label: "Content Triggers",   color: "#0D8C9E", bg: "rgba(13,140,158,0.1)", desc: "Angles with source material ready" },
  event:       { label: "Event Radar",        color: "#A080F5", bg: "rgba(160,128,245,0.1)", desc: "Relevant events near you" },
};

const FILTERS = ["all", "moving", "threat", "opportunity", "trigger", "event"] as const;

function SignalCard({ signal, onWrite }: { signal: Signal; onWrite: (s: Signal) => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[signal.category];
  const transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        transition,
      }}
      onMouseEnter={(e) => {
        if (!expanded) e.currentTarget.style.borderColor = "var(--border-default)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: meta.color,
              background: meta.bg,
              padding: "3px 10px",
              borderRadius: 4,
            }}
          >
            {meta.label}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>
            {signal.date}
          </span>
        </div>
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {signal.title}
        </h3>

        {expanded && (
          <div style={{ paddingTop: 16 }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                margin: "0 0 16px",
              }}
            >
              {signal.body}
            </p>
            {signal.source && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>
                Source: {signal.source}
                {signal.sources && signal.sources > 1 && ` + ${signal.sources - 1} more`}
              </span>
            )}
            {(signal.category === "trigger" || signal.category === "opportunity") && (
              <button
                type="button"
                onClick={() => onWrite(signal)}
                style={{
                  marginTop: 12,
                  display: "block",
                  background: "var(--text-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Write from this signal
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          borderTop: "1px solid var(--border-subtle)",
          padding: "12px 20px",
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: "var(--text-secondary)",
          transition,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <span>{expanded ? "Collapse" : "Read briefing"}</span>
        <ChevronDown
          size={18}
          style={{
            color: "var(--text-tertiary)",
            transform: expanded ? "rotate(180deg)" : "none",
            transition,
          }}
        />
      </button>
    </div>
  );
}

export default function Watch() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");
  const [configOpen, setConfigOpen] = useState(false);

  const filtered = filter === "all" ? MOCK_BRIEFING : MOCK_BRIEFING.filter((s) => s.category === filter);
  const counts = FILTERS.reduce(
    (acc, f) => {
      acc[f] = f === "all" ? MOCK_BRIEFING.length : MOCK_BRIEFING.filter((s) => s.category === f).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleWrite = (signal: Signal) => {
    navigate(`/studio/work?type=essay&signal=${encodeURIComponent(signal.title)}`);
  };

  const briefingDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px 80px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {configOpen && (
        <>
          <div
            role="presentation"
            onClick={() => setConfigOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 420,
              maxWidth: "100vw",
              background: "var(--bg-light)",
              borderLeft: "1px solid var(--border-subtle)",
              zIndex: 101,
              boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Sentinel configuration</h2>
              <button type="button" onClick={() => setConfigOpen(false)} aria-label="Close" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: "none", background: "var(--surface-white)", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div style={{ padding: 24, flex: 1 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)" }}>Configure industries, topics, and people to watch. This panel can be wired to your backend when ready.</p>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Sentinel</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginTop: 4, marginBottom: 0 }}>Morning briefing · {briefingDate} · {MOCK_BRIEFING.length} signals across 5 categories</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>Next briefing Tuesday</span>
          <button type="button" onClick={() => setConfigOpen(true)} style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-default)", padding: "10px 20px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "var(--text-tertiary)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-default)"; }}>Configure</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 32, WebkitOverflowScrolling: "touch" }}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <button key={f} type="button" onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${active ? "transparent" : "var(--border-subtle)"}`, background: active ? "var(--text-primary)" : "transparent", color: active ? "#fff" : "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-primary)"; } }} onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}>
              {f === "all" ? "All" : CATEGORY_META[f].label} {counts[f]}
            </button>
          );
        })}
      </div>

      {filter === "all" ? (
        Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const signals = MOCK_BRIEFING.filter((s) => s.category === cat);
          if (!signals.length) return null;
          return (
            <div key={cat} style={{ marginTop: 40, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: meta.color }}>{meta.label}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>{meta.desc}</span>
              </div>
              {signals.map((s) => <SignalCard key={s.id} signal={s} onWrite={handleWrite} />)}
            </div>
          );
        })
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: CATEGORY_META[filter].color }}>{CATEGORY_META[filter].label}</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>{CATEGORY_META[filter].desc}</span>
          </div>
          {filtered.map((s) => <SignalCard key={s.id} signal={s} onWrite={handleWrite} />)}
        </div>
      )}
    </div>
  );
}
