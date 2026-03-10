import { useState } from "react";
import { User, Palette, Sliders, Eye, Bell } from "lucide-react";

const TABS = [
  { label: "Account", icon: User },
  { label: "Appearance", icon: Palette },
  { label: "Studio", icon: Sliders },
  { label: "Sentinel", icon: Eye },
  { label: "Notifications", icon: Bell },
];

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

function SettingRow({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) {
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
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{label}</p>
        {desc && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 0 }}>{desc}</p>}
      </div>
      {control}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [agentNames, setAgentNames] = useState(false);
  const [oneQuestion, setOneQuestion] = useState(true);
  const [proactive, setProactive] = useState(true);
  const [threshold, setThreshold] = useState(800);
  const [sentinelFreq, setSentinelFreq] = useState("daily");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

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

      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-subtle)", marginBottom: 24, overflowX: "auto" }}>
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

      {activeTab === 0 && (
        <div>
          <SettingRow label="Full Name" control={<input className="input-field" defaultValue="Mark Sylvester" style={{ maxWidth: 220, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8 }} />} />
          <SettingRow label="Email" control={<input className="input-field" defaultValue="mark@mixedgrill.net" style={{ maxWidth: 220, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8 }} />} />
          <SettingRow label="Organization" control={<input className="input-field" defaultValue="Mixed Grill LLC" style={{ maxWidth: 220, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8 }} />} />
          <SettingRow label="Change Password" control={<button type="button" style={{ background: "transparent", color: "var(--gold-dark)", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Update Password</button>} />
          <SettingRow label="Sign Out All Devices" control={<button type="button" style={{ background: "transparent", color: "var(--danger)", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Sign Out</button>} />
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <SettingRow label="Sidebar" desc="Default state on load" control={
            <select style={{ maxWidth: 160, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8, background: "var(--surface-white)" }}>
              <option>Expanded</option>
              <option>Collapsed</option>
            </select>
          } />
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <SettingRow label="Show Agent Names" desc="Display Watson, Sentinel, etc." control={<Toggle value={agentNames} onChange={setAgentNames} />} />
          <SettingRow label="One Question at a Time" desc="Watson asks one question per message" control={<Toggle value={oneQuestion} onChange={setOneQuestion} />} />
          <SettingRow label="Proactive Suggestions" desc="Watson surfaces ideas without being asked" control={<Toggle value={proactive} onChange={setProactive} />} />
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Publication Threshold</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2, marginBottom: 0 }}>Minimum Betterish score to flag as ready</p>
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--gold-dark)" }}>{threshold}</span>
            </div>
            <input type="range" min={600} max={950} step={10} value={threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ width: "100%", accentColor: "var(--gold-dark)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>600 · lenient</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>950 · strict</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <SettingRow label="Briefing Frequency" desc="How often Sentinel compiles a briefing" control={
            <select value={sentinelFreq} onChange={(e) => setSentinelFreq(e.target.value)} style={{ maxWidth: 140, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8, background: "var(--surface-white)" }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual only</option>
            </select>
          } />
          <SettingRow label="Topics" desc="Industries and themes to monitor" control={<button type="button" style={{ background: "transparent", color: "var(--gold-dark)", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Configure</button>} />
          <SettingRow label="Competitor Tracking" desc="People and organizations" control={<button type="button" style={{ background: "transparent", color: "var(--gold-dark)", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Configure</button>} />
          <SettingRow label="Event Radar" desc="Location for events" control={<input defaultValue="Santa Barbara, CA" style={{ maxWidth: 200, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: 8 }} />} />
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <SettingRow label="Email Notifications" desc="Gate completions, briefings" control={<Toggle value={emailNotifs} onChange={setEmailNotifs} />} />
          <SettingRow label="Browser Push" desc="When content clears all gates" control={<Toggle value={pushNotifs} onChange={setPushNotifs} />} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          style={{
            background: "var(--gold-dark)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold-light)"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gold-dark)"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
