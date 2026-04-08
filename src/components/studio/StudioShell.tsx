import { useState, useRef, useEffect, createContext, useContext, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import StudioSidebar from "./StudioSidebar";
import StudioTopBar from "./StudioTopBar";
import { CommandPalette } from "./CommandPalette";
import MobileBottomNav from "./MobileBottomNav";
import { useMobile } from "../../hooks/useMobile";
import Logo from "../Logo";
import NotificationBell from "./NotificationBell";
import { REED_STAGE_CHIPS } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// SHELL CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface ShellCtx {
  dashOpen: boolean;
  setDashOpen: (v: boolean) => void;
  advisorsOpen: boolean;
  setAdvisorsOpen: (v: boolean) => void;
  discoverOpen: boolean;
  setDiscoverOpen: (v: boolean) => void;
  dashContent: React.ReactNode | null;
  setDashContent: (node: React.ReactNode | null) => void;
  activeDashTab: "feedback" | "reed" | "help";
  setActiveDashTab: (tab: "feedback" | "reed" | "help") => void;
  feedbackContent: React.ReactNode | null;
  setFeedbackContent: (node: React.ReactNode | null) => void;
  reedPrefill: string;
  setReedPrefill: (text: string) => void;
  reedThread: Array<{ type: "user" | "reed" | "note"; text: string; from?: string; to?: string }>;
  setReedThread: (fn: (prev: any[]) => any[]) => void;
}

