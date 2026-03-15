import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Globe, BookOpen, Upload, Lightbulb, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import "./shared.css";

const CREAM = "#F4F2ED";
const GOLD = "#C8961A";
const DARK = "#111";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

/** Parse voice_dna_md for section text under ### Voice Layer, ### Value Layer, ### Personality Layer */
function parseVoiceDnaMdSections(md: string | null): { voice: string; value: string; personality: string } {
  const fallback = { voice: "", value: "", personality: "" };
  if (!md || typeof md !== "string") return fallback;
  const sections: Record<string, string> = {};
  const regex = /###\s*(Voice Layer|Value Layer|Personality Layer)\s*\n([\s\S]*?)(?=###|$)/gi;
  let m;
  while ((m = regex.exec(md)) !== null) {
    const key = m[1].toLowerCase().replace(/\s+layer$/, "") as "voice" | "value" | "personality";
    sections[key] = m[2].trim().replace(/\n+/g, " ").slice(0, 280);
  }
  return {
    voice: sections.voice || fallback.voice,
    value: sections.value || fallback.value,
    personality: sections.personality || fallback.personality,
  };
}

interface ProfileData {
  voice_dna: {
    voice_fidelity?: number;
    voice_layer?: number;
    value_layer?: number;
    personality_layer?: number;
    traits?: {
      vocabulary_and_syntax?: number;
      tonal_register?: number;
      structural_habits?: number;
    };
    signature_phrases?: string[];
    prohibited_words?: string[];
    prohibited_patterns?: string[];
    voice_description?: string;
    value_description?: string;
    personality_description?: string;
  } | null;
  voice_dna_md: string | null;
  brand_dna: Record<string, unknown> | null;
  brand_dna_md: string | null;
  method_dna: Record<string, unknown> | null;
  method_dna_md: string | null;
}

const goldOutlinedBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: `1px solid ${GOLD}`,
  background: "transparent",
  color: GOLD,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

