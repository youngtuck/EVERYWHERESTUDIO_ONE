import { useState } from "react";

const FORMATS = [
  { num: "01", label: "LinkedIn Post", cat: "Social", desc: "Native long-form post. Algorithm-optimized. No external links in copy." },
  { num: "02", label: "Newsletter", cat: "Email", desc: "Campaign-ready with subject line, preview text, and segmentation notes." },
  { num: "03", label: "Podcast Script", cat: "Audio", desc: "Full episode with music cues, energy markers, and intro/outro structure." },
  { num: "04", label: "Twitter Thread", cat: "Social", desc: "Hook, 8–12 threads, CTA. Each tweet under 280 characters." },
  { num: "05", label: "Long-form Essay", cat: "Written", desc: "Publication-ready with headline, subheads, pull quotes, and byline." },
  { num: "06", label: "Short Video Script", cat: "Video", desc: "60–90 second script with b-roll cues. Portrait and landscape." },
  { num: "07", label: "Substack Note", cat: "Written", desc: "Standalone note — hook, context, invitation. Discovery-optimized." },
  { num: "08", label: "Talk Outline", cat: "Speaking", desc: "Stage-ready structure with timing marks and personalization cues." },
  { num: "09", label: "Email Campaign", cat: "Email", desc: "3–5 email sequence. Welcome, nurture, conversion, re-engagement." },
  { num: "10", label: "Press Release", cat: "PR", desc: "AP-style with headline, dateline, quote, and boilerplate." },
  { num: "11", label: "Blog Post", cat: "Written", desc: "SEO-structured with title tag, meta, headers, and internal links." },
  { num: "12", label: "Executive Brief", cat: "Internal", desc: "One-page. Bottom-line up front. Decision-ready. No fluff." },
];

const TwelveFormats = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="formats" style={{ background: "#F8F8F8", padding: "120px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div className="fade-up" style={{ marginBottom: 72, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 14 }}>One Idea</p>
            <h2 style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              fontWeight: 800, color: "#0A0A0A",
              letterSpacing: "-3px", lineHeight: 1.0,
              fontFamily: "'Afacad Flux', sans-serif",
            }}>
              12 formats.<br />
              <span style={{ fontWeight: 300, color: "#BBBBBB" }}>Every platform.</span>
            </h2>
          </div>
          <p style={{
            fontSize: 15, fontWeight: 400, color: "#777777",
            maxWidth: 320, lineHeight: 1.65,
            fontFamily: "'Afacad Flux', sans-serif",
          }}>
            You record a voice memo. By the time you're at your desk, twelve versions exist — each native to its platform, in your voice.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1, background: "#E8E8E8",
          borderRadius: 10, overflow: "hidden",
        }} className="fmt-grid">
          {FORMATS.map((f, i) => (
            <div key={f.num}
              className="fade-in"
              style={{
                background: hovered === i ? "#0A0A0A" : "#ffffff",
                padding: "28px 24px", cursor: "default",
                transition: "background 0.22s ease",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: hovered === i ? "rgba(255,255,255,0.15)" : "#D8D8D8", fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "1px" }}>{f.num}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: hovered === i ? "rgba(245,198,66,0.6)" : "#BBBBBB", fontFamily: "'Afacad Flux', sans-serif", transition: "color 0.22s ease" }}>{f.cat}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: hovered === i ? "#ffffff" : "#0A0A0A", marginBottom: 8, fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "-0.2px", transition: "color 0.22s ease" }}>{f.label}</p>
              <p style={{ fontSize: 12, color: hovered === i ? "rgba(255,255,255,0.38)" : "#999999", lineHeight: 1.55, fontFamily: "'Afacad Flux', sans-serif", transition: "color 0.22s ease" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="fade-up" style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#BBBBBB", fontFamily: "'Afacad Flux', sans-serif", letterSpacing: "0.3px" }}>
          Every format passes 7 quality gates before it reaches you.
        </p>
      </div>
      <style>{`
        @media(max-width:900px){.fmt-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:480px){.fmt-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  );
};

export default TwelveFormats;
