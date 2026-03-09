import { useState } from "react";
import { User, Palette, Sliders, Eye, Bell } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

const TABS = [
  { label:"Account", icon:User },
  { label:"Appearance", icon:Palette },
  { label:"Studio", icon:Sliders },
  { label:"Sentinel", icon:Eye },
  { label:"Notifications", icon:Bell },
];

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v:boolean)=>void }) => (
  <div onClick={() => onChange(!value)}
    style={{ width:40, height:22, borderRadius:11, background:value?"var(--text-primary)":"var(--bg-tertiary)", cursor:"pointer", position:"relative", transition:"background 0.2s ease", border:"1px solid var(--border)", flexShrink:0 }}>
    <div style={{ width:16, height:16, borderRadius:"50%", background:value?"var(--bg-primary)":"var(--text-muted)", position:"absolute", top:2, left:value?20:2, transition:"left 0.2s ease" }} />
  </div>
);

const SettingRow = ({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
    <div style={{ flex: 1, marginRight: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{label}</p>
      {desc && <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{desc}</p>}
    </div>
    {control}
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [agentNames, setAgentNames] = useState(false);
  const [oneQuestion, setOneQuestion] = useState(true);
  const [proactive, setProactive] = useState(true);
  const [threshold, setThreshold] = useState(800);
  const [sentinelFreq, setSentinelFreq] = useState("daily");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  return (
    <div style={{ maxWidth: 700, fontFamily: "var(--font)" }}>
      <div style={{ marginBottom: "var(--studio-gap-lg)" }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Studio</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em" }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", marginBottom: 24, overflowX: "auto" }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, fontWeight: activeTab === i ? 600 : 500, color: activeTab === i ? "var(--fg)" : "var(--fg-3)", borderBottom: activeTab === i ? "2px solid var(--gold)" : "2px solid transparent", whiteSpace: "nowrap", marginBottom: -1 }}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 0 && (
        <div>
          <SettingRow label="Full Name" control={<input className="input-field" defaultValue="Mark Sylvester" style={{ maxWidth: 220 }} />} />
          <SettingRow label="Email" control={<input className="input-field" defaultValue="mark@mixedgrill.net" style={{ maxWidth: 220 }} />} />
          <SettingRow label="Organization" control={<input className="input-field" defaultValue="Mixed Grill LLC" style={{ maxWidth: 220 }} />} />
          <SettingRow label="Change Password" control={<button className="btn-ghost" style={{ fontSize: 12 }}>Update Password</button>} />
          <SettingRow label="Sign Out All Devices" control={<button className="btn-ghost" style={{ fontSize: 12, borderColor: "rgba(220,38,38,0.3)", color: "rgba(220,38,38,0.9)" }}>Sign Out</button>} />
        </div>
      )}

      {/* Appearance */}
      {activeTab === 1 && (
        <div>
          <SettingRow label="Theme" desc="Light or dark" control={<ThemeToggle />} />
          <SettingRow label="Sidebar" desc="Default state on load" control={
            <select className="input-field" style={{ maxWidth: 160 }}>
              <option>Expanded</option>
              <option>Collapsed</option>
            </select>
          } />
        </div>
      )}

      {/* Studio */}
      {activeTab === 2 && (
        <div>
          <SettingRow label="Show Agent Names" desc="Display Watson, Sentinel, etc." control={<Toggle value={agentNames} onChange={setAgentNames} />} />
          <SettingRow label="One Question at a Time" desc="Watson asks one question per message" control={<Toggle value={oneQuestion} onChange={setOneQuestion} />} />
          <SettingRow label="Proactive Suggestions" desc="Watson surfaces ideas without being asked" control={<Toggle value={proactive} onChange={setProactive} />} />
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Publication Threshold</p>
                <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>Minimum Betterish score to flag as ready</p>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{threshold}</span>
            </div>
            <input type="range" min={600} max={950} step={10} value={threshold} onChange={e => setThreshold(+e.target.value)}
              style={{ width: "100%", accentColor: "var(--gold)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "var(--fg-3)" }}>600 — lenient</span>
              <span style={{ fontSize: 10, color: "var(--fg-3)" }}>950 — strict</span>
            </div>
          </div>
        </div>
      )}

      {/* Sentinel */}
      {activeTab === 3 && (
        <div>
          <SettingRow label="Briefing Frequency" desc="How often Sentinel compiles a briefing" control={
            <select className="input-field" value={sentinelFreq} onChange={e => setSentinelFreq(e.target.value)} style={{ maxWidth: 140 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual only</option>
            </select>
          } />
          <SettingRow label="Topics" desc="Industries and themes to monitor" control={<button className="btn-ghost" style={{ fontSize: 12 }}>Configure (soon)</button>} />
          <SettingRow label="Competitor Tracking" desc="People and organizations" control={<button className="btn-ghost" style={{ fontSize: 12 }}>Configure (soon)</button>} />
          <SettingRow label="Event Radar" desc="Location for events" control={<input className="input-field" defaultValue="Santa Barbara, CA" style={{ maxWidth: 200 }} />} />
        </div>
      )}

      {/* Notifications */}
      {activeTab === 4 && (
        <div>
          <SettingRow label="Email Notifications" desc="Gate completions, briefings" control={<Toggle value={emailNotifs} onChange={setEmailNotifs} />} />
          <SettingRow label="Browser Push" desc="When content clears all gates" control={<Toggle value={pushNotifs} onChange={setPushNotifs} />} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button className="btn-primary" style={{ fontSize: 13 }}>Save Changes</button>
      </div>
    </div>
  );
};
export default Settings;
