import { useState } from "react";
import { X } from "lucide-react";

interface Agent {
  name: string;
  role: string;
  description: string;
}

interface Division {
  title: string;
  color: string;
  agents: Agent[];
}

const DIVISIONS: Division[] = [
  {
    title: "Watch Division",
    color: "var(--cornflower)",
    agents: [
      { name: "Reed", role: "First Listener", description: "Named for the reading that built him. Built for the writing that matters." },
      { name: "Sentinel", role: "Category Intelligence", description: "Always monitoring your market." },
      { name: "Scout", role: "Special Intelligence", description: "Deploys on command for specific recon." },
    ],
  },
  {
    title: "Strategic Business Unit",
    color: "var(--gold)",
    agents: [
      { name: "Victor", role: "Results Architect", description: "Frames every decision with Outcome, Purpose, Action, Timing." },
      { name: "Evan", role: "Design Thinking", description: "Who is this for and what job does it do?" },
      { name: "Josh", role: "Category Designer", description: "Different game or competing on someone else's terms?" },
      { name: "Lee", role: "Brand Architect", description: "Does this build the brand you want?" },
      { name: "Guy", role: "Business Development", description: "Natural next step for the reader?" },
      { name: "Ward", role: "Sales", description: "Right people say yes, wrong people disqualify?" },
      { name: "Monty", role: "Deal Maker", description: "Structure and terms." },
      { name: "Basil", role: "Visibility Auditor", description: "Builds authority or spends it?" },
      { name: "Scott", role: "Market Realist", description: "Does the market actually want this?" },
      { name: "Dana", role: "Red Team Lead", description: "Best argument against this?" },
      { name: "Forecast", role: "Final Gut Check", description: "Would you click? Would you share?" },
    ],
  },
  {
    title: "Quality Checkpoint Officers",
    color: "#50c8a0",
    agents: [
      { name: "Deduplication", role: "Checkpoint 0", description: "Zero redundant content." },
      { name: "Research Validation", role: "Checkpoint 1", description: "100% verified claims." },
      { name: "Voice Authenticity", role: "Checkpoint 2", description: ">95% match to your voice." },
      { name: "Engagement Optimization", role: "Checkpoint 3", description: "7-second test: earn the read or don't ship." },
      { name: "SLOP Detection", role: "Checkpoint 4", description: "Zero AI fingerprints." },
      { name: "Editorial Excellence", role: "Checkpoint 5", description: "Publication-grade plus the Stranger Test." },
      { name: "Perspective & Risk", role: "Checkpoint 6", description: "Cultural sensitivity." },
      { name: "NVC Review", role: "Part of Checkpoint 6", description: "Nonviolent communication." },
    ],
  },
  {
    title: "Operations",
    color: "#A080F5",
    agents: [
      { name: "Sara", role: "Chief of Staff", description: "Composes everything." },
      { name: "Martin", role: "CTO", description: "System architecture." },
      { name: "Riley", role: "Build Master", description: "Tracks versions and dependencies." },
      { name: "Diane", role: "Documentation", description: "System memory." },
    ],
  },
  {
    title: "Wrap Division",
    color: "#E8B4A0",
    agents: [
      { name: "Byron", role: "Humanization", description: "Final human pass before ship." },
      { name: "Mira", role: "Format and Presentation", description: "Packaging." },
      { name: "Dmitri", role: "Platform Optimization", description: "Native to every channel." },
    ],
  },
  {
    title: "Training",
    color: "#64748B",
    agents: [
      { name: "Sande", role: "The Trainer", description: "See One, Do One, Teach One." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL VIEW DATA
// ─────────────────────────────────────────────────────────────────────────────

interface DetailView {
  id: string;
  title: string;
  tag: string;
  content: React.ReactNode;
}

const REED_CAPABILITIES = [
  { name: "Voice Check", desc: "Compares your draft against your Voice DNA. Flags phrases that do not sound like you." },
  { name: "Strategic Advice", desc: "Surfaces the advisors that matter: Category Design, Positioning, Market Reality." },
  { name: "Challenge This", desc: "Takes the other side and surfaces the strongest counter-argument." },
  { name: "Audience Check", desc: "Are you writing for the right person? Asks before you get too far in." },
  { name: "What Is Next", desc: "Reads where you are in the session and tells you exactly where to focus." },
  { name: "Editorial Review", desc: "Is this ready? Reads the draft as an adversarial editor." },
];

const CHECKPOINTS = [
  { num: 1, name: "Deduplication", agent: "Echo", desc: "Zero redundant content. Catches repeated ideas across paragraphs and sections." },
  { num: 2, name: "Research Validation", agent: "Priya", desc: "Every factual claim verified with two independent sources. Hard-blocks on unverified assertions." },
  { num: 3, name: "Voice Authenticity", agent: "Jordan", desc: "Scores draft against Voice DNA. Target: 95% match or above." },
  { num: 4, name: "Engagement Optimization", agent: "David", desc: "7-second test. If the opening does not earn the read, the piece does not ship." },
  { num: 5, name: "SLOP Detection", agent: "Elena", desc: "Zero AI fingerprints. Catches phrases, patterns, and structures that read as machine-generated." },
  { num: 6, name: "Editorial Excellence", agent: "Natasha", desc: "Publication-grade writing plus the Stranger Test. Would a stranger who has never heard of you still get value?" },
  { num: 7, name: "Perspective and Risk", agent: "Christopher", desc: "Cultural sensitivity, blind spots, and the nonviolent communication review." },
];

function ReedDetailContent() {
  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20 }}>
        <p style={{ margin: "0 0 12px" }}>Reed is named for what he does: he reads. Deeply, across your industry, your competitors, your audience's conversations. He distills what matters into signal you can act on.</p>
        <p style={{ margin: "0 0 12px" }}>Reed does not just surface information. He challenges it. He is skeptical of first answers, because the first answer is almost never the right one. He pushes back not to be difficult, but because he has seen enough weak premises dressed up as insight to know the difference.</p>
        <p style={{ margin: "0 0 12px" }}>Reed is not an assistant. He is a thought partner. He asks better questions than most people do. He remembers what you have said. He connects what you are writing to what is happening in your space. When your writing is strong, he tells you. When it is not, he tells you that too.</p>
        <p style={{ margin: 0, fontWeight: 600 }}>Named for the reading that built him. Built for the writing that matters.</p>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
        CAPABILITIES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {REED_CAPABILITIES.map((cap, i) => (
          <div key={i} style={{ padding: "10px 12px", border: "1px solid var(--glass-border)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{cap.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{cap.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function CheckpointsDetailContent() {
  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20 }}>
        Every piece of content passes through seven sequential quality checkpoints before it can be approved for publication. Each checkpoint is a hard gate: if the piece fails, it cannot advance until the issue is resolved.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CHECKPOINTS.map((cp) => (
          <div key={cp.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: "#0D1B2A",
              color: "#F5C642", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {cp.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {cp.name} <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>({cp.agent})</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{cp.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ImpactScoreDetailContent() {
  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20 }}>
        A 1-100 composite score that predicts the strength of a piece before it publishes. The publication threshold is 75. Below 75, the piece is flagged for revision.
      </div>
      <div style={{
        background: "#F0F7FF", borderLeft: "3px solid #4A90D9",
        padding: "10px 14px", borderRadius: "0 6px 6px 0",
      }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          The Impact Score is not a grade. It is a prediction. It asks: given everything Reed knows about your voice, your audience, and your competitive landscape, how likely is this piece to move the needle?
        </div>
      </div>
    </>
  );
}

function HumanVoiceTestDetailContent() {
  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20 }}>
        An eight-vector adversarial reader simulation. The test creates eight synthetic readers with different objections, attention spans, and expectations. If any vector fails, the piece is hard-blocked from Approve.
      </div>
      <div style={{
        background: "#FFFBEB", borderLeft: "3px solid #F5C642",
        padding: "10px 14px", borderRadius: "0 6px 6px 0",
      }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          This is the final gate. Everything else can be iterated. The Human Voice Test is pass-fail. If a piece does not sound like a human wrote it with conviction, it does not ship.
        </div>
      </div>
    </>
  );
}

const DETAIL_VIEWS: DetailView[] = [
  { id: "reed", title: "Reed", tag: "FIRST LISTENER", content: <ReedDetailContent /> },
  { id: "checkpoints", title: "7 Quality Checkpoints", tag: "QUALITY SYSTEM", content: <CheckpointsDetailContent /> },
  { id: "impact-score", title: "Impact Score", tag: "SCORING SYSTEM", content: <ImpactScoreDetailContent /> },
  { id: "human-voice-test", title: "Human Voice Test", tag: "ADVERSARIAL SYSTEM", content: <HumanVoiceTestDetailContent /> },
];

// Clickable items in the main grid that map to detail views
const CLICKABLE_AGENTS: Record<string, string> = {
  "Reed": "reed",
};
const CLICKABLE_SYSTEM_ITEMS = [
  { label: "7 Quality Checkpoints", detailId: "checkpoints" },
  { label: "Impact Score", detailId: "impact-score" },
  { label: "Human Voice Test", detailId: "human-voice-test" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface MeetTheTeamProps {
  onClose: () => void;
  activeAgents?: string[];
}

export default function MeetTheTeam({ onClose, activeAgents = [] }: MeetTheTeamProps) {
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const detailView = activeDetail ? DETAIL_VIEWS.find(d => d.id === activeDetail) : null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Meet the Team"
        style={{
          position: "fixed", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%", maxWidth: 640, maxHeight: "85vh",
          overflow: "auto", background: "var(--glass-card)",
          borderRadius: 16, border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
          backdropFilter: "var(--glass-blur-light)",
          WebkitBackdropFilter: "var(--glass-blur-light)",
          zIndex: 9999, fontFamily: "'Afacad Flux', sans-serif",
          padding: "28px 32px",
        }}
      >
        {/* ── Detail View ── */}
        {detailView ? (
          <>
            <button
              onClick={() => setActiveDetail(null)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontSize: 10, fontWeight: 700, color: "#4A90D9",
                textTransform: "uppercase", letterSpacing: "0.05em",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 4,
                fontFamily: "inherit",
              }}
            >
              &lt; BACK TO DISCOVER
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0D1B2A", margin: "0 0 4px" }}>
              {detailView.title}
            </h2>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#94A3B8",
              textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 20,
            }}>
              {detailView.tag}
            </div>
            {detailView.content}
          </>
        ) : (
          /* ── Main Grid ── */
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                  40 Specialists
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
                  Every piece runs through the full team.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-tertiary)" }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* System feature cards */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {CLICKABLE_SYSTEM_ITEMS.map((item) => (
                <button
                  key={item.detailId}
                  onClick={() => setActiveDetail(item.detailId)}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    border: "1px solid var(--glass-border)", background: "var(--glass-card)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    color: "var(--text-primary)", fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#4A90D9"; e.currentTarget.style.color = "#4A90D9"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {DIVISIONS.map((div) => (
              <div key={div.title} style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: div.color, marginBottom: 10,
                }}>
                  {div.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {div.agents.map((agent) => {
                    const isActive = activeAgents.includes(agent.name);
                    const detailId = CLICKABLE_AGENTS[agent.name];
                    const isClickable = !!detailId;
                    return (
                      <div
                        key={agent.name}
                        onClick={isClickable ? () => setActiveDetail(detailId) : undefined}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "8px 12px", borderRadius: 8,
                          background: isActive ? `${div.color}10` : "transparent",
                          border: isActive ? `1px solid ${div.color}30` : "1px solid transparent",
                          transition: "all 0.15s ease",
                          cursor: isClickable ? "pointer" : "default",
                        }}
                        onMouseEnter={isClickable ? (e) => { e.currentTarget.style.background = `${div.color}10`; } : undefined}
                        onMouseLeave={isClickable ? (e) => { if (!isActive) e.currentTarget.style.background = "transparent"; } : undefined}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: `${div.color}18`, color: div.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {agent.name.charAt(0)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {agent.name}
                            <span style={{ fontWeight: 400, color: "var(--text-tertiary)", marginLeft: 8, fontSize: 12 }}>{agent.role}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{agent.description}</div>
                        </div>
                        {isActive && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: div.color, flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
