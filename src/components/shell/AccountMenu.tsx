"use client";
import { Check, CloudOff, LogOut, MailWarning, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/auth/bits";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { ApiError } from "@/lib/api";
import { auth, signOut, updateProfile } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useSyncStatus } from "@/lib/sync";
import { cn } from "@/lib/utils";

const SYNC = {
  off: { icon: CloudOff, text: "Not syncing", tone: "text-muted" },
  syncing: { icon: RefreshCw, text: "Saving to your account…", tone: "text-muted" },
  saved: { icon: Check, text: "Progress saved to your account", tone: "text-good" },
  offline: { icon: CloudOff, text: "Offline — saved here, will sync later", tone: "text-warn" },
};

export function AccountMenu() {
  const session = useSession();
  const sync = useSyncStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  if (!session) return null;
  const { user } = session;
  const label = user.display_name || user.email.split("@")[0];
  const S = SYNC[sync];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Your account"
        className="grid size-9 place-items-center overflow-hidden rounded-full border border-line bg-card text-sm font-bold text-ink-2 transition hover:border-ink-2"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          label.slice(0, 1).toUpperCase()
        )}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-50 w-[300px] rounded-2xl border border-line bg-card p-2 shadow-lift">
          <div className="px-3 pt-2 pb-3">
            <div className="truncate font-semibold">{label}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
            <div className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", S.tone)}>
              <S.icon className={cn("size-3.5", sync === "syncing" && "animate-spin")} /> {S.text}
            </div>
          </div>
          {!user.email_verified && <VerifyNotice email={user.email} />}
          <RenameBuddy current={user.buddy_name ?? "Buddy"} />
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-sunk hover:text-ink"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function RenameBuddy({ current }: { current: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ buddy_name: name });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't rename.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-1 rounded-xl bg-sunk p-3">
      <div className="flex items-center gap-2.5">
        <BuddyAvatar size={30} mood={editing ? "wave" : "idle"} />
        {editing ? (
          <form onSubmit={save} className="flex flex-1 gap-1.5">
            <input
              autoFocus
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              className="h-8 min-w-0 flex-1 rounded-lg border border-line-2 bg-card px-2 text-sm font-semibold outline-none focus:border-accent"
              aria-label="Buddy name"
            />
            <button disabled={busy || !name.trim()} className="rounded-lg bg-ink px-2.5 text-xs font-semibold text-paper disabled:opacity-50">
              {busy ? <Spinner className="size-3" /> : "Save"}
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">Your buddy</div>
              <div className="truncate font-display font-semibold">{current}</div>
            </div>
            <button
              onClick={() => {
                setName(current);
                setEditing(true);
              }}
              className="rounded-full p-1.5 text-muted hover:bg-card hover:text-ink"
              aria-label="Rename your buddy"
            >
              <Pencil className="size-3.5" />
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
    </div>
  );
}

function VerifyNotice({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const send = async () => {
    setState("busy");
    try {
      await auth.magicLink(email);
      setState("sent");
    } catch {
      setState("error");
    }
  };
  return (
    <div className="mb-1 rounded-xl border border-warn/25 bg-warn-bg p-3 text-xs text-warn">
      <div className="flex items-center gap-1.5 font-semibold">
        <MailWarning className="size-3.5" /> Confirm your email
      </div>
      <p className="mt-1 leading-relaxed">
        {state === "sent"
          ? "Link sent — open it on any device to confirm."
          : "So you can always get back in. Open the link we email you."}
      </p>
      {state !== "sent" && (
        <button onClick={send} disabled={state === "busy"} className="mt-1.5 font-semibold underline underline-offset-2">
          {state === "busy" ? "Sending…" : state === "error" ? "Try again" : "Send confirmation link"}
        </button>
      )}
    </div>
  );
}
