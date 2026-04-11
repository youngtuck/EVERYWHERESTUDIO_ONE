/**
 * Publishes the active Work session headline for StudioTopBar (thread name).
 * WorkSession is the source of truth; the top bar only displays and requests renames.
 */

export type WorkSessionMetaSnapshot = {
  title: string;
  active: boolean;
};

const serverSnapshot: WorkSessionMetaSnapshot = { title: "", active: false };

let meta: WorkSessionMetaSnapshot = { title: "", active: false };

export function publishWorkSessionMeta(next: WorkSessionMetaSnapshot) {
  meta = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ew-work-session-meta"));
  }
}

export function getWorkSessionMetaSnapshot(): WorkSessionMetaSnapshot {
  return meta;
}

export function subscribeWorkSessionMeta(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => onChange();
  window.addEventListener("ew-work-session-meta", h);
  return () => window.removeEventListener("ew-work-session-meta", h);
}

export function getServerWorkSessionMetaSnapshot(): WorkSessionMetaSnapshot {
  return serverSnapshot;
}

/** Empty string clears the user override and returns to auto naming. */
export function requestSessionRename(name: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ew-session-rename-request", { detail: { name } }));
}
