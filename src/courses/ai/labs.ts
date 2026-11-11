/** CSC3119 — guided labs built around the Uganda Regional Referral Hospital stroke-risk service. */
import { logit, phi, phiInv, psi, sigmoid } from "@/lib/lab/math";
import type { LabDef } from "@/lib/lab/types";
import { fmt } from "@/lib/utils";

const n = (v: unknown) => Number(v) || 0;
const pct = (x: number, dp = 1) => `${(100 * x).toFixed(dp)}%`;

// Score model for the capstone: log-odds of stroke patients ~ N(0.62, 1.6), others ~ N(−2.92, 1.6).
// Fitted so recall is ≈65% at threshold 0.50 and ≈88% at 0.22, as in the course material.
const POS = { mu: 0.616, sd: 1.6 };
const NEG = { mu: -2.92, sd: 1.6 };
const tpr = (t: number) => 1 - phi((logit(t) - POS.mu) / POS.sd);
const fpr = (t: number) => 1 - phi((logit(t) - NEG.mu) / NEG.sd);

export const labs: Record<string, LabDef> = {
  "data-preparation": {
    intro:
      "A 5%-positive clinical dataset is where intuition about accuracy breaks. Build the confusion matrix for three models, then see what scaler leakage does to the number you'd report versus the number patients get.",
    sections: [
      {
        id: "imbalance",
        title: "The accuracy paradox",
        controls: [
          { kind: "range", id: "cohort", label: "Patients screened", min: 1000, max: 8000, step: 500, default: 3000 },
          { kind: "range", id: "prev", label: "Stroke prevalence", min: 2, max: 20, default: 5, unit: "%" },
          {
            kind: "select",
            id: "model",
            label: "Model",
            default: "plain",
            options: [
              { value: "always", label: "Always predict 'no stroke'" },
              { value: "plain", label: "XGBoost, no rebalancing" },
              { value: "smote", label: "XGBoost + SMOTE on train only" },
            ],
          },
        ],
        derive: (v) => {
          const N = n(v.cohort), P = Math.round((N * n(v.prev)) / 100), Neg = N - P;
          const [rec, spec] = v.model === "always" ? [0, 1] : v.model === "plain" ? [0.44, 0.985] : [0.86, 0.86];
          const TP = Math.round(P * rec), FN = P - TP, TN = Math.round(Neg * spec), FP = Neg - TN;
          const precision = TP + FP ? TP / (TP + FP) : 0;
          const f2 = precision + rec ? (5 * precision * rec) / (4 * precision + rec) : 0;
          return { TP, FN, FP, TN, accuracy: (TP + TN) / N, recall: rec, precision, f2, missed: FN };
        },
        view: (_, d) => [
          { kind: "table", title: "Confusion matrix", head: ["", "Predicted stroke", "Predicted no stroke"], rows: [["Actual stroke", d.TP as number, d.FN as number], ["Actual no stroke", d.FP as number, d.TN as number]], highlight: [[0, 2]] },
          { kind: "stats", items: [{ label: "Accuracy", value: pct(n(d.accuracy)) }, { label: "Recall", value: pct(n(d.recall)), tone: n(d.recall) < 0.6 ? "bad" : "good" }, { label: "Precision", value: pct(n(d.precision)) }, { label: "F2", value: n(d.f2).toFixed(3) }, { label: "Strokes missed", value: n(d.missed), tone: n(d.missed) ? "bad" : "good" }] },
          { kind: "note", text: n(d.recall) === 0 ? `**${pct(n(d.accuracy))} accuracy and every stroke patient sent home.** Accuracy is the wrong metric here.` : "Recall (sensitivity) is what triage cares about: how many stroke patients we catch.", tone: n(d.recall) === 0 ? "bad" : "neutral" },
        ],
        code: `pipeline = Pipeline([
  ("prep", ColumnTransformer([("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                                                ("scale", StandardScaler())]), ["age", "avg_glucose_level", "bmi"]),
                              ("cat", OneHotEncoder(handle_unknown="ignore"), ["work_type", "smoking_status"])])),
  ("model", XGBClassifier(scale_pos_weight=18))])
pipeline.fit(X_train, y_train)          # statistics learned from TRAIN only`,
      },
      {
        id: "leakage",
        title: "Leakage: the number you report vs the number you get",
        controls: [{ kind: "toggle", id: "leak", label: "Fit the scaler/imputer on the FULL dataset before splitting", default: false }],
        derive: (v) => ({ reportedRecall: v.leak ? 0.94 : 0.86, productionRecall: 0.86 - (v.leak ? 0.07 : 0) }),
        view: (v, d) => [
          { kind: "bars", items: [{ label: "Validation recall (what you report)", value: n(d.reportedRecall), max: 1, display: pct(n(d.reportedRecall)), tone: v.leak ? "warn" : "good" }, { label: "Recall on new patients", value: n(d.productionRecall), max: 1, display: pct(n(d.productionRecall)), tone: v.leak ? "bad" : "good" }] },
          { kind: "note", text: v.leak ? "Test-set statistics leaked into training: the validation score is optimistic and the model disappoints at triage." : "Preprocessing fitted on X_train only — validation is an honest preview of production.", tone: v.leak ? "bad" : "good" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-acc", prompt: "Prevalence is 5%. What accuracy does 'always predict no stroke' get?", answer: 95, tolerance: 0.5, unit: "%", explain: "It is right on all 95% of non-stroke patients — and misses 100% of strokes. High accuracy, useless model." },
      { kind: "goal", id: "g-paradox", prompt: "Show a model with ≥ 95% accuracy that misses every stroke.", hint: "Pick the trivial model.", check: (_, d) => n(d.accuracy) >= 0.95 && n(d.recall) === 0 },
      { kind: "goal", id: "g-recall", prompt: "Get recall above 80% on 3,000 patients at 5% prevalence.", hint: "Rebalance the training data.", check: (v, d) => n(d.recall) > 0.8 && n(v.cohort) === 3000 && n(v.prev) === 5 },
      { kind: "goal", id: "g-leak", prompt: "Make the reported recall look better than reality.", hint: "Introduce leakage.", check: (v) => v.leak === true },
      { kind: "explain", id: "e-leak", prompt: "Why does accuracy fail on the stroke dataset, and why must scaling and SMOTE only be fitted on the training split?", keywords: ["imbalance", "accuracy", "recall", "false negative", "leakage", "fit", "train", "test", "smote", "pipeline"], idealAnswer: "With ~5% prevalence, predicting 'no stroke' for everyone scores ~95% accuracy while missing every stroke, so we judge by recall, precision and F2/PR-AUC. Fitting scalers, imputers or SMOTE on the full dataset leaks test-set information into training, inflating validation scores that collapse on new patients. Wrapping preprocessing in a Pipeline fitted on X_train only — and oversampling only the training fold — keeps evaluation honest." },
    ],
    daily: (r, date) => {
      const N = r.int(2000, 6000, 500), p = r.int(4, 8), rec = r.int(75, 92);
      const total = Math.round(N * (p / 100)), caught = Math.round(total * (rec / 100));
      return { title: `Missed strokes · ${date}`, question: `A cohort of <b>${fmt(N)} patients</b> has <b>${p}% stroke prevalence</b>. The model's recall is <b>${rec}%</b>. How many stroke patients are missed (false negatives)?`, answer: total - caught, tolerance: 0, hint: `Strokes = ${N} × ${p}%. Caught = strokes × ${rec}%.`, explanation: `Strokes = ${total}. Caught = round(${total} × ${rec / 100}) = ${caught}. Missed = ${total - caught}.` };
    },
  },

  "model-persistence": {
    intro: "Save the same Random Forest with pickle and joblib, watch size and load time move, and see what happens in the API when you saved only the classifier instead of the whole pipeline.",
    sections: [
      {
        id: "size",
        title: "pickle vs joblib",
        controls: [
          { kind: "range", id: "trees", label: "Trees", min: 20, max: 600, step: 20, default: 150 },
          { kind: "range", id: "depth", label: "Max depth", min: 4, max: 20, step: 2, default: 12 },
          { kind: "select", id: "format", label: "Format", default: "joblib", options: [{ value: "pickle", label: "pickle" }, { value: "joblib", label: "joblib (zlib)" }, { value: "joblib_lz4", label: "joblib (lz4)" }] },
          { kind: "range", id: "compress", label: "compress=", min: 0, max: 9, default: 3 },
        ],
        derive: (v) => {
          const rawMb = (n(v.trees) * 2 ** Math.min(12, n(v.depth)) * 32) / 1024 ** 2;
          const ratio = v.format === "pickle" ? 0.95 : v.format === "joblib" ? 1.2 + n(v.compress) * 0.35 : 1.4 + n(v.compress) * 0.4;
          const fileMb = Math.max(0.4, rawMb / ratio);
          const saveMs = rawMb * 8 * (v.format === "pickle" ? 1.8 : v.format === "joblib" ? 1.1 + n(v.compress) * 0.15 : 0.8 + n(v.compress) * 0.08);
          const loadMs = saveMs * (v.format === "pickle" ? 0.85 : 0.35);
          return { rawMb, fileMb, ratio, loadMs };
        },
        view: (v, d) => [
          { kind: "result", label: "Artifact on disk", value: `${n(d.fileMb).toFixed(1)} MB`, work: `${n(d.rawMb).toFixed(1)} MB of tree arrays ÷ ${n(d.ratio).toFixed(1)}× compression\nload ≈ ${Math.round(n(d.loadMs))} ms${v.format === "pickle" ? " · full copy in RAM per worker" : " · arrays can be memory-mapped"}` },
          { kind: "note", text: "pickle and joblib both run code on load (`__reduce__`). Never load a model file you didn't produce — use checksums or a signed model registry.", tone: "warn" },
        ],
        code: `joblib.dump(pipeline, "models/stroke_pipeline.joblib", compress=3)
pipeline = joblib.load("models/stroke_pipeline.joblib")   # only from trusted, checksummed sources`,
      },
      {
        id: "packaging",
        title: "What did you save?",
        controls: [{ kind: "select", id: "saved", label: "Saved artifact", default: "classifier", options: [{ value: "classifier", label: "Only the XGBClassifier" }, { value: "pipeline", label: "Full Pipeline (imputer + scaler + encoder + model)" }] }],
        derive: (v) => ({ apiWorks: v.saved === "pipeline" }),
        view: (v) => [
          {
            kind: "code",
            code:
              v.saved === "pipeline"
                ? `POST /predict {"age": 67, "avg_glucose_level": 228, "bmi": null, "work_type": "Private"}
→ 200 {"stroke_probability": 0.41}     # imputation, scaling and one-hot all happen inside`
                : `POST /predict {"age": 67, "avg_glucose_level": 228, "bmi": null, "work_type": "Private"}
→ 500 ValueError: could not convert string to float: 'Private'
   (and even numeric-only rows would be unscaled → garbage probabilities)`,
          },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-comp", prompt: "300 trees × 0.4 MB each = 120 MB of arrays. Saved with a 3× compression ratio, how big is the file?", answer: 40, tolerance: 0.5, unit: "MB", explain: "120 MB ÷ 3 = 40 MB." },
      { kind: "goal", id: "g-small", prompt: "Get the artifact under 10 MB with at least 300 trees.", hint: "Shallower trees and stronger compression.", check: (v, d) => n(d.fileMb) < 10 && n(v.trees) >= 300 },
      { kind: "goal", id: "g-pipeline", prompt: "Fix the API by saving the right artifact.", hint: "The preprocessing has to travel with the model.", check: (_, d) => d.apiWorks === true },
      { kind: "explain", id: "e-persist", prompt: "Why save the whole pipeline rather than the classifier, and what's the security risk of unpickling?", keywords: ["pipeline", "preprocessing", "scaler", "encoder", "skew", "raw", "arbitrary code", "__reduce__", "trusted", "checksum"], idealAnswer: "The model was trained on imputed, scaled, one-hot-encoded features; if only the classifier is saved, the API receives raw JSON and either crashes or silently predicts garbage — training-serving skew. Saving the whole Pipeline guarantees identical preprocessing. Pickle and joblib can execute arbitrary code on load via __reduce__, so only load artifacts from trusted sources verified by checksums or a signed registry." },
    ],
    daily: (r, date) => {
      const trees = r.int(100, 400, 50), mb = r.int(20, 60, 5) / 100, raw = Math.round(trees * mb * 10) / 10, ratio = r.pick([2, 3, 4]);
      return { title: `Joblib compression · ${date}`, question: `An ensemble of <b>${trees} trees</b> averages <b>${mb} MB</b> per tree (<b>${raw} MB</b> total). With a <b>${ratio}×</b> compression ratio, what's the file size in MB?`, answer: Math.round((raw / ratio) * 100) / 100, tolerance: 0.05, hint: "Divide by the compression ratio.", explanation: `${raw} ÷ ${ratio} = ${(raw / ratio).toFixed(2)} MB.` };
    },
  },

  "fastapi-serving": {
    intro: "Send good and bad patient payloads to /predict and see Pydantic reject them at the door. Then load the service and watch latency explode as workers saturate — queueing theory, not magic.",
    sections: [
      {
        id: "validation",
        title: "Pydantic at the boundary",
        controls: [{ kind: "select", id: "payload", label: "Request body", default: "valid", options: [{ value: "valid", label: "Valid patient (age 64, glucose 140, BMI 28.4)" }, { value: "age", label: "age = −12" }, { value: "bmi", label: 'bmi = "obese"' }, { value: "missing", label: "avg_glucose_level missing" }, { value: "enum", label: 'smoking_status = "sometimes"' }] }],
        derive: (v) => ({ status: v.payload === "valid" ? 200 : 422 }),
        view: (v) => {
          const detail: Record<string, string> = {
            age: `{"loc": ["body","age"], "msg": "Input should be greater than or equal to 0", "type": "greater_than_equal"}`,
            bmi: `{"loc": ["body","bmi"], "msg": "Input should be a valid number", "type": "float_parsing"}`,
            missing: `{"loc": ["body","avg_glucose_level"], "msg": "Field required", "type": "missing"}`,
            enum: `{"loc": ["body","smoking_status"], "msg": "Input should be 'never', 'formerly' or 'smokes'", "type": "literal_error"}`,
          };
          return [
            { kind: "result", label: "Response", value: v.payload === "valid" ? "200 OK" : "422 Unprocessable Entity", tone: v.payload === "valid" ? "good" : "bad", work: v.payload === "valid" ? "validated → pipeline.predict_proba → JSON" : "rejected before any model code ran" },
            { kind: "code", code: v.payload === "valid" ? `{"stroke_probability": 0.384, "risk_tier": "HIGH", "action": "Refer to chronic care clinic"}` : `{"detail": [${detail[String(v.payload)]}]}` },
          ];
        },
        code: `class Patient(BaseModel):
    age: float = Field(ge=0, le=120)
    avg_glucose_level: float = Field(gt=0)
    bmi: float | None = Field(default=None, ge=10, le=80)
    smoking_status: Literal["never", "formerly", "smokes"]`,
      },
      {
        id: "load",
        title: "Throughput, latency & Little's Law",
        controls: [
          { kind: "range", id: "qps", label: "Arrival rate λ", min: 10, max: 400, step: 10, default: 60, unit: "req/s" },
          { kind: "range", id: "workers", label: "Uvicorn workers", min: 1, max: 16, default: 4 },
          { kind: "number", id: "serviceMs", label: "Inference time per request", default: 20, min: 1, unit: "ms" },
        ],
        derive: (v) => {
          const capacity = (n(v.workers) * 1000) / Math.max(1, n(v.serviceMs));
          const rho = n(v.qps) / capacity;
          const latency = rho < 1 ? n(v.serviceMs) / (1 - rho) : Infinity; // M/M/1-style approximation
          return { capacity, utilisation: rho, latencyMs: latency, inFlight: rho < 1 ? (n(v.qps) * latency) / 1000 : Infinity };
        },
        view: (_, d) => {
          const sat = !Number.isFinite(n(d.latencyMs)) || n(d.utilisation) >= 1;
          return [
            { kind: "stats", items: [{ label: "Capacity", value: `${Math.round(n(d.capacity))} req/s` }, { label: "Utilisation ρ", value: sat ? "≥ 100%" : pct(n(d.utilisation), 0), tone: n(d.utilisation) > 0.85 ? "bad" : n(d.utilisation) > 0.7 ? "warn" : "good" }, { label: "Mean latency", value: sat ? "∞ (queue grows)" : `${n(d.latencyMs).toFixed(1)} ms`, tone: sat ? "bad" : "neutral" }, { label: "Requests in flight (L = λW)", value: sat ? "∞" : n(d.inFlight).toFixed(2) }] },
            { kind: "note", text: sat ? "Arrivals exceed capacity: the queue grows without bound. Add workers or make inference faster." : "Latency ≈ service time / (1 − ρ): it stays flat until ρ ≈ 70%, then shoots up.", tone: sat ? "bad" : "neutral" },
          ];
        },
      },
    ],
    tasks: [
      { kind: "predict", id: "p-little", prompt: "An endpoint handles 120 req/s with 25 ms average latency. How many requests are in flight on average?", answer: 3, tolerance: 0.01, explain: "Little's Law: L = λ × W = 120 × 0.025 s = 3." },
      { kind: "goal", id: "g-422", prompt: "Trigger a 422 caused by a value outside the allowed range.", hint: "Negative ages aren't allowed.", check: (v) => v.payload === "age" },
      { kind: "goal", id: "g-sat", prompt: "Saturate the service.", hint: "Push λ past workers × 1000 / service time.", check: (_, d) => n(d.utilisation) >= 1 },
      { kind: "goal", id: "g-slo", prompt: "Serve 300 req/s with mean latency under 30 ms.", hint: "You'll need enough workers to keep ρ low.", check: (v, d) => n(v.qps) >= 300 && n(d.latencyMs) < 30 },
      { kind: "explain", id: "e-api", prompt: "How does Pydantic protect the model code, and how would you scale CPU-bound inference in FastAPI?", keywords: ["pydantic", "validation", "422", "boundary", "type", "range", "async", "cpu-bound", "workers", "threadpool", "uvicorn"], idealAnswer: "Pydantic validates every field at the API boundary — types, ranges like age 0–120, allowed categories — and returns HTTP 422 with a precise error before any model code runs, so bad payloads can't crash or silently corrupt predictions. Async helps I/O-bound work like logging, but inference is CPU-bound and blocks the event loop, so run it in a threadpool or scale out with multiple Uvicorn workers; keep utilisation below ~70% because latency grows like 1/(1−ρ)." },
    ],
    daily: (r, date) => {
      const qps = r.int(40, 200, 20), lat = r.int(15, 60, 5), L = Math.round(qps * lat) / 1000;
      return { title: `Little's Law · ${date}`, question: `A FastAPI endpoint receives <b>${qps} req/s</b> with <b>${lat} ms</b> average latency. How many requests are in flight on average (L = λW)?`, answer: L, tolerance: 0.05, hint: "Convert ms to seconds first.", explanation: `L = ${qps} × ${lat / 1000} = ${L}.` };
    },
  },

  "cloud-sizing": {
    intro: "Pick hardware, region and pricing for the stroke service and for nightly retraining — and feel the difference between what's cheap and what's safe.",
    sections: [
      {
        id: "sizing",
        title: "Hardware, region & price",
        controls: [
          { kind: "select", id: "hw", label: "Instance", default: "cpu2", options: [{ value: "cpu2", label: "2 vCPU CPU ($0.04/h)" }, { value: "cpu8", label: "8 vCPU CPU ($0.16/h)" }, { value: "t4", label: "NVIDIA T4 GPU ($0.60/h)" }, { value: "a100", label: "NVIDIA A100 GPU ($3.20/h)" }] },
          { kind: "select", id: "region", label: "Region", default: "af_south", options: [{ value: "local", label: "On-prem, Kampala" }, { value: "af_south", label: "Cloud, Johannesburg" }, { value: "eu_west", label: "Cloud, Ireland" }] },
          { kind: "select", id: "workload", label: "Workload", default: "serving", options: [{ value: "serving", label: "Real-time triage API (24/7)" }, { value: "training", label: "Nightly retraining (checkpointed)" }] },
          { kind: "toggle", id: "spot", label: "Use Spot / preemptible VMs (≈72% cheaper, can be reclaimed with 2 min notice)", default: false },
        ],
        derive: (v) => {
          const rate = { cpu2: 0.04, cpu8: 0.16, t4: 0.6, a100: 3.2 }[String(v.hw)] ?? 0.04;
          const net = { local: 8, af_south: 42, eu_west: 135 }[String(v.region)] ?? 42;
          const compute = { cpu2: 24, cpu8: 9, t4: 3.2, a100: 1.1 }[String(v.hw)] ?? 24;
          const hours = v.workload === "serving" ? 730 : 4 * 30;
          const monthly = rate * (v.spot ? 0.28 : 1) * hours;
          return { monthlyUsd: monthly, latencyMs: net + compute, risky: v.spot === true && v.workload === "serving" };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Monthly cost", value: `$${n(d.monthlyUsd).toFixed(2)}`, tone: "accent" }, { label: "Latency per request", value: `${n(d.latencyMs).toFixed(1)} ms` }, { label: "Hours billed", value: v.workload === "serving" ? "730 (always on)" : "120 (4 h/night)" }] },
          { kind: "note", text: d.risky ? "Spot for a 24/7 clinical API: a reclaimed VM means triage goes dark. Keep serving on-demand; use Spot for checkpointed training." : v.hw === "a100" && v.workload === "serving" ? "An A100 for a tabular XGBoost model buys ~20 ms you don't need at 80× the price of a CPU." : "Right-size: tabular models run happily on CPUs; GPUs earn their cost on large neural networks.", tone: d.risky ? "bad" : "neutral" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-spot", prompt: "A $2.40/h GPU retrains for 20 hours on Spot at a 75% discount. Total cost?", answer: 12, tolerance: 0.05, unit: "$", explain: "$2.40 × 0.25 = $0.60/h × 20 h = $12." },
      { kind: "goal", id: "g-cheap", prompt: "Run the real-time API for under $35/month with latency under 60 ms — without Spot.", hint: "The smallest CPU, as close to Kampala as you can get.", check: (v, d) => v.workload === "serving" && !v.spot && n(d.monthlyUsd) < 35 && n(d.latencyMs) < 60 },
      { kind: "goal", id: "g-train", prompt: "Set up GPU retraining on Spot.", hint: "Training + a GPU + Spot.", check: (v) => v.workload === "training" && v.spot === true && (v.hw === "t4" || v.hw === "a100") },
      { kind: "explain", id: "e-cloud", prompt: "When do you choose CPU vs GPU, and why is Spot right for training but wrong for the triage API?", keywords: ["cpu", "gpu", "tabular", "neural", "latency", "cost", "spot", "preempt", "reclaimed", "checkpoint", "on-demand"], idealAnswer: "Tabular models like XGBoost are fast and cheap on CPUs; GPUs only pay off for large neural networks and should scale to zero when idle. Spot VMs use spare capacity at 70–90% off but can be reclaimed with about two minutes' notice — fine for checkpointed training that can resume, unacceptable for a 24/7 clinical API that must stay up, which belongs on on-demand instances, ideally in a nearby region for latency." },
    ],
    daily: (r, date) => {
      const od = r.int(18, 48, 2) / 10, disc = r.pick([70, 75, 80]), h = r.int(12, 36, 4);
      const total = Math.round(od * (1 - disc / 100) * h * 100) / 100;
      return { title: `Spot retraining · ${date}`, question: `An on-demand GPU costs <b>$${od.toFixed(2)}/h</b>. Retraining on Spot at a <b>${disc}% discount</b> takes <b>${h} hours</b>. Total cost in USD?`, answer: total, tolerance: 0.1, hint: "Hourly × (1 − discount) × hours.", explanation: `$${od} × ${(100 - disc) / 100} × ${h} = $${total}.` };
    },
  },

  docker: {
    intro: "Build the stroke API image four ways and compare size, rebuild time and attack surface. Small, fast and non-root isn't a style choice — it's what passes a hospital security review.",
    sections: [
      {
        id: "build",
        title: "Dockerfile choices",
        controls: [
          { kind: "select", id: "base", label: "Base image", default: "ubuntu", options: [{ value: "ubuntu", label: "ubuntu:22.04 (~850 MB with Python)" }, { value: "slim", label: "python:3.11-slim (~140 MB)" }, { value: "alpine", label: "python:3.11-alpine (~60 MB, musl)" }] },
          { kind: "toggle", id: "multistage", label: "Multi-stage build (compile in a builder, copy wheels only)", default: false },
          { kind: "toggle", id: "layerOrder", label: "COPY requirements.txt + pip install BEFORE COPY . (layer caching)", default: false },
          { kind: "toggle", id: "nonroot", label: "USER appuser (non-root)", default: false },
        ],
        derive: (v) => {
          const base = { ubuntu: 850, slim: 140, alpine: 60 }[String(v.base)] ?? 850;
          const tools = v.multistage ? 0 : 420;
          const size = base + tools + 45;
          const rebuild = (v.layerOrder ? 18 : 110) + (v.base === "alpine" ? 240 : 0);
          const score = (v.multistage ? 2 : 0) + (v.nonroot ? 2 : 0) + (v.base !== "ubuntu" ? 1 : 0);
          return { imageMb: size, rebuildSec: rebuild, grade: ["F", "D", "C", "B", "A", "A+"][score], compilersShipped: !v.multistage };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Image size", value: `${n(d.imageMb)} MB`, tone: n(d.imageMb) < 300 ? "good" : "bad" }, { label: "Rebuild after a code change", value: `${n(d.rebuildSec)} s`, tone: n(d.rebuildSec) < 60 ? "good" : "warn" }, { label: "Security grade", value: String(d.grade), tone: String(d.grade).startsWith("A") ? "good" : "bad" }] },
          ...(v.base === "alpine" ? [{ kind: "note" as const, text: "Alpine uses musl: NumPy/XGBoost wheels often have to compile from source, so builds get much slower.", tone: "warn" as const }] : []),
          ...(d.compilersShipped ? [{ kind: "note" as const, text: "gcc and build tools are in the production image — extra size and extra attack surface.", tone: "bad" as const }] : []),
        ],
        code: `FROM python:3.11-slim AS builder
COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.11-slim
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && useradd -m appuser
COPY app/ app/
USER appuser
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
      },
    ],
    tasks: [
      { kind: "predict", id: "p-shrink", prompt: "A 1,200 MB image becomes 160 MB after a multi-stage build. By what percentage did it shrink?", answer: 86.7, tolerance: 0.2, unit: "%", explain: "(1,200 − 160) / 1,200 = 86.7%." },
      { kind: "goal", id: "g-small", prompt: "Get the image under 200 MB without using Alpine.", hint: "Slim base + multi-stage.", check: (v, d) => n(d.imageMb) < 200 && v.base !== "alpine" },
      { kind: "goal", id: "g-a", prompt: "Reach security grade A+ with rebuilds under 30 s.", hint: "Every toggle matters, and the base too.", check: (_, d) => d.grade === "A+" && n(d.rebuildSec) < 30 },
      { kind: "explain", id: "e-docker", prompt: "Why use multi-stage builds for Python ML APIs, and why never run the container as root?", keywords: ["multi-stage", "builder", "wheels", "compilers", "slim", "size", "attack surface", "non-root", "privilege", "escalation", "layer cache"], idealAnswer: "A multi-stage build compiles wheels in a heavy builder stage and copies only the results into a slim runtime image, removing gcc and build tools — the image shrinks by ~80% and has far less attack surface. Copying requirements before the code keeps the dependency layer cached so rebuilds take seconds. Running as a non-root user means an exploit (or a malicious pickle) can't modify system files or escalate to the host." },
    ],
    daily: (r, date) => {
      const big = r.int(900, 1400, 50), slim = r.int(130, 180, 10), p = Math.round(((big - slim) / big) * 1000) / 10;
      return { title: `Image shrinkage · ${date}`, question: `A single-stage image is <b>${big} MB</b>. A multi-stage build on <code>python:3.11-slim</code> brings it to <b>${slim} MB</b>. Percentage reduction (1 dp)?`, answer: p, tolerance: 0.2, hint: "(old − new) / old × 100.", explanation: `(${big} − ${slim}) / ${big} = ${p}%.` };
    },
  },

  "canary-routing": {
    intro: "Release model v2 to a slice of real traffic, give it a bug, and watch the error budget decide whether to roll forward or snap back — compared with a Blue/Green switch that hits everyone at once.",
    sections: [
      {
        id: "canary",
        title: "Canary release",
        controls: [
          { kind: "select", id: "strategy", label: "Strategy", default: "canary", options: [{ value: "canary", label: "Canary (gradual)" }, { value: "bluegreen", label: "Blue/Green (switch all at once)" }] },
          { kind: "range", id: "share", label: "Traffic to v2", min: 0, max: 100, step: 5, default: 10, unit: "%" },
          { kind: "range", id: "qps", label: "Total traffic", min: 20, max: 500, step: 20, default: 120, unit: "QPS" },
          { kind: "range", id: "errRate", label: "v2 error rate (bug!)", min: 0, max: 10, step: 0.5, default: 0.5, unit: "%" },
          { kind: "number", id: "budget", label: "Error budget (rollback threshold)", default: 1.5, step: 0.1, unit: "%" },
        ],
        derive: (v) => {
          const share = v.strategy === "bluegreen" ? 100 : n(v.share);
          const v2Qps = (n(v.qps) * share) / 100;
          const errorsPerMin = v2Qps * (n(v.errRate) / 100) * 60;
          const breached = share > 0 && n(v.errRate) > n(v.budget);
          return { v2Qps, errorsPerMin, breached, blastRadius: share };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "v2 traffic", value: `${n(d.v2Qps).toFixed(0)} QPS` }, { label: "Failed requests / min", value: Math.round(n(d.errorsPerMin)), tone: n(d.errorsPerMin) > 0 ? "bad" : "good" }, { label: "Blast radius", value: `${n(d.blastRadius)}% of patients`, tone: n(d.blastRadius) > 25 ? "bad" : "good" }] },
          { kind: "result", label: "Router decision", value: d.breached ? "ROLLBACK → v2 traffic set to 0%" : "HEALTHY → continue rollout", tone: d.breached ? "bad" : "good" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-errors", prompt: "10% of 200 QPS goes to a canary with a 2% error rate. How many errors in 10 minutes?", answer: 240, tolerance: 0, explain: "20 QPS × 600 s = 12,000 requests × 2% = 240 errors." },
      { kind: "goal", id: "g-rollback", prompt: "Trigger an automatic rollback while exposing at most 5% of traffic.", hint: "Small canary, error rate above the budget.", check: (v, d) => d.breached === true && n(d.blastRadius) <= 5 },
      { kind: "goal", id: "g-bg", prompt: "Show why Blue/Green is riskier: same bug, 100% blast radius.", hint: "Switch strategy with a buggy v2.", check: (v, d) => v.strategy === "bluegreen" && n(v.errRate) > n(v.budget) },
      { kind: "explain", id: "e-canary", prompt: "How does a canary reduce risk compared with Blue/Green, and what should trigger an automatic rollback?", keywords: ["canary", "small fraction", "blast radius", "blue/green", "switch", "error rate", "p99", "latency", "error budget", "rollback", "anomalies"], idealAnswer: "Blue/Green switches 100% of traffic from v1 to v2 at once, so a bug reaches every patient. A canary sends a small slice (e.g. 5%) to v2 while the rest stays on v1, limiting the blast radius. The router watches the canary's error rate, p99 latency and prediction anomalies against an error budget — e.g. >1.5% 5xx or p99 >300 ms — and automatically drops v2 traffic to 0% when it is breached." },
    ],
    daily: (r, date) => {
      const q = r.int(100, 300, 25), c = r.pick([5, 10, 15, 20]), e = r.int(20, 60, 5) / 10;
      const errs = Math.round(((q * c) / 100) * 600 * (e / 100));
      return { title: `Canary errors · ${date}`, question: `A gateway routes <b>${c}%</b> of <b>${q} QPS</b> to a canary. Over <b>10 minutes</b> the canary's error rate is <b>${e}%</b>. How many 5xx responses did it return?`, answer: errs, tolerance: 1, hint: "Canary QPS × 600 s × error rate.", explanation: `${(q * c) / 100} QPS × 600 = ${(q * c * 6)} requests × ${e}% = ${errs}.` };
    },
  },

  "inference-optimization": {
    intro: "Shrink the model's numbers from 32 bits to 8 and move it from Python to ONNX Runtime. Watch memory, latency and throughput change — and keep an eye on accuracy.",
    sections: [
      {
        id: "quant",
        title: "Precision & runtime",
        controls: [
          { kind: "range", id: "params", label: "Parameters", min: 5, max: 100, step: 5, default: 25, unit: "M" },
          { kind: "select", id: "precision", label: "Weights", default: "fp32", options: [{ value: "fp32", label: "FP32 (4 bytes)" }, { value: "fp16", label: "FP16 (2 bytes)" }, { value: "int8", label: "INT8 (1 byte)" }] },
          { kind: "toggle", id: "onnx", label: "ONNX Runtime (compiled C++ graph)", default: false },
        ],
        derive: (v) => {
          const bytes = { fp32: 4, fp16: 2, int8: 1 }[String(v.precision)] ?? 4;
          let lat = n(v.params) * 1.2 * ({ fp32: 1, fp16: 0.65, int8: 0.28 }[String(v.precision)] ?? 1);
          if (v.onnx) lat *= 0.6;
          lat = Math.max(1.2, lat);
          return { memoryMb: n(v.params) * bytes, latencyMs: lat, speedup: (n(v.params) * 1.2) / lat, aucDrop: v.precision === "int8" ? 0.002 : 0 };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Weights in RAM", value: `${n(d.memoryMb)} MB` }, { label: "Latency", value: `${n(d.latencyMs).toFixed(1)} ms`, tone: n(d.latencyMs) < 15 ? "good" : "warn" }, { label: "Speed-up vs FP32 Python", value: `${n(d.speedup).toFixed(1)}×`, tone: "accent" }, { label: "ROC-AUC change", value: n(d.aucDrop) ? `−${n(d.aucDrop)}` : "0" }] },
          { kind: "bars", items: [{ label: "FP32", value: n(v.params) * 4, display: `${n(v.params) * 4} MB`, tone: "neutral" }, { label: "Current", value: n(d.memoryMb), max: n(v.params) * 4, display: `${n(d.memoryMb)} MB`, tone: "good" }] },
        ],
        code: `from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic("stroke.onnx", "stroke.int8.onnx", weight_type=QuantType.QInt8)
sess = onnxruntime.InferenceSession("stroke.int8.onnx")`,
      },
    ],
    tasks: [
      { kind: "predict", id: "p-int8", prompt: "A 48 M-parameter FP32 model is quantised to INT8. How many MB of RAM are saved?", answer: 144, tolerance: 0, unit: "MB", explain: "FP32 = 48 × 4 = 192 MB; INT8 = 48 MB; saved 144 MB (75%)." },
      { kind: "goal", id: "g-15ms", prompt: "Get a 50 M-parameter model under 15 ms.", hint: "Combine quantisation and ONNX.", check: (v, d) => n(v.params) >= 50 && n(d.latencyMs) < 15 },
      { kind: "goal", id: "g-4x", prompt: "Hit at least a 5× speed-up.", hint: "INT8 + ONNX.", check: (_, d) => n(d.speedup) >= 5 },
      { kind: "explain", id: "e-int8", prompt: "How does INT8 quantisation cut memory 4× and speed up CPU inference, and what must you check afterwards?", keywords: ["int8", "fp32", "4 bytes", "1 byte", "75%", "simd", "vnni", "avx-512", "onnx", "accuracy", "auc", "validate"], idealAnswer: "FP32 stores each weight in 4 bytes; INT8 uses 1, so the model is 4× smaller (a 75% saving) and more of it fits in cache. CPU SIMD units (AVX-512 VNNI) process four times as many 8-bit values per instruction, and ONNX Runtime removes Python overhead by executing a compiled graph. Quantisation is lossy, so re-validate clinical metrics like ROC-AUC and recall afterwards — here the drop was under 0.5%." },
    ],
    daily: (r, date) => {
      const p = r.int(24, 96, 8);
      return { title: `INT8 savings · ${date}`, question: `A model has <b>${p} million</b> FP32 parameters (4 bytes each). After INT8 quantisation (1 byte each), how many MB of RAM are saved?`, answer: p * 3, tolerance: 0, hint: "FP32 MB − INT8 MB.", explanation: `${p * 4} − ${p} = ${p * 3} MB (75%).` };
    },
  },

  "drift-psi": {
    intro: "The hospital opens a geriatric wing. Shift the production age distribution and compute the real Population Stability Index, bin by bin — then decide whether to retrain.",
    sections: [
      {
        id: "psi",
        title: "PSI on patient age (10 reference deciles)",
        blurb: "Training ages ~ Normal(52, 15). Each decile holds 10% of training patients.",
        controls: [
          { kind: "range", id: "shift", label: "Production mean shift", min: -15, max: 25, default: 0, unit: "years" },
          { kind: "range", id: "spread", label: "Production spread (× training σ)", min: 0.6, max: 1.8, step: 0.05, default: 1, format: (x) => `${x.toFixed(2)}×` },
        ],
        derive: (v) => {
          const edges = Array.from({ length: 9 }, (_, i) => phiInv((i + 1) / 10)); // in training z-units
          const cdf = (z: number) => phi((z - n(v.shift) / 15) / n(v.spread));
          const actual = Array.from({ length: 10 }, (_, i) => (i === 9 ? 1 : cdf(edges[i])) - (i === 0 ? 0 : cdf(edges[i - 1])));
          const { total, parts } = psi(Array(10).fill(0.1), actual);
          return { psi: total, worstBin: parts.indexOf(Math.max(...parts)) + 1, actual: actual.map((a) => a.toFixed(3)).join(","), parts: parts.map((p) => p.toFixed(4)).join(",") };
        },
        view: (_, d) => {
          const actual = String(d.actual).split(",").map(Number), parts = String(d.parts).split(",").map(Number);
          const status = n(d.psi) < 0.1 ? ["Stable", "good"] : n(d.psi) < 0.25 ? ["Moderate drift — monitor", "warn"] : ["Significant drift — retrain", "bad"];
          return [
            { kind: "result", label: "PSI", value: `${n(d.psi).toFixed(3)} · ${status[0]}`, tone: status[1] as "good" | "warn" | "bad", work: "PSI = Σ (A − E) · ln(A / E),  E = 0.10 per bin" },
            { kind: "table", head: ["Decile", "E", "A", "(A−E)·ln(A/E)"], rows: actual.map((a, i) => [i + 1, "0.100", a.toFixed(3), parts[i].toFixed(4)]), highlight: [[n(d.worstBin) - 1, -1]] },
          ];
        },
      },
    ],
    tasks: [
      { kind: "predict", id: "p-bin", prompt: "One bin: expected E = 0.10, actual A = 0.24. What is its PSI contribution (4 dp)?", answer: 0.1226, tolerance: 0.001, explain: "(0.24 − 0.10) × ln(2.4) = 0.14 × 0.8755 = 0.1226." },
      { kind: "goal", id: "g-monitor", prompt: "Find a shift that lands in the monitor band (0.10 ≤ PSI < 0.25).", hint: "A modest change in mean age.", check: (_, d) => n(d.psi) >= 0.1 && n(d.psi) < 0.25 },
      { kind: "goal", id: "g-retrain", prompt: "Trigger retraining with spread alone (mean shift = 0).", hint: "Widen or narrow the production distribution a lot.", check: (v, d) => n(v.shift) === 0 && n(d.psi) >= 0.25 },
      { kind: "explain", id: "e-psi", prompt: "How does PSI measure covariate drift, what thresholds do we use, and how is this different from concept drift?", keywords: ["psi", "bins", "expected", "actual", "ln", "0.1", "0.25", "retrain", "covariate", "p(x)", "concept drift", "p(y|x)", "silent"], idealAnswer: "PSI splits a feature into reference bins (usually deciles of the training data), compares expected proportions E with production proportions A, and sums (A − E)·ln(A/E). Below 0.1 is stable, 0.1–0.25 means monitor, and ≥ 0.25 triggers retraining and recalibration. That's covariate drift — a change in P(X), like older patients arriving. Concept drift is a change in P(Y|X), the relationship itself, which PSI on inputs can't see — you need labelled outcomes for that." },
    ],
    daily: (r, date) => {
      const A = r.int(18, 30, 2) / 100, c = Math.round((A - 0.1) * Math.log(A / 0.1) * 10000) / 10000;
      return { title: `PSI bin · ${date}`, question: `In one age bin, expected frequency <b>E = 0.10</b> and production frequency <b>A = ${A.toFixed(2)}</b>. What is this bin's PSI contribution <code>(A − E) × ln(A / E)</code>? (4 dp)`, answer: c, tolerance: 0.001, hint: "ln is the natural log.", explanation: `(${A.toFixed(2)} − 0.10) × ln(${(A / 0.1).toFixed(1)}) = ${c}.` };
    },
  },

  "stroke-capstone": {
    intro: "Run the triage model on one patient and read the SHAP explanation a physician would see — then move the decision threshold for the whole hospital and trade missed strokes against clinic capacity.",
    sections: [
      {
        id: "patient",
        title: "One patient, explained",
        controls: [
          { kind: "number", id: "age", label: "Age", default: 67, min: 18, max: 100 },
          { kind: "number", id: "glucose", label: "Avg glucose", default: 228, min: 50, max: 350, unit: "mg/dL" },
          { kind: "number", id: "bmi", label: "BMI", default: 34.2, min: 15, max: 60, step: 0.1 },
          { kind: "toggle", id: "hyp", label: "Hypertension", default: true },
          { kind: "toggle", id: "heart", label: "Heart disease", default: true },
        ],
        derive: (v) => {
          const contrib = {
            Age: (n(v.age) - 50) * 0.055,
            Glucose: (n(v.glucose) - 100) * 0.012,
            BMI: (n(v.bmi) - 25) * 0.035,
            Hypertension: v.hyp ? 0.85 : 0,
            "Heart disease": v.heart ? 0.65 : 0,
          };
          const z = -2.95 + Object.values(contrib).reduce((a, b) => a + b, 0);
          return { risk: sigmoid(z), base: sigmoid(-2.95), ...Object.fromEntries(Object.entries(contrib).map(([k, c]) => [`shap_${k}`, c])) };
        },
        view: (_, d) => {
          const shap = Object.entries(d).filter(([k]) => k.startsWith("shap_")).map(([k, c]) => [k.slice(5), Number(c)] as const).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
          return [
            { kind: "result", label: "Predicted stroke risk", value: pct(n(d.risk)), work: `base rate ${pct(n(d.base))} → log-odds −2.95 + Σ SHAP = ${logit(n(d.risk)).toFixed(2)}` },
            { kind: "bars", title: "SHAP contributions (log-odds; + raises risk)", items: shap.map(([k, c]) => ({ label: `${k} ${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}`, value: Math.abs(c), max: 2, tone: c >= 0 ? ("bad" as const) : ("good" as const), display: c >= 0 ? "↑" : "↓" })) },
          ];
        },
      },
      {
        id: "threshold",
        title: "Decision threshold for the hospital",
        blurb: "1,000 patients a month, 5% prevalence. Patients above the threshold are booked into the chronic-care clinic.",
        controls: [{ kind: "range", id: "threshold", label: "Threshold", min: 0.05, max: 0.8, step: 0.01, default: 0.5, format: (x) => x.toFixed(2) }],
        derive: (v) => {
          const t = n(v.threshold), P = 50, N = 950;
          const TP = Math.round(P * tpr(t)), FP = Math.round(N * fpr(t));
          return { recall: TP / P, missedStrokes: P - TP, referrals: TP + FP, precision: TP + FP ? TP / (TP + FP) : 0 };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "Recall", value: pct(n(d.recall), 0), tone: n(d.recall) >= 0.85 ? "good" : "bad" }, { label: "Strokes missed / month", value: n(d.missedStrokes), tone: n(d.missedStrokes) > 10 ? "bad" : "good" }, { label: "Clinic referrals / month", value: n(d.referrals), tone: n(d.referrals) > 200 ? "warn" : "neutral" }, { label: "Precision", value: pct(n(d.precision), 0) }] },
          { kind: "note", text: "Lowering the threshold catches more strokes but books more healthy patients into the clinic. The right threshold is a clinical-capacity decision, not 0.5 by default." },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-gain", prompt: "Lowering the threshold raises recall from 65% to 88% in a cohort with 200 true strokes. How many more patients get preventive care?", answer: 46, tolerance: 0, explain: "0.23 × 200 = 46 more strokes caught." },
      { kind: "goal", id: "g-recall", prompt: "Choose a threshold with recall ≥ 85% and at most 200 referrals a month.", hint: "Somewhere around 0.2.", check: (_, d) => n(d.recall) >= 0.85 && n(d.referrals) <= 200 },
      { kind: "goal", id: "g-low", prompt: "Make a patient profile with predicted risk below 5%.", hint: "Younger, normal glucose, no conditions.", check: (_, d) => n(d.risk) < 0.05 },
      { kind: "explain", id: "e-xai", prompt: "Why is the default 0.5 threshold wrong here, and how do SHAP values make a prediction actionable for a physician?", keywords: ["threshold", "0.5", "imbalance", "recall", "capacity", "calibrate", "shap", "contribution", "base rate", "local", "explain", "trust"], idealAnswer: "With ~5% prevalence most stroke patients score below 0.5, so the default threshold misses many of them; we calibrate it (e.g. to 0.22) to maximise recall within the clinic's referral capacity. A bare probability isn't something a physician can act on or trust. SHAP decomposes this patient's prediction into additive feature contributions from the base rate — e.g. +age, +hypertension, +glucose — so the doctor sees why the risk is high and what is driving it. These are model attributions, not causal effects." },
    ],
    daily: (r, date) => {
      const P = r.int(120, 280, 20), gain = Math.round(P * 0.23);
      return { title: `Recall gain · ${date}`, question: `In a year with <b>${P} true stroke cases</b>, lowering the threshold from 0.50 to 0.22 raises recall from <b>65%</b> to <b>88%</b>. How many additional patients receive preventive care?`, answer: gain, tolerance: 0, hint: "Recall gain × positives.", explanation: `0.23 × ${P} = ${gain}.` };
    },
  },
};
