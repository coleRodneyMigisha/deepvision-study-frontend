"use client";
/**
 * Tiny persistent stores on top of localStorage + useSyncExternalStore.
 * Everything a student does lives in their browser — no accounts needed.
 */
import { useSyncExternalStore } from "react";

export interface Store<T> {
  get(): T;
  set(update: T | ((prev: T) => T)): void;
  subscribe(fn: () => void): () => void;
}

export function persistentStore<T>(key: string, initial: T, revive: (raw: unknown) => T = (r) => r as T): Store<T> {
  let value: T | undefined;
  const listeners = new Set<() => void>();
  const load = (): T => {
    if (value !== undefined) return value;
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      value = raw == null ? initial : revive(JSON.parse(raw));
    } catch {
      value = initial;
    }
    return value;
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        value = undefined;
        listeners.forEach((l) => l());
      }
    });
  }
  return {
    get: load,
    set(update) {
      const next = typeof update === "function" ? (update as (p: T) => T)(load()) : update;
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked — keep in memory */
      }
      listeners.forEach((l) => l());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function memoryStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(update) {
      value = typeof update === "function" ? (update as (p: T) => T)(value) : update;
      listeners.forEach((l) => l());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Subscribe to a store. `serverValue` is used for prerendering and the first hydration pass. */
export function useStore<T>(store: Store<T>, serverValue?: T): T {
  return useSyncExternalStore(store.subscribe, store.get, () => serverValue ?? store.get());
}
