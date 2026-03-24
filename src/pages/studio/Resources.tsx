import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Upload, Plus, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { fetchWithRetry } from "../../lib/retry";
import LoadingAnimation from "../../components/studio/LoadingAnimation";
import "./shared.css";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

type ResourceType = "voice_dna" | "brand_dna" | "method_dna" | "reference";
type FilterTab = "all" | ResourceType;
type ContentMethod = "paste" | "url" | "upload";

interface Resource {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  title: string;
  description: string;
  content: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "voice_dna", label: "Voice DNA" },
  { key: "brand_dna", label: "Brand Guide" },
  { key: "method_dna", label: "Methodology" },
  { key: "reference", label: "Reference" },
];

const BADGE_COLOR: Record<ResourceType, string> = {
  voice_dna: "var(--cornflower)",
  brand_dna: "#E8956A",
  method_dna: "#3A6644",
  reference: "#6B7280",
};

const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  voice_dna: "Voice DNA",
  brand_dna: "Brand Guide",
  method_dna: "Methodology",
  reference: "Reference",
};

const ADD_RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "voice_dna", label: "Voice DNA" },
  { value: "brand_dna", label: "Brand DNA" },
  { value: "method_dna", label: "Method DNA" },
  { value: "reference", label: "Reference" },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function getStats(resource: Resource): string {
  const len = (resource.content || "").length;
  const words = resource.content ? resource.content.trim().split(/\s+/).filter(Boolean).length : 0;
  return `${words} words · ${len} chars`;
}

