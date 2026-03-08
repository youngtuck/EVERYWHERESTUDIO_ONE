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
    <div style={{ padding:"28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom:8 }}>Wrap</p>
          <h1 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", fontFamily:"'Afacad Flux',sans-serif" }}>Projects</h1>
        </div>
        <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap:7, fontSize:10 }}>
          <Plus size={13} /> New Project
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {PROJECTS.map(p => (
          <div key={p.id} className="card" style={{ padding:"22px", cursor:"pointer" }}
            onClick={() => navigate(`/studio/projects/${p.id}`)}
            onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-strong)")}
            onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
            <div style={{ width:36, height:36, borderRadius:8, background:"var(--bg-tertiary)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              <FolderOpen size={16} style={{ color:"var(--text-muted)" }} />
            </div>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:5, fontFamily:"'Afacad Flux',sans-serif" }}>{p.name}</h3>
            <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5, marginBottom:18, fontFamily:"'Afacad Flux',sans-serif" }}>{p.desc}</p>
            <div style={{ display:"flex", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <FileText size={11} style={{ color:"var(--text-muted)" }} />
                <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{p.outputs} outputs</span>
              </div>
              {p.score > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <BarChart2 size={11} style={{ color:"#F5C642" }} />
                  <span style={{ fontSize:12, fontWeight:700, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>avg {p.score}</span>
                </div>
              )}
            </div>
            <p style={{ fontSize:10, color:"var(--text-muted)", marginTop:12, fontFamily:"'Afacad Flux',sans-serif" }}>Last active {p.lastActive}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Projects;
