import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileText, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useMobile } from "../../hooks/useMobile";
import { useTheme } from "../../context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// WATSON ORB - volumetric plasma field inside a glass shell.
// thinking=false: calm, slow internal motion.
// thinking=true:  plasma filaments brighten and accelerate.
// ─────────────────────────────────────────────────────────────────────────────
const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

const ORB_FRAG = `
precision highp float;
uniform float u_t;
uniform float u_energy;
uniform vec2 u_res;
uniform vec2 u_mouse;

#define PI 3.14159265358979
#define TAU 6.28318530718

// Hash and noise
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}
float hash3(vec3 p) {
  p = fract(p * vec3(127.1, 311.7, 74.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y * p.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// Rotation matrices
mat3 rotX(float a) { float c=cos(a),s=sin(a); return mat3(1,0,0, 0,c,-s, 0,s,c); }
mat3 rotY(float a) { float c=cos(a),s=sin(a); return mat3(c,0,s, 0,1,0, -s,0,c); }
mat3 rotZ(float a) { float c=cos(a),s=sin(a); return mat3(c,-s,0, s,c,0, 0,0,1); }

void main() {
  vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
  uv.x *= u_res.x / u_res.y;

  float spd = 1.0 + u_energy * 3.0;
  float T = u_t * spd;

  // Ray setup
  vec3 ro = vec3(u_mouse * 0.3, 2.5);
  vec3 rd = normalize(vec3(uv, -1.8));

  // Sphere intersection R=0.82
  float R = 0.82;
  float b = dot(ro, rd);
  float c = dot(ro, ro) - R * R;
  float disc = b*b - c;
  if (disc < 0.0) { gl_FragColor = vec4(0.0); return; }

  float sqD = sqrt(disc);
  float tNear = -b - sqD;
  float tFar  = -b + sqD;
  if (tFar < 0.0) { gl_FragColor = vec4(0.0); return; }

  // Edge softness
  float edgeAA = smoothstep(0.0, 0.012, disc);

  vec3 hitN = normalize(ro + rd * max(tNear, 0.0));
  float NoV = max(dot(hitN, -rd), 0.0);
  float fresnel = pow(1.0 - NoV, 4.0);

  // ── INTERIOR VOLUMETRIC MARCH ──────────────────────────────────────────
  // We march 20 steps through the sphere and accumulate plasma + filaments
  float span = tFar - max(tNear, 0.0);
  float tStart = max(tNear, 0.0);

  vec3 plasma = vec3(0.0);
  float alpha_acc = 0.0;

  for (int i = 0; i < 20; i++) {
    float fi = (float(i) + 0.5) / 20.0;
    vec3 p = ro + rd * (tStart + span * fi);

    // Rotate sample point over time for swirling
    p = rotY(T * 0.18) * rotX(T * 0.11) * p;

    float r = length(p);
    vec3 n = p / r;

    // Spherical coords for surface patterns
    float theta = acos(clamp(n.y, -1.0, 1.0));
    float phi   = atan(n.z, n.x);

    // ── Plasma filaments: fbm layered on sphere surface
    vec2 sph = vec2(phi / TAU + 0.5, theta / PI);
    float f1 = fbm(sph * 4.0 + vec2(T * 0.12, T * 0.07));
    float f2 = fbm(sph * 7.0 - vec2(T * 0.09, T * 0.15) + f1);
    float f3 = fbm(sph * 12.0 + vec2(T * 0.06) + f2 * 0.5);

    // Ribbon mask - sharp bright streaks
    float ribbon = pow(abs(sin(f2 * PI * 3.0 + T * 0.4)), 8.0);
    ribbon += pow(abs(sin(f3 * PI * 5.0 - T * 0.3)), 12.0) * 0.5;

    // Core glow - hot center
    float core = exp(-r * r * 3.5) * (1.0 + u_energy * 2.0);

    // ── Color palette (IMAGE REFERENCE: gold/white core, blue/violet ribbons) ──
    // Deep interior: gold and white heat
    vec3 coreColor = mix(
      vec3(1.0, 0.65, 0.1),   // gold
      vec3(1.0, 0.95, 0.85),  // white hot
      core
    );
    // Ribbon color: electric blue → violet → rose
    float hue = fract(f1 * 0.5 + T * 0.04);
    vec3 ribbonColor = mix(
      mix(vec3(0.1, 0.5, 1.0), vec3(0.6, 0.2, 1.0), hue),        // blue→violet
      mix(vec3(0.6, 0.2, 1.0), vec3(1.0, 0.2, 0.5), hue * 2.0 - 1.0), // violet→rose
      step(0.5, hue)
    );

    // Depth fade - brighter toward front
    float depth = (1.0 - fi) * 0.6 + 0.4;

    // Accumulate
    vec3 contrib = (ribbonColor * ribbon * 2.5 + coreColor * core * 4.0) * depth;

    // When thinking: add turbulent energy bursts
    float burst = u_energy * pow(abs(sin(f3 * PI * 8.0 + T * 1.2)), 6.0) * 3.0;
    contrib += vec3(0.8, 0.4, 1.0) * burst * depth;

    plasma += contrib / 20.0;
    alpha_acc += (ribbon * 0.15 + core * 0.3 + burst * 0.1) / 20.0;
  }

  // ── GLASS SHELL ─────────────────────────────────────────────────────────
  // Thin iridescent shell that refracts the interior
  vec3 shellColor = mix(
    vec3(0.3, 0.5, 1.0),   // inner: cool blue
    vec3(0.9, 0.7, 1.0),   // edge: pale violet
    fresnel
  );

  // Specular highlights - two sharp caustic points
  vec3 L1 = normalize(vec3(-0.6, 0.8, 0.5));
  float spec1 = pow(max(dot(hitN, normalize(L1 - rd)), 0.0), 280.0) * 3.0;
  vec3 L2 = normalize(vec3(0.5, -0.3, 0.8));
  float spec2 = pow(max(dot(hitN, normalize(L2 - rd)), 0.0), 120.0) * 1.2;

  // Rim glow - backlit halo
  float rim = pow(fresnel, 1.5) * 0.8;
  vec3 rimColor = mix(vec3(0.2, 0.4, 1.0), vec3(0.8, 0.3, 1.0), sin(T * 0.3) * 0.5 + 0.5);

  // ── COMPOSITE ───────────────────────────────────────────────────────────
  vec3 col = plasma * 1.4;
  col += shellColor * (fresnel * 0.3 + rim);
  col += vec3(1.0, 0.97, 0.9) * (spec1 + spec2);

  // Tone map with filmic curve
  col = col / (col + vec3(0.7));
  col = pow(max(col, 0.0), vec3(0.85));

  // Alpha: glass shell edge + interior density
  float alpha = edgeAA * clamp(
    fresnel * 0.6 + alpha_acc * 2.5 + spec1 * 0.3,
    0.0, 1.0
  );

  gl_FragColor = vec4(col * alpha, alpha);
}
`;

