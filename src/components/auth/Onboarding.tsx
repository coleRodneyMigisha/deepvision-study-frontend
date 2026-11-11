"use client";
import { ArrowRight, Shuffle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { signOut, updateProfile } from "@/lib/auth";
import type { User } from "@/lib/session";
import { Doodles, SpeechBubble, Spinner } from "./bits";

const IDEAS = ["Pixel", "Nova", "Sage", "Kato", "Biscuit", "Turing", "Ada", "Mango", "Byte", "Nala", "Echo", "Sunny"];

const REACTIONS = [
  (n: string) => `${n}? I love it. 💛`,
  (n: string) => `${n}… that's SO me.`,
  (n: string) => `Ooh, ${n}! Very exam-ready.`,
  (n: string) => `${n} reporting for study duty! 🫡`,
];

/** First thing after signing up: give your study buddy a name, then tell it yours. */
export function Onboarding({ user }: { user: User }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [buddy, setBuddy] = useState("");
  const [me, setMe] = useState(user.display_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const clean = buddy.trim().replace(/\s+/g, " ");
  const reaction = useMemo(() => REACTIONS[Math.floor(Math.random() * REACTIONS.length)], []);
  const ideas = useMemo(() => [...IDEAS].sort(() => Math.random() - 0.5).slice(0, 6), []);

  useEffect(() => {
    input.current?.focus();
  }, [step]);

  const finish = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ buddy_name: clean, display_name: me.trim() || null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that. Try again.");
      setBusy(false);
    }
  };

  const bubble = error
    ? `Uh-oh: ${error}`
    : step === 0
      ? clean
        ? reaction(clean)
        : "Hi! I don't have a name yet… what should you call me?"
      : `Nice to meet you${me.trim() ? `, ${me.trim().split(" ")[0]}` : ""}! I'm ${clean}. Ready when you are 📚`;

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      <Doodles />
      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <SpeechBubble tone={error ? "oops" : "plain"}>{bubble}</SpeechBubble>
          <BuddyAvatar mood={busy ? "thinking" : error ? "oops" : clean ? (step === 1 ? "happy" : "wave") : "idle"} size={132} />
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6 shadow-lift sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] text-accent uppercase">
            Step {step + 1} of 2
            <span className="flex gap-1">
              {[0, 1].map((i) => (
                <span key={i} className={i <= step ? "h-1.5 w-5 rounded-full bg-accent" : "h-1.5 w-5 rounded-full bg-line"} />
              ))}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.form
                key="buddy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (clean) setStep(1);
                }}
              >
                <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight">First things first — name your study buddy</h1>
                <p className="mt-2 text-[15px] text-ink-2">They&apos;ll explain, quiz and nudge you all week. You can rename them any time.</p>
                <input
                  ref={input}
                  value={buddy}
                  maxLength={24}
                  onChange={(e) => setBuddy(e.target.value)}
                  placeholder="Type a name…"
                  aria-label="Buddy name"
                  className="mt-6 h-14 w-full rounded-2xl border-2 border-line-2 bg-paper px-5 font-display text-2xl font-semibold outline-none transition placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted focus:border-accent focus:bg-card"
                />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted">Need ideas?</span>
                  {ideas.map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setBuddy(n)}
                      className="rounded-full border border-line bg-paper px-3 py-1 text-[13px] font-semibold text-ink-2 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBuddy(IDEAS[Math.floor(Math.random() * IDEAS.length)])}
                    className="grid size-7 place-items-center rounded-full text-muted hover:bg-sunk hover:text-ink"
                    aria-label="Random name"
                  >
                    <Shuffle className="size-3.5" />
                  </button>
                </div>
                <Button type="submit" variant="primary" size="lg" className="mt-7 w-full" disabled={!clean}>
                  {clean ? `Call them ${clean}` : "Pick a name"} <ArrowRight className="size-4" />
                </Button>
              </motion.form>
            ) : (
              <motion.form key="me" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={finish}>
                <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight">And what should {clean} call you?</h1>
                <p className="mt-2 text-[15px] text-ink-2">Optional — a first name or nickname is perfect.</p>
                <input
                  ref={input}
                  value={me}
                  maxLength={60}
                  onChange={(e) => setMe(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  className="mt-6 h-14 w-full rounded-2xl border-2 border-line-2 bg-paper px-5 text-xl font-semibold outline-none transition placeholder:text-base placeholder:font-normal placeholder:text-muted focus:border-accent focus:bg-card"
                />
                <div className="mt-7 flex gap-2">
                  <Button variant="ghost" size="lg" onClick={() => setStep(0)} disabled={busy}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={busy}>
                    {busy ? <Spinner /> : null} Let&apos;s study <ArrowRight className="size-4" />
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          Signed in as {user.email} ·{" "}
          <button className="font-semibold underline-offset-2 hover:underline" onClick={() => void signOut()}>
            not you?
          </button>
        </p>
      </div>
    </div>
  );
}
