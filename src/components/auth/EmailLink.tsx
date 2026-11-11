"use client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { Button, ButtonLink } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Doodles, SpeechBubble, Spinner, TextField, useSlow } from "./bits";

type State =
  | { kind: "working" }
  | { kind: "reset"; token: string }
  | { kind: "done" }
  | { kind: "failed"; message: string };

/**
 * Landing page for emailed links: /auth/?login=…, ?verify=… (sign in) and ?reset=… (new password).
 * The token is removed from the address bar straight away so it doesn't linger in history.
 */
export function EmailLink() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "working" });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const slow = useSlow(state.kind === "working" || busy);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const q = new URLSearchParams(window.location.search);
    window.history.replaceState(null, "", "/auth/");
    const reset = q.get("reset");
    const token = q.get("login") ?? q.get("verify");
    if (reset) return setState({ kind: "reset", token: reset });
    if (!token) return setState({ kind: "failed", message: "This link is missing its code. Request a new one." });
    auth
      .verify(token)
      .then(() => {
        setState({ kind: "done" });
        router.replace("/");
      })
      .catch((err) => setState({ kind: "failed", message: err instanceof ApiError ? err.message : "Couldn't sign you in." }));
  }, [router]);

  const [hint, setHint] = useState<string | null>(null);

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind !== "reset") return;
    setBusy(true);
    try {
      await auth.reset(state.token, password);
      setState({ kind: "done" });
      router.replace("/");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't save that password.";
      // A too-weak password leaves the link usable; anything else means it's spent or expired.
      if (err instanceof ApiError && err.status === 422) setHint(message);
      else setState({ kind: "failed", message });
    } finally {
      setBusy(false);
    }
  };

  const bubble =
    state.kind === "failed"
      ? `Oh no — ${state.message}`
      : state.kind === "reset"
        ? hint ?? "Pick a new password and I'll sign you straight in."
        : slow
          ? "Waking up the server… almost there 😴"
          : "Checking your link…";

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      <Doodles />
      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <SpeechBubble tone={state.kind === "failed" || hint ? "oops" : "plain"}>{bubble}</SpeechBubble>
        <BuddyAvatar
          mood={state.kind === "failed" ? "oops" : state.kind === "done" ? "happy" : state.kind === "working" ? "thinking" : "idle"}
          size={120}
          className="mt-4"
        />
        {state.kind === "working" && <Spinner className="mt-8 size-5 text-muted" />}
        {state.kind === "failed" && (
          <ButtonLink href="/" variant="ink" size="lg" className="mt-8">
            Back to sign in <ArrowRight className="size-4" />
          </ButtonLink>
        )}
        {state.kind === "reset" && (
          <form onSubmit={submitReset} className="mt-8 w-full rounded-[28px] border border-line bg-card p-6 text-left shadow-lift">
            <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
            <TextField
              className="mt-5"
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setHint(null);
              }}
            />
            <Button type="submit" variant="ink" size="lg" className="mt-5 w-full" disabled={busy || password.length < 8}>
              {busy ? <Spinner /> : null} Save and sign in
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
