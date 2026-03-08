import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO DASHBOARD
// Clean, purposeful. The start of every session.
// ─────────────────────────────────────────────────────────────────────────────

const OUTPUT_TYPES = [
  { id: "essay",        label: "Essay",          desc: "Long-form narrative",       color: "#4A90D9" },
  { id: "podcast",      label: "Podcast",         desc: "Audio script",              color: "#F5C642" },
  { id: "newsletter",   label: "Newsletter",      desc: "Email campaign",            color: "#50c8a0" },
  { id: "social",       label: "Social Media",    desc: "Multi-platform posts",      color: "#a080f5" },
  { id: "video",        label: "Video Script",    desc: "Short-form video",          color: "#e85d75" },
  { id: "presentation", label: "Presentation",    desc: "Keynote or talk",           color: "#F5A623" },
  { id: "sunday_story", label: "Sunday Story",    desc: "10 deliverables, 1 session",color: "#F5C642" },
  { id: "freestyle",    label: "Freestyle",       desc: "You describe it",           color: "#4A90D9" },
];

const RECENT_SESSIONS = [
  { id: "1", title: "Why most advice is wrong about delegation",   type: "essay",      score: 847, date: "Today" },
  { id: "2", title: "The interview before the essay",             type: "newsletter", score: 912, date: "Yesterday" },
  { id: "3", title: "TEDx talk outline: composed intelligence",   type: "presentation",score: 788, date: "Mar 6" },
  { id: "4", title: "LinkedIn thread: AI tells to eliminate",     type: "social",     score: 861, date: "Mar 5" },
];

const TYPE_COLORS: Record<string, string> = {
  essay: "#4A90D9", newsletter: "#50c8a0", presentation: "#F5A623",
  social: "#a080f5", podcast: "#F5C642", video: "#e85d75",
  sunday_story: "#F5C642", freestyle: "#4A90D9",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 900 ? "#50c8a0" : score >= 800 ? "#4A90D9" : "#F5C642";
  const label = score >= 900 ? "Exceptional" : score >= 800 ? "Ready to Publish" : "Solid";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{score}</span>
      <span style={{ fontSize: 10, color: "var(--fg-3)" }}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleStart = (typeId?: string) => {
    const t = typeId || selectedType || "essay";
    navigate(`/studio/work/new?type=${t}`);
  };

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto", fontFamily: "var(--font)" }}>

      {/* ── Welcome block ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", letterSpacing: "-.03em", marginBottom: 6 }}>
          Good morning, Mark.
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-3)", fontWeight: 300 }}>
          Your Voice Fidelity Score is &nbsp;
          <span style={{ color: "#F5C642", fontWeight: 600 }}>94.7</span>
          &nbsp; and Sentinel has &nbsp;
          <button onClick={() => navigate("/studio/watch")} style={{ background: "none", border: "none", cursor: "pointer", color: "#4A90D9", fontSize: 15, fontWeight: 500, fontFamily: "var(--font)", padding: 0, textDecoration: "underline", textDecorationColor: "rgba(74,144,217,.3)" }}>
            11 new signals
          </button>
          &nbsp; this morning.
        </p>
      </div>

      {/* ── Start a session ──────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 16 }}>Start a Session</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {OUTPUT_TYPES.map(t => (
            <button key={t.id} onClick={() => handleStart(t.id)} style={{
              background: selectedType === t.id ? `${t.color}12` : "var(--surface)",
              border: `1px solid ${selectedType === t.id ? t.color + "44" : "var(--line)"}`,
              borderRadius: 10, padding: "14px 14px", cursor: "pointer",
              textAlign: "left", fontFamily: "var(--font)",
              transition: "all .15s",
            }}
              onMouseEnter={e => { if (selectedType !== t.id) { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.background = "var(--bg-2)"; } }}
              onMouseLeave={e => { if (selectedType !== t.id) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; } }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 3, letterSpacing: "-.01em" }}>{t.label}</p>
              <p style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 300 }}>{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Quick start bar */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 12,
          padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
          cursor: "text", boxShadow: "var(--shadow-xs)",
          transition: "border-color .2s",
        }}
          onClick={() => handleStart()}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line-2)"}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4A90D9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>W</div>
          <span style={{ fontSize: 14, color: "var(--fg-3)", fontWeight: 300, flex: 1 }}>What are we making today?</span>
          <button onClick={e => { e.stopPropagation(); handleStart(); }} style={{
            background: "var(--fg)", border: "none", borderRadius: 7, padding: "6px 14px",
            cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--bg)",
            fontFamily: "var(--font)", flexShrink: 0,
          }}>Start</button>
        </div>
      </div>

      {/* ── Sentinel snapshot ─────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)" }}>Sentinel Snapshot</h2>
          <button onClick={() => navigate("/studio/watch")} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 12,
            color: "#4A90D9", fontFamily: "var(--font)", padding: 0,
          }}>View full briefing</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "What's Moving", count: 3, color: "#4A90D9", cat: "moving", highlight: "AI content tools surge 40% in enterprise adoption" },
            { label: "Opportunities", count: 3, color: "#50c8a0", cat: "opportunity", highlight: "Podcast listenership for business content at all-time high" },
            { label: "Content Triggers", count: 2, color: "#F5C642", cat: "trigger", highlight: "The authenticity gap becomes mainstream narrative" },
          ].map((item, i) => (
            <button key={i} onClick={() => navigate(`/studio/watch`)} style={{
              background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10,
              padding: "16px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font)",
              transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: item.color, letterSpacing: ".06em", textTransform: "uppercase" }}>{item.label}</span>
                <span style={{ fontSize: 10, background: `${item.color}18`, color: item.color, padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>{item.count}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, fontWeight: 300, margin: 0 }}>{item.highlight}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent sessions ───────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)" }}>Recent Sessions</h2>
          <button onClick={() => navigate("/studio/outputs")} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 12,
            color: "#4A90D9", fontFamily: "var(--font)", padding: 0,
          }}>All outputs</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {RECENT_SESSIONS.map((s, i) => (
            <button key={i} onClick={() => navigate(`/studio/work/${s.id}`)} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "none", border: "none", borderRadius: 8, padding: "11px 12px",
              cursor: "pointer", textAlign: "left", fontFamily: "var(--font)",
              transition: "background .12s", width: "100%",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[s.type] || "#4A90D9", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: "var(--fg)", fontWeight: 400, letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <ScoreBadge score={s.score} />
              <span style={{ fontSize: 11, color: "var(--fg-3)", width: 72, textAlign: "right", flexShrink: 0 }}>{s.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Studio health ─────────────────────────────────────────── */}
      <div style={{ marginTop: 44, padding: "20px 24px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { label: "Voice Fidelity", value: "94.7", unit: "/100", color: "#F5C642" },
            { label: "Outputs This Month", value: "23", unit: "pieces", color: "#4A90D9" },
            { label: "Avg Betterish Score", value: "847", unit: "/1000", color: "#50c8a0" },
            { label: "Signals Processed", value: "156", unit: "this week", color: "#a080f5" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, letterSpacing: "-.03em", lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4, letterSpacing: ".03em" }}>{stat.unit}</p>
              <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2, fontWeight: 300 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
