const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export interface BrandDNA {
  company_name: string;
  industry: string;
  target_audience: string;
  brand_voice_description: string;
  tone_attributes: string[];
  language_guidelines: string;
  primary_colors: string[];
  secondary_colors: string[];
  font_families: string[];
  logo_description: string;
  tagline: string;
  value_proposition: string;
  key_messages: string[];
  prohibited_language: string[];
  brand_guide_url?: string;
  logo_urls: string[];
  style_guide_url?: string;
  additional_docs: { name: string; url: string; type: string }[];
  created_at: string;
  updated_at: string;
}

export interface BrandDNAResponse {
  brandDna: BrandDNA | Record<string, unknown>;
  markdown: string;
}

/** Brand DNA from structured form (company name, industry, etc.). */
export async function generateBrandDNA(input: {
  company_name: string;
  industry: string;
  tagline: string;
  brand_voice_description: string;
  tone_attributes: string[];
  prohibited_language: string[];
  key_messages: string[];
}): Promise<BrandDNAResponse> {
  const url = `${API_BASE}/api/brand-dna`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    throw new Error("Failed to generate Brand DNA.");
  }
  return res.json();
}

/** Brand DNA from Watson conversation history (onboarding Brand DNA step). */
export async function generateBrandDNAFromConversation(payload: {
  responses: { role: string; content: string }[];
  userName: string;
}): Promise<BrandDNAResponse> {
  const url = `${API_BASE}/api/brand-dna`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      responses: payload.responses,
      userName: payload.userName,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to generate Brand DNA from conversation.");
  }
  return res.json();
}

