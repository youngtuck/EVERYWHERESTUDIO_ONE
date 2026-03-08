import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, ExternalLink, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

const SAMPLE_CONTENT = `The CEO who reads everything

Here's something I've noticed about the best leaders I know: they read. Not just industry reports. Not just their competitors' press releases. Everything.

The CEO who reads everything isn't just better informed. They're better at connecting dots that nobody else sees. When your inputs are narrow, your outputs are predictable. When your inputs are wide, you start making connections that feel like intuition but are actually just pattern recognition at scale.

I've watched this play out in boardrooms, product reviews, and strategy sessions. The person who read the novel, the philosophy paper, the sports psychology study -- they're the one who reframes the problem.

It's not about being smart. It's about having more material to work with.

The habit is deceptively simple: read widely, consistently, without agenda. Let the connections form on their own. They always do.

What's the last book outside your field that changed how you think about your work?`;

const GATES = [
  { num:"01", name:"Strategy", note:"Clear POV, strong positioning" },
  { num:"02", name:"Voice", note:"Authentic, matches Voice DNA 94.7%" },
  { num:"03", name:"Accuracy", note:"All claims verifiable" },
  { num:"04", name:"AI Tells", note:"No synthetic patterns detected" },
  { num:"05", name:"Audience", note:"Resonant for target profile" },
  { num:"06", name:"Platform", note:"LinkedIn optimal length and format" },
  { num:"07", name:"Impact", note:"Strong CTA, engagement hooks present" },
];

const BETTERISH_DIMS = [
  ["Unique", 228], ["Compelling", 241], ["Sustainable", 220], ["Believable", 223],
] as const;

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function OutputDetail() {
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
    <div style={{ padding: "36px 40px", maxWidth: 1000, minHeight: "100vh", fontFamily: "var(--font)" }}>

      {/* Back */}
      <Reveal delay={0}>
        <button
          onClick={() => navigate("/studio/outputs")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 12, padding: 0, marginBottom: 36, letterSpacing: "0.01em" }}
        >
          <ArrowLeft size={13} />
          Output Library
        </button>
      </Reveal>

      {/* Meta row */}
      <Reveal delay={40}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)" }}>LinkedIn Post</p>
          <p style={{ fontSize: 11, color: "#10b981" }}>Published</p>
          <p style={{ fontSize: 11, color: "var(--fg-3)" }}>Mar 4, 2026</p>
        </div>
      </Reveal>

      {/* Title */}
      <Reveal delay={80}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--fg)", marginBottom: 36, lineHeight: 1.2 }}>
          The CEO who reads everything
        </h1>
      </Reveal>

      {/* Two column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 48, alignItems: "start" }}>

        {/* Content */}
        <Reveal delay={120}>
          <div>
            <pre style={{
              fontFamily: "var(--font)",
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--fg-2)",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}>
              {SAMPLE_CONTENT}
            </pre>

            {/* Actions — plain text links */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
              <button
                onClick={copy}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: copied ? "#10b981" : "var(--fg-3)", padding: 0, letterSpacing: "0.01em", transition: "color 0.2s" }}
              >
                {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy text"}
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--fg-3)", padding: 0, letterSpacing: "0.01em" }}>
                <Download size={13} />
                Export
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--fg-3)", padding: 0, letterSpacing: "0.01em" }}>
                <ExternalLink size={13} />
                View on LinkedIn
              </button>
            </div>
          </div>
        </Reveal>

        {/* Right sidebar */}
        <Reveal delay={160}>
          <div>
            {/* Betterish score */}
            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>Betterish Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
                <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.05em", color: "#C8961A", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>912</span>
                <span style={{ fontSize: 14, color: "var(--fg-3)" }}>/ 1000</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BETTERISH_DIMS.map(([label, val]) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <p style={{ fontSize: 11, color: "var(--fg-3)" }}>{label}</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{val}</p>
                    </div>
                    <div style={{ height: 2, background: "var(--bg-3)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(val / 250) * 100}%`, background: "#C8961A", transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Gates — numbered list, no cards */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>Quality Gates</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {GATES.map((g, i) => (
                  <div
                    key={g.num}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "24px 1fr",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: i < GATES.length - 1 ? "1px solid var(--line)" : "none",
                      alignItems: "start",
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.02em", paddingTop: 1 }}>{g.num}</p>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)", marginBottom: 2 }}>{g.name}</p>
                      <p style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.4 }}>{g.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
