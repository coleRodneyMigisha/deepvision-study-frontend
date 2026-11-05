/* =====================================================================
   COURSE REGISTRY & DAILY SEEDED CHALLENGE ENGINE
   To add a new course unit:
     1. Create `courses/<course_id>.js` exporting `window.COURSE_<ID>`
     2. Add `<script src="courses/<course_id>.js"></script>` in `index.html`
     3. Append `window.COURSE_<ID>` to `window.STUDY_COURSES` below.
   ===================================================================== */
window.STUDY_COURSES = [
  window.COURSE_CV,
  window.COURSE_DS
].filter(Boolean);

window.getCourseById = function(id) {
  return window.STUDY_COURSES.find(c => c.id === id) || window.STUDY_COURSES[0];
};

window.todayISO = function() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* Deterministic 32-bit hash & PRNG from (courseId, labIndex, dateStr, salt) */
window.seededRng = function(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* Generates a mathematically verified daily challenge for any course & lab */
window.getDailySeededChallenge = function(courseId, labIndex, dateStr, salt = "") {
  const date = dateStr || window.todayISO();
  const rand = window.seededRng(`${courseId}:${labIndex}:${date}:${salt}`);
  const pickInt = (min, max, step = 1) => {
    const n = Math.floor((max - min) / step) + 1;
    return min + Math.floor(rand() * n) * step;
  };

  if (courseId === "cv") {
    switch (labIndex) {
      case 0: {
        const chNames = ["Red", "Green", "Blue"];
        const M = [0.485, 0.456, 0.406], S = [0.229, 0.224, 0.225];
        const ch = pickInt(0, 2);
        const raw = pickInt(40, 245, 5);
        const ans = +(((raw / 255) - M[ch]) / S[ch]).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · ${chNames[ch]} Normalisation`,
          q: `A <b>${chNames[ch].toLowerCase()}</b>-channel pixel has raw value <b>${raw}</b> (μ = ${M[ch]}, σ = ${S[ch]}). What is its normalised value after <code>ToTensor()</code> + ImageNet <code>Normalize()</code>? (2 decimals)`,
          answer: ans,
          tol: 0.02,
          hint: `Compute (${raw} / 255 − ${M[ch]}) / ${S[ch]}.`,
          explain: `${raw}/255 = ${(raw/255).toFixed(4)} → (${(raw/255).toFixed(4)} − ${M[ch]}) / ${S[ch]} = ${ans}.`
        };
      }
      case 1: {
        const W = pickInt(64, 256, 16), K = [3, 5, 7][pickInt(0, 2)], P = pickInt(0, 3), S = [1, 2][pickInt(0, 1)];
        const out = Math.floor((W - K + 2 * P) / S) + 1;
        return {
          title: `Daily Challenge (${date}) · Conv2d Output Width`,
          q: `An input image of width <b>${W}</b> passes through a <b>${K}×${K}</b> convolution with padding <b>${P}</b> and stride <b>${S}</b>. What is the output spatial width?`,
          answer: out,
          tol: 0,
          hint: `Use O = floor((${W} − ${K} + 2·${P}) / ${S}) + 1.`,
          explain: `⌊(${W} − ${K} + ${2*P}) / ${S}⌋ + 1 = ⌊${W - K + 2*P} / ${S}⌋ + 1 = ${out}.`
        };
      }
      case 2: {
        const tp = pickInt(30, 90, 5), fp = pickInt(10, 40, 5), fn = pickInt(10, 50, 5);
        const P = tp / (tp + fp), R = tp / (tp + fn), f1 = +(2 * P * R / (P + R)).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Diagnostic F1 Score`,
          q: `A detector evaluates to <b>TP = ${tp}, FP = ${fp}, FN = ${fn}</b>. Compute the <b>F1 score</b> (as a decimal 0–1, rounded to 2 decimals).`,
          answer: f1,
          tol: 0.015,
          hint: `Precision = ${tp}/${tp+fp} = ${P.toFixed(3)}, Recall = ${tp}/${tp+fn} = ${R.toFixed(3)}. F1 = 2PR/(P+R).`,
          explain: `P = ${P.toFixed(3)}, R = ${R.toFixed(3)} → F1 = 2(${P.toFixed(3)})(${R.toFixed(3)}) / ${(P+R).toFixed(3)} = ${f1}.`
        };
      }
      case 3: {
        const d = [512, 768, 1024, 2048][pickInt(0, 3)], c = pickInt(4, 25, 1);
        const ans = d * c + c;
        return {
          title: `Daily Challenge (${date}) · Linear Probe Parameters`,
          q: `You freeze a pretrained backbone with embedding dim <b>${d}</b> and attach <code>nn.Linear(${d}, ${c})</code> (with bias). How many trainable parameters are in the model?`,
          answer: ans,
          tol: 0,
          hint: `Multiply ${d} × ${c} weights and add ${c} biases.`,
          explain: `${d} × ${c} + ${c} = ${(d*c).toLocaleString()} + ${c} = ${ans.toLocaleString()} trainable parameters.`
        };
      }
      case 4: {
        const w = pickInt(10, 20, 2), shift = pickInt(2, 8, 2);
        const inter = (w - shift) * w, union = 2 * w * w - inter, iou = +(inter / union).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Shifted Box IoU`,
          q: `Box A = <code>(0, 0, ${w}, ${w})</code> and Box B = <code>(${shift}, 0, ${w + shift}, ${w})</code>. What is their <b>IoU</b>? (2 decimals)`,
          answer: iou,
          tol: 0.015,
          hint: `Overlap width = ${w} − ${shift} = ${w - shift}, height = ${w}. Area of each box = ${w * w}.`,
          explain: `Intersection = ${w - shift} × ${w} = ${inter}. Union = ${w*w} + ${w*w} − ${inter} = ${union}. IoU = ${inter}/${union} = ${iou}.`
        };
      }
      case 5: {
        const iou = +(pickInt(35, 85, 5) / 100).toFixed(2);
        const dice = +(2 * iou / (1 + iou)).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Mask IoU to Dice`,
          q: `A segmentation mask achieves <b>IoU = ${iou.toFixed(2)}</b>. What is its <b>Dice coefficient</b>? (2 decimals)`,
          answer: dice,
          tol: 0.015,
          hint: `Use Dice = 2 · IoU / (1 + IoU).`,
          explain: `Dice = 2(${iou}) / (1 + ${iou}) = ${(2*iou).toFixed(2)} / ${(1+iou).toFixed(2)} = ${dice}.`
        };
      }
      case 6: {
        const p = [14, 16, 32][pickInt(0, 2)], g = pickInt(10, 20, 2), h = p * g;
        const ans = g * g + 1;
        return {
          title: `Daily Challenge (${date}) · ViT Sequence Length`,
          q: `A ViT processes <b>${h}×${h}</b> images with <b>${p}×${p}</b> patches and a <code>[CLS]</code> token. What is the total sequence length?`,
          answer: ans,
          tol: 0,
          hint: `Grid is (${h}/${p})² = ${g}² patches, plus 1 [CLS] token.`,
          explain: `(${h}/${p})² + 1 = ${g}² + 1 = ${g*g} + 1 = ${ans} tokens.`
        };
      }
      case 7: {
        const x0 = pickInt(40, 200, 10), vx = pickInt(6, 18, 2), dt = pickInt(3, 8, 1);
        const ans = x0 + vx * dt;
        return {
          title: `Daily Challenge (${date}) · Kalman Motion Step`,
          q: `A tracked object is at <b>x = ${x0} px</b> moving at a constant <b>${vx} px/frame</b>. Where does the Kalman filter predict it after <b>${dt} frames</b>?`,
          answer: ans,
          tol: 0,
          hint: `x_pred = ${x0} + ${vx} × ${dt}.`,
          explain: `x̂ = ${x0} + ${vx} × ${dt} = ${ans} px.`
        };
      }
      default: {
        const paramsM = pickInt(15, 120, 5);
        const fp16Mb = paramsM * 2;
        return {
          title: `Daily Challenge (${date}) · FP16 Memory Footprint`,
          q: `A vision model has <b>${paramsM} million</b> parameters. How many <b>MB</b> (10⁶ bytes) do its weights require in <b>FP16</b> (2 bytes/param)?`,
          answer: fp16Mb,
          tol: 0.5,
          hint: `Multiply ${paramsM}M parameters by 2 bytes/parameter.`,
          explain: `${paramsM} × 2 = ${fp16Mb} MB.`
        };
      }
    }
  }

  /* Data Science (DSC3103) daily seeded generator */
  switch (labIndex) {
    case 0: {
      const q1 = pickInt(1600, 2800, 200), iqr = pickInt(800, 1800, 200), q3 = q1 + iqr;
      const upper = q3 + 1.5 * iqr;
      return {
        title: `Daily Challenge (${date}) · Tukey Outlier Fence`,
        q: `In today's market batch, commodity prices have <b>Q1 = ${q1.toLocaleString()} UGX</b> and <b>Q3 = ${q3.toLocaleString()} UGX</b>. What is the upper Tukey outlier fence (<code>Q3 + 1.5 × IQR</code>)?`,
        answer: upper,
        tol: 0,
        hint: `IQR = ${q3} − ${q1} = ${iqr}. Add 1.5 × ${iqr} to ${q3}.`,
        explain: `IQR = ${iqr} UGX. Upper fence = ${q3} + 1.5 × ${iqr} = ${q3} + ${1.5*iqr} = ${upper} UGX.`
      };
    }
    case 1: {
      const mb = pickInt(120, 480, 60), cols = 10, qCols = pickInt(2, 5, 1), cr = [2, 3, 4][pickInt(0, 2)];
      const ans = +((mb * (qCols / cols)) / cr).toFixed(2);
      return {
        title: `Daily Challenge (${date}) · Parquet Column Pruning Scan`,
        q: `A <b>${cols}-column</b> table is <b>${mb} MB</b> in CSV. Stored in Parquet with <b>${cr}×</b> compression, how many <b>MB</b> does DuckDB scan when querying <b>${qCols} columns</b>? (up to 2 decimals)`,
        answer: ans,
        tol: 0.05,
        hint: `Compute ${mb} × (${qCols}/${cols}) / ${cr}.`,
        explain: `Column pruning selects ${qCols}/${cols} of ${mb} MB = ${mb*qCols/cols} MB → divided by ${cr}× compression = ${ans} MB.`
      };
    }
    case 2: {
      const m = pickInt(4, 10, 1), c = pickInt(4, 8, 1), d = pickInt(30, 120, 15);
      const ans = m * c * d;
      return {
        title: `Daily Challenge (${date}) · Star Schema Fact Grain`,
        q: `A market warehouse tracks <b>${m} markets</b> and <b>${c} commodities</b> over <b>${d} days</b> with complete daily coverage. How many rows are in <code>fact_market_prices</code>?`,
        answer: ans,
        tol: 0,
        hint: `Multiply ${m} × ${c} × ${d}.`,
        explain: `Grain is (date, market, commodity) = ${m} × ${c} × ${d} = ${ans.toLocaleString()} rows.`
      };
    }
    case 3: {
      const base = pickInt(10, 40, 5), retries = [3, 4][pickInt(0, 1)];
      const ans = base * (Math.pow(2, retries) - 1);
      return {
        title: `Daily Challenge (${date}) · Airflow Exponential Backoff`,
        q: `An Airflow task has <b>retries = ${retries}</b>, initial <b>retry_delay = ${base}s</b>, and exponential backoff (×2 each retry). What is the total wait time (in seconds) if all retries fail?`,
        answer: ans,
        tol: 0,
        hint: `Sum the geometric series: ${[...Array(retries)].map((_,i)=>base*Math.pow(2,i)).join(" + ")}.`,
        explain: `Wait times: ${[...Array(retries)].map((_,i)=>base*Math.pow(2,i)+"s").join(" + ")} = ${ans} seconds.`
      };
    }
    case 4: {
      const parts = pickInt(12, 36, 4), cores = [4, 8][pickInt(0, 1)], sec = pickInt(3, 7, 1);
      const waves = Math.ceil(parts / cores), ans = waves * sec;
      return {
        title: `Daily Challenge (${date}) · PySpark Executor Core Waves`,
        q: `A PySpark stage has <b>${parts} partitions</b> (each taking <b>${sec}s</b>) on a cluster with <b>${cores} executor cores</b>. How many seconds does the stage take?`,
        answer: ans,
        tol: 0,
        hint: `Waves = ceil(${parts} / ${cores}) = ${waves}. Multiply by ${sec}s per wave.`,
        explain: `⌈${parts} / ${cores}⌉ = ${waves} waves × ${sec}s = ${ans} seconds.`
      };
    }
    case 5: {
      const maxTs = pickInt(1100, 1900, 20), L = pickInt(3, 12, 1);
      const ans = maxTs - L;
      return {
        title: `Daily Challenge (${date}) · Streaming Watermark Cutoff`,
        q: `A stream consumer has seen maximum event timestamp <b>${maxTs}s</b> and uses allowed lateness <b>L = ${L}s</b>. What is the watermark <b>W(t)</b>?`,
        answer: ans,
        tol: 0,
        hint: `Subtract allowed lateness ${L}s from ${maxTs}s.`,
        explain: `W(t) = ${maxTs} − ${L} = ${ans}s. Events with event_ts < ${ans}s are routed to late_events.jsonl.`
      };
    }
    default: {
      const diskMs = pickInt(120, 250, 10), infMs = pickInt(4, 10, 2), reqs = pickInt(100, 400, 50);
      const savedSec = +(((reqs - 1) * diskMs) / 1000).toFixed(2);
      return {
        title: `Daily Challenge (${date}) · FastAPI Startup Model Caching`,
        q: `Loading <code>model.joblib</code> takes <b>${diskMs} ms</b> and <code>predict()</code> takes <b>${infMs} ms</b>. Across <b>${reqs} requests</b>, how many <b>seconds</b> are saved by loading the model once at startup instead of per request? (up to 2 decimals)`,
        answer: savedSec,
        tol: 0.05,
        hint: `Loading once saves (${reqs} − 1) × ${diskMs} ms of redundant disk reads.`,
        explain: `Per-request load = ${reqs}×(${diskMs}+${infMs}) = ${reqs*(diskMs+infMs)} ms. Startup load = ${diskMs} + ${reqs}×${infMs} = ${diskMs + reqs*infMs} ms. Saved = ${(reqs-1)*diskMs} ms = ${savedSec}s.`
      };
    }
  }
};
