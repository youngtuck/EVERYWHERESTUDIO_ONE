import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import Logo from "../Logo";
import { PenLine, Eye, Home, Package, Bookmark, Archive, BookOpen, FolderOpen, Settings, Shield, LogOut } from "lucide-react";

const NAV_GROUPS = [
  {
    items: [
      { path: "/studio/dashboard", label: "Home", icon: Home },
    ],
  },
  {
    items: [
      { path: "/studio/watch", label: "Watch", icon: Eye },
      { path: "/studio/work", label: "Work", icon: PenLine },
      { path: "/studio/wrap", label: "Wrap", icon: Package },
    ],
  },
  {
    items: [
      { path: "/studio/lot", label: "The Lot", icon: Bookmark },
      { path: "/studio/outputs", label: "The Vault", icon: Archive },
    ],
  },
  {
    items: [
      { path: "/studio/resources", label: "Resources", icon: BookOpen },
      { path: "/studio/projects", label: "Projects", icon: FolderOpen },
      { path: "/studio/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMobileClose?: () => void;
}

export default function StudioSidebar({ collapsed = false, onToggleCollapsed, onMobileClose }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, signOut, displayName } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("is_admin").eq("id", user.id).single().then(({ data }) => {
      setIsAdmin(!!data?.is_admin);
    });
  }, [user]);

  const isActive = (p: string) => {
    if (p === "/studio/work") return loc.pathname === p || loc.pathname.startsWith("/studio/work/");
    if (p === "/studio/settings") return loc.pathname.startsWith("/studio/settings");
    if (p === "/studio/wrap") return loc.pathname === p || loc.pathname.startsWith("/studio/wrap/");
    if (p === "/studio/outputs") return loc.pathname === "/studio/outputs" && !loc.search.includes("view=in_progress");
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  const handleSignOut = async () => {
    await signOut();
    nav("/");
  };

  // On mobile, filter out items already in bottom nav
  const filterForMobile = (items: typeof NAV_GROUPS[0]["items"]) => {
    if (!onMobileClose) return items;
    const bottomNavPaths = ["/studio/dashboard", "/studio/watch", "/studio/work", "/studio/wrap", "/studio/settings"];
    return items.filter(i => !bottomNavPaths.includes(i.path));
  };

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      flexShrink: 0,
      height: "100vh",
      background: "var(--bg-2)",
      boxShadow: "1px 0 0 var(--line)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Afacad Flux', sans-serif",
      transition: "width 0.15s ease",
    }}>
      {/* Logo + close */}
      <div style={{
        padding: collapsed ? "16px 8px" : "16px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 8,
      }}>
        <div
          onClick={() => nav("/studio/dashboard")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          title="Go to dashboard"
        >
          {collapsed ? (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--cornflower)", opacity: 0.8 }} />
          ) : (
            <Logo size={14} />
          )}
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 18, padding: 4 }}
            aria-label="Close menu"
          >
            x
          </button>
        )}
        {!collapsed && onToggleCollapsed && !onMobileClose && (
          <button
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 12, padding: "4px 6px", borderRadius: 4, opacity: 0.5, transition: "opacity 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; }}
            aria-label="Collapse sidebar"
          >
            &#9664;
          </button>
        )}
        {collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            style={{ position: "absolute", right: -12, top: 20, width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--line)", background: "var(--bg-2)", cursor: "pointer", color: "var(--fg-3)", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, transition: "opacity 0.15s", opacity: 0 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}
            aria-label="Expand sidebar"
          >
            &#9654;
          </button>
        )}
      </div>

      {/* New Session button */}
      {!onMobileClose && (
        <div style={{ padding: collapsed ? "8px 8px" : "8px 12px" }}>
          <button
            onClick={() => nav("/studio/work")}
            title="Start a new session"
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: collapsed ? "10px 0" : "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--fg-2)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            {!collapsed && "New Session"}
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? "8px 4px" : "8px 8px", overflowY: "auto" }} aria-label="Studio navigation">
        {NAV_GROUPS.map((group, gi) => {
          const items = filterForMobile(group.items);
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {gi > 0 && <div style={{ height: 1, background: "var(--line)", margin: "12px 8px", opacity: 0.5 }} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <button
                      key={path}
                      onClick={() => { nav(path); onMobileClose?.(); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: 10,
                        padding: collapsed ? "10px 0" : "8px 12px",
                        border: "none",
                        borderRadius: 8,
                        background: active ? "rgba(0, 0, 0, 0.05)" : "transparent",
                        cursor: "pointer",
                        fontFamily: "'Afacad Flux', sans-serif",
                        fontSize: 14,
                        fontWeight: active ? 500 : 400,
                        color: active ? "var(--fg)" : "var(--fg-3)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = "var(--fg-2)"; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; } }}
                      title={label}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      {!collapsed && <span>{label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Admin */}
        {isAdmin && (
          <>
            <div style={{ height: 1, background: "var(--line)", margin: "12px 8px", opacity: 0.5 }} />
            <button
              onClick={() => nav("/studio/admin")}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 10, padding: "8px 12px", border: "none", borderRadius: 8,
                background: isActive("/studio/admin") ? "rgba(0,0,0,0.05)" : "transparent",
                cursor: "pointer", fontFamily: "'Afacad Flux', sans-serif",
                fontSize: 14, fontWeight: 400, color: "var(--gold)",
                transition: "all 0.15s ease",
              }}
            >
              <Shield size={18} strokeWidth={1.8} />
              {!collapsed && <span>Admin</span>}
            </button>
          </>
        )}
      </nav>

      {/* User section */}
      <div style={{
        padding: collapsed ? "12px 8px" : "12px 12px",
        borderTop: "1px solid var(--line)",
      }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 4px", borderRadius: 8, cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          onClick={handleSignOut}
          title="Sign out"
        >
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: "var(--bg-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: "var(--fg-2)", flexShrink: 0,
          }}>
            {(displayName || user?.email || "?")[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName || "Signed in"}
              </div>
            </div>
          )}
          {!collapsed && <LogOut size={14} style={{ color: "var(--fg-3)", flexShrink: 0 }} />}
        </div>
      </div>
    </aside>
  );
}
