/**
 * Wrap.tsx — Staged workflow: Choose channels → Build → Deliver
 * Adaptation via /api/adapt-format, liquid glass presentation, export to Catalog
 */
import { useState, useLayoutEffect, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShell } from "../../components/studio/StudioShell";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import { useMobile } from "../../hooks/useMobile";
import {
  buildWrapConstraintSupplement,
  getWrapRuleSummaryLines,
  outputTypeDisplayLabel,
  presentationTargetWords,
  DEFAULT_PRESENTATION_MINUTES,
} from "../../lib/wrapFormatRules";
import { OUTPUT_TYPES } from "../../lib/constants";
import "./shared.css";

const FONT = "var(--font)";

/** Library shelves (match sidebar Outputs: Content, Business, Social, Extended, Templates). */
type LandingShelfKey = "content" | "business" | "social" | "extended" | "templates";

const LANDING_SHELF_ORDER: LandingShelfKey[] = ["content", "business", "social", "extended", "templates"];

/** Types users often file from the Templates area (ids still map to real `outputs.output_type`). */
const TEMPLATES_SHELF_TYPES: { id: string; name: string }[] = [
  { id: "essay", name: "Essay" },
  { id: "email", name: "Email" },
  { id: "newsletter", name: "Newsletter" },
  { id: "podcast", name: "Podcast" },
  { id: "presentation", name: "Presentation" },
  { id: "freestyle", name: "Freestyle / custom" },
];

function typesForLandingShelf(shelf: LandingShelfKey): { id: string; name: string }[] {
  if (shelf === "templates") return TEMPLATES_SHELF_TYPES;
  const block = OUTPUT_TYPES[shelf as keyof typeof OUTPUT_TYPES];
  if (!block || !("types" in block)) return [];
  const list = (block as { types: { id: string; name: string }[] }).types.map(t => ({ id: t.id, name: t.name }));
  if (shelf === "social" && !list.some(t => t.id === "social_media")) {
    return [{ id: "social_media", name: "Social media" }, ...list];
  }
  return list;
}

function landingShelfLabel(shelf: LandingShelfKey): string {
  if (shelf === "templates") return "Templates";
  const block = OUTPUT_TYPES[shelf as keyof typeof OUTPUT_TYPES];
  if (block && "label" in block) return (block as { label: string }).label;
  return shelf;
}

/** Best default tab for a type id (used when the active piece changes). */
function inferLandingShelfForTypeId(typeId: string): LandingShelfKey {
  const id = (typeId || "freestyle").toLowerCase();
  if (id === "social_media") return "social";
  for (const shelf of ["content", "business", "social", "extended"] as const) {
    if (OUTPUT_TYPES[shelf]?.types?.some(t => t.id === id)) return shelf;
  }
  if (TEMPLATES_SHELF_TYPES.some(t => t.id === id)) return "templates";
  return "templates";
}

/** Tab labels must match `FORMAT_INSTRUCTIONS` keys in api/adapt-format.js */
const WRAP_CHANNEL_FORMATS = [
  "LinkedIn",
  "Newsletter",
  "Podcast",
  "Sunday Story",
  "Email",
  "X Thread",
  "Executive Brief",
  "YouTube Description",
] as const;

const ALL_WRAP_CHANNELS: readonly string[] = WRAP_CHANNEL_FORMATS;
const DEFAULT_CHANNEL_PRESELECT = ["LinkedIn", "Newsletter", "Sunday Story", "Email"];

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

type WrapPhase = "choose" | "build" | "deliver";

function isValidWrapChannel(s: string): s is typeof WRAP_CHANNEL_FORMATS[number] {
  return (ALL_WRAP_CHANNELS as readonly string[]).includes(s);
}

interface OutputItem {
  id: string;
  title: string;
  content: string;
  output_type: string;
  created_at: string;
  score?: number;
}

interface FormatEntry {
  content: string;
  metadata: Record<string, string>;
  status: "pending" | "loading" | "done" | "error";
}

