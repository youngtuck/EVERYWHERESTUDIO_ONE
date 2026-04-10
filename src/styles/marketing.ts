export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
export const EASE_SMOOTH = "cubic-bezier(0.4, 0, 0.2, 1)";

export const MARKETING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

:root {
  --xp-navy: #0C1A29;
  --xp-navy-deep: #060D14;
  --xp-gold: #C8A96E;
  --xp-blue: #4A90D9;
  --xp-white: #FFFFFF;
  --xp-off: #F8F9FA;
  --xp-text: #0A0A0A;
  --xp-sec: #6B7280;
  --xp-ter: #A1A1AA;
  --xp-on-dark: #F0EDE4;
  --xp-dim-dark: rgba(255,255,255,0.38);
  --xp-border: #E4E4E7;
  --xp-font: 'Instrument Sans', -apple-system, system-ui, sans-serif;
  --xp-mono: 'DM Mono', monospace;
  --xp-ease: ${EASE};
}

/* BASE */
.xp {
  font-family: var(--xp-font);
  font-size: 17px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--xp-white);
  color: var(--xp-text);
  overflow: clip;
}
.xp a { color: inherit; text-decoration: none; }
.xp ::selection { background: var(--xp-gold); color: var(--xp-navy); }
.xp button:active { transform: scale(0.97) !important; transition-duration: 0.1s !important; }
.xp-mono { font-family: var(--xp-mono); }

/* KEYFRAMES */
@keyframes xpSpin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
@keyframes xpSpinR { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(-360deg);} }
@keyframes xpDot { 0%,100%{opacity:.25;} 50%{opacity:1;} }
@keyframes xpGlow { 0%,100%{opacity:.03;} 50%{opacity:.07;} }
@keyframes xpSlideIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }
@keyframes xpFadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
@keyframes xpGatePulse { 0%{box-shadow:0 0 0 0 rgba(200,169,110,0.3);} 70%{box-shadow:0 0 0 8px rgba(200,169,110,0);} 100%{box-shadow:0 0 0 0 rgba(200,169,110,0);} }
@keyframes xpHeroLabel { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
@keyframes xpHeroHead { from{opacity:0;transform:translateY(20px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
@keyframes xpHeroLine { from{width:0;opacity:0;} to{width:64px;opacity:1;} }
@keyframes xpHeroSub { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
@keyframes xpHeroCta { from{opacity:0;transform:translateY(14px) scale(0.96);} to{opacity:1;transform:translateY(0) scale(1);} }
@keyframes xpRingFloat { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.015);} }
@keyframes xpScrollHint { 0%,100%{transform:translateY(0);opacity:.4;} 50%{transform:translateY(8px);opacity:.9;} }

/* LIQUID GLASS */
.xp-liquid-glass {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  isolation: isolate;
}
.xp-liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  box-shadow:
    inset 0 0 40px rgba(255,255,255,0.06),
    inset 0 0 8px rgba(255,255,255,0.04),
    inset -1.5px -1.5px 1px rgba(255,255,255,0.12),
    inset 1.5px 1.5px 1px rgba(255,255,255,0.08),
    inset -1.5px -1.5px 0 rgba(50,50,50,0.06),
    inset 1.5px 1.5px 0 rgba(40,40,40,0.08);
  pointer-events: none;
  z-index: 2;
}
.xp-liquid-glass::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  z-index: 1;
}
.xp-liquid-glass > * {
  position: relative;
  z-index: 3;
}
.xp-liquid-glass-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,0.1);
  pointer-events: none;
  z-index: 4;
}

/* LIQUID GLASS VARIANTS */
.xp-lg-dark { background: rgba(10,12,18,0.45); }
.xp-lg-dark::before {
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  box-shadow:
    inset 0 0 40px rgba(255,255,255,0.04),
    inset 0 0 8px rgba(255,255,255,0.03),
    inset -1.5px -1.5px 1px rgba(255,255,255,0.08),
    inset 1.5px 1.5px 1px rgba(255,255,255,0.05),
    inset -1.5px -1.5px 0 rgba(0,0,0,0.15),
    inset 1.5px 1.5px 0 rgba(0,0,0,0.12);
}
.xp-lg-light { background: rgba(255,255,255,0.55); }
.xp-lg-light::before {
  background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  box-shadow:
    inset 0 0 40px rgba(255,255,255,0.3),
    inset 0 0 8px rgba(255,255,255,0.15),
    inset -1.5px -1.5px 1px rgba(255,255,255,0.5),
    inset 1.5px 1.5px 1px rgba(255,255,255,0.35),
    inset -1.5px -1.5px 0 rgba(0,0,0,0.02),
    inset 1.5px 1.5px 0 rgba(0,0,0,0.03);
}
.xp-lg-light .xp-liquid-glass-border { border-color: rgba(255,255,255,0.6); }
.xp-lg-shadow { box-shadow: 0 8px 48px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04); }
.xp-lg-dark.xp-lg-shadow { box-shadow: 0 8px 48px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.15); }

