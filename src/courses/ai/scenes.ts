// @ts-nocheck — canvas drawing code ported verbatim from the original StudyRoom lessons.
// New scenes can be written in typed TypeScript; see src/lib/scene/kit.ts.
/* eslint-disable */
import type { Scene } from "@/lib/scene/kit";

/** One scene per module id; `ci` is the lesson step index. */
export const scenes: Record<string, Scene> = {
  "data-preparation": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Clinical Data Preparation & SMOTE Oversampling", "From raw hospital records to leak-free balanced training pipelines");
      rect(36, 75, 290, 110, { f: C.navyL, s: C.line2, r: 8 });
      txt("Training Split (80%) — FIT HERE", 48, 98, { s: 12.5, w: 600, c: C.navy });
      txt("• MedianImputer.fit(X_train)", 48, 122, { mono: true, s: 11, c: C.ink2 });
      txt("• StandardScaler.fit(X_train)", 48, 142, { mono: true, s: 11, c: C.ink2 });
      txt("• SMOTE.fit_resample(X_tr, y_tr)", 48, 162, { mono: true, s: 11, c: C.sage });

      rect(350, 75, 290, 110, { f: "#FFFDF8", s: C.line2, r: 8 });
      txt("Test Split (20%) — TRANSFORM ONLY", 362, 98, { s: 12.5, w: 600, c: C.rust });
      txt("• imputer.transform(X_test)", 362, 122, { mono: true, s: 11, c: C.ink2 });
      txt("• scaler.transform(X_test)", 362, 142, { mono: true, s: 11, c: C.ink2 });
      txt("• NO SMOTE! Evaluate raw real data", 362, 162, { mono: true, s: 11, c: C.rust });

      rect(36, 200, 604, 100, { f: "#fff", s: C.line2, r: 8 });
      txt("Class Distribution: 95% Majority (Non-Stroke) vs 5% Minority (Stroke)", 50, 222, { s: 12, w: 600 });
      for (let i = 0; i < 28; i++) {
        const x = 55 + i * 14 + (i % 3) * 2;
        const y = 250 + (i % 4) * 8 - 12;
        circle(x, y, 4, { f: C.line2, s: C.ink2, lw: 1 });
      }
      txt("28 Majority Samples", 50, 290, { s: 10, c: C.muted });

      circle(500, 245, 5, { f: C.rust });
      circle(570, 265, 5, { f: C.rust });
      line(500, 245, 570, 265, C.rust, 1.5, [4, 3]);
      const synthX = 500 + 70 * 0.55;
      const synthY = 245 + 20 * 0.55;
      circle(synthX, synthY, 6, { f: C.gold, s: C.goldD, lw: 1.5 });
      txt("Synthetic SMOTE Sample", synthX - 45, synthY - 10, { s: 10.5, w: 600, c: C.goldD });

      formulaBar("Pipeline: ColumnTransformer(Imputer, Scaler, OneHot) ──▶ Model");
    },
  "model-persistence": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Model Serialization & Packaging", "Python Object Graph ──serialize──▶ Binary Persistent Artifact");
      rect(36, 80, 180, 190, { f: "#fff", s: C.line2, r: 8 });
      txt("Live Python Memory", 48, 104, { s: 13, w: 600, c: C.navy });
      rect(48, 120, 156, 30, { f: C.goldL, r: 6 });
      txt("Pipeline Object", 60, 140, { mono: true, s: 11, w: 600, c: C.goldD });
      rect(48, 160, 156, 30, { f: C.sageL, r: 6 });
      txt("ColumnTransformer", 56, 180, { mono: true, s: 11, c: C.sage });
      rect(48, 200, 156, 30, { f: C.navyL, r: 6 });
      txt("XGBClassifier (Weights)", 52, 220, { mono: true, s: 11, c: C.navy });

      arrow(226, 175, 290, 175, C.goldD, 2.5);
      txt("joblib.dump(..., compress=3)", 230, 160, { s: 10.5, mono: true, c: C.goldD });

      rect(300, 80, 340, 190, { f: "#fff", s: C.line2, r: 8 });
      txt("Disk File: stroke_pipeline.joblib (18.4 MB)", 314, 104, { s: 13, w: 600 });
      txt("• NumPy arrays saved as contiguous compressed chunks", 314, 134, { s: 11.5, c: C.ink2 });
      txt("• Memory-mapping (mmap) allows instant zero-copy reads", 314, 156, { s: 11.5, c: C.ink2 });
      txt("• Multi-worker processes share single RAM copy", 314, 178, { s: 11.5, c: C.sage, w: 600 });
      txt("⚠ CAUTION: Deserialization executes arbitrary __reduce__ code", 314, 214, { s: 11, c: C.rust, w: 600 });
      txt("Only unpickle trusted artifacts verified with SHA-256 signatures", 314, 234, { s: 10.5, c: C.muted });

      formulaBar("joblib.dump(pipeline, 'model.joblib')  ──▶  pipeline = joblib.load('model.joblib')");
    },
  "fastapi-serving": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("FastAPI Gateway & Pydantic Boundary Validation", "Strict data contract filters invalid requests before tensor inference");
      rect(36, 90, 130, 160, { f: "#fff", s: C.line2, r: 8 });
      txt("Hospital EHR Client", 48, 115, { s: 12, w: 600 });
      txt("POST /predict", 48, 140, { mono: true, s: 11, c: C.goldD });
      txt("{\n  age: 64,\n  bmi: 31.2,\n  glucose: 180\n}", 48, 165, { mono: true, s: 10, c: C.ink2 });

      arrow(176, 165, 226, 165, C.ink, 2);

      rect(236, 75, 170, 200, { f: C.goldXL, s: C.gold, r: 8, lw: 2 });
      txt("Pydantic Gate", 252, 100, { s: 13, w: 600, c: C.goldD });
      txt("PatientSchema(BaseModel)", 246, 120, { mono: true, s: 9.5, c: C.muted });
      rect(246, 135, 150, 24, { f: C.sageL, r: 4 });
      txt("age: int (0 to 120) ✓", 252, 151, { mono: true, s: 10, c: C.sage });
      rect(246, 165, 150, 24, { f: C.sageL, r: 4 });
      txt("glucose: float > 0 ✓", 252, 181, { mono: true, s: 10, c: C.sage });
      rect(246, 195, 150, 24, { f: C.rustL, r: 4 });
      txt("Invalid ──▶ 422 Error", 252, 211, { mono: true, s: 10, c: C.rust, w: 600 });

      arrow(416, 150, 466, 150, C.sage, 2);

      rect(476, 90, 164, 160, { f: C.navy, s: C.navy, r: 8 });
      txt("Model Inference", 492, 115, { s: 12, w: 600, c: "#fff" });
      txt("Uvicorn Worker", 492, 136, { mono: true, s: 10.5, c: C.goldL });
      txt("pipeline.predict_proba()", 492, 165, { mono: true, s: 10, c: "#fff" });
      txt("Response: {prob: 0.38}", 492, 205, { mono: true, s: 10.5, c: C.sageL, w: 600 });
      txt("Latency: 8.4 ms", 492, 228, { mono: true, s: 10, c: C.muted });

      formulaBar("Little's Law: Concurrency (L) = Throughput (λ) × Latency (W)");
    },
  "cloud-sizing": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Cloud Architecture & Machine Learning Sizing", "NIST Characteristics · IaaS vs PaaS vs MLaaS · Spot Instances");
      const pillars = [
        ["1. On-Demand", "Self-service API provisioning"],
        ["2. Broad Access", "HTTPS / gRPC from anywhere"],
        ["3. Pooling", "Shared multi-tenant hardware"],
        ["4. Elasticity", "Autoscale from 0 to N replicas"],
        ["5. Measured", "Pay-per-millisecond billing"]
      ];
      pillars.forEach(([title, sub], idx) => {
        const x = 36 + idx * 122;
        rect(x, 80, 114, 70, { f: "#fff", s: C.line2, r: 6 });
        txt(title, x + 8, 104, { s: 11, w: 600, c: C.navy });
        txt(sub, x + 8, 126, { s: 9.5, c: C.muted });
      });

      rect(36, 170, 290, 100, { f: "#FFFDF8", s: C.line2, r: 8 });
      txt("On-Demand Cloud VM", 50, 195, { s: 12, w: 600 });
      txt("Standard dedicated SLA • 100% availability", 50, 218, { s: 11, c: C.muted });
      txt("$0.48 / hr = $345 / month", 50, 245, { mono: true, s: 14, w: 600, c: C.rust });

      rect(346, 170, 294, 100, { f: C.goldXL, s: C.gold, r: 8 });
      txt("Spot / Preemptible VM (75% Discount)", 360, 195, { s: 12, w: 600, c: C.goldD });
      txt("Reclaimable with 2-min warning • For batch & training", 360, 218, { s: 11, c: C.ink2 });
      txt("$0.12 / hr = $86 / month", 360, 245, { mono: true, s: 14, w: 600, c: C.sage });

      formulaBar("Cloud Tiering: IaaS (Compute Engine) ──▶ PaaS (Render) ──▶ MLaaS (Vertex AI)");
    },
  "docker": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Multi-Stage Docker Image Optimization", "Discard compilers & build tools ──▶ Lean, production-hardened runtime");
      rect(36, 80, 270, 180, { f: "#FFFDF8", s: C.rust, r: 8, lw: 1.5 });
      txt("Stage 1: Builder (python:3.11)", 48, 105, { s: 12.5, w: 600, c: C.rust });
      txt("• RUN apt-get install gcc g++ libpq-dev", 48, 130, { mono: true, s: 10, c: C.muted });
      txt("• RUN pip wheel --wheel-dir=/wheels ...", 48, 150, { mono: true, s: 10, c: C.ink2 });
      txt("• Compiles C-extensions & Cython", 48, 170, { s: 10.5, c: C.muted });
      txt("Heavy footprint: ~1,150 MB", 48, 230, { mono: true, s: 12, w: 600, c: C.rust });

      arrow(316, 165, 360, 165, C.goldD, 3);
      txt("COPY --from=builder /wheels", 280, 150, { mono: true, s: 9, c: C.goldD });

      rect(370, 80, 270, 180, { f: C.sageL, s: C.sage, r: 8, lw: 2 });
      txt("Stage 2: Runtime (python:3.11-slim)", 382, 105, { s: 12.5, w: 600, c: C.sage });
      txt("• RUN pip install --no-index /wheels/*", 382, 130, { mono: true, s: 10, c: C.ink2 });
      txt("• RUN useradd -m appuser && USER appuser", 382, 150, { mono: true, s: 10, c: C.sage, w: 600 });
      txt("• Zero compilers! Minimal attack surface", 382, 170, { s: 10.5, c: C.ink2 });
      txt("Lean production size: ~155 MB (86% smaller)", 382, 230, { mono: true, s: 12, w: 600, c: C.sage });

      formulaBar("Best Practice: Rootless container (USER appuser) + strict .dockerignore");
    },
  "canary-routing": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Canary Traffic Routing & Error Budget Circuit Breaker", "Gradual percentage rollout with automated instant rollback on regression");
      rect(36, 100, 120, 120, { f: "#fff", s: C.line2, r: 8 });
      txt("Clients / Ingress", 48, 130, { s: 12, w: 600 });
      txt("100% Traffic", 48, 155, { mono: true, s: 11, c: C.navy });
      txt("200 QPS", 48, 175, { mono: true, s: 13, w: 600, c: C.goldD });

      arrow(166, 140, 250, 115, C.sage, 2.5);
      txt("90% Traffic", 180, 115, { mono: true, s: 10, c: C.sage });

      arrow(166, 180, 250, 205, C.goldD, 2);
      txt("10% Canary", 180, 215, { mono: true, s: 10, c: C.goldD });

      rect(260, 80, 200, 70, { f: "#fff", s: C.sage, r: 8 });
      txt("Model v1 (Stable)", 274, 105, { s: 12, w: 600, c: C.sage });
      txt("Error Rate: 0.02% • P99: 14ms", 274, 130, { mono: true, s: 10.5, c: C.ink2 });

      rect(260, 170, 200, 70, { f: C.goldXL, s: C.gold, r: 8 });
      txt("Model v2 (Canary)", 274, 195, { s: 12, w: 600, c: C.goldD });
      txt("Monitoring Error Budget...", 274, 220, { mono: true, s: 10.5, c: C.ink2 });

      rect(480, 80, 160, 160, { f: C.navy, s: C.navy, r: 8 });
      txt("Rollback Gate", 496, 108, { s: 12, w: 600, c: "#fff" });
      txt("Threshold: >1.5% 5xx", 496, 132, { mono: true, s: 10, c: C.goldL });
      txt("If breached: ──▶", 496, 156, { s: 10.5, c: "#fff" });
      rect(496, 170, 128, 45, { f: C.rustL, r: 6 });
      txt("CANARY ──▶ 0%", 504, 195, { mono: true, s: 11, w: 700, c: C.rust });

      formulaBar("Zero-downtime serving: validate Canary health before 100% promotion");
    },
  "inference-optimization": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Inference Acceleration: FP32 ──▶ INT8 Quantization", "Shrink weights by 4x, eliminate memory bandwidth bottlenecks, and leverage SIMD");
      rect(36, 80, 260, 170, { f: "#FFFDF8", s: C.line2, r: 8 });
      txt("FP32 (32-bit Floating Point)", 50, 106, { s: 12.5, w: 600 });
      txt("• 4 bytes per model parameter", 50, 132, { s: 11, c: C.muted });
      txt("• 100M params = 400 MB memory", 50, 154, { mono: true, s: 11, c: C.ink2 });
      txt("• Latency: 42 ms / prediction", 50, 176, { mono: true, s: 11, c: C.rust });
      for (let b = 0; b < 16; b++) rect(50 + b * 14, 200, 11, 20, { f: C.navyL });
      txt("32 bits (1 sign, 8 exp, 23 mantissa)", 50, 236, { s: 9.5, c: C.muted });

      arrow(310, 165, 360, 165, C.goldD, 3);
      txt("Quantize q = round(r/S) + Z", 280, 150, { mono: true, s: 9, c: C.goldD });

      rect(370, 80, 270, 170, { f: C.goldXL, s: C.gold, r: 8, lw: 2 });
      txt("INT8 (8-bit Quantized Integer)", 384, 106, { s: 12.5, w: 600, c: C.goldD });
      txt("• 1 byte per model parameter (75% savings)", 384, 132, { s: 11, c: C.ink2 });
      txt("• 100M params = 100 MB memory", 384, 154, { mono: true, s: 11, w: 600, c: C.sage });
      txt("• Latency: 12 ms / prediction (3.5x faster)", 384, 176, { mono: true, s: 11, w: 600, c: C.sage });
      for (let b = 0; b < 8; b++) rect(384 + b * 14, 200, 11, 20, { f: C.sageL });
      txt("8 bits (AVX-512 VNNI vector instructions)", 384, 236, { s: 9.5, c: C.sage });

      formulaBar("ONNX Runtime + INT8 quantization accelerates single-sample throughput by up to 4×");
    },
  "drift-psi": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Model Observability & Covariate Drift (PSI)", "Detect silent data distribution changes before predictions fail clinical reality");
      rect(36, 80, 604, 120, { f: "#fff", s: C.line2, r: 8 });
      txt("Patient Blood Glucose Level (mg/dL) Distribution Shift", 50, 105, { s: 12, w: 600 });
      ctx.beginPath();
      ctx.moveTo(60, 180);
      ctx.bezierCurveTo(140, 180, 180, 110, 240, 180);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      txt("Expected Baseline (E)", 140, 125, { s: 10, mono: true, c: C.navy });

      ctx.beginPath();
      ctx.moveTo(140, 180);
      ctx.bezierCurveTo(240, 180, 320, 110, 420, 180);
      ctx.strokeStyle = C.rust;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      txt("Actual Production (A)", 290, 125, { s: 10, mono: true, c: C.rust });

      rect(36, 215, 604, 55, { f: "#FFFDF8", s: C.line2, r: 8 });
      rect(48, 235, 180, 18, { f: C.sageL, r: 4 });
      txt("PSI < 0.10: Stable", 58, 248, { s: 10.5, w: 600, c: C.sage });

      rect(238, 235, 180, 18, { f: C.goldL, r: 4 });
      txt("0.10 ≤ PSI < 0.25: Moderate", 244, 248, { s: 10.5, w: 600, c: C.goldD });

      rect(428, 235, 200, 18, { f: C.rustL, r: 4 });
      txt("PSI ≥ 0.25: Retrain Trigger!", 436, 248, { s: 10.5, w: 600, c: C.rust });

      formulaBar("PSI = ∑ (Actual - Expected) × ln(Actual / Expected)");
    },
  "stroke-capstone": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
      heading("Capstone: Stroke Risk Pipeline & SHAP Explanations", "Uganda Ministry of Health June 2025 Clinical Service Integration");
      rect(36, 80, 240, 180, { f: "#fff", s: C.line2, r: 8 });
      txt("Patient File: #UG-84920", 48, 105, { s: 12.5, w: 600 });
      txt("Age: 67 years", 48, 130, { mono: true, s: 11, c: C.ink2 });
      txt("Hypertension: Yes (1)", 48, 150, { mono: true, s: 11, c: C.rust });
      txt("Heart Disease: Yes (1)", 48, 170, { mono: true, s: 11, c: C.rust });
      txt("Avg Glucose: 228 mg/dL", 48, 190, { mono: true, s: 11, c: C.rust });
      txt("BMI: 36.6 (Obese)", 48, 210, { mono: true, s: 11, c: C.ink2 });
      txt("Smoking: Formerly smoked", 48, 230, { mono: true, s: 11, c: C.ink2 });

      rect(290, 80, 350, 180, { f: C.goldXL, s: C.gold, r: 8 });
      txt("SHAP Attribution (Base Risk = 4.9%)", 304, 105, { s: 12, w: 600, c: C.goldD });

      const shapBars = [
        ["Age (+16.2%)", 120, C.rust],
        ["Hypertension (+11.8%)", 90, C.rust],
        ["Glucose (+7.4%)", 60, C.rust],
        ["Heart Disease (+4.1%)", 35, C.rust],
        ["BMI (+2.5%)", 20, C.rust]
      ];
      shapBars.forEach(([name, width, col], i) => {
        const y = 125 + i * 22;
        txt(name, 304, y + 11, { s: 10, mono: true, c: C.ink2 });
        rect(440, y, width, 14, { f: col, r: 3 });
      });

      rect(304, 235, 320, 20, { f: C.rustL, r: 4 });
      txt("P = 46.9%  >  Threshold 0.22  ──▶  ENROLL IN CHRONIC CLINIC", 310, 249, { s: 9.5, mono: true, w: 700, c: C.rust });

      formulaBar("Calibrated Decision: Recall 88% • False Negative reduction prioritizes human life");
    },
};
