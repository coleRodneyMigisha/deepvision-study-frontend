"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ping, useApiStatus } from "@/lib/api";
import { API_URL_EDITABLE, DEFAULT_API_URL, settingsStore, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const LABEL = { checking: "Connecting", waking: "Waking AI", online: "AI on", nokey: "AI key missing", offline: "Offline" };
const DOT = { checking: "bg-muted", waking: "bg-warn animate-pulse", online: "bg-good", nokey: "bg-warn", offline: "bg-bad" };

export function StatusPill() {
  const { status, model } = useApiStatus();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-card px-3 text-[13px] font-medium whitespace-nowrap text-ink-2"
        title={model ? `Model: ${model}` : "AI backend settings"}
      >
        <span className={cn("size-2 rounded-full", DOT[status])} />
        <span className="hidden xl:inline">{LABEL[status]}</span>
      </button>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const { status, model } = useApiStatus();
  const [url, setUrl] = useState(settings.apiUrl || DEFAULT_API_URL);
  const save = () => {
    const clean = url.trim().replace(/\/+$/, "");
    settingsStore.set((s) => ({ ...s, apiUrl: clean === DEFAULT_API_URL ? "" : clean }));
    void ping();
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-card border border-line bg-card p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">AI connection</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-sunk" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-2">
          The buddy, grading, fresh questions, lab challenges and daily videos come from the StudyRoom API. The free server sleeps
          when idle, so the first request can take up to a minute. Everything else works offline.
        </p>
        <div className="mt-4 rounded-xl bg-sunk p-3 font-mono text-xs">
          status: {status}
          {model ? ` · model: ${model}` : ""}
        </div>
        {API_URL_EDITABLE ? (
          <>
            <label className="mt-4 block text-sm font-medium">
              API URL
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line-2 bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={save}>
                Save & test
              </Button>
              <Button variant="ghost" onClick={() => setUrl(DEFAULT_API_URL)}>
                Use default
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <Button variant="primary" onClick={() => void ping()}>
              Test connection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
