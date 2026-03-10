import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { useTheme } from "../../context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// WATSON ORB - minimal 2D system glyph
// thinking=false: calm, slow inner waveform.
// thinking=true:  slightly brighter, more active wave + glow.
// ─────────────────────────────────────────────────────────────────────────────

function WatsonOrb({ size, thinking }: { size: number; thinking?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const energyRef = useRef(0);
  const thinkingRef = useRef(!!thinking);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useMobile();

  useEffect(() => {
    thinkingRef.current = !!thinking;
  }, [thinking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = size / 2;
    const cx = r;
    const cy = r;

    const drawFrame = (ts: number) => {
      // Ease energy toward target based on thinking
      const target = thinkingRef.current ? 1 : 0;
      energyRef.current += (target - energyRef.current) * 0.06;
      const energy = energyRef.current;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);

      // Clip to circle
      ctx.beginPath();
      ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
      ctx.clip();

      // Background disc
      const bgGrad = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
      if (isDark) {
        bgGrad.addColorStop(0, "rgba(12,16,40,1)");
        bgGrad.addColorStop(1, "rgba(4,6,20,1)");
      } else {
        bgGrad.addColorStop(0, "rgba(246,246,244,1)");
        bgGrad.addColorStop(1, "rgba(225,225,220,1)");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-r, -r, size, size);

      // Subtle concentric ring
      ctx.beginPath();
      ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Waveform path (inside circle, horizontal)
      const waveHeight = r * (0.20 + energy * 0.10);
      const waveY = 0;
      const baseFreq = 2.2;
      const t = ts * 0.001 * (isMobile ? 0.5 : 1);

      ctx.beginPath();
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = (u - 0.5) * (r * 1.7);
        const env = Math.cos(u * Math.PI); // center emphasis
        const y =
          waveY +
          Math.sin(u * baseFreq * Math.PI * 2 + t * 1.2) * waveHeight * env * 0.8 +
          Math.sin(u * (baseFreq * 0.6) * Math.PI * 2 - t * 0.8) * waveHeight * env * 0.35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const waveGrad = ctx.createLinearGradient(-r, 0, r, 0);
      if (isDark) {
        waveGrad.addColorStop(0, "rgba(74,144,245,0.0)");
        waveGrad.addColorStop(0.25, "rgba(74,144,245,0.55)");
        waveGrad.addColorStop(0.5, "rgba(200,150,26,0.9)");
        waveGrad.addColorStop(0.75, "rgba(160,128,245,0.65)");
        waveGrad.addColorStop(1, "rgba(160,128,245,0.0)");
      } else {
        waveGrad.addColorStop(0, "rgba(74,144,245,0.15)");
        waveGrad.addColorStop(0.5, "rgba(200,150,26,0.6)");
        waveGrad.addColorStop(1, "rgba(160,128,245,0.15)");
      }
      ctx.strokeStyle = waveGrad;
      ctx.lineWidth = isMobile ? 1.1 : 1.4;
      ctx.lineCap = "round";
      ctx.stroke();

      // Small center dot
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(232,232,230,0.85)" : "rgba(12,12,10,0.9)";
      ctx.fill();

      ctx.restore();

      if (!isMobile) {
        rafRef.current = requestAnimationFrame(drawFrame);
      }
    };

    // Initial static frame
    drawFrame(performance.now());
    if (!isMobile) {
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, isDark, isMobile]);

  const glowSize = size * (thinking ? 1.5 : 1.3);
  const glowOpacity = thinking ? 0.5 : 0.28;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Soft outer glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: glowSize,
          height: glowSize,
          marginLeft: -glowSize / 2,
          marginTop: -glowSize / 2,
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle at 50% 35%, rgba(200,150,26,0.35), transparent 70%)"
            : "radial-gradient(circle at 50% 35%, rgba(200,150,26,0.25), transparent 70%)",
          opacity: glowOpacity,
          filter: "blur(16px)",
          pointerEvents: "none",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          transform: thinking ? "scale(1.02)" : "scale(1)",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          display: "block",
          borderRadius: "50%",
          position: "relative",
          zIndex: 1,
          boxShadow: isDark
            ? "0 14px 40px rgba(0,0,0,0.65)"
            : "0 10px 30px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO - WORK SESSION
// Inspired by the best: ChatGPT, Claude, Perplexity, Grok, Gemini.
// Clean. Simple. The model is the product.
// ─────────────────────────────────────────────────────────────────────────────

const OUTPUT_TYPES: Record<string, { label: string; color: string; watson: string }> = {
  linkedin_post:   { label: "LinkedIn Post",   color: "#4A90D9", watson: "What's the idea you want to put out there? Give me the raw thought and we'll find the right angle." },
  newsletter:      { label: "Newsletter",      color: "#50c8a0", watson: "What's the story this week? What happened, what did you observe, what shifted? Start wherever feels natural." },
  sunday_story:    { label: "Sunday Story",   color: "#F5C642", watson: "What's the story this week? The experience, the insight, the moment that's worth sharing. Start anywhere." },
  podcast_script:  { label: "Podcast Script",  color: "#F5C642", watson: "What's this episode about? Tell me the topic and who you're talking to, and we'll shape the conversation from there." },
  twitter_thread:  { label: "Twitter Thread",  color: "#a080f5", watson: "What's the thread about? Give me the core idea and the hook, and we'll break it into beats." },
  essay:           { label: "Essay",          color: "#4A90D9", watson: "What's the central argument you want to make? Give me the rough idea and I'll ask the questions that pull it into focus." },
  short_video:     { label: "Short Video",    color: "#e85d75", watson: "What's the video about? What's the one thing you want the viewer to walk away knowing or feeling?" },
  substack_note:   { label: "Substack Note",  color: "#50c8a0", watson: "What's the note? A take, a link, or a short reflection; tell me what's on your mind." },
  talk_outline:    { label: "Talk Outline",   color: "#F5A623", watson: "What's the talk for? Tell me the audience, the occasion, and the outcome you're driving toward." },
  email_campaign:  { label: "Email Campaign",  color: "#0D8C9E", watson: "What's the campaign goal? Who's it for, what's the sequence, and what's the one action you want them to take?" },
  blog_post:       { label: "Blog Post",      color: "#4A90D9", watson: "What's the post about? Give me the topic and the angle, and we'll structure it for the web." },
  executive_brief: { label: "Executive Brief", color: "#6b4dd4", watson: "What's the brief for? Audience, key points, and the decision or outcome you're supporting." },
};

const OUTPUT_TYPE_KEYS = [
  "linkedin_post", "newsletter", "sunday_story", "podcast_script", "twitter_thread", "essay",
  "short_video", "substack_note", "talk_outline", "email_campaign", "blog_post", "executive_brief",
] as const;

// Map frontend output type keys to API output types (Watson/generate)
const OUTPUT_TYPE_TO_API: Record<string, string> = {
  linkedin_post: "social", newsletter: "newsletter", sunday_story: "sunday_story",
  podcast_script: "podcast", twitter_thread: "social", essay: "essay",
  short_video: "video", substack_note: "newsletter", talk_outline: "presentation",
  email_campaign: "newsletter", blog_post: "essay", executive_brief: "freestyle",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  typing?: boolean;
}

// Auto-resize textarea
function AutoTextarea({
  value, onChange, onSubmit, placeholder, disabled, inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const refToUse = inputRef ?? localRef;

  useEffect(() => {
    const el = refToUse.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value, refToUse]);

  return (
    <textarea
      ref={refToUse}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (value.trim() && !disabled) onSubmit();
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      style={{
        width: "100%", resize: "none", border: "none", outline: "none",
        background: "transparent", fontFamily: "var(--font)", fontSize: 15,
        lineHeight: 1.6, color: "var(--fg)", padding: 0,
        maxHeight: 200, overflowY: "auto",
      }}
    />
  );
}

// Typing dots
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--fg-3)",
          animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// Message bubble
function MessageBubble({ msg, isMobile }: { msg: Message; isMobile: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 12, alignItems: "flex-end",
      maxWidth: "100%",
    }}>
      {/* Watson orb avatar */}
      {!isUser && (
        <div style={{ flexShrink: 0, marginBottom: 2 }}>
          <WatsonOrb size={36} />
        </div>
      )}

      <div style={{
        maxWidth: isMobile ? "95%" : isUser ? "78%" : "85%",
        background: isUser ? "var(--fg)" : "var(--surface)",
        border: isUser ? "none" : "1px solid var(--line)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        padding: isUser ? "11px 16px" : "14px 18px",
        boxShadow: isUser ? "none" : "var(--shadow-xs)",
      }}>
        {msg.typing ? (
          <TypingIndicator />
        ) : (
          <p style={{
            fontSize: 15, lineHeight: 1.65,
            color: isUser ? "var(--bg)" : "var(--fg)",
            fontWeight: isUser ? 400 : 300,
            margin: 0, whiteSpace: "pre-wrap",
          }}>{msg.content}</p>
        )}
      </div>
    </div>
  );
}