class OrbSpring {
  x = 0; y = 0; vx = 0; vy = 0; tx = 0; ty = 0;
  step(stiffness = 0.062, damping = 0.86) {
    this.vx += (this.tx - this.x) * stiffness; this.vy += (this.ty - this.y) * stiffness;
    this.vx *= damping; this.vy *= damping;
    this.x += this.vx; this.y += this.vy;
  }
}

function WatsonOrb({ size, thinking }: { size: number; thinking?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spring = useRef(new OrbSpring());
  const raf = useRef(0);
  const energyRef = useRef(0);
  const thinkingRef = useRef(!!thinking);

  useEffect(() => {
    thinkingRef.current = !!thinking;
  }, [thinking]);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const uT      = gl.getUniformLocation(prog, "u_t");
    const uR      = gl.getUniformLocation(prog, "u_res");
    const uMouse  = gl.getUniformLocation(prog, "u_mouse");
    const uEnergy = gl.getUniformLocation(prog, "u_energy");

    const onMove = (e: MouseEvent) => {
      spring.current.tx = (e.clientX / window.innerWidth  - 0.5) * 2.2;
      spring.current.ty = (e.clientY / window.innerHeight - 0.5) * 2.2;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (ts: number) => {
      const targetEnergy = thinkingRef.current ? 1 : 0;
      energyRef.current += (targetEnergy - energyRef.current) * 0.035;
      spring.current.step(0.058, 0.88);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, ts * 0.001);
      gl.uniform1f(uEnergy, energyRef.current);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform2f(uMouse, spring.current.x, spring.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); };
  }, [size]);
  const glowInset = thinking ? -size * 0.6 : -size * 0.25;
  const glowBlur = size * (thinking ? 0.12 : 0.05);
  const glowBg = thinking
    ? "radial-gradient(circle, rgba(200,140,20,0.3) 0%, rgba(100,60,255,0.2) 40%, transparent 70%)"
    : "radial-gradient(circle, rgba(100,80,255,0.15) 0%, rgba(200,140,20,0.08) 50%, transparent 70%)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Outer atmosphere */}
      <div style={{
        position: "absolute",
        inset: glowInset,
        borderRadius: "50%",
        background: glowBg,
        animation: "none",
        pointerEvents: "none",
        transition: "all 0.8s ease",
        filter: `blur(${glowBlur}px)`,
      }} />
      <canvas ref={ref} style={{ width: size, height: size, borderRadius: "50%", display: "block", position: "relative", zIndex: 1 }} />
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
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 10, letterSpacing: "-.02em" }}>
          {type.watson.split("?")[0] + "?"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.65, fontWeight: 300 }}>
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
      <div style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, rgba(255,180,50,0.95), rgba(120,60,220,0.8) 55%, rgba(180,40,120,0.6))",
        flexShrink: 0,
        boxShadow: "0 0 12px rgba(100,120,255,0.4)",
        animation: "watsonPulse 2s ease-in-out infinite",
      }} />
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
        console.error("Failed to save output:", saveError);
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
      background: "var(--bg)", overflow: "hidden", fontFamily: "var(--font)",
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
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em" }}>
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
