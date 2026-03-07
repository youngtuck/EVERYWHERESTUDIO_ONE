import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section id="contact" style={{ background: "#ffffff", padding: "120px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>

        <p className="fade-up eyebrow" style={{ marginBottom: 20 }}>One Idea. Everywhere.</p>

        <h2 className="fade-up delay-1" style={{ fontSize: "clamp(44px, 6.5vw, 80px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-3px", lineHeight: 0.95, marginBottom: 24, fontFamily: "'Afacad Flux', sans-serif" }}>
          The mountain<br />gets carried.
        </h2>

        <p className="fade-up delay-2" style={{ fontSize: 17, color: "#777777", lineHeight: 1.65, marginBottom: 52, fontFamily: "'Afacad Flux', sans-serif" }}>
          Start with your Voice DNA. Free, 15 minutes, the most useful thing you'll do for your content this year.
        </p>

        <div className="fade-up delay-3" style={{ marginBottom: 16 }}>
          <button onClick={() => navigate("/auth")} style={{
            background: "#0A0A0A", color: "#ffffff",
            border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", padding: "16px 52px",
            borderRadius: 4, fontFamily: "'Afacad Flux', sans-serif",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Extract Your Voice DNA</button>
        </div>

        <p className="fade-up delay-4" style={{ fontSize: 11, color: "#BBBBBB", fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "0.5px", marginBottom: 64 }}>
          Free. No credit card. No commitment.
        </p>

        <div className="fade-up delay-4" style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#BBBBBB", fontFamily: "'Afacad Flux', sans-serif", whiteSpace: "nowrap" }}>Or stay updated</span>
          <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
        </div>

        {!done ? (
          <form className="fade-up delay-5" onSubmit={e => { e.preventDefault(); if (email) setDone(true); }} style={{ display: "flex", maxWidth: 400, margin: "0 auto", border: "1px solid #E8E8E8", borderRadius: 5, overflow: "hidden" }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
              style={{ flex: 1, border: "none", outline: "none", padding: "13px 18px", fontSize: 14, fontFamily: "'Afacad Flux', sans-serif", color: "#0A0A0A", background: "#ffffff" }} />
            <button type="submit" style={{
              background: "#F5C642", color: "#0A0A0A",
              border: "none", cursor: "pointer",
              fontSize: 9, fontWeight: 700, letterSpacing: "2px",
              textTransform: "uppercase", padding: "13px 20px",
              fontFamily: "'Afacad Flux', sans-serif", whiteSpace: "nowrap",
              transition: "opacity 0.2s ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Stay Updated</button>
          </form>
        ) : (
          <div className="fade-up visible" style={{ padding: "16px 28px", background: "#F8F8F8", border: "1px solid #E8E8E8", borderRadius: 7, display: "inline-block" }}>
            <p style={{ fontSize: 14, color: "#555555", fontFamily: "'Afacad Flux', sans-serif" }}>You're in. We'll be in touch.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CTASection;
