import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Copy, ArrowLeft, Check } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";

interface Output {
  id: string;
  title: string;
  content: string;
  output_type: string;
  score: number;
  created_at: string;
}

export default function OutputDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || id === "new") { setLoading(false); setNotFound(true); return; }
    supabase
      .from("outputs")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setOutput(data);
        setLoading(false);
      });
  }, [id]);

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--gold, #C8961A)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <p style={{ color: "var(--fg-3)", marginBottom: 16 }}>Output not found.</p>
      <button className="btn-ghost" onClick={() => navigate("/studio/outputs")}>Back to Outputs</button>
    </div>
  );

  const scoreColor = output!.score >= 800 ? "#10b981" : output!.score >= 700 ? "#3A7BD5" : "#C8961A";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 32px", fontFamily: "var(--font)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={() => navigate("/studio/outputs")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: 0 }}>
          <ArrowLeft size={16} /> Outputs
        </button>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 8 }}>{output!.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--fg-3)" }}>
          <span style={{ textTransform: "capitalize" }}>{output!.output_type.replace("_", " ")}</span>
          <span>{new Date(output!.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span style={{ fontWeight: 700, color: scoreColor }}>Score: {output!.score}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <button onClick={copy} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", fontSize: 13 }}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Content</>}
        </button>
        <button onClick={() => navigate(`/studio/work/new?type=${output!.output_type}`)} className="btn-ghost" style={{ padding: "9px 20px", fontSize: 13 }}>
          New Session
        </button>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: isMobile ? "20px 16px" : "32px 36px" }}>
        <pre style={{ fontFamily: "var(--font)", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: "var(--fg)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
          {output!.content}
        </pre>
      </div>
    </div>
  );
}