const ShellContext = createContext<ShellCtx>({
  dashOpen: true,
  setDashOpen: () => {},
  advisorsOpen: false,
  setAdvisorsOpen: () => {},
  discoverOpen: false,
  setDiscoverOpen: () => {},
  dashContent: null,
  setDashContent: () => {},
  activeDashTab: "feedback" as const,
  setActiveDashTab: () => {},
  feedbackContent: null,
  setFeedbackContent: () => {},
  reedPrefill: "",
  setReedPrefill: () => {},
  reedThread: [],
  setReedThread: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVISORS CONTENT, context-aware per page (matches wireframe advContent object)
// ─────────────────────────────────────────────────────────────────────────────

type AdvisorCard = { role: string; text: string };
type AdvisorContext = { rec: string; cards: AdvisorCard[] };

const ADVISOR_CONTENT: Record<string, AdvisorContext> = {
  watch: {
    rec: "You are tracking 71 sources across 5 categories. Three blind spots surfaced this week: no podcast coverage of AI governance, no Substack writers in the executive development space, and zero coverage of the \"fractional executive\" movement which is adjacent to your positioning.",
    cards: [
      { role: "Positioning", text: "Craig Mod and Cal Newport are your only tracked competitors. Both are productivity writers. Consider adding someone writing specifically about executive communication, that is your actual lane." },
      { role: "Coverage Gaps", text: "Your keyword cluster skews toward AI and coaching. No one in your sources is covering the intersection of both. That gap is yours to own, and nobody is watching it yet." },
      { role: "Signals", text: "Three thought leaders you follow went quiet this week simultaneously. That pattern sometimes precedes a major publication. Worth watching if something drops in the next 72 hours." },
    ],
  },
  work: {
    rec: "Three advisors flag the close as the weakest element. The argument earns agreement, but agreement is not action. The piece needs one sharper sentence before it ends. Everything else holds.",
    cards: [
      { role: "Strategy", text: "The infrastructure framing is ownable. Competitors are writing about time management, you are writing about systems. Stay there. Do not soften the diagnosis in the close." },
      { role: "Conversion", text: "The reader needs one more concrete image of what infrastructure looks like. A single sharp example closes the gap between interest and action." },
      { role: "Sales", text: "A skeptic finishes this piece nodding, but not moving. The close is directional, not decisive. Consider whether the last sentence should point somewhere specific." },
    ],
  },
  wrap: {
    rec: "Before you wrap, consider the distribution sequence. LinkedIn post first builds momentum. Newsletter 48 hours later catches the second wave. Podcast last, it has the longest shelf life.",
    cards: [
      { role: "Timing", text: "Saturday morning posts on LinkedIn get 40% lower engagement than Tuesday–Thursday. If you are wrapping now, consider scheduling LinkedIn for Tuesday." },
      { role: "Sequencing", text: "Your Sunday Story should go out Sunday. The LinkedIn post should tease it Friday. That sequence has driven the highest newsletter open rates in your category." },
      { role: "Audience", text: "The podcast script reads well but opens cold. Podcast listeners need a warmer entry, one personal sentence before the hook lands." },
    ],
  },
};

function getAdvisorCtx(pathname: string): { ctx: AdvisorContext; stageLabel: string } {
  if (pathname.includes("/watch")) return { ctx: ADVISOR_CONTENT.watch, stageLabel: "Watch" };
  if (pathname.includes("/wrap")) return { ctx: ADVISOR_CONTENT.wrap, stageLabel: "Wrap" };
  return { ctx: ADVISOR_CONTENT.work, stageLabel: (window as any).__ewWorkStage || "Work" };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER DATA, full 17-item grid matching wireframe v7.23
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoverItem {
  id: string;
  color: string;
  icon: string;
  name: string;
  desc: string;
  rationale: string;
  detail: string;
  launchLabel: string;
  route: string | null;
}

const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: "reed", color: "#6B8FD4", icon: "✦", name: "Reed",
    desc: "Interview and excavate your thinking.",
    rationale: "Your thinking partner before the blank page.",
    detail: "Reed runs in the Intake stage of Work. It opens as a conversation, not a form.\n\nYou talk. Reed listens and asks questions, pushing deeper, surfacing the specifics, finding the angles you did not know were there. When the session is done, Reed hands off a structured brief to Outline.\n\nHow to use it: Go to Work and start typing or speaking. You do not need to know what you want to write. Start with what is on your mind and Reed will help you find the shape of the idea.\n\nThe output is yours because the input was yours. Reed does not invent, it excavates.",
    launchLabel: "Open Intake", route: "/studio/work",
  },
  {
    id: "voicedna", color: "#D4A832", icon: "◆", name: "Voice DNA",
    desc: "Capture your voice signature.",
    rationale: "Three layers + subconscious markers.",
    detail: "Voice DNA lives in Preferences. It is the foundation that every session builds on.\n\nIt captures your communication signature across three layers:\n\nVoice Markers, sentence structure, rhythm, pacing. How you move through an argument.\n\nValue Markers, what you believe and stand for. The positions you hold without being asked.\n\nPersonality Markers, how you show up. Warmth, edge, humor, gravity.\n\nThere is also a fourth layer, subconscious patterns that most people cannot see in their own writing: pronoun habits, sentence openings, conjunction use, linguistic variance.\n\nRun it once to set your baseline. The system updates it over time.",
    launchLabel: "Go to Preferences", route: "/studio/settings/voice",
  },
  {
    id: "impact-score", color: "#4CAF82", icon: "⊕", name: "Impact Score",
    desc: "Score your draft before publishing.",
    rationale: "900/1000 is the publication-ready threshold.",
    detail: "Draft Score runs automatically in the Review stage. You do not invoke it manually, it is always running in the background as you edit.\n\nThe score is out of 1,000. Publication-ready threshold is 900.\n\nBelow 900, the system tells you exactly what is weak and routes the problem to the right stage. A voice issue sends you back to Edit. A factual flag surfaces in the draft. A structure problem points back to Outline.\n\nThe score is not a grade. It is a map. 900 means the piece is ready. Under 900 means there is something specific left to fix.",
    launchLabel: "Go to Review", route: "/studio/work",
  },
  {
    id: "watch", color: "#0D1B2A", icon: "◉", name: "Watch",
    desc: "Your overnight market intelligence briefing.",
    rationale: "Ranked signals, ready when you arrive.",
    detail: "Watch is your intelligence briefing. It runs overnight and is ready when you open Studio in the morning.\n\nIt scans your market, tracks competitor activity, and surfaces the opportunities most relevant to your positioning, ranked in order of relevance. What appears first matters most right now.\n\nWatch pulls from the sources and topics you have configured in your Watch settings. The more context you give it, the more precise the briefing becomes.\n\nEach signal includes a suggested action: use it in Work, note it in the Pipeline, or dismiss it. Nothing sits unread for long.",
    launchLabel: "Go to Watch", route: "/studio/watch",
  },
  {
    id: "work", color: "#6B8FD4", icon: "✎", name: "Work",
    desc: "Where ideas become drafts.",
    rationale: "Five stages: Intake, Outline, Edit, Review, Export.",
    detail: "Work is where ideas become drafts. It moves in five stages:\n\nIntake, You talk, Reed listens. The idea gets excavated and shaped.\n\nOutline, The structure gets built. You choose the angle, the format, the arc.\n\nEdit, The draft appears. You write, refine, and resolve flags. Voice match runs in real time.\n\nReview, The draft is read by an adversarial reader. Flags surface. Score runs.\n\nExport, The final draft is saved to your session and sent to Wrap.",
    launchLabel: "Go to Work", route: "/studio/work",
  },
  {
    id: "wrap", color: "#C49A20", icon: "□", name: "Wrap",
    desc: "Turn drafts into deliverables.",
    rationale: "Choose a format, pick a template, publish.",
    detail: "Wrap is where drafts become deliverables. You choose a format, pick a template, and the system produces the final output, formatted, styled, and ready to publish or send.\n\nTemplates include: LinkedIn Post, Newsletter, Podcast Script, Sunday Story, Executive Brief, One-Pager, and The Edition (full package).\n\nYou can add and edit templates from the Wrap dashboard. Every template can be customized for your brand and your typical use cases.\n\nWrap always saves to your session files. Download, copy to clipboard, or send directly from here.",
    launchLabel: "Go to Wrap", route: "/studio/wrap",
  },
  {
    id: "branddna", color: "#E8834A", icon: "⊞", name: "Brand DNA",
    desc: "Extract your brand from any source.",
    rationale: "URL, PDF, or uploaded brand guide.",
    detail: "Brand DNA is set up in Project Files. You give it a URL, a PDF, or an uploaded brand guide and it extracts your complete brand profile.\n\nThat profile feeds into everything the system produces for your project: the voice calibration, the format choices, the templates, the review criteria.\n\nWhen Brand DNA is present, every output is calibrated to your brand. When it is absent, the system is working without that context.\n\nSet it up once when you start a new project. Update it when the brand changes. You will feel the difference immediately.",
    launchLabel: "Go to Project Files", route: "/studio/resources",
  },
  {
    id: "execbrief", color: "#9B72D4", icon: "◇", name: "Executive Brief",
    desc: "Wrap any session into a branded brief.",
    rationale: "Decision system. 25% filter. 3 sections max.",
    detail: "Executive Brief is a template option in Wrap. Once you have an exported draft, you can wrap it as an Executive Brief instead of a standard post or newsletter.\n\nThe Brief format applies a strict filter: only the most essential information survives. Three sections maximum. Every sentence earns its place.\n\nIt is designed for the person who needs to act on information, not read through it. Use it for stakeholder deliverables, client summaries, or any context where the reader has 90 seconds and needs to leave with clarity.\n\nSelect it from the template list in Wrap after you have finished Work.",
    launchLabel: "Go to Wrap", route: "/studio/wrap",
  },
  {
    id: "edition", color: "#C49A20", icon: "✦", name: "The Edition",
    desc: "Full publication package from one draft.",
    rationale: "Every format out from one approved draft.",
    detail: "The Edition is a Wrap template that produces your complete publication package from a single approved draft.\n\nOne draft in. Every format out, LinkedIn post, newsletter, podcast script, Sunday Story, show notes, image prompts, and more.\n\nEach format is adapted to its channel, not just reformatted, but rewritten for the platform and the reader who lives there. A LinkedIn post reads like LinkedIn. A podcast script sounds like audio.\n\nSelect The Edition from the template list in Wrap. It runs after you have completed Work and exported your draft.",
    launchLabel: "Go to Wrap", route: "/studio/wrap",
  },
  {
    id: "catalog", color: "#64748B", icon: "▣", name: "The Catalog",
    desc: "Your completed session archive.",
    rationale: "Every session, all its files, sorted by date.",
    detail: "The Catalog is your session archive. Every Work session you complete is saved here automatically, with all its exported files.\n\nClick any session to see its files, reopen it in Work, or rename it. Sessions are sorted by date, most recent first.\n\nThe Catalog is read-only during active sessions. When you are done with Work and Wrap, your session appears here.",
    launchLabel: "Go to Catalog", route: "/studio/outputs",
  },
  {
    id: "pipeline", color: "#4A90D9", icon: "◌", name: "The Pipeline",
    desc: "Ideas and signals waiting for the right moment.",
    rationale: "Parked ideas and watched signals.",
    detail: "The Pipeline is your idea holding area. Two types of items live here:\n\nSignals, things Watch surfaced that you are not ready to act on yet but do not want to lose.\n\nParked ideas, topics you want to write about when the timing is right, when a dependency resolves, or when you have the research you need.\n\nPipeline items surface on your Home screen when conditions suggest the timing is right. You can activate any item directly into a new Work session.",
    launchLabel: "Go to Pipeline", route: "/studio/lot",
  },
  {
    id: "files", color: "#E8834A", icon: "▤", name: "Project Files",
    desc: "Your project context library.",
    rationale: "Brand DNA, Voice DNA, reference docs.",
    detail: "Project Files is your project context library. Files here are available to every Work session in this project.\n\nCommon files: Brand DNA, Voice DNA, reference documents, client guidelines, research.\n\nYou can upload files, view them, replace them, or remove them from the project. Files uploaded during a session are session-only unless you move them here.",
    launchLabel: "Go to Project Files", route: "/studio/resources",
  },
  {
    id: "prefs", color: "#64748B", icon: "⚙", name: "Preferences",
    desc: "Configure how Studio works for you.",
    rationale: "Watch sources, Voice DNA, default formats.",
    detail: "Preferences is where you configure how Studio works for you.\n\nSet up Voice DNA to capture your communication signature. Configure Watch sources, which publications, people, and topics you want tracked. Set your default output formats and platform preferences.\n\nPreferences apply to every session in this project. Change them any time from the rail.",
    launchLabel: "Go to Preferences", route: "/studio/settings",
  },
  {
    id: "advisors", color: "#4A90D9", icon: "☻", name: "Advisors",
    desc: "Strategic guidance at every stage.",
    rationale: "Available in Watch, Work, and Wrap.",
    detail: "Advisors is a panel of strategic perspectives available at every stage of Watch, Work, and Wrap.\n\nWhen you open Advisors, you get a synthesized recommendation based on your current stage and content, plus individual perspectives from different strategic lenses: positioning, audience, timing, conversion, and more.\n\nEach card shows a specific observation and lets you agree or skip. \"Apply recommendations\" pushes accepted advice into your current stage.\n\nAdvisors is not available in Catalog, Pipeline, Project Files, or Preferences, it only activates where there is active content to advise on.",
    launchLabel: "Open Advisors", route: null,
  },
  {
    id: "dashboard", color: "#64748B", icon: "◼", name: "Dashboard",
    desc: "Context panel for your current stage.",
    rationale: "Templates, outputs, files, and actions.",
    detail: "The Dashboard is the context panel on the right side of every screen. It shows information and actions relevant to whatever stage you are in.\n\nIn Intake: output format selection, templates, session files, project files.\nIn Edit: voice match score, flag counts, word count, output queue.\nIn Review: improvement cards, per-format scores, export controls.\nIn Wrap: source file, template selection, export options.\nIn Watch: sources being tracked, topic configuration.\n\nClick Dashboard in the top bar to show or hide it. It opens automatically when you enter Work or Wrap.",
    launchLabel: "Toggle Dashboard", route: null,
  },
  {
    id: "project", color: "#0D1B2A", icon: "◇", name: "What is a Project?",
    desc: "One client or one voice. A container.",
    rationale: "Projects hold files, settings, and sessions.",
    detail: "A Project is a container for one client, one voice, or one publishing identity.\n\nEverything inside a project shares the same context: the Brand DNA, the Voice DNA, the Project Files, the Watch configuration, and the Preferences.\n\nWhen you switch projects using the dropdown in the upper left, Studio switches to that context. Different templates, different voice calibration, different tracked sources.\n\nExamples of projects: a coaching client, your personal brand, a company you consult for, a podcast you produce.\n\nSessions, the Catalog, and the Pipeline all live inside a project. They do not cross project lines.",
    launchLabel: "Got it", route: null,
  },
  {
    id: "session", color: "#6B8FD4", icon: "✎", name: "What is a Session?",
    desc: "One idea, worked all the way through.",
    rationale: "A session is one run through Watch, Work, Wrap.",
    detail: "A Session is one idea worked all the way through, from Intake to Export.\n\nEvery time you start something new in Work, you are starting a session. When you finish and export, the session is saved to the Catalog with all its output files.\n\nSessions are not drafts. A draft is what lives in Edit. A session is the complete record: what you brought in, what Reed surfaced, what you wrote, what you exported, and what formats you produced.\n\nYou can resume a session any time from the Start screen or from the Catalog. Sessions do not expire. Everything you produced is there.",
    launchLabel: "Start a session", route: "/studio/work",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHELL
// ─────────────────────────────────────────────────────────────────────────────

export default function StudioShell() {
  const isMobile = useMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashOpen, setDashOpen] = useState(true);
  const [advisorsOpen, setAdvisorsOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [dashContent, setDashContent] = useState<React.ReactNode | null>(null);
  const [activeDashTab, setActiveDashTab] = useState<"feedback" | "reed" | "help">("feedback");
  const [feedbackContent, setFeedbackContent] = useState<React.ReactNode | null>(null);
  const [reedPrefill, setReedPrefill] = useState("");
  const [reedThread, setReedThread] = useState<Array<{ type: "user" | "reed" | "note"; text: string; from?: string; to?: string }>>([]);

  const { user } = useAuth();
  const [outputCount, setOutputCount] = useState<number>(1); // default 1 so returning users see full nav
  useEffect(() => {
    if (!user) return;
    supabase.from("outputs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { if (typeof count === "number") setOutputCount(count); });
  }, [user]);

  return (
    <ShellContext.Provider value={{
      dashOpen, setDashOpen,
      advisorsOpen, setAdvisorsOpen,
      discoverOpen, setDiscoverOpen,
      dashContent, setDashContent,
      activeDashTab, setActiveDashTab,
      feedbackContent, setFeedbackContent,
      reedPrefill, setReedPrefill,
      reedThread, setReedThread,
    }}>
      <div style={{
        display: "flex", height: "100vh",
        background: "var(--bg)", fontFamily: "var(--font)", overflow: "hidden",
      }}>
        <CommandPalette />

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 39 }} />
        )}

        {/* Left Rail */}
        <div style={
          isMobile
            ? { position: "fixed", top: 0, left: 0, height: "100vh", width: 220, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.18s ease", zIndex: 40 }
            : { position: "relative", height: "100vh", width: sidebarCollapsed ? 52 : 220, flexShrink: 0, zIndex: 1, transition: "width 0.18s ease" }
        }>
          <StudioSidebar
            collapsed={!isMobile && sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed(c => !c)}
            onMobileClose={isMobile ? () => setSidebarOpen(false) : undefined}
            simplified={outputCount === 0}
          />
        </div>

        {/* Main column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Top bar */}
          {isMobile ? (
            <div style={{ height: 48, background: "var(--bg)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 }}>
              <button type="button" onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Open navigation">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
              <Logo size="sm" />
              <NotificationBell />
            </div>
          ) : (
            <StudioTopBar />
          )}

          {/* Content + Dashboard panel row */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <main className="studio-main-inner" style={{ flex: 1, overflowY: "auto", minWidth: 0, paddingBottom: isMobile ? 80 : 0, position: "relative" }}>
              <Outlet />
            </main>
            {!isMobile && (
              <RightPanel open={dashOpen} />
            )}
          </div>
        </div>

        {advisorsOpen && (
          <AdvisorsModal
            pathname={location.pathname}
            onClose={() => setAdvisorsOpen(false)}
          />
        )}
        {discoverOpen && (
          <DiscoverOverlay
            onClose={() => setDiscoverOpen(false)}
            pathname={location.pathname}
          />
        )}

        {isMobile && <MobileBottomNav />}
      </div>
    </ShellContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PANEL
// ─────────────────────────────────────────────────────────────────────────────

function RightPanel({ open }: { open: boolean }) {
  const { feedbackContent, dashContent } = useShell();

  return (
    <div style={{
      width: open ? 240 : 0, flexShrink: 0,
      background: "var(--bg-2)", borderLeft: "1px solid var(--line)",
      overflow: "hidden", transition: "width 0.18s ease",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        width: 240, height: "100%",
        display: "flex", flexDirection: "column",
        opacity: open ? 1 : 0, transition: "opacity 0.12s ease",
        pointerEvents: open ? "auto" : "none",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg)", flexShrink: 0,
          padding: "10px 14px",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 700, color: "var(--blue, #4A90D9)", flexShrink: 0,
            marginRight: 8,
          }}>R</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}>Reed</span>
        </div>

        {/* Stage feedback and context */}
        <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
          {feedbackContent ?? dashContent ?? <DefaultDashContent />}
        </div>

        {/* Copyright footer */}
        <div style={{
          padding: "8px 14px",
          fontSize: 9, color: "var(--line-2)",
          textAlign: "center" as const,
          flexShrink: 0,
        }}>
          &copy; 2026 Mixed Grill, LLC
        </div>
      </div>
    </div>
  );
}

function DefaultDashContent() {
  return (
    <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
      Select a section to see your dashboard.
    </div>
  );
}

function ReedStageContext({ stage }: { stage: string }) {
  const calloutStyle: React.CSSProperties = {
    border: "1px solid rgba(74,144,217,0.25)", borderRadius: 8,
    padding: "10px 12px", background: "rgba(74,144,217,0.04)",
    fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 8,
  };
  const pillGold: React.CSSProperties = {
    display: "inline-flex", padding: "2px 8px", borderRadius: 99,
    background: "rgba(245,198,66,0.15)", fontSize: 10, fontWeight: 600, color: "#9A7030",
  };
  const pillBlue: React.CSSProperties = {
    display: "inline-flex", padding: "2px 8px", borderRadius: 99,
    background: "rgba(74,144,217,0.1)", fontSize: 10, fontWeight: 600, color: "#4A90D9",
  };

  if (stage === "Watch") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          Reed has read your sources. Signals are surfaced by relevance. Competitors going quiet is treated as a signal, not silence.
        </div>
      </div>
    );
  }

  if (stage === "Intake") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <span style={{
          display: "inline-flex", padding: "4px 10px", borderRadius: 99,
          background: "rgba(245,198,66,0.12)", border: "1px solid rgba(245,198,66,0.3)",
          fontSize: 10, fontWeight: 600, color: "#9A7030", marginBottom: 6,
        }}>Freestyle</span>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 6 }}>
          No output format selected. Freestyle mode. Answer Reed's questions and the system shapes your thinking. You can pick a format at the end of Outline.
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6, marginTop: 6 }}>
          What helps: Name the specific reader. State the structural problem, not the symptom. Say what you want the reader to do or feel.
        </div>
      </div>
    );
  }

  if (stage === "Outline") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          Structure is sound. Confirm the close mirrors the title before moving to Edit.
        </div>
        <div style={calloutStyle}>
          You've been freestyling. Want to pick a format before Edit, or keep freestyle?
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button style={{ fontSize: 10, padding: "5px 12px", borderRadius: 5, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Move to Edit</button>
            <button style={{ fontSize: 10, padding: "5px 12px", borderRadius: 5, background: "transparent", border: "1px solid var(--line)", color: "var(--fg-2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Keep Freestyle</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "Edit") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 8 }}>
          Read through the draft. Edit anything that does not sound like you. When you are done, click Finish and Review.
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.6 }}>
          Click into any paragraph to edit directly.
        </div>
      </div>
    );
  }

  if (stage === "Review") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6 }}>
          Reed is reviewing your draft against 7 quality checkpoints.
        </div>
      </div>
    );
  }

  if (stage === "Wrap") {
    return (
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 8 }}>
          Freestyle mode. No format review required. Reed has packaged your content for every channel. Export All gives you clean, formatted outputs ready to publish.
        </div>
        <div style={calloutStyle}>
          This piece has good legs. The LinkedIn version is strong. The essay close would make a solid standalone Sunday post if you want to file it separately.
        </div>
        <button style={{
          width: "100%", padding: 8, borderRadius: 6,
          background: "#0D1B2A", color: "#F5C642",
          fontSize: 11, fontWeight: 700, border: "none",
          cursor: "pointer", fontFamily: "inherit", marginTop: 8,
        }}>
          Export All
        </button>
      </div>
    );
  }

  return null;
}

