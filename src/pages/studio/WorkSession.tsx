import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { FileText, Sparkles, ArrowLeft, Mic, Check, Loader2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useMobile } from "../../hooks/useMobile";
import { useTheme } from "../../context/ThemeContext";
import { getScoreColor } from "../../utils/scoreColor";
import type { PipelineStatus } from "../../lib/agents/types";
import { inferMode, SYSTEM_MODE_LABELS, type SystemMode } from "../../lib/agents/sara-router";
import { PipelineProgress } from "../../components/pipeline/PipelineProgress";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import WatsonOrb from "../../components/studio/WatsonOrb";
import LoadingAnimation from "../../components/studio/LoadingAnimation";
import { MARKETING_NUMBERS } from "../../lib/constants";
import SpecialistPanel from "../../components/studio/SpecialistPanel";
import { saveSession, loadSession, clearSession } from "../../lib/sessionPersistence";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO - WORK SESSION
// Inspired by the best: ChatGPT, Claude, Perplexity, Grok, Gemini.
// Clean. Simple. The model is the product.
// ─────────────────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:var(--fg)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;color:var(--fg)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:26px;font-weight:700;margin:32px 0 16px;color:var(--fg)">$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--cornflower);padding-left:16px;margin:16px 0;color:var(--fg-2);font-style:italic">$1</blockquote>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px">')
    .replace(/\n/g, '<br/>');
}

