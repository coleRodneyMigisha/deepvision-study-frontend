/* =====================================================================
   COURSE REGISTRY & DAILY SEEDED CHALLENGE ENGINE
   To add a new course unit:
     1. Create `courses/<course_id>.js` exporting `window.COURSE_<ID>`
     2. Add `<script src="courses/<course_id>.js"></script>` in `index.html`
     3. Append `window.COURSE_<ID>` to `window.STUDY_COURSES` below.
   ===================================================================== */
window.STUDY_COURSES = [
  window.COURSE_CV,
  window.COURSE_DS,
  window.COURSE_AI
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

  /* AI Model Deployment & Scaling (CSC3119) daily seeded generator */
  if (courseId === "ai") {
    switch (labIndex) {
      case 0: {
        const n = pickInt(2000, 6000, 500);
        const p = pickInt(4, 8, 1);
        const recallPct = pickInt(75, 92, 1);
        const totalStroke = Math.round(n * (p / 100));
        const caught = Math.round(totalStroke * (recallPct / 100));
        const missedFN = totalStroke - caught;
        return {
          title: `Daily Challenge (${date}) · Clinical False Negative Triage Gate`,
          q: `In a screening cohort of <b>${n.toLocaleString()} patients</b> with <b>${p}% stroke prevalence</b>, a model achieves <b>${recallPct}% recall</b>. Exactly how many stroke patients are missed as <b>False Negatives (FN)</b>?`,
          answer: missedFN,
          tol: 0,
          hint: `Total stroke cases = ${n} × ${p}% = ${totalStroke}. Caught = ${totalStroke} × ${recallPct}%. Subtract caught from total.`,
          explain: `Stroke cases = ${n} × ${p/100} = ${totalStroke}. Caught TP = round(${totalStroke} × ${recallPct/100}) = ${caught}. Missed FN = ${totalStroke} − ${caught} = ${missedFN} patients.`
        };
      }
      case 1: {
        const trees = pickInt(100, 400, 50);
        const mbPerTree = +(pickInt(20, 60, 5) / 100).toFixed(2);
        const uncompressed = +(trees * mbPerTree).toFixed(1);
        const compRatio = [2, 3, 4][pickInt(0, 2)];
        const compressed = +(uncompressed / compRatio).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Joblib Compression Savings`,
          q: `An ensemble of <b>${trees} trees</b> averages <b>${mbPerTree} MB</b> of NumPy leaf arrays per tree (total <b>${uncompressed} MB</b>). Saved using <code>joblib.dump(compress=${compRatio})</code> with a <b>${compRatio}× compression ratio</b>, what is the final file size in <b>MB</b>? (2 decimals)`,
          answer: compressed,
          tol: 0.05,
          hint: `Divide total size ${uncompressed} MB by compression ratio ${compRatio}.`,
          explain: `${uncompressed} MB / ${compRatio} = ${compressed} MB.`
        };
      }
      case 2: {
        const qps = pickInt(40, 200, 20);
        const latMs = pickInt(15, 60, 5);
        const conc = +((qps * latMs) / 1000).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Little's Law API Concurrency`,
          q: `A FastAPI model endpoint receives <b>${qps} requests/sec</b> (throughput λ) with an average response time of <b>${latMs} ms</b> (latency W). According to <b>Little's Law (L = λ × W)</b>, what is the average number of concurrent requests in flight? (2 decimals)`,
          answer: conc,
          tol: 0.05,
          hint: `Convert latency to seconds (${latMs}/1000 = ${latMs/1000}s) and multiply by ${qps} req/s.`,
          explain: `L = λ × W = ${qps} × (${latMs}/1000) = ${qps} × ${latMs/1000} = ${conc} concurrent requests.`
        };
      }
      case 3: {
        const onDemand = +(pickInt(18, 48, 2) / 10).toFixed(2); // e.g. $2.40/hr
        const disc = [70, 75, 80][pickInt(0, 2)];
        const hours = pickInt(12, 36, 4);
        const spotRate = +(onDemand * (1 - disc / 100)).toFixed(3);
        const total = +(spotRate * hours).toFixed(2);
        return {
          title: `Daily Challenge (${date}) · Cloud Spot Retraining Cost`,
          q: `An On-Demand GPU instance costs <b>$${onDemand}/hour</b>. Running a retraining job on Spot instances with a <b>${disc}% discount</b> takes <b>${hours} hours</b>. What is the total cloud cost in <b>USD ($)</b>? (2 decimals)`,
          answer: total,
          tol: 0.1,
          hint: `Spot rate = $${onDemand} × (1 − ${disc/100}) = $${spotRate}/hr. Multiply by ${hours} hours.`,
          explain: `Hourly spot rate = $${onDemand} × ${(100-disc)/100} = $${spotRate}. Total for ${hours} hrs = ${hours} × $${spotRate} = $${total}.`
        };
      }
      case 4: {
        const unopt = pickInt(900, 1400, 50);
        const slim = pickInt(130, 180, 10);
        const pct = +(((unopt - slim) / unopt) * 100).toFixed(1);
        return {
          title: `Daily Challenge (${date}) · Multi-Stage Docker Shrinkage`,
          q: `A single-stage Docker image retaining build tools is <b>${unopt} MB</b>. Switching to a multi-stage build on <code>python:3.11-slim</code> reduces image size to <b>${slim} MB</b>. By what <b>percentage (%)</b> was the image size reduced? (1 decimal)`,
          answer: pct,
          tol: 0.2,
          hint: `Reduction % = ((${unopt} − ${slim}) / ${unopt}) × 100.`,
          explain: `(${unopt} − ${slim}) / ${unopt} = ${unopt - slim} / ${unopt} = ${pct}%.`
        };
      }
      case 5: {
        const totalQps = pickInt(100, 300, 25);
        const canaryPct = [5, 10, 15, 20][pickInt(0, 3)];
        const durationSec = 600; // 10 minutes
        const canaryQps = (totalQps * canaryPct) / 100;
        const totalCanaryReqs = canaryQps * durationSec;
        const errPct = +(pickInt(20, 60, 5) / 10).toFixed(1); // e.g. 3.5%
        const errCount = Math.round(totalCanaryReqs * (errPct / 100));
        return {
          title: `Daily Challenge (${date}) · Canary Error Budget Breach`,
          q: `A gateway routes <b>${canaryPct}%</b> of <b>${totalQps} total QPS</b> to a Canary model v2. Over a <b>10-minute window (600s)</b>, Canary experiences an error rate of <b>${errPct}%</b>. Exactly how many <b>HTTP 5xx error responses</b> did the Canary generate?`,
          answer: errCount,
          tol: 1,
          hint: `Canary traffic = ${totalQps} × ${canaryPct}% = ${canaryQps} QPS. Total Canary reqs in 600s = ${totalCanaryReqs}. Multiply by ${errPct}%.`,
          explain: `Canary QPS = ${canaryQps}. In 600s: ${canaryQps} × 600 = ${totalCanaryReqs} requests. Errors = ${totalCanaryReqs} × (${errPct}/100) = ${errCount} errors.`
        };
      }
      case 6: {
        const paramsM = pickInt(24, 96, 8);
        const fp32Bytes = paramsM * 4;
        const int8Bytes = paramsM * 1;
        const savedMb = fp32Bytes - int8Bytes;
        return {
          title: `Daily Challenge (${date}) · INT8 Quantization DRAM Savings`,
          q: `A neural network model has <b>${paramsM} million parameters</b> in FP32 (4 bytes/parameter = ${fp32Bytes} MB). After INT8 quantization (1 byte/parameter), how many <b>MB of RAM</b> are saved?`,
          answer: savedMb,
          tol: 0,
          hint: `FP32 size = ${paramsM} × 4 = ${fp32Bytes} MB. INT8 size = ${paramsM} × 1 = ${int8Bytes} MB. Subtract.`,
          explain: `${fp32Bytes} MB (FP32) − ${int8Bytes} MB (INT8) = ${savedMb} MB saved (exactly 75% reduction).`
        };
      }
      case 7: {
        const expected = 0.10;
        const actual = +(pickInt(18, 30, 2) / 100).toFixed(2);
        const diff = actual - expected;
        const ratio = actual / expected;
        const psiContribution = +(diff * Math.log(ratio)).toFixed(4);
        return {
          title: `Daily Challenge (${date}) · Population Stability Index (PSI) Bin`,
          q: `In a patient age bin, baseline expected frequency is <b>E = ${expected.toFixed(2)}</b> (10%) and production actual frequency is <b>A = ${actual.toFixed(2)}</b> (${Math.round(actual*100)}%). What is this bin's contribution to the PSI (<code>(A − E) × ln(A / E)</code>)? (4 decimals)`,
          answer: psiContribution,
          tol: 0.001,
          hint: `Compute (${actual} − ${expected}) × ln(${actual} / ${expected}). Note: ln is the natural logarithm.`,
          explain: `(${actual} − ${expected}) × ln(${actual}/${expected}) = ${diff.toFixed(2)} × ln(${ratio.toFixed(2)}) = ${diff.toFixed(2)} × ${Math.log(ratio).toFixed(4)} = ${psiContribution}.`
        };
      }
      default: {
        const threshold1Recall = 0.65;
        const threshold2Recall = 0.88;
        const totalPositivePatients = pickInt(120, 280, 20);
        const additionalCaught = Math.round(totalPositivePatients * (threshold2Recall - threshold1Recall));
        return {
          title: `Daily Challenge (${date}) · Clinical Threshold Recall Gain`,
          q: `In an annual cohort containing <b>${totalPositivePatients} true stroke cases</b>, lowering the decision threshold from 0.50 to 0.22 increases clinical Recall from <b>65%</b> to <b>88%</b>. How many <b>additional stroke patients</b> receive life-saving preventative care?`,
          answer: additionalCaught,
          tol: 0,
          hint: `Recall delta = 88% − 65% = 23%. Multiply ${totalPositivePatients} × 0.23.`,
          explain: `Delta = 0.88 − 0.65 = 0.23. Additional patients = round(${totalPositivePatients} × 0.23) = ${additionalCaught} patients.`
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
    case 6: {
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
    case 7: {
      const raw = pickInt(300, 800, 50), exact = pickInt(8, 20, 2), colKeys = pickInt(3, 10, 1), dom = pickInt(15, 35, 1);
      const colRows = colKeys * 2;
      const clean = raw - exact - colRows - dom;
      return {
        title: `Daily Challenge (${date}) · Milk Row Conservation (sample_qtn)`,
        q: `A raw batch has <b>${raw} rows</b>. In <code>clean_milk()</code>, you drop <b>${exact} exact duplicates</b> (<code>keep='first'</code>), find <b>${colKeys} conflicting record_ids</b> (each with 2 rows = ${colRows} rows), and reject <b>${dom} domain errors</b>. How many rows remain in <code>clean_df</code>?`,
        answer: clean,
        tol: 0,
        hint: `Compute ${raw} − ${exact} − ${colRows} − ${dom}.`,
        explain: `Row conservation: ${raw} raw − ${exact} exact dupes − ${colRows} collision rows − ${dom} domain errors = ${clean} clean rows.`
      };
    }
    case 8: {
      const totalRaw = 20000;
      const unregFarmers = [4, 5, 6, 7][pickInt(0, 3)];
      const avgDeliveries = pickInt(60, 75, 1);
      const unregDeliveries = unregFarmers * avgDeliveries;
      const matched = totalRaw - unregDeliveries;
      return {
        title: `Daily Challenge (${date}) · Unregistered Farmer Mapping (dsc3103_test_02)`,
        q: `Out of <b>${totalRaw.toLocaleString()} milk deliveries</b>, <b>${unregFarmers} farmers</b> are not registered in <code>farmers.csv</code>, averaging <b>${avgDeliveries} deliveries each</b> (${unregDeliveries} total). In <code>fact_delivery</code> with <code>COALESCE(f.farmer_key, 0)</code>, how many deliveries successfully link to a registered farmer (<code>farmer_key &gt; 0</code>)?`,
        answer: matched,
        tol: 0,
        hint: `Subtract the ${unregDeliveries} unregistered deliveries from ${totalRaw.toLocaleString()}.`,
        explain: `${totalRaw.toLocaleString()} total − ${unregDeliveries} unlinked = ${matched.toLocaleString()} deliveries linked to registered farmers. All ${unregDeliveries} unlinked rows map cleanly to farmer_key = 0 ('Unknown').`
      };
    }
    default: {
      const cap = [750, 950, 400, 300][pickInt(0, 3)], days = pickInt(15, 45, 1);
      return {
        title: `Daily Challenge (${date}) · Cooperative Capacity Monitor`,
        q: `A milk cooperative cooling centre has a daily capacity of <b>${cap} L</b>. Over a 180-day season, daily volume exceeded capacity on <b>${days} days</b>. On how many days was the centre operating safely within or at its capacity?`,
        answer: 180 - days,
        tol: 0,
        hint: `Subtract ${days} from 180.`,
        explain: `180 − ${days} = ${180 - days} safe days.`
      };
    }
  }
};
