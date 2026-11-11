"use client";
import { persistentStore, useStore } from "./store";

export const DEFAULT_API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://deepvision-study-backend.onrender.com").replace(/\/+$/, "");

export interface Settings {
  apiUrl: string; // "" = default
  narrator: boolean;
  buddyDocked: boolean;
}

export const settingsStore = persistentStore<Settings>("studyroom:v3:settings", {
  apiUrl: "",
  narrator: false,
  buddyDocked: true,
});

export const useSettings = () => useStore(settingsStore);

/** Overriding the API URL is a local-dev convenience only. In production a stored override is
 *  ignored, so nobody can talk a student into pointing the app (and their sign-in token) at
 *  someone else's server. */
export const API_URL_EDITABLE = process.env.NODE_ENV !== "production";

export const apiBase = () =>
  ((API_URL_EDITABLE && settingsStore.get().apiUrl) || DEFAULT_API_URL).replace(/\/+$/, "");
