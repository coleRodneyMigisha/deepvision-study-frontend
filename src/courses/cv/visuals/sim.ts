/** Pure simulations used by both the CV lab visuals and their goals. */

export const KERNELS: Record<string, number[][]> = {
  sx: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  sy: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
  sharp: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  id: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
};

export type Box = { n: string; b: [number, number, number, number]; s: number; c: "car" | "person" | "dog" };
export const BOXES: Box[] = [
  { n: "A", b: [60, 70, 210, 220], s: 0.95, c: "car" },
  { n: "B", b: [80, 85, 230, 230], s: 0.82, c: "car" },
  { n: "C", b: [45, 60, 190, 200], s: 0.64, c: "car" },
  { n: "D", b: [260, 50, 330, 250], s: 0.91, c: "person" },
  { n: "E", b: [270, 70, 345, 260], s: 0.55, c: "person" },
  { n: "F", b: [350, 180, 420, 260], s: 0.22, c: "dog" },
];

export function iou(a: number[], b: number[]) {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]), x2 = Math.min(a[2], b[2]), y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
  return union ? inter / union : 0;
}

/** Per-class greedy NMS. Returns each box's fate and a readable log. */
export function nms(iouTh: number, confTh: number) {
  const state: Record<string, "keep" | "sup" | "low"> = {};
  const log: string[] = [];
  const rest = BOXES.filter((b) => {
    if (b.s < confTh) {
      state[b.n] = "low";
      log.push(`Drop ${b.n} (${b.s}) — below confidence ${confTh.toFixed(2)}`);
      return false;
    }
    return true;
  }).sort((a, b) => b.s - a.s);
  while (rest.length) {
    const top = rest.shift()!;
    state[top.n] = "keep";
    log.push(`Keep ${top.n} (${top.c}, ${top.s}) — highest remaining`);
    for (let i = rest.length - 1; i >= 0; i--) {
      const o = rest[i];
      if (o.c !== top.c) continue;
      const v = iou(top.b, o.b);
      if (v > iouTh) {
        state[o.n] = "sup";
        log.push(`Suppress ${o.n}: IoU with ${top.n} = ${v.toFixed(2)} > ${iouTh.toFixed(2)}`);
        rest.splice(i, 1);
      }
    }
  }
  return { state, log, kept: Object.values(state).filter((s) => s === "keep").length };
}

export const SEG_N = 18;
export const segGroundTruth = (r: number, c: number) => Math.hypot(r - 8.5, c - 9) < 5.5 || (r >= 11 && r <= 15 && c >= 4 && c <= 8);

/**
 * Two people walk towards each other, stop to talk behind a pillar for 6 frames, then carry on.
 * SORT (motion + IoU only) coasts its tracks at constant velocity while they're hidden, so when the
 * people reappear nothing overlaps and they are given NEW ids — an ID switch. DeepSORT re-identifies
 * lost tracks by appearance and keeps the original ids.
 */
export function kalmanRun(frame: number, occluder: boolean, appearance: boolean) {
  const W = 36, H = 70, MAX_AGE = 25;
  const walk = (f: number) => 9 * Math.min(f, 18) + 9 * Math.max(0, f - 24); // paused for frames 19–24
  const pos = (f: number) => [
    { x: 30 + walk(f), y: 75, col: "#2A6FD0", app: 0 },
    { x: 390 - walk(f), y: 85, col: "#C13018", app: 1 },
  ];
  const hidden = (d: { x: number }) => occluder && d.x + W > 190 && d.x < 250;
  const overlap = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ix = Math.max(0, Math.min(a.x + W, b.x + W) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + H, b.y + H) - Math.max(a.y, b.y));
    const i = ix * iy;
    return i / (2 * W * H - i);
  };
  type Track = { id: number; x: number; y: number; vx: number; app: number; lost: number };
  let tracks: Track[] = [
    { id: 1, x: 30, y: 75, vx: 9, app: 0, lost: 0 },
    { id: 2, x: 390, y: 85, vx: -9, app: 1, lost: 0 },
  ];
  let nextId = 3;
  let switched = false;
  let cost: number[][] = [];
  for (let k = 1; k <= frame; k++) {
    const dets = pos(k).filter((d) => !hidden(d));
    const pred = tracks.map((t) => ({ ...t, x: t.x + t.vx }));
    cost = pred.map((p) =>
      dets.map((d) => {
        const motion = 1 - overlap(p, d), look = p.app === d.app ? 0 : 1;
        if (!appearance) return motion;
        return p.lost ? 0.2 * motion + 0.8 * look : 0.5 * motion + 0.5 * look; // re-ID relaxes the motion gate
      }),
    );
    // Hungarian assignment (brute force is exact for this tiny problem).
    const assign = (ti: number, used: Set<number>): { s: number; pm: number[] } => {
      if (ti === pred.length) return { s: 0, pm: [] };
      let best = { s: Infinity, pm: [] as number[] };
      for (let dj = -1; dj < dets.length; dj++) {
        if (dj >= 0 && (used.has(dj) || cost[ti][dj] >= 0.85)) continue;
        const rest = assign(ti + 1, dj >= 0 ? new Set([...used, dj]) : used);
        const s = (dj < 0 ? 0.9 : cost[ti][dj]) + rest.s;
        if (s < best.s) best = { s, pm: [dj, ...rest.pm] };
      }
      return best;
    };
    const { pm } = assign(0, new Set());
    const matched = new Set<number>();
    pred.forEach((p, ti) => {
      const dj = pm[ti];
      if (dj >= 0) {
        const d = dets[dj];
        p.vx = p.lost ? p.vx : d.x - tracks[ti].x;
        p.x = d.x;
        p.y = d.y;
        if (p.app !== d.app) switched = true;
        p.app = d.app;
        p.lost = 0;
        matched.add(dj);
      } else p.lost++;
    });
    dets.forEach((d, dj) => {
      if (matched.has(dj)) return;
      // An unmatched detection starts a brand-new track: this person just lost their identity.
      switched = true;
      pred.push({ id: nextId++, x: d.x, y: d.y, vx: 0, app: d.app, lost: 0 });
    });
    tracks = pred.filter((t) => t.lost <= MAX_AGE);
  }
  const people = pos(frame).map((d) => ({ ...d, hidden: hidden(d) }));
  return { tracks, people, switched, cost, visible: people.filter((p) => !p.hidden).length };
}
