import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// EVERYWHERE STUDIO - WORK SESSION
// Inspired by the best: ChatGPT, Claude, Perplexity, Grok, Gemini.
// Clean. Simple. The model is the product.
// ─────────────────────────────────────────────────────────────────────────────

const OUTPUT_TYPES: Record<string, { label: string; color: string; watson: string }> = {
  essay:        { label: "Essay",           color: "#4A90D9", watson: "What's the central argument you want to make? Give me the rough idea and I'll ask the questions that pull it into focus." },
  podcast:      { label: "Podcast",         color: "#F5C642", watson: "What's this episode about? Tell me the topic and who you're talking to, and we'll shape the conversation from there." },
  newsletter:   { label: "Newsletter",      color: "#50c8a0", watson: "What's the story this week? What happened, what did you observe, what shifted? Start wherever feels natural." },
  social:       { label: "Social Media",    color: "#a080f5", watson: "What's the idea you want to put out there? Give me the raw thought and we'll find the right angle and format." },
  video:        { label: "Video Script",    color: "#e85d75", watson: "What's the video about? What's the one thing you want the viewer to walk away knowing or feeling?" },
  presentation: { label: "Presentation",   color: "#F5A623", watson: "What's the presentation for? Tell me the audience, the occasion, and the outcome you're driving toward." },
  sunday_story: { label: "Sunday Story",   color: "#F5C642", watson: "What's the story this week? The experience, the insight, the moment that's worth sharing. Start anywhere." },
  freestyle:    { label: "Freestyle",       color: "#4A90D9", watson: "What are we making? Describe it in your own words, any format, any length. I'll build it." },
};

const OUTPUT_TYPE_GROUPS = [
  { label: "Long Form",  types: ["essay", "podcast", "newsletter"] },
  { label: "Short Form", types: ["social", "video"] },
  { label: "Structured", types: ["presentation", "sunday_story", "freestyle"] },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  typing?: boolean;
}

