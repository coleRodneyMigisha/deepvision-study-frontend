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
export const apiBase = () => (settingsStore.get().apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
