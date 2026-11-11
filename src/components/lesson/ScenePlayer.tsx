"use client";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Kbd } from "@/components/ui";
import { createKit, H, type Scene, W } from "@/lib/scene/kit";
import { settingsStore, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const ENTRANCE_SECONDS = 1.6;
/** Reading time for a caption at a comfortable pace, used by autoplay. */
const dwell = (text: string) => Math.max(5, text.split(/\s+/).length / 2.7 + 1.5);

function cssFont(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function ScenePlayer({
  scene,
  steps,
  step,
  onStep,
  gateStep,
  gateOpen,
  onGate,
}: {
  scene?: Scene;
  steps: string[];
  step: number;
  onStep: (i: number) => void;
  /** Step that interrupts playback with the checkpoint (-1 = none). */
  gateStep: number;
  gateOpen: boolean;
  onGate: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const started = useRef(performance.now());
  const { narrator } = useSettings();

  // Draw loop: entrance progress p (0→1) and running time t for the current step.
  useEffect(() => {
    if (!scene || !canvas.current) return;
    const el = canvas.current;
    const ctx = el.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const kit = createKit(ctx, {
      sans: cssFont("--font-inter", "system-ui, sans-serif"),
      display: cssFont("--font-fraunces", "Georgia, serif"),
      mono: cssFont("--font-jetbrains", "ui-monospace, monospace"),
    });
    started.current = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = (now - started.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#FFFDF8";
      ctx.fillRect(0, 0, W, H);
      try {
        scene(kit, step, Math.min(1, t / ENTRANCE_SECONDS), t);
      } catch (err) {
        console.error("scene error", err);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [scene, step]);

  // Narration (browser speech synthesis).
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    if (narrator && playing) {
      const u = new SpeechSynthesisUtterance(steps[step].replace(/`/g, "").replace(/×/g, " by "));
      const voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
      u.voice = voices.find((v) => /Natural|Google UK English Female|Samantha|Daniel/i.test(v.name)) ?? voices[0] ?? null;
      speechSynthesis.speak(u);
    }
    return () => speechSynthesis.cancel();
  }, [narrator, playing, step, steps]);

  const go = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(steps.length - 1, i));
      if (gateStep >= 0 && step <= gateStep && target > gateStep && !gateOpen) {
        setPlaying(false);
        onStep(gateStep);
        onGate();
        return;
      }
      onStep(target);
    },
    [gateOpen, gateStep, onGate, onStep, step, steps.length],
  );

  // Autoplay advances after the caption's reading time.
  useEffect(() => {
    if (!playing) return;
    if (step === steps.length - 1) {
      const id = setTimeout(() => setPlaying(false), dwell(steps[step]) * 1000);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => go(step + 1), dwell(steps[step]) * 1000);
    return () => clearTimeout(id);
  }, [playing, step, steps, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowRight") go(step + 1);
      if (e.key === "ArrowLeft") go(step - 1);
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  const isGate = step === gateStep;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      {scene ? (
        <div className="relative border-b border-line bg-[#FFFDF8]">
          <canvas ref={canvas} className="block aspect-[2/1] w-full cursor-pointer" onClick={() => go(step + 1)} aria-label="Lesson animation — click for the next step" />
          {isGate && (
            <span className="absolute top-3 right-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink shadow">Checkpoint</span>
          )}
        </div>
      ) : (
        <div className="grid aspect-[2.6/1] place-items-center border-b border-line bg-sunk p-8 text-center">
          <p className="max-w-2xl font-display text-xl leading-snug font-medium sm:text-2xl">{steps[step]}</p>
        </div>
      )}

      {scene && (
        <p className={cn("min-h-[5.5rem] px-5 py-4 text-[16px] leading-relaxed sm:px-6", isGate && "font-medium")}>{steps[step]}</p>
      )}

      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5 sm:px-4">
        <button onClick={() => go(step - 1)} disabled={step === 0} className="grid size-9 place-items-center rounded-full hover:bg-sunk disabled:opacity-30" aria-label="Previous step">
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
        </button>
        <button onClick={() => go(step + 1)} disabled={step === steps.length - 1} className="grid size-9 place-items-center rounded-full hover:bg-sunk disabled:opacity-30" aria-label="Next step">
          <ChevronRight className="size-5" />
        </button>
        <div className="mx-2 flex flex-1 items-center gap-1" role="tablist" aria-label="Lesson steps">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              title={s.slice(0, 90)}
              aria-label={`Step ${i + 1}`}
              className={cn(
                "h-2 flex-1 rounded-full transition",
                i === step ? "bg-accent" : i < step ? "bg-accent/35" : "bg-line",
                i === gateStep && "ring-2 ring-accent/40 ring-offset-1 ring-offset-card",
              )}
            />
          ))}
        </div>
        <span className="hidden font-mono text-xs text-muted sm:inline">
          {step + 1}/{steps.length}
        </span>
        <button
          onClick={() => settingsStore.set((s) => ({ ...s, narrator: !s.narrator }))}
          className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-sunk"
          title={narrator ? "Narration on" : "Narration off"}
        >
          {narrator ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
        <button onClick={() => onStep(0)} className="hidden size-9 place-items-center rounded-full text-ink-2 hover:bg-sunk sm:grid" title="Restart">
          <RotateCcw className="size-4" />
        </button>
      </div>
      <div className="hidden px-5 pb-2 text-[11px] text-muted lg:block">
        <Kbd>←</Kbd> <Kbd>→</Kbd> step · <Kbd>space</Kbd> play
      </div>
    </div>
  );
}
