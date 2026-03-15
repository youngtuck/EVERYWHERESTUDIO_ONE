import { useState, useEffect, useRef, type ReactNode, type ComponentType, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Globe, ChevronDown, Upload, BookOpen, X } from "lucide-react";
import { getScoreColor } from "../../utils/scoreColor";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./shared.css";

const VOICE_LAYERS_FALLBACK = [
  { name: "Voice Layer", desc: "How you speak: rhythm, sentence length, vocabulary, punctuation patterns", strength: 97, detail: "Direct, declarative. Short sentences that land." },
  { name: "Value Layer", desc: "What you stand for: core beliefs, professional principles", strength: 94, detail: "Clarity over complexity. Depth over volume." },
  { name: "Personality Layer", desc: "How you show up: humor, warmth, edge", strength: 91, detail: "Wry, self-aware. Willing to take a position." },
];

const GOLD_OUTLINE_BTN = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--gold-dark)",
  background: "transparent",
  color: "var(--gold-dark)",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
} as const;

const UPLOAD_ZONE = {
  padding: "20px 24px",
  border: "2px dashed var(--border-default)",
  borderRadius: 10,
  background: "none",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: "var(--text-secondary)",
  transition: "all 0.2s",
};

interface SectionProps {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  title: string;
  children: ReactNode;
}

