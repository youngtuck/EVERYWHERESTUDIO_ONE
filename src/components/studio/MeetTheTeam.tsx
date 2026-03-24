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
      { name: "Watson", role: "First Listener", description: "Every idea is heard here first." },
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
      { name: "Betterish", role: "Final Gut Check", description: "Would you click? Would you share?" },
    ],
  },
  {
    title: "Quality Checkpoint Officers",
    color: "#50c8a0",
    agents: [
      { name: "Echo", role: "Checkpoint 0: Deduplication", description: "Zero redundant content." },
      { name: "Priya", role: "Checkpoint 1: Research", description: "100% verified claims." },
      { name: "Jordan", role: "Checkpoint 2: Voice DNA", description: ">95% match to your voice." },
      { name: "David", role: "Checkpoint 3: Hook", description: "7-second test: earn the read or don't ship." },
      { name: "Elena", role: "Checkpoint 4: SLOP Detection", description: "Zero AI fingerprints." },
      { name: "Natasha", role: "Checkpoint 5: Editorial Excellence", description: "Publication-grade plus the Stranger Test." },
      { name: "Marcus", role: "Checkpoint 6a: Perspective", description: "Cultural sensitivity." },
      { name: "Marshall", role: "Checkpoint 6b: NVC Review", description: "Nonviolent communication." },
    ],
  },
  {
    title: "Operations",
    color: "#A080F5",
    agents: [
      { name: "Sara", role: "Chief of Staff", description: "Orchestrates everything." },
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

interface MeetTheTeamProps {
  onClose: () => void;
  activeAgents?: string[];
}

export default function MeetTheTeam({ onClose, activeAgents = [] }: MeetTheTeamProps) {
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
          overflow: "auto", background: "var(--surface)",
          borderRadius: 16, border: "1px solid var(--line)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          zIndex: 9999, fontFamily: "'Afacad Flux', sans-serif",
          padding: "28px 32px",
        }}
      >
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
                return (
                  <div
                    key={agent.name}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 12px", borderRadius: 8,
                      background: isActive ? `${div.color}10` : "transparent",
                      border: isActive ? `1px solid ${div.color}30` : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
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
      </div>
    </>
  );
}
