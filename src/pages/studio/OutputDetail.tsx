import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, Share2, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

const SAMPLE_CONTENT = `The CEO who reads everything

Here's something I've noticed about the best leaders I know: they read. Not just industry reports. Not just their competitors' press releases. Everything.

The CEO who reads everything isn't just better informed. They're better at connecting dots that nobody else sees. When your inputs are narrow, your outputs are predictable. When your inputs are wide, you start making connections that feel like intuition but are actually just pattern recognition at scale.

I've watched this play out in boardrooms, product reviews, and strategy sessions. The person who read the novel, the philosophy paper, the sports psychology study — they're the one who reframes the problem.

It's not about being smart. It's about having more material to work with.

The habit is deceptively simple: read widely, consistently, without agenda. Let the connections form on their own. They always do.

What's the last book outside your field that changed how you think about your work?`;

const GATES = [
  { num:"01", name:"Strategy Gate", status:"pass", note:"Clear POV, strong positioning" },
  { num:"02", name:"Voice Gate", status:"pass", note:"Authentic, matches Voice DNA 94.7%" },
  { num:"03", name:"Accuracy Gate", status:"pass", note:"All claims verifiable" },
  { num:"04", name:"AI Tells Gate", status:"pass", note:"No synthetic patterns detected" },
  { num:"05", name:"Audience Gate", status:"pass", note:"Resonant for target profile" },
  { num:"06", name:"Platform Gate", status:"pass", note:"LinkedIn optimal length + format" },
  { num:"07", name:"Impact Gate", status:"pass", note:"Strong CTA, engagement hooks present" },
];

const OutputDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SAMPLE_CONTENT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding:"28px", maxWidth:900 }}>
      {/* Back */}
      <button onClick={() => navigate("/studio/outputs")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:13, fontFamily:"'Afacad Flux',sans-serif", marginBottom:24, padding:0 }}>
        <ArrowLeft size={14} /> Back to Library
      </button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>
        {/* Left — content */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>LinkedIn Post</span>
            <span className="pill pill-published">Published</span>
            <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>Mar 4, 2026</span>
          </div>

          <h1 style={{ fontSize:"clamp(22px,3vw,30px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px", marginBottom:24, fontFamily:"'Afacad Flux',sans-serif" }}>
            The CEO who reads everything
          </h1>

          {/* Content */}
          <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:8, padding:"24px", marginBottom:16, position:"relative" }}>
            <pre style={{ fontFamily:"'Afacad Flux',sans-serif", fontSize:15, lineHeight:1.75, color:"var(--text-primary)", whiteSpace:"pre-wrap", wordWrap:"break-word" }}>
              {SAMPLE_CONTENT}
            </pre>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={copy} className="btn-primary" style={{ display:"flex", alignItems:"center", gap:7, fontSize:10 }}>
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />} {copied ? "Copied!" : "Copy Text"}
            </button>
            <button className="btn-ghost" style={{ display:"flex", alignItems:"center", gap:7 }} title="Export coming in plumbing phase">
              <Download size={13} /> Export (coming soon)
            </button>
            <button className="btn-ghost" style={{ display:"flex", alignItems:"center", gap:7 }} title="LinkedIn post — published">
              <ExternalLink size={13} /> View on LinkedIn (soon)
            </button>
          </div>
        </div>

        {/* Right — score + gates */}
        <div>
          {/* Betterish */}
          <div className="card" style={{ padding:"20px", marginBottom:12 }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Betterish Score</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:12 }}>
              <span style={{ fontSize:40, fontWeight:800, color:"#F5C642", letterSpacing:"-2px", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>912</span>
              <span style={{ fontSize:14, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>/ 1000</span>
            </div>
            {[["Unique",228],["Compelling",241],["Sustainable",220],["Believable",223]].map(([label,val]) => (
              <div key={label as string} style={{ marginBottom:7 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{label as string}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{val as number}</span>
                </div>
                <div className="score-bar-track"><div className="score-bar-fill" style={{ width:`${((val as number)/250)*100}%`, background:"#F5C642" }} /></div>
              </div>
            ))}
          </div>

          {/* Gates */}
          <div className="card" style={{ padding:"16px" }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Quality Gates</p>
            {GATES.map(g => (
              <div key={g.num} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <CheckCircle size={12} style={{ color:"#188FA7", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{g.name}</p>
                  <p style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>{g.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:700px){.output-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};
export default OutputDetail;
