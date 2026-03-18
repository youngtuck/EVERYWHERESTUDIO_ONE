const SESSION_KEY = "ew-active-work-session";

export interface PersistedSession {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; ts: number }>;
  input: string;
  outputType: string;
  sessionTitle: string;
  phase: "input" | "generating" | "complete";
  generatedContent: string;
  generatedScore: number;
  generatedOutputId: string;
  generatedGates: any;
  isReady: boolean;
  timestamp: number;
}

export function saveSession(state: PersistedSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
