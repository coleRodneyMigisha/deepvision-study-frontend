/** CSC3104 — guided computer-vision labs. */
import type { LabDef } from "@/lib/lab/types";
import { fmt } from "@/lib/utils";
import { ImageAdjust, KalmanCanvas, KernelPlayground, LossCurves, MaskPainter, NmsCanvas } from "./visuals";
import { BOXES, iou, kalmanRun, nms } from "./visuals/sim";

const n = (v: unknown) => Number(v) || 0;
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225], CH = ["Red", "Green", "Blue"];

const CURVE_DX: Record<string, string> = {
  ok: "Both losses fall and level off close together — a good fit. Keep the best-validation checkpoint.",
  over: "Training loss keeps falling while validation rises after ~30% of training: **overfitting** (high variance). Augment, regularise, stop early, or get more data.",
  under: "Both losses stay high and close: **underfitting** (high bias). Bigger model, train longer, less regularisation.",
  lr: "Loss jumps around and never settles: the **learning rate is too high**. Lower it or use warm-up + cosine decay.",
};

export const labs: Record<string, LabDef> = {
  "images-as-data": {
    intro: "Follow one pixel through ToTensor() and Normalize() exactly as PyTorch does, then push a whole image's brightness and contrast until values clip.",
    sections: [
      {
        id: "normalise",
        title: "Normalise one pixel",
        controls: [
          { kind: "select", id: "channel", label: "Channel", default: "0", options: CH.map((c, i) => ({ value: String(i), label: `${c} (μ ${MEAN[i]}, σ ${STD[i]})` })) },
          { kind: "range", id: "pixel", label: "Raw pixel value", min: 0, max: 255, default: 128 },
        ],
        derive: (v) => {
          const ch = n(v.channel), x = n(v.pixel) / 255;
          return { scaled: x, normalised: (x - MEAN[ch]) / STD[ch] };
        },
        view: (v, d) => [{ kind: "result", label: "Normalised value", value: n(d.normalised).toFixed(3), work: `${n(v.pixel)}/255 = ${n(d.scaled).toFixed(4)}\n(${n(d.scaled).toFixed(4)} − ${MEAN[n(v.channel)]}) / ${STD[n(v.channel)]} = ${n(d.normalised).toFixed(3)}` }],
        code: `tf = transforms.Compose([
    transforms.ToTensor(),                        # HWC uint8 [0,255] → CHW float [0,1]
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])`,
      },
      {
        id: "adjust",
        title: "Brightness, contrast & grayscale",
        controls: [
          { kind: "range", id: "brightness", label: "Brightness (add)", min: -100, max: 100, default: 0 },
          { kind: "range", id: "contrast", label: "Contrast (multiply around 128)", min: 0.2, max: 2.5, step: 0.1, default: 1, format: (x) => `${x.toFixed(1)}×` },
          { kind: "toggle", id: "gray", label: "Grayscale: Y = 0.299R + 0.587G + 0.114B", default: false },
        ],
        Visual: ImageAdjust,
        view: (_, d) => [{ kind: "stats", items: [{ label: "Mean intensity", value: String(d.meanIntensity ?? "—") }, { label: "Values clipped to [0, 255]", value: `${d.clippedPct ?? 0}%`, tone: n(d.clippedPct) > 10 ? "bad" : "neutral" }] }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-norm", prompt: "A red pixel of 255 after ToTensor + ImageNet Normalize — what value comes out? (2 dp)", answer: 2.25, tolerance: 0.01, explain: "255/255 = 1.0; (1.0 − 0.485) / 0.229 = 2.25. Normalised values can exceed 1 — they're z-scores, not intensities." },
      { kind: "goal", id: "g-zero", prompt: "Find the raw green value that normalises closest to 0.", hint: "Solve x/255 = 0.456.", check: (v, d) => v.channel === "1" && Math.abs(n(d.normalised)) < 0.01 },
      { kind: "goal", id: "g-clip", prompt: "Push the image until more than 20% of values clip.", hint: "High contrast or extreme brightness.", check: (_, d) => n(d.clippedPct) > 20 },
      { kind: "explain", id: "e-norm", prompt: "Why normalise with the ImageNet mean and std when fine-tuning a pretrained network?", keywords: ["pretrained", "statistics", "distribution", "same", "mean", "std", "imagenet", "gradient", "stable", "shift"], idealAnswer: "The pretrained weights were learned on inputs normalised with ImageNet's per-channel mean and standard deviation, so their filters and BatchNorm statistics expect that distribution. Feeding differently scaled inputs shifts every activation and wastes or damages the pretrained features. Centred, similarly scaled inputs also keep gradients well-conditioned, making optimisation stable." },
    ],
    daily: (r, date) => {
      const ch = r.int(0, 2), raw = r.int(40, 245, 5), ans = Math.round(((raw / 255 - MEAN[ch]) / STD[ch]) * 100) / 100;
      return { title: `Normalisation · ${date}`, question: `A <b>${CH[ch].toLowerCase()}</b> pixel has raw value <b>${raw}</b> (μ = ${MEAN[ch]}, σ = ${STD[ch]}). What is it after <code>ToTensor()</code> + ImageNet <code>Normalize()</code>? (2 dp)`, answer: ans, tolerance: 0.02, hint: `(${raw}/255 − ${MEAN[ch]}) / ${STD[ch]}`, explanation: `${raw}/255 = ${(raw / 255).toFixed(4)} → (${(raw / 255).toFixed(4)} − ${MEAN[ch]}) / ${STD[ch]} = ${ans}.` };
    },
  },

  cnns: {
    intro: "Compute conv output shapes and parameter counts like the exam asks, then paint an image and watch an edge detector light up — parameter sharing you can see.",
    sections: [
      {
        id: "arith",
        title: "Output size & parameters",
        controls: [
          { kind: "number", id: "W", label: "Input width W", default: 224, min: 1 },
          { kind: "number", id: "K", label: "Kernel K", default: 3, min: 1 },
          { kind: "number", id: "P", label: "Padding P", default: 1, min: 0 },
          { kind: "number", id: "S", label: "Stride S", default: 1, min: 1 },
          { kind: "number", id: "Cin", label: "C_in", default: 3, min: 1 },
          { kind: "number", id: "Cout", label: "C_out", default: 64, min: 1 },
        ],
        derive: (v) => {
          const out = Math.floor((n(v.W) - n(v.K) + 2 * n(v.P)) / Math.max(1, n(v.S))) + 1;
          return { out, params: (n(v.K) ** 2 * n(v.Cin) + 1) * n(v.Cout), macs: out > 0 ? out * out * n(v.K) ** 2 * n(v.Cin) * n(v.Cout) : 0 };
        },
        view: (v, d) => [
          { kind: "result", label: "Output tensor", value: n(d.out) > 0 ? `${n(d.out)} × ${n(d.out)} × ${n(v.Cout)}` : "invalid — kernel bigger than input", work: `⌊(${n(v.W)} − ${n(v.K)} + 2·${n(v.P)}) / ${n(v.S)}⌋ + 1 = ${n(d.out)}` },
          { kind: "stats", items: [{ label: "Parameters", value: fmt(n(d.params)) }, { label: "Multiply-adds", value: fmt(n(d.macs)) }] },
          { kind: "note", text: `(${n(v.K)}·${n(v.K)}·${n(v.Cin)} + 1) · ${n(v.Cout)} — independent of image size, thanks to parameter sharing.` },
        ],
      },
      {
        id: "kernel",
        title: "Kernel playground",
        controls: [{ kind: "select", id: "kernel", label: "Kernel", default: "sx", options: [{ value: "sx", label: "Sobel-x (vertical edges)" }, { value: "sy", label: "Sobel-y (horizontal edges)" }, { value: "blur", label: "Box blur" }, { value: "sharp", label: "Sharpen" }, { value: "id", label: "Identity" }] }],
        Visual: KernelPlayground,
        view: () => [{ kind: "note", text: "The same 9 weights slide over every position — that's why a conv layer works anywhere in the image (translation equivariance)." }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-out", prompt: "W = 32, K = 5, P = 0, S = 1. Output width?", answer: 28, tolerance: 0, explain: "⌊(32 − 5 + 0) / 1⌋ + 1 = 28. Without padding every 5×5 conv shrinks the map by 4." },
      { kind: "goal", id: "g-same", prompt: "Configure a 'same' 5×5 convolution on a 64-wide input (output = 64).", hint: "Padding = (K − 1) / 2.", check: (v, d) => n(v.K) === 5 && n(v.W) === 64 && n(v.S) === 1 && n(d.out) === 64 },
      { kind: "goal", id: "g-half", prompt: "Halve 224 → 112 with a 3×3 conv.", hint: "Stride 2, padding 1.", check: (v, d) => n(v.W) === 224 && n(v.K) === 3 && n(d.out) === 112 },
      { kind: "explain", id: "e-cnn", prompt: "Why do CNNs beat fully connected networks on images? Name the two inductive biases and what pooling adds.", keywords: ["local connectivity", "parameter sharing", "fewer parameters", "equivariance", "translation", "pooling", "no parameters", "invariance", "downsample"], idealAnswer: "Flattening a 224×224×3 image into a dense layer needs millions of weights per neuron and overfits. CNNs build in local connectivity — each unit sees a small patch — and parameter sharing — the same kernel slides everywhere — which slashes parameters and gives translation equivariance: a feature detected here is detected there too. Max pooling has no learnable parameters; it downsamples and adds a little invariance to small shifts." },
    ],
    daily: (r, date) => {
      const W = r.int(64, 256, 16), K = r.pick([3, 5, 7]), P = r.int(0, 3), S = r.pick([1, 2]);
      const out = Math.floor((W - K + 2 * P) / S) + 1;
      return { title: `Conv output · ${date}`, question: `Input width <b>${W}</b>, a <b>${K}×${K}</b> conv, padding <b>${P}</b>, stride <b>${S}</b>. Output width?`, answer: out, tolerance: 0, hint: "O = ⌊(W − K + 2P)/S⌋ + 1", explanation: `⌊(${W} − ${K} + ${2 * P}) / ${S}⌋ + 1 = ${out}.` };
    },
  },

  "training-evaluation": {
    intro: "Fill in a confusion matrix and watch accuracy lie on imbalanced data. Then read four sets of training curves the way an examiner expects you to.",
    sections: [
      {
        id: "matrix",
        title: "Metrics from a confusion matrix",
        presets: [
          { label: "Reset", values: { tp: 40, fn: 20, fp: 10, tn: 930 } },
          { label: "'Always negative' model", values: { tp: 0, fn: 60, fp: 0, tn: 940 } },
        ],
        controls: [
          { kind: "number", id: "tp", label: "True positives", default: 40, min: 0 },
          { kind: "number", id: "fn", label: "False negatives", default: 20, min: 0 },
          { kind: "number", id: "fp", label: "False positives", default: 10, min: 0 },
          { kind: "number", id: "tn", label: "True negatives", default: 930, min: 0 },
        ],
        derive: (v) => {
          const tp = n(v.tp), fn = n(v.fn), fp = n(v.fp), tn = n(v.tn), N = tp + fn + fp + tn;
          const P = tp + fp ? tp / (tp + fp) : 0, R = tp + fn ? tp / (tp + fn) : 0;
          return { accuracy: N ? (tp + tn) / N : 0, precision: P, recall: R, f1: P + R ? (2 * P * R) / (P + R) : 0, specificity: tn + fp ? tn / (tn + fp) : 0 };
        },
        view: (_, d) => [
          { kind: "stats", items: (["accuracy", "precision", "recall", "f1", "specificity"] as const).map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: `${(100 * n(d[k])).toFixed(1)}%`, tone: k === "recall" && n(d.recall) < 0.5 ? ("bad" as const) : ("neutral" as const) })) },
          ...(n(d.accuracy) > 0.9 && n(d.recall) < 0.5 ? [{ kind: "note" as const, text: "High accuracy, low recall: the model misses most positives. Accuracy is misleading here.", tone: "bad" as const }] : []),
        ],
      },
      {
        id: "curves",
        title: "Read the curves",
        controls: [{ kind: "select", id: "curve", label: "Scenario", default: "over", options: [{ value: "ok", label: "Scenario A" }, { value: "over", label: "Scenario B" }, { value: "under", label: "Scenario C" }, { value: "lr", label: "Scenario D" }] }],
        Visual: LossCurves,
        view: (v) => [{ kind: "note", text: CURVE_DX[String(v.curve)] }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-f1", prompt: "TP = 40, FP = 10, FN = 20. What's the F1 score? (2 dp)", answer: 0.73, tolerance: 0.01, explain: "P = 40/50 = 0.80, R = 40/60 = 0.667; F1 = 2·0.8·0.667 / 1.467 = 0.73." },
      { kind: "goal", id: "g-liar", prompt: "Build a matrix with ≥ 95% accuracy and 0% recall.", hint: "Try the 'always negative' preset.", check: (_, d) => n(d.accuracy) >= 0.95 && n(d.recall) === 0 },
      { kind: "goal", id: "g-pr", prompt: "Make precision ≥ 90% while recall is ≤ 50%.", hint: "Very few false positives, many false negatives.", check: (_, d) => n(d.precision) >= 0.9 && n(d.recall) <= 0.5 && n(d.recall) > 0 },
      { kind: "explain", id: "e-curves", prompt: "How do you diagnose overfitting vs underfitting from loss curves, and what do you do about each?", keywords: ["training loss", "validation loss", "gap", "overfitting", "variance", "underfitting", "bias", "regularisation", "augmentation", "early stopping", "bigger model"], idealAnswer: "If training loss keeps falling while validation loss turns upward, the model is memorising — overfitting, high variance: add data or augmentation, dropout or weight decay, and use early stopping. If both losses stay high and close, it's underfitting — high bias: use a bigger model, train longer, reduce regularisation or improve features. A noisy loss that never settles usually means the learning rate is too high." },
    ],
    daily: (r, date) => {
      const tp = r.int(30, 90, 5), fp = r.int(10, 40, 5), fn = r.int(10, 50, 5);
      const P = tp / (tp + fp), R = tp / (tp + fn), f1 = Math.round(((2 * P * R) / (P + R)) * 100) / 100;
      return { title: `F1 score · ${date}`, question: `A detector scores <b>TP = ${tp}, FP = ${fp}, FN = ${fn}</b>. What is its F1 score (0–1, 2 dp)?`, answer: f1, tolerance: 0.015, hint: "F1 = 2PR / (P + R).", explanation: `P = ${P.toFixed(3)}, R = ${R.toFixed(3)} → F1 = ${f1}.` };
    },
  },

  "transfer-learning": {
    intro: "Choose a transfer-learning strategy for four real situations, then count exactly how many ResNet-50 parameters you'd be training.",
    sections: [
      {
        id: "strategy",
        title: "Freeze or fine-tune?",
        controls: [
          { kind: "select", id: "size", label: "Your dataset", default: "small", options: [{ value: "small", label: "Small (hundreds – a few thousand)" }, { value: "large", label: "Large (tens of thousands +)" }] },
          { kind: "select", id: "sim", label: "Similarity to ImageNet", default: "sim", options: [{ value: "sim", label: "Similar (natural photos)" }, { value: "diff", label: "Different (X-rays, satellite, microscopy)" }] },
        ],
        derive: (v) => ({ strategy: `${v.size}-${v.sim}` }),
        view: (_, d) => {
          const R: Record<string, [string, string, string]> = {
            "small-sim": ["Freeze the backbone, train a new head", "Little data + familiar features → a linear probe avoids overfitting.", 'model = resnet50(weights="IMAGENET1K_V2")\nfor p in model.parameters(): p.requires_grad = False\nmodel.fc = nn.Linear(2048, num_classes)\nopt = AdamW(model.fc.parameters(), lr=1e-3)'],
            "small-diff": ["Train the head, then gently fine-tune the top blocks", "Features don't fully transfer but data is scarce: unfreeze only upper layers with a small LR and strong augmentation.", 'opt = AdamW([{"params": model.layer4.parameters(), "lr": 1e-5},\n             {"params": model.fc.parameters(), "lr": 1e-4}])'],
            "large-sim": ["Fine-tune the whole network", "Plenty of data → adapt all layers from a great starting point.", "for p in model.parameters(): p.requires_grad = True\nopt = AdamW(model.parameters(), lr=1e-4, weight_decay=0.05)"],
            "large-diff": ["Fine-tune everything with discriminative LRs (or start from a domain model)", "Lots of data in a different domain → full fine-tuning, smaller LRs for early layers.", 'opt = AdamW([{"params": model.layer1.parameters(), "lr": 1e-5},\n             {"params": model.layer4.parameters(), "lr": 1e-4},\n             {"params": model.fc.parameters(), "lr": 1e-3}])'],
          };
          const [rec, why, code] = R[String(d.strategy)];
          return [{ kind: "result", label: "Recommended", value: rec, work: why }, { kind: "code", code }];
        },
      },
      {
        id: "params",
        title: "How many parameters train?",
        blurb: "ResNet-50: ~23.5 M backbone parameters; 2,048-d features into the head.",
        controls: [
          { kind: "range", id: "classes", label: "Classes", min: 2, max: 1000, default: 5 },
          { kind: "select", id: "unfrozen", label: "Unfrozen", default: "all", options: [{ value: "head", label: "Head only (linear probe)" }, { value: "layer4", label: "Head + layer4 (~15 M)" }, { value: "all", label: "Everything" }] },
        ],
        derive: (v) => {
          const head = 2048 * n(v.classes) + n(v.classes), bb = 23508032, l4 = 14964736;
          const trainable = head + (v.unfrozen === "layer4" ? l4 : v.unfrozen === "all" ? bb : 0);
          return { trainable, frozen: bb + head - trainable, share: trainable / (bb + head) };
        },
        view: (_, d) => [{ kind: "stats", items: [{ label: "Trainable", value: fmt(n(d.trainable)), tone: "accent" }, { label: "Frozen", value: fmt(n(d.frozen)) }, { label: "% trainable", value: `${(100 * n(d.share)).toFixed(2)}%` }] }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-probe", prompt: "A linear probe on 2,048-d features for 10 classes (with bias). Trainable parameters?", answer: 20490, tolerance: 0, explain: "2,048 × 10 weights + 10 biases = 20,490." },
      { kind: "goal", id: "g-xray", prompt: "Pick the strategy for 800 chest X-rays.", hint: "Small and different from ImageNet.", check: (v) => v.size === "small" && v.sim === "diff" },
      { kind: "goal", id: "g-tiny", prompt: "Train fewer than 0.1% of the parameters.", hint: "Head only, few classes.", check: (_, d) => n(d.share) < 0.001 },
      { kind: "explain", id: "e-tl", prompt: "What is catastrophic forgetting, and when should you freeze the backbone versus fine-tune everything?", keywords: ["catastrophic forgetting", "large learning rate", "overwrite", "pretrained features", "freeze", "small dataset", "similar", "fine-tune", "discriminative", "unfreeze"], idealAnswer: "Catastrophic forgetting is when large, noisy gradients from the new task overwrite the useful general features learned in pretraining. With little data similar to ImageNet, freeze the backbone and train only a new head (a linear probe). With lots of data, or a domain that differs, fine-tune — gently: small learning rates, smaller for early layers (discriminative LRs), unfreezing from the top down." },
    ],
    daily: (r, date) => {
      const d = r.pick([512, 768, 1024, 2048]), c = r.int(4, 25);
      return { title: `Linear probe · ${date}`, question: `A frozen backbone outputs <b>${d}</b>-d features into <code>nn.Linear(${d}, ${c})</code> with bias. How many trainable parameters?`, answer: d * c + c, tolerance: 0, hint: "Weights + biases.", explanation: `${d} × ${c} + ${c} = ${fmt(d * c + c)}.` };
    },
  },

  "object-detection": {
    intro: "Run Non-Maximum Suppression by hand on six detections. Change the thresholds and watch boxes survive or get suppressed — with the full step-by-step log.",
    sections: [
      {
        id: "nms",
        title: "Run NMS yourself",
        controls: [
          { kind: "range", id: "iouTh", label: "IoU threshold", min: 0.1, max: 0.9, step: 0.05, default: 0.5, format: (x) => x.toFixed(2) },
          { kind: "range", id: "confTh", label: "Confidence threshold", min: 0, max: 0.9, step: 0.05, default: 0.1, format: (x) => x.toFixed(2) },
        ],
        derive: (v) => {
          const r = nms(n(v.iouTh), n(v.confTh));
          return { kept: r.kept, keptBoxes: Object.entries(r.state).filter(([, s]) => s === "keep").map(([k]) => k).sort().join("") };
        },
        Visual: NmsCanvas,
        view: (v) => {
          const r = nms(n(v.iouTh), n(v.confTh));
          return [
            { kind: "table", title: "Step-by-step", head: ["#", "NMS step"], rows: r.log.map((l, i) => [i + 1, l]) },
            { kind: "table", title: "Pairwise IoU (same class highlighted)", head: ["", ...BOXES.map((b) => b.n)], rows: BOXES.map((a) => [a.n, ...BOXES.map((b) => (a === b ? "—" : iou(a.b, b.b).toFixed(2)))]) },
          ];
        },
      },
    ],
    tasks: [
      { kind: "predict", id: "p-iou", prompt: "Box A = (0, 0, 10, 10), Box B = (5, 0, 15, 10). IoU? (2 dp)", answer: 0.33, tolerance: 0.01, explain: "Overlap 5 × 10 = 50; union 100 + 100 − 50 = 150; IoU = 1/3." },
      { kind: "goal", id: "g-one-car", prompt: "End with exactly one car box and one person box (and no dog).", hint: "Lower the IoU threshold to suppress more; raise confidence to drop the dog.", check: (_, d) => d.keptBoxes === "AD" },
      { kind: "goal", id: "g-dupes", prompt: "Make NMS keep duplicate car boxes.", hint: "A high IoU threshold suppresses less.", check: (_, d) => ["A", "B", "C"].filter((b) => String(d.keptBoxes).includes(b)).length >= 2 },
      { kind: "explain", id: "e-nms", prompt: "Define IoU and explain NMS step by step.", keywords: ["intersection", "union", "overlap", "sort", "confidence", "keep", "highest", "suppress", "threshold", "repeat", "per class"], idealAnswer: "IoU is the area of overlap between two boxes divided by the area of their union: 1 means identical, 0 no overlap. Detectors fire many overlapping boxes per object, so NMS sorts boxes by confidence (after dropping low-confidence ones), keeps the highest, deletes every remaining box of the same class whose IoU with it exceeds the threshold, and repeats with the next highest until none remain." },
    ],
    daily: (r, date) => {
      const w = r.int(10, 20, 2), s = r.int(2, 8, 2), inter = (w - s) * w, uni = 2 * w * w - inter, v = Math.round((inter / uni) * 100) / 100;
      return { title: `Shifted-box IoU · ${date}`, question: `Box A = <code>(0, 0, ${w}, ${w})</code>, Box B = <code>(${s}, 0, ${w + s}, ${w})</code>. IoU? (2 dp)`, answer: v, tolerance: 0.015, hint: `Overlap width = ${w} − ${s}.`, explanation: `Intersection ${inter}, union ${uni}, IoU = ${v}.` };
    },
  },

  segmentation: {
    intro: "Paint a segmentation mask against a ground truth and watch IoU and Dice respond to every brush stroke — and confirm the identity linking them.",
    sections: [
      {
        id: "paint",
        title: "Paint your prediction",
        controls: [],
        Visual: MaskPainter,
        view: (_, d) => [
          { kind: "stats", items: [{ label: "TP", value: n(d.tp) }, { label: "FP", value: n(d.fp), tone: "bad" }, { label: "FN", value: n(d.fn), tone: "warn" }, { label: "IoU", value: n(d.iou).toFixed(3), tone: "accent" }, { label: "Dice", value: n(d.dice).toFixed(3), tone: "accent" }] },
          { kind: "result", label: "Check the identity", value: `2·${n(d.iou).toFixed(3)} / (1 + ${n(d.iou).toFixed(3)}) = ${((2 * n(d.iou)) / (1 + n(d.iou))).toFixed(3)}`, work: "Dice = 2·IoU / (1 + IoU) — always ≥ IoU" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-dice", prompt: "A mask has IoU = 0.60. What's its Dice coefficient? (2 dp)", answer: 0.75, tolerance: 0.01, explain: "2 × 0.6 / 1.6 = 0.75." },
      { kind: "goal", id: "g-80", prompt: "Paint a mask with IoU ≥ 0.80.", hint: "Cover the dashed region; don't paint outside.", check: (_, d) => n(d.iou) >= 0.8 },
      { kind: "goal", id: "g-gap", prompt: "Make Dice exceed IoU by more than 0.15.", hint: "The gap is largest at middling overlap.", check: (_, d) => n(d.dice) - n(d.iou) > 0.15 },
      { kind: "explain", id: "e-unet", prompt: "Why are skip connections essential in U-Net, and how do IoU and Dice differ?", keywords: ["encoder", "decoder", "downsample", "what", "where", "skip connections", "high-resolution", "boundaries", "dice", "iou", "overlap"], idealAnswer: "U-Net's encoder repeatedly convolves and pools, so features become semantic — it knows what is there — but spatial detail is lost. The decoder upsamples back, and skip connections copy high-resolution encoder features across and concatenate them, restoring precise boundaries; without them masks come out blurry. IoU is overlap over union; Dice is 2·overlap over the total size of both masks, equal to 2·IoU/(1 + IoU), so it's always at least as high and is popular in medical imaging." },
    ],
    daily: (r, date) => {
      const i = r.int(35, 85, 5) / 100, d = Math.round(((2 * i) / (1 + i)) * 100) / 100;
      return { title: `IoU → Dice · ${date}`, question: `A segmentation mask achieves <b>IoU = ${i.toFixed(2)}</b>. What's its <b>Dice</b>? (2 dp)`, answer: d, tolerance: 0.015, hint: "Dice = 2·IoU / (1 + IoU).", explanation: `2 × ${i} / ${(1 + i).toFixed(2)} = ${d}.` };
    },
  },

  "vits-multimodal": {
    intro: "Count the tokens a Vision Transformer actually processes and what attention costs, then turn CLIP's similarities into zero-shot class probabilities.",
    sections: [
      {
        id: "tokens",
        title: "Patches & tokens",
        controls: [
          { kind: "number", id: "img", label: "Image size (H = W)", default: 224, min: 16 },
          { kind: "select", id: "patch", label: "Patch size", default: "16", options: ["8", "14", "16", "32"].map((p) => ({ value: p, label: `${p}×${p}` })) },
          { kind: "number", id: "dim", label: "Embedding dim D", default: 768, min: 1 },
        ],
        derive: (v) => {
          const g = Math.floor(n(v.img) / n(v.patch)), N = g * g;
          return { grid: g, patches: N, seqLen: N + 1, attnCells: (N + 1) ** 2, projParams: n(v.patch) ** 2 * 3 * n(v.dim) + n(v.dim) };
        },
        view: (_, d) => [{ kind: "stats", items: [{ label: "Grid", value: `${n(d.grid)}×${n(d.grid)}` }, { label: "Patches", value: n(d.patches) }, { label: "Sequence (+[CLS])", value: n(d.seqLen), tone: "accent" }, { label: "Attention matrix", value: fmt(n(d.attnCells)) }, { label: "Patch projection params", value: fmt(n(d.projParams)) }] }],
      },
      {
        id: "clip",
        title: "CLIP zero-shot",
        controls: [
          { kind: "range", id: "dog", label: 'cos(image, "a photo of a dog")', min: -0.2, max: 0.5, step: 0.01, default: 0.31, format: (x) => x.toFixed(2) },
          { kind: "range", id: "cat", label: 'cos(image, "a photo of a cat")', min: -0.2, max: 0.5, step: 0.01, default: 0.26, format: (x) => x.toFixed(2) },
          { kind: "range", id: "car", label: 'cos(image, "a photo of a car")', min: -0.2, max: 0.5, step: 0.01, default: 0.12, format: (x) => x.toFixed(2) },
          { kind: "range", id: "scale", label: "Logit scale (1 / temperature)", min: 1, max: 100, default: 100 },
        ],
        derive: (v) => {
          const s = [n(v.dog), n(v.cat), n(v.car)].map((x) => x * n(v.scale));
          const m = Math.max(...s), e = s.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0);
          return { pDog: e[0] / z, pCat: e[1] / z, pCar: e[2] / z };
        },
        view: (_, d) => [{ kind: "bars", items: [["dog", d.pDog], ["cat", d.pCat], ["car", d.pCar]].map(([k, p]) => ({ label: `a photo of a ${k}`, value: n(p), max: 1, display: `${(100 * n(p)).toFixed(1)}%` })) }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-seq", prompt: "A ViT on 224×224 images with 16×16 patches and a [CLS] token. Sequence length?", answer: 197, tolerance: 0, explain: "(224/16)² = 14² = 196 patches + 1 [CLS] = 197." },
      { kind: "goal", id: "g-quad", prompt: "Show attention cost exploding: an attention matrix over 1,000,000 cells.", hint: "Smaller patches or bigger images.", check: (_, d) => n(d.attnCells) > 1_000_000 },
      { kind: "goal", id: "g-temp", prompt: "With the default similarities, make CLIP unsure (top class below 40%).", hint: "Lower the logit scale.", check: (v, d) => n(v.dog) === 0.31 && n(v.cat) === 0.26 && Math.max(n(d.pDog), n(d.pCat), n(d.pCar)) < 0.4 },
      { kind: "explain", id: "e-vit", prompt: "Why do ViTs need more data than CNNs, and how does CLIP classify images it was never trained to classify?", keywords: ["inductive bias", "locality", "learn from data", "pretraining", "contrastive", "image encoder", "text encoder", "prompts", "cosine similarity", "zero-shot"], idealAnswer: "CNNs build in locality and translation equivariance; ViTs treat patches as tokens with weak inductive bias, so they must learn spatial structure from data — with huge pretraining that flexibility wins, on small data CNNs do better. CLIP trains an image and a text encoder contrastively on 400 M image–caption pairs. For zero-shot classification you embed prompts like 'a photo of a dog' for each class, embed the image, and pick the highest cosine similarity (softmax with a learned temperature) — no task-specific training." },
    ],
    daily: (r, date) => {
      const p = r.pick([14, 16, 32]), g = r.int(10, 20, 2), h = p * g;
      return { title: `ViT tokens · ${date}`, question: `A ViT processes <b>${h}×${h}</b> images with <b>${p}×${p}</b> patches and a <code>[CLS]</code> token. Sequence length?`, answer: g * g + 1, tolerance: 0, hint: `(${h}/${p})² + 1`, explanation: `${g}² + 1 = ${g * g + 1}.` };
    },
  },

  "video-tracking": {
    intro: "Two people walk towards each other, stop to talk behind a pillar, then carry on. Track them with motion alone (SORT) and with appearance features (DeepSORT), and catch the ID switch as it happens.",
    sections: [
      {
        id: "track",
        title: "Two people crossing",
        controls: [
          { kind: "range", id: "frame", label: "Frame", min: 0, max: 40, default: 0 },
          { kind: "toggle", id: "occluder", label: "Pillar in the middle (occlusion)", default: true },
          { kind: "toggle", id: "appearance", label: "Appearance features (DeepSORT re-ID)", default: false },
        ],
        derive: (v) => {
          const s = kalmanRun(n(v.frame), Boolean(v.occluder), Boolean(v.appearance));
          return { idSwitch: s.switched, visible: s.visible };
        },
        Visual: KalmanCanvas,
        view: (v, d) => {
          const s = kalmanRun(n(v.frame), Boolean(v.occluder), Boolean(v.appearance));
          return [
            ...(s.cost.length ? [{ kind: "table" as const, title: "Cost matrix this frame (lower = better match)", head: ["track", ...s.cost[0].map((_, j) => `det ${j + 1}`)], rows: s.cost.map((r, i) => [`ID ${i + 1}`, ...r.map((c) => c.toFixed(2))]) }] : []),
            { kind: "note", text: d.idSwitch ? "**ID switch!** While they stood behind the pillar, SORT kept coasting their boxes at walking speed. When they reappeared nothing overlapped, so they were handed **new IDs**." : n(v.frame) > 22 ? "IDs preserved through the crossing." : n(d.visible) < 2 ? "Someone is hidden: their track coasts on the Kalman prediction." : "Scrub or play to frame ~20, where they cross.", tone: d.idSwitch ? "bad" : "neutral" },
          ];
        },
      },
    ],
    tasks: [
      { kind: "predict", id: "p-kalman", prompt: "An object at x = 120 px moves at 12 px/frame. Where does a constant-velocity Kalman filter predict it after 5 frames?", answer: 180, tolerance: 0, unit: "px", explain: "x̂ = 120 + 12 × 5 = 180 px. The update step then corrects this with the new detection." },
      { kind: "goal", id: "g-switch", prompt: "Reproduce an ID switch.", hint: "Occluder on, appearance off, play past the crossing.", check: (_, d) => d.idSwitch === true },
      { kind: "goal", id: "g-fix", prompt: "Get to frame 40 with the occluder on and no ID switch.", hint: "Give the tracker appearance features.", check: (v, d) => n(v.frame) === 40 && Boolean(v.occluder) && d.idSwitch === false },
      { kind: "explain", id: "e-sort", prompt: "What does the Hungarian algorithm do in SORT, and why did DeepSORT add a re-identification network?", keywords: ["kalman", "predict", "cost matrix", "1 - iou", "hungarian", "optimal", "one-to-one", "assignment", "occlusion", "id switch", "appearance", "embedding"], idealAnswer: "SORT predicts each track's next box with a constant-velocity Kalman filter, builds a cost matrix such as 1 − IoU between predictions and new detections, and the Hungarian algorithm finds the optimal one-to-one assignment minimising total cost. With motion and IoU alone, crossing or occluded objects get swapped — ID switches. DeepSORT adds an appearance embedding from a re-ID CNN to the cost, so the same person is recognised after an occlusion." },
    ],
    daily: (r, date) => {
      const x0 = r.int(40, 200, 10), vx = r.int(6, 18, 2), dt = r.int(3, 8);
      return { title: `Kalman step · ${date}`, question: `A track is at <b>x = ${x0} px</b> moving <b>${vx} px/frame</b>. Predicted x after <b>${dt} frames</b>?`, answer: x0 + vx * dt, tolerance: 0, hint: "x + v·t", explanation: `${x0} + ${vx} × ${dt} = ${x0 + vx * dt} px.` };
    },
  },

  "deployment-responsible": {
    intro: "See what quantisation does to model size, then quantise a single weight to INT8 by hand — scale, zero-point and the rounding error you pay.",
    sections: [
      {
        id: "size",
        title: "Model size by precision",
        controls: [{ kind: "range", id: "params", label: "Parameters", min: 1, max: 300, default: 25, unit: "M" }],
        derive: (v) => ({ fp32Mb: n(v.params) * 4, int8Mb: n(v.params) }),
        view: (v) => [{ kind: "bars", items: [["FP32", 4], ["FP16 / BF16", 2], ["INT8", 1], ["INT4", 0.5]].map(([k, b]) => ({ label: String(k), value: n(v.params) * Number(b), max: n(v.params) * 4, display: `${fmt(n(v.params) * Number(b))} MB` })) }, { kind: "note", text: "Weights only — activations, the runtime and the batch add memory at inference." }],
      },
      {
        id: "quant",
        title: "Quantise one weight",
        controls: [
          { kind: "number", id: "tmin", label: "Tensor min", default: -1.2, step: 0.1 },
          { kind: "number", id: "tmax", label: "Tensor max", default: 0.8, step: 0.1 },
          { kind: "range", id: "w", label: "Weight x", min: -1.2, max: 0.8, step: 0.001, default: 0.3, format: (x) => x.toFixed(3) },
        ],
        derive: (v) => {
          const mn = n(v.tmin), mx = n(v.tmax);
          if (mx <= mn) return { q: NaN, err: NaN, scale: 0, zeroPoint: 0, dequantised: NaN };
          const s = (mx - mn) / 255, z = Math.round(-mn / s), x = Math.min(mx, Math.max(mn, n(v.w)));
          const q = Math.min(255, Math.max(0, Math.round(x / s) + z)), dq = (q - z) * s;
          return { scale: s, zeroPoint: z, q, dequantised: dq, err: Math.abs(dq - x) };
        },
        view: (v, d) => [{ kind: "result", label: "Stored as", value: Number.isNaN(n(d.q)) ? "max must exceed min" : `q = ${d.q} → ${n(d.dequantised).toFixed(4)}`, work: `scale s = (${n(v.tmax)} − ${n(v.tmin)})/255 = ${n(d.scale).toFixed(5)}, zero-point z = ${d.zeroPoint}\nq = round(x/s) + z · error = ${n(d.err).toExponential(2)}` }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-fp16", prompt: "A 60 M-parameter model in FP16 (2 bytes/param). How many MB of weights?", answer: 120, tolerance: 0, unit: "MB", explain: "60 M × 2 bytes = 120 MB." },
      { kind: "goal", id: "g-wide", prompt: "Make the quantisation error larger than 0.004 by widening the tensor range.", hint: "A wider [min, max] means a coarser step size.", check: (_, d) => n(d.err) > 0.004 },
      { kind: "goal", id: "g-zero", prompt: "Find a weight that's stored exactly at the zero-point.", hint: "Which real value maps to z?", check: (_, d) => n(d.q) === n(d.zeroPoint) },
      { kind: "explain", id: "e-gradcam", prompt: "How does Grad-CAM explain a CNN's prediction, and how should you audit a vision model for bias?", keywords: ["gradient", "class score", "last conv", "feature maps", "weights", "relu", "heatmap", "disaggregated", "subgroup", "model card", "robustness"], idealAnswer: "Grad-CAM takes the gradient of the class score with respect to the last convolutional feature maps, averages it per channel into weights, sums the weighted maps and applies ReLU — a heatmap of the regions that drove the prediction. To audit for bias, report metrics disaggregated by subgroup (as Gender Shades did, finding 35% error on darker-skinned women vs <1% on lighter-skinned men), document limitations in a model card, and test robustness to perturbations." },
    ],
    daily: (r, date) => {
      const p = r.int(15, 120, 5);
      return { title: `FP16 footprint · ${date}`, question: `A vision model has <b>${p} million</b> parameters. How many MB of weights in <b>FP16</b> (2 bytes each)?`, answer: p * 2, tolerance: 0.5, hint: "Params × 2 bytes.", explanation: `${p} × 2 = ${p * 2} MB.` };
    },
  },
};
