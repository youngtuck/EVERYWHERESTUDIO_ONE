import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoiceInput(onTranscript?: (text: string) => void): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef(onTranscript);
  const finalRef = useRef("");
  const isSupported =
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Keep callback ref in sync without triggering effect re-runs
  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let newFinal = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Accumulate final transcript across events
      if (newFinal) {
        finalRef.current += newFinal;
      }

      const combined = finalRef.current + interimTranscript;
      console.log("[VoiceInput] onresult: final so far:", finalRef.current, "interim:", interimTranscript);
      setTranscript(combined);
      if (callbackRef.current) callbackRef.current(combined);
    };

    recognition.onerror = (event: any) => {
      console.log("[VoiceInput] onerror:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log("[VoiceInput] onend: shouldListen:", recognitionRef.current?._shouldListen);
      if (recognitionRef.current?._shouldListen) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    finalRef.current = "";
    recognitionRef.current._shouldListen = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log("[VoiceInput] recognition.start() called");
    } catch (e) {
      console.log("[VoiceInput] start() error (already started?):", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldListen = false;
    recognitionRef.current.stop();
    setIsListening(false);
    console.log("[VoiceInput] recognition.stop() called");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-stop listening when window loses focus
  useEffect(() => {
    const handleBlur = () => { if (isListening) stopListening(); };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isListening, stopListening]);

  return { isListening, isSupported, transcript, startListening, stopListening, toggleListening };
}
