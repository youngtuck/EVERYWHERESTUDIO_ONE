import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, FileText, BarChart3, X } from "lucide-react";
import { getScoreColor } from "../../utils/scoreColor";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./shared.css";

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_default: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  outputs?: { count: number }[] | null;
};

type ScoreRow = {
  project_id: string | null;
  score: number | null;
};

const transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setScores([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [{ data: projectData, error: projError }, { data: scoreData, error: scoreError }] =
          await Promise.all([
            supabase
              .from("projects")
              .select("*, outputs(count)")
              .eq("user_id", user.id)
              .order("sort_order", { ascending: true }),
            supabase
              .from("outputs")
              .select("project_id, score")
              .eq("user_id", user.id)
              .gt("score", 0),
          ]);

        if (projError) throw projError;
        if (scoreError) throw scoreError;
        if (cancelled) return;

        setProjects(projectData as ProjectRow[] || []);
        setScores(scoreData as ScoreRow[] || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Could not load projects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const averagesByProject = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const row of scores) {
      if (!row.project_id || typeof row.score !== "number") continue;
      const key = row.project_id;
      const entry = map.get(key) || { sum: 0, count: 0 };
      entry.sum += row.score;
      entry.count += 1;
      map.set(key, entry);
    }
    const result = new Map<string, number>();
    for (const [key, { sum, count }] of map.entries()) {
      result.set(key, Math.round(sum / count));
    }
    return result;
  }, [scores]);

  const sortedProjects = useMemo(() => {
    const list = [...projects];
    list.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (b.is_default && !a.is_default) return 1;
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [projects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("projects").insert({
        user_id: user.id,
        name: newName.trim(),
        description: newDescription.trim(),
      });
      if (insertError) throw insertError;
      setNewName("");
      setNewDescription("");
      setCreating(false);

      // Refresh list
      const { data } = await supabase
        .from("projects")
        .select("*, outputs(count)")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      setProjects((data as ProjectRow[]) || []);
    } catch (e: any) {
      setCreating(false);
      setError(e.message || "Could not create project.");
    }
  };

  const renderHeader = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 32,
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          WRAP
        </p>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Projects
        </h1>
      </div>
      <button
        type="button"
        style={{
          background: "var(--text-primary)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          transition,
        }}
        onClick={() => setCreating(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        + New Project
      </button>
    </div>
  );

  const renderEmpty = () => (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <Folder size={32} style={{ color: "var(--text-tertiary)" }} />
      <h2
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Create your first project
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
        Projects organize your Watch configuration, outputs, and context.
      </p>
      <button
        type="button"
        style={{
          background: "var(--gold-dark)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          transition,
        }}
        onClick={() => setCreating(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--gold-light)";
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--gold-dark)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        New Project
      </button>
    </div>
  );

  const renderGrid = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
      className="projects-grid"
    >
      {sortedProjects.map((p) => {
        const outputsCount = (p.outputs && p.outputs[0]?.count) || 0;
        const avgScore = averagesByProject.get(p.id) ?? 0;
        const sc = getScoreColor(avgScore > 0 ? avgScore : null);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => navigate(`/studio/projects/${p.id}`)}
            style={{
              background: "var(--surface-white)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 24,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Folder size={24} style={{ color: "var(--text-tertiary)" }} />
            <h3
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              {p.name}
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 20,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={14} style={{ color: "var(--text-tertiary)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>
                  {outputsCount} outputs
                </span>
              </span>
              {avgScore > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <BarChart3 size={14} style={{ color: sc.text }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: sc.text }}>
                    avg {avgScore}
                  </span>
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {renderHeader()}
      {error && (
        <div style={{ marginBottom: 16, fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}
      {loading ? (
        <div style={{ padding: "40px 0", fontSize: 14, color: "var(--text-secondary)" }}>Loading projects…</div>
      ) : sortedProjects.length === 0 ? (
        renderEmpty()
      ) : (
        renderGrid()
      )}

      {creating && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 40,
          }}
          onClick={() => setCreating(false)}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "#F4F2ED",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em" }}>New project</div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "rgba(0,0,0,0.5)",
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.7)", marginBottom: 16 }}>
              Give this project a clear name. You can update its Watch configuration and context later.
            </p>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "rgba(0,0,0,0.7)" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "rgba(0,0,0,0.7)" }}>
                  Description <span style={{ fontWeight: 400, color: "rgba(0,0,0,0.45)" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                style={{
                  width: "100%",
                  background: "var(--text-primary)",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: creating ? "wait" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {creating ? "Creating…" : "Create project"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