// Empty state - shown when no messages (or only Watson opening)
function EmptyState({ outputType, onSuggestion, isMobile }: { outputType: string; onSuggestion: (s: string) => void; isMobile: boolean }) {
  const type = OUTPUT_TYPES[outputType] || OUTPUT_TYPES.essay;
  const suggestions: Record<string, string[]> = {
    linkedin_post:   ["I want to write about the future of remote work", "Why most advice about delegation is wrong", "What I learned from 500 conversations"],
    newsletter:      ["This week I had a revelation about how I was wasting mornings", "I want to share what happened at our team offsite", "Thoughts on a book I just finished"],
    sunday_story:    ["This week was about a conversation I almost avoided", "Story about a failure that turned into a framework", "Reflection on year three of running my business"],
    podcast_script:  ["Solo episode on what I learned from a bad hire", "Interview prep for a conversation about AI and creativity", "Topic breakdown for my next 3 episodes"],
    twitter_thread:  ["Thread on my creative process", "Why execution beats ideas", "The one thing most consultants miss"],
    essay:           ["I want to write about the future of remote work", "Help me make the case for slow thinking in a fast world", "I have a contrarian take on productivity culture"],
    short_video:     ["60-second take on why execution beats ideas", "Explainer video on my consulting framework", "Behind-the-scenes look at how I actually work"],
    substack_note:   ["A take on the latest AI news", "Link to a piece that changed my mind", "Short reflection on this week"],
    talk_outline:    ["Keynote for a leadership summit, 45 minutes", "Sales deck for a new service offering", "Team strategy presentation for Q2"],
    email_campaign:  ["Launch sequence for a new product", "Re-engagement series for dormant subscribers", "Nurture sequence for leads"],
    blog_post:       ["How we built our content system", "Lessons from 10 years of thought leadership", "Why most thought leaders sound the same"],
    executive_brief: ["Board update on Q2 strategy", "Investment memo for a new initiative", "Summary for the leadership team"],
  };
  const typeSuggestions = suggestions[outputType] || suggestions.essay;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 40px", gap: 32, textAlign: "center",
    }}>
      {/* Watson orb - live WebGL, reactive */}
      <WatsonOrb size={160} />

      <div style={{ maxWidth: 460 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, letterSpacing: "-0.02em", fontFamily: "'DM Sans', sans-serif" }}>
          {type.watson.split("?")[0] + "?"}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", lineHeight: 1.6, fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
          Start with a rough idea. Watson will ask the questions that shape it into a {type.label.toLowerCase()}.
        </p>
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: isMobile ? "100%" : 480 }}>
        {typeSuggestions.map((s, i) => (
          <button key={i} onClick={() => onSuggestion(s)} style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 10, padding: "12px 16px", cursor: "pointer",
            textAlign: "left", fontFamily: "var(--font)", fontSize: 13,
            color: "var(--fg-2)", lineHeight: 1.5, fontWeight: 300,
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

function WatsonThinking() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ flexShrink: 0 }}>
        <WatsonOrb size={28} thinking />
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        padding: "8px 14px",
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--fg-3)",
          letterSpacing: "0.01em",
        }}>Watson is thinking</span>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--fg-3)",
              animation: `watsonDot 1.4s ${i * 0.16}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Output type selector pill - dropdown with all 12 types
function OutputTypePill({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const type = OUTPUT_TYPES[value] || OUTPUT_TYPES.essay;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      const ch = e.key.toLowerCase();
      if (!/[a-z]/.test(ch)) return;
      // Avoid stealing focus from form fields
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.getAttribute("contenteditable") === "true")) {
        return;
      }
      const match = OUTPUT_TYPE_KEYS.find(k => OUTPUT_TYPES[k].label.charAt(0).toLowerCase() === ch);
      if (match) {
        e.preventDefault();
        onChange(match);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onChange]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--bg-2)", border: "1px solid var(--line)",
        borderRadius: 20, padding: "5px 12px 5px 10px",
        cursor: "pointer", fontFamily: "var(--font)",
        transition: "all .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line-2)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: type.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-2)" }}>{type.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: .45, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 12, padding: 6, minWidth: 220, maxHeight: 320, overflowY: "auto",
          boxShadow: "var(--shadow-md)", zIndex: 50,
        }}>
          {OUTPUT_TYPE_KEYS.map(t => {
            const ot = OUTPUT_TYPES[t];
            const active = t === value;
            const shortcut = ot.label.charAt(0).toUpperCase();
            return (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                background: active ? "var(--bg-2)" : "transparent",
                border: "none", borderRadius: 8, padding: "8px 10px",
                cursor: "pointer", fontFamily: "var(--font)",
                transition: "background .12s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ot.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: active ? "var(--fg)" : "var(--fg-2)", fontWeight: active ? 500 : 400 }}>{ot.label}</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--fg-3)",
                      background: "var(--bg-3)",
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontFamily: "monospace",
                    }}
                  >
                    {shortcut}
                  </span>
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke={ot.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Work Session ─────────────────────────────────────────────────────────
type Phase = "input" | "generating" | "complete";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const IS_DEV = import.meta.env.DEV;

const FETCH_TIMEOUT_MS = 90000;  // 90s for chat/generate
const FRONTEND_RETRIES = 2;      // retry 404/502/503/504/429
const RETRY_BACKOFF_MS = 800;

function friendlyMessage(status: number, bodyError?: string): string {
  // Production: never show developer instructions. Keep it short and actionable for end users.
  if (!IS_DEV) {
    if (status === 404 || status === 502 || status === 503 || status === 504)
      return "We're having trouble connecting. Please try again in a moment.";
    if (status === 401)
      return "Something went wrong on our end. Please try again later.";
    if (status === 429)
      return "We're a bit busy. Please wait a moment and try again.";
    if (status >= 500)
      return "We hit a snag. Please try again in a moment.";
    if (bodyError && !bodyError.includes("npm") && !bodyError.includes("backend"))
      return bodyError.length > 100 ? bodyError.slice(0, 100) + "…" : bodyError;
    return "Something went wrong. Please try again.";
  }
  // Development: helpful for you while building
  if (status === 404)
    return "Connection issue. Make sure the backend is running (npm run server or npm run dev:all).";
  if (status === 401)
    return "API key issue. Check SETUP.md and your .env file.";
  if (status === 429)
    return "Too many requests. Please wait a moment and try again.";
  if (status >= 500)
    return "Temporary glitch on our side. Try again in a moment.";
  if (bodyError)
    return bodyError.length > 120 ? bodyError.slice(0, 120) + "…" : bodyError;
  return "Something went wrong. Try again.";
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(to));
}

async function requestWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  let lastRes: Response | null = null;
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= FRONTEND_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      lastRes = res;
      const retryable = res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429;
      const data = res.ok ? null : await res.json().catch(() => ({}));
      const canRetry = retryable && attempt < FRONTEND_RETRIES && (data?.retryable !== false);
      if (res.ok) return res;
      if (!canRetry) throw new Error(friendlyMessage(res.status, data?.error));
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS * (attempt + 1)));
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (lastErr.name === "AbortError")
        throw new Error(IS_DEV ? "Request took too long. Try again." : "That took too long. Please try again.");
      if (attempt >= FRONTEND_RETRIES) throw lastErr;
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS * (attempt + 1)));
    }
  }
  if (lastRes && !lastRes.ok) {
    const data = await lastRes.json().catch(() => ({}));
    throw new Error(friendlyMessage(lastRes.status, data?.error));
  }
  throw lastErr || new Error("Something went wrong. Try again.");
}

async function chatWithWatson(
  messages: { role: string; content: string }[],
  outputTypeApi: string,
  voiceProfile: object | null
): Promise<{ reply: string; readyToGenerate: boolean }> {
  const url = `${API_BASE}/api/chat`;
  const res = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "watson" : "user",
          content: m.content,
        })),
        outputType: outputTypeApi,
        voiceProfile,
      }),
    },
    FETCH_TIMEOUT_MS
  );
  return res.json();
}

async function generateOutput(conversationSummary: string, outputTypeApi: string, voiceProfile: object | null): Promise<{ content: string; score: number; gates?: unknown }> {
  const url = `${API_BASE}/api/generate`;
  const res = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationSummary, outputType: outputTypeApi, voiceProfile }),
    },
    FETCH_TIMEOUT_MS
  );
  return res.json();
}

export default function WorkSession() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useMobile();
  const { theme } = useTheme();
  const [outputType, setOutputType] = useState(searchParams.get("type") || "essay");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionTitle, setSessionTitle] = useState("New Session");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedScore, setGeneratedScore] = useState(0);
  const [generatedOutputId, setGeneratedOutputId] = useState<string>("new");
  const [voiceProfile, setVoiceProfile] = useState<object | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const type = OUTPUT_TYPES[outputType] || OUTPUT_TYPES.essay;
  const outputTypeApi = OUTPUT_TYPE_TO_API[outputType] || "freestyle";
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("voice_profile")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setVoiceProfile(data?.voice_profile || null));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (id === "new" || !id) {
      setMessages([{
        id: "w0",
        role: "assistant",
        content: type.watson,
        ts: Date.now(),
      }]);
      setSessionTitle("New Session");
    }
  }, [id, outputType, type.watson]);

  useEffect(() => {
    const userMessages = messages.filter(m => m.role === "user").length;
    setIsReady(userMessages >= 3);
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setApiError(null);
    setTimeout(() => inputRef.current?.focus(), 0);

    if (messages.filter(m => m.role === "user").length === 0) {
      setSessionTitle(userMsg.slice(0, 40) + (userMsg.length > 40 ? "..." : ""));
    }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userMsg, ts: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    const chatHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

    try {
      const { reply, readyToGenerate } = await chatWithWatson(chatHistory, outputTypeApi, voiceProfile);
      setMessages(prev => [...prev, {
        id: "w-" + Date.now(),
        role: "assistant",
        content: reply,
        ts: Date.now(),
      }]);
      if (readyToGenerate) {
        // Optional: could auto-show "Make the thing" or auto-trigger generate
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeTheThing = async () => {
    setApiError(null);
    setPhase("generating");
    const conversationSummary = messages
      .map(m => (m.role === "user" ? "User: " : "Watson: ") + m.content)
      .join("\n\n");

    try {
      const { content, score, gates } = await generateOutput(conversationSummary, outputTypeApi, voiceProfile);
      setGeneratedContent(content);
      setGeneratedScore(score);

      // Save to Supabase
      const title = sessionTitle !== "New Session" ? sessionTitle : `${type.label} - ${new Date().toLocaleDateString()}`;

      const { data: savedOutput, error: saveError } = await supabase
        .from("outputs")
        .insert({
          user_id: user!.id,
          title,
          content,
          output_type: outputType,
          score,
          conversation_summary: conversationSummary,
          gates,
        })
        .select()
        .single();

      if (saveError) {
        // Save failed; output not persisted (user can retry or copy content)
      }

      const outputId = savedOutput?.id ?? "new";
      setGeneratedOutputId(outputId);

      setPhase("complete");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Generation failed.");
      setPhase("input");
    }
  };

  const startOver = () => {
    setPhase("input");
    setGeneratedContent("");
    setGeneratedScore(0);
    setApiError(null);
    setMessages([{
      id: "w0",
      role: "assistant",
      content: type.watson,
      ts: Date.now(),
    }]);
    setInput("");
    setSessionTitle("New Session");
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "var(--bg)", overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes orbAtmos {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1.0; transform: scale(1.08); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        @keyframes watsonDot {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40%          { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes watsonPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(100,120,255,0.3); }
          50%      { box-shadow: 0 0 20px rgba(100,120,255,0.6), 0 0 40px rgba(80,60,200,0.2); }
        }
        @keyframes makeThingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,150,26,0); }
          50%      { box-shadow: 0 0 0 6px rgba(200,150,26,0.2); }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid var(--line)",
        background: "var(--topbar)", backdropFilter: "blur(12px)",
        flexShrink: 0, overflow: "visible", position: "relative", zIndex: 50,
      }}>
        {/* Left: back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/studio/dashboard")} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "5px 6px", borderRadius: 6, color: "var(--fg-3)",
            display: "flex", alignItems: "center", transition: "color .15s",
          }}
            title="Back to Dashboard"
            onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--fg-3)"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", letterSpacing: "-.01em", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: isMobile ? "none" : "inline-block" }}>
            {sessionTitle}
          </span>
        </div>

        {/* Center: output type selector */}
        <OutputTypePill value={outputType} onChange={setOutputType} />

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={{
            background: "none", border: "1px solid var(--line)",
            borderRadius: 7, padding: "5px 12px", cursor: "pointer",
            fontSize: 12, fontWeight: 500, color: "var(--fg-2)",
            fontFamily: "var(--font)", transition: "all .15s",
          }}
            title="View outputs"
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
            onClick={() => navigate("/studio/outputs")}
          >Outputs</button>

          <button style={{
            background: "var(--fg)", border: "none",
            borderRadius: 7, padding: "5px 12px", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "var(--bg)",
            fontFamily: "var(--font)", transition: "opacity .15s",
          }}
            title="Start new session"
            onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            onClick={() => navigate("/studio/work/new?type=" + outputType)}
          >New Session</button>
        </div>
      </div>

      {/* ── Messages area ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "0 0 8px",
        display: "flex", flexDirection: "column",
      }}>
        {phase === "generating" && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 24, padding: 40,
          }}>
            <div style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
              <WatsonOrb size={180} thinking />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-2)", letterSpacing: "-0.01em" }}>
              Watson is working...
            </p>
          </div>
        )}

        {phase === "complete" && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
          }}>
            <div className="card" style={{
              maxWidth: 400, width: "100%", padding: "var(--studio-gap-lg)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "var(--studio-radius)",
                background: "var(--bg-2)", border: "1px solid var(--line)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)",
              }}>
                <FileText size={28} strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.02em", fontFamily: "'DM Sans', sans-serif" }}>
                Your {type.label} is ready
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: "var(--bg-3)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(100, generatedScore / 10)}%`, background: generatedScore >= 800 ? "#10b981" : generatedScore >= 700 ? "#3A7BD5" : "#C8961A" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: generatedScore >= 800 ? "#10b981" : generatedScore >= 700 ? "#3A7BD5" : "#C8961A", fontVariantNumeric: "tabular-nums" }}>{generatedScore}</span>
              </div>
              <div style={{ display: "flex", gap: 10, width: "100%", flexDirection: "column" }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                  onClick={() => navigate(`/studio/outputs/${generatedOutputId}`)}
                >
                  View Output
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: "100%", padding: "12px" }}
                  onClick={startOver}
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "input" && (messages.length <= 1 ? (
          <EmptyState
            outputType={outputType}
            onSuggestion={(s) => {
              setInput(s);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            isMobile={isMobile}
          />
        ) : (
          <div style={{
            maxWidth: 760, width: "100%", margin: "0 auto",
            padding: "32px 24px 8px", display: "flex", flexDirection: "column", gap: 20,
          }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isMobile={isMobile} />
            ))}
            {loading && <WatsonThinking />}
            <div ref={bottomRef} />
          </div>
        ))}
      </div>

      {/* ── Input bar (only when phase is input) ────────────────────────────── */}
      {phase === "input" && (
      <div style={{
        flexShrink: 0, padding: isMobile ? "8px 12px 16px" : "12px 24px 20px",
        background: "var(--bg)",
        borderTop: messages.length > 1 ? "1px solid var(--line)" : "none",
      }}>
        <div style={{
          maxWidth: 760, margin: "0 auto",
          background: "var(--surface)",
          border: "1px solid var(--line-2)",
          borderRadius: 14,
          padding: "12px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          display: "flex", flexDirection: "column", gap: 10,
          transition: "border-color .2s, box-shadow .2s",
        }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(58,123,213,0.08)"; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line-2)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
        >
          {isReady && (
            <button
              type="button"
              onClick={handleMakeTheThing}
              disabled={loading}
              style={{
                width: "100%",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                border: "none",
                cursor: loading ? "default" : "pointer",
                background: theme === "light" ? "#996A00" : "#C8961A",
                color: "#0A0A0A",
                animation: "makeThingPulse 2.5s ease-in-out infinite",
              }}
            >
              <Sparkles size={15} />
              Make the thing
            </button>
          )}
          <AutoTextarea
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            placeholder={`Tell Watson about your ${type.label.toLowerCase()}...`}
            disabled={loading}
            inputRef={inputRef}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Left: hints or error + Retry when there's an error */}
            <span style={{ fontSize: 11, color: apiError ? "var(--error, #e85d75)" : "var(--fg-3)", letterSpacing: ".01em", display: "flex", alignItems: "center", gap: 8 }}>
              {apiError}
              {apiError && (
                <button
                  type="button"
                  onClick={() => { setApiError(null); }}
                  style={{
                    fontSize: 10, fontWeight: 600, color: "var(--fg)", background: "var(--bg-3)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Try again
                </button>
              )}
              {!apiError && "Enter to send · Shift+Enter for new line"}
            </span>
            {/* Right: Make the thing (when we have user messages) + send */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {messages.some(m => m.role === "user") && !isReady && (
                <button
                  type="button"
                  onClick={handleMakeTheThing}
                  disabled={loading}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  Make the thing
                </button>
              )}
              <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: input.trim() && !loading ? "var(--fg)" : "var(--bg-3)",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s", flexShrink: 0,
              }}
              title="Send message"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke={input.trim() && !loading ? "var(--bg)" : "var(--fg-3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--fg-3)", marginTop: 10, letterSpacing: ".01em" }}>
          Watson is your First Listener. Say anything. It will ask the right questions.
        </p>
      </div>
      )}
    </div>
  );
}
