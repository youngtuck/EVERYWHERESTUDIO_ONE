import { useState, useRef, useEffect } from "react";
import { Send, Mic, CheckCircle, Loader, Circle, X, ChevronDown, Copy } from "lucide-react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

interface Message { role:"watson"|"user"; content:string; type?:"gate"|"score"|"text"; gateData?:GateData; scoreData?:ScoreData; }
interface GateData { gates:Array<{num:string;name:string;status:"pass"|"fail"|"running"|"queued"}>; }
interface ScoreData { total:number; unique:number; compelling:number; sustainable:number; believable:number; }

const GATE_NAMES = ["Strategy Gate","Voice Gate","Accuracy Gate","AI Tells Gate","Audience Gate","Platform Gate","Impact Gate"];

const GateCard = ({ data }: { data: GateData }) => (
  <div style={{ padding:"16px 18px", margin:"4px 0", maxWidth:380,
    background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:10 }}>
    <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase",
      color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Quality Gates</p>
    {data.gates.map((g, i) => (
      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0",
        borderBottom:i<data.gates.length-1?"1px solid var(--border)":"none" }}>
        <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
          minWidth:18, letterSpacing:"0.06em" }}>{g.num}</span>
        {g.status==="pass"    && <CheckCircle size={13} style={{ color:"#188FA7", flexShrink:0 }} />}
        {g.status==="running" && <Loader size={13} style={{ color:"#F5C642", flexShrink:0, animation:"spin 1s linear infinite" }} />}
        {g.status==="queued"  && <Circle size={13} style={{ color:"var(--border-strong)", flexShrink:0 }} />}
        {g.status==="fail"    && <X size={13} style={{ color:"#DC4444", flexShrink:0 }} />}
        <span style={{ fontSize:13, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif",
          flex:1, letterSpacing:"-.01em" }}>{g.name}</span>
        <span style={{ fontSize:9, fontWeight:700, fontFamily:"'Afacad Flux',sans-serif",
          color:g.status==="pass"?"#188FA7":g.status==="running"?"#F5C642":g.status==="fail"?"#DC4444":"var(--text-muted)",
          textTransform:"uppercase", letterSpacing:"1px" }}>{g.status}</span>
      </div>
    ))}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