function ReedPanel() {
  const { reedThread, setReedThread, reedPrefill, setReedPrefill } = useShell();
  const [input, setInput] = useState(reedPrefill || "");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stage = (window as any).__ewWorkStage || "Intake";
  const stageChips = REED_STAGE_CHIPS[stage] || [];

  // Pick up prefill
  useEffect(() => {
    if (reedPrefill) {
      setInput(reedPrefill);
      setReedPrefill("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [reedPrefill, setReedPrefill]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reedThread.length]);

  const prefillAndFocus = (text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const message = input.trim();
    setInput("");

    // Add to thread (no fake reply)
    setReedThread(prev => [...prev, { type: "user", text: message }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "10px 14px" }}>
      {/* Stage-aware context message */}
      <ReedStageContext stage={stage} />
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
        {reedThread.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5, marginBottom: 12 }}>
            Ask Reed anything about your current session.
          </div>
        )}
        {reedThread.map((m, i) => {
          if (m.type === "note") {
            return (
              <div key={i} style={{
                marginBottom: 8, padding: "8px 10px",
                borderLeft: "2px solid #F5C642",
                background: "rgba(245,198,66,0.06)",
                borderRadius: "0 6px 6px 0",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: "#9A7030",
                  letterSpacing: "0.06em", marginBottom: 3,
                  textTransform: "uppercase" as const,
                }}>
                  CARRIED FROM {m.from?.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6, marginBottom: 6 }}>{m.text}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button onClick={() => prefillAndFocus(`Let's work on this now: ${m.text}`)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "#0D1B2A", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Work on this now</button>
                  <button onClick={() => prefillAndFocus(`Apply this to the current ${stage} context: ${m.text}`)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "#0D1B2A", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Apply to {stage}</button>
                  <button onClick={() => prefillAndFocus("Set this aside for now. Flag it for Review.")} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "#0D1B2A", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Set aside</button>
                </div>
              </div>
            );
          }
          if (m.type === "reed") {
            return (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "var(--blue, #4A90D9)", flexShrink: 0,
                }}>R</div>
                <div style={{
                  background: "rgba(74,144,217,0.07)", border: "1px solid rgba(74,144,217,0.15)",
                  borderRadius: "0 8px 8px 8px", padding: "8px 10px",
                  fontSize: 11, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: "85%",
                }}>{m.text}</div>
              </div>
            );
          }
          // User message
          return (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <div style={{
                background: "rgba(245,198,66,0.08)", border: "1px solid rgba(245,198,66,0.2)",
                borderRadius: "8px 0 8px 8px", padding: "8px 10px",
                fontSize: 11, color: "var(--fg)", lineHeight: 1.6, maxWidth: "85%",
              }}>{m.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {stageChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6, flexShrink: 0 }}>
          {stageChips.map((chip, ci) => (
            <button
              key={ci}
              onClick={() => prefillAndFocus(chip.prefill)}
              style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 99,
                background: "#EDF1F5", border: "1px solid #CBD5E1",
                color: "#334155", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: 8, padding: "8px 10px", flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Reply to Reed..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 12, color: "var(--fg)", fontFamily: "var(--font)",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 28, height: 28, borderRadius: 6, background: input.trim() ? "var(--fg)" : "var(--line)",
            border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex",
            alignItems: "center", justifyContent: "center", transition: "background 0.15s",
          }}
        >
          <svg style={{ width: 11, height: 11, stroke: "#fff", strokeWidth: 2.5, fill: "none" }} viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Help panel removed: Reed is the help system (Redesign 3)

// ─────────────────────────────────────────────────────────────────────────────
// ADVISORS MODAL, context-aware per page
// ─────────────────────────────────────────────────────────────────────────────

function AdvisorsModal({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const { ctx, stageLabel } = getAdvisorCtx(pathname);
  const [agreedIdx, setAgreedIdx] = useState<number[]>([]);
  const [skippedIdx, setSkippedIdx] = useState<number[]>([]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: 580,
          overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>Advisors</span>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "var(--bg-2)", color: "var(--fg-3)", fontWeight: 600 }}>{stageLabel}</span>
          </div>
          <button onClick={onClose} aria-label="Close panel" style={{ background: "transparent", border: "none", color: "var(--fg-3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
          {/* Consensus recommendation */}
          <div style={{ background: "rgba(74,144,217,0.04)", border: "1px solid rgba(74,144,217,0.12)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: 6 }}>
              Advisors' Recommendation
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65 }}>{ctx.rec}</div>
          </div>

          <div style={{ height: 1, background: "var(--line)", margin: "4px 0 16px" }} />

          {/* Advisor cards */}
          {ctx.cards.map((card, i) => {
            const agreed = agreedIdx.includes(i);
            const skipped = skippedIdx.includes(i);
            return (
              <div key={i} style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 8, padding: "12px 14px", marginBottom: 8,
                opacity: skipped ? 0.4 : 1, transition: "opacity 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)" }}>{card.role}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setAgreedIdx(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                      style={{
                        fontSize: 10, padding: "3px 10px", borderRadius: 4,
                        border: agreed ? "1px solid var(--blue)" : "1px solid var(--line)",
                        background: agreed ? "rgba(74,144,217,0.08)" : "var(--surface)",
                        color: agreed ? "var(--blue)" : "var(--fg-2)",
                        cursor: "pointer", fontFamily: "var(--font)",
                        transition: "all 0.1s",
                      }}
                    >
                      {agreed ? "Agreed" : "Agree"}
                    </button>
                    <button
                      onClick={() => setSkippedIdx(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                      style={{ fontSize: 10, padding: "3px 10px", borderRadius: 4, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)" }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55 }}>{card.text}</div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--fg-3)", cursor: "pointer", fontFamily: "var(--font)" }}>Dismiss</button>
          <button
            onClick={onClose}
            style={{ fontSize: 12, padding: "7px 16px", borderRadius: 5, background: "var(--fg)", border: "none", color: "var(--surface)", cursor: "pointer", fontFamily: "var(--font)", fontWeight: 600 }}
          >
            Apply recommendations
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER OVERLAY, list view + detail view with back button
// ─────────────────────────────────────────────────────────────────────────────

function DiscoverOverlay({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [detailItem, setDetailItem] = useState<DiscoverItem | null>(null);

  const filtered = DISCOVER_ITEMS.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    d.desc.toLowerCase().includes(q.toLowerCase()) ||
    d.rationale.toLowerCase().includes(q.toLowerCase())
  );

  const handleLaunch = (item: DiscoverItem) => {
    onClose();
    if (item.route) nav(item.route);
  };

  const formatDetail = (text: string) =>
    text.split("\n\n").map((para, i) => (
      <p key={i} style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.75, marginBottom: 12 }}>
        {para.split("\n").map((line, j) => (
          <span key={j}>
            {line}
            {j < para.split("\n").length - 1 && <br />}
          </span>
        ))}
      </p>
    ));

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.55)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 12, width: 680, maxHeight: 560, overflowY: "auto", padding: "22px 24px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
      >
        {/* ── Detail view ── */}
        {detailItem ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <button
                onClick={() => setDetailItem(null)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--fg-3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", padding: 0 }}
              >
                <svg style={{ width: 14, height: 14, stroke: "currentColor", strokeWidth: 2, fill: "none" }} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                All tools
              </button>
              <button onClick={onClose} aria-label="Close panel" style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
            </div>

            {/* Detail header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: `${detailItem.color}18`, color: detailItem.color, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {detailItem.icon}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", marginBottom: 2 }}>{detailItem.name}</div>
                <div style={{ width: 32, height: 3, background: detailItem.color, borderRadius: 2 }} />
              </div>
            </div>

            {/* Detail body */}
            <div style={{ marginBottom: 22 }}>
              {formatDetail(detailItem.detail)}
            </div>

            {/* Launch button */}
            <button
              onClick={() => handleLaunch(detailItem)}
              style={{
                padding: "10px 20px", borderRadius: 6,
                background: detailItem.color, border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--font)",
              }}
            >
              {detailItem.launchLabel}
            </button>
          </>
        ) : (
          /* ── List view ── */
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: "0.01em" }}>Discover</div>
              <button onClick={onClose} aria-label="Close panel" style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
            </div>

            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search tools..."
              autoFocus
              style={{
                width: "100%", border: "1px solid var(--line)", borderRadius: 8,
                padding: "10px 14px", fontSize: 13, fontFamily: "var(--font)",
                outline: "none", marginBottom: 16, color: "var(--fg)", background: "var(--bg)",
                transition: "border-color 0.12s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(74,144,217,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--line)"; }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  style={{
                    padding: 14, border: "1px solid var(--line)",
                    borderTop: `3px solid ${item.color}`,
                    borderRadius: 8, cursor: "pointer",
                    background: "var(--surface)", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginBottom: 10, color: item.color }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg)", marginBottom: 3 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.4, marginBottom: 5 }}>{item.desc}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", fontStyle: "normal", lineHeight: 1.4 }}>{item.rationale}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
