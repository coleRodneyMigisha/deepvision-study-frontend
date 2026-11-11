"use client";
import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BuddyAvatar, type Mood } from "@/components/buddy/BuddyAvatar";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { auth, loadAuthConfig, loadGoogle, useAuthConfig } from "@/lib/auth";
import type { CourseSummary } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { Doodles, SpeechBubble, Spinner, TextField, useRotating, useSlow } from "./bits";

type Mode = "signin" | "signup";
type Screen = { kind: "form" } | { kind: "sent"; what: "magic" | "reset"; email: string };

const QUIPS = [
  "Hey! I'm your study buddy. Let's get you exam-ready.",
  "Seven days. Three courses. One very prepared you.",
  "I've read every slide. Twice. 📚",
  "Streaks start the day you sign in 🔥",
  "I nudge before I tell — so it actually sticks.",
];

const EMAIL_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AuthScreen({ courses }: { courses: CourseSummary[] }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [screen, setScreen] = useState<Screen>({ kind: "form" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "password" | "magic" | "reset" | "google">(null);
  const [error, setError] = useState<string | null>(null);
  const { config, error: configError } = useAuthConfig();
  const slow = useSlow(busy !== null || !config);
  const quip = useRotating(QUIPS);

  useEffect(() => {
    void loadAuthConfig();
  }, []);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<unknown>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const emailValid = EMAIL_OK.test(email.trim());
  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return setError("Pop in your email first.");
    if (!password) return setError(mode === "signup" ? "Choose a password (8+ characters)." : "Type your password.");
    void run("password", () => (mode === "signup" ? auth.signup(email, password) : auth.login(email, password)));
  };
  const sendMagic = () => {
    if (!emailValid) return setError("Type your email, then I'll send you a link.");
    void run("magic", async () => {
      await auth.magicLink(email);
      setScreen({ kind: "sent", what: "magic", email: email.trim() });
    });
  };
  const sendReset = () => {
    if (!emailValid) return setError("Type your email, then I'll send a reset link.");
    void run("reset", async () => {
      await auth.forgot(email);
      setScreen({ kind: "sent", what: "reset", email: email.trim() });
    });
  };

  const mood: Mood = error ? "oops" : busy ? "thinking" : screen.kind === "sent" ? "happy" : emailValid ? "happy" : "idle";
  const bubble = error
    ? `Hmm… ${error}`
    : screen.kind === "sent"
      ? "Go check your inbox — I'll be right here. ✉️"
      : busy && slow
        ? "Waking up the server… free hosting naps a lot 😴"
        : mode === "signup"
          ? "New here? Yay! You get to name me in a sec 👀"
          : quip;

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Stage: the buddy says hi */}
      <section className="relative flex flex-col justify-between overflow-hidden border-b border-line px-5 pt-6 pb-2 sm:px-10 sm:pt-8 sm:pb-10 lg:border-r lg:border-b-0 lg:py-12">
        <Doodles layout="right" />
        <div className="relative flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-[15px] text-[#FFD84D]">✦</span>
          StudyRoom
        </div>

        <div className="relative my-7 flex flex-col items-start gap-4 sm:my-10 sm:gap-5 lg:my-0">
          <SpeechBubble tone={error ? "oops" : "plain"}>{bubble}</SpeechBubble>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
            <BuddyAvatar mood={mood} size={148} className="hidden drop-shadow-[0_18px_24px_rgb(30_25_20/0.18)] sm:block" />
            <BuddyAvatar mood={mood} size={88} className="drop-shadow-[0_12px_16px_rgb(30_25_20/0.18)] sm:hidden" />
          </motion.div>
          <h1 className="mt-1 max-w-md font-display text-[2rem] leading-[1.05] font-semibold tracking-tight sm:mt-2 sm:text-5xl">
            From <span className="hl">zero</span> to exam-ready, <span className="text-accent">together.</span>
          </h1>
          <p className="hidden max-w-md text-[15.5px] leading-relaxed text-ink-2 sm:block">
            Lessons, labs, coding practice and mock exams — with a buddy who knows your lecturer&apos;s slides and remembers
            where you left off.
          </p>
        </div>

        <div className="relative hidden flex-wrap gap-2 sm:flex">
          {courses.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-card/80 px-3 py-1.5 text-[13px] font-medium backdrop-blur">
              <span className="size-2.5 rounded-full" style={{ background: c.accent }} />
              <span className="font-mono text-xs text-muted">{c.code}</span> {c.shortTitle}
            </span>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            {screen.kind === "sent" ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <motion.div
                  className="mb-6 grid size-16 place-items-center rounded-2xl bg-[#FFD84D] text-ink shadow-[4px_4px_0_var(--ink)]"
                  animate={{ rotate: [0, -6, 6, -3, 0] }}
                  transition={{ duration: 1.1, delay: 0.2 }}
                >
                  <Mail className="size-7" />
                </motion.div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Check your inbox</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  {screen.what === "magic" ? "We sent a sign-in link to " : "We sent a password-reset link to "}
                  <strong className="text-ink">{screen.email}</strong>. It works once and expires in 30 minutes. Not there? Peek in spam.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setScreen({ kind: "form" })}>
                    <ArrowLeft className="size-4" /> Use a different email
                  </Button>
                  <Button variant="ghost" disabled={busy !== null} onClick={screen.what === "magic" ? sendMagic : sendReset}>
                    {busy ? <Spinner /> : null} Send again
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="mb-7 inline-flex rounded-full border border-line bg-sunk p-1" role="tablist">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => {
                        setMode(m);
                        setError(null);
                      }}
                      className={cn(
                        "relative rounded-full px-4 py-1.5 text-sm font-semibold text-ink-2 transition",
                        mode === m && "text-ink",
                      )}
                    >
                      {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-card shadow-card" />}
                      <span className="relative">{m === "signin" ? "Sign in" : "Create account"}</span>
                    </button>
                  ))}
                </div>

                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  {mode === "signin" ? "Welcome back 👋" : "Make your study room"}
                </h2>
                <p className="mt-2 text-[15px] text-ink-2">
                  {mode === "signin"
                    ? "Pick up right where you left off — progress, streak and buddy chats included."
                    : "Your progress, streak and buddy chats get saved to your account, on every device."}
                </p>

                <div className="mt-7">
                  <GoogleButton clientId={config?.google_client_id ?? null} loading={!config} onError={setError} onBusy={(b) => setBusy(b ? "google" : null)} />
                </div>

                {(config?.google_client_id || !config) && (
                  <div className="my-6 flex items-center gap-3 text-xs font-medium text-muted">
                    <span className="h-px flex-1 bg-line" /> or use your email <span className="h-px flex-1 bg-line" />
                  </div>
                )}

                <form onSubmit={submitPassword} className="space-y-4">
                  <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    hint={
                      mode === "signin" && config?.email_links ? (
                        <button type="button" onClick={sendReset} className="text-xs font-semibold text-accent hover:underline">
                          Forgot?
                        </button>
                      ) : undefined
                    }
                  />
                  <Button type="submit" variant="ink" size="lg" className="w-full" disabled={busy !== null}>
                    {busy === "password" ? <Spinner /> : null}
                    {mode === "signin" ? "Sign in" : "Create my account"}
                    {busy !== "password" && <ArrowRight className="size-4" />}
                  </Button>
                </form>

                {config?.email_links !== false && (
                  <button
                    onClick={sendMagic}
                    disabled={busy !== null || !config}
                    className="group mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-line-2 px-4 py-3 text-sm font-semibold text-ink-2 transition hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    {busy === "magic" ? <Spinner /> : <Sparkles className="size-4 transition group-hover:rotate-12" />}
                    Skip the password — email me a magic link
                  </button>
                )}

                {!config && (
                  <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
                    <Spinner className="size-3" />
                    {configError || slow ? "Waking up the server — this can take up to a minute…" : "Connecting…"}
                  </p>
                )}
                <p className="mt-6 text-center text-xs leading-relaxed text-muted">
                  Signing up with an email you don&apos;t own won&apos;t stick — the real owner can always reclaim it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

