import { useState } from "react";
import { Bookmark, Plus } from "lucide-react";

const PROJECTS = [
  { id: "1", name: "My Studio" },
  { id: "2", name: "TEDx Content" },
  { id: "3", name: "Book Project" },
];

type Idea = {
  id: string;
  title: string;
  note: string;
  projectId: string;
  projectName: string;
};

// Start with 3 placeholder cards so the grid is visible; remove to see empty state
const PLACEHOLDER_IDEAS: Idea[] = [
  { id: "1", title: "Essay on delegation and trust", note: "Angle: most advice is about systems, not the relationship. Parked until I have a clear thesis.", projectId: "1", projectName: "My Studio" },
  { id: "2", title: "TEDx opener: the question that changed my view", note: "Personal story hook. Need to refine the question before writing.", projectId: "2", projectName: "TEDx Content" },
  { id: "3", title: "Book chapter: composed intelligence", note: "Define the term and contrast with artificial intelligence. Parked for deeper research.", projectId: "3", projectName: "Book Project" },
];

export default function TheLot() {
  const [ideas, setIdeas] = useState<Idea[]>(PLACEHOLDER_IDEAS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState("");
  const [newIdeaProjectId, setNewIdeaProjectId] = useState(PROJECTS[0]?.id ?? "");

  const handleParkIt = () => {
    const project = PROJECTS.find((p) => p.id === newIdeaProjectId);
    if (!newIdeaText.trim() || !project) return;
    setIdeas((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: newIdeaText.trim().slice(0, 60) + (newIdeaText.trim().length > 60 ? "…" : ""),
        note: newIdeaText.trim(),
        projectId: project.id,
        projectName: project.name,
      },
    ]);
    setNewIdeaText("");
    setNewIdeaProjectId(PROJECTS[0]?.id ?? "");
    setModalOpen(false);
  };

  const handlePickUp = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const isEmpty = ideas.length === 0;

  return (
    <div style={{ maxWidth: "var(--studio-content-max)", margin: "0 auto", fontFamily: "var(--font)", paddingBottom: "var(--studio-gap-lg)" }}>
      {/* Header + CTA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--studio-gap-lg)" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            The Lot
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0 }}>
            Ideas parked for later
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Park an Idea
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="card" style={{ padding: "48px 32px", textAlign: "center", border: "1px solid var(--line)" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "var(--studio-radius)",
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Bookmark size={24} style={{ color: "var(--fg-3)" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Nothing parked yet
          </h2>
          <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
            When an idea isn&apos;t ready, park it here. It&apos;ll wait.
          </p>
        </div>
      )}

      {/* Grid of idea cards */}
      {!isEmpty && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--studio-gap)" }}>
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="card"
              style={{
                padding: "20px 22px",
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.35 }}>
                {idea.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.5, flex: 1 }}>
                {idea.note}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>
                  {idea.projectName}
                </span>
                <button
                  type="button"
                  onClick={() => handlePickUp(idea.id)}
                  className="btn-ghost"
                  style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px" }}
                >
                  Pick Up
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Park an Idea modal */}
      {modalOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 9998,
              backdropFilter: "blur(4px)",
            }}
            aria-hidden
            onClick={() => setModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="park-idea-title"
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: 420,
              background: "var(--bg)",
              borderRadius: "var(--studio-radius-lg)",
              border: "1px solid var(--line)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              zIndex: 9999,
              fontFamily: "var(--font)",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="park-idea-title" style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Park an Idea
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                What&apos;s the idea?
              </label>
              <textarea
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                placeholder="A few words or a paragraph; you can refine it later."
                rows={4}
                className="input-field"
                style={{ width: "100%", resize: "vertical", minHeight: 100, fontFamily: "var(--font)" }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Project
              </label>
              <select
                value={newIdeaProjectId}
                onChange={(e) => setNewIdeaProjectId(e.target.value)}
                className="input-field"
                style={{ width: "100%", fontFamily: "var(--font)" }}
              >
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleParkIt} disabled={!newIdeaText.trim()}>
                Park It
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
