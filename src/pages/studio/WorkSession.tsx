import { useState, useRef, useEffect } from "react";
import { Send, Mic, MoreHorizontal, CheckCircle, Loader, Circle } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

interface Message { role: "watson"|"user"; content: string; type?: "gate"|"score"|"text"; gateData?: GateData; scoreData?: ScoreData; }
interface GateData { gates: Array<{num:string;name:string;status:"pass"|"fail"|"running"|"queued"}>; }
interface ScoreData { total:number; unique:number; compelling:number; sustainable:number; believable:number; }

const INITIAL_MESSAGES: Message[] = [
  { role:"watson", content:"Good morning. What are we making today? Or if you'd like, I can set up your studio first — takes about 3 minutes.", type:"text" },
];

const GATE_NAMES = ["Strategy Gate","Voice Gate","Accuracy Gate","AI Tells Gate","Audience Gate","Platform Gate","Impact Gate"];

const GateCard = ({ data }: { data: GateData }) => (
  <div className="card" style={{ padding:"16px", margin:"8px 0", maxWidth:360 }}>
    <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:10, fontFamily:"'Afacad Flux',sans-serif" }}>Quality Gates</p>
    {data.gates.map((g, i) => (
      <div key={i} className={`gate-item ${g.status === "pass" ? "gate-pass" : g.status === "running" ? "gate-running" : ""}`}>
        <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", minWidth:20 }}>{g.num}</span>
        {g.status === "pass" && <CheckCircle size={13} style={{ color:"#188FA7", flexShrink:0 }} />}
        {g.status === "running" && <Loader size={13} style={{ color:"#F5C642", flexShrink:0, animation:"spin 1s linear infinite" }} />}
        {g.status === "queued" && <Circle size={13} style={{ color:"var(--text-muted)", flexShrink:0 }} />}
        {g.status === "fail" && <CheckCircle size={13} style={{ color:"#DC2626", flexShrink:0 }} />}
        <span style={{ fontSize:13, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{g.name}</span>
        <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, fontFamily:"'Afacad Flux',sans-serif", color:g.status==="pass"?"#188FA7":g.status==="running"?"#F5C642":"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px" }}>{g.status}</span>
      </div>
    ))}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

const ScoreCard = ({ data }: { data: ScoreData }) => {
  const color = data.total >= 800 ? "#F5C642" : data.total >= 600 ? "#188FA7" : "#999";
  const dims = [["Unique",data.unique],["Compelling",data.compelling],["Sustainable",data.sustainable],["Believable",data.believable]];
  return (
    <div className="card" style={{ padding:"20px", margin:"8px 0", maxWidth:380 }}>
      <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Betterish Score</p>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:16 }}>
        <span style={{ fontSize:48, fontWeight:800, color, letterSpacing:"-2px", fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>{data.total}</span>
        <span style={{ fontSize:16, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>/ 1000</span>
      </div>
      {dims.map(([label, val]) => (
        <div key={label as string} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{label as string}</span>
            <span style={{ fontSize:11, fontWeight:700, color, fontFamily:"'Afacad Flux',sans-serif" }}>{val as number}/250</span>
          </div>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width:`${((val as number)/250)*100}%`, background:color }} />
          </div>
        </div>
      ))}
      {data.total >= 800 && (
        <div style={{ marginTop:14, padding:"8px 12px", background:"rgba(24,143,167,0.06)", border:"1px solid rgba(24,143,167,0.15)", borderRadius:5, display:"flex", alignItems:"center", gap:6 }}>
          <CheckCircle size={13} style={{ color:"#188FA7", flexShrink:0 }} />
          <span style={{ fontSize:12, color:"#188FA7", fontFamily:"'Afacad Flux',sans-serif", fontWeight:600 }}>Above publication threshold (800)</span>
        </div>
      )}
    </div>
  );
};

