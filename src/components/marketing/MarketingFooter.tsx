import Logo from "../Logo";

export default function MarketingFooter() {
  return (
    <footer style={{ padding: "36px 48px", background: "var(--xp-white)", borderTop: "1px solid var(--xp-border)" }}>
      <div className="xp-footer-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <Logo size="sm" variant="light" />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(label => (
            <button key={label} type="button" className="xp-footer-link">{label}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--xp-ter)" }}>&copy; {new Date().getFullYear()} Mixed Grill, LLC. All rights reserved.</span>
      </div>
    </footer>
  );
}
