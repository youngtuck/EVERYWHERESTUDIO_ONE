/**
 * Resources.tsx, Project Files
 * Phase 6 + fixes:
 *  - Loads real resources from Supabase (resources table)
 *  - "View file" opens a modal showing the extracted content
 *  - Upload area calls upload-resource API
 */
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useShell } from "../../components/studio/StudioShell";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FONT = "var(--font)";

interface Resource {
  id: string;
  title: string;
  resource_type: string;
  description: string;
  content: string;
  is_active: boolean;
  updated_at: string;
  metadata?: { file_name?: string; file_type?: string };
}

const TYPE_LABELS: Record<string, string> = {
  voice_dna: "Voice DNA",
  brand_dna: "Brand DNA",
  method_dna: "Method DNA",
  reference: "Reference",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Content viewer modal ──────────────────────────────────────
function ContentModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(13,27,42,0.55)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{resource.title}</div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
              {TYPE_LABELS[resource.resource_type] ?? resource.resource_type} · Updated {formatDate(resource.updated_at)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => { navigator.clipboard.writeText(resource.content); }}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}
            >
              Copy
            </button>
            <button
              onClick={onClose}
              aria-label="Close resource viewer"
              style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 2 }}
            >✕</button>
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {resource.content && resource.content !== "(No text content extracted)" ? (
            <pre style={{
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              fontFamily: FONT, margin: 0,
            }}>
              {resource.content}
            </pre>
          ) : (
            <div style={{ fontSize: 13, color: "var(--fg-3)", fontStyle: "normal" }}>
              No text content was extracted from this file. The file may be an image or a non-text format.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── File detail dashboard panel ────────────────────────────────
function FileDetailPanel({
  resource,
  onView,
  onReplace,
  onRemove,
}: {
  resource: Resource;
  onView: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 3 }}>{resource.title}</div>
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 10 }}>
          {TYPE_LABELS[resource.resource_type] ?? resource.resource_type} · Updated {formatDate(resource.updated_at)}
        </div>
        {resource.description && (
          <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.65 }}>{resource.description}</div>
        )}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 6 }}>Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={onView}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}
          >
            View file
          </button>
          <button
            onClick={onReplace}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, color: "var(--fg-2)", cursor: "pointer", fontFamily: FONT }}
          >
            Replace file
          </button>
          <button
            onClick={onRemove}
            style={{ width: "100%", textAlign: "left" as const, padding: "7px 10px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)", fontSize: 11, color: "var(--danger)", cursor: "pointer", fontFamily: FONT }}
          >
            Remove from project
          </button>
        </div>
      </div>
    </>
  );
}

// No static fallback, show empty state when no resources exist

