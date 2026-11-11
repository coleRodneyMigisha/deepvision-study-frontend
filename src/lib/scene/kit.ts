/**
 * A tiny 2D drawing kit for lesson scenes. Scenes draw on a fixed 720×360 "paper" canvas;
 * the player scales it to the screen. A scene is called every frame with:
 *   step — index of the lesson step being shown
 *   p    — 0→1 progress through the current step's entrance animation
 *   t    — seconds since the step started (for looping motion)
 */
export const W = 720;
export const H = 360;

export const C = {
  paper: "#FFFDF8", ink: "#1B100A", ink2: "#43352B", muted: "#746759", line: "#E2D5C4", line2: "#D6C8B4",
  gold: "#FF8601", goldD: "#A2512D", goldL: "#FDEBD7", goldXL: "#FFF8F0", navy: "#201A15", navyL: "#EDE0D0",
  sage: "#007D54", sageL: "#EAF5EE", rust: "#C13018", rustL: "#FDEEE9", sky: "#2A6FD0", skyL: "#E8F0FC",
} as const;

export interface TextOpts { w?: number; s?: number; mono?: boolean; serif?: boolean; c?: string; a?: CanvasTextAlign; b?: CanvasTextBaseline }
export interface RectOpts { f?: string; s?: string; r?: number; lw?: number; dash?: number[] }

export type Kit = ReturnType<typeof createKit>;
export type Scene = (kit: Kit, step: number, p: number, t: number) => void;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (x: number) => {
  x = clamp(x);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

export interface Fonts { sans: string; display: string; mono: string }

export function createKit(ctx: CanvasRenderingContext2D, fonts: Fonts) {
  const txt = (s: string | number, x: number, y: number, o: TextOpts = {}) => {
    const family = o.mono ? fonts.mono : o.serif ? fonts.display : fonts.sans;
    ctx.font = `${o.w ?? 500} ${o.s ?? 13}px ${family}`;
    ctx.fillStyle = o.c ?? C.ink;
    ctx.textAlign = o.a ?? "left";
    ctx.textBaseline = o.b ?? "alphabetic";
    ctx.fillText(String(s), x, y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };
  const rect = (x: number, y: number, w: number, h: number, { f, s, r = 6, lw = 1.5, dash }: RectOpts = {}) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    if (f) { ctx.fillStyle = f; ctx.fill(); }
    if (s) {
      ctx.strokeStyle = s; ctx.lineWidth = lw;
      if (dash) ctx.setLineDash(dash);
      ctx.stroke(); ctx.setLineDash([]);
    }
  };
  const line = (x1: number, y1: number, x2: number, y2: number, c: string = C.ink2, lw = 1.5, dash?: number[]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = c; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(); ctx.setLineDash([]);
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number, c: string = C.ink2, lw = 1.6) => {
    line(x1, y1, x2, y2, c, lw);
    const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
    ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  };
  const circle = (x: number, y: number, r: number, { f, s, lw = 1.5 }: { f?: string; s?: string; lw?: number } = {}) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (f) { ctx.fillStyle = f; ctx.fill(); }
    if (s) { ctx.strokeStyle = s; ctx.lineWidth = lw; ctx.stroke(); }
  };
  const heading = (title: string, sub?: string) => {
    txt(title, 28, 38, { s: 19, w: 600, serif: true });
    if (sub) txt(sub, 28, 58, { s: 12.5, c: C.muted });
  };
  const tag = (s: string, x: number, y: number, { f = C.goldL, c = C.goldD }: { f?: string; c?: string } = {}) => {
    ctx.font = `600 11.5px ${fonts.sans}`;
    const w = ctx.measureText(s).width + 16;
    rect(x, y - 14, w, 21, { f, r: 10 });
    txt(s, x + 8, y + 1, { s: 11.5, w: 600, c });
    return w;
  };
  const formulaBar = (s: string) => {
    rect(28, H - 52, W - 56, 34, { f: C.goldXL, s: C.goldL, r: 8 });
    txt(s, W / 2, H - 30, { mono: true, s: 12.5, w: 500, c: C.goldD, a: "center" });
  };
  const pixVal = (r: number, c: number, n: number) => {
    const cx = (n - 1) / 2, d = Math.hypot(r - cx * 0.9, c - cx * 1.1);
    return Math.round(clamp(235 - d * 42 + c * 6, 12, 250));
  };
  const grid = (
    x: number, y: number, n: number, cs: number,
    valFn: (r: number, c: number) => number | string,
    { nums = false, colorFn }: { nums?: boolean; colorFn?: (v: number | string, r: number, c: number) => string } = {},
  ) => {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const v = valFn(r, c);
      ctx.fillStyle = colorFn ? colorFn(v, r, c) : `rgb(${v},${v},${v})`;
      ctx.fillRect(x + c * cs, y + r * cs, cs, cs);
      if (nums) txt(String(v), x + c * cs + cs / 2, y + r * cs + cs / 2 + 4, {
        s: cs < 26 ? 9 : 10.5, mono: true, a: "center", c: typeof v === "number" && v < 120 ? "#fff" : C.ink,
      });
    }
    for (let i = 0; i <= n; i++) {
      line(x, y + i * cs, x + n * cs, y + i * cs, "rgba(29,27,22,.12)", 1);
      line(x + i * cs, y, x + i * cs, y + n * cs, "rgba(29,27,22,.12)", 1);
    }
  };
  return { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid };
}
