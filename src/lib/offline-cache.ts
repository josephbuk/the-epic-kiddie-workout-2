// Simple localStorage-backed cache for offline Play mode.
// Stores hydrated workout+exercises per assignment and queues completions.

type CachedAssignment = {
  cachedAt: number;
  payload: unknown;
};

const KEY_ASSIGN = (id: string) => `rungo:assignment:${id}`;
const KEY_QUEUE = "rungo:completion-queue";

export function saveAssignment(id: string, payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    const entry: CachedAssignment = { cachedAt: Date.now(), payload };
    localStorage.setItem(KEY_ASSIGN(id), JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
}

export function loadAssignment<T = unknown>(id: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_ASSIGN(id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedAssignment;
    return entry.payload as T;
  } catch {
    return null;
  }
}

export function queueCompletion(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY_QUEUE);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(id)) list.push(id);
    localStorage.setItem(KEY_QUEUE, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function readQueue(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_QUEUE);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function clearFromQueue(id: string) {
  if (typeof window === "undefined") return;
  try {
    const list = readQueue().filter((x) => x !== id);
    localStorage.setItem(KEY_QUEUE, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function flushCompletionQueue(
  send: (id: string) => Promise<unknown>,
) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const ids = readQueue();
  for (const id of ids) {
    try {
      await send(id);
      clearFromQueue(id);
    } catch {
      // stop on first failure — try again later
      break;
    }
  }
}