function WrapStepRail({ phase }: { phase: WrapPhase }) {
  const steps: { id: WrapPhase; label: string; n: number }[] = [
    { id: "choose", label: "Choose channels", n: 1 },
    { id: "build", label: "Generate", n: 2 },
    { id: "deliver", label: "Your pieces", n: 3 },
  ];
  const idx = phase === "choose" ? 0 : phase === "build" ? 1 : 2;
  return (
    <div className="liquid-glass" style={{
      flexShrink: 0, borderRadius: 0, borderBottom: "1px solid var(--glass-border)",
      padding: "10px 20px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", maxWidth: 720, margin: "0 auto" }}>
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                background: done ? "rgba(34,197,94,0.15)" : active ? "rgba(245,198,66,0.2)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${done ? "rgba(34,197,94,0.4)" : active ? "rgba(245,198,66,0.55)" : "var(--glass-border)"}`,
                color: done ? "#16A34A" : active ? "#9A7030" : "var(--fg-3)",
              }}>
                {done ? "✓" : s.n}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? "var(--fg)" : "var(--fg-3)",
                letterSpacing: "0.02em",
              }}>
                {s.label}
              </span>
              {i < steps.length - 1 ? (
                <span style={{ width: 20, height: 1, background: "var(--glass-border)", margin: "0 4px" }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WrapDashPanel({
  outputType, formatCount, onExportAll, exported, exporting, prefillReed,
  ruleSummaryLines, presentationMinutes, phase,
}: {
  outputType: string;
  formatCount: number;
  onExportAll: () => void;
  exported: boolean;
  exporting: boolean;
  prefillReed: (text: string) => void;
  ruleSummaryLines: string[];
  presentationMinutes: number | null;
  phase: WrapPhase;
}) {
  const isFreestyle = !outputType || outputType === "freestyle";
  const DpLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>{children}</div>
  );

  const chips = [
    { label: "Adapt for podcast", prefill: "Adapt this piece into a podcast script. Natural spoken language, same argument." },
    { label: "Write the LinkedIn post", prefill: "Write the LinkedIn version of this piece. 150 words, punchy opening." },
    { label: "Write the email subject line", prefill: "Write 3 subject line options for the newsletter version of this piece." },
    { label: "What else can I make from this?", prefill: "What other content can I extract or adapt from this piece?" },
  ];

  if (phase !== "deliver") {
    return (
      <div className="liquid-glass-card" style={{ padding: 14 }}>
        <DpLabel>Wrap</DpLabel>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          {phase === "choose"
            ? "Pick the channels you need, then generate. Reed adapts your draft for each surface."
            : "Reed is generating your channel versions. This usually takes under a minute per channel."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <DpLabel>Mode</DpLabel>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 99,
          background: "rgba(245,198,66,0.12)", border: "1px solid rgba(245,198,66,0.3)",
          fontSize: 10, fontWeight: 600, color: "#9A7030",
        }}>
          {isFreestyle ? "Freestyle" : outputType}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <DpLabel>How Wrap works</DpLabel>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          {isFreestyle
            ? "You chose these channels. Copy any version, or run Export All to mark the piece saved in Catalog."
            : `Reed formatted your content for ${formatCount} channel${formatCount !== 1 ? "s" : ""}. Copy what you need, then Export All to save to Catalog.`}
        </div>
      </div>

      <div className="liquid-glass-card" style={{ marginBottom: 14, padding: "10px 12px" }}>
        <DpLabel>Active format rules</DpLabel>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#9A7030", marginBottom: 6 }}>
          {outputTypeDisplayLabel(outputType)}
          {outputType === "presentation" && presentationMinutes != null && (
            <span style={{ fontWeight: 500, color: "var(--fg-3)" }}>
              {" "}· {presentationMinutes} min (~{presentationTargetWords(presentationMinutes)} words)
            </span>
          )}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "var(--fg-2)", lineHeight: 1.55 }}>
          {ruleSummaryLines.map((line, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{line}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onExportAll}
        disabled={exported || exporting}
        className={exported ? "liquid-glass-btn" : "liquid-glass-btn-gold"}
        style={{
          width: "100%", padding: 10, borderRadius: 10, marginBottom: 12,
          fontSize: 11, fontWeight: 700,
          cursor: exported || exporting ? "default" : "pointer",
          fontFamily: FONT, letterSpacing: "0.04em",
          opacity: exporting ? 0.6 : 1,
        }}
      >
        {exported ? (
          <span className="liquid-glass-btn-label" style={{ color: "var(--blue, #4A90D9)", fontWeight: 700 }}>Exported</span>
        ) : exporting ? (
          <span className="liquid-glass-btn-gold-label">Exporting…</span>
        ) : (
          <span className="liquid-glass-btn-gold-label">Export All to Catalog</span>
        )}
      </button>

      <div className="liquid-glass-card" style={{ padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4A90D9", marginBottom: 6 }}>Reed</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          Each tab is ready to paste. Tweak tone in the Reed panel if you want a pass on one channel.
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {chips.map((chip, i) => (
          <button key={i} type="button" className="liquid-glass-btn" onClick={() => prefillReed(chip.prefill)} style={{ fontSize: 10, padding: "4px 10px" }}>
            <span className="liquid-glass-btn-label" style={{ color: "var(--fg-2)", fontWeight: 500 }}>{chip.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function WrapPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { setFeedbackContent, setReedPrefill, setActiveDashTab } = useShell();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionDraft, setSessionDraft] = useState<OutputItem | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [formats, setFormats] = useState<string[]>([...WRAP_CHANNEL_FORMATS]);
  const [activeFormat, setActiveFormat] = useState<string>(WRAP_CHANNEL_FORMATS[0]);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formatContents, setFormatContents] = useState<Record<string, FormatEntry>>({});
  const [catalogLinkId, setCatalogLinkId] = useState<string | null>(null);
  const [wrapPresentationMinutes, setWrapPresentationMinutes] = useState<number>(DEFAULT_PRESENTATION_MINUTES);

  const [wrapPhase, setWrapPhase] = useState<WrapPhase>("choose");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const adaptingRef = useRef<Set<string>>(new Set());

  // Handoff from Work Export (draft + optional pre-seeded formats + channel picks)
  useEffect(() => {
    const wrapDraft = sessionStorage.getItem("ew-wrap-draft");
    const wrapTitle = sessionStorage.getItem("ew-wrap-title");
    const wrapOutputType = sessionStorage.getItem("ew-wrap-output-type");
    const wrapOutputId = sessionStorage.getItem("ew-wrap-output-id");
    const wrapFormats = sessionStorage.getItem("ew-wrap-formats");
    const wrapPicks = sessionStorage.getItem("ew-wrap-channel-picks");

    if (!wrapDraft) return;

    const sessionOutput: OutputItem = {
      id: wrapOutputId || "session-draft",
      title: wrapTitle || "Untitled",
      content: wrapDraft,
      output_type: wrapOutputType || "freestyle",
      created_at: new Date().toISOString(),
      score: 0,
    };
    setSessionDraft(sessionOutput);

    let seededDeliver = false;
    if (wrapFormats) {
      try {
        const parsed = JSON.parse(wrapFormats) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const keys = Object.keys(parsed as Record<string, string>);
          if (keys.length > 0) {
            setFormats(keys);
            setActiveFormat(keys[0]);
            const seeded: Record<string, FormatEntry> = {};
            keys.forEach(k => {
              const text = typeof (parsed as Record<string, string>)[k] === "string"
                ? (parsed as Record<string, string>)[k]
                : "";
              seeded[k] = { content: text, metadata: {}, status: "done" };
            });
            setFormatContents(seeded);
            setSelectedChannels(keys);
            seededDeliver = true;
          }
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          const keys = (parsed as string[]).filter((x): x is string => typeof x === "string" && isValidWrapChannel(x));
          if (keys.length) {
            setFormats(keys);
            setActiveFormat(keys[0]);
            setSelectedChannels(keys);
            setWrapPhase("choose");
          }
        }
      } catch { /* ignore */ }
    }

    if (wrapPicks) {
      if (!seededDeliver) {
        try {
          const arr = JSON.parse(wrapPicks) as unknown;
          if (Array.isArray(arr)) {
            const valid = arr.filter((x): x is string => typeof x === "string" && isValidWrapChannel(x));
            if (valid.length) setSelectedChannels(valid);
          }
        } catch { /* ignore */ }
      }
      sessionStorage.removeItem("ew-wrap-channel-picks");
    } else if (!seededDeliver) {
      setSelectedChannels([...DEFAULT_CHANNEL_PRESELECT]);
    }

    setWrapPhase(seededDeliver ? "deliver" : "choose");

    const wrapPres = sessionStorage.getItem("ew-wrap-presentation-minutes");
    if (wrapPres != null) {
      const n = parseInt(wrapPres, 10);
      if (Number.isFinite(n) && n >= 3) {
        setWrapPresentationMinutes(Math.min(180, n));
      }
    }
    sessionStorage.removeItem("ew-wrap-presentation-minutes");

    setLoading(false);
    sessionStorage.removeItem("ew-wrap-draft");
    sessionStorage.removeItem("ew-wrap-title");
    sessionStorage.removeItem("ew-wrap-output-type");
    sessionStorage.removeItem("ew-wrap-output-type-ids");
    sessionStorage.removeItem("ew-wrap-output-id");
    sessionStorage.removeItem("ew-wrap-formats");
  }, []);

  const fetchOutputs = useCallback((options?: { silent?: boolean }) => {
    if (!user) {
      if (!options?.silent) setLoading(false);
      return;
    }
    if (!options?.silent) setLoading(true);
    supabase
      .from("outputs")
      .select("id, title, content, output_type, created_at, score")
      .eq("user_id", user.id)
      .not("content", "is", null)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error("[Wrap] Fetch error:", error);
        const all = (data as OutputItem[]) || [];
        const withContent = all.filter(o => o.content && o.content.trim().length > 0);
        setOutputs(withContent);
        if (!options?.silent) setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fromCatalogId = sessionStorage.getItem("ew-wrap-from-catalog-id");
    if (!fromCatalogId) {
      fetchOutputs();
      return;
    }

    sessionStorage.removeItem("ew-wrap-from-catalog-id");
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("outputs")
        .select("id, title, content, output_type, created_at, score")
        .eq("id", fromCatalogId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data?.content || !String(data.content).trim()) {
        setLoading(false);
        toast("Could not load that piece for Wrap.", "error");
        fetchOutputs();
        return;
      }

      const row = data as OutputItem;
      setSessionDraft(null);
      setSelectedOutputId(row.id);
      setFormats([...WRAP_CHANNEL_FORMATS]);
      setActiveFormat(WRAP_CHANNEL_FORMATS[0]);
      setFormatContents({});
      adaptingRef.current.clear();
      setExported(false);
      setCopied(false);
      setCatalogLinkId(null);
      setWrapPhase("choose");
      setSelectedChannels(row.output_type === "freestyle" ? [...DEFAULT_CHANNEL_PRESELECT] : [...DEFAULT_CHANNEL_PRESELECT]);
      if (row.output_type === "presentation") {
        setWrapPresentationMinutes(DEFAULT_PRESENTATION_MINUTES);
      }
      setOutputs(prev => (prev.some(o => o.id === row.id) ? prev : [row, ...prev]));
      fetchOutputs({ silent: true });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, location.key, toast, fetchOutputs]);

  const selectedOutput = selectedOutputId ? outputs.find(o => o.id === selectedOutputId) || null : null;
  const activeOutput = sessionDraft || selectedOutput;
  const hasContent = !!activeOutput;

  const [wrapCatalogTypeId, setWrapCatalogTypeId] = useState("freestyle");
  const [originCatalogTypeId, setOriginCatalogTypeId] = useState<string | null>(null);
  const [landingShelf, setLandingShelf] = useState<LandingShelfKey>("content");

  useLayoutEffect(() => {
    if (!activeOutput?.id) {
      setOriginCatalogTypeId(null);
      return;
    }
    const ot = activeOutput.output_type?.trim() || "freestyle";
    setOriginCatalogTypeId(ot);
    setWrapCatalogTypeId(ot);
    setLandingShelf(inferLandingShelfForTypeId(ot));
  }, [activeOutput?.id, activeOutput?.output_type]);

  const adaptFormat = useCallback(async (format: string): Promise<"done" | "error"> => {
    if (!activeOutput?.content || !user) return "error";
    if (adaptingRef.current.has(format)) return "error";
    adaptingRef.current.add(format);

    const ot = wrapCatalogTypeId || "freestyle";
    const presMins = ot === "presentation" ? wrapPresentationMinutes : null;
    const wrapConstraintSupplement = buildWrapConstraintSupplement(ot, format, presMins);

    setFormatContents(prev => ({ ...prev, [format]: { content: "", metadata: {}, status: "loading" } }));

    try {
      const res = await fetchWithRetry(
        `${API_BASE}/api/adapt-format`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft: activeOutput.content,
            format,
            voiceDnaMd: "",
            brandDnaMd: "",
            userId: user.id,
            wrapConstraintSupplement,
          }),
        },
        { timeout: 60000 },
      );

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) detail = `${detail}: ${j.error}`;
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      const data = await res.json();

      const adapted =
        typeof data.content === "string" && data.content.trim().length > 0
          ? data.content
          : activeOutput.content;
      setFormatContents(prev => ({
        ...prev,
        [format]: {
          content: adapted,
          metadata: data.metadata || {},
          status: "done",
        },
      }));
      return "done";
    } catch (err) {
      console.error("[Wrap] adapt error:", err);
      setFormatContents(prev => ({
        ...prev,
        [format]: { content: "", metadata: {}, status: "error" },
      }));
      return "error";
    } finally {
      adaptingRef.current.delete(format);
    }
  }, [activeOutput, user, wrapPresentationMinutes, wrapCatalogTypeId]);

  const runBuildForChannels = useCallback(async (channels: string[]) => {
    if (!activeOutput?.content || !user || channels.length === 0) {
      return { succeeded: [] as string[], failed: [...channels] };
    }
    const outcomes = await Promise.all(
      channels.map(async fmt => {
        const r = await adaptFormat(fmt);
        return { fmt, r };
      }),
    );
    const succeeded = outcomes.filter(o => o.r === "done").map(o => o.fmt);
    const failed = outcomes.filter(o => o.r === "error").map(o => o.fmt);
    return { succeeded, failed };
  }, [activeOutput, user, adaptFormat]);

  const handleConfirmChannels = useCallback(async () => {
    if (!activeOutput || selectedChannels.length === 0) {
      toast("Select at least one channel.", "error");
      return;
    }
    const list = [...selectedChannels];
    setFormats(list);
    setActiveFormat(list[0]);
    setFormatContents({});
    adaptingRef.current.clear();
    setWrapPhase("build");
    const { succeeded, failed } = await runBuildForChannels(list);
    if (succeeded.length === 0) {
      toast("None of the channels could be generated. Check your connection, confirm you are signed in, then try again.", "error");
      setFormatContents({});
      adaptingRef.current.clear();
      setWrapPhase("choose");
      return;
    }
    if (failed.length > 0) {
      toast("Some channels failed. Retry any row below, or continue with the versions that finished.", "error");
    }
  }, [activeOutput, selectedChannels, runBuildForChannels, toast]);

  /** When every row in build is done, move to deliver (covers all-success on first pass and retry-after-partial). */
  useEffect(() => {
    if (wrapPhase !== "build") return;
    if (formats.length === 0) return;
    const allDone = formats.every(f => formatContents[f]?.status === "done");
    if (!allDone) return;
    setWrapPhase("deliver");
  }, [wrapPhase, formats, formatContents]);

  useEffect(() => {
    if (!activeOutput?.content || wrapPhase !== "deliver") return;
    const entry = formatContents[activeFormat];
    if (!entry || entry.status === "pending") {
      void adaptFormat(activeFormat);
    }
  }, [activeOutput, activeFormat, formatContents, adaptFormat, wrapPhase]);

  const handleFormatChange = useCallback((format: string) => {
    setActiveFormat(format);
    const entry = formatContents[format];
    if (!entry || entry.status === "pending") {
      void adaptFormat(format);
    }
  }, [formatContents, adaptFormat]);

  const toggleChannel = useCallback((ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(x => x !== ch) : [...prev, ch],
    );
  }, []);

  const prefillReed = useCallback((text: string) => {
    setReedPrefill(text);
    setActiveDashTab("reed");
  }, [setReedPrefill, setActiveDashTab]);

  const handleExportAll = useCallback(async () => {
    if (!activeOutput || !user) return;
    setExporting(true);

    try {
      const pendingFormats = formats.filter(f => {
        const entry = formatContents[f];
        return !entry || entry.status !== "done";
      });
      for (const fmt of pendingFormats) {
        await adaptFormat(fmt);
      }

      let savedId = activeOutput.id;
      if (activeOutput.id === "session-draft") {
        const { data, error } = await supabase.from("outputs").insert({
          user_id: user.id,
          title: (activeOutput.title || "Untitled").slice(0, 200),
          content: activeOutput.content,
          output_type: wrapCatalogTypeId || "freestyle",
          content_state: "vault",
          published_at: new Date().toISOString(),
        }).select("id").single();
        if (error) throw error;
        if (data?.id) {
          savedId = data.id;
          setSessionDraft({ ...activeOutput, id: data.id, output_type: wrapCatalogTypeId || "freestyle" });
        }
      } else {
        const { error } = await supabase.from("outputs").update({
          content_state: "vault",
          published_at: new Date().toISOString(),
          output_type: wrapCatalogTypeId || "freestyle",
        }).eq("id", activeOutput.id);
        if (error) throw error;
      }

      setExported(true);
      setCatalogLinkId(savedId && savedId !== "session-draft" ? savedId : null);
      toast("Saved to Catalog. Use Open in Catalog below or Library, then Catalog, in the sidebar.");
    } catch (err) {
      console.error("[Wrap] export error:", err);
      toast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  }, [activeOutput, user, formats, formatContents, adaptFormat, toast, wrapCatalogTypeId]);

  const handleCopy = useCallback(() => {
    const entry = formatContents[activeFormat];
    const textToCopy =
      entry?.status === "error"
        ? ""
        : entry?.content && entry.content.trim().length > 0
          ? entry.content
          : (entry ? "" : (activeOutput?.content || ""));
    if (!textToCopy.trim()) {
      toast("Nothing to copy for this channel yet.", "error");
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast(`${activeFormat} version copied.`);
    }).catch(() => {});
  }, [activeFormat, formatContents, activeOutput, toast]);

  const wrapRuleLines = useMemo(
    () => (hasContent
      ? getWrapRuleSummaryLines(
        wrapCatalogTypeId || "freestyle",
        wrapCatalogTypeId === "presentation" ? wrapPresentationMinutes : null,
      )
      : []),
    [hasContent, wrapCatalogTypeId, wrapPresentationMinutes],
  );

  const applyPresentationLength = useCallback(() => {
    setFormatContents({});
    adaptingRef.current.clear();
    void adaptFormat(activeFormat);
  }, [activeFormat, adaptFormat]);

  useLayoutEffect(() => {
    if (hasContent) {
      setFeedbackContent(
        <WrapDashPanel
          outputType={wrapCatalogTypeId || "freestyle"}
          formatCount={formats.length}
          onExportAll={handleExportAll}
          exported={exported}
          exporting={exporting}
          prefillReed={prefillReed}
          ruleSummaryLines={wrapRuleLines}
          presentationMinutes={wrapCatalogTypeId === "presentation" ? wrapPresentationMinutes : null}
          phase={wrapPhase}
        />,
      );
    } else {
      setFeedbackContent(null);
    }
    return () => setFeedbackContent(null);
  }, [activeOutput, formats, exported, exporting, hasContent, handleExportAll, prefillReed, setFeedbackContent, wrapRuleLines, wrapPresentationMinutes, wrapPhase, wrapCatalogTypeId]);

  if (loading) {
    return (
      <div className="liquid-glass-card" style={{ margin: 24, padding: 32, textAlign: "center", fontFamily: FONT }}>
        <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Loading Wrap…</div>
      </div>
    );
  }

  if (!hasContent) {
    if (outputs.length === 0) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", flex: 1, padding: 40, textAlign: "center",
          fontFamily: FONT,
        }}>
          <div className="liquid-glass-card" style={{ padding: "40px 32px", maxWidth: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
              Nothing to wrap yet.
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5, marginBottom: 24 }}>
              Complete a Work session first, or open Catalog (Library in the sidebar) to send a saved piece here.
            </div>
            <button type="button" className="liquid-glass-btn-gold" onClick={() => nav("/studio/work")} style={{ padding: "10px 24px" }}>
              <span className="liquid-glass-btn-gold-label">Start a session</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        overflow: "hidden", fontFamily: FONT,
      }}>
        <header className="liquid-glass" style={{ flexShrink: 0, borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}>
          <div style={{ padding: "16px 24px 12px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>Wrap</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
              Choose a saved piece. You will pick channels next, then get paste-ready versions.
            </div>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {outputs.map(output => {
            const preview = (output.content || "").replace(/\n+/g, " ").slice(0, 140);
            const date = new Date(output.created_at);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <button
                key={output.id}
                type="button"
                onClick={() => {
                  setSelectedOutputId(output.id);
                  setFormats([...WRAP_CHANNEL_FORMATS]);
                  setActiveFormat(WRAP_CHANNEL_FORMATS[0]);
                  setFormatContents({});
                  adaptingRef.current.clear();
                  setExported(false);
                  setCopied(false);
                  setCatalogLinkId(null);
                  setWrapPhase("choose");
                  setSelectedChannels([...DEFAULT_CHANNEL_PRESELECT]);
                  if (output.output_type === "presentation") {
                    setWrapPresentationMinutes(DEFAULT_PRESENTATION_MINUTES);
                  }
                }}
                className="liquid-glass-card"
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "16px 18px", marginBottom: 10,
                  cursor: "pointer", fontFamily: FONT,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
                    {output.title || "Untitled"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--fg-3)", flexShrink: 0, marginLeft: 12 }}>
                    {dateStr}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                    background: "rgba(245,198,66,0.12)", color: "#9A7030",
                    textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  }}>
                    {output.output_type || "freestyle"}
                  </span>
                  {typeof output.score === "number" && output.score > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                      background: output.score >= 75 ? "rgba(34,197,94,0.12)" : "rgba(245,198,66,0.12)",
                      color: output.score >= 75 ? "#16A34A" : "#9A7030",
                    }}>
                      {output.score}
                    </span>
                  )}
                </div>
                {preview && (
                  <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 8, lineHeight: 1.5 }}>
                    {preview}{preview.length >= 140 ? "…" : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Choose channels ─────────────────────────────────────────
  if (wrapPhase === "choose") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
        <WrapStepRail phase="choose" />
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "28px 32px 40px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 700, color: "var(--fg)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Where should this land?
            </h1>
            <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "0 0 24px", lineHeight: 1.55 }}>
              Set Library filing below, then select every channel you want Reed to adapt. Your draft stays the source of truth; each channel gets its own surface and structure.
            </p>

            <div className="liquid-glass-card" style={{ padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 6, textTransform: "uppercase" as const }}>Piece</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", lineHeight: 1.35 }}>{activeOutput.title || "Untitled"}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6, lineHeight: 1.45 }}>
                {Math.round((activeOutput.content || "").length / 5)} words approx.
                {originCatalogTypeId && wrapCatalogTypeId !== originCatalogTypeId ? (
                  <>
                    {" "}· Work: <span style={{ color: "var(--fg-2)", fontWeight: 600 }}>{outputTypeDisplayLabel(originCatalogTypeId)}</span>
                    {" "}· Catalog: <span style={{ color: "var(--fg-2)", fontWeight: 600 }}>{outputTypeDisplayLabel(wrapCatalogTypeId)}</span>
                  </>
                ) : (
                  <> · {outputTypeDisplayLabel(wrapCatalogTypeId)}</>
                )}
              </div>
            </div>

            <div className="liquid-glass-card" style={{ padding: "16px 18px", marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 8, textTransform: "uppercase" as const }}>
                Library filing
              </div>
              <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "0 0 14px", lineHeight: 1.55 }}>
                Defaults to your Work output type. Pick any shelf that matches where this should live in Catalog (Content, Business, Social Media, Extended, or Templates). Changing this does not rerun Work; it only affects how the row is filed and filtered.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {LANDING_SHELF_ORDER.map(shelf => {
                  const on = landingShelf === shelf;
                  return (
                    <button
                      key={shelf}
                      type="button"
                      onClick={() => {
                        setLandingShelf(shelf);
                        const types = typesForLandingShelf(shelf);
                        if (types.length && !types.some(t => t.id === wrapCatalogTypeId)) {
                          setWrapCatalogTypeId(types[0].id);
                        }
                      }}
                      className={on ? "liquid-glass-card" : "liquid-glass"}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: on ? 700 : 600,
                        color: on ? "var(--fg)" : "var(--fg-3)",
                        border: on ? "1px solid rgba(245,198,66,0.45)" : "1px solid var(--glass-border)",
                        background: on ? "rgba(245,198,66,0.08)" : undefined,
                      }}
                    >
                      {landingShelfLabel(shelf)}
                    </button>
                  );
                })}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))",
                gap: 8,
              }}>
                {typesForLandingShelf(landingShelf).map(t => {
                  const sel = wrapCatalogTypeId === t.id;
                  return (
                    <button
                      key={`${landingShelf}-${t.id}`}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setWrapCatalogTypeId(t.id)}
                      className={sel ? "liquid-glass-card" : "liquid-glass"}
                      style={{
                        textAlign: "left" as const,
                        padding: "10px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontFamily: FONT,
                        border: sel ? "2px solid rgba(245,198,66,0.55)" : "1px solid var(--glass-border)",
                        background: sel ? "rgba(245,198,66,0.08)" : undefined,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: sel ? 700 : 600, color: "var(--fg)", display: "block" }}>{t.name}</span>
                      <span style={{ fontSize: 8, color: "var(--fg-3)", marginTop: 4, display: "block", fontFamily: "var(--font-mono, ui-monospace, monospace)" }}>{t.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {originCatalogTypeId && wrapCatalogTypeId !== originCatalogTypeId && (
              <div
                className="liquid-glass-card"
                style={{
                  marginBottom: 18,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(245,198,66,0.4)",
                  background: "rgba(245,198,66,0.07)",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#9A7030", marginBottom: 6, textTransform: "uppercase" as const }}>
                  Different from Work
                </div>
                <p style={{ fontSize: 12, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
                  Work ran as <strong style={{ fontWeight: 600 }}>{outputTypeDisplayLabel(originCatalogTypeId)}</strong>
                  . You are filing the saved piece as <strong style={{ fontWeight: 600 }}>{outputTypeDisplayLabel(wrapCatalogTypeId)}</strong>
                  . That only updates Catalog grouping and filters. Intake, checkpoints, and your draft text are unchanged.
                </p>
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(152px, 1fr))",
              gap: 10,
              marginBottom: 28,
            }}>
              {ALL_WRAP_CHANNELS.map(ch => {
                const on = selectedChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleChannel(ch)}
                    className={on ? "liquid-glass-card" : "liquid-glass"}
                    style={{
                      textAlign: "left" as const,
                      padding: "14px 14px",
                      cursor: "pointer",
                      border: on ? "2px solid rgba(245,198,66,0.55)" : "1px solid var(--glass-border)",
                      borderRadius: 12,
                      background: on ? "rgba(245,198,66,0.08)" : undefined,
                      fontFamily: FONT,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: on ? 700 : 600, color: "var(--fg)" }}>{ch}</span>
                    {on ? (
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#9A7030", marginTop: 6 }}>Selected</div>
                    ) : (
                      <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 6 }}>Tap to include</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "center" }}>
              <button
                type="button"
                className="liquid-glass-btn-gold"
                disabled={selectedChannels.length === 0}
                onClick={() => void handleConfirmChannels()}
                style={{
                  padding: "14px 28px", opacity: selectedChannels.length ? 1 : 0.5,
                  cursor: selectedChannels.length ? "pointer" : "not-allowed",
                }}
              >
                <span className="liquid-glass-btn-gold-label">
                  {selectedChannels.length
                    ? `Generate ${selectedChannels.length} version${selectedChannels.length !== 1 ? "s" : ""}`
                    : "Select channels"}
                </span>
              </button>
              {!sessionDraft && selectedOutputId && (
                <button
                  type="button"
                  className="liquid-glass-btn"
                  onClick={() => {
                    setSelectedOutputId(null);
                    setWrapPhase("choose");
                    setSelectedChannels([]);
                  }}
                  style={{ padding: "12px 20px" }}
                >
                  <span className="liquid-glass-btn-label" style={{ color: "var(--fg-2)", fontWeight: 600 }}>All pieces</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Build (generating) ───────────────────────────────────────
  if (wrapPhase === "build") {
    const buildDone = formats.filter(f => formatContents[f]?.status === "done").length;
    const buildErrors = formats.filter(f => formatContents[f]?.status === "error").length;
    const buildStillRunning = formats.some(f => {
      const s = formatContents[f]?.status;
      return s === "loading" || s === "pending" || s === undefined;
    });
    const canContinueToDeliver = buildDone > 0 && !buildStillRunning;

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
        <WrapStepRail phase="build" />
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "28px 32px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
            <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "0 0 4px", lineHeight: 1.55 }}>
              {buildErrors > 0
                ? "When every row is ready, you move forward automatically. If you prefer, jump ahead with the versions that finished."
                : "Reed is shaping each channel. This usually stays under a minute per surface."}
            </p>
            {formats.map(fmt => {
              const st = formatContents[fmt]?.status;
              const loadingFmt = st === "loading" || st === "pending" || st === undefined;
              const doneFmt = st === "done";
              const errFmt = st === "error";
              return (
                <div
                  key={fmt}
                  className="liquid-glass-card"
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap" as const,
                    border: errFmt ? "1px solid rgba(220,38,38,0.25)" : undefined,
                  }}
                >
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{fmt}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.45 }}>
                      {loadingFmt
                        ? "Reed is adapting your draft for this channel…"
                        : errFmt
                          ? "This request did not complete. Retry the same channel, or continue with the ones that are ready."
                          : "Ready to open in Your pieces."}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {errFmt ? (
                      <button
                        type="button"
                        className="liquid-glass-btn-gold"
                        disabled={loadingFmt}
                        onClick={() => void adaptFormat(fmt)}
                        style={{ padding: "8px 16px" }}
                      >
                        <span className="liquid-glass-btn-gold-label">Retry</span>
                      </button>
                    ) : null}
                    {loadingFmt ? (
                      <div
                        title="Working"
                        style={{
                          width: 22, height: 22, borderRadius: "50%",
                          border: "2px solid rgba(245,198,66,0.35)",
                          borderTopColor: "var(--gold-bright, #F5C642)",
                          animation: "wrapspin 0.85s linear infinite",
                        }}
                      />
                    ) : doneFmt ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#16A34A",
                        padding: "4px 10px", borderRadius: 8,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.28)",
                      }}>Ready</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <style>{`@keyframes wrapspin { to { transform: rotate(360deg); } }`}</style>

            <div className="liquid-glass-card" style={{ padding: "16px 18px", marginTop: 8, display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{buildDone}</strong>
                {" "}of{" "}
                <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{formats.length}</strong>
                {" "}channel{formats.length !== 1 ? "s" : ""} ready
                {buildErrors > 0 ? (
                  <span style={{ color: "var(--fg-3)" }}>{` · ${buildErrors} ${buildErrors === 1 ? "needs" : "need"} attention`}</span>
                ) : null}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
                <button
                  type="button"
                  className="liquid-glass-btn"
                  onClick={() => {
                    setWrapPhase("choose");
                    setSelectedChannels([...formats]);
                  }}
                  style={{ padding: "10px 16px" }}
                >
                  <span className="liquid-glass-btn-label" style={{ fontWeight: 600, color: "var(--fg-2)" }}>Back to channels</span>
                </button>
                <button
                  type="button"
                  className="liquid-glass-btn-gold"
                  disabled={!canContinueToDeliver}
                  onClick={() => setWrapPhase("deliver")}
                  style={{
                    padding: "10px 20px",
                    opacity: canContinueToDeliver ? 1 : 0.45,
                    cursor: canContinueToDeliver ? "pointer" : "not-allowed",
                  }}
                >
                  <span className="liquid-glass-btn-gold-label">
                    {buildDone > 0 ? `View ${buildDone} ready piece${buildDone !== 1 ? "s" : ""}` : "Wait for at least one channel"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Deliver (gallery + reader) ───────────────────────────────
  const formatEntry = formatContents[activeFormat];
  const displayContent =
    formatEntry == null
      ? (activeOutput.content || "")
      : formatEntry.status === "error"
        ? ""
        : (formatEntry.content || "");
  const displayMetadata = formatEntry?.metadata || {};
  const isAdapting = formatEntry?.status === "loading";
  const isChannelError = formatEntry?.status === "error";
  const contentTitle = activeOutput.title || "Untitled";
  const contentParas = displayContent ? displayContent.split("\n").filter(Boolean) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: FONT }}>
      <WrapStepRail phase="deliver" />

      <div className="liquid-glass" style={{
        display: "flex", alignItems: "center", borderRadius: 0,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "0 12px 0 20px", flexShrink: 0,
        overflowX: "auto", gap: 4,
      }}>
        <button
          type="button"
          className="liquid-glass-btn"
          onClick={() => {
            setWrapPhase("choose");
            setSelectedChannels([...formats]);
          }}
          style={{ flexShrink: 0, padding: "8px 12px", marginRight: 8 }}
        >
          <span className="liquid-glass-btn-label" style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-3)" }}>Edit channels</span>
        </button>
        {!sessionDraft && selectedOutputId && (
          <button
            type="button"
            onClick={() => {
              setSelectedOutputId(null);
              setFormats([...WRAP_CHANNEL_FORMATS]);
              setActiveFormat(WRAP_CHANNEL_FORMATS[0]);
              setFormatContents({});
              adaptingRef.current.clear();
              setExported(false);
              setCatalogLinkId(null);
              setWrapPhase("choose");
              setSelectedChannels([...DEFAULT_CHANNEL_PRESELECT]);
            }}
            style={{
              fontSize: 10, fontWeight: 600, color: "var(--fg-3)",
              padding: "10px 10px", cursor: "pointer",
              background: "none", border: "none", fontFamily: FONT,
              borderRight: "1px solid var(--glass-border)", marginRight: 4,
            }}
          >
            All pieces
          </button>
        )}
        {formats.map(fmt => {
          const tabErr = formatContents[fmt]?.status === "error";
          return (
            <button key={fmt} type="button" onClick={() => handleFormatChange(fmt)} style={{
              fontSize: 11, fontWeight: activeFormat === fmt ? 600 : 500,
              color: activeFormat === fmt ? "var(--fg)" : "var(--fg-3)",
              padding: "11px 14px",
              borderBottom: activeFormat === fmt ? "2px solid var(--fg)" : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap" as const,
              transition: "all 0.1s", background: "none", border: "none",
              borderBottomStyle: "solid" as const, fontFamily: FONT,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {fmt}
              {tabErr ? (
                <span style={{
                  fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em",
                  color: "#B91C1C", padding: "2px 5px", borderRadius: 4,
                  background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.22)",
                }}>Issue</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {catalogLinkId ? (
        <div className="liquid-glass-card" style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10,
          margin: "10px 20px 0", padding: "12px 16px",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "var(--fg-2)", flex: "1 1 200px" }}>
            This piece is in your Catalog (saved master draft).
          </span>
          <button type="button" className="liquid-glass-btn" onClick={() => nav(`/studio/outputs/${catalogLinkId}`)} style={{ padding: "6px 14px" }}>
            <span className="liquid-glass-btn-label" style={{ fontWeight: 600 }}>Open in Catalog</span>
          </button>
          <button type="button" className="liquid-glass-btn-gold" onClick={() => nav("/studio/outputs")} style={{ padding: "6px 14px" }}>
            <span className="liquid-glass-btn-gold-label">All pieces</span>
          </button>
        </div>
      ) : (
        <div className="liquid-glass" style={{
          margin: "10px 20px 0", padding: "10px 16px", flexShrink: 0,
          borderRadius: 12, border: "1px solid var(--glass-border)",
        }}>
          <span style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--fg-2)", fontWeight: 600 }}>Catalog</strong>
            {" "}lives under Library. After Export All in the dashboard, your master draft is marked saved there.
          </span>
        </div>
      )}

      <div style={{
        flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 32px" : "28px 24px 40px",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
      }}>
        <div className="liquid-glass-card" style={{
          width: "100%", maxWidth: 640,
          padding: isMobile ? "22px 20px" : "32px 36px",
          minHeight: 200,
        }}>
          {isAdapting ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 14, color: "var(--fg-3)" }}>Adapting {activeFormat}…</div>
            </div>
          ) : isChannelError ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
                {activeFormat} did not generate
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 20, lineHeight: 1.55 }}>
                The request failed. Retry here, use Edit channels to drop this surface, or continue with your other tabs.
              </div>
              <button type="button" className="liquid-glass-btn-gold" onClick={() => void adaptFormat(activeFormat)} style={{ padding: "10px 22px" }}>
                <span className="liquid-glass-btn-gold-label">Retry {activeFormat}</span>
              </button>
            </div>
          ) : contentParas.length > 0 ? (
            <>
              {displayMetadata.subject && (
                <div style={{ marginBottom: displayMetadata.preview ? 4 : 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.08em" }}>SUBJECT: </span>
                  <span style={{ fontSize: 12, color: "var(--fg)" }}>{displayMetadata.subject}</span>
                </div>
              )}
              {displayMetadata.preview && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.08em" }}>PREVIEW: </span>
                  <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{displayMetadata.preview}</span>
                </div>
              )}
              {displayMetadata.videoTitle && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.08em" }}>VIDEO TITLE: </span>
                  <span style={{ fontSize: 12, color: "var(--fg)" }}>{displayMetadata.videoTitle}</span>
                </div>
              )}

              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#9A7030", marginBottom: 10, textTransform: "uppercase" as const }}>
                {activeFormat}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px", lineHeight: 1.25 }}>
                {contentTitle}
              </h1>
              {contentParas.map((p, i) => (
                <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "var(--fg-2)", margin: 0, marginTop: i > 0 ? 14 : 0 }}>{p}</p>
              ))}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--glass-border)" }}>
                <button type="button" className="liquid-glass-btn" onClick={handleCopy} style={{ padding: "8px 18px" }}>
                  <span className="liquid-glass-btn-label" style={{ color: "var(--fg-2)", fontWeight: 600 }}>
                    {copied ? "Copied" : `Copy ${activeFormat}`}
                  </span>
                </button>
                <button type="button" className="liquid-glass-btn-gold" onClick={() => {
                  sessionStorage.setItem("ew-reopen-output-id", activeOutput.id);
                  sessionStorage.setItem("ew-reopen-title", activeOutput.title);
                  nav("/studio/work");
                }} style={{ padding: "8px 18px" }}
                >
                  <span className="liquid-glass-btn-gold-label">Reopen in Work</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>Adapt {activeFormat}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 16, lineHeight: 1.55 }}>
                This version is not ready yet. Run adapt or open the dashboard for Export All.
              </div>
              <button type="button" className="liquid-glass-btn-gold" onClick={() => void adaptFormat(activeFormat)} style={{ padding: "10px 22px" }}>
                <span className="liquid-glass-btn-gold-label">Adapt now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {wrapCatalogTypeId === "presentation" && (
        <div className="liquid-glass-card" style={{ margin: "0 20px 16px", padding: "12px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 11, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Duration (min)</span>
              <input
                type="number"
                className="liquid-glass-input"
                min={3}
                max={180}
                step={1}
                value={wrapPresentationMinutes}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v)) setWrapPresentationMinutes(Math.min(180, Math.max(3, v)));
                }}
                style={{ width: 72, fontSize: 12, padding: "6px 10px" }}
              />
            </label>
            <button type="button" className="liquid-glass-btn" onClick={applyPresentationLength} style={{ padding: "6px 12px" }}>
              <span className="liquid-glass-btn-label" style={{ fontWeight: 600 }}>Apply length and re-adapt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