function AccordionSection({ icon: Icon, title, children }: SectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.01)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon size={20} style={{ color: "var(--gold-dark)" }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        </div>
        <ChevronDown
          size={20}
          style={{
            color: "var(--text-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {open && children}
    </div>
  );
}

interface ProfileData {
  voice_dna: { voice_fidelity?: number; voice_layer?: number; value_layer?: number; personality_layer?: number } | null;
  brand_dna: Record<string, unknown> | null;
  method_dna: Record<string, unknown> | null;
}

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export default function Resources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [brandFiles, setBrandFiles] = useState<{ id: string; file: File }[]>([]);
  const [methodFiles, setMethodFiles] = useState<{ id: string; file: File }[]>([]);
  const [voiceFiles, setVoiceFiles] = useState<{ id: string; file: File }[]>([]);
  const [brandUploading, setBrandUploading] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const methodInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("voice_dna, brand_dna, method_dna")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data as ProfileData | null));
  }, [user]);

  const voiceFidelity = profile?.voice_dna?.voice_fidelity ?? 94.7;
  const voiceLayers = profile?.voice_dna
    ? [
        { name: "Voice Layer", desc: "How you speak", strength: profile.voice_dna.voice_layer ?? 0, detail: "" },
        { name: "Value Layer", desc: "What you stand for", strength: profile.voice_dna.value_layer ?? 0, detail: "" },
        { name: "Personality Layer", desc: "How you show up", strength: profile.voice_dna.personality_layer ?? 0, detail: "" },
      ]
    : VOICE_LAYERS_FALLBACK;

  const hasBrandDna = profile?.brand_dna && Object.keys(profile.brand_dna).length > 0;
  const hasMethodDna = profile?.method_dna && Object.keys(profile.method_dna).length > 0;

  const brandSummary = hasBrandDna && profile?.brand_dna
    ? {
        positioning: (profile.brand_dna as Record<string, unknown>).category_position ?? (profile.brand_dna as Record<string, unknown>).brand_name ?? "—",
        tone: Array.isArray((profile.brand_dna as Record<string, unknown>).brand_voice_adjectives)
          ? ((profile.brand_dna as Record<string, unknown>).brand_voice_adjectives as string[]).join(", ")
          : String((profile.brand_dna as Record<string, unknown>).brand_voice_description ?? "—"),
        corePromise: (profile.brand_dna as Record<string, unknown>).core_promise ?? (profile.brand_dna as Record<string, unknown>).value_proposition ?? "—",
      }
    : null;

  const addVoiceFiles = (list: FileList | null) => {
    if (!list) return;
    const accept = ".txt,.md,.pdf,.docx";
    Array.from(list).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (accept.includes(ext))
        setVoiceFiles((prev) => [...prev, { id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, file: f }]);
    });
  };

  const addBrandFiles = (list: FileList | null) => {
    if (!list) return;
    const accept = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.svg,.zip";
    Array.from(list).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (accept.includes(ext))
        setBrandFiles((prev) => [...prev, { id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, file: f }]);
    });
  };

  const addMethodFiles = (list: FileList | null) => {
    if (!list) return;
    const accept = ".pdf,.docx,.txt,.md,.pptx";
    Array.from(list).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (accept.includes(ext))
        setMethodFiles((prev) => [...prev, { id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`, file: f }]);
    });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const uploadBrandAssets = async () => {
    if (!user || !brandFiles.length || brandUploading) return;
    setBrandUploading(true);
    try {
      const files = await Promise.all(
        brandFiles.map(async (f) => ({ name: f.file.name, contentBase64: await fileToBase64(f.file), mimeType: f.file.type }))
      );
      const res = await fetch(`${API_BASE}/api/brand-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.brandDna && data.markdown) {
        await supabase
          .from("profiles")
          .update({
            brand_dna: data.brandDna,
            brand_dna_md: data.markdown,
            brand_dna_completed: true,
            brand_dna_completed_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        setProfile((p) => (p ? { ...p, brand_dna: data.brandDna } : null));
        setBrandFiles([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBrandUploading(false);
    }
  };

  const removeVoice = (id: string) => setVoiceFiles((p) => p.filter((f) => f.id !== id));
  const removeBrand = (id: string) => setBrandFiles((p) => p.filter((f) => f.id !== id));
  const removeMethod = (id: string) => setMethodFiles((p) => p.filter((f) => f.id !== id));

  const formatSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", marginBottom: 8, marginTop: 0 }}>
          STUDIO
        </p>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
          Resources
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginTop: 4, marginBottom: 0, maxWidth: 560, lineHeight: 1.6 }}>
          Three layers run in every session: Voice DNA, Brand DNA, and Method DNA. Set once and the system carries them everywhere.
        </p>
      </div>

      <AccordionSection icon={Mic} title="Voice DNA">
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--gold-dark)", letterSpacing: "-0.02em" }}>
                {typeof voiceFidelity === "number" ? voiceFidelity.toFixed(1) : voiceFidelity}
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)" }}>Voice Fidelity Score · Sharpening with each session</span>
            </div>
            <button
              type="button"
              style={GOLD_OUTLINE_BTN}
              onClick={() => navigate("/onboarding?retrain=voice")}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Retrain Voice DNA
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {voiceLayers.map((layer) => {
              const sc = getScoreColor(layer.strength >= 80 ? 800 : layer.strength >= 60 ? 650 : 500);
              return (
                <div key={layer.name} style={{ margin: "0 0 12px", padding: 20, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{layer.name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: sc.text }}>{layer.strength}%</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, marginTop: 0 }}>{layer.desc}</p>
                  {layer.detail ? <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: "italic", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{layer.detail}</p> : null}
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 8, marginBottom: 10, lineHeight: 1.5 }}>
            Upload writing samples, past articles, emails, or transcripts to sharpen your Voice DNA. The more you upload, the more precise the match.
          </p>
          <input
            ref={voiceInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx"
            multiple
            style={{ display: "none" }}
            onChange={(e) => { addVoiceFiles(e.target.files); e.target.value = ""; }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => voiceInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && voiceInputRef.current?.click()}
            style={UPLOAD_ZONE}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; e.currentTarget.style.color = "var(--gold-dark)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Upload size={18} />
              <span>.txt, .md, .pdf, .docx</span>
            </div>
          </div>
          {voiceFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {voiceFiles.map((f) => (
                <span
                  key={f.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  {f.file.name} · {formatSize(f.file.size)}
                  <button type="button" aria-label="Remove" onClick={() => removeVoice(f.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    <X size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </AccordionSection>

      <AccordionSection icon={Globe} title="Brand DNA">
        <div style={{ padding: "20px 24px 24px" }}>
          {hasBrandDna && brandSummary ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  type="button"
                  style={GOLD_OUTLINE_BTN}
                  onClick={() => navigate("/onboarding?retrain=brand")}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Retrain Brand DNA
                </button>
              </div>
              <div style={{ padding: "14px 16px", background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 10, marginBottom: 14 }}>
                {[
                  ["Positioning", brandSummary.positioning],
                  ["Tone", brandSummary.tone],
                  ["Core Promise", brandSummary.corePromise],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", minWidth: 90 }}>{k}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
                The more brand material you give the system, the more precisely it writes in your brand's voice. Upload anything: brand guidelines, logos, marketing copy, website exports, past campaigns, style guides, tone of voice documents.
              </p>
              <input
                ref={brandInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.svg,.zip"
                multiple
                style={{ display: "none" }}
                onChange={(e) => { addBrandFiles(e.target.files); e.target.value = ""; }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => brandInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && brandInputRef.current?.click()}
                style={UPLOAD_ZONE}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; e.currentTarget.style.color = "var(--gold-dark)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Upload size={18} />
                  <span>Add Brand Assets</span>
                </div>
              </div>
              {brandFiles.length > 0 && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {brandFiles.map((f) => (
                      <span
                        key={f.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "var(--surface-elevated)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {f.file.name} · {formatSize(f.file.size)}
                        <button type="button" aria-label="Remove" onClick={() => removeBrand(f.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                          <X size={14} style={{ color: "var(--text-tertiary)" }} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={brandUploading}
                    onClick={uploadBrandAssets}
                    style={{ ...GOLD_OUTLINE_BTN, marginTop: 12 }}
                    onMouseEnter={(e) => { if (!brandUploading) e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {brandUploading ? "Processing…" : "Process & update Brand DNA"}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>Your Brand DNA hasn't been set up yet.</p>
              <button
                type="button"
                style={GOLD_OUTLINE_BTN}
                onClick={() => navigate("/onboarding?retrain=brand")}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Set Up Brand DNA
              </button>
            </>
          )}
        </div>
      </AccordionSection>

      <AccordionSection icon={BookOpen} title="Method DNA">
        <div style={{ padding: "20px 24px 24px" }}>
          {hasMethodDna ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  type="button"
                  style={GOLD_OUTLINE_BTN}
                  onClick={() => navigate("/onboarding?retrain=method")}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Retrain Method DNA
                </button>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Your frameworks, proprietary vocabulary, and methodology are stored here.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 12, marginBottom: 10, lineHeight: 1.5 }}>
                Upload frameworks, methodology docs, or any content that defines how you think.
              </p>
              <input
                ref={methodInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.pptx"
                multiple
                style={{ display: "none" }}
                onChange={(e) => { addMethodFiles(e.target.files); e.target.value = ""; }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => methodInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && methodInputRef.current?.click()}
                style={UPLOAD_ZONE}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; e.currentTarget.style.color = "var(--gold-dark)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Upload size={18} />
                  <span>Add methodology docs</span>
                </div>
              </div>
              {methodFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {methodFiles.map((f) => (
                    <span
                      key={f.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "var(--surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {f.file.name} · {formatSize(f.file.size)}
                      <button type="button" aria-label="Remove" onClick={() => removeMethod(f.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <X size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                Your Method DNA captures your frameworks, proprietary concepts, and the vocabulary that makes your thinking uniquely yours.
              </p>
              <button
                type="button"
                style={GOLD_OUTLINE_BTN}
                onClick={() => navigate("/onboarding?retrain=method")}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Set Up Method DNA
              </button>
            </>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