const ScoreCard = ({ data }: { data: ScoreData }) => {
  const color = data.total >= 800 ? "#F5C642" : data.total >= 600 ? "#188FA7" : "#999";
  const dims:[string,number][] = [["Unique",data.unique],["Compelling",data.compelling],["Sustainable",data.sustainable],["Believable",data.believable]];
  return (
    <div style={{ padding:"20px", margin:"4px 0", maxWidth:380,
      background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:10 }}>
      <p style={{ fontSize:9, fontWeight:700, letterSpacing:"2.5px", textTransform:"uppercase",
        color:"var(--text-muted)", marginBottom:12, fontFamily:"'Afacad Flux',sans-serif" }}>Betterish Score</p>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:16 }}>
        <span style={{ fontSize:52, fontWeight:900, color, letterSpacing:"-3px",
          fontFamily:"'Afacad Flux',sans-serif", lineHeight:1 }}>{data.total}</span>
        <span style={{ fontSize:16, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>/ 1000</span>
      </div>
      {dims.map(([label, val]) => (
        <div key={label} style={{ marginBottom:9 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"'Afacad Flux',sans-serif" }}>{label}</span>
            <span style={{ fontSize:11, fontWeight:700, color, fontFamily:"'Afacad Flux',sans-serif" }}>{val}/250</span>
          </div>
          <div style={{ height:2, background:"var(--bg-tertiary)", borderRadius:1, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(val/250)*100}%`, background:color, borderRadius:1,
              transition:"width 1s cubic-bezier(.16,1,.3,1)" }} />
          </div>
        </div>
      ))}
      {data.total >= 800 && (
        <div style={{ marginTop:14, padding:"9px 12px", background:"rgba(24,143,167,.06)",
          border:"1px solid rgba(24,143,167,.18)", borderRadius:6, display:"flex", alignItems:"center", gap:7 }}>
          <CheckCircle size={13} style={{ color:"#188FA7", flexShrink:0 }} />
          <span style={{ fontSize:12, color:"#188FA7", fontFamily:"'Afacad Flux',sans-serif", fontWeight:600 }}>
            Above publication threshold (800)
          </span>
        </div>
      )}
    </div>
  );
};

const DEMO_RESPONSES: Record<string, Message[]> = {
  default: [{ role:"watson", content:"That's a compelling direction. Before I shape this — what's the one thing you want the reader to do differently after reading it?", type:"text" }],
  idea:    [{ role:"watson", content:"Good. I can work with that. Tell me about a specific moment where you saw this play out — a real situation, not the principle itself.", type:"text" }],
  story:   [
    { role:"watson", content:"Perfect. That's the real story. Let me run this through the gates while we finish building the piece.", type:"text" },
    { role:"watson", content:"", type:"gate", gateData:{ gates: GATE_NAMES.map((name,i) => ({ num:`0${i+1}`, name, status:(i<4?"pass":i===4?"running":"queued") as any })) }},
  ],
  gates:   [
    { role:"watson", content:"All seven gates cleared. Here's your score:", type:"text" },
    { role:"watson", content:"", type:"score", scoreData:{ total:912, unique:228, compelling:241, sustainable:220, believable:223 }},
    { role:"watson", content:"This is ready to publish. Would you like me to format it for LinkedIn first, or export the full essay?", type:"text" },
  ],
};

// Output type → Watson opening line
const TYPE_OPENERS: Record<string, string> = {
  "Essay": "Good. Let's build an essay. What's the idea or argument you want to explore? Give me the rough version — don't polish it.",
  "LinkedIn Post": "LinkedIn post — great. What's the one thing you want to say? The post will be built around a single insight, not a list.",
  "Newsletter": "Newsletter session. What's the theme for this issue? And is there one story or idea that's been on your mind this week?",
  "Podcast Script": "Podcast script. Who's the audience, and what's the main argument for this episode? Give me the raw version.",
  "Sunday Story": "Sunday Story — the slowest, most human format we have. What happened this week that made you think differently about something?",
  "Twitter Thread": "Twitter thread. What's the counter-intuitive point you want to land? Threads work best when the first line is a gut punch.",
  "Short Video": "Short video script. Under 60 seconds. What's the single idea? The hook, the pivot, the punchline — what's the shape of it?",
  "Talk Outline": "Talk outline. Who's the audience, how long do you have, and what's the one thing you want them to walk away remembering?",
};

const WorkSession = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const outputType = searchParams.get("type") || "Essay";
  const isSetup = searchParams.get("setup") === "true";

  const [messages, setMessages] = useState<Message[]>(() => {
    if (isSetup) return [{ role:"watson", content:"Let's get your studio ready. I'll ask you a few questions — your answers will shape everything the system creates for you.\n\nFirst: what do you do, and who do you do it for?", type:"text" }];
    if (id === "1") return [
      { role:"watson", content:"Picking up the leadership habits essay. You left off after the opening argument. Ready to continue?", type:"text" },
      { role:"user", content:"Yes. I want to sharpen the argument in paragraph three.", type:"text" },
      { role:"watson", content:"Read it back. The argument is solid but the example feels borrowed — it could have come from any business book. What's a moment you personally witnessed this habit change an outcome?", type:"text" },
    ];
    const opener = TYPE_OPENERS[outputType] || TYPE_OPENERS["Essay"];
    return [{ role:"watson", content:opener, type:"text" }];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnCount = useRef(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim() || isTyping) return;
    setMessages(m => [...m, { role:"user", content:input.trim(), type:"text" }]);
    setInput("");
    setIsTyping(true);
    turnCount.current++;
    const t = turnCount.current;
    const responses = t===1?DEMO_RESPONSES.idea:t===2?DEMO_RESPONSES.story:t>=3?DEMO_RESPONSES.gates:DEMO_RESPONSES.default;
    let delay = 900;
    responses.forEach((resp, ri) => {
      setTimeout(() => {
        setMessages(m => [...m, resp]);
        if (ri === responses.length-1) setIsTyping(false);
      }, delay);
      delay += 700;
    });
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); }};

  const sessionTitle = isSetup ? "First Session — Studio Setup" : id ? "Leadership habits essay" : `New ${outputType} Session`;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 54px)" }}>

      {/* Session header */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)",
            fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-.02em" }}>
            {sessionTitle}
          </span>
          {!isSetup && (
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
              background:"rgba(24,143,167,.08)", color:"#188FA7",
              border:"1px solid rgba(24,143,167,.15)", fontFamily:"'Afacad Flux',sans-serif",
              fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>
              {id ? "In Progress" : "New"}
            </span>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Output type selector */}
          {!id && !isSetup && (
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowTypeMenu(m=>!m)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
                  background:"var(--bg-secondary)", border:"1px solid var(--border)",
                  borderRadius:6, cursor:"pointer", fontSize:12, color:"var(--text-secondary)",
                  fontFamily:"'Afacad Flux',sans-serif", letterSpacing:"-.01em" }}>
                {outputType} <ChevronDown size={11} />
              </button>
              {showTypeMenu && (
                <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:100,
                  background:"var(--bg-primary)", border:"1px solid var(--border)",
                  borderRadius:8, boxShadow:"var(--shadow-md)", minWidth:180, padding:4 }}>
                  {Object.keys(TYPE_OPENERS).map(t => (
                    <button key={t} onClick={() => { navigate(`/studio/work?type=${encodeURIComponent(t)}`); setShowTypeMenu(false); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px",
                        background:"transparent", border:"none", cursor:"pointer",
                        fontSize:13, color:t===outputType?"var(--text-primary)":"var(--text-secondary)",
                        fontFamily:"'Afacad Flux',sans-serif", fontWeight:t===outputType?600:400,
                        borderRadius:5, transition:"background .12s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-secondary)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button title="Copy session" style={{ background:"none", border:"1px solid var(--border)",
            borderRadius:6, padding:"6px 8px", cursor:"pointer", color:"var(--text-muted)",
            display:"flex", alignItems:"center" }}>
            <Copy size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 20px 16px",
        display:"flex", flexDirection:"column", gap:14 }}>
        {messages.map((msg, i) => {
          if (msg.type==="gate"  && msg.gateData)  return <GateCard  key={i} data={msg.gateData} />;
          if (msg.type==="score" && msg.scoreData) return <ScoreCard key={i} data={msg.scoreData} />;
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column",
              alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
              {msg.role==="watson" && (
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                  color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif",
                  marginBottom:5 }}>Watson</span>
              )}
              <div style={{
                maxWidth:"72%", padding:"12px 16px", borderRadius:msg.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",
                background:msg.role==="user"?"var(--text-primary)":"var(--bg-secondary)",
                border:msg.role==="watson"?"1px solid var(--border)":"none",
              }}>
                <p style={{ fontSize:14, lineHeight:1.68, fontFamily:"'Afacad Flux',sans-serif",
                  whiteSpace:"pre-wrap", letterSpacing:"-.01em",
                  color:msg.role==="user"?"var(--bg-primary)":"var(--text-primary)" }}>
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
              color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif", marginBottom:5 }}>Watson</span>
            <div style={{ padding:"12px 16px", background:"var(--bg-secondary)",
              border:"1px solid var(--border)", borderRadius:"10px 10px 10px 2px",
              display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--text-muted)",
                  animation:`blink 1.2s ${i*0.22}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding:"12px 16px 16px", borderTop:"1px solid var(--border)",
        display:"flex", gap:10, alignItems:"flex-end", flexShrink:0,
        background:"var(--bg-primary)" }}>
        <button title="Voice input" style={{ background:"none", border:"1px solid var(--border)",
          borderRadius:7, padding:"9px 10px", cursor:"not-allowed", color:"var(--text-muted)",
          flexShrink:0, opacity:.45, display:"flex" }}>
          <Mic size={15} />
        </button>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
          placeholder={`Talk to Watson about your ${outputType.toLowerCase()}...`}
          rows={1}
          style={{ flex:1, background:"var(--bg-secondary)", border:"1px solid var(--border)",
            borderRadius:8, padding:"10px 14px", fontSize:14, color:"var(--text-primary)",
            fontFamily:"'Afacad Flux',sans-serif", outline:"none", resize:"none",
            lineHeight:1.55, maxHeight:140, overflow:"auto", letterSpacing:"-.01em" }}
          onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,140)+"px";}} />
        <button onClick={send} disabled={!input.trim()||isTyping}
          style={{ background:input.trim()?"var(--text-primary)":"var(--bg-secondary)",
            border:"1px solid", borderColor:input.trim()?"var(--text-primary)":"var(--border)",
            borderRadius:7, padding:"9px 12px", cursor:input.trim()?"pointer":"not-allowed",
            color:input.trim()?"var(--bg-primary)":"var(--text-muted)",
            flexShrink:0, transition:"all .15s", display:"flex" }}>
          <Send size={15} />
        </button>
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
      `}</style>
    </div>
  );
};
export default WorkSession;