// Auto-resize textarea
function AutoTextarea({
  value, onChange, onSubmit, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
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
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 12, alignItems: "flex-end",
      maxWidth: "100%",
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".02em",
          marginBottom: 2,
        }}>W</div>
      )}

      <div style={{
        maxWidth: isUser ? "78%" : "85%",
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

// Empty state - shown when no messages
function EmptyState({ outputType, onSuggestion }: { outputType: string; onSuggestion: (s: string) => void }) {
  const type = OUTPUT_TYPES[outputType] || OUTPUT_TYPES.freestyle;
  const suggestions: Record<string, string[]> = {
    essay:        ["I want to write about the future of remote work", "Help me make the case for slow thinking in a fast world", "I have a contrarian take on productivity culture"],
    podcast:      ["Solo episode on what I learned from a bad hire", "Interview prep for a conversation about AI and creativity", "Topic breakdown for my next 3 episodes"],
    newsletter:   ["This week I had a revelation about how I was wasting mornings", "I want to share what happened at our team offsite", "Thoughts on a book I just finished"],
    social:       ["LinkedIn post about why most advice is wrong", "Twitter thread on my creative process", "Short video script about a mistake I made"],
    video:        ["60-second take on why execution beats ideas", "Explainer video on my consulting framework", "Behind-the-scenes look at how I actually work"],
    presentation: ["Keynote for a leadership summit, 45 minutes", "Sales deck for a new service offering", "Team strategy presentation for Q2"],
    sunday_story: ["This week was about a conversation I almost avoided", "Story about a failure that turned into a framework", "Reflection on year three of running my business"],
    freestyle:    ["I need a bio for a conference website", "Write an executive summary of my thesis", "Create a one-page overview of my methodology"],
  };

  const typeSuggestions = suggestions[outputType] || suggestions.freestyle;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 40px", gap: 32, textAlign: "center",
    }}>
      {/* Watson orb indicator */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: `linear-gradient(135deg, ${type.color}33 0%, ${type.color}11 100%)`,
        border: `1px solid ${type.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 700, color: type.color,
      }}>W</div>

      <div style={{ maxWidth: 460 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 10, letterSpacing: "-.02em" }}>
          {type.watson.split("?")[0] + "?"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.65, fontWeight: 300 }}>
          Start with a rough idea. Watson will ask the questions that shape it into a {type.label.toLowerCase()}.
        </p>
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 480 }}>
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

// Output type selector pill
function OutputTypePill({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const type = OUTPUT_TYPES[value] || OUTPUT_TYPES.freestyle;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
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
          borderRadius: 12, padding: 6, minWidth: 200,
          boxShadow: "var(--shadow-md)", zIndex: 50,
        }}>
          {OUTPUT_TYPE_GROUPS.map(grp => (
            <div key={grp.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fg-3)", padding: "4px 10px 6px" }}>{grp.label}</div>
              {grp.types.map(t => {
                const ot = OUTPUT_TYPES[t];
                const active = t === value;
                return (
                  <button key={t} onClick={() => { onChange(t); setOpen(false); }} style={{
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
                    {active && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto" }}>
                      <path d="M2 6L5 9L10 3" stroke={ot.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Work Session ─────────────────────────────────────────────────────────
export default function WorkSession() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [outputType, setOutputType] = useState(searchParams.get("type") || "essay");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("New Session");
  const bottomRef = useRef<HTMLDivElement>(null);
  const type = OUTPUT_TYPES[outputType] || OUTPUT_TYPES.freestyle;

  // Watson opening message
  useEffect(() => {
    if (id === "new") {
      setMessages([{
        id: "w0",
        role: "assistant",
        content: type.watson,
        ts: Date.now(),
      }]);
      setSessionTitle("New Session");
    }
  }, [id, outputType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateWatson = (userMsg: string): string => {
    const responses = [
      "Good. That's the seed. Tell me more about what changed for you, specifically -- what was the moment you realized this?",
      "I like where this is going. Who is the person who most needs to hear this? What's their situation right now?",
      "Strong angle. What's the contrarian element here -- the thing that would make someone stop scrolling?",
      "Let's go deeper on that. What do you know about this that most people don't?",
      "Perfect. Now give me the uncomfortable truth that lives inside that observation.",
      "Got it. What's the one sentence that captures the whole thing -- the thesis, if you had to compress it?",
    ];
    return responses[messages.filter(m => m.role === "assistant").length % responses.length];
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    // Generate title from first user message
    if (messages.filter(m => m.role === "user").length === 0) {
      setSessionTitle(userMsg.slice(0, 40) + (userMsg.length > 40 ? "..." : ""));
    }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userMsg, ts: Date.now() };
    const typingId = (Date.now() + 1).toString();
    const typingMsg: Message = { id: typingId, role: "assistant", content: "", ts: Date.now(), typing: true };

    setMessages(prev => [...prev, userMessage, typingMsg]);
    setLoading(true);

    // Simulate Watson response
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    const response = simulateWatson(userMsg);

    setMessages(prev => [
      ...prev.filter(m => m.id !== typingId),
      { id: typingId, role: "assistant", content: response, ts: Date.now() },
    ]);
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "var(--bg)", overflow: "hidden", fontFamily: "var(--font)",
    }}>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40%            { transform: translateY(-4px); opacity: 1; }
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
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", letterSpacing: "-.01em", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
        {messages.length <= 1 ? (
          <EmptyState outputType={outputType} onSuggestion={(s) => { setInput(s); }} />
        ) : (
          <div style={{
            maxWidth: 760, width: "100%", margin: "0 auto",
            padding: "32px 24px 8px", display: "flex", flexDirection: "column", gap: 20,
          }}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, padding: "12px 24px 20px",
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
          <AutoTextarea
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            placeholder={`Tell Watson about your ${type.label.toLowerCase()}...`}
            disabled={loading}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Left: hints */}
            <span style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: ".01em" }}>
              Enter to send &nbsp;·&nbsp; Shift+Enter for new line
            </span>
            {/* Right: send button */}
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
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--fg-3)", marginTop: 10, letterSpacing: ".01em" }}>
          Watson is your First Listener. Say anything. It will ask the right questions.
        </p>
      </div>
    </div>
  );
}