export default function Resources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [brandFiles, setBrandFiles] = useState<{ id: string; file: File }[]>([]);
  const [voiceFiles, setVoiceFiles] = useState<{ id: string; file: File }[]>([]);
  const [brandUploading, setBrandUploading] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("voice_dna, voice_dna_md, brand_dna, brand_dna_md, method_dna, method_dna_md")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data as ProfileData | null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const voiceMdSections = parseVoiceDnaMdSections(profile?.voice_dna_md ?? null);
  const vd = profile?.voice_dna;
  const fidelity = vd?.voice_fidelity ?? 0;
  const traits = vd?.traits ?? {};
  const voiceLayerScore = vd?.voice_layer ?? traits.vocabulary_and_syntax ?? 0;
  const valueLayerScore = vd?.value_layer ?? traits.tonal_register ?? 0;
  const personalityLayerScore = vd?.personality_layer ?? traits.structural_habits ?? 0;
  const signaturePhrases = Array.isArray(vd?.signature_phrases) ? vd.signature_phrases : [];
  const avoidPatterns = Array.isArray(vd?.prohibited_patterns) ? vd.prohibited_patterns : Array.isArray(vd?.prohibited_words) ? vd.prohibited_words : [];

  const hasBrandDna = profile?.brand_dna && Object.keys(profile.brand_dna).length > 0;
  const hasMethodDna = profile?.method_dna && profile.method_dna !== null && Object.keys(profile.method_dna).length > 0;
  const bd = profile?.brand_dna as Record<string, unknown> | undefined;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const addVoiceFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if ([".txt", ".md", ".pdf", ".docx"].includes(ext))
        setVoiceFiles((prev) => [...prev, { id: `${f.name}-${Date.now()}`, file: f }]);
    });
  };

  const addBrandFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if ([".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".svg", ".zip"].includes(ext))
        setBrandFiles((prev) => [...prev, { id: `${f.name}-${Date.now()}`, file: f }]);
    });
  };

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

  if (loading) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "48px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ height: 32, width: 120, background: "rgba(0,0,0,0.06)", borderRadius: 8, marginBottom: 48 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 48 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 180, background: "rgba(0,0,0,0.04)", borderRadius: 12 }} />
            ))}
          </div>
          <div style={{ height: 200, background: "rgba(0,0,0,0.04)", borderRadius: 12, marginBottom: 48 }} />
          <div style={{ height: 200, background: "rgba(0,0,0,0.04)", borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh", padding: "48px 24px", fontFamily: "'DM Sans', sans-serif", color: DARK }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Page title */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(17,17,17,0.5)", marginBottom: 8 }}>
            STUDIO
          </p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 32, fontWeight: 700, color: DARK, margin: 0, letterSpacing: "-0.02em" }}>
            Resources
          </h1>
          <p style={{ fontSize: 15, color: "rgba(17,17,17,0.65)", marginTop: 8, lineHeight: 1.6 }}>
            Who you are in the system's eyes. Voice, Brand, and Method DNA run in every session.
          </p>
        </div>

        {/* ─── SECTION 1: VOICE DNA ─── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mic size={24} style={{ color: GOLD }} />
              <span style={{ fontSize: 24, fontWeight: 600, color: DARK }}>Voice DNA</span>
            </div>
            <button
              type="button"
              style={goldOutlinedBtn}
              onClick={() => navigate("/onboarding?retrain=voice")}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Retrain
            </button>
          </div>

          {/* Fidelity score card */}
          <div
            style={{
              borderLeft: `4px solid ${GOLD}`,
              background: "#fff",
              borderRadius: 12,
              padding: "24px 28px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 48, fontWeight: 700, color: GOLD, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {typeof fidelity === "number" ? fidelity.toFixed(1) : "—"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: DARK, marginTop: 4 }}>Voice Fidelity Score</div>
              <div style={{ fontSize: 13, color: "rgba(17,17,17,0.5)", marginTop: 2 }}>Active in every session</div>
            </div>
            <div style={{ flex: "1 1 200px", maxWidth: 280, minWidth: 160 }}>
              <div style={{ height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, Number(fidelity)))}%`, background: GOLD, borderRadius: 999, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>

          {/* Three trait cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 28 }}>
            {[
              { title: "Voice Layer", subtitle: "How you sound", score: voiceLayerScore, desc: voiceMdSections.voice || vd?.voice_description || "" },
              { title: "Value Layer", subtitle: "What you stand for", score: valueLayerScore, desc: voiceMdSections.value || vd?.value_description || "" },
              { title: "Personality Layer", subtitle: "How you show up", score: personalityLayerScore, desc: voiceMdSections.personality || vd?.personality_description || "" },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: DARK }}>{card.title}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: GOLD }}>{card.score}%</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(17,17,17,0.5)", marginBottom: 10 }}>{card.subtitle}</div>
                {card.desc ? <p style={{ fontSize: 13, color: "rgba(17,17,17,0.75)", lineHeight: 1.5, margin: 0 }}>{card.desc}</p> : null}
                <div style={{ marginTop: 12, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, card.score)}%`, background: GOLD, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Signature Phrases */}
          {signaturePhrases.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(17,17,17,0.6)", marginBottom: 10 }}>Signature Phrases</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {signaturePhrases.map((phrase, i) => (
                  <span key={i} style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(200,150,26,0.12)", color: GOLD, fontSize: 13 }}>
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Patterns to avoid */}
          {avoidPatterns.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(17,17,17,0.6)", marginBottom: 10 }}>Patterns to avoid</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {avoidPatterns.map((p, i) => (
                  <span key={i} style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.06)", color: "rgba(17,17,17,0.6)", fontSize: 13 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Voice upload zone */}
          <input ref={voiceInputRef} type="file" accept=".txt,.md,.pdf,.docx" multiple style={{ display: "none" }} onChange={(e) => { addVoiceFiles(e.target.files); e.target.value = ""; }} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => voiceInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && voiceInputRef.current?.click()}
            style={{
              padding: "20px 24px",
              border: "2px dashed rgba(0,0,0,0.15)",
              borderRadius: 12,
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              color: "rgba(17,17,17,0.6)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; e.currentTarget.style.color = "rgba(17,17,17,0.6)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Upload size={18} />
              <span>Upload writing samples to sharpen your Voice DNA</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>.txt, .md, .pdf, .docx</div>
          </div>
          {voiceFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {voiceFiles.map((f) => (
                <span key={f.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>
                  {f.file.name}
                  <button type="button" aria-label="Remove" onClick={() => setVoiceFiles((p) => p.filter((x) => x.id !== f.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── SECTION 2: BRAND DNA ─── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Globe size={24} style={{ color: GOLD }} />
              <span style={{ fontSize: 24, fontWeight: 600, color: DARK }}>Brand DNA</span>
            </div>
            <button type="button" style={goldOutlinedBtn} onClick={() => navigate("/onboarding?retrain=brand")} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {hasBrandDna ? "Retrain" : "Set Up Brand DNA"}
            </button>
          </div>

          {hasBrandDna && bd ? (
            <>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "24px 28px",
                  marginBottom: 24,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {bd.brand_name && <div style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 8 }}>{String(bd.brand_name)}</div>}
                {bd.core_promise && <div style={{ fontSize: 16, fontStyle: "italic", color: GOLD, marginBottom: 8 }}>{String(bd.core_promise)}</div>}
                {bd.category_position && <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.06)", fontSize: 12, color: "rgba(17,17,17,0.7)" }}>{String(bd.category_position)}</span>}
              </div>

              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 28px", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 24 }}>
                {[
                  ["Positioning", bd.category_position],
                  ["Tone", Array.isArray(bd.brand_voice_adjectives) ? (bd.brand_voice_adjectives as string[]).join(" · ") : bd.brand_voice_adjectives],
                  ["Core Promise", bd.core_promise],
                  ["Declared Enemy", bd.declared_enemy],
                  ["Target Person", bd.target_person],
                ]
                  .filter(([, val]) => val != null && val !== "")
                  .map(([label, val]) => (
                    <div key={label} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(17,17,17,0.5)", minWidth: 120 }}>{label}</span>
                      <span style={{ fontSize: 13, color: DARK }}>{String(val)}</span>
                    </div>
                  ))}
              </div>

              {Array.isArray(bd.never_say) && bd.never_say.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(17,17,17,0.6)", marginBottom: 10 }}>Brand would never say</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(bd.never_say as string[]).map((s, i) => (
                      <span key={i} style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(200,80,80,0.1)", color: "rgba(120,50,50,0.9)", fontSize: 13 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: 13, color: "rgba(17,17,17,0.6)", marginBottom: 12, lineHeight: 1.5 }}>
                Logos, brand guidelines, marketing copy, website exports, past campaigns, style guides. The more you upload, the more precisely the system writes in your brand's voice.
              </p>
              <input ref={brandInputRef} type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.svg,.zip" multiple style={{ display: "none" }} onChange={(e) => { addBrandFiles(e.target.files); e.target.value = ""; }} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => brandInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && brandInputRef.current?.click()}
                style={{ padding: "20px 24px", border: "2px dashed rgba(0,0,0,0.15)", borderRadius: 12, background: "#fff", cursor: "pointer", fontSize: 14, color: "rgba(17,17,17,0.6)", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; e.currentTarget.style.color = "rgba(17,17,17,0.6)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Upload size={18} />
                  <span>Upload Brand Assets</span>
                </div>
              </div>
              {brandFiles.length > 0 && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {brandFiles.map((f) => (
                      <span key={f.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.06)", fontSize: 12 }}>
                        {f.file.name}
                        <button type="button" aria-label="Remove" onClick={() => setBrandFiles((p) => p.filter((x) => x.id !== f.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                  <button type="button" disabled={brandUploading} onClick={uploadBrandAssets} style={{ ...goldOutlinedBtn, marginTop: 12 }}>{brandUploading ? "Processing…" : "Process & update Brand DNA"}</button>
                </>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 12, border: "1px dashed rgba(0,0,0,0.12)" }}>
              <p style={{ fontSize: 16, color: "rgba(17,17,17,0.7)", marginBottom: 20 }}>Your Brand DNA hasn't been captured yet.</p>
              <button
                type="button"
                onClick={() => navigate("/onboarding?retrain=brand")}
                style={{ ...goldOutlinedBtn, background: GOLD, color: "#fff", borderColor: GOLD }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#b8860b"; e.currentTarget.style.borderColor = "#b8860b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.borderColor = GOLD; }}
              >
                Set Up Brand DNA
              </button>
            </div>
          )}
        </section>

        {/* ─── SECTION 3: METHOD DNA ─── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BookOpen size={24} style={{ color: GOLD }} />
              <span style={{ fontSize: 24, fontWeight: 600, color: DARK }}>Method DNA</span>
            </div>
            <button type="button" style={goldOutlinedBtn} onClick={() => navigate("/onboarding?retrain=method")} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {hasMethodDna ? "Retrain" : "Set Up"}
            </button>
          </div>

          {hasMethodDna && profile?.method_dna ? (
            <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <pre style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: DARK, whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(profile.method_dna, null, 2)}</pre>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, padding: "40px 32px", border: "1px dashed rgba(0,0,0,0.12)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Lightbulb size={40} style={{ color: "rgba(200,150,26,0.6)" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: DARK, marginBottom: 12, textAlign: "center" }}>Your Method DNA</h3>
              <p style={{ fontSize: 14, color: "rgba(17,17,17,0.7)", lineHeight: 1.6, textAlign: "center", maxWidth: 480, margin: "0 auto 24px" }}>
                Capture your frameworks, proprietary vocabulary, and the concepts that make your thinking uniquely yours. Once trained, every output references your methodology automatically.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 auto 28px", maxWidth: 400, fontSize: 14, color: "rgba(17,17,17,0.75)", lineHeight: 1.8 }}>
                <li>· Your named frameworks (e.g. The 5 Rings, The OPAT System)</li>
                <li>· Proprietary vocabulary your audience knows you for</li>
                <li>· The mental models you return to again and again</li>
              </ul>
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => navigate("/onboarding?retrain=method")}
                  style={{ ...goldOutlinedBtn, background: GOLD, color: "#fff", borderColor: GOLD, padding: "12px 24px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#b8860b"; e.currentTarget.style.borderColor = "#b8860b"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.borderColor = GOLD; }}
                >
                  Set Up Method DNA
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
