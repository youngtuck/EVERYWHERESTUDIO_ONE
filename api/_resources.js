import { createClient } from "@supabase/supabase-js";
import { clipDna } from "./_dnaContext.js";

export async function getUserResources(userId) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !userId) {
    if (!serviceRoleKey) console.warn("[_resources] SUPABASE_SERVICE_ROLE_KEY not set. Voice/Brand/Method DNA will be empty.");
    if (!supabaseUrl) console.warn("[_resources] SUPABASE_URL not set.");
    return { voiceDna: "", brandDna: "", methodDna: "", references: "", composerMemory: "" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Load from profiles table (primary source for Voice DNA and Brand DNA)
  let voiceDna = "";
  let brandDna = "";

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_dna, voice_dna_md, brand_dna, brand_dna_md")
      .eq("id", userId)
      .single();

    if (profile) {
      // Use voice_dna_md (markdown summary) as the primary voice context.
      // Fall back to a readable summary built from the JSONB object.
      if (profile.voice_dna_md) {
        voiceDna = profile.voice_dna_md;
      } else if (profile.voice_dna) {
        const vd = profile.voice_dna;
        const parts = [];
        if (vd.voice_description) parts.push("Voice: " + vd.voice_description);
        if (vd.value_description) parts.push("Values: " + vd.value_description);
        if (vd.personality_description) parts.push("Personality: " + vd.personality_description);
        if (vd.signature_phrases?.length) parts.push("Signature phrases: " + vd.signature_phrases.join(", "));
        if (vd.prohibited_words?.length) parts.push("Never use: " + vd.prohibited_words.join(", "));
        if (vd.emotional_register) parts.push("Emotional register: " + vd.emotional_register);
        if (vd.contraction_frequency) parts.push("Contractions: " + vd.contraction_frequency);
        if (vd.sentence_length_avg) parts.push("Sentence length: " + vd.sentence_length_avg);
        if (vd.traits) {
          const traitLines = Object.entries(vd.traits)
            .map(([k, v]) => `  ${k.replace(/_/g, " ")}: ${v}/100`)
            .join("\n");
          parts.push("Trait scores:\n" + traitLines);
        }
        voiceDna = parts.join("\n\n");
      }

      // Use brand_dna_md (markdown summary) as the primary brand context.
      if (profile.brand_dna_md) {
        brandDna = profile.brand_dna_md;
      } else if (profile.brand_dna && typeof profile.brand_dna === "object") {
        brandDna = Object.entries(profile.brand_dna)
          .map(([k, v]) => {
            const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            if (Array.isArray(v)) return `${label}: ${v.join(", ")}`;
            if (typeof v === "object" && v !== null) return `${label}: ${JSON.stringify(v)}`;
            return `${label}: ${v}`;
          })
          .join("\n");
      }
    }
  } catch (err) {
    console.error("[_resources] Failed to load profile DNA:", err);
  }

  // 2. Load from resources table (uploaded reference files, method DNA, manually added DNA)
  let methodDna = "";
  let references = "";

  try {
    const { data, error } = await supabase
      .from("resources")
      .select("resource_type, title, content")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!error && data && data.length > 0) {
      for (const r of data) {
        const block = "## " + r.title + "\n" + (r.content || "") + "\n\n";
        switch (r.resource_type) {
          case "voice_dna":
            // Supplements profile-based voice DNA, does not replace
            voiceDna += "\n\n" + block;
            break;
          case "brand_dna":
            brandDna += "\n\n" + block;
            break;
          case "method_dna":
            methodDna += block;
            break;
          case "reference":
            references += block;
            break;
        }
      }
    }
  } catch (err) {
    console.error("[_resources] Failed to load resources:", err);
  }

  let composerMemory = "";
  try {
    const { data, error } = await supabase
      .from("composer_memory")
      .select("body")
      .eq("user_id", userId)
      .order("sort_priority", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!error && data?.length) {
      const joined = data.map(r => (r.body || "").trim()).filter(Boolean).join("\n\n");
      composerMemory = clipDna(joined, 2500);
    } else if (error && !String(error.message || "").includes("does not exist")) {
      console.warn("[_resources] composer_memory:", error.message);
    }
  } catch (err) {
    /* table may not exist until migration 022 is applied */
  }

  return {
    voiceDna: voiceDna.trim(),
    brandDna: brandDna.trim(),
    methodDna: methodDna.trim(),
    references: references.trim(),
    composerMemory,
  };
}
