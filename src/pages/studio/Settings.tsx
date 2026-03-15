import { useState, useEffect, useRef } from "react";
import { User, Palette, Sliders, Eye, Bell, Shield, CreditCard, Copy, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const TABS = [
  { label: "Account", icon: User },
  { label: "Security", icon: Shield },
  { label: "Appearance", icon: Palette },
  { label: "Studio", icon: Sliders },
  { label: "Sentinel", icon: Eye },
  { label: "Notifications", icon: Bell },
  { label: "Plan", icon: CreditCard },
];

const COMMON_TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const ACCESS_CODE = "EVERYWHERE-ALPHA-2026";

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

function SettingRow({
  label,
  desc,
  control,
}: {
  label: string;
  desc?: string;
  control: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ flex: 1, marginRight: 20 }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {label}
        </p>
        {desc && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "var(--text-tertiary)",
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  timezone: string | null;
  title: string | null;
  avatar_url: string | null;
  publication_threshold: number | null;
  voice_dna_active: boolean | null;
  show_agent_names: boolean | null;
  one_question_mode: boolean | null;
  proactive_suggestions: boolean | null;
  email_notifications: boolean | null;
  browser_push: boolean | null;
  sentinel_email: boolean | null;
  weekly_digest: boolean | null;
  voice_dna_completed: boolean | null;
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Account form state (synced from profile)
  const [fullName, setFullName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [title, setTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Studio
  const [agentNames, setAgentNames] = useState(false);
  const [oneQuestion, setOneQuestion] = useState(true);
  const [proactive, setProactive] = useState(true);
  const [threshold, setThreshold] = useState(900);
  const [voiceDnaActive, setVoiceDnaActive] = useState(true);

  // Appearance
  const [sidebarDefault, setSidebarDefault] = useState<"expanded" | "collapsed">("expanded");

  // Sentinel
  const [sentinelFreq, setSentinelFreq] = useState("daily");

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [sentinelEmail, setSentinelEmail] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Security: password update
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Plan: usage stats
  const [outputsCount, setOutputsCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [voiceDnaSessions, setVoiceDnaSessions] = useState(0);

  // Delete account modal
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile on mount using authenticated user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, timezone, title, avatar_url, publication_threshold, voice_dna_active, show_agent_names, one_question_mode, proactive_suggestions, email_notifications, browser_push, sentinel_email, weekly_digest, voice_dna_completed"
        )
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setProfile(data as ProfileRow | null);
      if (data) {
        setFullName(data.full_name ?? "");
        setAccountEmail(data.email ?? user.email ?? "");
        setTimezone(data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
        setTitle(data.title ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setThreshold(data.publication_threshold ?? 900);
        setAgentNames(!!data.show_agent_names);
        setOneQuestion(data.one_question_mode !== false);
        setProactive(data.proactive_suggestions !== false);
        setVoiceDnaActive(data.voice_dna_active !== false);
        setEmailNotifs(data.email_notifications !== false);
        setPushNotifs(!!data.browser_push);
        setSentinelEmail(!!data.sentinel_email);
        setWeeklyDigest(!!data.weekly_digest);
      } else {
        setAccountEmail(user.email ?? "");
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  // Usage stats for Plan tab
  useEffect(() => {
    if (!user) return;
    (async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [outRes, profileRes] = await Promise.all([
        supabase
          .from("outputs")
          .select("id, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth),
        supabase.from("profiles").select("voice_dna_completed").eq("id", user.id).single(),
      ]);
      const outputs = outRes.data ?? [];
      setOutputsCount(outputs.length);
      const dates = new Set(outputs.map((o: { created_at: string }) => o.created_at.slice(0, 10)));
      setSessionsCount(dates.size);
      setVoiceDnaSessions(profileRes.data?.voice_dna_completed ? 1 : 0);
    })();
  }, [user?.id]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    setSaveStatus("saving");
    try {
      const updates: Record<string, unknown> = {
        full_name: fullName.trim() || null,
        timezone: timezone || null,
        title: title.trim() || null,
        avatar_url: avatarUrl || null,
      };
      if (accountEmail.trim() && accountEmail !== user.email) {
        const { error: updateError } = await supabase.auth.updateUser({ email: accountEmail.trim() });
        if (updateError) {
          setSaveStatus("error");
          showToast(updateError.message, "error");
          return;
        }
      }
      updates.email = accountEmail.trim() || null;
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) {
        setSaveStatus("error");
        showToast(error.message, "error");
        return;
      }
      setSaveStatus("saved");
      showToast("Account updated.", "success");
    } catch {
      setSaveStatus("error");
      showToast("Failed to save.", "error");
    }
  };

  const handleSaveStudio = async () => {
    if (!user) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({
        publication_threshold: threshold,
        voice_dna_active: voiceDnaActive,
        show_agent_names: agentNames,
        one_question_mode: oneQuestion,
        proactive_suggestions: proactive,
      })
      .eq("id", user.id);
    setSaveStatus(error ? "error" : "saved");
    if (error) showToast(error.message, "error");
    else showToast("Studio settings saved.", "success");
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("profiles")
      .update({
        email_notifications: emailNotifs,
        browser_push: pushNotifs,
        sentinel_email: sentinelEmail,
        weekly_digest: weeklyDigest,
      })
      .eq("id", user.id);
    setSaveStatus(error ? "error" : "saved");
    if (error) showToast(error.message, "error");
    else showToast("Notification preferences saved.", "success");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      showToast(uploadError.message, "error");
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    showToast("Photo updated.", "success");
    e.target.value = "";
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated.", "success");
  };

  const handleSignOutOthers = async () => {
    // Supabase client does not support scope: 'others'; signs out current session only.
    await supabase.auth.signOut();
    showToast("Signed out. Sign in again on this device if needed.", "success");
    window.location.href = "/auth";
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(ACCESS_CODE);
    showToast("Access code copied.", "success");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ account_deleted_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const initials = fullName
    ?.trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || "?";

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
            fontSize: 11,
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

      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              background: "none",
              border: "none",
              borderBottom: activeTab === i ? "2px solid var(--gold-dark)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: activeTab === i ? 600 : 500,
              color: activeTab === i ? "var(--text-primary)" : "var(--text-tertiary)",
              whiteSpace: "nowrap",
              marginBottom: -1,
            }}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ——— Account ——— */}
      {activeTab === 0 && (
        <div>
          <SettingRow
            label="Full Name"
            control={
              <input
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  maxWidth: 220,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            }
          />
          <SettingRow
            label="Email"
            control={
              <input
                className="input-field"
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                style={{
                  maxWidth: 220,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            }
          />
          <SettingRow
            label="Profile Photo"
            desc="Circular avatar, click to upload"
            control={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "2px solid var(--border-subtle)",
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : "var(--surface-elevated)",
                    color: "var(--text-tertiary)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {!avatarUrl ? initials : null}
                </button>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Click to upload</span>
              </div>
            }
          />
          <SettingRow
            label="Time Zone"
            desc="Used for briefings and digest"
            control={
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{
                  maxWidth: 220,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  background: "var(--surface-white)",
                }}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            }
          />
          <SettingRow
            label="Role / Title"
            desc="e.g. Executive Coach, Keynote Speaker"
            control={
              <input
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Executive Coach"
                style={{
                  maxWidth: 220,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            }
          />
          <div style={{ paddingTop: 14 }}>
            <button
              type="button"
              onClick={handleSaveAccount}
              disabled={saveStatus === "saving"}
              style={{
                background: "var(--gold-dark)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: saveStatus === "saving" ? "wait" : "pointer",
              }}
            >
              {saveStatus === "saving" ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ——— Security ——— */}
      {activeTab === 1 && (
        <div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            Password
          </p>
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "var(--text-tertiary)", display: "block", marginBottom: 4 }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  maxWidth: 260,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "var(--text-tertiary)", display: "block", marginBottom: 4 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  maxWidth: 260,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleUpdatePassword}
              style={{
                background: "transparent",
                color: "var(--gold-dark)",
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Update Password
            </button>
          </div>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
              marginTop: 24,
            }}
          >
            Active Sessions
          </p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 0, marginBottom: 12 }}>
            Devices currently signed into your account
          </p>
          <div
            style={{
              padding: "12px 14px",
              background: "var(--surface-elevated)",
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          >
            This device · Active now
          </div>
          <button
            type="button"
            onClick={handleSignOutOthers}
            style={{
              background: "transparent",
              color: "var(--gold-dark)",
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Sign Out All Other Devices
          </button>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
              marginTop: 24,
            }}
          >
            Alpha Access
          </p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 0, marginBottom: 12 }}>
            EVERYWHERE Studio is currently invite-only. Share this access code with collaborators.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input
              readOnly
              value={ACCESS_CODE}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                padding: "8px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                background: "var(--surface-elevated)",
                color: "var(--text-primary)",
                maxWidth: 260,
              }}
            />
            <button
              type="button"
              onClick={copyAccessCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 0 }}>
            New users will need this code to create an account.
          </p>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--danger)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
              marginTop: 28,
            }}
          >
            Danger Zone
          </p>
          <div
            style={{
              border: "1px solid var(--danger)",
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: "transparent",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
                padding: "8px 16px",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* ——— Appearance ——— */}
      {activeTab === 2 && (
        <div>
          <SettingRow
            label="Sidebar"
            desc="Default state on load"
            control={
              <select
                value={sidebarDefault}
                onChange={(e) => setSidebarDefault(e.target.value as "expanded" | "collapsed")}
                style={{
                  maxWidth: 160,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  background: "var(--surface-white)",
                }}
              >
                <option value="expanded">Expanded</option>
                <option value="collapsed">Collapsed</option>
              </select>
            }
          />
          <SettingRow
            label="Theme"
            desc="Light or dark app theme"
            control={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Light</span>
                <Toggle value={theme === "dark"} onChange={toggleTheme} />
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Dark</span>
              </div>
            }
          />
        </div>
      )}

      {/* ——— Studio ——— */}
      {activeTab === 3 && (
        <div>
          <SettingRow
            label="Show Agent Names"
            desc="Display Watson, Sentinel, etc."
            control={<Toggle value={agentNames} onChange={setAgentNames} />}
          />
          <SettingRow
            label="One Question at a Time"
            desc="Watson asks one question per message"
            control={<Toggle value={oneQuestion} onChange={setOneQuestion} />}
          />
          <SettingRow
            label="Proactive Suggestions"
            desc="Watson surfaces ideas without being asked"
            control={<Toggle value={proactive} onChange={setProactive} />}
          />
          <SettingRow
            label="Voice DNA Active"
            desc="Inject Voice DNA into Watson calls"
            control={<Toggle value={voiceDnaActive} onChange={setVoiceDnaActive} />}
          />
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Publication Threshold
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    marginTop: 2,
                    marginBottom: 0,
                  }}
                >
                  Minimum Betterish score to flag as ready
                </p>
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--gold-dark)" }}>
                {threshold}
              </span>
            </div>
            <input
              type="range"
              min={600}
              max={950}
              step={10}
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              style={{ width: "100%", accentColor: "var(--gold-dark)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                600 · lenient
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                950 · strict
              </span>
            </div>
          </div>
          <div style={{ paddingTop: 14 }}>
            <button
              type="button"
              onClick={handleSaveStudio}
              disabled={saveStatus === "saving"}
              style={{
                background: "var(--gold-dark)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: saveStatus === "saving" ? "wait" : "pointer",
              }}
            >
              {saveStatus === "saving" ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ——— Sentinel ——— */}
      {activeTab === 4 && (
        <div>
          <SettingRow
            label="Briefing Frequency"
            desc="How often Sentinel compiles a briefing"
            control={
              <select
                value={sentinelFreq}
                onChange={(e) => setSentinelFreq(e.target.value)}
                style={{
                  maxWidth: 140,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  background: "var(--surface-white)",
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual only</option>
              </select>
            }
          />
          <SettingRow
            label="Topics"
            desc="Industries and themes to monitor"
            control={
              <button
                type="button"
                style={{
                  background: "transparent",
                  color: "var(--gold-dark)",
                  border: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Configure
              </button>
            }
          />
          <SettingRow
            label="Competitor Tracking"
            desc="People and organizations"
            control={
              <button
                type="button"
                style={{
                  background: "transparent",
                  color: "var(--gold-dark)",
                  border: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Configure
              </button>
            }
          />
          <SettingRow
            label="Event Radar"
            desc="Location for events"
            control={
              <input
                defaultValue="Santa Barbara, CA"
                style={{
                  maxWidth: 200,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              />
            }
          />
        </div>
      )}

      {/* ——— Notifications ——— */}
      {activeTab === 5 && (
        <div>
          <SettingRow
            label="Email Notifications"
            desc="Gate completions, briefings"
            control={<Toggle value={emailNotifs} onChange={setEmailNotifs} />}
          />
          <SettingRow
            label="Browser Push"
            desc="When content clears all gates"
            control={<Toggle value={pushNotifs} onChange={setPushNotifs} />}
          />
          <SettingRow
            label="Sentinel Briefing Email"
            desc="Sends the Watch Brief to email"
            control={<Toggle value={sentinelEmail} onChange={setSentinelEmail} />}
          />
          <SettingRow
            label="Weekly Digest"
            desc="Weekly summary of outputs and scores"
            control={<Toggle value={weeklyDigest} onChange={setWeeklyDigest} />}
          />
          <div style={{ paddingTop: 14 }}>
            <button
              type="button"
              onClick={handleSaveNotifications}
              disabled={saveStatus === "saving"}
              style={{
                background: "var(--gold-dark)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: saveStatus === "saving" ? "wait" : "pointer",
              }}
            >
              {saveStatus === "saving" ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ——— Plan ——— */}
      {activeTab === 6 && (
        <div>
          <div
            style={{
              border: "1px solid var(--gold-dark)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--gold-dark)",
                marginBottom: 8,
              }}
            >
              ALPHA
            </span>
            <h2
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px 0",
              }}
            >
              EVERYWHERE Studio Alpha
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 12px 0", lineHeight: 1.5 }}>
              You're part of the founding cohort. Full access while we build.
            </p>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-dark)" }}>Active</span>
          </div>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Usage this month
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <div
              style={{
                flex: "1 1 120px",
                padding: "14px 16px",
                background: "var(--surface-elevated)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Sessions</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {sessionsCount} <span style={{ fontWeight: 400, fontSize: 14, color: "var(--text-tertiary)" }}>/ Unlimited</span>
              </div>
            </div>
            <div
              style={{
                flex: "1 1 120px",
                padding: "14px 16px",
                background: "var(--surface-elevated)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Outputs Created</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {outputsCount} <span style={{ fontWeight: 400, fontSize: 14, color: "var(--text-tertiary)" }}>/ Unlimited</span>
              </div>
            </div>
            <div
              style={{
                flex: "1 1 120px",
                padding: "14px 16px",
                background: "var(--surface-elevated)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Voice DNA Sessions</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {voiceDnaSessions} <span style={{ fontWeight: 400, fontSize: 14, color: "var(--text-tertiary)" }}>/ Unlimited</span>
              </div>
            </div>
          </div>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Coming Soon
          </p>
          <div
            style={{
              padding: 20,
              background: "var(--surface-elevated)",
              borderRadius: 12,
              border: "1px solid var(--border-subtle)",
              opacity: 0.9,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lock size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Growth Plan — Coming Soon
              </h3>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-dark)", margin: "0 0 8px 0" }}>$10,000 / month</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              For executive coaches, consultants, and keynote speakers who charge $10K+ per engagement.
            </p>
            <ul style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 16px 0", paddingLeft: 20, lineHeight: 1.8 }}>
              <li>40 AI specialists active in every session</li>
              <li>12 output formats</li>
              <li>7 quality checkpoints</li>
              <li>Voice DNA + Brand DNA + Method DNA</li>
              <li>Sentinel intelligence briefings</li>
              <li>Priority support</li>
            </ul>
            <a
              href="mailto:mark@mixedgrill.net?subject=EVERYWHERE%20Studio%20%E2%80%94%20Growth%20Plan%20Interest"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                background: "var(--gold-dark)",
                color: "#fff",
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Join the Waitlist
            </a>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: "var(--surface-white)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              border: "1px solid var(--border-subtle)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
              Delete Account
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 16px 0" }}>
              This cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: "100%",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE"}
                style={{
                  padding: "8px 16px",
                  background: deleteConfirmText === "DELETE" ? "var(--danger)" : "var(--text-tertiary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: 8,
            background: toast.type === "error" ? "var(--danger)" : "var(--gold-dark)",
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            zIndex: 1001,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
