"use client";
/** The signed-in account, kept in this browser so a return visit signs in automatically. */
import { persistentStore, useStore } from "./store";

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  display_name: string | null;
  buddy_name: string | null;
  avatar_url: string | null;
  has_password: boolean;
  created_at: string;
}

export interface Session {
  token: string;
  user: User;
}

export const sessionStore = persistentStore<Session | null>("studyroom:auth", null, (raw) => {
  const s = raw as Session | null;
  return s && typeof s.token === "string" && s.user?.id ? s : null;
});

export const useSession = () => useStore(sessionStore, null);
export const authToken = () => sessionStore.get()?.token ?? null;

/** Called when the server says our token is no longer valid. Set by auth.ts. */
export const sessionHooks = { onExpired: () => {} };

/** What the student named their buddy. */
export const useBuddyName = () => useSession()?.user.buddy_name || "Buddy";
