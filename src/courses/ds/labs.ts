/** DSC3103 — guided labs. Simulations mirror Labs 2–10, sample_qtn and dsc3103_test_02. */
import type { LabDef } from "@/lib/lab/types";
import { fmt } from "@/lib/utils";

const n = (v: unknown) => Number(v) || 0;
const pos = (v: unknown, min = 1) => Math.max(min, n(v));

export const labs: Record<string, LabDef> = {
  "data-cleaning": {
    intro:
      "Feed a dirty market-price batch through the cleaning funnel and watch where rows go. Then see, with real numbers, why one typo drags the mean but not the median — the reason we impute per commodity with the median.",
    sections: [
      {
        id: "funnel",
        title: "The cleaning funnel",
        blurb: "Rows lost to missing keys, then to duplicate business keys (date, market, commodity).",
        controls: [
          { kind: "range", id: "rows", label: "Raw rows ingested", min: 1000, max: 20000, step: 500, default: 5000 },
          { kind: "range", id: "missing", label: "Missing primary-key rate", min: 0, max: 25, default: 6, unit: "%" },
          { kind: "range", id: "dupes", label: "Duplicate business-key rate", min: 0, max: 30, default: 10, unit: "%" },
        ],
        derive: (v) => {
          const afterKey = Math.round(n(v.rows) * (1 - n(v.missing) / 100));
          const clean = Math.round(afterKey * (1 - n(v.dupes) / 100));
          return { afterKey, clean, retention: (100 * clean) / pos(v.rows) };
        },
        view: (v, d) => [
          {
            kind: "bars",
            items: [
              { label: "Raw", value: n(v.rows), display: fmt(n(v.rows)), tone: "neutral" },
              { label: "After dropping null keys", value: n(d.afterKey), display: fmt(n(d.afterKey)), tone: "warn" },
              { label: "After de-duplication (clean)", value: n(d.clean), display: fmt(n(d.clean)), tone: "good" },
            ],
          },
          { kind: "stats", items: [{ label: "Retention", value: `${n(d.retention).toFixed(1)}%`, tone: n(d.retention) < 75 ? "bad" : "good" }, { label: "Duplicates dropped", value: fmt(n(d.afterKey) - n(d.clean)) }] },
        ],
        code: `df = df.dropna(subset=["date", "market", "commodity"])
df = df.drop_duplicates(subset=["date", "market", "commodity"])
df["price_ugx"] = df.groupby("commodity")["price_ugx"].transform(lambda s: s.fillna(s.median()))`,
      },
      {
        id: "skew",
        title: "Tukey fences & the mean-vs-median trap",
        blurb: "Four honest maize prices [1800, 1900, 2000, 2100] plus one value you control.",
        controls: [
          { kind: "number", id: "q1", label: "Q1", default: 2200, step: 100, unit: "UGX" },
          { kind: "number", id: "q3", label: "Q3", default: 3400, step: 100, unit: "UGX" },
          { kind: "range", id: "outlier", label: "Fifth price (the typo)", min: 1500, max: 15000, step: 100, default: 9700, unit: "UGX" },
        ],
        derive: (v) => {
          const iqr = Math.max(0, n(v.q3) - n(v.q1));
          const sample = [1800, 1900, 2000, 2100, n(v.outlier)].sort((a, b) => a - b);
          const mean = sample.reduce((a, b) => a + b, 0) / 5;
          return { iqr, upper: n(v.q3) + 1.5 * iqr, lower: n(v.q1) - 1.5 * iqr, median: sample[2], mean, bias: mean - sample[2] };
        },
        view: (v, d) => [
          { kind: "result", label: "Tukey 1.5×IQR fences", value: `[${fmt(n(d.lower))}, ${fmt(n(d.upper))}] UGX`, work: `IQR = ${n(v.q3)} − ${n(v.q1)} = ${n(d.iqr)}\nupper = Q3 + 1.5·IQR = ${n(v.q3)} + ${1.5 * n(d.iqr)} = ${n(d.upper)}` },
          {
            kind: "stats",
            items: [
              { label: "Median", value: `${fmt(n(d.median))} UGX`, tone: "good" },
              { label: "Mean", value: `${fmt(Math.round(n(d.mean)))} UGX`, tone: n(d.bias) > 300 ? "bad" : "neutral" },
              { label: "Mean − median", value: `${fmt(Math.round(n(d.bias)))} UGX`, tone: n(d.bias) > 300 ? "bad" : "neutral" },
            ],
          },
          { kind: "note", text: n(d.bias) > 300 ? "One bad value moved the **mean** a lot; the **median** didn't budge. That's what “robust” means." : "With no extreme value, mean and median agree — skew is what separates them.", tone: n(d.bias) > 300 ? "warn" : "neutral" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-retention", prompt: "5,000 rows, 6% missing keys, then 10% duplicates removed. How many clean rows?", answer: 4230, tolerance: 0, unit: "rows", explain: "5,000 × 0.94 = 4,700 after the key check; 4,700 × 0.90 = 4,230. The rates compound — they don't simply add to 16%." },
      { kind: "goal", id: "g-retention", prompt: "Make retention drop below 70% — what kind of batch would that be?", hint: "Push both the missing-key and duplicate rates up.", check: (_, d) => n(d.retention) < 70 },
      { kind: "goal", id: "g-bias", prompt: "Find a fifth price that makes the mean exceed the median by more than 2,000 UGX.", hint: "Mean − median grows by 1/5 of every shilling you add to the outlier.", check: (_, d) => n(d.bias) > 2000 },
      { kind: "goal", id: "g-fence", prompt: "Set Q1 and Q3 so the upper fence is exactly 5,000 UGX.", hint: "Try Q1 = 2,000 and Q3 = 3,200.", check: (_, d) => n(d.upper) === 5000 },
      { kind: "explain", id: "e-median", prompt: "Using what you saw, explain why we impute missing prices with the per-commodity median and never edit data/raw/.", keywords: ["median", "robust", "outlier", "skew", "commodity", "immutable", "re-run", "reproducible"], idealAnswer: "Prices are skewed and differ by commodity, so a single typo or a different commodity pulls the mean far from the typical price, while the median of each commodity's own prices barely moves — it is robust. Raw data stays immutable so the pipeline is reproducible: if the cleaning logic has a bug, we fix it and re-run from the untouched source." },
    ],
    daily: (r, date) => {
      const q1 = r.int(1600, 2800, 200), iqr = r.int(800, 1800, 200), q3 = q1 + iqr, upper = q3 + 1.5 * iqr;
      return { title: `Tukey fence · ${date}`, question: `Today's batch has <b>Q1 = ${fmt(q1)} UGX</b> and <b>Q3 = ${fmt(q3)} UGX</b>. What is the upper Tukey fence (<code>Q3 + 1.5 × IQR</code>)?`, answer: upper, tolerance: 0, hint: `IQR = ${q3} − ${q1}.`, explanation: `IQR = ${iqr}. Upper fence = ${q3} + 1.5 × ${iqr} = ${upper} UGX.` };
    },
  },

  "pipelines-parquet": {
    intro: "Two of the biggest wins in data engineering, as numbers: how much less Parquet scans than CSV, and how many corrupt rows a non-idempotent load creates every time Airflow retries.",
    sections: [
      {
        id: "scan",
        title: "CSV vs Parquet: bytes scanned",
        controls: [
          { kind: "number", id: "mb", label: "CSV size", default: 240, unit: "MB" },
          { kind: "number", id: "cols", label: "Total columns", default: 10, min: 1 },
          { kind: "number", id: "qcols", label: "Columns the query needs", default: 2, min: 1 },
          { kind: "range", id: "ratio", label: "Parquet compression ratio", min: 1, max: 8, step: 0.5, default: 3, format: (x) => `${x.toFixed(1)}×` },
        ],
        derive: (v) => {
          const cols = pos(v.cols), q = Math.min(cols, pos(v.qcols));
          const scanned = (n(v.mb) * (q / cols)) / pos(v.ratio);
          return { scannedMb: scanned, ioSaving: n(v.mb) / Math.max(scanned, 1e-9) };
        },
        view: (v, d) => [
          { kind: "result", label: "DuckDB scans", value: `${n(d.scannedMb).toFixed(2)} MB (vs ${n(v.mb)} MB of CSV)`, work: `${n(v.mb)} MB × (${n(v.qcols)}/${n(v.cols)} columns) ÷ ${n(v.ratio)}× = ${n(d.scannedMb).toFixed(2)} MB → ${n(d.ioSaving).toFixed(1)}× less I/O` },
          { kind: "bars", items: [{ label: "CSV (row store) reads everything", value: n(v.mb), display: `${n(v.mb)} MB`, tone: "bad" }, { label: "Parquet (column pruning + compression)", value: n(d.scannedMb), max: n(v.mb), display: `${n(d.scannedMb).toFixed(1)} MB`, tone: "good" }] },
        ],
      },
      {
        id: "idem",
        title: "Idempotent upsert vs naive append",
        blurb: "A load task fails and Airflow retries it. What does the table look like afterwards?",
        controls: [
          { kind: "number", id: "base", label: "Rows already in the table", default: 10000 },
          { kind: "number", id: "batch", label: "Rows in this batch", default: 1500 },
          { kind: "number", id: "overlap", label: "Batch keys already present", default: 200 },
          { kind: "range", id: "runs", label: "Times the task runs (1 + retries)", min: 1, max: 10, default: 3 },
        ],
        derive: (v) => {
          const ov = Math.min(n(v.batch), n(v.overlap));
          const upsert = n(v.base) + n(v.batch) - ov;
          const append = n(v.base) + pos(v.runs) * n(v.batch);
          return { upsertRows: upsert, appendRows: append, corrupt: append - upsert };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Upsert (idempotent)", value: fmt(n(d.upsertRows)), tone: "good" }, { label: `Append ×${n(v.runs)}`, value: fmt(n(d.appendRows)), tone: "bad" }, { label: "Corrupt extra rows", value: fmt(n(d.corrupt)), tone: n(d.corrupt) ? "bad" : "good" }] },
          { kind: "note", text: `The upsert inserts ${fmt(n(v.batch) - Math.min(n(v.batch), n(v.overlap)))} new rows and updates ${fmt(Math.min(n(v.batch), n(v.overlap)))} existing keys — **no matter how many times it runs**. f(f(x)) = f(x).` },
        ],
        code: `INSERT OR REPLACE INTO market_prices SELECT * FROM staging;   -- keyed on (date, market, commodity)
# files: write to path.tmp, then os.replace(tmp, path)  (atomic)`,
      },
    ],
    tasks: [
      { kind: "predict", id: "p-scan", prompt: "A 12-column table; a query reads 2 columns. Before compression, how many times less data does Parquet read?", answer: 6, tolerance: 0, unit: "×", explain: "Column pruning reads 2 of 12 columns: 12 / 2 = 6× less. Compression then multiplies the saving." },
      { kind: "goal", id: "g-20x", prompt: "Find settings where Parquet reads at least 20× less than CSV.", hint: "Fewer queried columns and a higher compression ratio both help.", check: (_, d) => n(d.ioSaving) >= 20 },
      { kind: "goal", id: "g-corrupt", prompt: "Make the naive append create more than 10,000 corrupt rows.", hint: "Increase the retries or the batch size.", check: (_, d) => n(d.corrupt) > 10000 },
      { kind: "explain", id: "e-idem", prompt: "Explain idempotency and how you'd make both a file write and a database load idempotent.", keywords: ["same state", "retry", "duplicate", "append", "upsert", "primary key", "atomic", "os.replace", "partition"], idealAnswer: "A stage is idempotent if running it once or many times on the same input leaves storage in the same state. Plain append breaks this: each retry duplicates the batch. For files, write to a temp file then atomically os.replace it (or overwrite the date partition); for databases, enforce the business primary key and upsert (INSERT OR REPLACE) or delete-then-insert the partition in one transaction." },
    ],
    daily: (r, date) => {
      const mb = r.int(120, 480, 60), q = r.int(2, 5), cr = r.pick([2, 3, 4]);
      const ans = Math.round(((mb * (q / 10)) / cr) * 100) / 100;
      return { title: `Column pruning · ${date}`, question: `A <b>10-column</b> table is <b>${mb} MB</b> as CSV. Stored as Parquet with <b>${cr}×</b> compression, how many MB does DuckDB scan for a query on <b>${q} columns</b>?`, answer: ans, tolerance: 0.05, hint: `${mb} × (${q}/10) ÷ ${cr}.`, explanation: `${mb} × ${q}/10 = ${(mb * q) / 10} MB, ÷ ${cr} = ${ans} MB.` };
    },
  },

  "star-schemas": {
    intro: "Size a star schema from its grain, then break it on purpose: give a dimension duplicate keys and watch SUM() silently multiply — the fan trap.",
    sections: [
      {
        id: "grain",
        title: "Grain → fact table size",
        controls: [
          { kind: "number", id: "markets", label: "Markets", default: 8, min: 1 },
          { kind: "number", id: "commodities", label: "Commodities", default: 6, min: 1 },
          { kind: "number", id: "days", label: "Days", default: 90, min: 1 },
        ],
        derive: (v) => ({ factRows: n(v.markets) * n(v.commodities) * n(v.days), dimRows: n(v.markets) + n(v.commodities) + n(v.days) }),
        view: (v, d) => [
          { kind: "result", label: "fact_market_prices rows", value: fmt(n(d.factRows)), work: `grain = 1 row per (day, market, commodity)\n${n(v.markets)} × ${n(v.commodities)} × ${n(v.days)} = ${fmt(n(d.factRows))}` },
          { kind: "stats", items: [{ label: "Dimension rows in total", value: fmt(n(d.dimRows)) }, { label: "Fact : dimension ratio", value: `${Math.round(n(d.factRows) / pos(d.dimRows))} : 1` }] },
        ],
        code: `SELECT m.region, c.commodity_name, AVG(f.price_ugx)
FROM fact_market_prices f
JOIN dim_market m    ON f.market_key = m.market_key
JOIN dim_commodity c ON f.commodity_key = c.commodity_key
GROUP BY 1, 2;`,
      },
      {
        id: "fan",
        title: "The fan trap",
        blurb: "A fact row joins to every dimension row that shares its key.",
        controls: [
          { kind: "number", id: "price", label: "True observed price", default: 4000, step: 100, unit: "UGX" },
          { kind: "range", id: "dupKeys", label: "Rows in dim_market with that key", min: 1, max: 10, default: 3 },
        ],
        derive: (v) => ({ reportedSum: n(v.price) * pos(v.dupKeys), inflation: pos(v.dupKeys) }),
        view: (v, d) => [
          { kind: "stats", items: [{ label: "True value", value: `${fmt(n(v.price))} UGX`, tone: "good" }, { label: "Joined rows", value: n(v.dupKeys) }, { label: "SUM(price_ugx)", value: `${fmt(n(d.reportedSum))} UGX`, tone: n(v.dupKeys) > 1 ? "bad" : "good" }] },
          { kind: "note", text: n(v.dupKeys) > 1 ? `Fan trap: a non-unique dimension key multiplied the metric by **${n(v.dupKeys)}×** — with no error message.` : "Unique dimension key: one match, no distortion.", tone: n(v.dupKeys) > 1 ? "bad" : "good" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-grain", prompt: "5 markets × 4 commodities × 365 days with full coverage — how many fact rows?", answer: 7300, tolerance: 0, explain: "The grain multiplies: 5 × 4 × 365 = 7,300." },
      { kind: "goal", id: "g-million", prompt: "Design a warehouse whose fact table passes one million rows.", hint: "Days usually grow fastest — try several years.", check: (_, d) => n(d.factRows) >= 1_000_000 },
      { kind: "goal", id: "g-fan", prompt: "Create a fan trap that reports a SUM 5× too big.", hint: "Five dimension rows share the key.", check: (v) => n(v.dupKeys) === 5 },
      { kind: "explain", id: "e-grain", prompt: "What goes in a fact table vs a dimension table, and why must the grain be declared before writing SQL?", keywords: ["fact", "measure", "foreign key", "dimension", "descriptive", "grain", "fan", "double count"], idealAnswer: "Fact tables hold numeric measures (price_ugx, rainfall_mm) and foreign keys at one declared grain — here one row per day, market and commodity. Dimensions hold descriptive attributes used for filtering and grouping (region, category, month). Declaring the grain first keeps every measure at the same level of detail; mixing grains or joining non-unique dimension keys fans rows out and silently double-counts sums." },
    ],
    daily: (r, date) => {
      const m = r.int(4, 10), c = r.int(4, 8), d = r.int(30, 120, 15);
      return { title: `Fact grain · ${date}`, question: `A warehouse tracks <b>${m} markets</b>, <b>${c} commodities</b> and <b>${d} days</b> with full daily coverage. How many rows are in <code>fact_market_prices</code>?`, answer: m * c * d, tolerance: 0, hint: "Multiply the dimensions of the grain.", explanation: `${m} × ${c} × ${d} = ${fmt(m * c * d)} rows.` };
    },
  },

  airflow: {
    intro: "Configure retries the way you would for a flaky API, then lay out a DAG with a parallel branch and find its critical path — the thing that decides how long the run takes.",
    sections: [
      {
        id: "backoff",
        title: "Retry backoff",
        controls: [
          { kind: "range", id: "retries", label: "retries", min: 1, max: 8, default: 3 },
          { kind: "range", id: "delay", label: "retry_delay", min: 5, max: 120, step: 5, default: 20, unit: "s" },
          { kind: "toggle", id: "exp", label: "retry_exponential_backoff (×2 each time)", default: true },
        ],
        derive: (v) => {
          const waits = Array.from({ length: pos(v.retries) }, (_, i) => (v.exp ? n(v.delay) * 2 ** i : n(v.delay)));
          return { totalWait: waits.reduce((a, b) => a + b, 0), lastWait: waits[waits.length - 1], schedule: waits.join(" + ") };
        },
        view: (_, d) => [{ kind: "result", label: "Total waiting if every retry fails", value: `${fmt(n(d.totalWait))} s`, work: `${d.schedule} = ${n(d.totalWait)} s` }],
        code: `@task(retries=3, retry_delay=timedelta(seconds=20), retry_exponential_backoff=True)
def ingest(): ...`,
      },
      {
        id: "dag",
        title: "Critical path",
        blurb: "ingest → (validate_schema ∥ profile_stats) → clean_and_store",
        controls: [
          { kind: "number", id: "tIngest", label: "ingest", default: 12, unit: "s" },
          { kind: "number", id: "tValidate", label: "validate_schema", default: 8, unit: "s" },
          { kind: "number", id: "tProfile", label: "profile_stats", default: 25, unit: "s" },
          { kind: "number", id: "tStore", label: "clean + store", default: 25, unit: "s" },
        ],
        derive: (v) => {
          const crit = n(v.tIngest) + Math.max(n(v.tValidate), n(v.tProfile)) + n(v.tStore);
          const serial = n(v.tIngest) + n(v.tValidate) + n(v.tProfile) + n(v.tStore);
          return { critical: crit, serial, saved: serial - crit, bottleneck: n(v.tValidate) >= n(v.tProfile) ? "validate_schema" : "profile_stats" };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "Critical path", value: `${n(d.critical)} s`, tone: "accent" }, { label: "If run serially", value: `${n(d.serial)} s` }, { label: "Saved by parallelism", value: `${n(d.saved)} s`, tone: "good" }] },
          { kind: "note", text: `The slower branch (**${d.bottleneck}**) sets the pace. Speeding up the other branch saves nothing.` },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-backoff", prompt: "retries = 4, retry_delay = 10 s, exponential backoff. Total wait if all fail?", answer: 150, tolerance: 0, unit: "s", explain: "10 + 20 + 40 + 80 = 150 s = 10 × (2⁴ − 1)." },
      { kind: "goal", id: "g-wait", prompt: "Give ingest a retry budget of at least 10 minutes of total waiting.", hint: "600 s — exponential backoff gets there fast.", check: (_, d) => n(d.totalWait) >= 600 },
      { kind: "goal", id: "g-crit", prompt: "Make validate_schema the bottleneck branch.", hint: "It needs to take longer than profile_stats.", check: (_, d) => d.bottleneck === "validate_schema" },
      { kind: "explain", id: "e-retries", prompt: "Why should ingest get more retries than validate, and what happens downstream when validate fails?", keywords: ["transient", "network", "deterministic", "schema", "backoff", "upstream_failed", "downstream", "idempotent"], idealAnswer: "Ingest talks to networks and APIs whose failures are often transient, so retries with exponential backoff recover automatically. Validation runs deterministic checks on local data — a broken schema fails the same way every time, so retrying wastes time; it should fail fast. When validate fails, Airflow marks clean, store and report as upstream_failed, so bad data never reaches the warehouse. Because tasks can be retried, each must be idempotent." },
    ],
    daily: (r, date) => {
      const base = r.int(10, 40, 5), R = r.pick([3, 4]), ans = base * (2 ** R - 1);
      return { title: `Exponential backoff · ${date}`, question: `A task has <b>retries = ${R}</b>, <b>retry_delay = ${base}s</b> and exponential backoff. Total wait time if every retry fails?`, answer: ans, tolerance: 0, hint: "Sum base × 2^k for k = 0 … R−1.", explanation: `${Array.from({ length: R }, (_, i) => base * 2 ** i).join(" + ")} = ${ans} s.` };
    },
  },

  pyspark: {
    intro: "See how Spark turns partitions into waves of tasks, how much data a groupBy shuffles, and the exact point where .cache() stops costing you and starts paying off.",
    sections: [
      {
        id: "waves",
        title: "Partitions, cores & waves",
        controls: [
          { kind: "range", id: "parts", label: "Partitions", min: 1, max: 64, default: 20 },
          { kind: "range", id: "cores", label: "Executor cores", min: 1, max: 32, default: 8 },
          { kind: "number", id: "taskSec", label: "Seconds per task", default: 4, min: 1 },
          { kind: "number", id: "keys", label: "Distinct groupBy keys", default: 6, min: 1 },
        ],
        derive: (v) => {
          const waves = Math.ceil(pos(v.parts) / pos(v.cores));
          return { waves, stageSec: waves * pos(v.taskSec), shuffled: pos(v.parts) * pos(v.keys), idleSlots: waves * pos(v.cores) - pos(v.parts) };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "Waves", value: n(d.waves) }, { label: "Stage time", value: `${n(d.stageSec)} s`, tone: "accent" }, { label: "Idle core-slots in last wave", value: n(d.idleSlots), tone: n(d.idleSlots) ? "warn" : "good" }, { label: "Max rows shuffled (partial agg)", value: fmt(n(d.shuffled)) }] },
          { kind: "note", text: "Partial aggregation: each partition pre-aggregates, so at most partitions × keys rows cross the network in the shuffle." },
        ],
      },
      {
        id: "cache",
        title: "When does .cache() pay off?",
        controls: [
          { kind: "number", id: "uncached", label: "Uncached time per action", default: 3, step: 0.5, unit: "s" },
          { kind: "number", id: "build", label: "Extra cost to build the cache", default: 4.5, step: 0.5, unit: "s" },
          { kind: "number", id: "cachedRead", label: "Cached time per action", default: 0.5, step: 0.1, unit: "s" },
          { kind: "range", id: "actions", label: "Number of actions", min: 1, max: 10, default: 2 },
        ],
        derive: (v) => {
          const un = n(v.actions) * n(v.uncached);
          const ca = n(v.uncached) + n(v.build) + Math.max(0, n(v.actions) - 1) * n(v.cachedRead);
          return { uncachedTotal: un, cachedTotal: ca, cacheWins: ca < un };
        },
        view: (v, d) => [
          { kind: "bars", items: [{ label: "Without cache", value: n(d.uncachedTotal), display: `${n(d.uncachedTotal).toFixed(1)} s`, tone: d.cacheWins ? "bad" : "good" }, { label: "With cache", value: n(d.cachedTotal), display: `${n(d.cachedTotal).toFixed(1)} s`, tone: d.cacheWins ? "good" : "bad" }] },
          { kind: "note", text: d.cacheWins ? `Caching wins at ${n(v.actions)} actions.` : `Caching is **slower** at ${n(v.actions)} actions — exactly what we measured in Lab 8 (8.85 s cached vs 3.04 s).`, tone: d.cacheWins ? "good" : "warn" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-waves", prompt: "20 partitions on 8 cores, 4 s per task. How long does the stage take?", answer: 12, tolerance: 0, unit: "s", explain: "ceil(20 / 8) = 3 waves × 4 s = 12 s. The last wave uses only 4 of the 8 cores." },
      { kind: "goal", id: "g-nowaste", prompt: "Choose partitions and cores so no core sits idle in the last wave.", hint: "Partitions should be a multiple of cores.", check: (_, d) => n(d.idleSlots) === 0 },
      { kind: "goal", id: "g-cache", prompt: "Find the smallest number of actions where caching becomes faster (with the default timings).", hint: "Step the actions slider up one at a time.", check: (v, d) => !!d.cacheWins && n(v.uncached) === 3 && n(v.build) === 4.5 && n(v.cachedRead) === 0.5 && n(v.actions) === 3 },
      { kind: "explain", id: "e-spark", prompt: "Narrow vs wide transformations — and why DuckDB beat Spark and .cache() slowed things down on our 10,000-row dataset.", keywords: ["narrow", "wide", "shuffle", "partition", "network", "lazy", "action", "jvm", "overhead", "materialise"], idealAnswer: "Narrow transformations (filter, withColumn) work inside each partition with no data movement; wide ones (groupBy, join) need a shuffle that hashes, writes and sends data across the network. On 10,000 rows the fixed costs — JVM start-up, Catalyst planning, task scheduling and shuffles — dwarf the actual work, so single-node DuckDB wins. .cache() only pays off when the cached DataFrame is reused by enough actions to amortise materialising it; with two actions the build cost exceeded the savings." },
    ],
    daily: (r, date) => {
      const P = r.int(12, 36, 4), C = r.pick([4, 8]), s = r.int(3, 7), w = Math.ceil(P / C);
      return { title: `Executor waves · ${date}`, question: `A stage has <b>${P} partitions</b> (each <b>${s}s</b>) on <b>${C} executor cores</b>. How many seconds does it take?`, answer: w * s, tolerance: 0, hint: "Waves = ceil(partitions / cores).", explanation: `⌈${P}/${C}⌉ = ${w} waves × ${s}s = ${w * s}s.` };
    },
  },

  streaming: {
    intro: "Play the stream consumer: decide which window an event lands in, or whether it's already too late — then account for every event that came in.",
    sections: [
      {
        id: "router",
        title: "Watermark router",
        controls: [
          { kind: "number", id: "maxTs", label: "Max event_ts seen so far", default: 1240, unit: "s" },
          { kind: "range", id: "lateness", label: "Allowed lateness L", min: 0, max: 30, default: 5, unit: "s" },
          { kind: "select", id: "window", label: "Window size", default: "10", options: [{ value: "5", label: "5 s" }, { value: "10", label: "10 s" }, { value: "30", label: "30 s" }] },
          { kind: "range", id: "eventTs", label: "Incoming event_ts", min: 1200, max: 1260, step: 0.5, default: 1238, unit: "s" },
        ],
        derive: (v) => {
          const W = pos(v.window), wm = n(v.maxTs) - n(v.lateness), ev = n(v.eventTs);
          const start = Math.floor(ev / W) * W;
          return { watermark: wm, late: ev < wm, windowStart: start, windowEnd: start + W };
        },
        view: (v, d) => [
          { kind: "result", label: "Decision", value: d.late ? "LATE → late_events.jsonl" : `ACCEPT → window [${n(d.windowStart)}, ${n(d.windowEnd)})`, tone: d.late ? "bad" : "good", work: `W(t) = max_ts − L = ${n(v.maxTs)} − ${n(v.lateness)} = ${n(d.watermark)} s\nevent_ts ${n(v.eventTs)} ${d.late ? "<" : "≥"} ${n(d.watermark)}` },
          { kind: "note", text: `Windows ending at or before ${n(d.watermark)} s are final and have been emitted.` },
        ],
        code: `watermark = max_event_ts - allowed_lateness
if event_id in seen_ids:      route_to("duplicates")
elif event_ts < watermark:    route_to("late_events.jsonl")
else:                         windows[(int(event_ts) // 10) * 10].add(event)`,
      },
      {
        id: "accounting",
        title: "Stream accounting",
        controls: [
          { kind: "number", id: "emitted", label: "Events emitted", default: 250 },
          { kind: "number", id: "dupes", label: "Duplicate retries", default: 18 },
          { kind: "number", id: "lateN", label: "Late events", default: 12 },
        ],
        derive: (v) => ({ valid: Math.max(0, n(v.emitted) - n(v.dupes) - n(v.lateN)) }),
        view: (v, d) => [{ kind: "stats", items: [{ label: "Windowed (valid)", value: n(d.valid), tone: "good" }, { label: "Dropped duplicates", value: n(v.dupes) }, { label: "Late side-output", value: n(v.lateN), tone: "warn" }] }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-wm", prompt: "max_ts = 1,240 s and L = 5 s. What is the watermark — and is an event at 1,233 s on time?", answer: 1235, tolerance: 0, unit: "s", explain: "W = 1,240 − 5 = 1,235 s. 1,233 < 1,235, so that event is late: its window was already finalised." },
      { kind: "goal", id: "g-late", prompt: "Route an event to late_events.jsonl.", hint: "Drag event_ts below the watermark.", check: (_, d) => d.late === true },
      { kind: "goal", id: "g-save", prompt: "Keep event_ts = 1,233 s but change one setting so it's accepted.", hint: "How much lateness do you need to allow?", check: (v, d) => n(v.eventTs) === 1233 && d.late === false },
      { kind: "explain", id: "e-watermark", prompt: "Explain event time vs processing time and how a watermark decides when a window is final.", keywords: ["event time", "processing time", "out of order", "watermark", "allowed lateness", "finalise", "late", "duplicate", "seen_ids"], idealAnswer: "Event time is when the observation happened; processing time is when our server received it. Mobile networks deliver events late and out of order, so we bucket by event time into tumbling windows [floor(ts/10)·10, +10). The watermark W(t) = max_event_ts − L claims no earlier events are still expected; once W passes a window's end, the window is finalised and emitted. Events older than the watermark go to late_events, and a seen_ids set drops duplicate retries first." },
    ],
    daily: (r, date) => {
      const mx = r.int(1100, 1900, 20), L = r.int(3, 12);
      return { title: `Watermark · ${date}`, question: `A consumer has seen max event time <b>${mx}s</b> with allowed lateness <b>L = ${L}s</b>. What is the watermark?`, answer: mx - L, tolerance: 0, hint: "W(t) = max_event_ts − L.", explanation: `${mx} − ${L} = ${mx - L}s. Events before ${mx - L}s go to late_events.jsonl.` };
    },
  },

  "model-serving": {
    intro: "Reproduce the Step 8 bug from Lab 9.2 — a feature threshold that differs between training and serving — and measure what loading the model per request really costs.",
    sections: [
      {
        id: "skew",
        title: "Training-serving skew",
        blurb: "Training used is_rainy = rainfall_mm > 5.0. A copy-pasted API used > 10.0.",
        controls: [{ kind: "range", id: "rain", label: "rainfall_mm in the request", min: 0, max: 20, step: 0.2, default: 3, unit: "mm" }],
        derive: (v) => {
          const a = n(v.rain) > 5 ? 1 : 0, b = n(v.rain) > 10 ? 1 : 0;
          const truth = 2889.58 + a * 37.67, served = 2889.58 + b * 37.67;
          return { trainPred: truth, servedPred: served, drift: Math.abs(truth - served), skewActive: truth !== served };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Shared features.py", value: `${n(d.trainPred).toFixed(2)} UGX`, tone: "good" }, { label: "Skewed API (> 10 mm)", value: `${n(d.servedPred).toFixed(2)} UGX`, tone: d.skewActive ? "bad" : "neutral" }, { label: "Silent error", value: `${n(d.drift).toFixed(2)} UGX`, tone: d.skewActive ? "bad" : "good" }] },
          { kind: "note", text: d.skewActive ? `At ${n(v.rain).toFixed(1)} mm the API says is_rainy = 0 but training said 1. HTTP 200, valid JSON — and the wrong price.` : "Both thresholds agree here, which is exactly why this bug hides until rainfall lands between 5 and 10 mm.", tone: d.skewActive ? "bad" : "neutral" },
        ],
        code: `# src/common/features.py — imported by BOTH train.py and api/main.py
FEATURE_COLUMNS = [...]
def make_features(df): df["is_rainy"] = (df["rainfall_mm"] > 5.0).astype(int); ...`,
      },
      {
        id: "loading",
        title: "Load once at startup vs per request",
        controls: [
          { kind: "number", id: "loadMs", label: "Loading model.joblib", default: 150, unit: "ms" },
          { kind: "number", id: "inferMs", label: "predict()", default: 5, unit: "ms" },
          { kind: "number", id: "requests", label: "Requests", default: 200, min: 1 },
        ],
        derive: (v) => {
          const per = pos(v.requests) * (n(v.loadMs) + n(v.inferMs)), once = n(v.loadMs) + pos(v.requests) * n(v.inferMs);
          return { perRequestSec: per / 1000, startupSec: once / 1000, speedup: per / Math.max(once, 1e-9) };
        },
        view: (_, d) => [{ kind: "result", label: "Total serving time", value: `${n(d.startupSec).toFixed(2)} s vs ${n(d.perRequestSec).toFixed(2)} s`, work: `load once: T = load + N·infer\nper request: T = N·(load + infer)\n→ ${n(d.speedup).toFixed(1)}× faster`, tone: "good" }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-load", prompt: "Load = 150 ms, predict = 5 ms, 200 requests. Seconds saved by loading once at startup?", answer: 29.85, tolerance: 0.05, unit: "s", explain: "You avoid 199 extra loads: 199 × 150 ms = 29,850 ms = 29.85 s." },
      { kind: "goal", id: "g-skew", prompt: "Find a rainfall value that triggers the silent skew.", hint: "Anywhere strictly between the two thresholds.", check: (_, d) => d.skewActive === true },
      { kind: "goal", id: "g-speed", prompt: "Make startup loading at least 30× faster than per-request loading.", hint: "Slow loads, fast predictions, lots of requests.", check: (_, d) => n(d.speedup) >= 30 },
      { kind: "explain", id: "e-skew", prompt: "What is training-serving skew, how did Step 8 show it, and what architecture prevents it?", keywords: ["training-serving skew", "features", "shared module", "make_features", "threshold", "silent", "pydantic", "docker", "pinned"], idealAnswer: "Training-serving skew is when feature logic at inference differs from training. In Step 8, changing is_rainy from rainfall > 5 to > 10 shifted the beans prediction for 8.2 mm from 2,927.25 to 2,889.58 UGX with no error at all. Prevent it by putting make_features() and FEATURE_COLUMNS in one shared module imported by both training and the API, validating requests with strict Pydantic schemas, loading the model once at startup, and shipping the exact pinned environment in Docker." },
    ],
    daily: (r, date) => {
      const disk = r.int(120, 250, 10), inf = r.int(4, 10, 2), reqs = r.int(100, 400, 50);
      const saved = Math.round(((reqs - 1) * disk) / 10) / 100;
      return { title: `Startup caching · ${date}`, question: `Loading <code>model.joblib</code> takes <b>${disk} ms</b>, <code>predict()</code> takes <b>${inf} ms</b>. Over <b>${reqs} requests</b>, how many seconds does loading once at startup save?`, answer: saved, tolerance: 0.05, hint: "You avoid (N − 1) loads.", explanation: `(${reqs} − 1) × ${disk} ms = ${(reqs - 1) * disk} ms = ${saved} s.` };
    },
  },

  "milk-validation": {
    intro: "Run clean_milk() from the practice question with your own batch, check the row-conservation invariant, and see how rule ordering decides whether ' mbarara ' is a valid delivery.",
    sections: [
      {
        id: "conservation",
        title: "Row conservation",
        controls: [
          { kind: "number", id: "raw", label: "Raw rows", default: 500 },
          { kind: "number", id: "exact", label: "Exact duplicate copies", default: 14 },
          { kind: "number", id: "collisions", label: "Colliding record_ids (2 rows each)", default: 6 },
          { kind: "number", id: "domain", label: "Domain errors (bad litres / dates)", default: 24 },
        ],
        derive: (v) => {
          const rejected = n(v.collisions) * 2 + n(v.domain);
          const kept = Math.max(0, n(v.raw) - n(v.exact) - rejected);
          return { kept, rejected, conserved: kept + rejected + n(v.exact) === n(v.raw) };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "clean_df", value: n(d.kept), tone: "good" }, { label: "rejected_df", value: n(d.rejected), tone: "warn" }, { label: "Exact removed", value: n(v.exact) }, { label: "Invariant", value: d.conserved ? "✓ holds" : "✗ broken", tone: d.conserved ? "good" : "bad" }] },
          { kind: "note", text: `rows_in (${n(v.raw)}) = kept (${n(d.kept)}) + rejected (${n(d.rejected)}) + exact duplicates (${n(v.exact)})` },
        ],
        code: `exact = df.duplicated(keep="first")
df = df[~exact]
collision = df.duplicated(subset=["record_id"], keep=False)   # BOTH rows
rejected = pd.concat([df[collision].assign(reason="record_id_collision"), ...])
assert rows_in == len(clean_df) + len(rejected_df) + exact.sum()`,
      },
      {
        id: "ordering",
        title: "Tidy first, then validate",
        controls: [
          { kind: "range", id: "untidy", label: "Deliveries with messy centre text (' mbarara ', 'MBARARA')", min: 0, max: 100, step: 5, default: 45 },
          { kind: "select", id: "order", label: "Pipeline order", default: "validate-first", options: [{ value: "validate-first", label: "rule_unknown_centre → tidy" }, { value: "tidy-first", label: "tidy (strip().title()) → rule_unknown_centre" }] },
        ],
        derive: (v) => {
          const genuine = 9;
          const rejectedRows = v.order === "tidy-first" ? genuine : genuine + n(v.untidy);
          return { centreRejections: rejectedRows, wronglyRejected: rejectedRows - genuine };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "Rejected as unknown centre", value: n(d.centreRejections) }, { label: "…of which actually valid", value: n(d.wronglyRejected), tone: n(d.wronglyRejected) ? "bad" : "good" }] },
          { kind: "note", text: n(d.wronglyRejected) ? "Validating before tidying rejects farmers whose only 'error' was whitespace or capitals." : "Tidying first: only the 9 genuinely unknown centres are rejected.", tone: n(d.wronglyRejected) ? "bad" : "good" },
        ],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-clean", prompt: "500 raw rows, 14 exact duplicates, 6 colliding record_ids, 24 domain errors. How many rows in clean_df?", answer: 450, tolerance: 0, explain: "Collisions reject both rows: 6 × 2 = 12. 500 − 14 − 12 − 24 = 450." },
      { kind: "goal", id: "g-order", prompt: "Fix the pipeline so no valid delivery is wrongly rejected.", hint: "Change the order of the steps.", check: (_, d) => n(d.wronglyRejected) === 0 },
      { kind: "goal", id: "g-reject", prompt: "Make rejected_df bigger than clean_df.", hint: "Lots of collisions or domain errors.", check: (_, d) => n(d.rejected) > n(d.kept) },
      { kind: "explain", id: "e-collision", prompt: "Why are both rows of a record_id collision rejected, while an exact duplicate keeps one copy?", keywords: ["exact duplicate", "collision", "different values", "both", "rejected_df", "guess", "payout", "audit", "conservation"], idealAnswer: "An exact duplicate is the same record saved twice, so keeping one copy loses nothing. A record_id collision is two different records claiming the same id — say 45 L and 120 L — and we can't know which is true. Keeping the first silently guesses and can corrupt a farmer's payout, so both rows go to rejected_df with reason record_id_collision for a human to audit, and the row-conservation assert proves nothing was lost." },
    ],
    daily: (r, date) => {
      const raw = r.int(300, 800, 50), ex = r.int(8, 20, 2), col = r.int(3, 10), dom = r.int(15, 35);
      const clean = raw - ex - col * 2 - dom;
      return { title: `Row conservation · ${date}`, question: `A batch has <b>${raw} rows</b>: <b>${ex} exact duplicates</b>, <b>${col} colliding record_ids</b> (2 rows each) and <b>${dom} domain errors</b>. How many rows end up in <code>clean_df</code>?`, answer: clean, tolerance: 0, hint: "Collisions reject both rows.", explanation: `${raw} − ${ex} − ${col * 2} − ${dom} = ${clean}.` };
    },
  },

  "milk-warehouse": {
    intro: "Rebuild the Test 02 warehouse decisions: what an inner join does to unregistered farmers, why capacity needs a two-stage aggregation, and how month partitioning prunes a query.",
    sections: [
      {
        id: "unknown",
        title: "Unregistered farmers",
        blurb: "milk_clean.parquet has 20,000 deliveries; 294 farmers are registered.",
        controls: [
          { kind: "range", id: "unregFarmers", label: "Farmers missing from farmers.csv", min: 0, max: 12, default: 6 },
          { kind: "range", id: "perFarmer", label: "Average deliveries per farmer", min: 50, max: 90, default: 68 },
          { kind: "select", id: "join", label: "How fact_delivery is built", default: "inner", options: [{ value: "inner", label: "INNER JOIN dim_farmer" }, { value: "left", label: "LEFT JOIN, keep NULL key" }, { value: "unknown", label: "Unknown member (key 0) + COALESCE" }] },
        ],
        derive: (v) => {
          const unmatched = n(v.unregFarmers) * n(v.perFarmer);
          const rows = v.join === "inner" ? 20000 - unmatched : 20000;
          return { unmatched, factRows: rows, nullKeys: v.join === "left" ? unmatched : 0, lost: 20000 - rows };
        },
        view: (_, d) => [
          { kind: "stats", items: [{ label: "fact_delivery rows", value: fmt(n(d.factRows)), tone: n(d.lost) ? "bad" : "good" }, { label: "Rows lost", value: fmt(n(d.lost)), tone: n(d.lost) ? "bad" : "good" }, { label: "NULL farmer_key", value: fmt(n(d.nullKeys)), tone: n(d.nullKeys) ? "bad" : "good" }] },
          { kind: "note", text: n(d.lost) ? "An inner join silently deletes every delivery from an unregistered farmer — and their litres from every total." : n(d.nullKeys) ? "Rows survive but NULL keys break referential integrity and GROUP BYs." : "Kimball's answer: every delivery kept, zero NULL keys.", tone: n(d.lost) || n(d.nullKeys) ? "bad" : "good" },
        ],
        code: `-- dim_farmer gets an explicit Unknown member
SELECT 0 AS farmer_key, -1 AS farmer_id, 'Unknown' AS farmer_name UNION ALL SELECT ... FROM farmers;
-- fact_delivery keeps every row
SELECT COALESCE(f.farmer_key, 0) AS farmer_key, ... FROM milk m LEFT JOIN dim_farmer f USING (farmer_id);`,
      },
      {
        id: "capacity",
        title: "days_over_capacity",
        blurb: "capacity_litres is a DAILY limit per centre. Biggest single delivery in the data: 46.8 L.",
        controls: [
          { kind: "select", id: "centre", label: "Centre", default: "Kiruhura", options: ["Kiruhura", "Masaka", "Mbale", "Gulu", "Mbarara"].map((c) => ({ value: c, label: c })) },
          { kind: "select", id: "agg", label: "Query", default: "row", options: [{ value: "row", label: "WHERE litres > capacity (row by row)" }, { value: "daily", label: "CTE: SUM(litres) per (centre, date) first" }] },
        ],
        derive: (v) => {
          const T: Record<string, [number, number, number]> = { Kiruhura: [950, 41, 1203.5], Masaka: [750, 36, 997], Mbale: [400, 32, 702], Gulu: [300, 28, 471.8], Mbarara: [750, 23, 989.6] };
          const [cap, days, peak] = T[String(v.centre)] ?? T.Kiruhura;
          return { capacity: cap, daysOver: v.agg === "daily" ? days : 0, peakDay: peak };
        },
        view: (v, d) => [
          { kind: "stats", items: [{ label: "Capacity", value: `${n(d.capacity)} L/day` }, { label: "Days over capacity", value: n(d.daysOver), tone: v.agg === "daily" ? "good" : "bad" }, { label: "Peak day", value: `${n(d.peakDay)} L` }] },
          { kind: "note", text: v.agg === "daily" ? `${v.centre} went over on ${n(d.daysOver)} of 184 days.` : "Zero — because no single delivery is anywhere near a whole day's capacity. The query answers the wrong question.", tone: v.agg === "daily" ? "good" : "bad" },
        ],
        code: `WITH daily AS (
  SELECT centre_key, date_key, SUM(litres) AS daily_litres FROM fact_delivery GROUP BY 1, 2)
SELECT c.centre_name, COUNT(*) AS days_over_capacity
FROM daily d JOIN dim_centre c USING (centre_key)
WHERE d.daily_litres > c.capacity_litres GROUP BY 1;`,
      },
      {
        id: "partition",
        title: "Partition pruning",
        controls: [{ kind: "select", id: "filter", label: "Query filter on fact_delivery (partitioned by month)", default: "none", options: [{ value: "april", label: "WHERE month = '2026-04'" }, { value: "farmer", label: "WHERE farmer_key = 17" }, { value: "none", label: "(no filter)" }] }],
        derive: (v) => ({ partitionsScanned: v.filter === "april" ? 1 : 6, rowsScanned: v.filter === "april" ? 3201 : 20000 }),
        view: (_, d) => [{ kind: "stats", items: [{ label: "Partitions scanned", value: `${n(d.partitionsScanned)} of 6`, tone: n(d.partitionsScanned) === 1 ? "good" : "warn" }, { label: "Rows scanned", value: fmt(n(d.rowsScanned)) }] }],
      },
    ],
    tasks: [
      { kind: "predict", id: "p-lost", prompt: "6 unregistered farmers made 408 deliveries. How many fact rows survive an INNER JOIN to dim_farmer?", answer: 19592, tolerance: 0, explain: "20,000 − 408 = 19,592 — 2% of the data silently disappears." },
      { kind: "goal", id: "g-keep", prompt: "Build fact_delivery with all 20,000 rows and zero NULL keys.", hint: "One of the three join strategies does both.", check: (v, d) => v.join === "unknown" && n(d.factRows) === 20000 },
      { kind: "goal", id: "g-cap", prompt: "Get the correct days_over_capacity for Masaka.", hint: "Aggregate per day before comparing to capacity.", check: (v, d) => v.centre === "Masaka" && n(d.daysOver) === 36 },
      { kind: "goal", id: "g-prune", prompt: "Write a filter that scans only one partition.", hint: "Filter on the partition column.", check: (_, d) => n(d.partitionsScanned) === 1 },
      { kind: "explain", id: "e-unknown", prompt: "How do you keep unregistered farmers in the warehouse, and why does days_over_capacity need a CTE?", keywords: ["unknown member", "farmer_key = 0", "coalesce", "left join", "null", "daily", "sum", "cte", "capacity"], idealAnswer: "Add an Unknown member row (farmer_key 0, farmer_id −1, 'Unknown') to dim_farmer and build the fact with a LEFT JOIN plus COALESCE(f.farmer_key, 0): all 20,000 deliveries survive with no NULL keys. capacity_litres is a daily limit, so first SUM(litres) per (centre, date) in a CTE, then count days where the daily total exceeds capacity — comparing single deliveries (max 46.8 L) to a daily limit always returns zero." },
    ],
    daily: (r, date) => {
      const unreg = r.pick([4, 5, 6, 7]), avg = r.int(60, 75), lost = unreg * avg;
      return { title: `Unknown members · ${date}`, question: `Out of <b>20,000</b> deliveries, <b>${unreg} farmers</b> are missing from <code>farmers.csv</code>, averaging <b>${avg} deliveries</b> each. With <code>COALESCE(f.farmer_key, 0)</code>, how many deliveries link to a registered farmer (<code>farmer_key &gt; 0</code>)?`, answer: 20000 - lost, tolerance: 0, hint: `Unregistered deliveries = ${unreg} × ${avg}.`, explanation: `20,000 − ${lost} = ${20000 - lost}. The ${lost} others map to farmer_key = 0.` };
    },
  },
};
