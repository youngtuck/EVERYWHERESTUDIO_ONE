import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// WATSON ORB — WebGL orb from the landing page, miniaturized.
// thinking=false: calm, slow drift, reactive to cursor.
// thinking=true:  faster spin, turbulent interior, breathing glow ring.
// ─────────────────────────────────────────────────────────────────────────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2  u_res;
uniform vec2  u_rotXY;
#define TAU 6.28318530718
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 rotX(vec3 p,float a){ p.yz=rot2(a)*p.yz; return p; }
vec3 rotY(vec3 p,float a){ p.xz=rot2(a)*p.xz; return p; }
float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){ return noise(p)*.5+noise(p*2.1+vec2(1.7,9.2))*.25+noise(p*4.3+vec2(8.3,2.8))*.125; }
vec3 thinFilm(float cosA,float thick){
  float opd=2.*thick*sqrt(max(0.,1.-(1./1.45/1.45)*(1.-cosA*cosA)));
  return .5+.5*cos(TAU*opd/vec3(.650,.550,.450));
}
vec3 interior(vec3 lp,float t,float energy){
  float r=length(lp);
  float phi=atan(lp.z,lp.x), theta=acos(clamp(lp.y/max(r,.001),-1.,1.));
  float spd=1.0+energy*2.2;
  float f1=fbm(vec2(phi*1.1+t*.07*spd,theta*1.6+t*.045*spd));
  float f2=fbm(vec2(phi*.8-t*.055*spd,theta*1.2-t*.038*spd)+vec2(3.1,7.4));
  float f3=fbm(vec2(phi*1.8+t*.09*spd,theta*2.2+t*.06*spd)+vec2(5.9,2.2));
  float r1=pow(max(0.,1.-abs(f1-.54)*5.5),2.0);
  float r2=pow(max(0.,1.-abs(f2-.47)*6.5),2.3);
  float r3=pow(max(0.,1.-abs(f3-.51)*5.0),1.8);
  float boost=1.0+energy*1.1;
  vec3 c1=vec3(.20,.55,1.00)*r1*1.6*boost;
  vec3 c2=vec3(.10,.30,.95)*r2*1.3*boost;
  vec3 c3=vec3(.55,.80,1.00)*r3*.85*boost;
  float core=exp(-r*r*2.5)*(.45+.55*sin(t*.38+.8));
  return vec3(.02,.03,.14)*(.4+.6*(1.-r))+vec3(.08,.14,.60)*core*2.2*boost+c1+c2+c3;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;
  float ar=u_res.x/u_res.y; uv.x*=ar;
  float rx=u_rotXY.x, ry=u_rotXY.y, t=u_t;
  vec3 ro=vec3(0.,0.,2.3), rd=normalize(vec3(uv,-1.65));
  float b=dot(ro,rd), c=dot(ro,ro)-.72*.72, disc=b*b-c;
  if(disc<0.0){gl_FragColor=vec4(0.);return;}
  float sqD=sqrt(disc);
  float edgeAA=smoothstep(0.,.004,sqD);
  float t1=max(-b-sqD,0.), t2=-b+sqD;
  if(t2<0.){gl_FragColor=vec4(0.);return;}
  vec3 pF=ro+rd*t1, N=normalize(pF), V=-rd;
  float NoV=max(dot(N,V),0.);
  vec3 lp=rotX(rotY(pF,-ry),-rx);
  float ps=atan(lp.z,lp.x), ts=acos(clamp(lp.y/max(length(lp),.001),-1.,1.));
  vec3 film=thinFilm(NoV,.28+fbm(vec2(ps*.6+t*.020,ts-.015*t))*.65);
  float fresnel=min(.06+(1.-.06)*pow(1.-NoV,4.0)+pow(1.-NoV,5.5)*1.1,.98);
  vec3 shellCol=mix(mix(vec3(.06,.10,.42),vec3(.55,.68,.96),NoV*.6),film*.98,.82);
  vec3 Lk=normalize(vec3(-.42,.78,.48)), H=normalize(Lk+V);
  shellCol+=pow(max(dot(N,H),0.),180.)*1.3+vec3(.65,.80,1.)*pow(max(dot(N,normalize(vec3(.70,.12,.52)+V)),0.),55.)*.4;
  vec3 intCol=vec3(0.);
  float span=t2-t1;
  for(int i=0;i<6;i++){
    float fi=float(i)/5.;
    intCol+=interior(rotX(rotY(ro+rd*(t1+span*(fi*.82+.09)),-ry),-rx),t,u_energy)*(1.-fi*.35);
  }
  intCol/=4.2;
  vec3 col=mix(intCol,shellCol,mix(.50,.92,fresnel));
  col+=vec3(.25,.50,1.0)*pow(1.-NoV,5.5)*1.1*.60;
  col=max(col,vec3(0.));
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  gl_FragColor=vec4(clamp(col,0.,1.)*edgeAA*(.90+fresnel*.10),edgeAA*(.90+fresnel*.10));
}
`;

class OrbSpring {
  x=0;y=0;vx=0;vy=0;tx=0;ty=0;
  step(stiffness=0.062, damping=0.86){
    this.vx+=(this.tx-this.x)*stiffness; this.vy+=(this.ty-this.y)*stiffness;
    this.vx*=damping; this.vy*=damping;
    this.x+=this.vx; this.y+=this.vy;
  }
}

function WatsonOrb({ size, thinking }: { size: number; thinking: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new OrbSpring());
  const raf = useRef(0);
  const thinkingRef = useRef(thinking);
  const energyRef = useRef(0);

  // Update thinking ref without restarting WebGL
  useEffect(() => { thinkingRef.current = thinking; }, [thinking]);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true });
    if (!gl) return;
    const mkS = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkS(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkS(gl.FRAGMENT_SHADER, ORB_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const uT    = gl.getUniformLocation(prog, "u_t");
    const uR    = gl.getUniformLocation(prog, "u_res");
    const uRot  = gl.getUniformLocation(prog, "u_rotXY");
    const uEnergy = gl.getUniformLocation(prog, "u_energy");

    // Cursor tracking — only when not thinking (thinking = autonomous rotation)
    const onMove = (e: MouseEvent) => {
      if (!thinkingRef.current) {
        spring.current.tx = (e.clientY / window.innerHeight - .5) * 2 * .55;
        spring.current.ty = (e.clientX / window.innerWidth - .5) * 2 * .55;
      }
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const isThinking = thinkingRef.current;
      // Smoothly ramp energy up/down
      const targetEnergy = isThinking ? 1.0 : 0.0;
      energyRef.current += (targetEnergy - energyRef.current) * 0.04;

      if (isThinking) {
        // Autonomous slow spin when thinking
        const t = ts * 0.0008;
        spring.current.tx = Math.sin(t * 0.7) * 0.6;
        spring.current.ty = Math.cos(t * 0.5) * 0.4;
        spring.current.step(0.025, 0.94);
      } else {
        spring.current.step(0.062, 0.86);
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * .001);
      gl.uniform1f(uEnergy, energyRef.current);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uRot, spring.current.x, spring.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, [size]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Breathing glow ring — only visible when thinking */}
      <div style={{
        position: "absolute",
        inset: -6,
        borderRadius: "50%",
        background: "transparent",
        boxShadow: thinking
          ? `0 0 ${size * 0.5}px rgba(74,144,245,0.35), 0 0 ${size * 0.25}px rgba(74,144,245,0.22)`
          : "none",
        animation: thinking ? "orbPulse 1.8s ease-in-out infinite" : "none",
        pointerEvents: "none",
        transition: "box-shadow 0.6s ease",
      }} />
      <canvas ref={ref} style={{ width: size, height: size, borderRadius: "50%", display: "block" }} />
    </div>
  );
}

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
function MessageBubble({ msg, thinking }: { msg: Message; thinking?: boolean }) {
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
          <WatsonOrb size={30} thinking={!!thinking} />
        </div>
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
      {/* Watson orb — live WebGL, reactive */}
      <WatsonOrb size={64} thinking={false} />

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
        @keyframes orbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.12); }
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
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} thinking={msg.typing && loading} />)}
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
