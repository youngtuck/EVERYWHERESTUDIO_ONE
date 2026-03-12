import { useEffect, useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import type { VoiceDNA } from "../../utils/voiceDNAProcessor";

interface QA {
  id: string;
  role: "system" | "user";
  content: string;
}

interface VoiceInterviewChatProps {
  onComplete: (result: { voiceDna: VoiceDNA; markdown: string; interviewResponses: Record<string, string> }) => void;
  onCancel?: () => void;
}

const INITIAL_PROMPT =
  "I'm going to ask you some questions to capture how you communicate. Not what you say, how you say it. Most people don't know what they sound like, but you know more than you think. Ready?";

export function VoiceInterviewChat({ onComplete, onCancel }: VoiceInterviewChatProps) {
  const [messages, setMessages] = useState<QA[]>([
    { id: "sys-0", role: "system", content: INITIAL_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: QA = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    // For v1, we do not stream intermediate questions from Claude.
    // Instead, we collect all Q&A pairs locally and let the parent
    // component decide when to call the processor.
  };

  const handleAnalyzeNow = () => {
    const interviewResponses: Record<string, string> = {};
    let idx = 1;
    for (const m of messages) {
      if (m.role === "user") {
        interviewResponses[`answer_${idx}`] = m.content;
        idx += 1;
      }
    }
    setLoading(true);
    // Defer to parent; it will call voiceDNAProcessor with these responses.
    onComplete({
      // The parent will immediately replace this stub with real data.
      // We provide minimal placeholders to satisfy the type system.
      voiceDna: {
        voice_fidelity: 0,
        voice_layer: 0,
        value_layer: 0,
        personality_layer: 0,
        traits: {
          vocabulary_and_syntax: 0,
          tonal_register: 0,
          rhythm_and_cadence: 0,
          metaphor_patterns: 0,
          structural_habits: 0,
        },
        voice_description: "",
        value_description: "",
        personality_description: "",
        contraction_frequency: "",
        sentence_length_avg: "",
        signature_phrases: [],
        prohibited_words: [],
        emotional_register: "",
        has_dual_mode: false,
        method: "interview",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        interview_responses: interviewResponses,
      },
      markdown: "",
      interviewResponses,
    });
  };

  const containerStyle = {
    maxWidth: 640,
    margin: "0 auto",
    height: "calc(100vh - 140px)",
    display: "flex",
    flexDirection: "column" as const,
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Building your voice profile
        </div>
        <div style={{ width: 120, height: 2, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#C8961A",
              transformOrigin: "left",
              transform: "scaleX(0.5)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 4px 12px",
        }}
      >
        {messages.map(m => {
          if (m.role === "system") {
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(200,150,26,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 10,
                      borderRadius: 999,
                      border: "2px solid rgba(200,150,26,0.85)",
                      borderTop: "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    maxWidth: 480,
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap" as const,
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  maxWidth: 400,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "12px 18px",
                  fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                  fontSize: 15,
                  color: "#ffffff",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: "16px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,9,15,0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ position: "relative" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write how you would actually respond. Short or long is fine."
            rows={2}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "14px 48px 14px 18px",
              color: "#ffffff",
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              fontSize: 15,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: input.trim() && !loading ? "#C8961A" : "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !loading ? "pointer" : "default",
            }}
          >
            <Send size={18} color={input.trim() && !loading ? "#07090f" : "rgba(255,255,255,0.4)"} />
          </button>
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
            }}
          >
            <Mic size={14} />
            <span>Switch to voice</span>
          </button>
          <button
            type="button"
            onClick={handleAnalyzeNow}
            disabled={messages.filter(m => m.role === "user").length < 3 || loading}
            style={{
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              border: "none",
              background: "none",
              color:
                messages.filter(m => m.role === "user").length >= 3 && !loading
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.3)",
              cursor:
                messages.filter(m => m.role === "user").length >= 3 && !loading ? "pointer" : "default",
            }}
          >
            Analyze responses
          </button>
        </div>
      </div>
    </div>
  );
}

