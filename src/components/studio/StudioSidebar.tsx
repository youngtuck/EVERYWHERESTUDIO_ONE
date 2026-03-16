import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { LayoutDashboard, PenLine, Eye, FileText, FolderOpen, Folder, Settings, Plus, ChevronDown, Bookmark, LogOut, Hammer, Package } from "lucide-react";

// ── Nav items (exact order: My Studio → Work → Watch → The Lot → Resources → Projects → The Workbench → Wrap → The Vault → Settings) ──
const NAV = [
  { path: "/studio/dashboard",       label: "My Studio",     icon: LayoutDashboard },
  { path: "/studio/work",            label: "Work",         icon: PenLine },
  { path: "/studio/watch",           label: "Watch",       icon: Eye,        badge: "11" },
  { path: "/studio/lot",             label: "The Lot",      icon: Bookmark },
  { path: "/studio/resources",       label: "Resources",    icon: Folder },
  { path: "/studio/projects",        label: "Projects",     icon: FolderOpen },
  { path: "/studio/workbench",       label: "The Workbench", icon: Hammer },
  { path: "/studio/wrap",            label: "Wrap",         icon: Package },
  { path: "/studio/outputs",         label: "The Vault",     icon: FileText },
  { path: "/studio/settings/voice", label: "Settings",      icon: Settings },
];

