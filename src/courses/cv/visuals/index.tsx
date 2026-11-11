"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { VisualProps } from "@/lib/lab/types";
import { clamp } from "@/lib/utils";
import { BOXES, kalmanRun, KERNELS, nms, segGroundTruth, SEG_N } from "./sim";
import { canvasClass, cellAt, useCanvas } from "./useCanvas";

/** Brightness / contrast / grayscale applied to a synthetic image, with clipping stats. */
export function ImageAdjust({ values, report }: VisualProps) {
  const b = Number(values.brightness), c = Number(values.contrast), gray = Boolean(values.gray);
  const ref = useCanvas(
    320,
    200,
    (g) => {
      const img = g.createImageData(320, 200);
      let sum = 0, clip = 0;
      for (let y = 0; y < 200; y++)
        for (let x = 0; x < 320; x++) {
          let rgb = [170 + 60 * Math.sin(x / 30), 120 + 80 * Math.cos(y / 25), 90 + 70 * Math.sin((x + y) / 40)];
          if (Math.hypot(x - 160, y - 100) < 55) rgb = [230, 190, 70];
          let px = rgb.map((v) => (v - 128) * c + 128 + b);
          if (gray) {
            const Y = 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2];
            px = [Y, Y, Y];
          }
          px = px.map((v) => {
            if (v < 0 || v > 255) clip++;
            return clamp(v, 0, 255);
          });
          const i = (y * 320 + x) * 4;
          img.data.set([px[0], px[1], px[2], 255], i);
          sum += (px[0] + px[1] + px[2]) / 3;
        }
      // putImageData ignores the transform, so draw at device scale via an offscreen canvas
      const off = document.createElement("canvas");
      off.width = 320;
      off.height = 200;
      off.getContext("2d")!.putImageData(img, 0, 0);
      g.drawImage(off, 0, 0);
      report({ meanIntensity: Math.round((sum / 64000) * 10) / 10, clippedPct: Math.round((clip / 192000) * 1000) / 10 });
    },
    [b, c, gray],
  );
  return <canvas ref={ref} className={canvasClass} style={{ aspectRatio: "320/200" }} aria-label="Adjusted image" />;
}