export default function Resources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDefaultMethod, setAddModalDefaultMethod] = useState<ContentMethod>("paste");
  const [addModalDefaultType, setAddModalDefaultType] = useState<ResourceType | undefined>(undefined);
  const [addModalInitialFile, setAddModalInitialFile] = useState<File | null>(null);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("resources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setResources((data as Resource[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === "all" ? resources : resources.filter((r) => r.resource_type === filter);

  const refreshResources = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setResources((data as Resource[]) ?? []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (!error) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      setEditResource(null);
    }
  };

  const handleToggleActive = async (r: Resource) => {
    const { error } = await supabase
      .from("resources")
      .update({ is_active: !r.is_active, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    if (!error) refreshResources();
    setMenuOpenId(null);
  };

  const handleSaveEdit = async (id: string, patch: { title?: string; description?: string; content?: string; is_active?: boolean }) => {
    const { error } = await supabase
      .from("resources")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) refreshResources();
  };

  return (
    <div
      style={{
        
        background: "var(--surface-primary, #F4F2ED)",
        padding: isMobile ? "24px 16px" : "32px 24px",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary, rgba(0,0,0,0.4))",
              marginBottom: 4,
            }}
          >
            My Studio
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text-primary, #111)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                STUDIO RESOURCES
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary, rgba(0,0,0,0.6))", marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
                Everything the system uses to write in your voice and stay on strategy.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Upload size={16} />
                Upload
              </button>
              <button
                type="button"
                onClick={() => { setAddModalDefaultMethod("paste"); setAddModalDefaultType(filter !== "all" ? filter as ResourceType : undefined); setAddModalOpen(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--gold)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={16} />
                {filter !== "all" ? `Add ${ADD_RESOURCE_TYPES.find((t) => t.value === filter)?.label ?? "Resource"}` : "Add Resource"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === tab.key ? "rgba(0,0,0,0.05)" : "transparent",
                color: filter === tab.key ? "var(--fg)" : "var(--fg-2)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {loading ? (
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", padding: 48 }}>
              <LoadingAnimation variant="sentinel" message="Loading resources..." />
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditResource(r)}
                onKeyDown={(e) => e.key === "Enter" && setEditResource(r)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "var(--bg-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                <div style={{ position: "absolute", top: 20, right: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#fff",
                      background: BADGE_COLOR[r.resource_type],
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {RESOURCE_TYPE_LABEL[r.resource_type]}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === r.id ? null : r.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--text-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Menu"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
                {menuOpenId === r.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: 44,
                      right: 20,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      padding: "4px 0",
                      minWidth: 140,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                      onClick={() => { setEditResource(r); setMenuOpenId(null); }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                      onClick={() => handleToggleActive(r)}
                    >
                      {r.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#b91c1c", fontFamily: "inherit" }}
                      onClick={() => setDeleteConfirm(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginTop: 0, marginBottom: 8, paddingRight: 80 }}>
                  {r.title}
                </h3>
                {r.description && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                    {r.description}
                  </p>
                )}
                <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)", marginBottom: 8 }}>
                  {getStats(r)}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.is_active ? "#16a34a" : "var(--text-tertiary)" }} />
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Updated {formatDate(r.updated_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom add card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => { setAddModalDefaultType(filter !== "all" ? filter as ResourceType : undefined); setAddModalOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Enter") { setAddModalDefaultType(filter !== "all" ? filter as ResourceType : undefined); setAddModalOpen(true); } }}
          style={{
            border: "2px dashed var(--line)",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            cursor: "pointer",
            background: "transparent",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold)";
            e.currentTarget.style.background = "rgba(0,0,0,0.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--line)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
            + {filter !== "all" ? `Add ${ADD_RESOURCE_TYPES.find((t) => t.value === filter)?.label ?? "Resource"}` : "Add Resource"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
            Upload a doc, paste text, or enter a URL
          </p>
        </div>
      </div>

      {/* Add Resource Modal */}
      {addModalOpen && (
        <AddResourceModal
          user={user}
          defaultContentMethod={addModalDefaultMethod}
          defaultType={addModalDefaultType}
          initialFile={addModalInitialFile}
          onClose={() => { setAddModalOpen(false); setAddModalInitialFile(null); setAddModalDefaultType(undefined); }}
          onSaved={() => { setAddModalOpen(false); setAddModalInitialFile(null); setAddModalDefaultType(undefined); refreshResources(); }}
          fileInputRef={fileInputRef}
        />
      )}

      {/* Edit Modal */}
      {editResource && (
        <EditResourceModal
          resource={editResource}
          onClose={() => setEditResource(null)}
          onSaved={async (patch) => {
            await handleSaveEdit(editResource.id, patch);
            setEditResource(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete this resource?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#b91c1c",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.doc,.docx"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) {
            setAddModalInitialFile(file);
            setAddModalDefaultMethod("upload");
            setAddModalOpen(true);
          }
        }}
      />
    </div>
  );
}

function AddResourceModal({
  user,
  defaultContentMethod = "paste",
  defaultType,
  initialFile = null,
  onClose,
  onSaved,
  fileInputRef,
}: {
  user: { id: string } | null;
  defaultContentMethod?: ContentMethod;
  defaultType?: ResourceType;
  initialFile?: File | null;
  onClose: () => void;
  onSaved: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [resourceType, setResourceType] = useState<ResourceType>(defaultType ?? "reference");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentMethod, setContentMethod] = useState<ContentMethod>(defaultContentMethod);
  const [pasteContent, setPasteContent] = useState("");
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(initialFile ?? null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialFile) {
      setUploadFile(initialFile);
      setContentMethod("upload");
      setTitle(initialFile.name.replace(/\.[^.]+$/, ""));
    }
  }, [initialFile]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleAnalyzeUrl = async () => {
    if (!url.trim() || !url.startsWith("http")) {
      setError("Enter a valid URL.");
      return;
    }
    setError("");
    setUrlLoading(true);
    try {
      if (resourceType === "brand_dna") {
        const res = await fetchWithRetry(`${API_BASE}/api/brand-dna-from-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        if (data.markdown) setPasteContent(data.markdown);
        if (data.brandDna?.brand_name && !title) setTitle(String(data.brandDna.brand_name));
      } else {
        const res = await fetch(url.trim(), { headers: { "User-Agent": "EVERYWHERE-Studio-Resources/1.0" } });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const html = await res.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 50000);
        if (text.length < 50) throw new Error("Could not extract enough text from that URL.");
        setPasteContent(text);
      }
      setContentMethod("paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load URL.");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile || !user) return;
    setError("");
    setSaveLoading(true);
    setUploadLoading(true);
    try {
      const base64 = await fileToBase64(uploadFile);
      const res = await fetchWithRetry(`${API_BASE}/api/upload-resource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fileName: uploadFile.name,
          fileContent: base64,
          fileType: uploadFile.type,
          resourceType,
          title: title || uploadFile.name,
          description: description || `Uploaded from ${uploadFile.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaveLoading(false);
      setUploadLoading(false);
    }
  };

  const handleSavePaste = async () => {
    if (!user || !title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setSaveLoading(true);
    try {
      const { error: insertError } = await supabase.from("resources").insert({
        user_id: user.id,
        resource_type: resourceType,
        title: title.trim(),
        description: description.trim(),
        content: pasteContent.trim() || "(No content)",
        is_active: true,
      });
      if (insertError) throw new Error(insertError.message);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSave = () => {
    if (contentMethod === "upload" && uploadFile) handleUploadFile();
    else handleSavePaste();
  };

  const canSave = title.trim() && (contentMethod === "paste" ? true : contentMethod === "url" ? pasteContent.trim() : !!uploadFile);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 20, fontWeight: 700, margin: 0 }}>Add Resource</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Resource type
          </label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as ResourceType)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            {ADD_RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, color: "var(--text-secondary)" }}>
            Content
          </label>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(["paste", "url", "upload"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setContentMethod(method)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: contentMethod === method ? "var(--text-primary)" : "rgba(0,0,0,0.06)",
                  color: contentMethod === method ? "#fff" : "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {method === "paste" ? "Paste text" : method === "url" ? "From URL" : "Upload file"}
              </button>
            ))}
          </div>

          {contentMethod === "paste" && (
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste or type content here…"
              style={{
                width: "100%",
                minHeight: 200,
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          )}

          {contentMethod === "url" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleAnalyzeUrl}
                disabled={urlLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--gold)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: urlLoading ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {urlLoading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          )}

          {contentMethod === "upload" && (
            <div>
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setUploadFile(file);
                  if (file && !title.trim()) {
                    setTitle(file.name.replace(/\.[^.]+$/, ""));
                  }
                }}
                style={{ fontSize: 13 }}
              />
              {uploadFile && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, marginBottom: 0 }}>{uploadFile.name}</p>}
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saveLoading}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: canSave && !saveLoading ? "var(--gold-dark)" : "rgba(0,0,0,0.2)",
              color: "#fff",
              cursor: canSave && !saveLoading ? "pointer" : "default",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {saveLoading || uploadLoading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditResourceModal({
  resource,
  onClose,
  onSaved,
}: {
  resource: Resource;
  onClose: () => void;
  onSaved: (patch: { title?: string; description?: string; content?: string; is_active?: boolean }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description || "");
  const [content, setContent] = useState(resource.content || "");
  const [isActive, setIsActive] = useState(resource.is_active);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await Promise.resolve(onSaved({ title: title.trim(), description: description.trim(), content: content.trim(), is_active: isActive }));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 20, fontWeight: 700, margin: 0 }}>Edit Resource</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (included in Watson and generation)
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, color: "var(--text-secondary)" }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: 300,
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--line)",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: title.trim() && !saving ? "var(--gold-dark)" : "rgba(0,0,0,0.2)",
              color: "#fff",
              cursor: title.trim() && !saving ? "pointer" : "default",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
