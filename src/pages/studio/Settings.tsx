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

const SettingRow = ({ label, desc, control }: { label:string; desc?:string; control:React.ReactNode }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
    <div style={{ flex:1, marginRight:20 }}>
      <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>{label}</p>
      {desc && <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"'Afacad Flux',sans-serif" }}>{desc}</p>}
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
    <div style={{ padding:"28px", maxWidth:700 }}>
      <div style={{ marginBottom:28 }}>
        <p className="eyebrow" style={{ marginBottom:8 }}>Studio</p>
        <h1 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", fontFamily:"'Afacad Flux',sans-serif" }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, borderBottom:"1px solid var(--border)", marginBottom:24, overflowX:"auto" }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", background:"none", border:"none", cursor:"pointer", fontFamily:"'Afacad Flux',sans-serif", fontSize:13, fontWeight:activeTab===i?700:500, color:activeTab===i?"var(--text-primary)":"var(--text-muted)", borderBottom:activeTab===i?"2px solid #F5C642":"2px solid transparent", whiteSpace:"nowrap", marginBottom:-1 }}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 0 && (
        <div>
          <SettingRow label="Full Name" control={<input className="input-field" defaultValue="Mark Sylvester" style={{ maxWidth:220 }} />} />
          <SettingRow label="Email" control={<input className="input-field" defaultValue="mark@mixedgrill.net" style={{ maxWidth:220 }} />} />
          <SettingRow label="Organization" control={<input className="input-field" defaultValue="Mixed Grill LLC" style={{ maxWidth:220 }} />} />
          <SettingRow label="Change Password" control={<button className="btn-ghost" style={{ fontSize:10 }}>Update Password</button>} />
          <SettingRow label="Sign Out All Devices" control={<button className="btn-ghost" style={{ fontSize:10, borderColor:"rgba(220,38,38,0.3)", color:"rgba(220,38,38,0.8)" }}>Sign Out</button>} />
        </div>
      )}

      {/* Appearance */}
      {activeTab === 1 && (
        <div>
          <SettingRow label="Theme" desc="Light or dark — your call" control={<ThemeToggle />} />
          <SettingRow label="Sidebar" desc="Default sidebar state on load" control={
            <select className="input-field" style={{ maxWidth:160 }}>
              <option>Expanded</option>
              <option>Collapsed</option>
            </select>
          } />
        </div>
      )}

      {/* Studio */}
      {activeTab === 2 && (
        <div>
          <SettingRow label="Show Agent Names" desc="Display Watson, Sentinel, etc. or keep the interface minimal" control={<Toggle value={agentNames} onChange={setAgentNames} />} />
          <SettingRow label="One Question at a Time" desc="Watson asks one question per message, not several" control={<Toggle value={oneQuestion} onChange={setOneQuestion} />} />
          <SettingRow label="Proactive Suggestions" desc="Watson surfaces ideas and next steps without being asked" control={<Toggle value={proactive} onChange={setProactive} />} />
          <div style={{ padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", fontFamily:"'Afacad Flux',sans-serif" }}>Publication Threshold</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, fontFamily:"'Afacad Flux',sans-serif" }}>Minimum Betterish score to flag as ready to publish</p>
              </div>
              <span style={{ fontSize:16, fontWeight:800, color:"#F5C642", fontFamily:"'Afacad Flux',sans-serif" }}>{threshold}</span>
            </div>
            <input type="range" min={600} max={950} step={10} value={threshold} onChange={e=>setThreshold(+e.target.value)}
              style={{ width:"100%", accentColor:"#F5C642" }} />
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>600 — lenient</span>
              <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'Afacad Flux',sans-serif" }}>950 — strict</span>
            </div>
          </div>
        </div>
      )}

      {/* Sentinel */}
      {activeTab === 3 && (
        <div>
          <SettingRow label="Briefing Frequency" desc="How often Sentinel runs and compiles a briefing" control={
            <select className="input-field" value={sentinelFreq} onChange={e=>setSentinelFreq(e.target.value)} style={{ maxWidth:140 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual only</option>
            </select>
          } />
          <SettingRow label="Topics" desc="Industries, themes, and subjects to monitor" control={<button className="btn-ghost" style={{ fontSize:10 }}>Configure (soon)</button>} />
          <SettingRow label="Competitor Tracking" desc="People and organizations in your category" control={<button className="btn-ghost" style={{ fontSize:10 }}>Configure (soon)</button>} />
          <SettingRow label="Event Radar" desc="Location for finding relevant events" control={<input className="input-field" defaultValue="Santa Barbara, CA" style={{ maxWidth:200 }} />} />
        </div>
      )}

      {/* Notifications */}
      {activeTab === 4 && (
        <div>
          <SettingRow label="Email Notifications" desc="Gate completions, Sentinel briefings ready" control={<Toggle value={emailNotifs} onChange={setEmailNotifs} />} />
          <SettingRow label="Browser Push" desc="Live alerts when content clears all gates" control={<Toggle value={pushNotifs} onChange={setPushNotifs} />} />
        </div>
      )}

      <div style={{ marginTop:24 }}>
        <button className="btn-primary" style={{ fontSize:10 }}>Save Changes</button>
      </div>
    </div>
  );
};
export default Settings;
