export interface WatchSource {
  name: string;
  type: "blog" | "newsletter" | "podcast" | "substack" | "publication";
  track: "competitor" | "thought_leader" | "tech_infra" | "industry" | "general";
}

export const DEFAULT_SOURCES: WatchSource[] = [
  // Blogs
  { name: "Stratechery", type: "blog", track: "thought_leader" },
  { name: "Benedict Evans", type: "blog", track: "thought_leader" },
  { name: "Cal Newport's Blog", type: "blog", track: "thought_leader" },
  { name: "Daring Fireball", type: "blog", track: "tech_infra" },
  { name: "Ribbonfarm", type: "blog", track: "thought_leader" },
  { name: "The Roots of Progress", type: "blog", track: "industry" },
  { name: "Simon Willison's Weblog", type: "blog", track: "tech_infra" },
  { name: "Craig Mod", type: "blog", track: "thought_leader" },
  { name: "Anil Dash", type: "blog", track: "thought_leader" },
  { name: "Kottke.org", type: "blog", track: "general" },

  // Newsletters
  { name: "The Hustle", type: "newsletter", track: "industry" },
  { name: "The Generalist", type: "newsletter", track: "industry" },
  { name: "Stratechery Newsletter", type: "newsletter", track: "thought_leader" },
  { name: "The Diff", type: "newsletter", track: "industry" },
  { name: "New Things Under the Sun", type: "newsletter", track: "thought_leader" },
  { name: "Platformer", type: "newsletter", track: "tech_infra" },
  { name: "The Browser", type: "newsletter", track: "general" },
  { name: "Citation Needed", type: "newsletter", track: "thought_leader" },
  { name: "Trust Insights", type: "newsletter", track: "industry" },
  { name: "Normal Tech", type: "newsletter", track: "tech_infra" },

  // Podcasts
  { name: "All-In Podcast", type: "podcast", track: "industry" },
  { name: "Latent Space", type: "podcast", track: "tech_infra" },
  { name: "The Knowledge Project", type: "podcast", track: "thought_leader" },
  { name: "Colossus", type: "podcast", track: "industry" },
  { name: "Acquired", type: "podcast", track: "industry" },
  { name: "The Psychology Podcast", type: "podcast", track: "thought_leader" },
  { name: "Huberman Lab", type: "podcast", track: "thought_leader" },
  { name: "Modern Wisdom", type: "podcast", track: "thought_leader" },
  { name: "Founders", type: "podcast", track: "thought_leader" },
  { name: "Conversations with Tyler", type: "podcast", track: "thought_leader" },
  { name: "80000 Hours Podcast", type: "podcast", track: "thought_leader" },
  { name: "The Talk Show", type: "podcast", track: "tech_infra" },
  { name: "The Dwarkesh Podcast", type: "podcast", track: "thought_leader" },

  // Substacks
  { name: "Lenny's Newsletter", type: "substack", track: "industry" },
  { name: "Exponential View", type: "substack", track: "tech_infra" },
  { name: "The Pragmatic Engineer", type: "substack", track: "tech_infra" },
  { name: "Not Boring", type: "substack", track: "industry" },
  { name: "One Useful Thing", type: "substack", track: "tech_infra" },
  { name: "Where's Your Ed At", type: "substack", track: "thought_leader" },
  { name: "Astral Codex Ten", type: "substack", track: "thought_leader" },
  { name: "Construction Physics", type: "substack", track: "industry" },
  { name: "Experimental History", type: "substack", track: "thought_leader" },
  { name: "Age of Invention", type: "substack", track: "thought_leader" },
  { name: "Liza Adams EnvisionIT", type: "substack", track: "industry" },
  { name: "Mark Sylvester", type: "substack", track: "thought_leader" },

  // Publications
  { name: "MIT Technology Review", type: "publication", track: "tech_infra" },
  { name: "Works in Progress", type: "publication", track: "industry" },
  { name: "Six Colors", type: "publication", track: "tech_infra" },
];

export const DEFAULT_KEYWORDS = [
  "AI adoption", "change management", "shadow AI", "AI governance",
  "fractional CAIO", "training retention", "nonprofit tech",
  "executive coaching", "thought leadership", "composed intelligence",
  "digital transformation", "AI readiness",
];

export const DEFAULT_CONFIG = {
  keywords: DEFAULT_KEYWORDS,
  watchlist: {
    competitors: [] as string[],
    industryOrgs: [] as string[],
    techInfra: [] as string[],
    thoughtLeaders: [] as string[],
  },
  signalRanking: {
    relevance: 5,
    actionability: 3,
    urgency: 2,
  },
  tonePreferences: ["contrarian", "practitioner-credible", "framework-driven", "story-led"],
};
