import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import "./shared.css";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value ? "var(--text-primary)" : "var(--surface-elevated)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        border: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: value ? "var(--surface-white)" : "var(--text-tertiary)",
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          transition: "left 0.2s ease",
        }}
      />
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface-white)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h2
      style={{
        fontFamily: "'Afacad Flux', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--text-primary)",
        margin: "0 0 16px",
        letterSpacing: "-0.02em",
      }}
    >
      {label}
    </h2>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, displayName: ctxDisplayName, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [watchTopics, setWatchTopics] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState("");
  const [watchAutoSaved, setWatchAutoSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchTopicsInitialized = useRef(false);

  const [voiceComplete, setVoiceComplete] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, voice_dna_completed, sentinel_topics")
          .eq("id", user.id)
          .single();
        if (data) {
          setFullName(
            data.full_name
            || ctxDisplayName
            || user?.user_metadata?.full_name
            || user?.user_metadata?.name
            || (user?.email ? user.email.split("@")[0] : "")
          );
          setVoiceComplete(!!data.voice_dna_completed);
          setWatchTopics(Array.isArray(data.sentinel_topics) ? data.sentinel_topics : []);
          // Mark initialized after state is set so auto-save doesn't fire on load
          setTimeout(() => { watchTopicsInitialized.current = true; }, 0);
        }
      } catch (err) {
        console.error("[Settings] Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveError("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", user.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast("Profile saved");
      // Update AuthContext so dashboard greeting reflects the change immediately
      await refreshProfile();
    } catch (err: any) {
      toast("Failed to save: " + (err.message || "Unknown error"), "error");
      setSaveError(err.message || "Save failed.");
    }
  };

  const handleAddWatchTopic = () => {
    const t = watchInput.trim();
    if (!t || watchTopics.includes(t)) return;
    setWatchTopics((prev) => [...prev, t]);
    setWatchInput("");
  };

  // Auto-save watch topics with 1s debounce
  useEffect(() => {
    if (!user || !watchTopicsInitialized.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setWatchAutoSaved(false);
    saveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ sentinel_topics: watchTopics })
        .eq("id", user.id);
      if (!error) {
        setWatchAutoSaved(true);
        toast("Topics saved");
        setTimeout(() => setWatchAutoSaved(false), 3000);
      } else {
        toast("Failed to save topics: " + (error.message || "Unknown error"), "error");
      }
    }, 1000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [watchTopics]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px", fontFamily: "'Afacad Flux', sans-serif", color: "var(--text-tertiary)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px", fontFamily: "'Afacad Flux', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 8, marginBottom: 0 }}>
          Account and preferences
        </p>
      </div>

      {/* Profile */}
      <SectionCard>
        <SectionHeader label="Profile" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: "100%", maxWidth: 320, padding: "10px 14px", fontSize: 15, border: "1px solid var(--border-default)", borderRadius: 8, fontFamily: "'Afacad Flux', sans-serif", outline: "none", transition: "border-color 0.15s ease" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold-dark)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>
              Email
            </label>
            <div style={{ fontSize: 15, color: "var(--fg-2)", padding: "10px 0" }}>{user?.email || ""}</div>
          </div>
          {saveError && <p style={{ fontSize: 13, color: "#D64545", margin: 0 }}>{saveError}</p>}
          <button
            onClick={handleSaveProfile}
            style={{ alignSelf: "flex-start", background: "#C8961A", color: "#0D1B2A", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif", transition: "opacity 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </SectionCard>

      {/* Voice DNA */}
      <SectionCard>
        <SectionHeader label="Voice DNA" />
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
          {voiceComplete
            ? "Voice DNA active. Your content is being matched to your writing patterns."
            : "Your Voice DNA hasn't been configured yet. Content is being generated with a general voice profile. Add your Voice DNA to increase voice match accuracy from ~75% to 95%+."}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {voiceComplete ? (
            <button
              type="button"
              onClick={() => navigate("/onboarding?retrain=1")}
              style={{
                background: "transparent",
                color: "var(--gold-dark)",
                border: "1px solid var(--gold-dark)",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Afacad Flux', sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,150,26,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Retrain Voice DNA
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/onboarding?retrain=1")}
              style={{
                background: "var(--gold-dark)",
                color: "#0D1B2A",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Afacad Flux', sans-serif",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Start Voice DNA
            </button>
          )}
          {voiceComplete && (
            <button
              type="button"
              onClick={() => navigate("/studio/settings/voice")}
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Afacad Flux', sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              View Voice Profile
            </button>
          )}
        </div>
      </SectionCard>

      {/* Watch Configuration */}
      <SectionCard>
        <SectionHeader label="Watch Configuration" />
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, marginTop: 0 }}>
          Topics Sentinel uses to build your intelligence briefings.
        </p>
        {watchTopics.length === 0 && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(74,144,217,0.06)",
            borderLeft: "3px solid #4A90D9",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}>
            Sample briefing active. Add your topics below to customize your intelligence briefing.
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {watchTopics.map((topic, i) => (
            <span
              key={`${topic}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--bg-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 20,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              {topic}
              <button
                type="button"
                onClick={() => setWatchTopics((prev) => prev.filter((_, idx) => idx !== i))}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-tertiary)", fontSize: 16, lineHeight: 1 }}
                aria-label="Remove"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <input
            type="text"
            value={watchInput}
            onChange={(e) => setWatchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddWatchTopic(); } }}
            placeholder="Add a topic (e.g., AI governance, content marketing)"
            style={{ width: 280, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8, fontFamily: "'Afacad Flux', sans-serif", fontSize: 13, outline: "none" }}
          />
          <button
            type="button"
            onClick={handleAddWatchTopic}
            style={{ background: "transparent", color: "var(--gold-dark)", border: "1px solid var(--gold-dark)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" }}
          >
            Add
          </button>
        </div>
        {["AI", "Leadership", "Content Strategy", "Public Speaking", "Executive Coaching", "Industry Trends"].filter(s => !watchTopics.includes(s)).length > 0 && (
          <div style={{ marginTop: -4, marginBottom: 16, fontSize: 12, color: "var(--fg-3)" }}>
            Suggestions:{" "}
            {["AI", "Leadership", "Content Strategy", "Public Speaking", "Executive Coaching", "Industry Trends"]
              .filter(s => !watchTopics.includes(s))
              .slice(0, 4)
              .map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWatchTopics(prev => [...prev, s])}
                  style={{ background: "none", border: "none", color: "var(--cornflower)", cursor: "pointer", fontSize: 12, textDecoration: "underline", marginLeft: 8, fontFamily: "'Afacad Flux', sans-serif", padding: 0 }}
                >
                  {s}
                </button>
              ))}
          </div>
        )}
        {watchAutoSaved && (
          <span style={{ fontSize: 12, color: "var(--fg-3)", fontStyle: "italic" }}>
            Auto-saved
          </span>
        )}
      </SectionCard>

      {/* Appearance */}
      <SectionCard>
        <SectionHeader label="Appearance" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Theme</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 0 }}>
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </p>
          </div>
          <Toggle value={theme === "dark"} onChange={() => toggleTheme()} />
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard>
        <SectionHeader label="Notifications" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>In-app notifications</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 0 }}>
              Briefing alerts, output scores, and activity reminders
            </p>
          </div>
          <Toggle value={true} onChange={() => {}} />
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard>
        <SectionHeader label="Account" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{ alignSelf: "flex-start", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif", transition: "all 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontSize: 13, color: "var(--text-tertiary)", cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif", textDecoration: "underline" }}
          >
            Delete my account
          </button>
        </div>
      </SectionCard>

      {deleteModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{ background: "var(--surface-white)", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", fontFamily: "'Afacad Flux', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Afacad Flux', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
              Delete account
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              In Alpha, account deletion is handled manually. Type DELETE to confirm, then contact mark@mixedgrill.studio to complete the process.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 14, fontFamily: "'Afacad Flux', sans-serif", marginBottom: 16, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(""); }}
                style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmText.toUpperCase() !== "DELETE") return;
                  setDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleteConfirmText.toUpperCase() !== "DELETE"}
                style={{
                  background: deleteConfirmText.toUpperCase() === "DELETE" ? "#D64545" : "var(--surface-elevated)",
                  color: deleteConfirmText.toUpperCase() === "DELETE" ? "#fff" : "var(--text-tertiary)",
                  border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600,
                  cursor: deleteConfirmText.toUpperCase() === "DELETE" ? "pointer" : "default",
                  fontFamily: "'Afacad Flux', sans-serif",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