const DEMO_RESPONSES: Record<string, Message[]> = {
  default: [{ role:"watson", content:"That's a compelling direction. Before I shape this — what's the one thing you want the reader to do differently after reading it?", type:"text" }],
  idea: [
    { role:"watson", content:"Good. I can work with that. Tell me about a specific moment where you saw this play out — a real situation, not the principle itself.", type:"text" },
  ],
  story: [
    { role:"watson", content:"Perfect. That's the real story. Let me run this through the gates while we finish building the piece.", type:"text" },
    { role:"watson", content:"", type:"gate", gateData:{ gates: GATE_NAMES.map((name,i) => ({ num:`0${i+1}`, name, status:i<4?"pass":i===4?"running":"queued" as any })) }},
  ],
  gates: [
    { role:"watson", content:"All seven gates cleared. Here's the score:", type:"text" },
    { role:"watson", content:"", type:"score", scoreData:{ total:912, unique:228, compelling:241, sustainable:220, believable:223 }},
    { role:"watson", content:"This is ready to publish. Would you like me to format it for LinkedIn, or would you prefer the full essay version first?", type:"text" },
  ],
};

const WorkSession = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isSetup) return [{ role:"watson", content:"Let's get your studio ready. I'll ask you a few questions — your answers will shape everything the system creates for you.\n\nFirst: what do you do, and who do you do it for?", type:"text" }];
    if (id === "1") return [
      { role:"watson", content:"Picking up the leadership habits essay. You left off after the opening argument. Here's where we are — ready to continue?", type:"text" },
      { role:"user", content:"Yes. I want to sharpen the argument in paragraph three.", type:"text" },
      { role:"watson", content:"Read it back. The argument is solid but the example feels borrowed — it could have come from any business book. What's a moment you personally witnessed this habit change an outcome?", type:"text" },
    ];
    return INITIAL_MESSAGES;
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  let turnCount = useRef(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role:"user", content:input.trim(), type:"text" };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setIsTyping(true);
    turnCount.current++;
    const t = turnCount.current;
    const responses = t === 1 ? DEMO_RESPONSES.idea : t === 2 ? DEMO_RESPONSES.story : t >= 3 ? DEMO_RESPONSES.gates : DEMO_RESPONSES.default;
    let delay = 900;
    responses.forEach(resp => {
      setTimeout(() => {
        setMessages(m => [...m, resp]);
        if (resp === responses[responses.length-1]) setIsTyping(false);
      }, delay);
      delay += 600;
    });
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 54px)" }}>
      {/* Session header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>
            {isSetup ? "First Session — Studio Setup" : id ? "Leadership habits essay" : "New Work Session"}
          </span>
          {!isSetup && <span className="pill pill-active">In Progress</span>}
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}><MoreHorizontal size={16} /></button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((msg, i) => {
          if (msg.type === "gate" && msg.gateData) return <GateCard key={i} data={msg.gateData} />;
          if (msg.type === "score" && msg.scoreData) return <ScoreCard key={i} data={msg.scoreData} />;
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
              <div className={msg.role==="watson"?"chat-bubble-watson":"chat-bubble-user"}>
                <p style={{ fontSize:14, lineHeight:1.65, fontFamily:"'Afacad Flux',sans-serif", whiteSpace:"pre-wrap" }}>{msg.content}</p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display:"flex", alignItems:"flex-start" }}>
            <div className="chat-bubble-watson" style={{ display:"flex", gap:4, alignItems:"center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--text-muted)", animation:`blink 1.2s ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", display:"flex", gap:10, alignItems:"flex-end", flexShrink:0, background:"var(--bg-primary)" }}>
        <button title="Voice input (coming soon)" style={{ background:"none", border:"1px solid var(--border)", borderRadius:5, padding:"9px", cursor:"not-allowed", color:"var(--text-muted)", flexShrink:0, opacity:0.5 }}>
          <Mic size={15} />
        </button>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Talk to Watson... (Enter to send, Shift+Enter for new line)"
          rows={1} style={{ flex:1, background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:6, padding:"10px 14px", fontSize:14, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif", outline:"none", resize:"none", lineHeight:1.5, maxHeight:120, overflow:"auto" }}
          onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }} />
        <button onClick={send} disabled={!input.trim() || isTyping} title="Send"
          style={{ background:input.trim()?"var(--text-primary)":"var(--bg-tertiary)", border:"none", borderRadius:5, padding:"9px 12px", cursor:input.trim()?"pointer":"not-allowed", color:input.trim()?"var(--bg-primary)":"var(--text-muted)", flexShrink:0, transition:"background 0.15s ease" }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
export default WorkSession;
