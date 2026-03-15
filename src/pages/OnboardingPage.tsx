import { useEffect, useState } from "react";
import { MessageSquare, FileUp } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { ProgressIndicator } from "../components/onboarding/ProgressIndicator";
import { VoiceInterviewChat } from "../components/onboarding/VoiceInterviewChat";
import { VoiceUpload } from "../components/onboarding/VoiceUpload";
import { VoiceDNAReview } from "../components/onboarding/VoiceDNAReview";
import { BrandDNAChat } from "../components/onboarding/BrandDNAChat";
import type { VoiceDNA, VoiceDNAResponse } from "../utils/voiceDNAProcessor";
import { generateVoiceDNAFromInterview, generateVoiceDNAFromUploads } from "../utils/voiceDNAProcessor";
import type { BrandDNAResponse } from "../utils/brandDNAProcessor";

type Step = 1 | 2 | 3 | 4;
type Method = "interview" | "upload" | null;

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>(null);
  const [processing, setProcessing] = useState(false);
  const [voiceDNA, setVoiceDNA] = useState<VoiceDNA | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If profile is already complete (or Voice DNA done), skip straight to dashboard
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("voice_dna_completed, onboarding_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_complete || data?.voice_dna_completed) {
          window.location.href = "/studio/dashboard";
        }
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const retrain = searchParams.get("retrain");
    if (retrain === "voice") {
      setStep(2);
    }
  }, [user, searchParams]);

  const goToDashboard = () => {
    window.location.href = "/studio/dashboard";
  };

  const handleMethodSelect = (value: Method) => {
    setMethod(value);
    setErrorMessage(null);
    setStep(2);
  };

  const handleInterviewComplete = async (payload: {
    interviewResponses: Record<string, string>;
  }) => {
    if (!user) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const fullName = (user.user_metadata?.full_name as string | undefined) || user.email || "the user";
      const result: VoiceDNAResponse = await generateVoiceDNAFromInterview({
        responses: payload.interviewResponses,
        userName: fullName,
      });
      const finalVoiceDna: VoiceDNA = {
        ...result.voiceDna,
        method: "interview",
        interview_responses: payload.interviewResponses,
      };
      setVoiceDNA(finalVoiceDna);

      await supabase
        .from("profiles")
        .update({
          voice_dna: finalVoiceDna,
          voice_dna_md: result.markdown,
          voice_dna_completed: true,
          voice_dna_completed_at: new Date().toISOString(),
          voice_dna_method: "interview",
        })
        .eq("id", user.id);

      setStep(3);
    } catch (err) {
      console.error("Voice DNA interview processing failed", err);
      setErrorMessage("We could not analyze your responses. Please try again in a moment.");
      setProcessing(false);
    }
  };

  const handleUploadComplete = async (payload: { fileUrls: string[] }) => {
    if (!user) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const result: VoiceDNAResponse = await generateVoiceDNAFromUploads({
        fileUrls: payload.fileUrls,
      });
      const finalVoiceDna: VoiceDNA = {
        ...result.voiceDna,
        method: "upload",
      };
      setVoiceDNA(finalVoiceDna);

      await supabase
        .from("profiles")
        .update({
          voice_dna: finalVoiceDna,
          voice_dna_md: result.markdown,
          voice_dna_completed: true,
          voice_dna_completed_at: new Date().toISOString(),
          voice_dna_method: "upload",
        })
        .eq("id", user.id);

      setStep(3);
    } catch (err) {
      console.error("Voice DNA upload processing failed", err);
      setErrorMessage("We could not analyze your writing samples. Please try again.");
      setProcessing(false);
    }
  };

  const confirmVoiceDna = () => {
    setStep(4);
  };

  const handleBrandDnaComplete = async (result: BrandDNAResponse) => {
    if (!user) {
      goToDashboard();
      return;
    }
    const fullUpdate = {
      brand_dna: result.brandDna,
      brand_dna_md: result.markdown,
      brand_dna_completed: true,
      brand_dna_completed_at: new Date().toISOString(),
      onboarding_complete: true,
    };
    let { error } = await supabase
      .from("profiles")
      .update(fullUpdate)
      .eq("id", user.id);

    if (error) {
      const { error: minimalError } = await supabase
        .from("profiles")
        .update({
          brand_dna: result.brandDna,
          brand_dna_md: result.markdown,
          onboarding_complete: true,
        })
        .eq("id", user.id);
      if (minimalError) {
        const { error: onboardingOnlyError } = await supabase
          .from("profiles")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
        if (onboardingOnlyError) {
          console.error("Profile update failed after Brand DNA", {
            full: error,
            minimal: minimalError,
            onboardingOnly: onboardingOnlyError,
          });
          setErrorMessage("We couldn't save your progress. Please try again.");
          return;
        }
      }
    }
    await refreshProfile();
    goToDashboard();
  };

  const handleSkipBrandDna = async () => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);
      if (error) {
        console.error("Profile update failed on skip", error);
        setErrorMessage("We couldn't save. Please try again.");
        return;
      }
      await refreshProfile();
    }
    goToDashboard();
  };

  const brandStepUserName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email || "the user";

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (user?.email ? user.email.split("@")[0] : "there");

  const showStep1 = step === 1;
  const showStep2Interview = step === 2 && method === "interview";
  const showStep2Upload = step === 2 && method === "upload";
  const showStep3 = step === 3 && voiceDNA;
  const showStep4 = step === 4; // Brand DNA (Watson conversation)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090f",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 20px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@400&display=swap');
        body { background: #07090f; }
      `}</style>

      <ProgressIndicator currentStep={step} totalSteps={4} />

      <main style={{ width: "100%", maxWidth: 640, flex: 1 }}>
        {errorMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(220,38,38,0.6)",
              background: "rgba(220,38,38,0.12)",
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              fontSize: 13,
              color: "#fee2e2",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{errorMessage}</span>
              {errorMessage.includes("save your progress") && (
                <button
                  type="button"
                  onClick={goToDashboard}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Continue to studio anyway
                </button>
              )}
            </div>
          </div>
        )}
        {showStep1 && (
          <section
            style={{
              minHeight: "60vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                fontSize: 36,
                fontWeight: 300,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Nice to meet you, {firstName}. Let us capture your voice.
            </h1>
            <p
              style={{
                marginTop: 12,
                fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                fontSize: 16,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              This works because you already know your voice. You just have not seen it written down yet.
            </p>

            <p
              style={{
                marginTop: 40,
                fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              How should we capture it?
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={() => handleMethodSelect("interview")}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <MessageSquare size={28} color="#C8961A" />
                <div
                  style={{
                    marginTop: 16,
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  Answer a few questions
                </div>
                <p
                  style={{
                    marginTop: 8,
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Best if you do not have much writing to share. We will draw out your voice through conversation.
                </p>
                <p
                  style={{
                    marginTop: 12,
                    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 12,
                    color: "#C8961A",
                  }}
                >
                  ~10 minutes
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleMethodSelect("upload")}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <FileUp size={28} color="#C8961A" />
                <div
                  style={{
                    marginTop: 16,
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#ffffff",
                  }}
                >
                  Upload your writing
                </div>
                <p
                  style={{
                    marginTop: 8,
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Best if you already write articles, posts, or documents. We will extract your voice from samples.
                </p>
                <p
                  style={{
                    marginTop: 12,
                    fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 12,
                    color: "#C8961A",
                  }}
                >
                  ~3 minutes
                </p>
              </button>
            </div>

            <p
              style={{
                marginTop: 32,
                fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.35)",
                textAlign: "center",
              }}
            >
              You can always do both later.
            </p>
          </section>
        )}

        {showStep2Interview && (
          <VoiceInterviewChat
            onComplete={({ interviewResponses }) => handleInterviewComplete({ interviewResponses })}
          />
        )}

        {showStep2Upload && (
          <VoiceUpload
            onComplete={async ({ fileSummaries }) => {
              // In a fuller implementation these files would be uploaded
              // to Supabase Storage and we would pass their URLs. For now
              // we call the backend with an empty list and let it decide.
              const urls = fileSummaries.map(item => item.name);
              await handleUploadComplete({ fileUrls: urls });
            }}
          />
        )}

        {showStep3 && voiceDNA && (
          <VoiceDNAReview
            data={voiceDNA}
            onConfirm={confirmVoiceDna}
            onRefine={() => {
              setStep(2);
            }}
            onUploadMore={() => {
              setMethod("upload");
              setStep(2);
            }}
          />
        )}

        {showStep4 && (
          <section>
            <BrandDNAChat
              userName={brandStepUserName}
              onComplete={handleBrandDnaComplete}
            />
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                type="button"
                onClick={handleSkipBrandDna}
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Skip for now — go to dashboard
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

