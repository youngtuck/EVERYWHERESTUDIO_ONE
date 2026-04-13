import { supabase } from "./supabase";
import type { StructuredIntake } from "./reedStructuredIntake";

const SESSION_KEY = "ew-active-work-session";

/** Persisted Work stage (matches WorkSession.tsx WorkStage). */
export type PersistedWorkStage = "Intake" | "Outline" | "Edit" | "Review";

export interface PersistedOutlineRow {
  label: string;
  content: string;
  indent?: boolean;
}

export interface PersistedSession {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; ts: number }>;
  input: string;
  outputType: string;
  /** OUTPUT_TYPES id when set (e.g. essay, linkedin_post). */
  outputTypeId?: string | null;
  /** Minutes of spoken talk when outputTypeId is talk (Wrap and draft targets use minutes × 300 words). */
  talkDuration?: number | null;
  sessionTitle: string;
  /** User-chosen thread name. When null or empty on save, title is derived from outline or intake. */
  sessionNameOverride?: string | null;
  phase: "input" | "generating" | "complete";
  generatedContent: string;
  generatedScore: number;
  generatedOutputId: string;
  generatedGates: unknown;
  isReady: boolean;
  timestamp: number;
  workStage?: PersistedWorkStage;
  outlineRows?: PersistedOutlineRow[];
  selectedFormats?: string[];
  /** Reed-locked Thesis / Audience / Goal / Hook / Format; synced to work_sessions.payload. */
  structuredIntake?: StructuredIntake | null;
}

export function getWorkStageFromPersisted(state: PersistedSession): PersistedWorkStage {
  if (state.workStage === "Intake" || state.workStage === "Outline" || state.workStage === "Edit" || state.workStage === "Review") {
    return state.workStage;
  }
  if (state.phase === "complete" || state.phase === "generating") return "Edit";
  return "Intake";
}

export async function syncWorkSessionToSupabase(userId: string, state: PersistedSession) {
  const workStage = getWorkStageFromPersisted(state);
  const title = (state.sessionTitle || "").trim() || "Untitled";
  try {
    const { error } = await supabase.from("work_sessions").upsert(
      {
        user_id: userId,
        session_title: title.slice(0, 200),
        work_stage: workStage,
        output_type: state.outputType || null,
        payload: state as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("[work_sessions] upsert", error.message);
  } catch (e) {
    console.error("[work_sessions] upsert", e);
  }
}

export async function deleteRemoteWorkSession(userId: string) {
  try {
    const { error } = await supabase.from("work_sessions").delete().eq("user_id", userId);
    if (error) console.error("[work_sessions] delete", error.message);
  } catch (e) {
    console.error("[work_sessions] delete", e);
  }
}

export function saveSession(state: PersistedSession, opts?: { userId?: string | null }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }

  const userId = opts?.userId;
  if (userId) {
    void syncWorkSessionToSupabase(userId, state);
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
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
