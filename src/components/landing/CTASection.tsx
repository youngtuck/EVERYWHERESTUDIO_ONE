import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section
      id="contact"
      style={{
        background: "#ffffff",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>

        <span className="fade-up section-label" style={{ display: "block", marginBottom: 20 }}>
          One Idea. Everywhere.
        </span>

        <h2
          className="fade-up delay-1"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            color: "#0D1B2A",
            letterSpacing: "-2px",
            lineHeight: 1.0,
            marginBottom: 24,
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          The mountain gets carried.
        </h2>

        <p
          className="fade-up delay-2"
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: "#6b7280",
            lineHeight: 1.65,
            marginBottom: 52,
            fontFamily: "'Afacad Flux', sans-serif",
          }}
        >
          Start with your Voice DNA. It's free, it takes 15 minutes, and it's the most useful thing you'll do for your content this year.
        </p>

        {/* Primary CTA */}
        <div className="fade-up delay-3" style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              background: "#0D1B2A",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "18px 52px",
              borderRadius: 4,
              fontFamily: "'Afacad Flux', sans-serif",
              transition: "background 0.2s ease, transform 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1B263B"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0D1B2A"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Extract Your Voice DNA
            <ArrowRight size={14} />
          </button>
        </div>

        <p
          className="fade-up delay-4"
          style={{
            fontSize: 12,
            color: "#9ca3af",
            fontFamily: "'Afacad Flux', sans-serif",
            letterSpacing: "0.5px",
            marginBottom: 64,
          }}
        >
          Free. No credit card. No commitment.
        </p>

        {/* Divider */}
        <div
          className="fade-up delay-4"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 48,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#9ca3af",
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            Or stay connected
          </span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        {/* Email capture */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="fade-up delay-5">
            <div
              style={{
                display: "flex",
                gap: 0,
                maxWidth: 420,
                margin: "0 auto",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#0D1B2A"; }}
              onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb"; }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "14px 20px",
                  fontSize: 14,
                  fontFamily: "'Afacad Flux', sans-serif",
                  color: "#0D1B2A",
                  background: "#ffffff",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#F5C642",
                  color: "#0D1B2A",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  padding: "14px 22px",
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "opacity 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Stay Updated
              </button>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 10,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              When something worth knowing happens, you'll hear about it.
            </p>
          </form>
        ) : (
          <div
            className="fade-up visible"
            style={{
              padding: "20px 32px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            <p style={{ fontSize: 15, color: "#374151", fontFamily: "'Afacad Flux', sans-serif" }}>
              You're in. We'll be in touch.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CTASection;
