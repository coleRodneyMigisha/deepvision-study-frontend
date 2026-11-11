"use client";
/** Browser client for the FastAPI backend (Render). */
import { memoryStore, useStore } from "./store";
import { authToken, sessionHooks } from "./session";
import { apiBase } from "./settings";

export type ApiStatus = "checking" | "waking" | "online" | "nokey" | "offline";
export const statusStore = memoryStore<{ status: ApiStatus; model?: string | null }>({ status: "checking" });
export const useApiStatus = () => useStore(statusStore);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly body: unknown = null,
  ) {
    super(message);
  }
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = authToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/** A 401 from anything except the sign-in endpoints means the session is gone. */
function checkExpired(path: string, status: number) {
  if (status === 401 && authToken() && !path.startsWith("/api/v1/auth/")) sessionHooks.onExpired();
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 70_000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  init.signal?.addEventListener("abort", () => ctl.abort());
  try {
    const res = await fetch(apiBase() + path, {
      ...init,
      headers: authHeaders((init.headers as Record<string, string>) ?? {}),
      signal: ctl.signal,
    });
    if (!res.ok) {
      let detail = res.statusText;
      let body: unknown = null;
      try {
        body = await res.json();
        const d = (body as { detail?: unknown }).detail;
        detail = typeof d === "string" ? d : typeof (d as { message?: unknown })?.message === "string" ? (d as { message: string }).message : JSON.stringify(d);
      } catch {
        /* not JSON */
      }
      checkExpired(path, res.status);
      throw new ApiError(detail || `HTTP ${res.status}`, res.status, body);
    }
    markOnline();
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") throw new ApiError("The AI server took too long to answer.");
    statusStore.set((s) => ({ ...s, status: s.status === "online" ? "offline" : s.status }));
    throw new ApiError("Can't reach the AI server.");
  } finally {
    clearTimeout(timer);
  }
}

function markOnline() {
  if (statusStore.get().status !== "online" && statusStore.get().status !== "nokey") {
    statusStore.set((s) => ({ ...s, status: "online" }));
  }
}

const send =
  (method: string) =>
  <T,>(path: string, body?: unknown, timeoutMs?: number) =>
    request<T>(
      path,
      body === undefined ? { method } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      timeoutMs,
    );
export const post = send("POST");
export const put = send("PUT");
export const patch = send("PATCH");
export const del = send("DELETE");
export const get = <T,>(path: string, timeoutMs?: number) => request<T>(path, {}, timeoutMs);

/** Wake the (possibly sleeping) Render server and learn whether AI is configured. */
let pinging: Promise<void> | null = null;
export function ping(): Promise<void> {
  if (pinging) return pinging;
  statusStore.set({ status: "waking" });
  pinging = (async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const h = await get<{ ai_ready: boolean; model: string | null }>("/health", 75_000);
        statusStore.set({ status: h.ai_ready ? "online" : "nokey", model: h.model });
        return;
      } catch {
        statusStore.set({ status: "offline" });
        await new Promise((r) => setTimeout(r, 15_000));
      }
    }
  })().finally(() => {
    pinging = null;
  });
  return pinging;
}

/** Stream a chat reply. Calls onDelta with each text piece; resolves with the full text. */
export async function streamChat(
  body: unknown,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; source: string }> {
  const res = await fetch(apiBase() + "/api/v1/chat", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal,
  }).catch(() => {
    throw new ApiError("Can't reach the AI server.");
  });
  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* ignore */
    }
    checkExpired("/api/v1/chat", res.status);
    throw new ApiError(String(detail), res.status);
  }
  markOnline();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let source = "gemini";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? "message";
      const data = /^data: (.*)$/m.exec(block)?.[1];
      if (!data) continue;
      const payload = JSON.parse(data);
      if (event === "delta") {
        text += payload.text;
        onDelta(payload.text);
      } else if (event === "done") {
        source = payload.source;
      } else if (event === "error") {
        throw new ApiError(payload.message);
      }
    }
  }
  return { text, source };
}

// ---------------------------------------------------------------------------------------------
// Typed endpoints

export interface Evaluation {
  score: number;
  grade_label: string;
  beats: { claim: string; mechanism: string; tradeoff: string };
  terms_used: string[];
  terms_missed: string[];
  feedback: string;
  model_answer: string;
  examiner_tip: string;
  next_step: string;
  source: "gemini" | "heuristic";
}

export interface GeneratedQuestion {
  question: string;
  keywords: string[];
  ideal_answer: string;
  module_id: string | null;
  source: "gemini" | "bank";
}

export interface AiChallenge {
  title: string;
  question: string;
  answer: number;
  tolerance: number;
  hint: string;
  explanation: string;
  unit: string;
  verified: boolean;
}

export interface VideoSuggestions {
  date: string;
  videos: { video_id: string; title: string; channel: string; thumbnail: string; url: string; why: string }[];
  search_query: string;
  search_url: string;
  source: "gemini" | "fallback";
}

export interface CodeReview {
  score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  issues: { line: number | null; message: string }[];
  suggestion: string;
  source: "gemini" | "unavailable";
}

export const api = {
  codeReview: (b: {
    course_id: string;
    module_id: string;
    title: string;
    prompt: string;
    language: string;
    code: string;
    reference: string;
    rubric: string[];
    test_summary: string;
  }) => post<CodeReview>("/api/v1/code-review", b, 90_000),
  grade: (b: {
    course_id: string;
    module_id?: string | null;
    question: string;
    answer: string;
    keywords?: string[];
    ideal_answer?: string;
    kind?: "oral" | "written" | "lab";
  }) => post<Evaluation>("/api/v1/grade", b),
  question: (b: { course_id: string; module_id?: string | null; difficulty: string; avoid: string[] }) =>
    post<GeneratedQuestion>("/api/v1/questions", b),
  challenge: (b: { course_id: string; module_id: string; lab_state: Record<string, number | string>; avoid: string[] }) =>
    post<AiChallenge>("/api/v1/challenges", b, 90_000),
  videos: (courseId: string, moduleId: string) =>
    get<VideoSuggestions>(`/api/v1/videos?course_id=${encodeURIComponent(courseId)}&module_id=${encodeURIComponent(moduleId)}`, 90_000),
};
