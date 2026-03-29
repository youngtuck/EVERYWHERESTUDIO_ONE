/**
 * TheLot.tsx — The Pipeline
 * Phase 6: wired to Supabase outputs table (content_state = 'lot')
 * plus static watched signals. Selecting opens detail in dashboard panel.
 */
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useShell } from "../../components/studio/StudioShell";
import { timeAgo } from "../../utils/timeAgo";
import "./shared.css";

const FONT = "var(--font)";

type ItemType = "signal" | "idea";
type SignalStrength = "getting-stronger" | "steady" | "quieting";

interface PipelineItem {
  id: string;
  type: ItemType;
  title: string;
  meta: string;
  strength?: SignalStrength;
  strengthLabel?: string;
  subtitle: string;
  detail: string;
  action: string;
  outputId?: string;
}

// Static signals — surfaced by Watch, parked here
const STATIC_SIGNALS: PipelineItem[] = [
  {
    id: "s1", type: "signal",
    title: '"Fractional CAIO" trending',
    meta: "Noted 3.28.26",
    strength: "getting-stronger", strengthLabel: "Getting stronger",
    subtitle: "Noted 3.28.26 · Getting stronger",
    detail: "Adjacent to your positioning. Not a direct hit but the conversation is moving toward your lane. Three Reddit threads this week.",
    action: "Use this in Work",
  },
  {
    id: "s2", type: "signal",
    title: "AI governance conversation heating up",
    meta: "Noted 3.21.26",
    strength: "steady", strengthLabel: "Steady",
    subtitle: "Noted 3.21.26 · Steady",
    detail: "Multiple publications covering this week. Not in your keyword set yet but adjacent to composed intelligence positioning.",
    action: "Add to Watch",
  },
  {
    id: "s3", type: "signal",
    title: "Executive burnout narrative shifting",
    meta: "Noted 3.14.26",
    strength: "quieting", strengthLabel: "Quieting",
    subtitle: "Noted 3.14.26 · Quieting",
    detail: "Was strong two weeks ago. Signal weakening. May not resurface.",
    action: "Dismiss",
  },
];

function strengthColor(s?: SignalStrength): string {
  if (s === "getting-stronger") return "var(--blue)";
  if (s === "steady") return "var(--line-2)";
  return "var(--line)";
}

