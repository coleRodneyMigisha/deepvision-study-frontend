"use client";
import { ArrowUp, Eraser, Lightbulb, ListChecks, MessageCircleQuestion, Route, Sparkles, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { useApiStatus } from "@/lib/api";
import {
  askBuddy,
  type BuddyMode,
  chatKey,
  clearChat,
  closeBuddy,
  stopBuddy,
  uiStore,
  useBuddyPageState,
  useBuddyUi,
  useChat,
} from "@/lib/buddy";
import { cn } from "@/lib/utils";
import { BuddyAvatar } from "./BuddyAvatar";

const MODES: { mode: BuddyMode; label: string; icon: typeof Lightbulb; prompt: (topic: string) => string }[] = [
  { mode: "nudge", label: "Nudge", icon: Route, prompt: () => "I'm stuck — give me a nudge, not the answer." },
  { mode: "hint", label: "Hint", icon: Lightbulb, prompt: () => "Give me a hint for what I'm working on." },
  { mode: "walkthrough", label: "Walk me through", icon: ListChecks, prompt: () => "Walk me through this step by step." },
  { mode: "explain", label: "Explain from zero", icon: Sparkles, prompt: (t) => `Explain ${t} from scratch like I missed the lecture.` },
  { mode: "quiz", label: "Quiz me", icon: MessageCircleQuestion, prompt: (t) => `Quiz me on ${t}, one question at a time.` },
];

const VIEW_LABEL = { home: "Home", course: "Course map", lesson: "Lesson", lab: "Lab", exam: "Mock exam", guide: "Guide" };

export function BuddyPanel() {
  const ui = useBuddyUi();
  const page = useBuddyPageState();
  const messages = useChat(chatKey(page));
  const status = useApiStatus();
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const topic = page.moduleTitle ?? page.courseLabel ?? "this course";

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, ui.open]);
  useEffect(() => {
    if (ui.open) setTimeout(() => input.current?.focus(), 200);
  }, [ui.open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBuddy();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = () => askBuddy(ui.draft);

  return (
    <AnimatePresence>
      {ui.open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBuddy}
          />
          <motion.aside
            aria-label="Study buddy"
            className="no-print fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-line bg-card shadow-lift xl:top-[64px] xl:shadow-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <BuddyAvatar mood={ui.mood} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg leading-tight font-semibold">Study buddy</div>
                <div className="truncate text-xs text-muted">
                  {VIEW_LABEL[page.context.view]}
                  {page.moduleTitle ? ` · ${page.moduleTitle}` : page.courseLabel ? ` · ${page.courseLabel}` : ""}
                </div>
              </div>
              <button className="rounded-full p-2 text-muted hover:bg-sunk hover:text-ink" onClick={clearChat} title="Clear conversation">
                <Eraser className="size-4" />
              </button>
              <button className="rounded-full p-2 text-muted hover:bg-sunk hover:text-ink" onClick={closeBuddy} aria-label="Close">
                <X className="size-4" />
              </button>
            </header>

            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto bg-paper px-4 py-5">
              {!messages.length && <Welcome topic={topic} hasCourse={!!page.courseId} />}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14.5px] whitespace-pre-wrap text-paper">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5">
                    <BuddyAvatar size={26} mood={m.error ? "oops" : "idle"} className="mt-1" />
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl rounded-tl-md border border-line bg-card px-4 py-3 text-[14.5px]",
                        m.error && "border-warn/30 bg-warn-bg",
                      )}
                    >
                      {m.text ? <Markdown>{m.text}</Markdown> : <span className="text-muted italic">Thinking…</span>}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-line bg-card px-3 pt-3 pb-4">
              <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {MODES.map(({ mode, label, icon: Icon, prompt }) => (
                  <button
                    key={mode}
                    disabled={ui.busy || !page.courseId}
                    onClick={() => askBuddy(prompt(topic), mode)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-2 transition hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    <Icon className="size-3.5" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-2xl border border-line-2 bg-paper p-1.5 focus-within:border-accent">
                <textarea
                  ref={input}
                  rows={1}
                  value={ui.draft}
                  onChange={(e) => uiStore.set((s) => ({ ...s, draft: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={page.courseId ? "Ask anything about this…" : "Open a course to chat"}
                  className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[14.5px] outline-none placeholder:text-muted"
                />
                {ui.busy ? (
                  <button onClick={stopBuddy} className="grid size-9 place-items-center rounded-full bg-sunk text-ink" aria-label="Stop">
                    <Square className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!ui.draft.trim() || !page.courseId}
                    className="grid size-9 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
                    aria-label="Send"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                )}
              </div>
              {status.status === "waking" && (
                <p className="mt-2 text-center text-xs text-muted">Waking the AI server — the first reply can take up to a minute.</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Welcome({ topic, hasCourse }: { topic: string; hasCourse: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-card p-4 text-[14.5px] text-ink-2">
      <p className="font-semibold text-ink">Hey! I&apos;m your study buddy 👋</p>
      <p className="mt-1.5">
        {hasCourse
          ? `I can see what you're working on in ${topic}. Ask me anything, or pick a mode below — I'll nudge before I tell, so you actually learn it.`
          : "Open a course and I'll follow along with your lessons, labs and exams."}
      </p>
    </div>
  );
}