const OUTPUT_TYPES: Record<string, { label: string; color: string; watson: string }> = {
  essay: {
    label: "Sunday Story (Essay)",
    color: "#4A90D9",
    watson: "What's on your mind? Give me the rough idea and I will ask the questions that pull it into focus.",
  },
  podcast: {
    label: "Get Current (Podcast)",
    color: "#F5C642",
    watson: "What is this episode about and who are you talking to? Start with the topic and the listener you have in mind.",
  },
  book: {
    label: "Book",
    color: "#A080F5",
    watson: "What is the book for and what change do you want it to create? Tell me the working title and the core promise.",
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
    label: "Signal Sweep (Socials)",
    color: "#4A90D9",
    watson: "What is the one idea you want to put into the feed? Tell me the take and where it should show up.",
  },
  presentation: {
    label: "Presentation",
    color: "#E8506A",
    watson: "What is the presentation for, who is in the room, and what decision should they make by the last slide?",
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
  "presentation",
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
  presentation: "presentation",
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

// Auto-resize textarea (premium chatbot style)
function AutoTextarea({
  value, onChange, onSubmit, placeholder, disabled, inputRef, className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  className?: string;
}) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const refToUse = inputRef ?? localRef;

  useEffect(() => {
    const el = refToUse.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value, refToUse]);

  return (
    <textarea
      ref={refToUse}
      className={className}
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
        width: "100%",
        resize: "none",
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: "'Afacad Flux', sans-serif",
        fontSize: 16,
        lineHeight: 1.5,
        color: "var(--fg)",
        padding: 0,
        minHeight: 24,
        maxHeight: 120,
        overflowY: "auto",
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
      maxWidth: "100%",
    }}>
      <div style={{
        maxWidth: isMobile ? "95%" : isUser ? "85%" : "85%",
        background: isUser ? "#0D1B2A" : "var(--surface-white)",
        border: isUser ? "none" : "1px solid var(--border-subtle)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "14px 18px",
        boxShadow: isUser ? "0 1px 4px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        {msg.typing ? (
          <TypingIndicator />
        ) : (
          <p style={{
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14, lineHeight: 1.6,
            color: isUser ? "#F0F0F0" : "var(--text-primary)",
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
  presentation: "What is the talk for and who is in the room?",
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
  presentation: [
    "Keynote for a leadership summit, 45 minutes.",
    "Sales deck for a new service offering.",
    "Internal strategy presentation for my team.",
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

// Premium chatbot-style input (Claude / ChatGPT / Gemini pattern)
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
  const [focusWithin, setFocusWithin] = useState(false);
  const hasText = !!input.trim();
  const sendEnabled = hasText && !loading;

  return (
    <div
      style={{
        maxWidth: 760,
        width: "100%",
        margin: "0 auto",
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 24,
        padding: "14px 20px",
        minHeight: 56,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        ...(focusWithin
          ? { borderColor: "#4A90D9", boxShadow: "0 2px 20px rgba(74,144,217,0.12)" }
          : {}),
      }}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        // Don't lose focus highlight when clicking buttons inside this container
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setFocusWithin(false);
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isSupported && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: isListening ? "rgba(229, 57, 53, 0.12)" : "rgba(0,0,0,0.04)",
              cursor: "pointer",
              color: isListening ? "#E53935" : "#64748B",
              transition: "background 0.15s ease",
              flexShrink: 0,
              position: "relative",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              if (!isListening) {
                e.currentTarget.style.background = "rgba(0,0,0,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isListening) {
                e.currentTarget.style.background = "rgba(0,0,0,0.04)";
              }
            }}
          >
            <Mic size={18} strokeWidth={2} />
            {isListening && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#E53935",
                  animation: "voicePulse 1.5s ease-in-out infinite",
                }}
              />
            )}
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <AutoTextarea
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            placeholder="Tell Watson what's on your mind..."
            disabled={loading}
            inputRef={inputRef}
            className="watson-input"
          />
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { if (sendEnabled) sendMessage(); }}
          disabled={!sendEnabled}
          title="Send message"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: sendEnabled ? "#0D1B2A" : "rgba(13, 27, 42, 0.3)",
            color: "white",
            cursor: sendEnabled ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease",
            flexShrink: 0,
            opacity: sendEnabled ? 1 : 0.3,
            position: "relative",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (sendEnabled) e.currentTarget.style.background = "#1B263B";
          }}
          onMouseLeave={(e) => {
            if (sendEnabled) e.currentTarget.style.background = "#0D1B2A";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {isListening && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            fontSize: 12,
            color: "#E53935",
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#E53935",
              animation: "voicePulse 1.5s ease-in-out infinite",
            }}
          />
          Listening...
        </div>
      )}
      {apiError && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 13,
              color: "var(--danger)",
            }}
          >
            {apiError}
          </span>
          <button
            type="button"
            onClick={() => setApiError("")}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--fg)",
              background: "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  children,
  isMobile,
}: {
  outputType: string;
  onSuggestion: (s: string) => void;
  isMobile: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "calc(100vh - 60px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <div style={{ width: isMobile ? 56 : 80, height: isMobile ? 56 : 80, overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -40, marginBottom: 12 }}>
        <WatsonOrb size={isMobile ? 56 : 80} />
      </div>
      <span style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "2px", textTransform: "uppercase", marginTop: 0, marginBottom: 4, fontFamily: "'Afacad Flux', sans-serif", fontWeight: 500 }}>Watson</span>
      <h1
        style={{
          fontSize: isMobile ? 28 : 42,
          fontWeight: 700,
          color: "var(--fg)",
          fontFamily: "'Afacad Flux', sans-serif",
          letterSpacing: "-0.5px",
          textAlign: "center",
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        What's on your mind?
      </h1>
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WatsonThinking() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "12px 0" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 20px",
        background: "var(--surface-white)",
        borderRadius: 20,
        border: "1px solid var(--border-subtle)",
      }}>
        {[
          { color: "#4A90D9", delay: "0s" },
          { color: "#F5C642", delay: "0.15s" },
          { color: "#4A90D9", delay: "0.3s" },
        ].map((dot, i) => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot.color,
            animation: `watsonPulse 1.4s ${dot.delay} ease-in-out infinite`,
          }} />
        ))}
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
  const [openDir, setOpenDir] = useState<"up" | "down">("down");
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
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 360 && rect.top > 360) {
      setOpenDir("up");
    } else {
      setOpenDir("down");
    }
  }, [open]);

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
          position: "absolute",
          ...(openDir === "down" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" }),
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 12, padding: 6, minWidth: 220, maxHeight: 320, overflowY: "auto",
          boxShadow: "var(--shadow-md)", zIndex: 50,
          animation: openDir === "down" ? "ddDown .15s ease-out" : "ddUp .15s ease-out",
        }}>
          {OUTPUT_TYPE_KEYS.map(t => {
            const ot = OUTPUT_TYPES[t];
            const active = t === value;
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
                <div style={{ marginLeft: "auto" }}>
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
  { number: 0, agent: "Echo", role: "Deduplication", key: null as string | null, description: "Scanning for repeated concepts and structural patterns" },
  { number: 1, agent: "Priya", role: "Research Accuracy", key: "accuracy", description: "Verifying claims against independent sources" },
  { number: 2, agent: "Jordan", role: "Voice Authenticity", key: "voice", description: "Matching output against your Voice DNA profile" },
  { number: 3, agent: "David", role: "Engagement", key: "audience", description: "Testing the hook - 7 seconds to earn attention" },
  { number: 4, agent: "Elena", role: "SLOP Detection", key: "ai_tells", description: "Zero AI tells, zero em dashes, zero filler" },
  { number: 5, agent: "Natasha", role: "Editorial Excellence", key: "strategy", description: "Publication-grade quality check" },
  { number: 6, agent: "Marcus", role: "Perspective", key: "platform", description: "Cultural sensitivity and platform fit" },
  { number: 7, agent: "Marshall", role: "Impact + NVC", key: "impact", description: "Final impact and communication assessment" },
];

function checkpointScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: "#50c8a0", bg: "rgba(80,200,160,0.12)" };
  if (score >= 60) return { text: "#C8961A", bg: "rgba(200,150,26,0.12)" };
  return { text: "#E53935", bg: "rgba(229,57,53,0.12)" };
}

