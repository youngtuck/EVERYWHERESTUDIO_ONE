import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { FileText, Sparkles, ArrowLeft, Mic, Check, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import { useTheme } from "../../context/ThemeContext";
import { getScoreColor } from "../../utils/scoreColor";
import { runFullPipeline } from "../../lib/agents/full-pipeline";
import type { GateResult, PipelineResult, PipelineStatus } from "../../lib/agents/types";
import { inferMode, SYSTEM_MODE_LABELS, type SystemMode } from "../../lib/agents/sara-router";
import { PipelineProgress } from "../../components/pipeline/PipelineProgress";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import WatsonOrb from "../../components/studio/WatsonOrb";

// ─────────────────────────────────────────────────────────────────────────────
// WATSON ORB MINI - minimal 2D system glyph (message bubble / thinking state)
// thinking=false: calm, slow inner waveform.
// thinking=true:  slightly brighter, more active wave + glow.
// ─────────────────────────────────────────────────────────────────────────────

function WatsonOrbMini({ size, thinking }: { size: number; thinking?: boolean }) {
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
  essay: {
    label: "Essay",
    color: "#4A90D9",
    watson: "What's on your mind? Give me the rough idea and I will ask the questions that pull it into focus.",
  },
  podcast: {
    label: "Podcast",
    color: "#F5C642",
    watson: "What is this episode about and who are you talking to? Start with the topic and the listener you have in mind.",
  },
  book: {
    label: "Book",
    color: "#A080F5",
    watson: "What is the book for and what change do you want it to create? Tell me the working title and the core promise.",
  },
  website: {
    label: "Website",
    color: "#0D8C9E",
    watson: "Which page are we shaping and who is landing on it first? Start with the offer and the moment they show up.",
  },
  video_script: {
    label: "Video Script",
    color: "#E8B4A0",
    watson: "What is the video about and where will it live? Give me the hook, the viewer, and the outcome you want.",
  },
  newsletter: {
    label: "Newsletter",
    color: "#50c8a0",
    watson: "What happened this week that is worth sharing? Start with the story, the shift, or the lesson.",
  },
  socials: {
    label: "Socials",
    color: "#4A90D9",
    watson: "What is the one idea you want to put into the feed? Tell me the take and where it should show up.",
  },
  business: {
    label: "Business",
    color: "#6b4dd4",
    watson: "What are you trying to win here: a client, a project, or a renewal? Give me the stakes, the buyer, and the shape of the proposal.",
  },
  freestyle: {
    label: "Freestyle",
    color: "#C8961A",
    watson: "What do you want to make that does not fit the grid? Describe it in your own words and we will build from there.",
  },
};

const OUTPUT_TYPE_KEYS = [
  "essay",
  "podcast",
  "book",
  "website",
  "video_script",
  "newsletter",
  "socials",
  "business",
  "freestyle",
] as const;

// Map frontend output type keys to API output types (Watson/generate)
const OUTPUT_TYPE_TO_API: Record<string, string> = {
  essay: "essay",
  podcast: "podcast",
  book: "essay",
  website: "freestyle",
  video_script: "video",
  newsletter: "newsletter",
  socials: "social",
  business: "freestyle",
  freestyle: "freestyle",
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
      {!isUser && (
        <div style={{ flexShrink: 0, marginBottom: 2 }}>
          <WatsonOrbMini size={28} />
        </div>
      )}

      <div style={{
        maxWidth: isMobile ? "95%" : isUser ? "85%" : "85%",
        background: isUser ? "var(--text-primary)" : "var(--surface-white)",
        border: isUser ? "none" : "1px solid var(--border-subtle)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "14px 18px",
        boxShadow: isUser ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        {msg.typing ? (
          <TypingIndicator />
        ) : (
          <p style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14, lineHeight: 1.6,
            color: isUser ? "#FFFFFF" : "var(--text-primary)",
            fontWeight: 400,
            margin: 0, whiteSpace: "pre-wrap",
          }}>{msg.content}</p>
        )}
      </div>
    </div>
  );
}

