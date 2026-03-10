import { useNavigate } from "react-router-dom";
import { Folder, FileText, BarChart3 } from "lucide-react";
import { getScoreColor } from "../../utils/scoreColor";
import "./shared.css";

const PROJECTS = [
  { id: "1", name: "My Studio", desc: "General thought leadership content", outputs: 10, lastActive: "Mar 7", score: 881 },
  { id: "2", name: "TEDx Content", desc: "TEDx Santa Barbara 2026 talk and surrounding content", outputs: 4, lastActive: "Feb 15", score: 921 },
  { id: "3", name: "Book Project", desc: "Working title: The Orchestrated Life", outputs: 2, lastActive: "Jan 12", score: 0 },
];

const transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

export default function Projects() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
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

      {PROJECTS.length === 0 ? (
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
            No projects yet
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
            Create a project to organize your content.
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
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="projects-grid"
        >
          {PROJECTS.map((p) => {
            const sc = getScoreColor(p.score > 0 ? p.score : null);
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
                  {p.desc}
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
                      {p.outputs} outputs
                    </span>
                  </span>
                  {p.score > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <BarChart3 size={14} style={{ color: sc.text }} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: sc.text }}>
                        avg {p.score}
                      </span>
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 8,
                    marginBottom: 0,
                  }}
                >
                  Last active {p.lastActive}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