/** Paint on a 16×16 input and see a 3×3 kernel's response. */
export function KernelPlayground({ values, report }: VisualProps) {
  const N = 16;
  const [img, setImg] = useState(() => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (c >= 5 && c <= 10 && r >= 4 && r <= 11 ? 1 : 0))));
  const painting = useRef(false);
  const k = KERNELS[String(values.kernel)] ?? KERNELS.sx;
  const isEdge = values.kernel === "sx" || values.kernel === "sy";
  const out = img.map((row, r) =>
    row.map((_, c) => {
      let s = 0;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) s += k[i + 1][j + 1] * (img[r + i]?.[c + j] ?? 0);
      return isEdge ? clamp(Math.abs(s) / 4) : clamp(s);
    }),
  );
  const strongest = Math.max(...out.flat());
  useEffect(() => report({ painted: img.flat().filter(Boolean).length, maxResponse: Math.round(strongest * 100) / 100 }), [img, strongest, report]);
  const inRef = useCanvas(160, 160, (g) => img.forEach((row, r) => row.forEach((v, c) => { const x = v * 235 + 20; g.fillStyle = `rgb(${x},${x},${x})`; g.fillRect(c * 10, r * 10, 10, 10); })), [img]);
  const outRef = useCanvas(160, 160, (g) => out.forEach((row, r) => row.forEach((v, c) => { g.fillStyle = isEdge ? `rgb(${255 - v * 79},${253 - v * 112},${248 - v * 188})` : `rgb(${v * 235 + 20},${v * 235 + 20},${v * 235 + 20})`; g.fillRect(c * 10, r * 10, 10, 10); })), [out, isEdge]);
  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = cellAt(e, N);
    if (cell) setImg((m) => (m[cell[0]][cell[1]] ? m : m.map((row, r) => row.map((v, c) => (r === cell[0] && c === cell[1] ? 1 : v)))));
  };
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div>
        <div className="mb-1 text-xs text-muted">input — paint with your mouse/finger</div>
        <canvas ref={inRef} className={`${canvasClass} w-40`} style={{ aspectRatio: "1" }} onPointerDown={(e) => { painting.current = true; paint(e); }} onPointerMove={(e) => painting.current && paint(e)} onPointerUp={() => (painting.current = false)} onPointerLeave={() => (painting.current = false)} />
      </div>
      <div>
        <div className="mb-1 text-xs text-muted">output</div>
        <canvas ref={outRef} className={`${canvasClass} w-40`} style={{ aspectRatio: "1" }} />
      </div>
      <div>
        <div className="mb-1 text-xs text-muted">weights</div>
        <table className="font-mono text-xs">
          <tbody>
            {k.map((row, i) => (
              <tr key={i}>{row.map((v, j) => <td key={j} className="border border-line px-2 py-1 text-center">{Number.isInteger(v) ? v : v.toFixed(2)}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setImg(Array.from({ length: N }, () => Array(N).fill(0)))}>Clear input</Button>
      </div>
    </div>
  );
}

const CURVES: Record<string, [(x: number) => number, (x: number) => number]> = {
  ok: [(x) => 0.1 + 0.85 * Math.exp(-x * 4), (x) => 0.18 + 0.8 * Math.exp(-x * 3.6)],
  over: [(x) => 0.05 + 0.9 * Math.exp(-x * 4.5), (x) => 0.3 + 0.6 * Math.exp(-x * 5) + Math.max(0, x - 0.3) * 0.9],
  under: [(x) => 0.62 + 0.3 * Math.exp(-x * 3), (x) => 0.66 + 0.3 * Math.exp(-x * 3)],
  lr: [(x) => 0.5 + 0.25 * Math.abs(Math.sin(x * 30)) * (1 - x * 0.3), (x) => 0.55 + 0.28 * Math.abs(Math.sin(x * 27 + 1))],
};

export function LossCurves({ values }: VisualProps) {
  const sc = String(values.curve);
  const ref = useCanvas(420, 220, (g) => {
    g.fillStyle = "#FFFDF8"; g.fillRect(0, 0, 420, 220);
    g.strokeStyle = "#D8CFBA"; g.beginPath(); g.moveTo(40, 10); g.lineTo(40, 190); g.lineTo(410, 190); g.stroke();
    const [tr, va] = CURVES[sc] ?? CURVES.ok;
    ([[tr, "#007D54", "train"], [va, "#C13018", "validation"]] as const).forEach(([f, c, name], k) => {
      g.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200, px = 40 + x * 370, py = 190 - clamp(f(x)) * 170; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.strokeStyle = c; g.lineWidth = 2.2; g.stroke();
      g.fillStyle = c; g.font = "600 12px sans-serif"; g.fillText(name, 300, 24 + k * 16);
    });
    g.fillStyle = "#746759"; g.font = "11px sans-serif"; g.fillText("epochs →", 350, 210); g.fillText("loss", 6, 20);
  }, [sc]);
  return <canvas ref={ref} className={canvasClass} style={{ aspectRatio: "420/220" }} aria-label="Training curves" />;
}

export function NmsCanvas({ values }: VisualProps) {
  const { state } = nms(Number(values.iouTh), Number(values.confTh));
  const col: Record<string, string> = { car: "#A2512D", person: "#201A15", dog: "#007D54" };
  const ref = useCanvas(440, 300, (g) => {
    g.fillStyle = "#F4E6D5"; g.fillRect(0, 0, 440, 300);
    BOXES.forEach((b) => {
      const st = state[b.n];
      g.globalAlpha = st === "low" ? 0.25 : 1;
      g.strokeStyle = col[b.c]; g.lineWidth = st === "keep" ? 3 : 1.5; g.setLineDash(st === "keep" ? [] : [6, 4]);
      g.strokeRect(b.b[0], b.b[1], b.b[2] - b.b[0], b.b[3] - b.b[1]); g.setLineDash([]);
      g.fillStyle = col[b.c]; g.font = "600 11px sans-serif"; g.fillText(`${b.n} ${b.c} ${b.s}`, b.b[0] + 3, b.b[1] - 4);
      g.globalAlpha = 1;
    });
  }, [JSON.stringify(state)]);
  return (
    <div>
      <canvas ref={ref} className={canvasClass} style={{ aspectRatio: "440/300" }} aria-label="Detections" />
      <p className="mt-1.5 text-xs text-muted">Solid = kept · dashed = suppressed · faded = below the confidence threshold</p>
    </div>
  );
}

export function MaskPainter({ report }: VisualProps) {
  const N = SEG_N, cs = 20;
  const [pred, setPred] = useState(() => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (Math.hypot(r - 7, c - 11) < 6 ? 1 : 0))));
  const [mode, setMode] = useState<0 | 1>(1);
  const down = useRef<0 | 1 | null>(null);
  let tp = 0, fp = 0, fn = 0;
  pred.forEach((row, r) => row.forEach((p, c) => { const g = segGroundTruth(r, c); if (g && p) tp++; else if (p) fp++; else if (g) fn++; }));
  const iou = tp / (tp + fp + fn || 1), dice = (2 * tp) / (2 * tp + fp + fn || 1);
  useEffect(() => report({ tp, fp, fn, iou: Math.round(iou * 1000) / 1000, dice: Math.round(dice * 1000) / 1000 }), [tp, fp, fn, iou, dice, report]);
  const ref = useCanvas(360, 360, (g) => {
    g.fillStyle = "#FFFDF8"; g.fillRect(0, 0, 360, 360);
    pred.forEach((row, r) => row.forEach((p, c) => {
      const G = segGroundTruth(r, c);
      g.fillStyle = G && p ? "#FF8601" : p ? "#F3B7A8" : G ? "#E8F0FC" : "#FFFDF8";
      g.fillRect(c * cs, r * cs, cs - 1, cs - 1);
    }));
    g.strokeStyle = "#201A15"; g.lineWidth = 1.5; g.setLineDash([4, 3]);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!segGroundTruth(r, c)) continue;
      const edges: [boolean, number, number, number, number][] = [
        [r === 0 || !segGroundTruth(r - 1, c), c * cs, r * cs, c * cs + cs, r * cs],
        [r === N - 1 || !segGroundTruth(r + 1, c), c * cs, r * cs + cs, c * cs + cs, r * cs + cs],
        [c === 0 || !segGroundTruth(r, c - 1), c * cs, r * cs, c * cs, r * cs + cs],
        [c === N - 1 || !segGroundTruth(r, c + 1), c * cs + cs, r * cs, c * cs + cs, r * cs + cs],
      ];
      edges.forEach(([draw, x1, y1, x2, y2]) => { if (draw) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } });
    }
    g.setLineDash([]);
  }, [pred]);
  const paint = (e: React.PointerEvent<HTMLCanvasElement>, v: 0 | 1) => {
    const cell = cellAt(e, N);
    if (cell) setPred((m) => (m[cell[0]][cell[1]] === v ? m : m.map((row, r) => row.map((x, c) => (r === cell[0] && c === cell[1] ? v : x)))));
  };
  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        className={`${canvasClass} max-w-[360px]`}
        style={{ aspectRatio: "1" }}
        onPointerDown={(e) => { down.current = e.shiftKey ? 0 : mode; paint(e, down.current); }}
        onPointerMove={(e) => down.current !== null && paint(e, down.current)}
        onPointerUp={() => (down.current = null)}
        onPointerLeave={() => (down.current = null)}
        aria-label="Paint a segmentation mask"
      />
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={mode ? "ink" : "outline"} onClick={() => setMode(1)}>Paint</Button>
        <Button size="sm" variant={!mode ? "ink" : "outline"} onClick={() => setMode(0)}>Erase</Button>
        <Button size="sm" variant="ghost" onClick={() => setPred((m) => m.map((row) => row.map(() => 0)))}>Clear</Button>
        <Button size="sm" variant="ghost" onClick={() => setPred((m) => m.map((row, r) => row.map((_, c) => (segGroundTruth(r, c) ? 1 : 0))))}>Fill ground truth</Button>
      </div>
      <p className="text-xs text-muted">Dashed outline = ground truth · orange = true positive · pink = false positive · blue = missed</p>
    </div>
  );
}

