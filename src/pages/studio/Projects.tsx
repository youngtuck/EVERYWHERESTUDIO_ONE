import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, BarChart2, FileText, Plus } from "lucide-react";

const PROJECTS = [
  { id:1, name:"My Studio", desc:"General thought leadership content", outputs:10, lastActive:"Mar 7", score:881 },
  { id:2, name:"TEDx Content", desc:"TEDx Santa Barbara 2026 talk and surrounding content", outputs:4, lastActive:"Feb 15", score:921 },
  { id:3, name:"Book Project", desc:"Working title: The Orchestrated Life", outputs:2, lastActive:"Jan 12", score:0 },
];

const Projects = () => {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "var(--font)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--studio-gap-lg)" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Wrap</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em" }}>Projects</h1>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Plus size={13} /> New Project
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--studio-gap)" }}>
        {PROJECTS.map(p => (
          <div key={p.id} className="card" style={{ padding: "22px", cursor: "pointer" }}
            onClick={() => navigate(`/studio/projects/${p.id}`)}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--studio-radius)", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <FolderOpen size={16} style={{ color: "var(--fg-3)" }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", marginBottom: 5 }}>{p.name}</h3>
            <p style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 18 }}>{p.desc}</p>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={11} style={{ color: "var(--fg-3)" }} />
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{p.outputs} outputs</span>
              </div>
              {p.score > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <BarChart2 size={11} style={{ color: "var(--gold)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>avg {p.score}</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 12 }}>Last active {p.lastActive}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Projects;