function totalScoreColor(total: number): string {
  if (total >= 800) return "#50c8a0";
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
  const [pipelineGateResults, setPipelineGateResults] = useState<any[]>([]);
  const [blockedAt, setBlockedAt] = useState<string | undefined>(undefined);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
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
  const [showTotalScore, setShowTotalScore] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Writing your draft...");
  const loadingStartRef = useRef(Date.now());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionOutputId, setRevisionOutputId] = useState<string | null>(null);
  const [revisionContent, setRevisionContent] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  const { isListening, isSupported, toggleListening, stopListening } = useVoiceInput((text) => {
    setInput(text);
  });

  // Load projects for project selector
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name").eq("user_id", user.id).order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProjects(data);
          if (!activeProjectId) setActiveProjectId(data.find((p: any) => p.is_default)?.id || data[0].id);
        }
      });
  }, [user]);

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
      const persisted = loadSession();
      if (persisted && persisted.messages.length > 1) {
        setMessages(persisted.messages);
        setInput(persisted.input || "");
        setOutputType(persisted.outputType || "freestyle");
        setSessionTitle(persisted.sessionTitle || "New Session");
        setPhase(persisted.phase === "generating" ? "input" : persisted.phase);
        setGeneratedContent(persisted.generatedContent || "");
        setGeneratedScore(persisted.generatedScore || 0);
        setGeneratedOutputId(persisted.generatedOutputId || "new");
        setGeneratedGates(persisted.generatedGates || null);
        setIsReady(persisted.isReady || false);
        setTimeout(() => toast("Session restored"), 300);
        return;
      }
      setMessages([{
        id: "w0",
        role: "assistant",
        content: "What's on your mind? Tell me your idea and we'll figure out the best format together.",
        ts: Date.now(),
      }]);
      setSessionTitle("New Session");
    }
  }, [id]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Progressive loading animation during generation
  useEffect(() => {
    if (phase !== "generating") {
      if (loadingProgress > 0) setLoadingProgress(100);
      return;
    }
    loadingStartRef.current = Date.now();
    setLoadingProgress(0);
    setLoadingMessage("Writing your draft...");

    const interval = setInterval(() => {
      const elapsed = (Date.now() - loadingStartRef.current) / 1000;
      let progress: number;
      let message: string;

      if (elapsed < 12) {
        progress = (elapsed / 12) * 30;
        message = "Writing your draft...";
      } else if (elapsed < 25) {
        progress = 30 + ((elapsed - 12) / 13) * 25;
        message = "Applying your voice DNA...";
      } else if (elapsed < 40) {
        progress = 55 + ((elapsed - 25) / 15) * 20;
        message = "Running quality checkpoints...";
      } else if (elapsed < 55) {
        progress = 75 + ((elapsed - 40) / 15) * 15;
        message = "Almost there...";
      } else {
        progress = Math.min(95, 90 + (elapsed - 55) * 0.1);
        message = "Taking a bit longer than usual...";
      }

      setLoadingProgress(progress);
      setLoadingMessage(message);
    }, 200);

    return () => clearInterval(interval);
  }, [phase]);

  // Persist session state on changes (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (messages.length <= 1 && !input.trim() && phase === "input") return;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSession({
        messages: messages.filter(m => !m.typing),
        input,
        outputType,
        sessionTitle,
        phase,
        generatedContent,
        generatedScore,
        generatedOutputId,
        generatedGates,
        isReady,
        timestamp: Date.now(),
      });
    }, 500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [messages, input, outputType, sessionTitle, phase, generatedContent, generatedScore, generatedOutputId, generatedGates, isReady]);

  useEffect(() => {
    const state = location.state as {
      ideaTitle?: string;
      ideaDescription?: string;
      reviseOutputId?: string;
      reviseContent?: string;
      reviseTitle?: string;
      reviseType?: string;
      reviseScore?: number;
      watchTrigger?: {
        headline: string;
        summary: string;
        angle: string;
        prompt: string;
      };
    } | null;

    if (state?.watchTrigger) {
      const { headline, angle, prompt } = state.watchTrigger;
      setMessages([{
        id: "w0",
        role: "assistant",
        content: `I see you're interested in "${headline}". Here's an angle we could explore: ${angle}. Which direction feels right, or would you like to take it somewhere else?`,
        ts: Date.now(),
      }]);
      setInput(prompt);
      return;
    }

    if (state?.reviseOutputId) {
      setRevisionMode(true);
      setRevisionOutputId(state.reviseOutputId);
      setRevisionContent(state.reviseContent || null);
      setGeneratedOutputId(state.reviseOutputId);
      if (state.reviseType) setOutputType(state.reviseType);
      setSessionTitle(`Revising: ${state.reviseTitle || "Untitled"}`);
      const typeLabel = state.reviseType ? (OUTPUT_TYPES[state.reviseType]?.label || state.reviseType) : "content";
      setMessages([{
        id: "w0",
        role: "assistant",
        content: `I have your ${typeLabel} titled "${state.reviseTitle || "Untitled"}" (scored ${state.reviseScore ?? "unscored"}). What would you like to improve? I can help with voice, structure, hook, clarity, or anything specific.`,
        ts: Date.now(),
      }]);
      return;
    }

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
    const t = setTimeout(() => setVisibleCheckpointCount((c) => c + 1), 600);
    return () => clearTimeout(t);
  }, [showCheckpointSequence, generatedGates, visibleCheckpointCount]);

  useEffect(() => {
    if (revealedCheckpointCount >= visibleCheckpointCount || visibleCheckpointCount === 0) return;
    const id = setTimeout(() => setRevealedCheckpointCount(visibleCheckpointCount), 800);
    return () => clearTimeout(id);
  }, [visibleCheckpointCount, revealedCheckpointCount]);

  useEffect(() => {
    if (visibleCheckpointCount < 8 || revealedCheckpointCount < 8) {
      setShowTotalScore(false);
      return;
    }
    const t = setTimeout(() => setShowTotalScore(true), 800);
    return () => clearTimeout(t);
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

    let chatHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
    // In revision mode, prepend the original content as context
    if (revisionMode && revisionContent && chatHistory.length <= 3) {
      chatHistory = [
        { role: "user" as const, content: `[REVISION CONTEXT - Original content being revised:]\n\n${revisionContent.slice(0, 3000)}` },
        { role: "assistant" as const, content: "I've reviewed the original content. Let me know what you'd like to change." },
        ...chatHistory,
      ];
    }

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
  const generateLockRef = useRef(false);
  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !promptParamHandled.current) {
      promptParamHandled.current = true;
      // Small delay to ensure Watson's opening message is set first
      setTimeout(() => sendMessage(promptParam), 300);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMakeTheThing = async () => {
    if (generateLockRef.current) return;
    generateLockRef.current = true;
    setApiError(null);
    setPhase("generating");
    setPipelineStatus("IDLE");
    setPipelineGateResults([]);
    setBlockedAt(undefined);
    setPipelineResult(null);
    setShowCheckpointSequence(false);
    setShowTotalScore(false);

    const conversationSummary = messages
      .map(m => (m.role === "user" ? "User: " : "Watson: ") + m.content)
      .join("\n\n");

    try {
      // ── Pass 1: Generate draft ──────────────────────
      const { content, score, gates } = await generateOutput(conversationSummary, outputTypeApi, voiceProfile, user?.id);
      setGeneratedContent(content);
      setGeneratedScore(score);
      const gatesData = (gates as GatesFromApi) ?? null;
      setGeneratedGates(gatesData);

      // Save draft to Supabase
      const title = sessionTitle.startsWith("Revising:") ? sessionTitle.replace("Revising: ", "") : (sessionTitle !== "New Session" ? sessionTitle : `${type.label} - ${new Date().toLocaleDateString()}`);
      let outputId: string;

      if (revisionMode && revisionOutputId) {
        // Update existing output
        await supabase.from("outputs").update({
          content,
          score,
          gates,
          conversation_summary: conversationSummary,
          content_state: "in_progress",
        }).eq("id", revisionOutputId);
        outputId = revisionOutputId;
        toast("Revision saved. Running quality review...");
      } else {
        // Create new output
        const { data: savedOutput } = await supabase
          .from("outputs")
          .insert({
            user_id: user!.id,
            title,
            content,
            output_type: outputType,
            score,
            conversation_summary: conversationSummary,
            gates,
            content_state: "in_progress",
            project_id: activeProjectId || null,
          })
          .select()
          .single();
        outputId = savedOutput?.id ?? "new";
        toast("Draft generated. Running quality review...");
      }

      setGeneratedOutputId(outputId);

      // ── Pass 2: Run real pipeline via API ───────────────
      if (outputId !== "new" && user) {
        setPipelineStatus("RUNNING");
        setShowCheckpointSequence(true);
        setVisibleCheckpointCount(0);
        setRevealedCheckpointCount(0);

        try {
          const pipelineRes = await requestWithRetry(
            `${API_BASE}/api/run-pipeline`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                draft: content,
                outputType: outputTypeApi,
                voiceDnaMd,
                brandDnaMd,
                methodDnaMd,
                userId: user.id,
                outputId,
              }),
            },
            120000 // pipeline takes longer
          );

          if (!pipelineRes.ok) throw new Error("Pipeline API failed");
          const result = await pipelineRes.json();

          // Populate gate results for the SpecialistPanel
          const gateResultsArr = (result.gateResults || []).map((g: any) => ({
            gate: g.gate,
            status: g.status,
            score: g.score,
            feedback: g.feedback,
            issues: g.issues,
          }));
          setPipelineGateResults(gateResultsArr);
          setPipelineStatus(result.status);
          setBlockedAt(result.blockedAt);

          // Save pipeline run to Supabase
          await supabase.from("pipeline_runs").insert({
            output_id: outputId,
            user_id: user.id,
            status: result.status,
            gate_results: result.gateResults,
            betterish_score: result.betterishScore,
            betterish_total: result.betterishScore?.total ?? null,
            blocked_at: result.blockedAt ?? null,
            duration_ms: result.totalDurationMs,
          });

          // Update output with pipeline results
          const finalScore = result.betterishScore?.total ?? score;
          const finalContent = result.finalDraft || content;
          setGeneratedContent(finalContent);
          setGeneratedScore(finalScore);

        await supabase.from("outputs").update({
          content: finalContent,
          score: finalScore,
          content_state: result.status === "PASSED" ? "vault" : "in_progress",
        }).eq("id", outputId);

        if (result.status === "PASSED") {
          toast("Quality pipeline passed. Output moved to The Vault.");
          // Insert notification for published output
          if (user) {
            supabase.from("notifications").insert({
              user_id: user.id,
              type: "output_published",
              title: `Your ${type.label} scored ${finalScore}`,
              body: "Ready to publish. View it in The Vault.",
              read: false,
              link: `/studio/outputs/${outputId}`,
            });
          }
        } else if (result.status === "BLOCKED") {
          toast("Quality pipeline flagged issues. Review checkpoint feedback.");
        }
        } catch (pipelineErr) {
          console.error("[WorkSession] Pipeline failed:", pipelineErr);
          toast("Quality pipeline unavailable. Showing unscored draft.");
          setPipelineStatus("IDLE");
        }
      }

      setPhase("complete");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Generation failed.");
      setPhase("input");
    } finally {
      generateLockRef.current = false;
    }
  };

  const handleRunPipeline = async () => {
    if (!user || !generatedOutputId || generatedOutputId === "new" || !generatedContent) return;
    setPipelineStatus("RUNNING");
    setPipelineGateResults([]);
    setBlockedAt(undefined);
    setPipelineResult(null);

    try {
      const pipelineRes = await requestWithRetry(
        `${API_BASE}/api/run-pipeline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft: generatedContent,
            outputType: outputTypeApi,
            voiceDnaMd,
            brandDnaMd,
            methodDnaMd,
            userId: user.id,
            outputId: generatedOutputId,
          }),
        },
        120000 // pipeline takes longer
      );

      if (!pipelineRes.ok) throw new Error("Pipeline API failed");
      const result = await pipelineRes.json();

      setPipelineGateResults((result.gateResults || []).map((g: any) => ({
        gate: g.gate, status: g.status, score: g.score, feedback: g.feedback, issues: g.issues,
      })));
      setPipelineStatus(result.status);
      setBlockedAt(result.blockedAt);

      const finalScore = result.betterishScore?.total ?? generatedScore;
      const finalContent = result.finalDraft || generatedContent;
      setGeneratedContent(finalContent);
      setGeneratedScore(finalScore);

      await supabase.from("pipeline_runs").insert({
        output_id: generatedOutputId,
        user_id: user.id,
        status: result.status,
        gate_results: result.gateResults,
        betterish_score: result.betterishScore,
        betterish_total: result.betterishScore?.total ?? null,
        blocked_at: result.blockedAt ?? null,
        duration_ms: result.totalDurationMs,
      });

      await supabase.from("outputs").update({
        content: finalContent,
        score: finalScore,
        content_state: result.status === "PASSED" ? "vault" : "in_progress",
      }).eq("id", generatedOutputId);

      if (result.status === "PASSED") {
        toast("Quality pipeline passed. Output moved to The Vault.");
      } else {
        toast("Quality pipeline complete. Review specialist feedback.");
      }
    } catch (err) {
      console.error("[WorkSession] Re-run pipeline failed:", err);
      toast("Pipeline failed. Try again.");
      setPipelineStatus("IDLE");
    }
  };

  const startOver = () => {
    setPhase("input");
    setGeneratedContent("");
    setGeneratedScore(0);
    setGeneratedGates(null);
    setShowCheckpointSequence(false);
    setShowTotalScore(false);
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
    clearSession();
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
        @keyframes ddDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ddUp {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes orbAtmos {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1.0; transform: scale(1.08); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        @keyframes orbMiniPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 6px rgba(74,144,217,0.2); }
          50%      { transform: scale(1.06); box-shadow: 0 0 14px rgba(74,144,217,0.5); }
        }
        @keyframes watsonDot {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40%          { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes watsonPulse {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.4; }
          50% { transform: scale(1.3) translateY(-4px); opacity: 1; }
        }
        @keyframes makeThingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,150,26,0); }
          50%      { box-shadow: 0 0 0 6px rgba(200,150,26,0.2); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .watson-input::placeholder {
          color: rgba(0,0,0,0.3);
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
            padding: "5px 8px", borderRadius: 6, color: "var(--text-secondary)",
            display: "flex", alignItems: "center", gap: 4, transition: "color .15s",
            fontSize: 12, fontFamily: "'Afacad Flux', sans-serif",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Home</span>
          </button>
          {projects.length > 1 ? (
            <select
              value={activeProjectId || ""}
              onChange={(e) => setActiveProjectId(e.target.value || null)}
              style={{
                fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, fontWeight: 400,
                color: "var(--text-tertiary)", background: "transparent", border: "none",
                outline: "none", cursor: "pointer", display: isMobile ? "none" : "inline-block",
                appearance: "none", padding: "0 12px 0 0",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 2.5L4 5.5L7 2.5' stroke='%2364748B' strokeWidth='1' strokeLinecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right center",
              }}
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, fontWeight: 400, color: "var(--text-tertiary)", display: isMobile ? "none" : "inline-block" }}>
              {projects[0]?.name || "Studio"}
            </span>
          )}
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
            onClick={() => { clearSession(); window.location.href = "/studio/work"; }}
          >New Session</button>
        </div>
      </div>
      {/* ── Empty state: perfectly centered ─────────────────────────────── */}
      {phase === "input" && messages.length <= 1 ? (
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
        ].map((step, i) => {
          const clickable =
            (step.key === "watson" && (phase === "generating" || phase === "complete")) ||
            (step.key === "generate" && phase === "complete" && !!generatedGates) ||
            (step.key === "output" && phase === "complete");

          const handleStepClick = () => {
            if (!clickable) return;
            if (step.key === "watson") {
              setPhase("input");
              setShowCheckpointSequence(false);
            } else if (step.key === "generate") {
              setShowCheckpointSequence(true);
            } else if (step.key === "output") {
              setShowCheckpointSequence(false);
            }
          };

          return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              onClick={handleStepClick}
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: step.done ? "var(--gold-dark)" : step.active ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "color .2s",
                cursor: clickable ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { if (clickable) e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { if (clickable) e.currentTarget.style.color = step.done ? "var(--gold-dark)" : step.active ? "var(--text-primary)" : "var(--text-tertiary)"; }}
            >
              {step.label}
            </span>
            {i < 3 && (
              <span style={{ width: 20, height: 1, background: "var(--line)", opacity: step.done ? 0.6 : 0.3 }} />
            )}
          </div>
          );
        })}
      </div>

      {/* ── Messages area ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "0 0 8px",
        display: "flex", flexDirection: "column",
      }}>
        {phase === "generating" && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 0, padding: 40,
          }}>
            <style>{`
              @keyframes shimmerBar {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
            `}</style>
            <WatsonOrb size={48} thinking />
            <div style={{ marginTop: 24, width: "100%", maxWidth: 400 }}>
              {/* Progress bar */}
              <div style={{ height: 3, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${loadingProgress}%`,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #4A90D9, #F5C642)",
                  backgroundSize: "200% 100%",
                  animation: "shimmerBar 2s linear infinite",
                  transition: "width 0.5s ease-out",
                }} />
              </div>
              {/* Message */}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <p style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--fg-2)",
                  margin: 0,
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "opacity 0.3s ease",
                }}>
                  {loadingMessage}
                </p>
                <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "8px 0 0", opacity: 0.7 }}>
                  Generating your draft, then running the full quality pipeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {phase === "complete" && showCheckpointSequence && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: isMobile ? "24px 16px" : "32px 24px",
              overflowY: "auto",
              maxWidth: 960,
              margin: "0 auto",
              width: "100%",
            }}
          >
            <SpecialistPanel
              pipelineGateResults={pipelineGateResults.length > 0 ? pipelineGateResults : undefined}
              simpleGates={pipelineGateResults.length === 0 ? generatedGates : undefined}
              visibleCount={visibleCheckpointCount}
              revealedCount={revealedCheckpointCount}
              totalScore={showTotalScore ? (generatedScore || undefined) : undefined}
              showTotal={showTotalScore}
              isAnimating={!showTotalScore}
              threshold={MARKETING_NUMBERS.betterishThreshold}
            />
            {showTotalScore && (
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
                  style={{ padding: "10px 20px", fontSize: 14, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "transparent" }}
                  onClick={() => {
                    setPhase("input");
                    setShowCheckpointSequence(false);
                    if (generatedOutputId && generatedOutputId !== "new") {
                      setRevisionMode(true);
                      setRevisionOutputId(generatedOutputId);
                    }
                  }}
                >
                  Revise with Watson
                </button>
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
              <div
                style={{
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                  background: "var(--surface-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: isMobile ? "20px 16px" : "32px 36px",
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedContent) }}
              />
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
                    color: generatedScore >= 800 ? "#50c8a0" : "var(--text-secondary)",
                  }}>
                    {generatedScore >= 800 ? "Ready to publish" : "Needs revision"}
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
                  {generatedScore >= 800 && (
                    <button
                      type="button"
                      onClick={() => { clearSession(); navigate(`/studio/outputs/${generatedOutputId}`); }}
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
                  {generatedScore < 800 && (
                    <button
                      type="button"
                      onClick={() => { clearSession(); navigate(`/studio/outputs/${generatedOutputId}`); }}
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

              {/* Quality Pipeline CTA */}
              {pipelineStatus === "PASSED" ? (
                <div style={{
                  padding: "14px 18px",
                  background: "rgba(80,200,160,0.06)",
                  borderLeft: "3px solid #50c8a0",
                  borderRadius: 6,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#50c8a0", fontFamily: "'Afacad Flux', sans-serif" }}>All 7 checkpoints passed</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>Content moved to The Vault.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/studio/outputs")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: "#50c8a0",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}
                  >
                    View in Vault
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {generatedScore < 800 && pipelineStatus === "IDLE" && (
                    <div style={{
                      padding: "12px 16px",
                      background: "rgba(245,198,66,0.06)",
                      borderLeft: "3px solid var(--gold-dark)",
                      borderRadius: 6,
                      marginBottom: 12,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      fontFamily: "'Afacad Flux', sans-serif",
                    }}>
                      Score below publication threshold. Run the full quality pipeline for detailed specialist feedback and automatic revisions.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRunPipeline}
                    disabled={pipelineStatus === "RUNNING" || !generatedOutputId || generatedOutputId === "new"}
                    style={{
                      padding: "12px 20px",
                      borderRadius: 8,
                      border: "2px solid var(--gold-dark)",
                      background: pipelineStatus === "RUNNING" ? "rgba(245,198,66,0.04)" : "var(--surface-white)",
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: pipelineStatus === "RUNNING" ? "var(--text-tertiary)" : "var(--gold-dark)",
                      cursor: pipelineStatus === "RUNNING" ? "default" : "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => { if (pipelineStatus !== "RUNNING") { e.currentTarget.style.background = "rgba(245,198,66,0.06)"; } }}
                    onMouseLeave={(e) => { if (pipelineStatus !== "RUNNING") { e.currentTarget.style.background = "var(--surface-white)"; } }}
                  >
                    <Sparkles size={16} />
                    {pipelineStatus === "RUNNING" ? "Re-running pipeline..." : "Re-run Quality Pipeline"}
                  </button>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>
                    Run all 7 specialist checkpoints with detailed feedback
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
              )}

              {/* Specialist Pipeline Results */}
              {(generatedGates || pipelineGateResults.length > 0) && (
                <div style={{ marginTop: 8 }}>
                  <SpecialistPanel
                    pipelineGateResults={pipelineGateResults.length > 0 ? pipelineGateResults : undefined}
                    simpleGates={pipelineGateResults.length === 0 ? generatedGates : undefined}
                    totalScore={generatedScore || undefined}
                    showTotal={false}
                    threshold={MARKETING_NUMBERS.betterishThreshold}
                  />
                </div>
              )}

              {/* Start over */}
              <div style={{ marginTop: 16 }}>
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
            </div>
          </div>
        )}

        {phase === "input" && (
          <div style={{
            maxWidth: 760, width: "100%", margin: "0 auto",
            padding: "32px 24px 8px", display: "flex", flexDirection: "column", gap: 20,
          }}>
            {revisionMode && revisionContent && (
              <details style={{ background: "var(--surface-white)", border: "1px solid var(--border-subtle)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                <summary style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--fg-3)", fontFamily: "'Afacad Flux', sans-serif", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>View original content</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.15s" }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div style={{ padding: "0 16px 16px", maxHeight: 300, overflowY: "auto" }}>
                  <pre style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, lineHeight: 1.5, color: "var(--fg-3)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {revisionContent}
                  </pre>
                </div>
              </details>
            )}
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
                  Watson is ready. Choose an output format and let's make the thing.
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
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            {messages.length > 1 && (
              <button
                type="button"
                title="New session"
                onClick={() => { clearSession(); navigate("/studio/work?type=" + outputType); window.location.reload(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  color: "#64748B",
                  transition: "background 0.15s ease",
                  flexShrink: 0,
                  marginBottom: 12,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
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
          {!isReady && !loading && messages.filter(m => m.role === "user").length >= 2 && (
            <div style={{ textAlign: "right", marginTop: 8, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
              <button
                type="button"
                onClick={() => setIsReady(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gold-dark)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                Ready to produce? Skip ahead
              </button>
            </div>
          )}
        </div>
      </div>
      )}
        </>
      )}
    </div>
  );
}