export function KalmanCanvas({ values, set }: VisualProps) {
  const f = Number(values.frame), occ = Boolean(values.occluder), app = Boolean(values.appearance);
  const sim = kalmanRun(f, occ, app);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = Number(values.frame) + 1;
      if (next > 40) { setPlaying(false); return; }
      set("frame", next);
    }, 120);
    return () => clearInterval(id);
  }, [playing, values.frame, set]);
  const ref = useCanvas(440, 240, (g) => {
    g.fillStyle = "#F4E6D5"; g.fillRect(0, 0, 440, 240);
    if (occ) { g.fillStyle = "#D6C8B4"; g.fillRect(190, 20, 60, 200); }
    sim.people.forEach((d) => { if (d.hidden) return; g.fillStyle = d.col; g.beginPath(); g.arc(d.x + 18, d.y + 12, 10, 0, 7); g.fill(); g.fillRect(d.x + 6, d.y + 24, 24, 42); });
    sim.tracks.forEach((tr) => {
      g.strokeStyle = ["", "#2A6FD0", "#FF8601"][tr.id] ?? "#C13018"; g.lineWidth = 2; g.setLineDash(tr.lost ? [5, 4] : []);
      g.strokeRect(tr.x, tr.y, 36, 70); g.setLineDash([]);
      g.fillStyle = g.strokeStyle; g.font = "600 12px sans-serif"; g.fillText(`ID ${tr.id}`, tr.x, tr.y - 5);
    });
  }, [f, occ, app]);
  return (
    <div className="space-y-2">
      <canvas ref={ref} className={canvasClass} style={{ aspectRatio: "440/240" }} aria-label="Two people crossing" />
      <Button size="sm" variant="ink" onClick={() => { if (!playing && f >= 40) set("frame", 0); setPlaying((p) => !p); }}>
        {playing ? "Pause" : "Play"}
      </Button>
    </div>
  );
}