/** Google's own button (rendered by Google Identity Services) + One Tap for returning students. */
function GoogleButton({
  clientId,
  loading,
  onError,
  onBusy,
}: {
  clientId: string | null;
  loading: boolean;
  onError: (msg: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const callbacks = useRef({ onError, onBusy });
  callbacks.current = { onError, onBusy };

  useEffect(() => {
    if (!clientId || !slot.current) return;
    let cancelled = false;
    loadGoogle()
      .then((g) => {
        if (cancelled || !slot.current) return;
        g.initialize({
          client_id: clientId,
          auto_select: true, // returning Google users are signed straight back in
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }: { credential: string }) => {
            callbacks.current.onBusy(true);
            try {
              await auth.google(credential);
            } catch (err) {
              callbacks.current.onError(err instanceof ApiError ? err.message : "Google sign-in failed. Try again.");
            } finally {
              callbacks.current.onBusy(false);
            }
          },
        });
        const dark = document.documentElement.classList.contains("dark");
        g.renderButton(slot.current, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: Math.min(400, slot.current.offsetWidth || 360),
        });
        g.prompt();
        setReady(true);
      })
      .catch(() => callbacks.current.onError("Couldn't load Google sign-in. Use your email instead."));
    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel();
    };
  }, [clientId]);

  if (!loading && !clientId) return null;
  return (
    <div className="relative min-h-11">
      {!ready && <div className="absolute inset-0 animate-pulse rounded-full border border-line bg-sunk" />}
      <div ref={slot} className="flex justify-center [color-scheme:light]" />
    </div>
  );
}
