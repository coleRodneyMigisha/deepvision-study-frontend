"use client";
/** Sign-in flows (Google, magic link, password) and the account actions behind them. */
import { get, patch, post } from "./api";
import { memoryStore, useStore } from "./store";
import { type Session, sessionHooks, sessionStore, type User } from "./session";
import { stopSync, wipeLocalStudyData } from "./sync";

export interface AuthConfig {
  google_client_id: string | null;
  email_links: boolean;
  passwords: boolean;
}

interface SessionOut extends Session {
  is_new: boolean;
}

/** null until the (possibly sleeping) server answers. */
export const authConfigStore = memoryStore<{ config: AuthConfig | null; error: boolean }>({ config: null, error: false });
export const useAuthConfig = () => useStore(authConfigStore);

let loadingConfig: Promise<void> | null = null;
export function loadAuthConfig(): Promise<void> {
  if (authConfigStore.get().config) return Promise.resolve();
  loadingConfig ??= (async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const config = await get<AuthConfig>("/api/v1/auth/config", 75_000);
        authConfigStore.set({ config, error: false });
        return;
      } catch {
        authConfigStore.set((s) => ({ ...s, error: true }));
        await new Promise((r) => setTimeout(r, 8_000));
      }
    }
  })().finally(() => {
    loadingConfig = null;
  });
  return loadingConfig;
}

/** Store the new session. AppShell notices the new user and starts syncing their progress. */
function begin(out: SessionOut): SessionOut {
  sessionStore.set({ token: out.token, user: out.user });
  return out;
}

export const auth = {
  google: (credential: string) => post<SessionOut>("/api/v1/auth/google", { credential }).then(begin),
  signup: (email: string, password: string) => post<SessionOut>("/api/v1/auth/signup", { email, password }).then(begin),
  login: (email: string, password: string) => post<SessionOut>("/api/v1/auth/login", { email, password }).then(begin),
  verify: (token: string) => post<SessionOut>("/api/v1/auth/verify", { token }).then(begin),
  reset: (token: string, password: string) => post<SessionOut>("/api/v1/auth/password/reset", { token, password }).then(begin),
  magicLink: (email: string) => post<{ message: string }>("/api/v1/auth/magic-link", { email }),
  forgot: (email: string) => post<{ message: string }>("/api/v1/auth/password/forgot", { email }),
  /** Emails the signed-in student a "Confirm your email" link. */
  resendVerification: () => post<{ message: string }>("/api/v1/me/verify-email", {}),
};

export async function updateProfile(fields: { buddy_name?: string; display_name?: string | null }) {
  const user = await patch<User>("/api/v1/me", fields);
  sessionStore.set((s) => (s ? { ...s, user } : s));
  return user;
}

/** Refresh the profile (e.g. after verifying the email in another tab). Signs out if the token died. */
export async function refreshMe() {
  if (!sessionStore.get()) return;
  try {
    const user = await get<User>("/api/v1/me");
    sessionStore.set((s) => (s ? { ...s, user } : s));
  } catch {
    /* offline, or 401 handled by onExpired */
  }
}

export async function signOut() {
  const had = sessionStore.get();
  await stopSync({ flush: true });
  if (had) {
    try {
      await post("/api/v1/auth/logout", {}, 8_000);
    } catch {
      /* the token dies with the local copy anyway */
    }
  }
  sessionStore.set(null);
  wipeLocalStudyData();
  disableGoogleAutoSelect();
}

sessionHooks.onExpired = () => {
  void stopSync({ flush: false });
  sessionStore.set(null);
  wipeLocalStudyData();
};

// ---------------------------------------------------------------------------------------------
// Google Identity Services ("Continue with Google" + One Tap for returning students).

interface GoogleId {
  initialize(o: Record<string, unknown>): void;
  renderButton(el: HTMLElement, o: Record<string, unknown>): void;
  prompt(): void;
  disableAutoSelect(): void;
  cancel(): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gsi: Promise<GoogleId> | null = null;
export function loadGoogle(): Promise<GoogleId> {
  gsi ??= new Promise<GoogleId>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("gsi")));
    s.onerror = () => {
      gsi = null;
      reject(new Error("Couldn't load Google sign-in."));
    };
    document.head.appendChild(s);
  });
  return gsi;
}

function disableGoogleAutoSelect() {
  window.google?.accounts?.id?.disableAutoSelect();
}