function titleCase(str: string) {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMobileClose?: () => void;
}

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();

  const [installState, setInstallState] = useState<"hidden" | "prompt" | "installed">("prompt");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboardingComplete(null);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setOnboardingComplete(data?.onboarding_complete ?? false));
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setInstallState("hidden");
      return;
    }
    if (localStorage.getItem("everywhere-install-dismissed") === "true") {
      setInstallState("hidden");
      return;
    }
    if (localStorage.getItem("everywhere-installed") === "true") {
      setInstallState("installed");
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    setInstallState("prompt");
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem("everywhere-installed", "true");
          setInstallState("installed");
        }
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem("everywhere-install-dismissed", "true");
    setInstallState("hidden");
  };

  const isChrome = /Chrome|Edg/.test(navigator.userAgent) && !/Safari|FxiOS/.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings/voice") return loc.pathname === p || loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/workbench") return loc.pathname === p || loc.pathname.startsWith("/studio/workbench/");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  return (
    <>
      {/* Install instructions modal (when browser doesn't give us the native prompt) */}
      {showInstallModal && (
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
          onClick={() => setShowInstallModal(false)}
        >
          <div
            style={{
              background: "#F4F2ED",
              borderRadius: 16,
              padding: "24px 28px",
              maxWidth: 400,
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
              Install EVERYWHERE Studio
            </div>
            <p style={{ fontSize: 14, color: "rgba(0,0,0,0.7)", lineHeight: 1.5, margin: "0 0 16px" }}>
              When your browser offers to install, we’ll show the usual “Do you want to install?” dialog right here. Until then, use one of these:
            </p>
            {isIOS ? (
              <p style={{ fontSize: 14, color: "rgba(0,0,0,0.8)", lineHeight: 1.5 }}>
                Tap the <strong>Share</strong> button at the bottom of Safari (square with an arrow), then tap <strong>“Add to Home Screen”</strong>.
              </p>
            ) : isChrome ? (
              <p style={{ fontSize: 14, color: "rgba(0,0,0,0.8)", lineHeight: 1.5 }}>
                Click the <strong>three-dot menu (⋮)</strong> in the top-right of the window, then choose <strong>“Install EVERYWHERE Studio”</strong>. You may also see an install icon in the address bar.
              </p>
            ) : (
              <p style={{ fontSize: 14, color: "rgba(0,0,0,0.8)", lineHeight: 1.5 }}>
                Open your browser menu and look for <strong>“Install app”</strong> or <strong>“Add to Home Screen”</strong>.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              style={{
                marginTop: 20,
                width: "100%",
                background: "#C8961A",
                color: "#1a1a1a",
                border: "none",
                borderRadius: 10,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

    <aside style={{
      width: collapsed ? 68 : "var(--studio-sidebar-width)",
      flexShrink: 0,
      height: "100vh",
      background: "#fff",
      borderRight: "1px solid rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "sticky",
      top: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Logo + collapse toggle ────────────────────────────────── */}
      <div style={{
        padding: "16px 12px 14px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 8,
      }}>
        <button
          onClick={() => nav("/")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: 0,
          }}
          aria-label="Back to home"
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "linear-gradient(135deg, #4a90f5 0%, #6b4dd4 100%)",
            flexShrink: 0,
            boxShadow: "0 1px 6px rgba(74,144,245,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
            }} />
          </div>
          {!collapsed && (
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, letterSpacing: "-0.02em",
                color: "var(--fg)", lineHeight: 1.2,
              }}>
                <span>EVERY</span>
                <span style={{ color: "var(--fg-3)" }}>WHERE</span>
              </div>
              <div style={{
                fontSize: 9, fontWeight: 500, letterSpacing: "0.14em",
                color: "var(--fg-3)", textTransform: "uppercase",
              }}>Studio</div>
            </div>
          )}
        </button>
        {!collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 10,
              color: "var(--fg-3)",
            }}
            aria-label="Collapse sidebar"
          >
            ◀
          </button>
        )}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--fg-2)",
              fontFamily: "var(--font)",
            }}
            aria-label="Close menu"
          >
            Close
          </button>
        )}
        {collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            style={{
              position: "absolute",
              right: 8,
              top: 12,
              background: "none",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "2px 4px",
              cursor: "pointer",
              fontSize: 10,
              color: "var(--fg-3)",
            }}
            aria-label="Expand sidebar"
          >
            ▶
          </button>
        )}
      </div>

      {/* ── Project (reference: "My Studio" with dropdown) ────────────────── */}
      <div style={{ padding: "14px 14px 0" }}>
        <button style={{
          width: "100%",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--studio-radius)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "var(--font)",
        }}>
          {!collapsed && (
            <>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>My Studio</div>
              </div>
              <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            </>
          )}
          {collapsed && (
            <div style={{ width: "100%", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--fg-3)" }}>
              My
            </div>
          )}
        </button>
      </div>

      {/* ── New Session ──────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 10px" }}>
        <button
          onClick={() => nav("/studio/work")}
          style={{
            width: "100%",
            background: "var(--fg)",
            color: "var(--bg)",
            border: "none",
            borderRadius: "var(--studio-radius)",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "-0.02em",
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Session
        </button>
      </div>

      {/* Onboarding progress: show when not complete */}
      {onboardingComplete === false && !collapsed && (
        <div style={{ padding: "0 14px 12px" }}>
          <button
            onClick={() => nav("/onboarding")}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(200,150,26,0.1)",
              border: "1px solid rgba(200,150,26,0.25)",
              borderRadius: "var(--studio-radius)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--gold-dark)",
              cursor: "pointer",
              fontFamily: "var(--font)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Finish setup
            <span style={{ fontSize: 10 }}>→</span>
          </button>
        </div>
      )}

      {/* ── Main nav (with icons) ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "6px 10px", overflowY: "auto" }} aria-label="Studio navigation">
        <div style={{ paddingBottom: 4 }}>
          {NAV.map(({ path, label, icon: Icon, badge }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`nav-item ${active ? "active" : ""}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  paddingLeft: active ? "12px" : "14px",
                  marginBottom: 2,
                  border: "none",
                  borderRadius: "var(--studio-radius)",
                  borderLeft: active ? "2px solid #C8961A" : "2px solid transparent",
                  background: active ? "rgba(200,150,26,0.08)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: 12,
                  textAlign: "left",
                  opacity: active ? 1 : 0.5,
                  transition: "background 0.15s, color 0.15s, opacity 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-2)";
                    e.currentTarget.style.opacity = "0.8";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.opacity = "0.5";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 24, height: 22, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 6,
                    background: active ? "rgba(200,150,26,0.12)" : "transparent",
                    color: active ? "var(--fg)" : "var(--fg-3)",
                    flexShrink: 0,
                    border: active ? "1px solid var(--line-2)" : "1px solid var(--line)",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}>
                    <Icon size={12} strokeWidth={2} />
                  </span>
                  {!collapsed && (
                    <span style={{ color: active ? "var(--fg)" : "var(--fg-3)" }}>{label}</span>
                  )}
                </div>
                {badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    background: "rgba(200,150,26,0.12)",
                    color: "var(--gold)",
                    border: "1px solid rgba(200,150,26,0.2)",
                    borderRadius: 100, padding: "2px 6px",
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Install app card — between nav and Conversations */}
        {!collapsed && installState === "prompt" && (
          <div
            onClick={handleInstall}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleInstall()}
            style={{
              margin: "0 12px 16px 12px",
              padding: "12px 14px",
              background: "rgba(200, 150, 26, 0.06)",
              border: "1px solid rgba(200, 150, 26, 0.12)",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(200, 150, 26, 0.25)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(200, 150, 26, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(200, 150, 26, 0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <rect x="2" y="2" width="12" height="9" rx="1.5" stroke="#C8961A" strokeWidth="1.3" fill="none" />
              <line x1="8" y1="11" x2="8" y2="14" stroke="#C8961A" strokeWidth="1.3" />
              <line x1="5.5" y1="14" x2="10.5" y2="14" stroke="#C8961A" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>Get the app</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 2, lineHeight: 1.3 }}>Install for the full experience</div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(0,0,0,0.2)",
                fontSize: 14,
                lineHeight: 1,
                padding: "2px 4px",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(0,0,0,0.5)";
                e.stopPropagation();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(0,0,0,0.2)";
              }}
            >
              ×
            </button>
          </div>
        )}
        {!collapsed && installState === "installed" && (
          <div
            style={{
              margin: "0 12px 16px 12px",
              padding: "10px 14px",
              background: "rgba(0,0,0,0.02)",
              border: "1px solid rgba(0,0,0,0.04)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" fill="none" />
              <path d="M4 7l2 2 4-4" stroke="rgba(0,0,0,0.25)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.3)" }}>App installed</span>
          </div>
        )}

        {/* Conversations (reference: CONVERSATIONS + New conversation) ───────── */}
        <div style={{ paddingTop: 8, paddingBottom: 4 }}>
          {!collapsed && <div className="nav-section-label">Conversations</div>}
          <button
            onClick={() => nav("/studio/work")}
            className="nav-item"
            style={{ gap: 10, cursor: "pointer", transition: "color 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#C8961A"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--fg)"; }}
          >
            <Plus size={12} strokeWidth={2} style={{ flexShrink: 0, color: "var(--fg-3)" }} />
            <span>New conversation</span>
          </button>
        </div>
      </nav>

      {/* ── Bottom: user profile ─────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--line)",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 4px",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #C8961A, #F0B429)",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#0A0A0A",
          }}>
            {(user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {!collapsed && (user?.user_metadata?.full_name
                ? titleCase(user.user_metadata.full_name as string)
                : user?.email
                  ? titleCase(user.email.split("@")[0])
                  : "Signed in")}
            </div>
            {!collapsed && <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{user?.email || ""}</div>}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 6,
              color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