// ── Main Component ─────────────────────────────────────────────
export default function Resources() {
  const isMobile = useMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setDashContent, setDashOpen } = useShell();
  const nav = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Foundation items from profiles table
  const [voiceDnaExists, setVoiceDnaExists] = useState(false);
  const [brandDnaExists, setBrandDnaExists] = useState(false);
  const [voiceDnaDate, setVoiceDnaDate] = useState("");
  const [brandDnaDate, setBrandDnaDate] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("voice_dna_completed, voice_dna_completed_at, brand_dna_completed, brand_dna_completed_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.voice_dna_completed) {
          setVoiceDnaExists(true);
          setVoiceDnaDate(data.voice_dna_completed_at || "");
        }
        if (data?.brand_dna_completed) {
          setBrandDnaExists(true);
          setBrandDnaDate(data.brand_dna_completed_at || "");
        }
      });
  }, [user]);

  // Load real resources from Supabase
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, title, resource_type, description, content, is_active, updated_at, metadata")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (data && data.length > 0) {
        setResources(data as Resource[]);
      } else {
        setResources([]);
      }
      setLoading(false);
    })();
  }, [user]);

  const selectedResource = resources.find(r => r.id === selectedId) ?? null;

  const handleView = () => {
    if (selectedResource) setViewingResource(selectedResource);
  };

  const handleRemove = async () => {
    if (!selectedResource || !user) return;
    if (selectedResource.id.startsWith("f")) {
      toast("No real file to remove, this is a placeholder.", "error");
      return;
    }
    await supabase.from("resources").update({ is_active: false }).eq("id", selectedResource.id).eq("user_id", user.id);
    setResources(prev => prev.filter(r => r.id !== selectedResource.id));
    setSelectedId(null);
    toast("Removed from project.");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    toast("Uploading file...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetchWithRetry(`${API_BASE}/api/upload-resource`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            fileName: file.name,
            fileContent: base64,
            fileType: file.type,
            resourceType: "reference",
            title: file.name.replace(/\.[^.]+$/, ""),
          }),
        }, { timeout: 60000 });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data.resource) {
          setResources(prev => [data.resource, ...prev.filter(r => !r.id.startsWith("f"))]);
          toast("File uploaded.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast("Upload failed. Try again.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Dashboard panel
  useLayoutEffect(() => {
    if (selectedResource) {
      setDashOpen(true);
      setDashContent(
        <FileDetailPanel
          resource={selectedResource}
          onView={handleView}
          onReplace={() => fileInputRef.current?.click()}
          onRemove={handleRemove}
        />
      );
    } else {
      setDashOpen(false);
      setDashContent(
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
          Select a file to see details.
        </div>
      );
    }
    return () => setDashContent(null);
  }, [selectedResource, setDashContent, setDashOpen]);

  const FileRow = ({ resource }: { resource: Resource }) => {
    const active = selectedId === resource.id;
    return (
      <div
        onClick={() => setSelectedId(resource.id)}
        onDoubleClick={() => { setSelectedId(resource.id); setViewingResource(resource); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 8px", borderBottom: "1px solid var(--line)",
          cursor: "pointer",
          background: active ? "rgba(245,198,66,0.06)" : "transparent",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(245,198,66,0.06)" : "transparent"; }}
      >
        {/* File icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
          background: "var(--bg-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg style={{ width: 14, height: 14, stroke: "var(--blue)", strokeWidth: 1.75, fill: "none" }} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: active ? "var(--fg)" : "var(--fg-2)", fontWeight: 500, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {resource.title}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-3)" }}>
            {TYPE_LABELS[resource.resource_type] ?? resource.resource_type} · Updated {formatDate(resource.updated_at)}
          </div>
        </div>
        <span style={{ fontSize: 9, color: resource.is_active ? "var(--blue)" : "var(--fg-3)", fontWeight: 600, flexShrink: 0 }}>
          {resource.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    );
  };

  return (
    <>
      <div style={{ padding: isMobile ? "20px 16px" : 20, fontFamily: FONT, maxWidth: isMobile ? "100%" : 680 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Project Files</div>

        {/* Foundation section */}
        {(voiceDnaExists || brandDnaExists) ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>Foundation</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 20 }}>
              {voiceDnaExists && (
                <div
                  onClick={() => nav("/studio/settings/voice")}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 8px", borderBottom: brandDnaExists ? "1px solid var(--line)" : "none",
                    borderLeft: "3px solid var(--gold)",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0, background: "rgba(245,198,66,0.08)", border: "1px solid rgba(245,198,66,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>V</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, marginBottom: 1 }}>Voice DNA</div>
                    <div style={{ fontSize: 10, color: "var(--fg-3)" }}>Your communication signature. Click to view.{voiceDnaDate ? ` · ${formatDate(voiceDnaDate)}` : ""}</div>
                  </div>
                  <svg style={{ width: 12, height: 12, stroke: "var(--fg-3)", strokeWidth: 2, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              )}
              {brandDnaExists && (
                <div
                  onClick={() => nav("/studio/settings/brand")}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 8px",
                    borderLeft: "3px solid var(--gold)",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0, background: "rgba(245,198,66,0.08)", border: "1px solid rgba(245,198,66,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>B</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, marginBottom: 1 }}>Brand DNA</div>
                    <div style={{ fontSize: 10, color: "var(--fg-3)" }}>Your brand profile. Click to view.{brandDnaDate ? ` · ${formatDate(brandDnaDate)}` : ""}</div>
                  </div>
                  <svg style={{ width: 12, height: 12, stroke: "var(--fg-3)", strokeWidth: 2, fill: "none", flexShrink: 0 }} viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            background: "rgba(245,198,66,0.04)", border: "1px solid rgba(245,198,66,0.12)",
            borderRadius: 8, padding: "14px 16px", marginBottom: 20,
            fontSize: 12, color: "var(--fg-2)", lineHeight: 1.6,
          }}>
            Set up your <span onClick={() => nav("/onboarding")} style={{ color: "var(--gold)", fontWeight: 600, cursor: "pointer" }}>Voice DNA and Brand DNA</span> to give Reed your full context.
          </div>
        )}

        {/* Project Files section */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--fg-3)", marginBottom: 8 }}>Project Files</div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 52, background: "var(--bg-2)", borderRadius: 6, marginBottom: 4 }} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, padding: "32px 20px", textAlign: "center" as const,
            boxShadow: "var(--shadow-sm)", marginBottom: 10,
          }}>
            <div style={{ fontSize: 22, color: "var(--line)", marginBottom: 12 }}>&#9764;</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>No project files yet</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
              Upload reference files, brand guides, or any documents Reed should know about.
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 10 }}>
            {resources.map(r => <FileRow key={r.id} resource={r} />)}
          </div>
        )}

        {/* Upload area */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            marginTop: 10, border: "1px dashed var(--line-2)",
            borderRadius: 7, padding: 16, textAlign: "center" as const,
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "border-color 0.12s", opacity: uploading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = "var(--blue)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-2)"; }}
        >
          <svg style={{ width: 20, height: 20, stroke: uploading ? "var(--blue)" : "var(--line-2)", strokeWidth: 1.75, fill: "none", margin: "0 auto 8px", display: "block" }} viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {uploading
              ? "Uploading..."
              : <><span style={{ color: "var(--blue)", fontWeight: 600 }}>Upload a file</span>: reference files, brand guides, or any documents Reed should know about</>
            }
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.pptx,.xlsx,.csv"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Content viewer modal */}
      {viewingResource && (
        <ContentModal
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
        />
      )}
    </>
  );
}