// ── Pipeline detail dashboard panel ──────────────────────────
function PipelineDetailPanel({
  item, onActivate, onRemove,
}: {
  item: PipelineItem;
  onActivate: () => void;
  onRemove: () => void;
}) {
  const isSignal = item.type === "signal";
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 4 }}>
          {isSignal ? "Signal" : "Parked idea"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 12 }}>{item.subtitle}</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>{item.detail}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={onActivate}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "none", background: isSignal ? "var(--blue)" : "var(--fg)", fontSize: 11, color: "#fff", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}
          >
            {item.action}
          </button>
          <button style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}>Edit note</button>
          <button
            onClick={onRemove}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)", fontSize: 11, color: "var(--danger)", cursor: "pointer", fontFamily: FONT }}
          >
            Remove
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function TheLot() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setDashContent, setDashOpen } = useShell();

  const [parkedIdeas, setParkedIdeas] = useState<PipelineItem[]>([]);
  const [signals, setSignals] = useState<PipelineItem[]>(STATIC_SIGNALS);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load parked ideas from Supabase (content_state = 'lot')
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("outputs")
        .select("id, title, output_type, created_at, score")
        .eq("user_id", user.id)
        .eq("content_state", "lot")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setParkedIdeas(data.map(r => ({
          id: r.id,
          type: "idea" as ItemType,
          title: r.title || "Untitled",
          meta: `Parked ${timeAgo(r.created_at)}`,
          subtitle: "Parked · In progress",
          detail: `${r.title}. Output type: ${r.output_type?.replace(/_/g, " ")}. Parked ${timeAgo(r.created_at)}.`,
          action: "Activate",
          outputId: r.id,
        })));
      } else {
        // Static fallback ideas
        setParkedIdeas([
          { id: "i1", type: "idea", title: "Year-end reflection", meta: "Timing · Ready Nov 2026", subtitle: "Parked · Timing", detail: "Not ready until November. The argument needs a full year of evidence to land properly. Set a reminder for October.", action: "Activate" },
          { id: "i2", type: "idea", title: "Case study — Maui client", meta: "Dependency · Permission pending", subtitle: "Parked · Dependency", detail: "Waiting on client permission to use the story. Follow up sent 3.15.26. Strong story — worth the wait.", action: "Activate" },
          { id: "i3", type: "idea", title: "The real cost of not publishing", meta: "Research · One gap remaining", subtitle: "Parked · Research", detail: "Need one more data point before this argument holds. Looking for a study on thought leadership attribution.", action: "Activate" },
        ]);
      }
      setLoading(false);
    })();
  }, [user]);

  const allItems = [...signals, ...parkedIdeas];
  const selectedItem = allItems.find(i => i.id === selectedId) ?? null;

  const handleActivate = useCallback(async () => {
    if (!selectedItem) return;

    if (selectedItem.type === "signal") {
      // Signals don't have a saved output — seed Watson with the signal context
      // WorkSession reads ew-signal-text on mount and prefills the conversation
      sessionStorage.setItem("ew-signal-text", selectedItem.title);
      sessionStorage.setItem("ew-signal-detail", selectedItem.detail);
    } else if (selectedItem.outputId) {
      // Parked ideas with real outputs — reopen in Edit stage
      sessionStorage.setItem("ew-reopen-output-id", selectedItem.outputId);
      sessionStorage.setItem("ew-reopen-title", selectedItem.title);
    } else {
      // Parked idea without a saved output — seed Watson with the idea title
      sessionStorage.setItem("ew-signal-text", selectedItem.title);
      sessionStorage.setItem("ew-signal-detail", selectedItem.detail);
    }

    nav("/studio/work");
  }, [selectedItem, nav]);

  const handleRemove = useCallback(async () => {
    if (!selectedItem) return;
    if (selectedItem.type === "idea" && selectedItem.outputId && user) {
      await supabase.from("outputs").delete().eq("id", selectedItem.outputId).eq("user_id", user.id);
      setParkedIdeas(prev => prev.filter(i => i.id !== selectedItem.id));
    } else if (selectedItem.type === "signal") {
      setSignals(prev => prev.filter(s => s.id !== selectedItem.id));
    }
    setSelectedId(null);
    toast("Removed from Pipeline.");
  }, [selectedItem, user, toast]);

  useLayoutEffect(() => {
    if (selectedItem) {
      setDashOpen(true);
      setDashContent(
        <PipelineDetailPanel
          item={selectedItem}
          onActivate={handleActivate}
          onRemove={handleRemove}
        />
      );
    } else {
      setDashOpen(false);
      setDashContent(
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
          Select a signal or idea to see details.
        </div>
      );
    }
    return () => setDashContent(null);
  }, [selectedItem, handleActivate, handleRemove, setDashContent, setDashOpen]);

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginBottom: 10, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  const PipelineRow = ({ item }: { item: PipelineItem }) => {
    const active = selectedId === item.id;
    return (
      <div
        onClick={() => setSelectedId(item.id)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 4px", borderBottom: "1px solid var(--line)",
          cursor: "pointer", borderRadius: 5,
          background: active ? "rgba(245,198,66,0.06)" : "transparent",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(245,198,66,0.06)" : "transparent"; }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: active ? "var(--fg)" : "var(--fg-2)", fontWeight: active ? 500 : 400, marginBottom: 2 }}>{item.title}</div>
          <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{item.meta}</div>
        </div>
        {item.strengthLabel && (
          <div style={{ fontSize: 9, fontWeight: 600, color: strengthColor(item.strength), whiteSpace: "nowrap" as const }}>{item.strengthLabel}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 20, fontFamily: FONT, maxWidth: 680 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>The Pipeline</div>

      <Card title="Watched signals">
        {signals.map(item => <PipelineRow key={item.id} item={item} />)}
      </Card>

      <Card title="Parked ideas">
        {loading ? (
          <div style={{ padding: "8px 0", fontSize: 11, color: "var(--fg-3)" }}>Loading...</div>
        ) : parkedIdeas.length === 0 ? (
          <div style={{ padding: "8px 0", fontSize: 11, color: "var(--fg-3)" }}>No parked ideas yet. Start a Work session and park ideas here.</div>
        ) : (
          parkedIdeas.map(item => <PipelineRow key={item.id} item={item} />)
        )}
      </Card>
    </div>
  );
}