// Empty state - shown when no messages (or only Watson opening). Suggestion pills moved below input.
const EMPTY_PROMPTS: Record<string, string> = {
  essay: "What's on your mind?",
  podcast: "What is this episode about and who is listening?",
  book: "What is the book for and what change should it create?",
  website: "What offer are we shaping this page around?",
  video_script: "What is the video about and where will it live?",
  newsletter: "What story are you telling in this issue?",
  socials: "What is the take you want to put into the feed?",
  business: "What are you trying to win with this document?",
  freestyle: "What do you want to make that does not fit a format?",
};

const SUGGESTIONS_BY_TYPE: Record<string, string[]> = {
  essay: [
    "I want to write about the future of remote work.",
    "Help me make the case for slow thinking in a fast world.",
    "I have a contrarian take on how leaders should communicate.",
  ],
  podcast: [
    "Solo episode on a mistake I made and what it taught me.",
    "Conversation about where my industry is actually going.",
    "Three-part series to introduce my core framework.",
  ],
  book: [
    "Book that captures the philosophy behind my work.",
    "Short book I can hand to new clients as an onboarding guide.",
    "Field guide that turns my talks into a repeatable system.",
  ],
  website: [
    "Homepage that explains my offer in plain language.",
    "Services page that makes it clear who I am for.",
    "About page that tells the real story behind my work.",
  ],
  video_script: [
    "60-second video on the one thing my best clients have in common.",
    "Explainer video that walks through my framework.",
    "Behind-the-scenes video on how I actually work with clients.",
  ],
  newsletter: [
    "Story from this week that changed how I see my work.",
    "Roundup of three signals my audience should know about.",
    "Letter to my list about a shift in my offer.",
  ],
  socials: [
    "Take on a trend in my space that I disagree with.",
    "Short thread breaking down a framework I use.",
    "Quote and reaction to something my audience is already talking about.",
  ],
  business: [
    "Proposal for a new advisory engagement.",
    "Pitch deck for a workshop series.",
    "RFP response for a corporate client.",
  ],
  freestyle: [
    "I have a strange idea and I am not sure what format it belongs in.",
    "I want to rewrite something that already exists but make it mine.",
    "I want to experiment with a new way of explaining an old idea.",
  ],
};

