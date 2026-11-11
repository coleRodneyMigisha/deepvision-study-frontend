"use client";
/**
 * Study-buddy state. Pages describe what the student is looking at with `useBuddyPage`,
 * so the buddy always "sees the same screen" (module, lesson step, lab values, last answer).
 */
import { useEffect } from "react";
import type { Mood } from "@/components/buddy/BuddyAvatar";
import { ApiError, del, get, ping, statusStore, streamChat } from "./api";
import { logActivity } from "./progress";
import { memoryStore, persistentStore, useStore } from "./store";

export type BuddyMode = "chat" | "nudge" | "hint" | "walkthrough" | "quiz" | "explain";

export interface BuddyContext {
  view: "home" | "course" | "lesson" | "lab" | "exam" | "guide";
  step?: string;
  lab_title?: string;
  lab_state?: Record<string, number | string>;
  task?: string;
  last_question?: string;
  last_answer?: string;
  last_score?: number;
}

export interface BuddyPage {
  courseId?: string;
  courseLabel?: string;
  moduleId?: string | null;
  moduleTitle?: string;
  context: BuddyContext;
  /** Shown if the server can't be reached at all. */
  fallback?: string;
}

export interface Msg {
  role: "user" | "model";
  text: string;
  mode?: BuddyMode;
  error?: boolean;
}

export const pageStore = memoryStore<BuddyPage>({ context: { view: "home" } });
export const uiStore = memoryStore<{ open: boolean; busy: boolean; mood: Mood; draft: string }>({
  open: false,
  busy: false,
  mood: "idle",
  draft: "",
});
export const chatStore = persistentStore<Record<string, Msg[]>>("studyroom:v3:chat", {});

export const useBuddyUi = () => useStore(uiStore);
export const useBuddyPageState = () => useStore(pageStore);
export function useChat(key: string) {
  const all = useStore(chatStore, {});
  return all[key] ?? [];
}
export const chatKey = (page: BuddyPage) => page.courseId ?? "general";

/** Register the current page's context with the buddy. Call with a memoised object. */
export function useBuddyPage(page: BuddyPage) {
  const json = JSON.stringify(page);
  useEffect(() => {
    pageStore.set(JSON.parse(json));
  }, [json]);
}

export function setMood(mood: Mood, ms = 2200) {
  uiStore.set((s) => ({ ...s, mood }));
  if (mood !== "idle") setTimeout(() => uiStore.set((s) => (s.mood === mood ? { ...s, mood: "idle" } : s)), ms);
}

export function openBuddy(draft?: string) {
  uiStore.set((s) => ({ ...s, open: true, draft: draft ?? s.draft }));
}
export const closeBuddy = () => uiStore.set((s) => ({ ...s, open: false }));
export const toggleBuddy = () => uiStore.set((s) => ({ ...s, open: !s.open }));

export function clearChat() {
  const key = chatKey(pageStore.get());
  chatStore.set((all) => ({ ...all, [key]: [] }));
  if (key !== "general") void del(`/api/v1/me/chats/${encodeURIComponent(key)}`).catch(() => {});
}

/** Conversations live on the account; fetch each course's thread once per visit. */
const loadedThreads = new Set<string>();
export async function loadThread(key: string) {
  if (key === "general" || loadedThreads.has(key)) return;
  loadedThreads.add(key);
  try {
    const rows = await get<{ role: "user" | "model"; text: string; mode: string | null }[]>(
      `/api/v1/me/chats/${encodeURIComponent(key)}?limit=60`,
    );
    if (uiStore.get().busy) return; // don't clobber a reply that's streaming in
    chatStore.set((all) => ({ ...all, [key]: rows.map((r) => ({ role: r.role, text: r.text, mode: (r.mode ?? undefined) as BuddyMode | undefined })) }));
  } catch {
    loadedThreads.delete(key); // keep the local copy; try again next time
  }
}
export const forgetLoadedThreads = () => loadedThreads.clear();

let controller: AbortController | null = null;

/** Ask the buddy something. Opens the panel and streams the reply in. */
export async function askBuddy(text: string, mode: BuddyMode = "chat", extra?: Partial<BuddyContext>) {
  const message = text.trim();
  if (!message || uiStore.get().busy) return;
  const page = pageStore.get();
  const key = chatKey(page);
  const history = (chatStore.get()[key] ?? []).filter((m) => !m.error).slice(-12);
  const push = (fn: (msgs: Msg[]) => Msg[]) => chatStore.set((all) => ({ ...all, [key]: fn(all[key] ?? []).slice(-60) }));

  push((m) => [...m, { role: "user", text: message, mode }, { role: "model", text: "" }]);
  uiStore.set((s) => ({ ...s, open: true, busy: true, mood: "thinking", draft: "" }));
  logActivity();
  if (statusStore.get().status === "offline") void ping();

  controller = new AbortController();
  const appendToLast = (delta: string) =>
    push((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { ...copy[copy.length - 1], text: copy[copy.length - 1].text + delta };
      return copy;
    });
  try {
    if (!page.courseId) throw new ApiError("Pick a course first and I'll use its material.", 400);
    await streamChat(
      {
        course_id: page.courseId,
        module_id: page.moduleId ?? null,
        message,
        mode,
        history: history.map(({ role, text }) => ({ role, text: text.slice(0, 7900) })),
        context: { ...page.context, ...extra },
      },
      appendToLast,
      controller.signal,
    );
    setMood("happy", 1500);
  } catch (err) {
    const reason = err instanceof ApiError ? err.message : "Something went wrong.";
    const fallback = page.fallback ? `\n\nWhile it wakes up, here's the gist:\n\n${page.fallback}` : "";
    push((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = last.text
        ? { ...last, text: `${last.text}\n\n_(${reason})_` }
        : { role: "model", text: `**${reason}** The free server can take up to a minute to wake — try again shortly.${fallback}`, error: true };
      return copy;
    });
    setMood("oops");
  } finally {
    controller = null;
    uiStore.set((s) => ({ ...s, busy: false, mood: s.mood === "thinking" ? "idle" : s.mood }));
  }
}

export function stopBuddy() {
  controller?.abort();
}