/* GLASS NAV */
.xp-glass-nav {
  position: fixed;
  top: 12px; left: 16px; right: 16px;
  z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; height: 52px;
  border-radius: 16px;
  background: rgba(12, 26, 41, 0.55);
  transition: background 0.4s ${EASE_SMOOTH};
}
.xp-glass-nav.xp-liquid-glass { overflow: visible; isolation: auto; }
.xp-glass-nav.xp-liquid-glass::before,
.xp-glass-nav.xp-liquid-glass::after { border-radius: 16px; overflow: hidden; }
.xp-glass-nav.xp-liquid-glass::after {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
.xp-glass-nav.xp-lg-dark { background: rgba(10, 12, 18, 0.55); }
.xp-glass-nav.xp-lg-light {
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06);
}
.xp-glass-nav.xp-lg-light .xp-liquid-glass-border { border-color: rgba(0,0,0,0.06); }
.xp-nav-link {
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: none; border: none; font-family: var(--xp-font); transition: opacity .2s;
}
.xp-nav-cta {
  font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  padding: 9px 22px; border-radius: 999px; cursor: pointer;
  font-family: var(--xp-font); transition: background .3s, border-color .3s, color .3s;
}

/* GLASS CARD */
.xp-glass-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  isolation: isolate;
  background: rgba(255,255,255,0.45);
  transition: transform .45s ${EASE}, box-shadow .45s ${EASE};
  box-shadow: 0 4px 32px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
}
.xp-glass-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05));
  box-shadow:
    inset 0 0 30px rgba(255,255,255,0.2),
    inset 0 0 6px rgba(255,255,255,0.1),
    inset -1px -1px 0.5px rgba(255,255,255,0.35),
    inset 1px 1px 0.5px rgba(255,255,255,0.25);
  pointer-events: none; z-index: 1;
}
.xp-glass-card::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
}
.xp-glass-card > * { position: relative; z-index: 2; }
.xp-glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 48px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
}

/* Dark glass card variant */
.xp-glass-card-dark {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  isolation: isolate;
  background: rgba(10,12,18,0.45);
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform .35s ${EASE}, box-shadow .35s ease, background .35s ease, border-color .35s ease;
  box-shadow: 0 4px 32px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.08);
}
.xp-glass-card-dark::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  box-shadow:
    inset 0 0 30px rgba(255,255,255,0.04),
    inset 0 0 6px rgba(255,255,255,0.03),
    inset -1px -1px 0.5px rgba(255,255,255,0.08),
    inset 1px 1px 0.5px rgba(255,255,255,0.05);
  pointer-events: none; z-index: 1;
}
.xp-glass-card-dark::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
}
.xp-glass-card-dark > * { position: relative; z-index: 2; }
.xp-glass-card-dark:hover {
  transform: translateY(-4px);
  background: rgba(200, 169, 110, 0.12);
  border-color: rgba(200, 169, 110, 0.25);
  box-shadow: 0 12px 48px rgba(200, 169, 110, 0.1), 0 2px 4px rgba(0,0,0,0.15), inset 0 0 30px rgba(200, 169, 110, 0.06);
}
.xp-glass-card-dark:hover .xp-mono {
  color: var(--xp-gold) !important;
}

/* BUTTONS */
.xp-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 15px 34px; font-family: var(--xp-font);
  font-size: 12px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  border: none; border-radius: 999px; cursor: pointer;
  transition: background .35s var(--xp-ease), color .35s var(--xp-ease), transform .35s var(--xp-ease), box-shadow .35s var(--xp-ease), border-color .35s var(--xp-ease);
}
.xp-btn-w { background: var(--xp-white); color: var(--xp-navy); }
.xp-btn-w:hover { background: var(--xp-gold); color: var(--xp-navy); }
.xp-btn-n { background: var(--xp-navy); color: var(--xp-white); }
.xp-btn-n:hover { background: #15283d; }
.xp-btn-glass {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--xp-on-dark);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.xp-btn-glass:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.22);
}
.xp-btn-liquid {
  position: relative;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  color: var(--xp-on-dark);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  overflow: hidden;
}
.xp-btn-liquid::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
  box-shadow:
    inset 0 0 20px rgba(255,255,255,0.06),
    inset -1px -1px 0.5px rgba(255,255,255,0.12),
    inset 1px 1px 0.5px rgba(255,255,255,0.08);
  pointer-events: none;
}
.xp-btn-liquid:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.28);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}

/* RESPONSIVE */
@media(max-width:900px) {
  .xp-glass-nav { left: 8px; right: 8px; top: 8px; padding: 0 20px; height: 48px; border-radius: 14px; }
  .xp-nav-links-desktop { display: none !important; }
  .xp-sect { padding-left: 24px !important; padding-right: 24px !important; }
  .xp-glass-cards-row { flex-direction: column !important; }
}
@media(max-width:600px) {
  .xp-sect { padding-left: 20px !important; padding-right: 20px !important; }
  .xp-glass-nav { left: 6px; right: 6px; top: 6px; padding: 0 16px; }
}

/* Typography */
.xp p, .xp h1, .xp h2, .xp h3 {
  text-wrap: pretty;
}

/* Checkpoint grid */
.checkpoint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.checkpoint-grid > *:last-child:nth-child(3n+1) {
  grid-column: 2;
}
@media(max-width: 900px) {
  .checkpoint-grid {
    grid-template-columns: 1fr !important;
  }
  .checkpoint-grid > *:last-child:nth-child(3n+1) {
    grid-column: auto;
  }
}

/* Reduced motion */
@media(prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
