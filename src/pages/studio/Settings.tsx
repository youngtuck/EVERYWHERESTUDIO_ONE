import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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

function SectionHeader({ label }: { label: string }) {
  return (
    <h2
      style={{
        fontFamily: "'Montserrat', sans-serif",
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

type ProfileData = {
  full_name: string | null;
  title: string | null;
  voice_dna_completed: boolean | null;
  voice_dna_completed_at: string | null;
  sentinel_topics: string[] | null;
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [saveProfileStatus, setSaveProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [watchTopics, setWatchTopics] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState("");
  const [saveWatchStatus, setSaveWatchStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [voiceFidelityPct, setVoiceFidelityPct] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, title, voice_dna_completed, voice_dna_completed_at, sentinel_topics")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(profileData as ProfileData | null);
      if (profileData) {
        setFullName(profileData.full_name ?? "");
        setTitle(profileData.title ?? "");
        setWatchTopics(Array.isArray(profileData.sentinel_topics) ? profileData.sentinel_topics : []);
      }

      const { data: outputs } = await supabase
        .from("outputs")
        .select("gates")
        .eq("user_id", user.id);
      if (cancelled) return;
      const withVoice = (outputs ?? []).filter(
        (o: { gates?: { voice?: number } }) => typeof o.gates?.voice === "number"
      );
      const avg =
        withVoice.length > 0
          ? withVoice.reduce((s: number, o: { gates?: { voice?: number } }) => s + (o.gates?.voice ?? 0), 0) /
            withVoice.length
          : null;
      setVoiceFidelityPct(avg != null && !Number.isNaN(avg) ? Math.round(avg) : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveProfileStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        title: title.trim() || null,
      })
      .eq("id", user.id);
    setSaveProfileStatus(error ? "error" : "saved");
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setProfile((p) => (p ? { ...p, full_name: fullName.trim() || null, title: title.trim() || null } : null));
    showToast("Profile saved.", "success");
  };

  const handleAddWatchTopic = () => {
    const t = watchInput.trim();
    if (!t || watchTopics.includes(t)) return;
    setWatchTopics((prev) => [...prev, t]);
    setWatchInput("");
  };

  const handleRemoveWatchTopic = (index: number) => {
    setWatchTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveWatch = async () => {
    if (!user) return;
    setSaveWatchStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({ sentinel_topics: watchTopics })
      .eq("id", user.id);
    setSaveWatchStatus(error ? "error" : "saved");
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setProfile((p) => (p ? { ...p, sentinel_topics: watchTopics } : null));
    showToast("Watch configuration saved.", "success");
  };

  const handleRetrainVoiceDna = () => {
    navigate("/onboarding?retrain=1");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccountConfirm = () => {
    if (deleteConfirmText.toUpperCase() !== "DELETE") return;
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
    showToast("Contact mark@mixedgrill.studio to delete your account.", "success");
  };

  if (loading || !user) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--text-tertiary)",
        }}
      >
        Loading settings…
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          STUDIO
        </p>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Settings
        </h1>
      </div>

      {toast && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 8,
            background: toast.type === "error" ? "#D64545" : "var(--gold-dark)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* 1. PROFILE */}
      <SectionCard>
        <SectionHeader label="Profile" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={user.email ?? ""}
              readOnly
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                background: "var(--surface-elevated)",
                color: "var(--text-secondary)",
              }}
            />
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, marginBottom: 0 }}>
              Email is managed by your sign-in provider.
            </p>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Role / title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Founder, CMO"
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saveProfileStatus === "saving"}
            style={{
              alignSelf: "flex-start",
              background: "var(--gold-dark)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: saveProfileStatus === "saving" ? "wait" : "pointer",
            }}
          >
            {saveProfileStatus === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </SectionCard>

      {/* 2. VOICE DNA */}
      <SectionCard>
        <SectionHeader label="Voice DNA" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {profile?.voice_dna_completed
              ? voiceFidelityPct != null
                ? `Fidelity: ${voiceFidelityPct}% (from your outputs)`
                : "Completed. Fidelity will appear after you produce outputs."
              : "Not completed. Complete onboarding to train your voice."}
          </p>
          {profile?.voice_dna_completed_at && (
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
              Last updated:{" "}
              {new Date(profile.voice_dna_completed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          <button
            type="button"
            onClick={handleRetrainVoiceDna}
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              color: "var(--gold-dark)",
              border: "1px solid var(--gold-dark)",
              borderRadius: 8,
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retrain Voice DNA
          </button>
        </div>
      </SectionCard>

      {/* 3. WATCH CONFIGURATION */}
      <SectionCard>
        <SectionHeader label="Watch configuration" />
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, marginTop: 0 }}>
          Topics Sentinel uses to build your intelligence briefings.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {watchTopics.map((topic, i) => (
            <span
              key={`${topic}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 20,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              {topic}
              <button
                type="button"
                onClick={() => handleRemoveWatchTopic(i)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <input
            type="text"
            value={watchInput}
            onChange={(e) => setWatchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddWatchTopic())}
            placeholder="Add a topic"
            style={{
              width: 180,
              padding: "8px 12px",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={handleAddWatchTopic}
            style={{
              background: "transparent",
              color: "var(--gold-dark)",
              border: "1px solid var(--gold-dark)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
        <button
          type="button"
          onClick={handleSaveWatch}
          disabled={saveWatchStatus === "saving"}
          style={{
            background: "var(--gold-dark)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: saveWatchStatus === "saving" ? "wait" : "pointer",
          }}
        >
          {saveWatchStatus === "saving" ? "Saving…" : "Save"}
        </button>
      </SectionCard>

      {/* 4. APPEARANCE */}
      <SectionCard>
        <SectionHeader label="Appearance" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 0",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Theme
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 0 }}>
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </p>
          </div>
          <Toggle value={theme === "dark"} onChange={() => toggleTheme()} />
        </div>
      </SectionCard>

      {/* 5. ACCOUNT */}
      <SectionCard>
        <SectionHeader label="Account" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "var(--text-tertiary)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Delete my account
          </button>
        </div>
      </SectionCard>

      {/* Delete account modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: "var(--surface-white)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>
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
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(""); }}
                style={{
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={deleteConfirmText.toUpperCase() !== "DELETE"}
                style={{
                  background: deleteConfirmText.toUpperCase() === "DELETE" ? "#D64545" : "var(--surface-elevated)",
                  color: deleteConfirmText.toUpperCase() === "DELETE" ? "#fff" : "var(--text-tertiary)",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleteConfirmText.toUpperCase() === "DELETE" ? "pointer" : "default",
                  fontFamily: "'DM Sans', sans-serif",
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
