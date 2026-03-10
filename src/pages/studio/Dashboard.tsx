import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, Mic, Globe, Mail, FileText, Eye, ChevronRight, Plus, FolderOpen, Clock } from "lucide-react";
import { useMobile } from "../../hooks/useMobile";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// ── Time-based greeting ────────────────────────────────────────────────────
function titleCase(str: string) {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function getDateLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function calculateStreak(outputs: Array<{ created_at: string }>): number {
  if (!outputs.length) return 0;
  const days = new Set(outputs.map(o => new Date(o.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

// ── Score chip ─────────────────────────────────────────────────────────────
function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 900 ? "#10b981"
    : score >= 800 ? "#3A7BD5"
    : score >= 700 ? "#C8961A"
    : score >= 500 ? "#9ca3af"
    : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 32, height: 3, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${score / 10}%`, background: color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "-0.01em" }}>{score}</span>
    </div>
  );
}

// ── Fade-in card ───────────────────────────────────────────────────────────
function FadeCard({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(10px)",
      transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)`,
      ...style,
    }}>{children}</div>
  );
}

// ── Dashboard Wave: subtle cursor-reactive header band ─────────────────────
function DashboardWave({ isMobile }: { isMobile: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const mx = { current: 0.5 };
    const my = { current: 0.5 };
    const tx = { current: 0.5 };
    const ty = { current: 0.5 };
    const vx = { current: 0 };
    const vy = { current: 0 };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      height = 140;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      tx.current = e.clientX / window.innerWidth;
      ty.current = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const t = ts * 0.001;

      // Soft spring toward cursor
      vx.current += (tx.current - mx.current) * 0.04;
      vy.current += (ty.current - my.current) * 0.04;
      vx.current *= 0.86;
      vy.current *= 0.86;
      mx.current += vx.current;
      my.current += vy.current;

      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "rgba(7,10,26,1)");
      bg.addColorStop(0.5, "rgba(10,14,32,1)");
      bg.addColorStop(1, "rgba(4,8,24,1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const centerX = mx.current * width;
      const centerY = my.current * height;
      const lensR = width * 0.4;

      const lines = 40;
      const steps = 200;
      const spacing = height / (lines + 1);

      for (let li = 0; li < lines; li++) {
        const baseY = (li + 1) * spacing;
        const band = (li / (lines - 1)) - 0.5;
        const alpha = 0.08 + (1 - Math.abs(band * 1.4)) * 0.32;
        const weight = 0.5 + (1 - Math.abs(band)) * 0.7;

        ctx.beginPath();
        let started = false;

        for (let si = 0; si <= steps; si++) {
          const u = si / steps;
          const x = u * width;
          let y = baseY;

          const nx = u - 0.5;

          // Time-based waves
          const w1 = Math.sin(nx * 5.0 + t * 0.9 + li * 0.12) * 10;
          const w2 = Math.sin(nx * 11.0 - t * 1.3 + li * 0.18) * 3.6;

          // Cursor lens influence
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const falloff = Math.exp(-(dist * dist) / (lensR * lensR * 0.65));
          const push = falloff * (baseY - centerY) * 0.45;

          y += (w1 + w2) * (0.6 + Math.abs(band) * 0.4) + push;

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        const hue = 215 + band * 18;
        const sat = 70;
        const light = 45 + (1 - Math.abs(band)) * 15;
        ctx.strokeStyle = `hsla(${hue},${sat}%,${light}%,${alpha})`;
        ctx.lineWidth = weight;
        ctx.stroke();
      }

      // Subtle vignette
      const vg = ctx.createLinearGradient(0, 0, 0, height);
      vg.addColorStop(0, "rgba(0,0,0,0.35)");
      vg.addColorStop(0.3, "rgba(0,0,0,0.0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, width, height);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [isMobile]);

  return (
    <div
      style={{
        borderRadius: "var(--studio-radius-lg)",
        overflow: "hidden",
        background: "transparent",
        marginBottom: 18,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 140,
          display: isMobile ? "none" : "block",
        }}
      />
    </div>
  );
}

// ── Section label (caps, letter-spacing) ────────────────────────────────────
function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(0,0,0,0.3)", textTransform: "uppercase" }}>
        {children}
      </span>
      {action}
    </div>
  );
}

const QUICK_START = [
  { key: "essay", label: "Write an Essay", desc: "Long-form narrative", icon: PenLine, color: "#3A7BD5" },
  { key: "podcast", label: "Podcast Script", desc: "Episode from any topic", icon: Mic, color: "#C8961A" },
  { key: "social", label: "Social Package", desc: "Multi-platform posts", icon: Globe, color: "#a080f5" },
  { key: "newsletter", label: "Newsletter", desc: "Campaign-ready email", icon: Mail, color: "#0D8C9E" },
  { key: "freestyle", label: "Freestyle", desc: "Describe what you need", icon: FileText, color: "#10b981" },
];

export default function Dashboard() {
  const nav = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();

  const [recentOutputs, setRecentOutputs] = useState<Array<{
    id: string;
    title: string;
    output_type: string;
    score: number;
    created_at: string;
  }>>([]);
  const [outputsLoading, setOutputsLoading] = useState(true);
  const [totalOutputs, setTotalOutputs] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    if (!user) return;
    setOutputsLoading(true);
    supabase
      .from("outputs")
      .select("id, title, output_type, score, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentOutputs(data || []);
        setOutputsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("outputs")
      .select("id, score", { count: "exact" })
      .then(({ data, count }) => {
        setTotalOutputs(count || 0);
        if (data && data.length > 0) {
          const rows = data as { id: string; score: number }[];
          const avg = Math.round(
            rows.reduce((sum, o) => sum + (o.score || 0), 0) / rows.length
          );
          setAvgScore(avg);
        }
      });
  }, [user]);

  useEffect(() => {
    const el = document.querySelector(".studio-main-inner");
    if (el) {
      el.setAttribute("data-page", "dashboard");
      return () => el.removeAttribute("data-page");
    }
  }, []);

  const streak = calculateStreak(recentOutputs);
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const rawName =
    (meta?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : undefined) ||
    "";
  const firstName = titleCase(rawName.split(" ")[0] || "there");
  const subline =
    totalOutputs === 0
      ? "Your studio is ready. Create your first output below."
      : recentOutputs.length > 0 && recentOutputs[0]
      ? `Last output: "${recentOutputs[0].title.slice(0, 45)}${
          recentOutputs[0].title.length > 45 ? "…" : ""
        }" · ${relativeTime(recentOutputs[0].created_at)}`
      : `${totalOutputs} output${totalOutputs !== 1 ? "s" : ""} in your studio.`;

  const stats = [
    {
      label: "Outputs Created",
      value: totalOutputs.toString(),
      sub:
        totalOutputs === 0
          ? "Create your first"
          : `${recentOutputs.length} recent`,
      color: "#C8961A",
    },
    {
      label: "Avg Betterish",
      value: avgScore > 0 ? avgScore.toString() : "–",
      sub:
        avgScore >= 800
          ? "Ready to Publish"
          : avgScore > 0
            ? "Room to improve"
            : "No outputs yet",
      color: "#10b981",
    },
    {
      label: "Voice Fidelity",
      value: meta?.voice_profile ? "Active" : "–",
      sub: meta?.voice_profile
        ? "Voice DNA captured"
        : "Complete onboarding",
      color: "#3A7BD5",
    },
    {
      label: "Signals",
      value: "–",
      sub: "Coming soon",
      color: "#e85d75",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font)" }}>
      {/* Full-width hero banner: flush with content area top, edge-to-edge */}
      <FadeCard delay={0}>
        <div
          style={{
            marginTop: -32,
            marginLeft: -48,
            marginRight: -48,
            marginBottom: 32,
            width: "calc(100% + 96px)",
            maxWidth: "none",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #C8961A 0%, #d4a62e 40%, #C8961A 100%)",
            borderRadius: "0 0 12px 12px",
            padding: isMobile ? "24px 20px" : "40px 48px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 20 : 24,
          }}
        >
          {/* Subtle dark overlay at top for depth */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                fontWeight: 600,
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {getDateLabel()}
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: isMobile ? 26 : 32,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {getGreeting()}, {firstName}.
            </h1>
            {streak >= 2 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  marginBottom: 4,
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 100,
                  padding: "3px 10px",
                }}
              >
                <span>🔥 {streak} day streak</span>
              </div>
            )}
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {subline}
            </p>
          </div>
          <button
            onClick={() => nav("/studio/work")}
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#1a1a1a",
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 24px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontFamily: "var(--font)",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
              alignSelf: isMobile ? "stretch" : "center",
              justifyContent: "center",
              transition: "background 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.95)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            New Output
          </button>
        </div>
      </FadeCard>

      {/* Sentinel Briefing card */}
      <FadeCard delay={40}>
        <button
          onClick={() => nav("/studio/watch")}
          className="card"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            marginBottom: 32,
            cursor: "pointer",
            textAlign: "left",
            border: "1px solid var(--line)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
            el.style.borderColor = "rgba(0,0,0,0.1)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = "none";
            el.style.borderColor = "var(--line)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "var(--studio-radius)",
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Eye size={18} style={{ color: "var(--fg-2)" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>Sentinel Briefing</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Coming soon: intelligence monitoring</div>
            </div>
          </div>
          <ChevronRight
            size={18}
            style={{ color: "var(--fg-3)", transition: "transform 0.2s ease" }}
            className="sentinel-chevron"
          />
        </button>
      </FadeCard>

      {/* Quick Start */}
      <FadeCard delay={80}>
        <SectionLabel>Quick Start</SectionLabel>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}>
          {QUICK_START.map(({ key, label, desc, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => nav(`/studio/work/new?type=${key}`)}
              className="card"
              style={{
                padding: "18px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                textAlign: "center",
                border: "1px solid var(--line)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(0,0,0,0.12)";
                el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--line)";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "var(--studio-radius)",
                background: `${color}12`,
                border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.3 }}>{desc}</div>
            </button>
          ))}
        </div>
      </FadeCard>

      {/* Stats row */}
      <FadeCard delay={60}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}>
          {stats.map(({ label, value, sub, color }, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "16px 0",
                position: "relative",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease",
                background: "transparent",
                border: "none",
                minHeight: "auto",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: color, opacity: 0.7 }} />
              <div style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--fg)", lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </FadeCard>

      {/* Two-column: Projects + Recent Outputs (left) | Sentinel (right) */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Projects (reference: section + one card, "+ New") ───────────────── */}
          <FadeCard delay={140}>
            <SectionLabel
              action={
                <button
                  onClick={() => nav("/studio/projects")}
                  style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-2)"; }}
                >
                  + New
                </button>
              }
            >
              Projects
            </SectionLabel>
            <button
              onClick={() => nav("/studio/projects")}
              className="card"
              style={{
                padding: "18px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid var(--line)",
                background: "transparent",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--studio-radius)",
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FolderOpen size={18} style={{ color: "var(--fg-2)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>My Studio</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Your primary workspace</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--fg-3)" }}>
                <Clock size={12} />
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </button>
          </FadeCard>

          {/* Recent Outputs (reference: section label + empty state or list) ─── */}
          <FadeCard delay={180}>
            <SectionLabel
              action={
                <button
                  onClick={() => nav("/studio/outputs")}
                  style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-2)"; }}
                >
                  View all
                </button>
              }
            >
              Recent Outputs
            </SectionLabel>
            <div className="card" style={{ overflow: "hidden", minHeight: 200, background: "transparent", border: "none" }}>
              {outputsLoading ? (
                <div
                  style={{
                    padding: "48px 28px",
                    textAlign: "center",
                    color: "var(--fg-3)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "2px solid var(--fg-3)",
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Loading outputs…</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : recentOutputs.length > 0 ? (
                <div>
                  {recentOutputs.map((o, i) => {
                    const typeLabel = o.output_type.replace(/_/g, " ");
                    const prettyType =
                      typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
                    return (
                    <button
                      key={o.id}
                      onClick={() => nav(`/studio/outputs/${o.id}`)}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "13px 0",
                        borderBottom: i < recentOutputs.length - 1 ? "1px solid var(--line)" : "none",
                        background: "none", border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "var(--studio-radius)",
                        background: "var(--bg-2)", border: "1px solid var(--line)",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, color: "var(--fg-2)", letterSpacing: "0.04em",
                      }}>{prettyType.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{o.title}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
                          {prettyType} · {relativeTime(o.created_at)}
                        </div>
                      </div>
                      <ScoreChip score={o.score} />
                    </button>
                  );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: "48px 28px",
                  textAlign: "center",
                  color: "var(--fg-3)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  No outputs yet. Click <strong style={{ color: "var(--fg)" }}>New Output</strong> or use Quick Start above to create your first piece.
                </div>
              )}
            </div>
          </FadeCard>
        </div>

        {/* Right column: Sentinel (ours: live signals) ─────────────────────── */}
        <FadeCard delay={150}>
        <div className="card" style={{ overflow: "hidden", height: "fit-content", background: "transparent", border: "none" }}>
            <div style={{
              padding: "16px 18px",
              borderBottom: "1px solid var(--line)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em", marginBottom: 2 }}>Sentinel</h2>
                <div style={{ fontSize: 11, color: "var(--fg-3)" }}>Intelligence monitoring</div>
              </div>
            </div>
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
              Intelligence monitoring coming soon.
            </div>
            <div style={{ padding: "14px 18px", borderTop: "1px solid var(--line)" }}>
              <button onClick={() => nav("/studio/watch")} className="btn-ghost" style={{ width: "100%", fontSize: 12, padding: "9px" }}>
                View All Signals
              </button>
            </div>
          </div>
        </FadeCard>
      </div>
    </div>
  );
}
