import { useCallback, useRef, useState } from "react";
import { fetchWithRetry } from "../lib/retry";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => {
      const s = fr.result as string;
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(blob);
  });
}

function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "audio/webm";
}

/**
 * Hold pointer on mic: MediaRecorder captures audio; optional parallel Web Speech for local fallback.
 * Release: stop, transcribe via /api/transcribe when configured, else use browser recognition text.
 */
export function useHoldToTranscribe(onAppendText: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef<string>("audio/webm");
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const srFinalRef = useRef("");
  const srInterimRef = useRef("");
  const pointerDownRef = useRef(false);
  const finishingRef = useRef(false);
  const micAborterRef = useRef<AbortController | null>(null);
  const holdSessionRef = useRef(false);

  const stopSpeechRecognition = useCallback(() => {
    const r = recognitionRef.current as any;
    recognitionRef.current = null;
    if (!r) return;
    try {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      r.stop();
    } catch {
      try {
        r.abort();
      } catch { /* ignore */ }
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
      .SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SR) return;

    srFinalRef.current = "";
    srInterimRef.current = "";
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const row = event.results[i];
        if (row.isFinal) newFinal += row[0]?.transcript || "";
        else interim += row[0]?.transcript || "";
      }
      if (newFinal) srFinalRef.current += newFinal;
      srInterimRef.current = interim;
    };

    rec.onerror = () => {};
    rec.onend = () => {};

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      recognitionRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const finishRecording = useCallback(async () => {
    if (finishingRef.current) return;
    micAborterRef.current?.abort();
    micAborterRef.current = null;

    const wasPressed = pointerDownRef.current;
    pointerDownRef.current = false;
    const mr = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (!mr && !wasPressed) {
      holdSessionRef.current = false;
      return;
    }

    finishingRef.current = true;
    stopSpeechRecognition();

    if (!mr || mr.state === "inactive") {
      cleanupStream();
      const local = (srFinalRef.current + srInterimRef.current).replace(/\s+/g, " ").trim();
      if (local) onAppendText(local);
      finishingRef.current = false;
      holdSessionRef.current = false;
      return;
    }

    await new Promise<void>(resolve => {
      mr.addEventListener("stop", () => resolve(), { once: true });
      try {
        mr.stop();
      } catch {
        resolve();
      }
    });

    cleanupStream();

    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    chunksRef.current = [];

    const speechLocal = (srFinalRef.current + srInterimRef.current).replace(/\s+/g, " ").trim();

    if (blob.size < 120) {
      if (speechLocal) onAppendText(speechLocal);
      finishingRef.current = false;
      holdSessionRef.current = false;
      return;
    }

    setTranscribing(true);
    try {
      const b64 = await blobToBase64(blob);
      const res = await fetchWithRetry(
        `${API_BASE}/api/transcribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: b64, mimeType: blob.type || mimeRef.current }),
        },
        { maxRetries: 1, timeout: 60000 }
      );

      let fromApi = "";
      if (res.ok) {
        const j = (await res.json()) as { text?: string };
        fromApi = (j.text || "").trim();
      }

      const out = fromApi || speechLocal;
      if (out) onAppendText(out);
    } catch {
      if (speechLocal) onAppendText(speechLocal);
    } finally {
      setTranscribing(false);
      finishingRef.current = false;
      holdSessionRef.current = false;
    }
  }, [cleanupStream, onAppendText, stopSpeechRecognition]);

  const onPointerDown = useCallback(async (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (holdSessionRef.current || finishingRef.current) return;
    holdSessionRef.current = true;
    e.preventDefault();
    try {
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    } catch { /* ignore */ }

    const ac = new AbortController();
    micAborterRef.current = ac;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        signal: ac.signal,
      });
      if (micAborterRef.current !== ac) {
        stream.getTracks().forEach(t => t.stop());
        holdSessionRef.current = false;
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickRecorderMime();
      mimeRef.current = mime;
      const opts: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported(mime)) opts.mimeType = mime;
      const mr = new MediaRecorder(stream, Object.keys(opts).length ? opts : undefined);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = ev => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.start(200);
      pointerDownRef.current = true;
      setRecording(true);
      startSpeechRecognition();
    } catch {
      setRecording(false);
      cleanupStream();
      pointerDownRef.current = false;
      holdSessionRef.current = false;
    } finally {
      if (micAborterRef.current === ac) micAborterRef.current = null;
    }
  }, [cleanupStream, startSpeechRecognition]);

  const onPointerUp = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
    micAborterRef.current?.abort();
    micAborterRef.current = null;
    setRecording(false);
    await finishRecording();
  }, [finishRecording]);

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      void onPointerUp(e);
    },
    [onPointerUp]
  );

  return {
    recording,
    transcribing,
    micHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave: onPointerUp,
      onPointerCancel,
    },
  };
}