// Reusable input card for both empty-state (inline) and sticky bar (when messages exist)
function SessionInputBox({
  input,
  setInput,
  sendMessage,
  loading,
  inputRef,
  isSupported,
  toggleListening,
  isListening,
  apiError,
  setApiError,
}: {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  loading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isSupported: boolean;
  toggleListening: () => void;
  isListening: boolean;
  apiError: string;
  setApiError: (v: string) => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        background: "var(--surface-white)",
        border: "1.5px solid var(--border-default)",
        borderRadius: 12,
        padding: "16px 20px",
        minHeight: 56,
        maxHeight: 200,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-dark)"; }}
      onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: isListening ? "2px solid #E53935" : "1px solid var(--border-subtle)",
              background: isListening ? "rgba(229, 57, 53, 0.08)" : "transparent",
              cursor: "pointer",
              color: isListening ? "#E53935" : "var(--text-tertiary)",
              transition: "all 0.2s ease",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <Mic size={18} strokeWidth={2} />
            {isListening && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#E53935",
                  animation: "voicePulse 1.5s ease-in-out infinite",
                }}
              />
            )}
          </button>
        )}
        <div style={{ flex: 1 }}>
          <AutoTextarea
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            placeholder="Tell Watson what's on your mind..."
            disabled={loading}
            inputRef={inputRef}
          />
        </div>
      </div>
      {isListening && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 2px",
            fontSize: 12,
            color: "#E53935",
            fontFamily: "'Afacad Flux', sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E53935",
              animation: "voicePulse 1.5s ease-in-out infinite",
            }}
          />
          Listening...
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, color: apiError ? "var(--danger)" : "var(--text-tertiary)", letterSpacing: ".01em", display: "flex", alignItems: "center", gap: 8 }}>
          {apiError}
          {apiError && (
            <button type="button" onClick={() => setApiError("")} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>Try again</button>
          )}
          {!apiError && "Enter to send · Shift+Enter for new line"}
        </span>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: input.trim() && !loading ? "var(--gold-dark)" : "rgba(0,0,0,0.06)",
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .15s",
            flexShrink: 0,
          }}
          title="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={input.trim() && !loading ? "#fff" : "var(--text-tertiary)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ children }: { outputType: string; onSuggestion: (s: string) => void; isMobile: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      height: "100%",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: "5vh",
    }}>
      <WatsonOrb size={80} />
      <h1 style={{
        fontSize: 42,
        fontWeight: 700,
        color: "#0D1B2A",
        fontFamily: "'Afacad Flux', sans-serif",
        letterSpacing: "-0.5px",
        textAlign: "center",
        marginTop: -20,
        marginBottom: 32,
      }}>
        What's on your mind?
      </h1>
      <div style={{ width: "100%", maxWidth: 640, padding: "0 32px" }}>
        {children}
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
        <WatsonOrbMini size={28} thinking />
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
        background: "var(--surface-white)", border: "1px solid var(--border-subtle)",
        borderRadius: 20, padding: "6px 16px",
        cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
        transition: "all .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-default)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--work-teal)", flexShrink: 0 }} />
        <span>{type.label}</span>
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
                      fontSize: 13,
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
  voiceProfile: object | null,
  voiceDnaMd: string,
  systemMode: SystemMode,
  userId: string | undefined
): Promise<{ reply: string; readyToGenerate: boolean }> {
  const url = `${API_BASE}/api/chat`;
  const body: Record<string, unknown> = {
    messages: messages.map((m) => ({
      role: m.role === "assistant" ? "watson" : "user",
      content: m.content,
    })),
    outputType: outputTypeApi,
    voiceProfile,
    systemMode,
    userId,
  };
  if (voiceDnaMd && voiceDnaMd.trim()) {
    body.voiceDnaMd = voiceDnaMd.trim();
  }
  const res = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    FETCH_TIMEOUT_MS
  );
  return res.json();
}

async function generateOutput(conversationSummary: string, outputTypeApi: string, voiceProfile: object | null, userId: string | undefined): Promise<{ content: string; score: number; gates?: unknown }> {
  const url = `${API_BASE}/api/generate`;
  const res = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationSummary, outputType: outputTypeApi, voiceProfile, userId }),
    },
    FETCH_TIMEOUT_MS
  );
  return res.json();
}

type GatesFromApi = {
  strategy?: number;
  voice?: number;
  accuracy?: number;
  ai_tells?: number;
  audience?: number;
  platform?: number;
  impact?: number;
  total?: number;
  summary?: string;
};

const CHECKPOINTS = [
  { number: 0, agent: "Echo", role: "Deduplication", key: null as string | null, description: "Checking for repeated ideas" },
  { number: 1, agent: "Priya", role: "Research Accuracy", key: "accuracy", description: "Verifying claims and sources" },
  { number: 2, agent: "Jordan", role: "Voice Authenticity", key: "voice", description: "Matching your voice DNA" },
  { number: 3, agent: "David", role: "Engagement", key: "audience", description: "7-second hook test" },
  { number: 4, agent: "Elena", role: "SLOP Detection", key: "ai_tells", description: "Zero AI tells, zero em-dashes" },
  { number: 5, agent: "Natasha", role: "Editorial Excellence", key: "strategy", description: "Publication-grade standard" },
  { number: 6, agent: "Marcus", role: "Perspective", key: "platform", description: "Platform and context fit" },
  { number: 7, agent: "Marshall", role: "Impact + NVC", key: "impact", description: "Final impact assessment" },
];

function checkpointScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: "#50c8a0", bg: "rgba(80,200,160,0.12)" };
  if (score >= 60) return { text: "#C8961A", bg: "rgba(200,150,26,0.12)" };
  return { text: "#E53935", bg: "rgba(229,57,53,0.12)" };
}

function totalScoreColor(total: number): string {
  if (total >= 900) return "#50c8a0";
  if (total >= 700) return "#C8961A";
  return "#E53935";
}

export default function WorkSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const { theme } = useTheme();
  const [outputType, setOutputType] = useState(searchParams.get("type") || "freestyle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionTitle, setSessionTitle] = useState("New Session");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedScore, setGeneratedScore] = useState(0);
  const [generatedOutputId, setGeneratedOutputId] = useState<string>("new");
  const [voiceProfile, setVoiceProfile] = useState<object | null>(null);
  const [voiceDnaMd, setVoiceDnaMd] = useState<string>("");
  const [brandDnaMd, setBrandDnaMd] = useState<string | undefined>(undefined);
  const [methodDnaMd, setMethodDnaMd] = useState<string | undefined>(undefined);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("IDLE");
  const [currentStage, setCurrentStage] = useState<string | undefined>(undefined);
  const [pipelineGateResults, setPipelineGateResults] = useState<GateResult[]>([]);
  const [blockedAt, setBlockedAt] = useState<string | undefined>(undefined);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const type = OUTPUT_TYPES[outputType] || OUTPUT_TYPES.essay;
  const outputTypeApi = OUTPUT_TYPE_TO_API[outputType] || "freestyle";
  const [isReady, setIsReady] = useState(false);
  const [currentSystemMode, setCurrentSystemMode] = useState<SystemMode>("CONTENT_PRODUCTION");
  const [generatedGates, setGeneratedGates] = useState<GatesFromApi | null>(null);
  const [showCheckpointSequence, setShowCheckpointSequence] = useState(false);
  const [visibleCheckpointCount, setVisibleCheckpointCount] = useState(0);
  const [revealedCheckpointCount, setRevealedCheckpointCount] = useState(0);

  const { isListening, isSupported, toggleListening, stopListening } = useVoiceInput((text) => {
    setInput((prev) => {
      const separator = prev && !prev.endsWith(" ") ? " " : "";
      return prev + separator + text;
    });
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("voice_profile, voice_dna_md, brand_dna_md, method_dna_md")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setVoiceProfile(data?.voice_profile || null);
        setVoiceDnaMd((data?.voice_dna_md as string) || "");
        setBrandDnaMd((data?.brand_dna_md as string | null) || undefined);
        setMethodDnaMd((data?.method_dna_md as string | null) || undefined);
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (id === "new" || !id) {
      setMessages([{
        id: "w0",
        role: "assistant",
        content: "What's on your mind? Tell me your idea and we'll figure out the best format together.",
        ts: Date.now(),
      }]);
      setSessionTitle("New Session");
    }
  }, [id]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const state = location.state as { ideaTitle?: string; ideaDescription?: string } | null;
    if (state?.ideaTitle) {
      setInput(state.ideaDescription ? `${state.ideaTitle}\n\n${state.ideaDescription}` : state.ideaTitle);
    }
  }, [location.state]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading]);

  useEffect(() => {
    if (!showCheckpointSequence || !generatedGates || visibleCheckpointCount >= 8) return;
    const t = setTimeout(() => setVisibleCheckpointCount((c) => c + 1), 300);
    return () => clearTimeout(t);
  }, [showCheckpointSequence, generatedGates, visibleCheckpointCount]);

  useEffect(() => {
    if (revealedCheckpointCount >= visibleCheckpointCount || visibleCheckpointCount === 0) return;
    const id = setTimeout(() => setRevealedCheckpointCount(visibleCheckpointCount), 400);
    return () => clearTimeout(id);
  }, [visibleCheckpointCount, revealedCheckpointCount]);

  const sendMessage = async (contentOverride?: string) => {
    const text = (contentOverride !== undefined ? contentOverride : input).trim();
    if (!text || loading) return;

    if (isListening) {
      stopListening();
    }
    if (contentOverride === undefined) setInput("");
    setApiError(null);
    if (contentOverride === undefined) setTimeout(() => inputRef.current?.focus(), 0);

    if (messages.filter(m => m.role === "user").length === 0) {
      setSessionTitle(text.slice(0, 40) + (text.length > 40 ? "..." : ""));
    }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsReady(false);
    setLoading(true);

    const inferredMode = inferMode(text);
    setCurrentSystemMode(inferredMode);

    const chatHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

    try {
      const { reply, readyToGenerate } = await chatWithWatson(chatHistory, outputTypeApi, voiceProfile, voiceDnaMd, inferredMode, user?.id);
      setMessages(prev => [...prev, {
        id: "w-" + Date.now(),
        role: "assistant",
        content: reply,
        ts: Date.now(),
      }]);
      if (readyToGenerate) {
        setIsReady(true);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Watch/Sentinel integration: auto-send prompt from search params
  const promptParamHandled = useRef(false);
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !promptParamHandled.current) {
      promptParamHandled.current = true;
      // Small delay to ensure Watson's opening message is set first
      setTimeout(() => sendMessage(promptParam), 300);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMakeTheThing = async () => {
    setApiError(null);
    setPhase("generating");
    const conversationSummary = messages
      .map(m => (m.role === "user" ? "User: " : "Watson: ") + m.content)
      .join("\n\n");

    try {
      const { content, score, gates } = await generateOutput(conversationSummary, outputTypeApi, voiceProfile, user?.id);
      setGeneratedContent(content);
      setGeneratedScore(score);
      const gatesData = (gates as GatesFromApi) ?? null;
      setGeneratedGates(gatesData);
      const hasGates = gatesData && typeof gatesData.total === "number";
      setShowCheckpointSequence(!!hasGates);
      setVisibleCheckpointCount(0);
      setRevealedCheckpointCount(0);

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
      if (savedOutput) toast("Output saved.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Generation failed.");
      setPhase("input");
    }
  };

  const handleRunPipeline = async () => {
    if (!user || !generatedOutputId || generatedOutputId === "new" || !generatedContent) return;
    setPipelineStatus("RUNNING");
    setCurrentStage("checkpoints");
    setPipelineGateResults([]);
    setBlockedAt(undefined);
    setPipelineResult(null);

    const context = {
      userId: user.id,
      outputId: generatedOutputId,
      outputType: outputType as any,
      voiceDnaMd,
      brandDnaMd,
      methodDnaMd,
      targetPlatform: undefined,
    };

    const result = await runFullPipeline(generatedContent, context, {
      onStageStart: (stage) => {
        setCurrentStage(stage);
      },
      onGateComplete: (gateResult, index) => {
        setPipelineGateResults((prev) => {
          const next = [...prev];
          next[index] = gateResult;
          return next;
        });
      },
      onStageComplete: () => {},
    });

    setPipelineResult(result);
    setPipelineStatus(result.status);
    setBlockedAt(result.blockedAt);

    await supabase.from("pipeline_runs").insert({
      output_id: generatedOutputId,
      user_id: user.id,
      status: result.status,
      original_draft: result.originalDraft,
      final_draft: result.finalDraft,
      gate_results: result.gateResults,
      betterish_score: result.betterishScore,
      betterish_total: result.betterishScore?.total ?? null,
      wrap_applied: result.wrapApplied,
      qa_result: result.qaResult,
      completeness_result: result.completenessResult,
      blocked_at: result.blockedAt ?? null,
      duration_ms: result.totalDurationMs,
    });

    if (result.status === "PASSED") {
      await supabase
        .from("outputs")
        .update({
          content: result.finalDraft,
          score: result.betterishScore?.total ?? generatedScore,
          content_state: "vault",
        })
        .eq("id", generatedOutputId);
      toast("Quality pipeline passed. Output moved to The Vault.");
    } else if (result.status === "BLOCKED") {
      await supabase
        .from("outputs")
        .update({
          content_state: "in_progress",
        })
        .eq("id", generatedOutputId);
      toast("Quality pipeline blocked. Review checkpoint feedback.");
    }
  };

  const startOver = () => {
    setPhase("input");
    setGeneratedContent("");
    setGeneratedScore(0);
    setGeneratedGates(null);
    setShowCheckpointSequence(false);
    setApiError(null);
    setIsReady(false);
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
      background: "var(--bg-light)",
      overflow: "hidden", fontFamily: "'Afacad Flux', sans-serif",
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Top bar (fixed 60px) ───────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(244, 242, 237, 0.85)", backdropFilter: "blur(12px)",
        flexShrink: 0, overflow: "visible",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/studio/dashboard")} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "5px 6px", borderRadius: 6, color: "var(--text-secondary)",
            display: "flex", alignItems: "center", transition: "color .15s",
          }}
            title="Back to Dashboard"
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, fontWeight: 400, color: "var(--text-tertiary)", display: isMobile ? "none" : "inline-block" }}>
            My Studio
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: 12, display: isMobile ? "none" : "inline-block" }}>/</span>
          <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-.01em", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: isMobile ? "none" : "inline-block" }}>
            {sessionTitle}
          </span>
        </div>

        {/* Center: spacer (output type pill moved to generate step) */}
        <span style={{ display: "inline-flex" }} />

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{
            background: "none", border: "none",
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, fontWeight: 500, color: "var(--gold-dark)",
            transition: "all .15s",
          }}
            title="View outputs"
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,150,26,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            onClick={() => navigate("/studio/outputs")}
          >Outputs</button>

          <button style={{
            background: "var(--text-primary)", border: "none",
            borderRadius: 8, padding: "10px 20px", cursor: "pointer",
            fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, color: "#fff",
            transition: "opacity .15s",
          }}
            title="Start new session"
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            onClick={() => navigate("/studio/work?type=" + outputType)}
          >New Session</button>
        </div>
      </div>

      {/* ── Empty state: no scroll, fits viewport exactly ───────────────── */}
      {phase === "input" && messages.length <= 1 ? (
        <div style={{
          height: "calc(100vh - 60px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <EmptyState
            outputType={outputType}
            onSuggestion={(s) => sendMessage(s)}
            isMobile={isMobile}
          >
            <SessionInputBox
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              loading={loading}
              inputRef={inputRef}
              isSupported={isSupported}
              toggleListening={toggleListening}
              isListening={isListening}
              apiError={apiError ?? ""}
              setApiError={setApiError}
            />
          </EmptyState>
        </div>
      ) : (
        <>
      {/* Session progress: Input → Watson → Generate → Output */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "8px 24px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--surface-white)",
        flexShrink: 0,
      }}>
        {[
          { key: "input", label: "Input", done: phase !== "input" || messages.some(m => m.role === "user"), active: phase === "input" },
          { key: "watson", label: "Watson", done: phase === "generating" || phase === "complete", active: phase === "input" && messages.some(m => m.role === "user") },
          { key: "generate", label: "Generate", done: phase === "complete", active: phase === "generating" },
          { key: "output", label: "Output", done: phase === "complete", active: phase === "complete" },
        ].map((step, i) => (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: step.done ? "var(--gold-dark)" : step.active ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "color .2s",
              }}
            >
              {step.label}
            </span>
            {i < 3 && (
              <span style={{ width: 20, height: 1, background: "var(--line)", opacity: step.done ? 0.6 : 0.3 }} />
            )}
          </div>
        ))}
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
              <WatsonOrbMini size={180} thinking />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-2)", letterSpacing: "-0.01em" }}>
              Watson is working...
            </p>
          </div>
        )}

        {phase === "complete" && showCheckpointSequence && generatedGates && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: 32,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                maxWidth: 520,
                width: "100%",
                background: "var(--surface-white)",
                borderRadius: 12,
                border: "1px solid var(--border-subtle)",
                fontFamily: "'Afacad Flux', sans-serif",
                overflow: "hidden",
              }}
            >
              {CHECKPOINTS.map((cp, index) => {
                const isVisible = index < visibleCheckpointCount;
                const isRevealed = index < revealedCheckpointCount;
                const score = cp.key ? (generatedGates[cp.key as keyof GatesFromApi] as number | undefined) : undefined;
                const isEcho = cp.key === null;
                if (!isVisible) return null;
                return (
                  <div
                    key={cp.number}
                    style={{
                      padding: "12px 16px",
                      borderBottom: index < 7 ? "1px solid var(--border-subtle)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "var(--bg-navy, #0f172a)",
                        color: "var(--gold-dark, #C8961A)",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {cp.number + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {cp.agent}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                        {cp.role}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                        {cp.description}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {isEcho ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#50c8a0", fontSize: 13, fontWeight: 600 }}>
                          <Check size={16} strokeWidth={2.5} />
                          Pass
                        </span>
                      ) : !isRevealed ? (
                        <Loader2 size={18} style={{ color: "var(--text-tertiary)", animation: "spin 0.8s linear infinite" }} />
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            color: score !== undefined ? checkpointScoreColor(score).text : "var(--text-tertiary)",
                            background: score !== undefined ? checkpointScoreColor(score).bg : "transparent",
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          {score !== undefined ? score : "–"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCheckpointCount >= 8 && (
              <div
                style={{
                  maxWidth: 520,
                  width: "100%",
                  marginTop: 24,
                  textAlign: "center",
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: totalScoreColor(generatedGates.total ?? generatedScore),
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.2,
                  }}
                >
                  {generatedGates.total ?? generatedScore}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "8px 0 0" }}>
                  Publication threshold: 900
                </p>
                {generatedScore >= 900 ? (
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#50c8a0", margin: "12px 0 0" }}>
                    Ready to publish
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "12px 0 0", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                    Below threshold. Revisions recommended.
                    {generatedGates.summary && ` ${generatedGates.summary}`}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: 14, borderRadius: 8 }}
                    onClick={() => setShowCheckpointSequence(false)}
                  >
                    View output
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      background: "transparent",
                    }}
                    onClick={() => {
                      setPhase("input");
                      setShowCheckpointSequence(false);
                    }}
                  >
                    Revise with Watson
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "complete" && !showCheckpointSequence && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: isMobile ? "24px 16px" : "32px 24px",
              overflowY: "auto",
            }}
          >
            {/* Generated content - front and center */}
            <div style={{ maxWidth: 680, width: "100%", marginBottom: 24 }}>
              <pre
                style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.25,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: isMobile ? "20px 16px" : "32px 36px",
                }}
              >
                {generatedContent}
              </pre>
            </div>

            {/* Score summary + action buttons */}
            <div style={{ maxWidth: 680, width: "100%", marginBottom: 24 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: getScoreColor(generatedScore).text,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {generatedScore}
                  </span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: generatedScore >= 900 ? "#50c8a0" : "var(--text-secondary)",
                  }}>
                    {generatedScore >= 900 ? "Ready to publish" : "Needs revision"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("input");
                      setShowCheckpointSequence(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                  >
                    Edit and refine
                  </button>
                  {generatedScore >= 900 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/studio/outputs/${generatedOutputId}`)}
                      style={{
                        background: "var(--gold-dark)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      Move to Wrap
                    </button>
                  )}
                  {generatedScore < 900 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/studio/outputs/${generatedOutputId}`)}
                      style={{
                        background: "var(--text-primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      View in Vault
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible scoring breakdown */}
              {generatedGates && (
                <details style={{
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  <summary style={{
                    padding: "14px 20px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontFamily: "'Afacad Flux', sans-serif",
                    userSelect: "none",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span>Scoring breakdown</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform 0.15s" }}>
                      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </summary>
                  <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {CHECKPOINTS.filter(cp => cp.key !== null).map((cp) => {
                      const score = cp.key ? (generatedGates[cp.key as keyof GatesFromApi] as number | undefined) : undefined;
                      return (
                        <div key={cp.number} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 140, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Afacad Flux', sans-serif" }}>
                            {cp.agent}
                          </span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${Math.max(0, Math.min(100, score ?? 0))}%`,
                              background: score !== undefined ? checkpointScoreColor(score).text : "rgba(0,0,0,0.1)",
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{
                            width: 36,
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            color: score !== undefined ? checkpointScoreColor(score).text : "var(--text-tertiary)",
                          }}>
                            {score ?? "–"}
                          </span>
                        </div>
                      );
                    })}
                    {generatedGates.summary && (
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, marginBottom: 0, lineHeight: 1.5, fontFamily: "'Afacad Flux', sans-serif" }}>
                        {generatedGates.summary}
                      </p>
                    )}
                  </div>
                </details>
              )}

              {/* Pipeline controls */}
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleRunPipeline}
                  disabled={pipelineStatus === "RUNNING" || !generatedOutputId || generatedOutputId === "new"}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid var(--border-subtle)",
                    background: pipelineStatus === "RUNNING" ? "rgba(0,0,0,0.02)" : "var(--surface-white)",
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: pipelineStatus === "RUNNING" ? "var(--text-tertiary)" : "var(--text-secondary)",
                    cursor: pipelineStatus === "RUNNING" ? "default" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {pipelineStatus === "RUNNING" ? "Running quality pipeline..." : "Run Quality Pipeline"}
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Start over
                </button>
              </div>

              {pipelineStatus !== "IDLE" && (
                <div style={{ marginTop: 12 }}>
                  <PipelineProgress
                    status={pipelineStatus}
                    currentStage={currentStage}
                    blockedAt={blockedAt}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {phase === "input" && (
          <div style={{
            maxWidth: 760, width: "100%", margin: "0 auto",
            padding: "32px 24px 8px", display: "flex", flexDirection: "column", gap: 20,
          }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isMobile={isMobile} />
            ))}
            {loading && <WatsonThinking />}
            {isReady && !loading && (
              <div style={{
                marginTop: 8,
                padding: "16px 20px",
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
                <div style={{
                  width: "100%",
                  height: 1,
                  background: "var(--border-subtle)",
                  marginBottom: 4,
                }} />
                <p style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}>
                  Watson is ready. Choose an output format and let's make the thing.
                </p>
                <div style={{ marginBottom: 4 }}>
                  <OutputTypePill value={outputType} onChange={setOutputType} />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleMakeTheThing}
                    disabled={loading}
                    style={{
                      background: "var(--gold-dark)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 20px",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: loading ? "default" : "pointer",
                    }}
                  >
                    Produce it
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReady(false)}
                    style={{
                      background: "transparent",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                      padding: "8px 20px",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Keep talking
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar (only when phase is input and there are messages) ───────── */}
      {phase === "input" && messages.length > 1 && (
      <div style={{
        flexShrink: 0,
        position: "sticky", bottom: 0,
        padding: isMobile ? "8px 12px 16px" : "16px 24px 24px",
        background: "linear-gradient(transparent, var(--bg-light) 20%)",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <SessionInputBox
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            loading={loading}
            inputRef={inputRef}
            isSupported={isSupported}
            toggleListening={toggleListening}
            isListening={isListening}
            apiError={apiError ?? ""}
            setApiError={setApiError}
          />
        </div>
      </div>
      )}
        </>
      )}
    </div>
  );
}
