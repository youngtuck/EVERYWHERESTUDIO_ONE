import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import "./shared.css";

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

const PLACEHOLDER_IDEAS: Idea[] = [
  { id: "1", title: "Essay on delegation and trust", note: "Angle: most advice is about systems, not the relationship. Parked until I have a clear thesis.", projectId: "1", projectName: "My Studio" },
  { id: "2", title: "TEDx opener: the question that changed my view", note: "Personal story hook. Need to refine the question before writing.", projectId: "2", projectName: "TEDx Content" },
  { id: "3", title: "Book chapter: composed intelligence", note: "Define the term and contrast with artificial intelligence. Parked for deeper research.", projectId: "3", projectName: "Book Project" },
];

const transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";

export default function TheLot() {
  const navigate = useNavigate();
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

  const handlePickUp = (idea: Idea) => {
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    navigate("/studio/work", { state: { ideaTitle: idea.title, ideaDescription: idea.note } });
  };

  const handleDiscard = (idea: Idea) => {
    if (!window.confirm("Discard this idea?")) return;
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
  };

  const isEmpty = ideas.length === 0;

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px 80px",
        fontFamily: "'Afacad Flux', sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            The Lot
          </h1>
          <p style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginTop: 4, marginBottom: 0 }}>
            Ideas parked for later
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            background: "var(--text-primary)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontFamily: "'Afacad Flux', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          + Park an Idea
        </button>
      </div>

      {isEmpty ? (
        <div
          style={{
            padding: "80px 0",
            textAlign: "center",
          }}
        >
          <Bookmark size={32} style={{ color: "var(--text-tertiary)" }} />
          <h2
            style={{
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No ideas parked yet
          </h2>
          <p style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto 20px" }}>
            Use The Lot to save ideas you are not ready to develop.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: "var(--gold-dark)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              fontFamily: "'Afacad Flux', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold-light)"; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gold-dark)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            Park an Idea
          </button>
        </div>
      ) : (
        <div className="lot-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {ideas.map((idea) => (
            <div
              key={idea.id}
              style={{
                background: "var(--surface-white)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 200,
                transition,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {idea.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Afacad Flux', sans-serif",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    marginTop: 8,
                    marginBottom: 0,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {idea.note}
                </p>
              </div>
              <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>
                  {idea.projectName !== "My Studio" ? idea.projectName : "Parked"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleDiscard(idea)}
                    title="Discard idea"
                    style={{
                      background: "transparent",
                      color: "var(--text-tertiary)",
                      border: "none",
                      padding: 6,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#E53935"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePickUp(idea)}
                    style={{
                      background: "transparent",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-default)",
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontFamily: "'Afacad Flux', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.02)";
                      e.currentTarget.style.borderColor = "var(--text-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "var(--border-default)";
                    }}
                  >
                    Pick Up
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, backdropFilter: "blur(4px)" }}
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
              background: "var(--bg-light)",
              borderRadius: 12,
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
              zIndex: 9999,
              fontFamily: "'Afacad Flux', sans-serif",
              padding: "24px 28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="park-idea-title" style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Park an Idea
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                What is the idea?
              </label>
              <textarea
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                placeholder="A few words or a paragraph. You can refine it later."
                rows={4}
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: 100,
                  fontFamily: "'Afacad Flux', sans-serif",
                  fontSize: 14,
                  padding: "10px 14px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
              />
            </div>
            {/* Project assignment removed - all ideas go to default project until multi-project support is live */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-default)", padding: "10px 20px", borderRadius: 8, fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={handleParkIt} disabled={!newIdeaText.trim()} style={{ background: "var(--gold-dark)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontFamily: "'Afacad Flux', sans-serif", fontSize: 14, fontWeight: 500, cursor: newIdeaText.trim() ? "pointer" : "default", opacity: newIdeaText.trim() ? 1 : 0.6 }}>
                Park It
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
