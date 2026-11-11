import { useEffect, useRef } from "react";

/** A crisp (DPR-aware) canvas of fixed logical size; `draw` reruns whenever deps change. */
export function useCanvas(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = w * dpr;
    el.height = h * dpr;
    const g = el.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export const canvasClass = "block w-full max-w-full rounded-xl border border-line bg-[#FFFDF8] touch-none";

/** Map a pointer event to a cell of an n×n grid drawn over the whole canvas. */
export function cellAt(e: React.PointerEvent<HTMLCanvasElement>, n: number): [number, number] | null {
  const rc = e.currentTarget.getBoundingClientRect();
  const c = Math.floor(((e.clientX - rc.left) / rc.width) * n);
  const r = Math.floor(((e.clientY - rc.top) / rc.height) * n);
  return r >= 0 && r < n && c >= 0 && c < n ? [r, c] : null;
}
