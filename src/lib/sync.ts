"use client";
/**
 * Keeps this browser's study progress in step with the student's account.
 *
 * Progress is still written to localStorage first (so everything is instant and works offline),
 * then pushed to the server a moment later. On sign-in, on returning to the tab and whenever a
 * write races another device, the two copies are *merged* (see merge.ts), never overwritten.
 */
import { ApiError, authHeaders, get, put } from "./api";
import { chatStore, forgetLoadedThreads } from "./buddy";
import { mergeActivity, mergeProgress, stableJson } from "./merge";
import { activityStore, progressStore } from "./progress";
import { apiBase } from "./settings";
import { memoryStore, type Store, useStore } from "./store";
import type { User } from "./session";

const OWNER_KEY = "studyroom:v3:owner";
const PUSH_DELAY = 1500;
const PULL_EVERY = 30_000;

type Key = "progress" | "activity";
interface Doc {
  store: Store<Record<string, unknown>>;
  merge: (a: never, b: never) => Record<string, unknown>;
  version: number | null;
  synced: string; // stable JSON of what the server holds
  timer: ReturnType<typeof setTimeout> | null;
}

const docs: Record<Key, Doc> = {
  progress: { store: progressStore as Store<Record<string, unknown>>, merge: mergeProgress as Doc["merge"], version: null, synced: "", timer: null },
  activity: { store: activityStore as Store<Record<string, unknown>>, merge: mergeActivity as Doc["merge"], version: null, synced: "", timer: null },
};

export type SyncStatus = "off" | "syncing" | "saved" | "offline";
export const syncStatusStore = memoryStore<SyncStatus>("off");
export const useSyncStatus = () => useStore(syncStatusStore);

let active: string | null = null;
let unsubscribers: (() => void)[] = [];
let lastPull = 0;

const merge = (doc: Doc, a: unknown, b: unknown) => doc.merge(a as never, b as never);

function readOwner(): string | null {
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export async function startSync(user: User) {
  if (active === user.id) return;
  await stopSync({ flush: false });
  const owner = readOwner();
  // Another account used this browser last: start clean. No owner yet means pre-accounts
  // progress, which is folded into the first account that signs in here.
  if (owner && owner !== user.id) wipeLocalStudyData();
  try {
    window.localStorage.setItem(OWNER_KEY, user.id);
  } catch {
    /* private mode */
  }
  active = user.id;
  for (const key of Object.keys(docs) as Key[]) {
    const doc = docs[key];
    doc.version = null;
    doc.synced = "";
    unsubscribers.push(doc.store.subscribe(() => schedule(key)));
  }
  const onFocus = () => {
    if (document.visibilityState === "visible" && Date.now() - lastPull > PULL_EVERY) void pull();
  };
  const onHide = () => flushWithKeepalive();
  document.addEventListener("visibilitychange", onFocus);
  window.addEventListener("pagehide", onHide);
  unsubscribers.push(() => document.removeEventListener("visibilitychange", onFocus));
  unsubscribers.push(() => window.removeEventListener("pagehide", onHide));
  await pull();
}

export async function stopSync({ flush }: { flush: boolean }) {
  if (flush && active) await Promise.all((Object.keys(docs) as Key[]).map((k) => push(k)));
  for (const u of unsubscribers) u();
  unsubscribers = [];
  for (const doc of Object.values(docs)) {
    if (doc.timer) clearTimeout(doc.timer);
    doc.timer = null;
  }
  active = null;
  syncStatusStore.set("off");
}

/** Fetch the account's copy and merge it with this browser's. */
export async function pull() {
  if (!active) return;
  const me = active;
  lastPull = Date.now();
  syncStatusStore.set("syncing");
  try {
    const remote = await get<{ key: string; data: Record<string, unknown>; version: number }[]>("/api/v1/me/state");
    if (active !== me) return;
    for (const key of Object.keys(docs) as Key[]) {
      const doc = docs[key];
      const server = remote.find((d) => d.key === key);
      const merged = merge(doc, doc.store.get(), server?.data ?? {});
      doc.version = server?.version ?? null;
      doc.synced = server ? stableJson(server.data) : "";
      if (stableJson(merged) !== stableJson(doc.store.get())) doc.store.set(merged);
      else schedule(key, 0);
    }
    syncStatusStore.set("saved");
  } catch {
    syncStatusStore.set("offline");
  }
}

function schedule(key: Key, delay = PUSH_DELAY) {
  if (!active) return;
  const doc = docs[key];
  if (doc.timer) clearTimeout(doc.timer);
  doc.timer = setTimeout(() => void push(key), delay);
}

async function push(key: Key) {
  const doc = docs[key];
  if (doc.timer) clearTimeout(doc.timer);
  doc.timer = null;
  if (!active) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    const data = doc.store.get();
    const json = stableJson(data);
    if (json === doc.synced) {
      syncStatusStore.set("saved");
      return;
    }
    syncStatusStore.set("syncing");
    try {
      const out = await put<{ version: number; data: Record<string, unknown> }>(`/api/v1/me/state/${key}`, {
        data,
        base_version: doc.version,
      });
      doc.version = out.version;
      doc.synced = stableJson(out.data);
      syncStatusStore.set("saved");
      return;
    } catch (err) {
      const current = conflictCopy(err);
      if (!current) {
        syncStatusStore.set("offline");
        schedule(key, 20_000); // retry later
        return;
      }
      // Another device saved first: fold its copy in and try again.
      doc.version = current.version;
      doc.synced = stableJson(current.data);
      const merged = merge(doc, doc.store.get(), current.data);
      if (stableJson(merged) !== stableJson(doc.store.get())) doc.store.set(merged);
    }
  }
}

function conflictCopy(err: unknown): { version: number; data: Record<string, unknown> } | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  const detail = (err.body as { detail?: { current?: { version: number; data: Record<string, unknown> } } })?.detail;
  return detail?.current ?? null;
}

/** Last-chance save when the tab closes. `keepalive` lets the request outlive the page. */
function flushWithKeepalive() {
  for (const key of Object.keys(docs) as Key[]) {
    const doc = docs[key];
    const data = doc.store.get();
    if (stableJson(data) === doc.synced) continue;
    try {
      void fetch(`${apiBase()}/api/v1/me/state/${key}`, {
        method: "PUT",
        keepalive: true,
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ data, base_version: doc.version }),
      });
    } catch {
      /* best effort */
    }
  }
}

/** Remove one student's study data from this browser (on sign-out or account switch). */
export function wipeLocalStudyData() {
  progressStore.set({});
  activityStore.set({});
  chatStore.set({});
  forgetLoadedThreads();
  try {
    window.localStorage.removeItem(OWNER_KEY);
    // The old site's progress was imported into the first account; don't import it again.
    for (const k of Object.keys(window.localStorage)) if (k.startsWith("dv_progress_v2")) window.localStorage.removeItem(k);
  } catch {
    /* private mode */
  }
}
