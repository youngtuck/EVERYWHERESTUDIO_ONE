import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/timeAgo";
import { useShell } from "../../components/studio/StudioShell";
import "./shared.css";

// ── Helpers ────────────────────────────────────────────────────
function formatFullDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Types ──────────────────────────────────────────────────────
interface RecentOutput {
  id: string;
  title: string;
  output_type: string;
  score: number;
  created_at: string;
  updated_at?: string;
}

interface BriefingSignal {
  label: string;
  description: string;
}

// ── Dashboard right-panel content ─────────────────────────────
function HomeDashContent({
  sessions,
  formatsExported,
  signalsTracked,
  inProgressTitle,
  inProgressStage,
  inProgressFlags,
  onGoToWatch,
}: {
  sessions: number;
  formatsExported: number;
  signalsTracked: number;
  inProgressTitle: string | null;
  inProgressStage: string;
  inProgressFlags: number;
  onGoToWatch: () => void;
}) {
  const S = { label: { fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 } };
  const row = (label: string, value: string | number) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ color: "var(--fg-2)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--fg)" }}>{value}</span>
    </div>
  );

  return (
    <>
      {/* This week */}
      <div style={{ marginBottom: 14 }}>
        <div style={S.label}>This week</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {row("Sessions", sessions)}
          {row("Formats exported", formatsExported)}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0" }}>
            <span style={{ color: "var(--fg-2)" }}>Signals tracked</span>
            <span style={{ fontWeight: 600, color: "var(--fg)" }}>{signalsTracked}</span>
          </div>
        </div>
      </div>

      {/* In progress */}
      {inProgressTitle && (
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>In progress</div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", padding: "5px 0", borderBottom: "1px solid var(--line)", lineHeight: 1.4 }}>
            {inProgressTitle}
            <br />
            <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 600 }}>
              {inProgressStage}{inProgressFlags > 0 ? ` · ${inProgressFlags} flag${inProgressFlags > 1 ? "s" : ""}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Today's briefing */}
      <div style={{ marginBottom: 14 }}>
        <div style={S.label}>Today's briefing</div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", lineHeight: 1.7, fontStyle: "italic" }}>
          Run a briefing in Watch to see today's signals here.
        </div>
        <button
          onClick={onGoToWatch}
          style={{
            marginTop: 6, fontSize: 10, color: "var(--blue)",
            fontWeight: 600, cursor: "pointer", background: "none",
            border: "none", padding: 0, fontFamily: "var(--font)",
          }}
        >
          Full briefing in Watch
        </button>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function Dashboard() {
  const nav = useNavigate();
  const isMobile = useMobile();
  const { user, displayName } = useAuth();
  const { setDashContent } = useShell();

  const [outputs, setOutputs] = useState<RecentOutput[]>([]);
  const [loading, setLoading] = useState(true);

  // Pull recent outputs
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("outputs")
          .select("id, title, output_type, score, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setOutputs((data as RecentOutput[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Inject dashboard panel content
  useLayoutEffect(() => {
    const inProgress = outputs.find(o => !o.score || o.score < 75);

    setDashContent(
      <HomeDashContent
        sessions={outputs.length}
        formatsExported={outputs.filter(o => o.score >= 75).length}
        signalsTracked={0}
        inProgressTitle={inProgress?.title ?? null}
        inProgressStage="In progress"
        inProgressFlags={0}
        onGoToWatch={() => nav("/studio/watch")}
      />
    );

    return () => setDashContent(null);
  }, [outputs, setDashContent, nav]);

  const firstName = displayName ? displayName.split(" ")[0] : "there";
  const inProgress = outputs.find(o => !o.score || o.score < 75);
  const pipelineIdea = outputs[1] ?? null;

  // ── Briefing signals — live from Watch only, no static fallback
  const signals: BriefingSignal[] = [];

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: isMobile ? "24px 20px" : "24px 28px",
      maxWidth: 520,
    }}>
      {/* Greeting */}
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", marginBottom: 2 }}>
        {getGreeting()}, {firstName}.
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 20 }}>
        {getDateLabel()}
      </div>

      {/* Start something new */}
      <div
        onClick={() => nav("/studio/work")}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 20,
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bright)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)", marginBottom: 2 }}>Start something new</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>Drop an idea, a transcript, or just start talking.</div>
        </div>
        <svg style={{ width: 18, height: 18, stroke: "var(--gold-bright)", strokeWidth: 2.5, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>

      {/* Section divider */}
      {(outputs.length > 0 || loading) && (
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 12 }}>
          Or pick up where you left off
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px", borderLeft: "4px solid var(--line)" }}>
              <div style={{ height: 13, width: "60%", background: "var(--bg-2)", borderRadius: 3, marginBottom: 6 }} />
              <div style={{ height: 11, width: "80%", background: "var(--bg-2)", borderRadius: 3 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Briefing card — only shown when signals exist */}
          {signals.length > 0 ? (
            <HomeCard
              accentColor="var(--fg)"
              label="Watch"
              labelColor="var(--fg-3)"
              title={signals[0].label}
              meta={signals[0].description}
              cta="Go to Watch"
              onCta={() => nav("/studio/watch")}
            />
          ) : (
            <HomeCard
              accentColor="var(--fg)"
              label="Watch"
              labelColor="var(--fg-3)"
              title="Run a briefing to see today's signals"
              meta="Watch scans your landscape and surfaces what matters."
              cta="Go to Watch"
              onCta={() => nav("/studio/watch")}
            />
          )}

          {/* Resume in-progress session */}
          {inProgress && (
            <HomeCard
              accentColor="var(--gold-bright)"
              title={inProgress.title}
              meta={`Last edit ${formatFullDate(inProgress.updated_at || inProgress.created_at)}`}
              cta="Resume"
              onCta={() => nav(`/studio/work`)}
            />
          )}

          {/* Pipeline idea */}
          {pipelineIdea && (
            <HomeCard
              accentColor="var(--blue)"
              title={pipelineIdea.title}
              meta="Parked in Pipeline. High resonance this week."
              cta="Start this"
              onCta={() => nav("/studio/work")}
            />
          )}

          {/* If no outputs at all, show a first-time card */}
          {outputs.length === 0 && (
            <HomeCard
              accentColor="var(--blue)"
              title="Your first session is waiting"
              meta="Everything you need is ready. Just start talking to Watson."
              cta="Get started"
              onCta={() => nav("/studio/work")}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Home Card ──────────────────────────────────────────────────
function HomeCard({
  accentColor,
  label,
  labelColor,
  title,
  meta,
  cta,
  onCta,
}: {
  accentColor: string;
  label?: string;
  labelColor?: string;
  title: string;
  meta: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          {label && (
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: labelColor || "var(--fg-3)", marginBottom: 3 }}>
              {label}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 3, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.4 }}>
            {meta}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onCta(); }}
          style={{
            fontSize: 11, fontWeight: 600, color: "var(--blue)",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            paddingTop: 1, background: "none", border: "none",
            fontFamily: "var(--font)", transition: "opacity 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
