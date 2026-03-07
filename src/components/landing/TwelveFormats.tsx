import { useState } from "react";

const FORMATS = [
  { num: "01", label: "LinkedIn Post", category: "Social", desc: "Native long-form post. Algorithm-optimized. No external links in copy." },
  { num: "02", label: "Newsletter", category: "Email", desc: "Campaign-ready email with subject line, preview text, and segmentation notes." },
  { num: "03", label: "Podcast Script", category: "Audio", desc: "Full episode script with music cues, energy markers, and intro/outro structure." },
  { num: "04", label: "Twitter Thread", category: "Social", desc: "Hook, 7–12 numbered threads, call-to-action. Each tweet under 280 characters." },
  { num: "05", label: "Long-form Essay", category: "Written", desc: "Publication-ready piece with headline, subheads, pull quotes, and byline." },
  { num: "06", label: "Short Video Script", category: "Video", desc: "60–90 second script with b-roll cues. Portrait and landscape formats." },
  { num: "07", label: "Substack Note", category: "Written", desc: "Standalone note (not 'New post!') — hook, context, invitation. Discovery-optimized." },
  { num: "08", label: "Talk Outline", category: "Speaking", desc: "Stage-ready structure with timing marks, personalization cues, audience anchors." },
  { num: "09", label: "Email Campaign", category: "Email", desc: "3–5 email sequence. Welcome, nurture, conversion, and re-engagement variants." },
  { num: "10", label: "Press Release", category: "PR", desc: "AP-style release with headline, dateline, quote, and boilerplate." },
  { num: "11", label: "Blog Post", category: "Written", desc: "SEO-structured post with title tag, meta description, headers, and internal links." },
  { num: "12", label: "Executive Brief", category: "Internal", desc: "One-page summary. Bottom-line up front. Decision-ready. No fluff." },
];

const TwelveFormats = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="work"
      style={{
        background: "#f9fafb",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 72 }}>
          <span className="section-label" style={{ display: "block", marginBottom: 16 }}>One Idea</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                fontWeight: 800,
                color: "#0D1B2A",
                letterSpacing: "-2px",
                lineHeight: 1.0,
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              12 formats.
            </h2>
            <span
              style={{
                fontSize: "clamp(20px, 3vw, 36px)",
                fontWeight: 300,
                color: "#9ca3af",
                letterSpacing: "-0.5px",
                fontFamily: "'Afacad Flux', sans-serif",
              }}
            >
              Every platform.
            </span>
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: "#6b7280",
              maxWidth: 500,
              marginTop: 20,
              lineHeight: 1.65,
              fontFamily: "'Afacad Flux', sans-serif",
            }}
          >
            You record a voice memo in the car. By the time you're at your desk, twelve versions exist — each written natively for its platform, in your voice.
          </p>
        </div>

        {/* Format grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "#e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
          className="format-grid"
        >
          {FORMATS.map((format, i) => (
            <div
              key={format.num}
              className="fade-in"
              style={{
                transitionDelay: `${i * 40}ms`,
                background: hovered === i ? "#0D1B2A" : "#ffffff",
                padding: "32px 28px",
                cursor: "default",
                transition: "background 0.25s ease",
                position: "relative",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: hovered === i ? "rgba(255,255,255,0.2)" : "#d1d5db",
                    fontFamily: "'Afacad Flux', sans-serif",
                    letterSpacing: "1px",
                  }}
                >
                  {format.num}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: hovered === i ? "rgba(245,198,66,0.7)" : "#9ca3af",
                    fontFamily: "'Afacad Flux', sans-serif",
                    transition: "color 0.25s ease",
                  }}
                >
                  {format.category}
                </span>
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: hovered === i ? "#ffffff" : "#0D1B2A",
                  marginBottom: 10,
                  fontFamily: "'Afacad Flux', sans-serif",
                  letterSpacing: "-0.2px",
                  transition: "color 0.25s ease",
                }}
              >
                {format.label}
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: hovered === i ? "rgba(255,255,255,0.45)" : "#9ca3af",
                  lineHeight: 1.55,
                  fontFamily: "'Afacad Flux', sans-serif",
                  transition: "color 0.25s ease",
                }}
              >
                {format.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p
          className="fade-up"
          style={{
            textAlign: "center",
            marginTop: 36,
            fontSize: 13,
            color: "#9ca3af",
            fontFamily: "'Afacad Flux', sans-serif",
            letterSpacing: "0.3px",
          }}
        >
          All 12 formats pass 7 quality gates before they reach you. Nothing ships that isn't ready.
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .format-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .format-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default TwelveFormats;
