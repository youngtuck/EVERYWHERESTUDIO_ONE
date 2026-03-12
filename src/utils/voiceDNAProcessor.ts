const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export interface VoiceDNA {
  voice_fidelity: number;
  voice_layer: number;
  value_layer: number;
  personality_layer: number;
  traits: {
    vocabulary_and_syntax: number;
    tonal_register: number;
    rhythm_and_cadence: number;
    metaphor_patterns: number;
    structural_habits: number;
  };
  voice_description: string;
  value_description: string;
  personality_description: string;
  contraction_frequency: string;
  sentence_length_avg: string;
  signature_phrases: string[];
  prohibited_words: string[];
  emotional_register: string;
  has_dual_mode: boolean;
  content_mode?: Record<string, unknown>;
  operations_mode?: Record<string, unknown>;
  method: "interview" | "upload" | "both";
  interview_responses?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface VoiceDNAResponse {
  voiceDna: VoiceDNA;
  markdown: string;
}

export async function generateVoiceDNAFromInterview(payload: {
  responses: Record<string, string>;
}): Promise<VoiceDNAResponse> {
  const url = `${API_BASE}/api/voice-dna`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "interview", responses: payload.responses }),
  });
  if (!res.ok) {
    throw new Error("Failed to generate Voice DNA from interview.");
  }
  return res.json();
}

export async function generateVoiceDNAFromUploads(payload: {
  fileUrls: string[];
}): Promise<VoiceDNAResponse> {
  const url = `${API_BASE}/api/voice-dna`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "upload", fileUrls: payload.fileUrls }),
  });
  if (!res.ok) {
    throw new Error("Failed to generate Voice DNA from uploads.");
  }
  return res.json();
}

