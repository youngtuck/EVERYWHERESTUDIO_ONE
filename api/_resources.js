import { createClient } from "@supabase/supabase-js";

export async function getUserResources(userId) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !userId) {
    if (!serviceRoleKey) console.warn("[_resources] SUPABASE_SERVICE_ROLE_KEY not set — Voice/Brand/Method DNA will be empty. Set this in your Vercel environment variables.");
    if (!supabaseUrl) console.warn("[_resources] SUPABASE_URL not set.");
    return { voiceDna: "", brandDna: "", methodDna: "", references: "" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("resources")
    .select("resource_type, title, content")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !data || data.length === 0) {
    return { voiceDna: "", brandDna: "", methodDna: "", references: "" };
  }

  let voiceDna = "";
  let brandDna = "";
  let methodDna = "";
  let references = "";

  for (const r of data) {
    const block = "## " + r.title + "\n" + (r.content || "") + "\n\n";
    switch (r.resource_type) {
      case "voice_dna": voiceDna += block; break;
      case "brand_dna": brandDna += block; break;
      case "method_dna": methodDna += block; break;
      case "reference": references += block; break;
    }
  }

  return { voiceDna, brandDna, methodDna, references };
}
