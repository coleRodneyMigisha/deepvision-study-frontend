"use client";
import { Check, CloudOff, LogOut, MailWarning, Pencil, RefreshCw, UserRound } from "lucide-react";
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
          {!user.email_verified && <VerifyNotice email={user.email} hasPassword={user.has_password} />}
          <NameRow
            label="Your name"
            current={user.display_name ?? ""}
            placeholder="Add your name"
            maxLength={60}
            icon={<span className="grid size-[30px] place-items-center rounded-full bg-card text-muted"><UserRound className="size-4" /></span>}
            onSave={(name) => updateProfile({ display_name: name })}
          />
          <NameRow
            label="Your buddy"
            current={user.buddy_name ?? "Buddy"}
            maxLength={24}
            icon={(editing) => <BuddyAvatar size={30} mood={editing ? "wave" : "idle"} />}
            onSave={(name) => updateProfile({ buddy_name: name })}
          />
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

/** One editable name in the menu: the student's own name or their buddy's. */
function NameRow({
  label,
  current,
  placeholder,
  maxLength,
  icon,
  onSave,
}: {
  label: string;
  current: string;
  placeholder?: string;
  maxLength: number;
  icon: React.ReactNode | ((editing: boolean) => React.ReactNode);
  onSave: (name: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(name.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that name.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-1 rounded-xl bg-sunk p-3">
      <div className="flex items-center gap-2.5">
        {typeof icon === "function" ? icon(editing) : icon}
        {editing ? (
          <form onSubmit={save} className="flex flex-1 gap-1.5">
            <input
              autoFocus
              value={name}
              maxLength={maxLength}
              placeholder={placeholder}
              onChange={(e) => setName(e.target.value)}
              className="h-8 min-w-0 flex-1 rounded-lg border border-line-2 bg-card px-2 text-sm font-semibold outline-none focus:border-accent"
              aria-label={label}
            />
            <button disabled={busy || !name.trim()} className="rounded-lg bg-ink px-2.5 text-xs font-semibold text-paper disabled:opacity-50">
              {busy ? <Spinner className="size-3" /> : "Save"}
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</div>
              <div className={cn("truncate font-display font-semibold", !current && "text-muted")}>{current || placeholder}</div>
            </div>
            <button
              onClick={() => {
                setName(current);
                setEditing(true);
              }}
              className="rounded-full p-1.5 text-muted hover:bg-card hover:text-ink"
              aria-label={`Change ${label.toLowerCase()}`}
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

function VerifyNotice({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const send = async () => {
    setState("busy");
    try {
      setMessage((await auth.resendVerification()).message);
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
          ? `${message || `Link sent to ${email}.`}${hasPassword ? " Open it in this browser so your password keeps working." : ""}`
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
