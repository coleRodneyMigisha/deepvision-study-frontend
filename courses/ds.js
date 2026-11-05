/* =====================================================================
   COURSE: DATA SCIENCE — SYSTEMS & TECHNOLOGIES (DSC3103)
   Built directly from the Uganda Market Price Monitoring Labs (Labs 2–10)
   ===================================================================== */
window.COURSE_DS = {
  id: "ds",
  code: "DSC3103",
  title: "Data Science: Systems & Technologies",
  shortTitle: "Data Science",
  subtitle: "9 modules · 9 interactive labs (incl. sample_qtn & Test 02) · 3 variations + AI daily challenges",
  syllabus: [
    {
      title: "Data Profiling, Validation & Cleaning",
      subtitle: "Turn messy field CSVs into a trusted analytical dataset (Lab 2)",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "Every real-world data system begins with untrusted raw data. In our Uganda market monitoring pipeline, field enumerators submit daily CSVs with missing prices, negative quantities, and duplicate market-commodity-date rows." },
        { time: 16, text: "Rule number one of data engineering: raw data is immutable. Never overwrite data/raw/market_prices_dirty.csv. Instead, profile it first, validate its contract, and write cleaned outputs to data/processed/." },
        { time: 32, text: "Data profiling measures shape, data types, null rates, cardinality, and quantiles before touching a single value. Validation then checks hard invariants: required columns, parseable ISO dates, and non-negative prices." },
        { time: 46, text: "Checkpoint: why should you impute missing prices using the per-commodity median rather than the global mean, and why must raw data remain read-only?" },
        { time: 66, text: "Agricultural prices are heavily right-skewed and differ wildly by commodity — beans at 3,800 UGX/kg vs maize at 1,800 UGX/kg. A global mean distorts both and is pulled up by extreme outliers; group-wise median is robust." },
        { time: 86, text: "During cleaning, we standardise strings, drop rows missing primary keys (date, market, commodity), deduplicate on the composite business key, and cap or filter impossible domain values like negative rainfall or prices." }
      ],
      checkpoint: {
        question: "Why should missing market prices be imputed using the per-commodity median rather than the overall dataset mean, and why is raw data kept strictly immutable?",
        hint: "Think about price skew/outliers across different commodities (beans vs maize), and what happens if a bug is discovered in your cleaning script two weeks later.",
        keywords: ["median", "skew", "outlier", "robust", "commodity", "group", "raw", "immutable", "reproducible", "re-run", "bug", "audit"],
        idealAnswer: "Market prices are skewed, contain extreme outliers, and vary across commodities (e.g., beans vs maize). Using a global mean mixes incompatible distributions and is sensitive to outliers, whereas the per-commodity median is robust and preserves each commodity's typical price level. Raw data must remain immutable so the pipeline is reproducible and auditable: if cleaning logic changes or has a bug, we can re-run from the untouched source CSV without permanent data loss."
      },
      terms: [
        ["Data profiling", "Inspecting row counts, types, null rates, uniqueness and distributions before cleaning."],
        ["Data contract", "Formal schema + domain rules (e.g. price_ugx > 0, rainfall_mm in [0, 500]) that data must pass."],
        ["Composite business key", "Columns that uniquely identify an observation: (date, market, commodity)."],
        ["IQR outlier rule", "Flag values outside [Q1 − 1.5·IQR, Q3 + 1.5·IQR], where IQR = Q3 − Q1."],
        ["Immutability of raw", "Never mutate data/raw/; always write deterministic outputs to data/processed/."]
      ],
      quiz: [
        { q: "A dataset has Q1 = 2,000 UGX and Q3 = 3,200 UGX. What is the upper Tukey 1.5×IQR fence?", o: ["4,400 UGX", "5,000 UGX", "3,800 UGX", "6,200 UGX"], a: 1, e: "IQR = 3,200 − 2,000 = 1,200. Upper fence = Q3 + 1.5×1,200 = 3,200 + 1,800 = 5,000 UGX." },
        { q: "10,000 raw rows have 4% missing primary keys, and 5% of the remaining valid rows are duplicates. How many clean rows remain?", o: ["9,100", "9,120", "9,500", "9,000"], a: 1, e: "After dropping 4% missing keys: 10,000 × 0.96 = 9,600. After dropping 5% duplicates: 9,600 × 0.95 = 9,120 rows." }
      ],
      fact: {
        title: "Garbage In, Garbage Out costs billions",
        desc: "Gartner estimates poor data quality costs organisations an average of $12.9 million per year. In production ML systems, fixing a schema or unit mismatch in ingestion almost always beats tuning model hyperparameters."
      }
    },
    {
      title: "Pipelines: ETL vs ELT, Parquet & Idempotency",
      subtitle: "Build modular, repeatable pipelines with columnar storage (Lab 3)",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "A notebook that only works when you run cells in a secret order is not a pipeline. In Lab 3 we refactored our code into modular stages: profile → validate → clean → store, orchestrated by run_pipeline.py." },
        { time: 17, text: "In classic ETL, data is transformed on a staging server before loading into storage. In modern ELT, raw data lands in a lake or warehouse first and transformations run in-engine using SQL or DuckDB." },
        { time: 33, text: "Where should cleaned data live? CSV is row-oriented, untyped, and slow to parse. Apache Parquet is columnar: it stores each column contiguously with explicit types, dictionary encoding, and Snappy compression." },
        { time: 48, text: "Checkpoint: what does it mean for a data pipeline to be idempotent, and how do you prevent duplicate rows or half-written files when a job re-runs?" },
        { time: 68, text: "An idempotent pipeline produces the exact same storage state whether run once or ten times on the same input: f(f(x)) = f(x). Plain append violates idempotency by doubling row counts on every retry." },
        { time: 88, text: "To make file writes atomic and idempotent, write to a temporary file and call os.replace(tmp, target). In databases, use primary-key upserts (INSERT OR REPLACE) or partition overwrite by date." }
      ],
      checkpoint: {
        question: "Define idempotency in data pipelines. Why does a naive append mode break idempotency on retries, and how do you engineer both file outputs and database loads to be idempotent?",
        hint: "Mathematically f(f(x)) = f(x). Think about what happens when a task fails at 99% and Airflow retries it. Mention atomic temp-file replacement and primary-key upserts / partition overwrites.",
        keywords: ["idempotent", "idempotency", "same", "repeat", "retry", "duplicate", "append", "atomic", "temp", "replace", "upsert", "primary key", "partition", "overwrite"],
        idealAnswer: "A pipeline is idempotent if running it multiple times on the same input leaves the target storage in the exact same state as running it once. Naive append breaks this because any retry or backfill inserts duplicate rows, inflating counts and corrupting aggregates. For file outputs, ensure idempotency by writing to a temporary file and atomically swapping it into place (`os.replace`) or overwriting the specific date partition. For database tables, enforce a composite primary key and use `INSERT OR REPLACE` (upsert) or `DELETE WHERE date = ...` inside a single transaction before inserting."
      },
      terms: [
        ["Idempotency", "Running a job N times has the exact same effect as running it once."],
        ["Columnar storage (Parquet)", "Stores values column-by-column; enables column pruning and high compression ratios."],
        ["Row group & predicate pushdown", "Parquet stores min/max statistics per block so engines skip irrelevant chunks without reading them."],
        ["Atomic write", "Write to .tmp then os.replace() so readers never see a truncated or half-written file."],
        ["Upsert", "INSERT ... ON CONFLICT UPDATE (or INSERT OR REPLACE) keyed on the business key."]
      ],
      quiz: [
        { q: "A table has 12 columns (each 8 bytes/row) and 1,000,000 rows. A query selects only 2 columns. Roughly how much less raw data does columnar storage scan than row-oriented CSV?", o: ["2× less", "6× less", "12× less", "Same amount"], a: 1, e: "Column pruning reads only 2 of the 12 columns: 12 / 2 = 6× less I/O before even counting compression." },
        { q: "Why write to 'market_prices.parquet.tmp' and call os.replace() instead of writing directly to 'market_prices.parquet'?", o: ["It compresses better", "It prevents corrupted half-written files if the process crashes mid-write", "It skips schema validation", "Parquet requires .tmp extensions"], a: 1, e: "os.replace() is an atomic filesystem rename on POSIX; downstream readers either see the old complete file or the new complete file." }
      ],
      fact: {
        title: "Why Parquet + DuckDB beats CSV by 20×–100×",
        desc: "Because all values of a column sit together in Parquet, a single column of market names like 'Owino' repeated 50,000 times collapses to a tiny integer dictionary plus run-length encoding — shrinking size by 80%+ and allowing SIMD vectorised scans."
      }
    },
    {
      title: "Analytical Star Schemas & DuckDB",
      subtitle: "Model facts, dimensions & OLAP queries for fast analytics (Lab 4)",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "Transactional databases (OLTP) like PostgreSQL or SQLite are optimised for fast row-by-row inserts and updates. Analytical engines (OLAP) like DuckDB are built for scanning millions of rows across a few columns." },
        { time: 18, text: "In dimensional modelling (Kimball's Star Schema), we split data into a central Fact table surrounded by Dimension tables. Fact rows hold numeric measurements at a clearly declared grain." },
        { time: 33, text: "In our market warehouse, fact_market_prices has a grain of one row per (date, market, commodity), storing price_ugx, rainfall_mm, and foreign keys to dim_date, dim_market, and dim_commodity." },
        { time: 46, text: "Checkpoint: what is the difference between a Fact table and a Dimension table, and why must you declare the grain of a fact table before writing a single SQL query?" },
        { time: 66, text: "Dimensions store descriptive context — region, district, commodity category, calendar quarter — used for filtering and grouping. Facts store quantitative measurements that you sum, average, or count." },
        { time: 86, text: "If you mix grains in a fact table (e.g., daily market prices mixed with monthly regional totals), every JOIN fans out and double-counts revenue or distorts averages. Declaring the grain prevents fan-traps." }
      ],
      checkpoint: {
        question: "Contrast Fact tables and Dimension tables in a Star Schema. Why is declaring the exact 'grain' of a fact table critical before designing joins and aggregations?",
        hint: "What goes into facts (measurements, foreign keys) vs dimensions (descriptive attributes, surrogate keys)? What goes wrong in SUM/AVG if rows represent different levels of detail?",
        keywords: ["fact", "dimension", "measurement", "numeric", "descriptive", "context", "filter", "group by", "grain", "one row", "surrogate key", "join", "double count", "aggregation"],
        idealAnswer: "Fact tables store quantitative numeric measurements (such as `price_ugx` and `rainfall_mm`) and foreign keys at a specific atomic event level, making them narrow and deep. Dimension tables (`dim_market`, `dim_commodity`, `dim_date`) store descriptive attributes used for `WHERE` filtering and `GROUP BY` labels. Declaring the grain — exactly what one fact row represents, such as one commodity in one market on one day — is critical because mixing grains causes joins to fan out, silently double-counting sums and biasing averages."
      },
      terms: [
        ["Grain", "The exact business definition of a single row in a fact table (e.g., 1 market × 1 commodity × 1 day)."],
        ["Fact table", "Central table holding numeric measures and foreign keys to dimensions."],
        ["Dimension table", "Lookup table holding descriptive attributes (who, what, where, when) with a surrogate primary key."],
        ["Surrogate key", "System-generated key (integer or MD5 hash) decoupling warehouse joins from operational strings."],
        ["Vectorised execution", "Processing columns in CPU cache-sized batches (vectors of 1,024–2,048 values) instead of row-at-a-time."]
      ],
      quiz: [
        { q: "In our Star Schema, we cover 5 markets, 4 commodities, and 365 days with complete daily observations. How many rows are in fact_market_prices?", o: ["1,825", "7,300", "1,460", "374"], a: 1, e: "Grain = market × commodity × day = 5 × 4 × 365 = 7,300 fact rows." },
        { q: "Which table should store the attribute 'commodity_category = Cereals'?", o: ["fact_market_prices", "dim_commodity", "dim_market", "dim_date"], a: 1, e: "Descriptive hierarchy attributes belong in the dimension table (dim_commodity), not repeated as strings in the fact table." }
      ],
      fact: {
        title: "In-process OLAP: why DuckDB is the 'SQLite for Analytics'",
        desc: "DuckDB runs embedded inside your Python process with zero server setup, yet uses a columnar-vectorised execution engine written in C++ that can query Parquet files directly on disk faster than many distributed clusters on datasets under 50 GB."
      }
    },
    {
      title: "Workflow Orchestration with Apache Airflow",
      subtitle: "Schedule DAGs, manage dependencies & handle retries (Lab 5)",
      checkpointTime: 45,
      captions: [
        { time: 0, text: "Cron jobs are blind to data dependencies: if ingestion takes 10 minutes longer than usual, a cron-scheduled cleaning script runs on yesterday's stale file or crashes silently." },
        { time: 16, text: "Apache Airflow models workflows as Directed Acyclic Graphs (DAGs). Nodes are tasks (Operators), and directed edges enforce topological execution order with no cycles allowed." },
        { time: 31, text: "In Lab 5, we wired `ingest >> validated >> cleaned >> stored >> report_gen`. If `validated` fails, downstream tasks (`cleaned`, `stored`, `report_gen`) are automatically blocked (`upstream_failed`) so bad data never reaches the warehouse." },
        { time: 45, text: "Checkpoint: why should ingestion tasks have more retries than local transformation tasks, and why must every Airflow task be idempotent?" },
        { time: 65, text: "Ingestion talks to external APIs, SFTP servers, and networks that suffer transient glitches — so setting `retries=3` with exponential backoff recovers automatically. Local validation errors are deterministic schema bugs that won't fix themselves on retry." },
        { time: 85, text: "Because Airflow retries failed tasks and supports historical backfills (`catchup`), any non-idempotent task will corrupt your warehouse with duplicate records whenever a retry or backfill occurs." }
      ],
      checkpoint: {
        question: "In an Airflow DAG (`ingest >> validate >> clean >> store >> report`), why should retry counts and delays differ by stage, and what happens if `validate` fails?",
        hint: "Distinguish transient network failures in `ingest` from deterministic schema failures in `validate`. Also trace the state of downstream tasks when an upstream task fails.",
        keywords: ["transient", "network", "api", "ingest", "deterministic", "schema", "retry", "backoff", "downstream", "upstream_failed", "block", "dag", "acyclic"],
        idealAnswer: "Ingestion interacts with external networks, APIs, or remote filesystems prone to transient timeouts, so it benefits from higher retries (e.g., 2–3 retries with backoff). Validation and cleaning run deterministic logic on local data; if a schema check fails, retrying immediately wastes compute without fixing the broken contract. When `validate` fails, Airflow marks it `failed` and sets all downstream tasks (`clean`, `store`, `report`) to `upstream_failed`, halting the pipeline so corrupt data never overwrites production tables."
      },
      terms: [
        ["DAG", "Directed Acyclic Graph: tasks with directed dependencies and zero loops."],
        ["Operator / TaskFlow", "Template defining a unit of work (`@task` Python decorator or `BashOperator`)."],
        ["XCom", "Cross-communication mechanism for passing small metadata (like file paths or row counts) between tasks."],
        ["Backfill & Catchup", "Running a DAG across historical logical date intervals (`data_interval_start`)."],
        ["Exponential backoff", "Doubling the wait time between consecutive retry attempts: d, 2d, 4d, …"]
      ],
      quiz: [
        { q: "In `ingest >> validated >> cleaned >> stored >> report_gen`, if `stored` is NOT wired before `report_gen` (`stored >> report_gen` omitted), what bug occurs?", o: ["Airflow refuses to parse the file", "report_gen may run in parallel with stored and query an empty or stale database", "ingest runs twice", "cleaned is skipped"], a: 1, e: "Without `stored >> report_gen`, Airflow schedules `report_gen` before `stored` finishes, causing a race condition where the report reads stale or missing data (the exact Lab 5 bug!)." },
        { q: "A task has initial retry_delay = 30s and exponential backoff (×2 each retry). If all 3 retries fail, what is the total wait time spent in retry delays?", o: ["90s", "150s", "210s", "180s"], a: 2, e: "Retry 1 waits 30s, Retry 2 waits 60s, Retry 3 waits 120s → 30 + 60 + 120 = 210 seconds." }
      ],
      fact: {
        title: "Never pass gigabytes through Airflow XComs",
        desc: "Airflow stores XCom values in its metadata database. Passing a 500 MB DataFrame in XCom will choke the scheduler DB. Always write data to object storage/Parquet and pass only the URI string and row count in XCom!"
      }
    },
    {
      title: "Distributed Batch Processing with PySpark",
      subtitle: "Partitions, lazy evaluation, shuffles & caching (Lab 6 / Lab 8)",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "When datasets outgrow a single machine's RAM, Apache Spark distributes data across a cluster as partitioned DataFrames. A Driver coordinates the execution plan while Executors process partitions in parallel." },
        { time: 17, text: "Rule of thumb: 1 partition = 1 parallel task. If your DataFrame has 8 partitions and your executor pool has 8 cores, all 8 partitions are processed simultaneously." },
        { time: 32, text: "Spark transformations (`filter`, `withColumn`, `groupBy`) are lazy: they only build a logical DAG. Nothing executes until an Action (`count`, `collect`, `write`) triggers the Catalyst optimiser to compile a physical plan." },
        { time: 48, text: "Checkpoint: what is the difference between a narrow transformation and a wide transformation in Spark, and why can `.cache()` sometimes make a job slower?" },
        { time: 68, text: "Narrow transformations (`filter`, `select`, `map`) stay within each partition with zero network traffic. Wide transformations (`groupBy`, `join`, `orderBy`) require a Shuffle (`Exchange`): data is hashed, written to disk, and sent across the network." },
        { time: 88, text: "In Lab 8 we measured DuckDB at 1.39s vs Spark at 11.21s on 10,000 rows, and saw `.cache()` take 8.85s vs 3.04s uncached! On small data, JVM startup, shuffle overhead, and cache materialisation outweigh distributed parallelism." }
      ],
      checkpoint: {
        question: "Explain the difference between narrow and wide transformations in PySpark. Why did DuckDB beat PySpark on our 10,000-row market dataset, and when does `.cache()` actually pay off?",
        hint: "Mention partitions, network shuffle (`Exchange`), JVM/Catalyst overhead vs single-node vectorised C++, and the materialisation cost of `.cache()` across multiple actions.",
        keywords: ["narrow", "wide", "shuffle", "exchange", "partition", "network", "lazy", "action", "cache", "materialise", "overhead", "jvm", "duckdb"],
        idealAnswer: "Narrow transformations (`filter`, `select`, `withColumn`) compute each output partition from a single input partition in memory without moving data. Wide transformations (`groupBy`, `join`, `distinct`) require a shuffle (`Exchange`), redistributing rows across partitions via disk and network I/O. On a 10,000-row dataset, DuckDB (~1.4s) beats PySpark (~11.2s) because Spark pays heavy fixed overhead for JVM startup, Catalyst planning, task scheduling, and shuffle serialisation. Similarly, `.cache()` has an upfront materialisation cost and only pays off when a large, expensive DataFrame is reused across multiple downstream actions."
      },
      terms: [
        ["Lazy evaluation", "Transformations build a query plan; execution only starts when an Action is called."],
        ["Narrow transformation", "1-to-1 partition mapping (`filter`, `select`); pipelined in memory with no shuffle."],
        ["Wide transformation", "Many-to-many partition mapping (`groupBy`, `join`); inserts an `Exchange` shuffle barrier."],
        ["Catalyst & Tungsten", "Spark's query optimiser (predicate pushdown, column pruning) and off-heap code generation engine."],
        ["Partial aggregate", "Map-side `HashAggregate` that pre-combines groups inside each partition before shuffling."]
      ],
      quiz: [
        { q: "In `df.filter(...).withColumn(...).groupBy('market').agg(avg('price')).collect()`, which call is the Action that triggers execution?", o: ["filter()", "withColumn()", "groupBy()", "collect()"], a: 3, e: "filter, withColumn, and groupBy/agg are lazy transformations; collect() is the Action that triggers the Spark job." },
        { q: "You have 1,000,000 rows across 4 partitions and 5 distinct markets. With partial aggregation (`HashAggregate` before `Exchange`), at most how many intermediate rows are sent across the shuffle network?", o: ["1,000,000", "20", "4,000", "5"], a: 1, e: "Each of the 4 partitions pre-aggregates its local rows into at most 5 market groups → 4 × 5 = 20 rows shuffled across the network!" }
      ],
      fact: {
        title: "Single-node first: most 'Big Data' fits in laptop RAM",
        desc: "A 2023 study of production cloud analytics jobs found that over 90% of queries scanned less than 10 GB of data. Modern engineers use DuckDB or Polars for <50 GB and reserve Spark for true multi-hundred-gigabyte distributed workloads."
      }
    },
    {
      title: "Streaming, Event-Time Windows & Watermarks",
      subtitle: "Process unbounded events with out-of-order arrivals (Lab 9 Part 1)",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "Batch processing waits for a bounded dataset (like yesterday's file) before computing. Streaming processes an unbounded sequence of events continuously as they arrive from sensors, mobile apps, or market agents." },
        { time: 16, text: "Every streaming system must distinguish two clocks: Event Time (when the price observation actually occurred in the market) and Processing Time (when our server received the packet)." },
        { time: 32, text: "Mobile networks drop out! An event generated at 08:00:05 might arrive at 08:00:19. If we group by Processing Time, that event lands in the wrong window and corrupts our 10-second market price averages." },
        { time: 46, text: "Checkpoint: how does a Watermark work in event-time streaming, and how do we handle both duplicate retries and late events?" },
        { time: 66, text: "A Watermark `W(t) = max_event_time − L` (where `L` is allowed lateness, e.g., 5s) is a moving threshold asserting that no more events earlier than `W(t)` are expected. Any window whose `window_end <= W(t)` can be finalised and emitted!" },
        { time: 86, text: "In our Lab 9 consumer, we first check `event_id` against a stateful `seen_ids` set to drop duplicates, then compare `event_ts < watermark` to route stragglers to `late_events.jsonl`, and bucket valid events into 10s tumbling windows `[floor(ts/10)*10, +10)`." }
      ],
      checkpoint: {
        question: "Distinguish Event Time from Processing Time. How does a Watermark control when a tumbling window is finalised, and what happens to an event whose timestamp falls behind the watermark?",
        hint: "Define W(t) = max_seen_event_time − allowed_lateness. Explain the trade-off of choosing a small vs large lateness bound L.",
        keywords: ["event time", "processing time", "watermark", "lateness", "out of order", "tumbling window", "finalise", "emit", "late", "drop", "side output", "duplicate", "state"],
        idealAnswer: "Event time is when the event actually occurred at the source, whereas processing time is when the consumer ingests it. Because network delays cause events to arrive out of order, we group by event-time windows and track a watermark `W(t) = max(event_time) − L`, where `L` is the allowed lateness. Once `W(t) >= window_end`, the engine finalises and emits that window's aggregate. Any event arriving with `event_time < W(t)` is classified as late and routed to a side output (`late_events.jsonl`) or dead-letter stream rather than silently corrupting closed windows."
      },
      terms: [
        ["Event Time vs Processing Time", "When the event happened in the real world vs when the server processed it."],
        ["Tumbling window", "Fixed-size, non-overlapping time intervals: `[floor(t/W)·W, floor(t/W)·W + W)`."],
        ["Watermark", "Moving threshold `max_event_time − L` signalling that windows ending at or before `W` are complete."],
        ["Allowed lateness (L)", "Tolerance window for out-of-order events; trades off completeness against output latency."],
        ["Stateful deduplication", "Tracking seen `event_id` keys so producer network retries do not double-count metrics."]
      ],
      quiz: [
        { q: "With 10-second tumbling windows starting at t=0, which window `[start, end)` does an event with `event_ts = 1029.8` belong to?", o: ["[1025, 1035)", "[1020, 1030)", "[1030, 1040)", "[1000, 1010)"], a: 1, e: "floor(1029.8 / 10) × 10 = 102 × 10 = 1020 → window [1020, 1030)." },
        { q: "Max seen event_ts is 1052.0s and allowed lateness L = 5.0s. An out-of-order event arrives with event_ts = 1044.5s. How is it classified?", o: ["On-time (accepted into window)", "Late (event_ts < watermark 1047.0s)", "Duplicate", "Future event"], a: 1, e: "Watermark W = 1052.0 − 5.0 = 1047.0s. Since 1044.5 < 1047.0, the event is late and routed to late_events.jsonl." }
      ],
      fact: {
        title: "Google Dataflow & Apache Flink popularised Watermarks",
        desc: "Tyler Akidau's 2015 'Dataflow Model' paper formalised the What / Where / When / How of stream processing — showing that event-time windows + watermarks + triggers unify batch and streaming under a single mathematical model."
      }
    },
    {
      title: "From Model to Data Product: FastAPI & Docker",
      subtitle: "Serve ML models with zero training-serving skew (Lab 9 Part 2 / Lab 10)",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "A trained scikit-learn model sitting in a Jupyter notebook is not a data product. Downstream applications need a reliable HTTP API that accepts a JSON request, validates it, and returns a prediction in milliseconds." },
        { time: 16, text: "In Lab 9 Part 2 (Assignment 04), we serialised our RandomForestRegressor to `models/model.joblib` alongside `models/model_metadata.json` recording `model_version`, `feature_columns`, and training metrics." },
        { time: 32, text: "Our FastAPI service loads the model once at module startup (`lifespan` / module import), NOT inside `POST /predict`. Loading a 50 MB model from disk on every request turns a 2 ms inference into a 300 ms disk bottleneck." },
        { time: 46, text: "Checkpoint: what is training-serving skew, how did we witness it in Step 8 of our lab, and what architectural pattern prevents it permanently?" },
        { time: 66, text: "Training-serving skew happens when feature logic at inference diverges from training. In Step 8, changing `is_rainy` from `rainfall_mm > 5.0` to `> 10.0` for `rainfall_mm = 8.2` silently shifted the beans prediction from 2,927.25 to 2,889.58 UGX with zero HTTP errors!" },
        { time: 86, text: "We prevent skew by placing `make_features()` and `FEATURE_COLUMNS` in a single shared module (`src/common/features.py`) imported by both `src/ml/train.py` and `src/api/main.py`, enforcing strict Pydantic input schemas, and packaging the exact runtime in Docker." }
      ],
      checkpoint: {
        question: "What is training-serving skew in ML systems? Explain how a subtle threshold mismatch causes silent prediction errors, and how shared feature modules, Pydantic schemas, and Docker work together to make a model service reproducible.",
        hint: "Reference `src/common/features.py` (`make_features`), why silent bugs are worse than HTTP 422/500 errors, and why `model.joblib` must be loaded once at startup inside a pinned Docker container.",
        keywords: ["training-serving skew", "skew", "feature", "shared", "make_features", "silent", "pydantic", "validation", "422", "startup", "docker", "container", "pinned", "reproducible"],
        idealAnswer: "Training-serving skew occurs when the feature transformations applied during live inference differ from those used during model training. Because the model still receives a numeric vector of the expected shape, it raises no HTTP or runtime error — instead, it silently outputs wrong predictions (such as when `is_rainy` threshold drifted from 5.0 mm to 10.0 mm in our lab). We eliminate this by defining `make_features()` and `FEATURE_COLUMNS` in a single shared module (`src/common/features.py`) imported by both `train.py` and `main.py`, validating raw request bounds with Pydantic (returning HTTP 422 on bad inputs), loading `model.joblib` once at startup, and locking the OS and Python dependencies in a Dockerfile."
      },
      terms: [
        ["Training-serving skew", "Mismatch between feature engineering or data distribution at training time vs inference time."],
        ["Pydantic schema validation", "Declarative type + range checks (`Literal`, `Field(ge=0, le=500)`) that reject bad payloads with HTTP 422."],
        ["Startup model loading", "Deserialising `model.joblib` once into memory when the worker starts rather than per HTTP request."],
        ["Model metadata artifact", "`model_metadata.json` storing `model_version`, `trained_at`, `feature_columns`, and test metrics (`r2`)."],
        ["Docker layer caching", "Copying `requirements.txt` and running `pip install` before `COPY src/` so code edits rebuild in seconds."]
      ],
      quiz: [
        { q: "In a Dockerfile, why should `COPY requirements.txt .` and `RUN pip install -r requirements.txt` come BEFORE `COPY src/ ./src/`?", o: ["Docker requires alphabetical order", "So editing Python code in src/ reuses the cached pip install layer instead of reinstalling packages every build", "It makes the model more accurate", "FastAPI won't start otherwise"], a: 1, e: "Docker caches layers top-down; placing rarely-changing `requirements.txt` before frequently-edited `src/` saves minutes on every rebuild." },
        { q: "Loading `model.joblib` from disk takes 180 ms and `model.predict()` takes 4 ms. For 100 sequential requests, how much total time is saved by loading the model ONCE at startup instead of on every request?", o: ["1.78 seconds", "17.82 seconds", "18.00 seconds", "0.40 seconds"], a: 1, e: "Per-request load: 100 × (180 + 4) = 18,400 ms. Startup load once: 180 + 100 × 4 = 580 ms. Saved = 18,400 − 580 = 17,820 ms = 17.82 seconds!" }
      ],
      fact: {
        title: "Hidden Technical Debt in Machine Learning Systems",
        desc: "Google's famous NeurIPS paper ('Hidden Technical Debt in ML Systems', Sculley et al.) showed that the ML model code itself is often less than 5% of a production ML system — the other 95% is data verification, feature extraction, serving infrastructure, and monitoring."
      }
    },
    {
      title: "Practice Exam (sample_qtn): Milk Validation & Collisions",
      subtitle: "Master rule ordering, record_id collisions & row conservation (sample_qtn.pdf)",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "In the DSC3103 Practice Question (sample_qtn.pdf), farmers deliver milk to collection centres (`data/raw/milk_raw.csv`) and we must validate, clean, join with `data/raw/centres.csv`, and load a Star Schema without ever modifying `data/raw/`." },
        { time: 16, text: "Part (a) asks whether validation rules in `src/validate/rules.py` (`rule_valid_date`, `rule_duplicate_ids`, `rule_unknown_centre`) should run BEFORE or AFTER tidying the `centre` text (`strip().title()`). The answer is AFTER tidying `centre`!" },
        { time: 32, text: "Why? If a clerk typed `' mbarara '` or `'MBARARA'`, running `rule_unknown_centre` before stripping whitespace and normalising case falsely flags a valid delivery as an unknown centre! Tidy formatting first, then check membership against `centres.csv`." },
        { time: 48, text: "Checkpoint: why must BOTH rows of a `record_id` collision be rejected into `rejected_df` rather than keeping the first row, and what is the exact row-conservation invariant?" },
        { time: 68, text: "An exact duplicate (every column identical) is just a double-saved record — we drop the extra copy and keep one. But a `record_id` collision has the SAME `record_id` with DIFFERENT values (e.g., 45 L vs 120 L or two different farmers)." },
        { time: 88, text: "Keeping the first row of a collision is a silent guess that corrupts farmer payouts! Both rows must be quarantined into `rejected_df` with `reason='record_id_collision'`, and our code must assert: `rows_in == rows_kept + rows_rejected + exact_duplicates_removed`." }
      ],
      checkpoint: {
        question: "In `sample_qtn.pdf`, why must validation rules on `centre` run AFTER tidying text, why are BOTH rows of a `record_id` collision rejected instead of keeping one, and what makes running the pipeline twice safe?",
        hint: "Think about `' mbarara '` vs `'Mbarara'`, what happens if two different deliveries share `record_id = 1042`, and the 3 pillars of idempotency (`data/raw/` immutability, deterministic cleaning, atomic overwrite).",
        keywords: ["after", "strip", "case", "whitespace", "false", "collision", "both", "ambiguous", "conflict", "exact duplicate", "immutable", "raw", "idempotent", "overwrite"],
        idealAnswer: "Validation rules on `centre` must run AFTER stripping whitespace and standardising case (`strip().title()`) so valid centres like `' mbarara '` are not falsely rejected as unknown. For a `record_id` collision (same ID, different payload values), we reject BOTH rows because there is no way to know which delivery is genuine — keeping one arbitrarily would corrupt financial payouts, whereas exact duplicates have identical values so keeping one is safe. Running the pipeline twice is safe because `data/raw/milk_raw.csv` and `centres.csv` are never modified, cleaning is deterministic, and outputs overwrite `data/processed/q1_output.parquet` and DuckDB tables atomically."
      },
      terms: [
        ["Exact duplicate", "All columns identical (`df.duplicated(keep='first')`); drop extra copies and keep 1 row."],
        ["record_id collision", "Same `record_id` but different column values (`duplicated(subset=['record_id'], keep=False)` after dropping exact dupes); reject ALL colliding rows."],
        ["Row conservation invariant", "`rows_in == rows_kept + rows_rejected + exact_duplicates_removed`."],
        ["Boundary checksum", "SHA-256 hash of `data/raw/milk_raw.csv` logged at pipeline start to prove raw input integrity."],
        ["Lossless reference join", "`LEFT JOIN` (or validated inner join after rejecting unknown centres) asserting `len(joined) == len(clean_df)`."]
      ],
      quiz: [
        { q: "A raw milk file has 1,000 rows. There are 15 exact duplicate rows (to be removed), 6 pairs of `record_id` collisions (12 colliding rows total), and 23 rows with non-positive litres or unknown centres. How many rows are in `clean_df`?", o: ["950", "956", "962", "965"], a: 0, e: "rows_kept = rows_in (1,000) − exact_dupes_removed (15) − rows_rejected (12 collision rows + 23 bad rows = 35) = 950 rows." },
        { q: "Why does `rule_unknown_centre` run AFTER `df['centre'] = df['centre'].str.strip().str.title()`?", o: ["To make Python run faster", "So syntactic formatting noise (' gulu ') is fixed before semantic membership check against centres.csv", "Because DuckDB requires uppercase", "To hide unknown centres"], a: 1, e: "Tidying whitespace/case first prevents rejecting legitimate deliveries that only differed in casing or trailing spaces." }
      ],
      fact: {
        title: "Quarantine tables (`rejected_df`) in production pipelines",
        desc: "Real cooperative and banking pipelines never silently `dropna()` bad records into a black hole. They split batches into `(clean_df, rejected_df)` with a `reason` column so clerks can fix rejected delivery slips without blocking the daily warehouse build."
      }
    },
    {
      title: "Practical Test 02 (dsc3103_test_02): Milk Star Schema & Analytics",
      subtitle: "Conquer unknown dimension keys, 2-stage capacity SQL & partition pruning",
      checkpointTime: 50,
      captions: [
        { time: 0, text: "Let's dissect `dsc3103_test_02` — the Milk Cooperative Practical Test! You were given `milk_clean.parquet` (20,000 rows across 6 months, `2026-03` to `2026-08`), `centres.csv` (5 centres), and `farmers.csv` (294 registered farmers)." },
        { time: 17, text: "Trap #1 in Question 2(a): `milk_clean.parquet` has 300 distinct `farmer_id`s, meaning 6 farmers (408 deliveries!) are NOT in `farmers.csv`. If `dim_farmer` only loads `farmers.csv`, joining `fact_delivery` either drops 408 rows or leaves `farmer_key` NULL — failing Question 2(c)'s integrity checks!" },
        { time: 34, text: "The Kimball solution: insert an explicit Unknown Member row (`farmer_key = 0, farmer_id = -1, farmer_name = 'Unknown'`) into `dim_farmer` via `UNION ALL`, and use `COALESCE(f.farmer_key, 0)` when building `fact_delivery`. All 20,000 rows survive with zero NULL keys!" },
        { time: 50, text: "Checkpoint: how do you write `days_over_capacity` and `top_farmers_per_centre` in DuckDB SQL, and what happens when a farmer moves to a new centre in July?" },
        { time: 70, text: "In Question 3(b), `capacity_litres` is a DAILY centre limit (e.g. Kiruhura = 950 L/day), NOT a single-delivery limit! You must use a CTE to `SUM(litres)` per `(centre, date_key)` first, then count days where `daily_litres > capacity_litres` (Kiruhura = 41 days, worst day = 1,203.5 L)." },
        { time: 90, text: "In Question 3(c), exclude the Unknown farmer bucket (`WHERE f.farmer_key != 0`), group by `(centre, farmer_key)`, and rank with `RANK() OVER (PARTITION BY centre ORDER BY SUM(litres) DESC) <= 3`. And in Question 3(d), partitioning by `month` means querying April 2026 (`month='2026-04'`) reads just 1 of 6 files (3,201 rows instead of 20,000)!" }
      ],
      checkpoint: {
        question: "In `dsc3103_test_02`, how should `dim_farmer` and `fact_delivery` handle the 6 unregistered `farmer_id`s so all 3 integrity checks pass? Also explain why `days_over_capacity` needs a two-stage aggregation and what happens when a farmer moves centres in July.",
        hint: "Mention the `farmer_key = 0` ('Unknown') row + `COALESCE`, summing litres per `(centre, date)` in a CTE before comparing to `capacity_litres`, and how `fact_delivery` + SCD Type 2 preserve historical centre assignments.",
        keywords: ["unknown", "coalesce", "surrogate", "20000", "null", "foreign key", "cte", "daily", "sum", "capacity", "window", "rank", "partition", "history", "scd"],
        idealAnswer: "To preserve all 20,000 deliveries without NULL foreign keys, `dim_farmer` includes a dedicated Unknown member row (`farmer_key = 0, farmer_id = -1, farmer_name = 'Unknown'`) and `fact_delivery` maps unmatched `farmer_id`s via `COALESCE(f.farmer_key, 0)`. That satisfies all three integrity checks: `COUNT(*) == 20,000`, zero orphan foreign keys, and zero NULL keys. For `days_over_capacity`, `capacity_litres` is a daily centre limit, so a CTE must first compute `SUM(litres)` per `(centre, date_key)` before counting days where `daily_litres > capacity_litres`. When a farmer moves centres in July, earlier deliveries in `fact_delivery` keep their original `centre_key` so history is untouched; to also track home-centre history in `dim_farmer`, use SCD Type 2 (a new dimension row with `valid_from`/`valid_to`)."
      },
      terms: [
        ["Unknown member row (`key = 0`)", "Default dimension record (`'Unknown'`) so unregistered business keys map cleanly without NULL FKs or dropped facts."],
        ["Pre-computed measure (`revenue_ugx`)", "Stored once in `fact_delivery` (`litres * price_ugx_per_litre`) for consistent, fast aggregations."],
        ["Two-stage CTE aggregation", "Aggregate atomic deliveries to daily centre totals in a CTE before comparing against daily `capacity_litres`."],
        ["Window ranking (`RANK() OVER`)", "`RANK() OVER (PARTITION BY centre ORDER BY total_litres DESC)` to pick top-N per group."],
        ["SCD Type 2", "Slowly Changing Dimension technique that adds a new versioned dimension row when an attribute changes, preserving history."]
      ],
      quiz: [
        { q: "In `dsc3103_test_02`, `milk_clean.parquet` has 20,000 rows, `farmers.csv` has 294 farmers, and 408 deliveries come from 6 unregistered `farmer_id`s. With an Unknown row in `dim_farmer`, how many rows are in `dim_farmer` and `fact_delivery`?", o: ["294 and 19,592", "295 and 20,000", "300 and 20,000", "294 and 20,000"], a: 1, e: "294 registered farmers + 1 'Unknown' bucket row = 295 rows in dim_farmer (or 300 if each unregistered ID gets a placeholder row), and all 20,000 rows remain in fact_delivery!" },
        { q: "`fact_delivery` is partitioned by `month` across 6 months (`2026-03` to `2026-08`). When DuckDB runs `EXPLAIN ANALYZE` for `WHERE month = '2026-04'`, how many Parquet files and rows are scanned?", o: ["6 files (20,000 rows)", "1 file (3,201 rows)", "12 files (6,402 rows)", "0 files"], a: 1, e: "Partition pruning skips the other 5 month folders completely and reads only the `month=2026-04` file containing 3,201 rows!" }
      ],
      fact: {
        title: "Why Test 02's Unknown Member pattern is a Kimball classic",
        desc: "In real agricultural cooperatives, new farmers deliver milk on their first day before their paper registration form is entered into `farmers.csv`. Dropping their deliveries would lose real milk inventory and money — which is why Kimball's 'Unknown Member' surrogate key (`0` or `-1`) is standard in every enterprise warehouse."
      }
    }
  ],

  examQuestions: [
    {
      prompt: "Walk me through how you would take a messy raw CSV of market prices and build a reproducible cleaning pipeline. Why must raw data never be modified in place?",
      topic: "Data Quality & Cleaning",
      keywords: ["immutable", "raw", "profile", "validate", "schema", "median", "impute", "deduplicate", "composite key", "reproducible", "processed"],
      idealAnswer: "First, keep `data/raw/` strictly read-only so any bug in cleaning can be fixed and re-run from the original source. Next, profile the dataset to quantify null rates, types, duplicates, and distributions. Then enforce a validation gate checking required columns, date formats, and domain bounds. In cleaning, standardise strings, drop rows missing primary keys (`date`, `market`, `commodity`), deduplicate on that composite key, impute missing prices using the per-commodity median (which is robust to skew and outliers), and write the result atomically to `data/processed/`."
    },
    {
      prompt: "What does idempotency mean in data engineering? Give a concrete example of a non-idempotent pipeline stage and explain how you would fix it.",
      topic: "Pipelines & Idempotency",
      keywords: ["idempotent", "same state", "retry", "backfill", "append", "duplicate", "upsert", "insert or replace", "atomic", "temp file", "overwrite"],
      idealAnswer: "Idempotency means running a pipeline stage once or N times on the same input produces the exact same stored dataset. A classic non-idempotent stage is appending rows (`mode='append'` or `INSERT INTO`) without a uniqueness constraint: if Airflow retries the task or runs a backfill, every row is duplicated. To fix it, enforce a primary key on `(date, market, commodity)` and use an atomic upsert (`INSERT OR REPLACE`) or overwrite the target partition via an atomic temporary file swap (`os.replace`)."
    },
    {
      prompt: "Why do analytical pipelines store data in Apache Parquet and query it with DuckDB instead of keeping everything in CSV and SQLite?",
      topic: "Storage & OLAP",
      keywords: ["columnar", "parquet", "row-oriented", "csv", "sqlite", "olap", "oltp", "compression", "column pruning", "predicate pushdown", "vectorised"],
      idealAnswer: "CSV and SQLite are row-oriented: scanning the average price per market requires reading every byte of every column in every row, and CSV must re-parse text types on every read. Parquet is a binary columnar format with explicit schemas, dictionary/run-length compression, and row-group min/max statistics. DuckDB is an in-process OLAP engine that uses column pruning, predicate pushdown, and vectorised SIMD execution over Parquet columns, cutting I/O and CPU time by an order of magnitude."
    },
    {
      prompt: "In a Star Schema warehouse for Uganda market monitoring, what goes into the Fact table versus the Dimension tables, and why must you define the grain first?",
      topic: "Star Schema Modelling",
      keywords: ["fact", "dimension", "grain", "measure", "price", "rainfall", "foreign key", "surrogate key", "descriptive", "group by", "fan trap", "double count"],
      idealAnswer: "The grain defines what a single fact row represents — here, one daily observation per `(date, market, commodity)`. `fact_market_prices` holds numeric measures (`price_ugx`, `rainfall_mm`) and surrogate foreign keys. `dim_market`, `dim_commodity`, and `dim_date` hold descriptive attributes (district, category, month, quarter) for filtering and grouping. Defining the grain first ensures all measures share the same level of detail, preventing join fan-outs and double-counting."
    },
    {
      prompt: "In Apache Airflow, how do task dependencies protect data quality, and how should you configure retries across ingestion versus validation tasks?",
      topic: "Airflow Orchestration",
      keywords: ["dag", "dependency", "upstream_failed", "block", "ingest", "transient", "network", "validate", "deterministic", "retries", "backoff"],
      idealAnswer: "Airflow enforces a Directed Acyclic Graph (`ingest >> validate >> clean >> store >> report`). If `validate` detects a broken schema and raises an exception, Airflow marks downstream tasks as `upstream_failed`, preventing corrupt data from reaching storage or reports. Ingestion tasks should have multiple retries with backoff because external APIs and networks fail transiently, whereas validation and cleaning tasks are deterministic and should fail fast so engineers fix the underlying data contract."
    },
    {
      prompt: "Contrast narrow and wide transformations in PySpark. Why did DuckDB outperform PySpark on our 10,000-row dataset, and why did `.cache()` slow Spark down in our benchmark?",
      topic: "PySpark & Distributed Systems",
      keywords: ["narrow", "wide", "shuffle", "exchange", "partition", "lazy", "action", "cache", "materialise", "jvm", "overhead", "duckdb"],
      idealAnswer: "Narrow transformations (`filter`, `withColumn`) operate within each partition in memory, whereas wide transformations (`groupBy`, `join`) require a shuffle (`Exchange`) across the network and disk. On 10,000 rows, DuckDB finished in ~1.4s while Spark took ~11.2s because Spark incurs JVM startup, Catalyst planning, task serialisation, and shuffle overhead that dwarf the tiny compute work. Calling `.cache()` slowed our 2-action script down because materialising and storing the DataFrame in memory cost more than simply reading the small Parquet file from OS page cache."
    },
    {
      prompt: "In a real-time market price stream, events arrive out of order over mobile networks. Explain how Event Time, Tumbling Windows, and Watermarks work together.",
      topic: "Streaming Systems",
      keywords: ["event time", "processing time", "out of order", "tumbling window", "watermark", "allowed lateness", "finalise", "late events", "deduplication"],
      idealAnswer: "We bucket events by Event Time (`floor(event_ts / 10) * 10`) rather than Processing Time so delayed packets still land in the window when the price actually occurred. A watermark `W(t) = max_seen_event_ts − allowed_lateness` tracks stream progress. Whenever `W(t)` passes a window's end timestamp, that window is finalised and emitted. Events arriving with `event_ts < W(t)` are too late for their closed window and are routed to `late_events.jsonl`, while a `seen_ids` state store drops duplicate retries."
    },
    {
      prompt: "You are deploying a trained scikit-learn price model behind FastAPI in Docker. What are the three most critical engineering mistakes that break production ML services, and how do you prevent them?",
      topic: "Model Serving & Docker",
      keywords: ["training-serving skew", "shared features", "make_features", "startup", "per-request", "pydantic", "422", "column order", "docker", "pinned"],
      idealAnswer: "First, training-serving skew: duplicating feature logic between training and API leads to silent prediction drift; fix it by importing `make_features()` and `FEATURE_COLUMNS` from a single shared module (`src/common/features.py`). Second, loading `model.joblib` inside the `/predict` handler instead of once at startup, which adds hundreds of milliseconds of disk I/O to every request. Third, missing input validation and unpinned environments: use strict Pydantic schemas (`Literal`, `Field(ge=0, le=500)`) to reject bad payloads with HTTP 422, and package the service in a Dockerfile with pinned `requirements.txt`."
    },
    {
      prompt: "In the Milk Cooperative Practice Question (sample_qtn), why are both rows of a `record_id` collision rejected rather than keeping the first one, and why must `centre` text be tidied before running validation rules?",
      topic: "Practice Exam (sample_qtn)",
      keywords: ["collision", "both", "ambiguous", "exact duplicate", "rejected_df", "strip", "case", "unknown centre", "rows_in"],
      idealAnswer: "Unlike an exact duplicate where every column matches, a `record_id` collision has two conflicting records claiming the same delivery ID with different litres, prices, or farmers. Keeping the first row arbitrarily guesses which record is true and corrupts payouts, so both rows must be rejected into `rejected_df` for human audit. Tidying `centre` text (`strip().title()`) must happen before `rule_unknown_centre` so deliveries with trailing spaces or lowercase names (`' mbarara '`) match `centres.csv` instead of being falsely rejected."
    },
    {
      prompt: "In Practical Test 02 (dsc3103_test_02), some `farmer_id`s in `milk_clean.parquet` are missing from `farmers.csv`. How do you model this in `dim_farmer` and `fact_delivery` without losing rows or having NULL keys, and how does month partitioning speed up April 2026 queries?",
      topic: "Practical Test 02 (dsc3103_test_02)",
      keywords: ["unknown", "farmer_key", "coalesce", "left join", "20000", "null", "partition", "month", "pruning", "explain analyze"],
      idealAnswer: "Add an explicit Unknown farmer row (`farmer_key = 0, farmer_id = -1, farmer_name = 'Unknown'`) to `dim_farmer` and left-join `milk_clean.parquet` using `COALESCE(f.farmer_key, 0)`. This keeps all 20,000 fact rows, ensures zero NULL keys, and guarantees referential integrity. Partitioning `fact_delivery` by `month` writes 6 separate monthly Parquet directories (`2026-03` to `2026-08`); a query for April 2026 uses partition pruning to scan only 1 of the 6 files (3,201 rows instead of 20,000), while unhelpful predicates (like filtering only by `farmer_key` across all months) still scan all 6 partitions."
    }
  ],

  formulas: [
    ["Null rate", "null_pct = (missing_count / total_rows) × 100%"],
    ["IQR & Tukey fences", "IQR = Q3 − Q1,  bounds = [Q1 − 1.5·IQR, Q3 + 1.5·IQR]"],
    ["Row conservation (sample_qtn)", "rows_in = rows_kept + rows_rejected + exact_duplicates_removed"],
    ["Idempotency law", "f(f(D)) = f(D)  (state after N runs = state after 1 run)"],
    ["Columnar scan savings", "IO_parquet ≈ IO_row × (k_selected / k_total) ÷ compression_ratio"],
    ["Star schema fact grain", "|Fact| ≤ |dim_date| × |dim_market| × |dim_commodity|"],
    ["Unknown dimension mapping", "farmer_key = COALESCE(dim_farmer.farmer_key, 0)  -- 0 = 'Unknown'"],
    ["Window top-N per group", "RANK() OVER (PARTITION BY centre ORDER BY total_litres DESC) <= 3"],
    ["Airflow exponential backoff", "delay(k) = base_delay × 2^(k−1),  total = base × (2^R − 1)"],
    ["Spark partition waves", "waves = ⌈num_partitions / total_executor_cores⌉"],
    ["Partial aggregate reduction", "rows_shuffled ≤ num_partitions × num_distinct_keys"],
    ["Tumbling window & watermark", "W_start = ⌊ts/S⌋·S,   Watermark W(t) = max(event_ts) − L"],
    ["Serving batch throughput", "T_N = T_startup_load + N · T_infer  vs  N · (T_load + T_infer)"]
  ],

  labVariations: [
    /* Lab 0: Data Profiling, Validation & Cleaning */
    [
      {
        title: "Tukey 1.5×IQR Upper Outlier Fence",
        q: "In `market_prices_dirty.csv`, beans prices have <b>Q1 = 2,200 UGX</b> and <b>Q3 = 3,400 UGX</b>. What is the exact upper Tukey outlier fence (<code>Q3 + 1.5 × IQR</code>)?",
        answer: 5200,
        tol: 0,
        hint: "First compute IQR = Q3 − Q1 = 3,400 − 2,200 = 1,200, then add 1.5 × 1,200 to Q3.",
        explain: "IQR = 3,400 − 2,200 = 1,200 UGX. Upper fence = 3,400 + 1.5 × 1,200 = 3,400 + 1,800 = 5,200 UGX."
      },
      {
        title: "Multi-Stage Cleaning Retention Count",
        q: "A raw batch has <b>5,000</b> rows. Validation drops <b>6%</b> for missing primary keys, and deduplication removes <b>10%</b> of the remaining rows. How many clean rows are written to `data/processed/`?",
        answer: 4230,
        tol: 0,
        hint: "Remaining after primary key check = 5,000 × 0.94. Then multiply that result by 0.90.",
        explain: "After dropping 6% missing keys: 5,000 × 0.94 = 4,700 rows. After removing 10% duplicates: 4,700 × 0.90 = 4,230 clean rows."
      },
      {
        title: "Per-Commodity Median Imputation vs Mean Distortion",
        q: "Five observed maize prices in Owino are <b>[1800, 1900, 2000, 2100, 9700]</b> UGX (where 9700 is a data-entry typo). By how many UGX does the <b>mean</b> exceed the <b>median</b>?",
        answer: 1500,
        tol: 0,
        hint: "The median of the 5 sorted numbers is the 3rd value (2000). Compute the mean of all 5 and subtract 2000.",
        explain: "Mean = (1800 + 1900 + 2000 + 2100 + 9700) / 5 = 17,500 / 5 = 3,500 UGX. Median = 2,000 UGX. Difference = 3,500 − 2,000 = 1,500 UGX."
      }
    ],
    /* Lab 1: ETL vs ELT, Parquet & Idempotency */
    [
      {
        title: "Columnar Pruning + Compression I/O Savings",
        q: "A dataset has <b>10 columns</b> of equal byte width and occupies <b>240 MB</b> as an uncompressed CSV. Stored in Parquet with <b>3×</b> Snappy compression, how many <b>MB</b> does DuckDB read to scan just <b>2 columns</b>?",
        answer: 16,
        tol: 0.1,
        hint: "Column pruning reads 2/10 of the table, and Snappy shrinks that by 3×: 240 × (2/10) / 3.",
        explain: "2 of 10 columns = 48 MB uncompressed → divided by 3× compression = 16 MB scanned (a 15× reduction from 240 MB!)."
      },
      {
        title: "Non-Idempotent Retry Row Inflation",
        q: "A daily batch contains <b>1,500</b> unique records, with <b>200</b> records overlapping the previous day's load. The database already holds <b>10,000</b> rows. If a broken `append` job runs <b>3 times</b> (initial + 2 retries), how many excess rows are in the table compared to a single idempotent `upsert`?",
        answer: 3200,
        tol: 0,
        hint: "Idempotent upsert adds only the 1,300 truly new rows (total 11,300). Naive append adds 1,500 × 3 = 4,500 rows (total 14,500).",
        explain: "Idempotent upsert: 10,000 + (1,500 − 200) = 11,300 rows. 3× naive appends: 10,000 + 3 × 1,500 = 14,500 rows. Excess corrupt rows = 14,500 − 11,300 = 3,200."
      },
      {
        title: "Parquet Row-Group Predicate Pushdown",
        q: "A Parquet file has <b>800,000</b> rows split evenly into <b>8 row groups</b> sorted by `date`. A query filters `WHERE date = '2025-11-15'`, which falls inside a single row group. Using min/max statistics, how many thousand rows does DuckDB <b>skip</b> without reading?",
        answer: 700,
        tol: 0,
        hint: "Each row group has 100,000 rows. 7 of the 8 row groups are skipped completely.",
        explain: "Each row group holds 800,000 / 8 = 100,000 rows. Min/max pushdown skips 7 row groups = 700,000 rows (700 thousand)."
      }
    ],
    /* Lab 2: Star Schemas & DuckDB */
    [
      {
        title: "Star Schema Fact Table Cardinality",
        q: "Our Uganda market Star Schema tracks <b>8 markets</b>, <b>6 commodities</b>, across <b>90 days</b> with 100% daily coverage. At the grain of `(date, market, commodity)`, how many rows are in `fact_market_prices`?",
        answer: 4320,
        tol: 0,
        hint: "Multiply 8 markets × 6 commodities × 90 days.",
        explain: "|Fact| = 8 × 6 × 90 = 4,320 rows."
      },
      {
        title: "Denormalised CSV vs Star Schema Storage",
        q: "Storing descriptive strings directly in a <b>100,000-row</b> flat table uses <b>120 bytes/row</b>. Normalising into a Star Schema shrinks each fact row to <b>24 bytes</b> (with negligible dimension table size). How many <b>MB</b> (1 MB = 10⁶ bytes) are saved?",
        answer: 9.6,
        tol: 0.05,
        hint: "Compute (120 − 24) bytes × 100,000 rows, then divide by 1,000,000.",
        explain: "Saved per row = 120 − 24 = 96 bytes. Total saved = 96 × 100,000 = 9,600,000 bytes = 9.6 MB."
      },
      {
        title: "Grain Mismatch Fan-Trap Multiplier",
        q: "A market price row for 'Owino · Beans · 2025-05-10' (`price = 4,000 UGX`) is accidentally joined to an un-deduplicated `dim_market` table where 'Owino' appears <b>3 times</b> (for 3 sub-parishes). What inflated `SUM(price_ugx)` is produced for that single observation?",
        answer: 12000,
        tol: 0,
        hint: "A 1-to-3 dimension duplicate multiplies the fact row 3 times before SUM() runs.",
        explain: "The join fans out 1 fact row into 3 rows of 4,000 UGX → SUM = 3 × 4,000 = 12,000 UGX (3× fan-trap inflation)."
      }
    ],
    /* Lab 3: Workflow Orchestration with Apache Airflow */
    [
      {
        title: "Airflow Exponential Backoff Total Wait",
        q: "An `ingest` task is configured with `retries=3`, initial `retry_delay=20` seconds, and `retry_exponential_backoff=True` (doubling each retry: 20s, 40s, 80s). If all retries fail, how many total seconds were spent waiting in retry delays?",
        answer: 140,
        tol: 0,
        hint: "Add the 3 wait intervals: 20 + 40 + 80.",
        explain: "Retry 1 waits 20s, Retry 2 waits 40s, Retry 3 waits 80s → 20 + 40 + 80 = 140 seconds."
      },
      {
        title: "Critical Path End-to-End DAG Latency",
        q: "In a DAG, `ingest` (12s) fans out to two parallel tasks: `validate_schema` (8s) and `profile_stats` (25s). Both must finish before `clean` (15s) → `store` (10s). What is the critical-path runtime in seconds?",
        answer: 62,
        tol: 0,
        hint: "Parallel branches take max(8, 25) = 25s. Add 12 + 25 + 15 + 10.",
        explain: "Critical path = 12s (ingest) + max(8s, 25s) (parallel branch) + 15s (clean) + 10s (store) = 62 seconds."
      },
      {
        title: "Backfill Task Instance Count",
        q: "A daily Airflow DAG has <b>5 tasks</b> and is backfilled over a <b>14-day</b> historical window (`catchup=True`). How many total task instances does the Airflow scheduler execute?",
        answer: 70,
        tol: 0,
        hint: "Multiply 5 tasks per DAG run × 14 daily runs.",
        explain: "5 tasks/run × 14 runs = 70 task instances."
      }
    ],
    /* Lab 4: Distributed Batch Processing with PySpark */
    [
      {
        title: "Executor Core Waves Calculation",
        q: "A PySpark stage has <b>20 partitions</b> (each taking <b>4 seconds</b>) running on a cluster with <b>8 executor cores</b>. Assuming uniform partition sizes, how many seconds does the stage take to complete?",
        answer: 12,
        tol: 0,
        hint: "20 partitions across 8 cores require ceil(20 / 8) = 3 waves of 4 seconds each.",
        explain: "Wave 1 runs 8 partitions (4s), Wave 2 runs 8 partitions (4s), Wave 3 runs the remaining 4 partitions (4s) → 3 waves × 4s = 12 seconds."
      },
      {
        title: "Map-Side Partial HashAggregate Shuffle Reduction",
        q: "A DataFrame of <b>500,000 rows</b> across <b>10 partitions</b> is grouped by `market` (<b>6 distinct markets</b>). With map-side `HashAggregate` partial aggregation before the `Exchange` shuffle, what is the maximum number of intermediate records sent across the network?",
        answer: 60,
        tol: 0,
        hint: "Each of the 10 partitions outputs at most 6 partial `(market, sum, count)` records.",
        explain: "10 partitions × 6 distinct markets = at most 60 partial aggregate rows shuffled (down from 500,000 raw rows!)."
      },
      {
        title: "Spark `.cache()` Break-Even Action Count",
        q: "Reading & computing a DataFrame from disk costs <b>3.0s</b> per action. Materialising `.cache()` adds <b>4.5s</b> on the first action, after which cached reads take only <b>0.5s</b> per action. What is the minimum number of actions <b>N</b> where caching is strictly faster than not caching?",
        answer: 3,
        tol: 0,
        hint: "Compare Uncached(N) = 3.0·N vs Cached(N) = (3.0 + 4.5) + 0.5·(N − 1) = 7.0 + 0.5·N.",
        explain: "For N=2: Uncached = 6.0s, Cached = 7.5 + 0.5 = 8.0s (slower, just like Lab 8!). For N=3: Uncached = 9.0s, Cached = 7.5 + 1.0 = 8.5s (faster!). So N = 3 actions is the break-even point."
      }
    ],
    /* Lab 5: Streaming, Event-Time Windows & Watermarks */
    [
      {
        title: "Watermark Threshold & Late Event Routing",
        q: "A consumer tracks a watermark with allowed lateness <b>L = 5s</b>. The maximum seen `event_ts` so far is <b>1,240s</b>. What is the current watermark timestamp <b>W(t)</b>?",
        answer: 1235,
        tol: 0,
        hint: "W(t) = max_event_ts − L.",
        explain: "W(t) = 1,240 − 5 = 1,235s. Any incoming event with `event_ts < 1,235` is routed to `late_events.jsonl`."
      },
      {
        title: "10-Second Tumbling Window Start Alignment",
        q: "With <b>10-second</b> tumbling windows aligned to epoch 0 (`floor(ts / 10) * 10`), what is the `window_end` timestamp for an event with `event_ts = 1,748.6`?",
        answer: 1750,
        tol: 0,
        hint: "window_start = floor(1748.6 / 10) × 10 = 1740. window_end = window_start + 10.",
        explain: "window_start = ⌊1,748.6 / 10⌋ × 10 = 1,740. window_end = 1,740 + 10 = 1,750."
      },
      {
        title: "Stream Deduplication & Late Filtering Accounting",
        q: "A producer emits <b>250</b> raw events. <b>18</b> are duplicate retries (`event_id` already in `seen_ids`), and <b>12</b> of the unique events arrive with `event_ts < watermark`. How many clean on-time events are aggregated into windows?",
        answer: 220,
        tol: 0,
        hint: "Subtract both duplicates (18) and late events (12) from 250.",
        explain: "250 total − 18 duplicates − 12 late stragglers = 220 valid windowed events."
      }
    ],
    /* Lab 6: From Model to Data Product: FastAPI & Docker */
    [
      {
        title: "Startup Model Load vs Per-Request Load Latency",
        q: "Loading `model.joblib` from disk takes <b>150 ms</b> and `model.predict()` takes <b>5 ms</b>. For <b>200</b> requests, how many <b>seconds</b> are saved by loading the model once at FastAPI startup instead of inside `/predict`?",
        answer: 29.85,
        tol: 0.05,
        hint: "Per-request load = 200 × 155 ms = 31,000 ms. Startup load = 150 + 200 × 5 = 1,150 ms. Subtract and convert to seconds.",
        explain: "Per-request: 200 × (150 + 5) = 31,000 ms. Startup once: 150 + 200 × 5 = 1,150 ms. Saved = 29,850 ms = 29.85 seconds."
      },
      {
        title: "Training-Serving Skew Prediction Drift (Step 8)",
        q: "In Lab 9 Part 2 Step 8, for `Ownio · Beans · rainfall_mm = 8.2`, the true model (`is_rainy = rainfall > 5.0`) predicts <b>2,927.25 UGX</b>, while the skewed API (`rainfall > 10.0`) predicts <b>2,889.58 UGX</b>. What is the absolute prediction error (in UGX, to 2 decimals) caused purely by training-serving skew?",
        answer: 37.67,
        tol: 0.02,
        hint: "Compute 2927.25 − 2889.58.",
        explain: "2,927.25 − 2,889.58 = 37.67 UGX of silent error with HTTP 200 OK."
      },
      {
        title: "One-Hot Feature Vector Dimensionality",
        q: "Our shared `make_features()` extracts <b>3 numeric features</b> (`rainfall_mm`, `is_rainy`, `month`, `day_of_week` = <b>4</b> numeric features total) plus one-hot encodings for <b>4 markets</b> and <b>4 commodities</b> (without dropping first). How many total columns are in `FEATURE_COLUMNS`?",
        answer: 12,
        tol: 0,
        hint: "Add 4 numeric/temporal features + 4 market indicators + 4 commodity indicators.",
        explain: "4 numeric/calendar features (`rainfall_mm`, `is_rainy`, `month`, `day_of_week`) + 4 market columns + 4 commodity columns = 12 features."
      }
    ],
    /* Lab 7: Practice Exam (sample_qtn): Milk Validation & Collisions */
    [
      {
        title: "Row Conservation with Exact Duplicates & Collisions",
        q: "A raw milk batch has <b>500 rows</b>. During `clean_milk()`, you remove <b>14 exact duplicate copies</b> (`keep='first'`), find <b>6 `record_id` keys</b> that each have <b>2 conflicting rows</b> (collisions), and reject <b>24 additional rows</b> for invalid dates or non-positive litres. How many rows are in `clean_df`?",
        answer: 450,
        tol: 0,
        hint: "6 colliding record_ids × 2 rows each = 12 rows rejected for collision. Total rejected = 12 + 24 = 36. Subtract 14 exact dupes and 36 rejected rows from 500.",
        explain: "Row conservation: 500 raw − 14 exact duplicates removed − (6 × 2 = 12 collision rows rejected) − 24 domain-rejected rows = 450 clean rows."
      },
      {
        title: "Rule Ordering Trap: Tidying Centre Before Validation",
        q: "In `milk_raw.csv` (400 rows), <b>45 rows</b> have `centre = ' mbarara '` (with spaces/lowercase) and <b>9 rows</b> have `centre = 'Kampala'` (not one of the 5 cooperative centres). How many fewer false rejections occur when `rule_unknown_centre` runs <b>after</b> `.str.strip().str.title()` instead of before?",
        answer: 45,
        tol: 0,
        hint: "All 45 `' mbarara '` rows normalize to `'Mbarara'` (valid) after tidying, whereas `'Kampala'` remains unknown.",
        explain: "Before tidying, 45 + 9 = 54 rows fail `rule_unknown_centre`. After `.str.strip().str.title()`, only the 9 `'Kampala'` rows fail — saving 45 valid Mbarara deliveries from false rejection!"
      },
      {
        title: "Reference Join Unmatched Centre Rate",
        q: "You run `join_centres(clean_df, centres_df)` with `how='left'` on <b>450 clean rows</b>. In the result, <b>432 rows</b> have a non-null `daily_capacity_litres`. What percentage of clean deliveries came from unregistered centres?",
        answer: 4,
        tol: 0,
        hint: "Unmatched rows = 450 − 432 = 18. Compute (18 / 450) × 100.",
        explain: "450 − 432 = 18 unmatched rows (where `daily_capacity_litres` is NaN). 18 / 450 = 0.04 = 4%."
      }
    ],
    /* Lab 8: Practical Test 02 (dsc3103_test_02): Milk Star Schema & Analytics */
    [
      {
        title: "Unregistered Farmer Deliveries in `milk_clean.parquet`",
        q: "In `dsc3103_test_02`, `milk_clean.parquet` has <b>20,000 rows</b> across <b>300 distinct `farmer_id`s</b>, while `farmers.csv` only contains <b>294 registered farmers</b>. The 6 unregistered farmers (`113, 126, 172, 226, 255, 334`) have <b>61, 68, 69, 67, 75, and 68</b> deliveries respectively. How many rows in `fact_delivery` map to the Unknown Farmer (`farmer_key = 0`)?",
        answer: 408,
        tol: 0,
        hint: "Sum the deliveries of the 6 unregistered farmers: 61 + 68 + 69 + 67 + 75 + 68.",
        explain: "61 + 68 + 69 + 67 + 75 + 68 = 408 deliveries! Using `LEFT JOIN dim_farmer` + `COALESCE(f.farmer_key, 0)` preserves all 20,000 rows while mapping these 408 rows to `farmer_key = 0 ('Unknown')`."
      },
      {
        title: "Two-Stage Capacity Aggregation (Kiruhura Days Over Capacity)",
        q: "In `dsc3103_test_02`, Kiruhura's `daily_capacity_litres` is <b>950 L</b>. A single delivery is only ~24 L (`max = 46.8 L`), so checking `f.litres > c.daily_capacity_litres` row-by-row gives <b>0 days</b>. When properly aggregated by `(centre_key, date_key)` first across the 184 days, how many days did Kiruhura exceed its 950 L daily capacity?",
        answer: 41,
        tol: 0,
        hint: "Inspect the actual DuckDB result from `days_over_capacity(con)` for Kiruhura (capacity 950 L, worst day 1,203.5 L).",
        explain: "In the actual test dataset, Kiruhura exceeded 950 L/day on 41 out of 184 days (peaking at 1,203.5 L), followed by Masaka (36 days), Mbale (32 days), Gulu (28 days), and Mbarara (23 days)."
      },
      {
        title: "April 2026 Partition Pruning & Row Count",
        q: "`milk_clean.parquet` spans 6 months (`2026-03` through `2026-08`) with monthly row counts: Mar=`3,311`, Apr=`3,201`, May=`3,463`, Jun=`3,303`, Jul=`3,353`, Aug=`3,369` (total = `20,000`). When partitioned by `year_month`, how many rows are scanned by a query filtering `WHERE delivery_date >= '2026-04-01' AND delivery_date < '2026-05-01'`?",
        answer: 3201,
        tol: 0,
        hint: "Partition pruning reads ONLY `year_month=2026-04/*.parquet` and skips the other 5 monthly folders.",
        explain: "DuckDB prunes 5 of the 6 monthly partitions and scans only the `year_month=2026-04` partition containing 3,201 rows (saving 84% of file I/O)."
      }
    ]
  ],
  visuals: [
  /* 0 — Data Profiling, Validation & Cleaning */
  (ci, p, t) => {
    if (ci === 0 || ci === 1){
      heading(ci===0 ? "Raw field data is messy by default" : "Rule #1: Raw data is strictly immutable", ci===0 ? "Missing prices, negative values, mixed case, duplicate keys" : "Never overwrite data/raw/ · write deterministic outputs to data/processed/");
      const rows = [
        ["date","market","commodity","price_ugx","status"],
        ["2025-03-01","Owino","Beans","3400","✓ valid"],
        ["2025-03-01","owino ","beans","3400","✗ duplicate + case"],
        ["2025-03-02","Nakasero","Maize","NULL","✗ missing price"],
        ["2025-03-02","Kalerwe","Matooke","-1500","✗ negative domain"],
        ["bad-date","Gulu","Rice","4100","✗ unparseable date"]
      ];
      rows.forEach((r, ri) => {
        const y = 86 + ri * 34;
        const bad = ri > 1;
        rect(36, y, 648, 30, {f: ri===0 ? C.navy : bad ? C.rustL : C.sageL, s: C.line2, r: 4});
        const xs = [48, 175, 300, 430, 535];
        r.forEach((cell, colIdx) => {
          txt(cell, xs[colIdx], y + 20, {mono: colIdx !== 4 && ri > 0, s: 12, w: ri===0 || colIdx===4 ? 600 : 400, c: ri===0 ? "#fff" : (colIdx===4 ? (bad ? C.rust : C.sage) : C.ink)});
        });
      });
      if (ci === 1){
        formulaBar("data/raw/market_prices_dirty.csv (READ-ONLY)  ──clean.py──▶  data/processed/market_prices_clean.parquet");
      }
    } else if (ci === 2 || ci === 3){
      heading("Profile first, then enforce the validation gate", ci===3 ? "Checkpoint — why per-commodity median instead of global mean?" : "Quantify nulls, schema types, and IQR bounds before mutating anything");
      const metrics = [["Rows profiled","10,500",C.navy],["Missing price_ugx","4.2%",C.goldD],["Exact/key dupes","5.0%",C.rust],["Negative prices","38 rows",C.rust]];
      metrics.forEach(([k,v,c],i)=>{
        const x = 36 + i*164;
        rect(x, 92, 152, 74, {f:"#fff", s:C.line2, r:8});
        txt(k, x+14, 118, {s:11.5, c:C.muted, w:600});
        txt(v, x+14, 150, {mono:true, s:20, w:600, c});
      });
      // Boxplot & skew comparison
      txt("Right-skewed commodity prices (UGX/kg)", 40, 200, {s:13.5, w:600});
      line(60, 250, 620, 250, C.line2, 2);
      rect(150, 232, 160, 36, {f:C.goldXL, s:C.gold, lw:2, r:4});
      line(210, 228, 210, 272, C.sage, 3);
      txt("Median = 3,200 (robust)", 210, 292, {a:"center", s:12, w:600, c:C.sage});
      circle(560, 250, 6, {f:C.rust}); circle(595, 250, 6, {f:C.rust});
      line(340, 228, 340, 272, C.rust, 2.5, [4,3]);
      txt("Mean = 4,450 (pulled by outliers!)", 395, 218, {a:"center", s:12, w:600, c:C.rust});
      formulaBar("Tukey fence: [Q1 − 1.5·IQR,  Q3 + 1.5·IQR]   ·   Impute by group median");
    } else {
      heading("Deterministic 4-stage cleaning funnel", "Every stage logs exact row counts in and out");
      const stages = [
        ["1. Raw CSV", 10500, C.navy],
        ["2. Drop null keys", 10080, C.sky],
        ["3. Deduplicate keys", 9576, C.gold],
        ["4. Impute & bound", 9576, C.sage]
      ];
      const e = ease(p * 1.3);
      stages.forEach(([label, cnt, col], i) => {
        const y = 96 + i * 52;
        const w = (cnt / 10500) * 380 * e;
        txt(label, 40, y + 22, {s:13, w:600});
        rect(200, y, w, 34, {f:col, r:6});
        txt(`${cnt.toLocaleString()} rows`, 212 + w, y + 22, {mono:true, s:12.5, w:600, c:C.ink2});
      });
      formulaBar("Composite key: (date, market, commodity) · 0 duplicates · 0 nulls");
    }
  },
  /* 1 — Pipelines: ETL vs ELT, Parquet & Idempotency */
  (ci, p, t) => {
    if (ci <= 1){
      heading("From notebook spaghetti to modular pipeline", "ETL transforms before load · ELT loads raw and transforms in-warehouse");
      const boxes = [["profile.py","stats & nulls",C.skyL,C.sky],["validate.py","schema gate",C.goldL,C.goldD],["clean.py","dedupe & median",C.goldL,C.goldD],["store.py","Parquet + DB",C.sageL,C.sage]];
      boxes.forEach(([title,sub,f,c],i)=>{
        const x = 36 + i * 168, active = Math.floor(t*1.2)%4 === i;
        rect(x, 120, 144, 82, {f: active ? c : f, s:c, lw:2, r:10});
        txt(title, x+72, 154, {a:"center", mono:true, s:13, w:600, c: active?"#fff":C.ink});
        txt(sub, x+72, 178, {a:"center", s:11.5, c: active?"#fff":C.ink2});
        if (i < 3) arrow(x+146, 161, x+165, 161, C.gold, 2);
      });
      txt("Orchestrated by run_pipeline.py with structured logging & exit codes", W/2, 250, {a:"center", s:13, c:C.ink2});
      formulaBar("ETL: Extract → Transform (Python) → Load   |   ELT: Extract → Load → Transform (DuckDB SQL)");
    } else if (ci === 2){
      heading("Row-oriented CSV vs Columnar Parquet", "Analytical queries only read the columns they need");
      txt("CSV (Row-oriented: scans every column of every row)", 40, 100, {s:12.5, w:600, c:C.rust});
      for (let r=0;r<3;r++) for (let c=0;c<5;c++){
        rect(40 + c*56, 112 + r*28, 52, 24, {f:C.rustL, s:C.rust, r:3});
        txt(["date","mkt","item","price","rain"][c], 66+c*56, 128+r*28, {a:"center", mono:true, s:10, c:C.rust});
      }
      txt("Parquet (Columnar: reads ONLY mkt + price)", 380, 100, {s:12.5, w:600, c:C.sage});
      for (let c=0;c<5;c++){
        const sel = c===1 || c===3;
        rect(380 + c*58, 112, 52, 82, {f: sel ? C.sageL : "#F5F2EA", s: sel ? C.sage : C.line2, lw: sel?2:1, r:4});
        txt(["date","mkt","item","price","rain"][c], 406+c*58, 155, {a:"center", mono:true, s:11, w:sel?700:400, c: sel?C.sage:C.muted});
      }
      formulaBar("Parquet + Snappy: explicit schema + dictionary encoding + column pruning + min/max pushdown");
    } else {
      heading(ci===3 ? "Checkpoint — Idempotency in pipelines" : "Idempotent Upsert vs Broken Append", "Running the same job 3 times must leave the exact same row count");
      const runs = [1, 2, 3];
      txt("Naive Append (BROKEN)", 170, 102, {a:"center", s:13.5, w:600, c:C.rust});
      txt("Idempotent Upsert / Atomic Replace (SAFE)", 515, 102, {a:"center", s:13.5, w:600, c:C.sage});
      runs.forEach((r, i) => {
        const y = 122 + i * 54;
        rect(50, y, 80 * r, 34, {f:C.rust, r:5});
        txt(`Run ${r}: ${(10000*r).toLocaleString()} rows`, 60 + 80*r, y+22, {mono:true, s:12, c:C.rust, w:600});
        rect(410, y, 110, 34, {f:C.sage, r:5});
        txt(`Run ${r}: 10,000 rows`, 532, y+22, {mono:true, s:12, c:C.sage, w:600});
      });
      formulaBar("f(f(D)) = f(D)   ·   Write to .tmp → os.replace()   ·   INSERT OR REPLACE on primary key");
    }
  },
  /* 2 — Analytical Star Schemas & DuckDB */
  (ci, p, t) => {
    heading(ci===3 ? "Checkpoint — Facts, Dimensions & Grain" : "Kimball Star Schema for Market Analytics", "Central fact table at atomic grain surrounded by descriptive dimensions");
    // Center Fact Table
    rect(245, 130, 230, 125, {f:C.goldXL, s:C.gold, lw:2.5, r:10});
    txt("fact_market_prices", 360, 154, {a:"center", mono:true, s:13.5, w:700, c:C.goldD});
    ["🔑 date_key (FK)","🔑 market_key (FK)","🔑 commodity_key (FK)","📊 price_ugx (measure)","📊 rainfall_mm (measure)"].forEach((s,i)=>{
      txt(s, 262, 176 + i*16, {mono:true, s:11, c: i<3 ? C.navy : C.ink});
    });
    // Dimensions
    const dims = [
      ["dim_date", 28, 86, ["date_key (PK)","full_date","month, quarter","is_rainy_season"]],
      ["dim_market", 28, 215, ["market_key (PK)","market_name","district, region","urban_rural"]],
      ["dim_commodity", 518, 145, ["commodity_key (PK)","commodity_name","category","unit_kg"]]
    ];
    dims.forEach(([name, x, y, cols]) => {
      rect(x, y, 174, 96, {f:C.navyL, s:C.navy, lw:1.8, r:8});
      txt(name, x+87, y+22, {a:"center", mono:true, s:12.5, w:700, c:C.navy});
      cols.forEach((c, idx) => txt(c, x+12, y+42+idx*14, {mono:true, s:10.5, c:C.ink2}));
    });
    arrow(202, 134, 245, 165, C.navy, 1.8);
    arrow(202, 255, 245, 215, C.navy, 1.8);
    arrow(518, 192, 475, 192, C.navy, 1.8);
    formulaBar("Declared Grain: 1 row per (date, market, commodity) · MD5 surrogate keys");
  },
  /* 3 — Workflow Orchestration with Apache Airflow */
  (ci, p, t) => {
    heading(ci===3 ? "Checkpoint — Retries & Failure Propagation" : "Apache Airflow DAG: market_pipeline_dag", "ingest >> validated >> cleaned >> stored >> report_gen");
    const tasks = ["ingest","validated","cleaned","stored","report_gen"];
    const failMode = ci === 2 || ci === 3;
    const activeIdx = Math.floor(t * 1.1) % 5;
    tasks.forEach((name, i) => {
      const x = 32 + i * 134, y = 135;
      let fill = "#fff", stroke = C.sage, label = "success";
      if (failMode){
        if (i === 0){ fill = C.sageL; stroke = C.sage; label = "success"; }
        else if (i === 1){ fill = C.rustL; stroke = C.rust; label = "failed ✗"; }
        else { fill = "#F2EFE9"; stroke = C.muted; label = "upstream_failed"; }
      } else {
        if (i < activeIdx){ fill = C.sageL; stroke = C.sage; label = "success ✓"; }
        else if (i === activeIdx){ fill = C.goldL; stroke = C.gold; label = "running ↻"; }
        else { fill = "#fff"; stroke = C.line2; label = "scheduled"; }
      }
      rect(x, y, 114, 70, {f:fill, s:stroke, lw:2, r:10});
      txt(name, x+57, y+30, {a:"center", mono:true, s:12, w:700});
      txt(label, x+57, y+52, {a:"center", s:10.5, w:600, c:stroke});
      if (i < 4) arrow(x+115, y+35, x+132, y+35, stroke, 1.8);
    });
    txt("ingest: retries=3, retry_delay=2m (network transient)", 40, 250, {mono:true, s:12, c:C.navy});
    txt("validated / cleaned: retries=1 (deterministic schema check — fail fast!)", 40, 274, {mono:true, s:12, c:C.goldD});
    formulaBar("Topological DAG execution · XCom passes file paths/counts (never giant DataFrames)");
  },
  /* 4 — Distributed Batch Processing with PySpark */
  (ci, p, t) => {
    if (ci <= 2){
      heading("PySpark Architecture: Driver, Executors & Lazy DAG", "1 Partition = 1 Parallel Task · Transformations wait for an Action");
      rect(40, 115, 130, 90, {f:C.navy, r:10});
      txt("Spark Driver", 105, 152, {a:"center", s:13.5, w:700, c:"#fff"});
      txt("Catalyst DAG", 105, 174, {a:"center", mono:true, s:11, c:C.goldL});
      for (let i=0;i<4;i++){
        const y = 88 + i * 54;
        arrow(174, 160, 250, y+20, C.gold, 1.6);
        rect(255, y, 190, 42, {f:C.skyL, s:C.sky, r:6});
        txt(`Partition ${i+1} → Task ${i+1}`, 350, y+26, {a:"center", mono:true, s:12, w:600, c:C.navy});
        arrow(448, y+20, 505, 160, C.sage, 1.6);
      }
      rect(510, 120, 165, 80, {f:C.goldXL, s:C.gold, lw:2, r:10});
      txt("Action: collect()", 592, 154, {a:"center", mono:true, s:13, w:700, c:C.goldD});
      txt("triggers physical plan", 592, 176, {a:"center", s:11.5, c:C.ink2});
      formulaBar("filter() / withColumn() = Lazy Narrow   |   groupBy() = Lazy Wide   |   collect() / count() = Action");
    } else {
      heading(ci===3 ? "Checkpoint — Narrow vs Wide & Caching" : "Shuffle Barrier (Exchange) & Lab 8 Benchmark", "Wide transformations redistribute rows across partitions via network I/O");
      // Left: Narrow vs Wide
      txt("Narrow (in-partition)", 125, 98, {a:"center", s:12.5, w:600, c:C.sage});
      for (let i=0;i<3;i++){
        rect(45, 112+i*42, 60, 30, {f:C.sageL, s:C.sage, r:4});
        arrow(108, 127+i*42, 142, 127+i*42, C.sage);
        rect(145, 112+i*42, 60, 30, {f:C.sageL, s:C.sage, r:4});
      }
      txt("Wide (Shuffle Exchange)", 340, 98, {a:"center", s:12.5, w:600, c:C.rust});
      for (let i=0;i<3;i++){
        rect(260, 112+i*42, 60, 30, {f:C.goldL, s:C.gold, r:4});
        rect(365, 112+i*42, 60, 30, {f:C.rustL, s:C.rust, r:4});
        for (let j=0;j<3;j++) line(320, 127+i*42, 365, 127+j*42, "rgba(181,82,59,0.45)", 1.3);
      }
      // Right: Lab 8 real numbers
      rect(460, 98, 225, 185, {f:"#fff", s:C.line2, r:8});
      txt("Lab 8 Benchmark (10k rows)", 476, 124, {s:12.5, w:700});
      const bars = [["DuckDB", 1.39, C.sage], ["Spark (no cache)", 3.04, C.sky], ["Spark (cached)", 8.85, C.gold], ["Spark cold start", 11.21, C.rust]];
      bars.forEach(([lbl, sec, col], i) => {
        const y = 142 + i * 32;
        txt(lbl, 476, y+14, {s:11, c:C.ink2});
        rect(575, y+2, sec * 7.5, 16, {f:col, r:3});
        txt(`${sec}s`, 580 + sec*7.5, y+14, {mono:true, s:10.5, w:600});
      });
      formulaBar("Partial HashAggregate before Exchange reduces shuffle volume by orders of magnitude");
    }
  },
  /* 5 — Streaming, Event-Time Windows & Watermarks */
  (ci, p, t) => {
    heading(ci===3 ? "Checkpoint — Event Time & Watermarks" : "Stateful Event-Time Stream Consumer (Lab 9.1)", "Watermark W(t) = max(event_ts) − 5s · 10s Tumbling Windows");
    // Timeline axis
    const ox = 50, oy = 185, w = 620;
    line(ox, oy, ox+w, oy, C.ink2, 2);
    // Draw 10s tumbling windows: [1000,1010), [1010,1020), [1020,1030)
    const wins = [["[1000, 1010)","FINALIZED ✓",C.sageL,C.sage],["[1010, 1020)","ACTIVE (open)",C.goldXL,C.gold],["[1020, 1030)","ACTIVE (open)",C.skyL,C.sky]];
    wins.forEach(([lbl, st, f, c], i) => {
      const x = ox + i * 200;
      rect(x, 105, 196, 68, {f, s:c, lw:2, r:6});
      txt(`Window ${lbl}`, x+98, 130, {a:"center", mono:true, s:12, w:700, c:C.ink});
      txt(st, x+98, 152, {a:"center", s:11.5, w:600, c});
    });
    // Watermark line at 1014s -> finalized [1000,1010)
    const wmX = ox + 280;
    line(wmX, 90, wmX, 275, C.rust, 2.5, [5,4]);
    tag("Watermark W(t) = 1014s (max 1019s − 5s)", wmX - 115, 290, {f:C.rust, c:"#fff"});
    // Late event vs duplicate
    circle(ox + 95, 225, 8, {f:C.rust});
    txt("late event (ts=1004s < 1014s) → late_events.jsonl", ox + 112, 229, {mono:true, s:11.5, c:C.rust, w:600});
    circle(ox + 340, 252, 8, {f:C.navy});
    txt("duplicate event_id in seen_ids → duplicate_events.jsonl", ox + 357, 256, {mono:true, s:11.5, c:C.navy, w:600});
    formulaBar("if event_id in seen_ids: drop   |   elif event_ts < W(t): route_late   |   else: add_to_window");
  },
  /* 6 — From Model to Data Product: FastAPI & Docker */
  (ci, p, t) => {
    if (ci <= 2){
      heading("FastAPI Model Service Architecture (Lab 9.2 / Lab 10)", "Load model.joblib ONCE at startup · Validate inputs with Pydantic");
      const nodes = [
        ["POST /predict","JSON request",C.skyL,C.sky],
        ["Pydantic","422 on bad input",C.goldL,C.goldD],
        ["make_features()","src/common/features.py",C.sageL,C.sage],
        ["model.predict()","in-memory joblib",C.navyL,C.navy]
      ];
      nodes.forEach(([a,b,f,c],i)=>{
        const x = 32 + i * 168;
        rect(x, 120, 148, 78, {f, s:c, lw:2, r:10});
        txt(a, x+74, 152, {a:"center", mono:true, s:12.5, w:700, c:C.ink});
        txt(b, x+74, 174, {a:"center", s:11, c:C.ink2});
        if (i < 3) arrow(x+150, 159, x+166, 159, C.gold, 2);
      });
      rect(180, 232, 360, 52, {f:C.goldXL, s:C.gold, r:8});
      txt("Startup Lifespan: loads model.joblib + model_metadata.json ONCE", 360, 263, {a:"center", mono:true, s:12, w:600, c:C.goldD});
      formulaBar("GET /health → {status: 'ok', model_version: '20261106-003604'}   |   POST /predict → 2927.25 UGX");
    } else {
      heading(ci===3 ? "Checkpoint — Training-Serving Skew" : "Preventing Training-Serving Skew (Step 8 Experiment)", "Both train.py and main.py import make_features() from src/common/features.py");
      // Shared module at top
      rect(210, 88, 300, 52, {f:C.sage, r:10});
      txt("src/common/features.py :: make_features()", 360, 119, {a:"center", mono:true, s:12.5, w:700, c:"#fff"});
      arrow(290, 142, 175, 185, C.sage, 2);
      arrow(430, 142, 545, 185, C.sage, 2);
      rect(55, 188, 240, 86, {f:C.sageL, s:C.sage, lw:2, r:8});
      txt("Consistent Serving (is_rainy > 5.0)", 175, 214, {a:"center", s:12, w:700, c:C.sage});
      txt("rainfall = 8.2 mm → is_rainy = 1", 175, 236, {a:"center", mono:true, s:11.5});
      txt("predicted_price = 2,927.25 UGX ✓", 175, 258, {a:"center", mono:true, s:12, w:700, c:C.sage});
      rect(425, 188, 240, 86, {f:C.rustL, s:C.rust, lw:2, r:8});
      txt("Skewed Serving Bug (is_rainy > 10.0)", 545, 214, {a:"center", s:12, w:700, c:C.rust});
      txt("rainfall = 8.2 mm → is_rainy = 0", 545, 236, {a:"center", mono:true, s:11.5});
      txt("predicted_price = 2,889.58 UGX ✗", 545, 258, {a:"center", mono:true, s:12, w:700, c:C.rust});
      formulaBar("Silent skew error = −37.67 UGX with HTTP 200 OK! Shared feature code eliminates skew.");
    }
  },
  /* 7 — Practice Exam (sample_qtn): Milk Validation & Collisions */
  (ci, p, t) => {
    if (ci <= 2){
      heading("Exact Duplicates vs record_id Collisions (sample_qtn)", "Keep 1 copy of exact duplicates · Reject BOTH rows on record_id collisions");
      // Two comparison boxes
      rect(36, 96, 310, 150, {f:C.sageL, s:C.sage, lw:2, r:8});
      tag("Case A: Exact Duplicate", 46, 122, {f:C.sage, c:"#fff"});
      txt("Row 1: (id=101, Mbarara, 40L, 2026-03-01)", 50, 150, {mono:true, s:10.5});
      txt("Row 2: (id=101, Mbarara, 40L, 2026-03-01)", 50, 172, {mono:true, s:10.5});
      txt("Action: Drop 2nd copy (keep='first')", 50, 200, {s:12, w:700, c:C.sage});
      txt("Preserves 1 legitimate farmer delivery ✓", 50, 222, {s:11.5, c:C.ink2});

      rect(374, 96, 310, 150, {f:C.rustL, s:C.rust, lw:2, r:8});
      tag("Case B: record_id Collision", 384, 122, {f:C.rust, c:"#fff"});
      txt("Row 1: (id=102, Masaka,  50L, 2026-03-01)", 388, 150, {mono:true, s:10.5});
      txt("Row 2: (id=102, Kiruhura, 12L, 2026-03-02)", 388, 172, {mono:true, s:10.5});
      txt("Action: Reject BOTH into rejected_df!", 388, 200, {s:12, w:700, c:C.rust});
      txt("Arbitrary pick corrupts payouts ✗", 388, 222, {s:11.5, c:C.ink2});

      formulaBar("assert rows_in == len(clean_df) + len(rejected_df) + exact_dupes_removed");
    } else {
      heading("Rule Ordering: Text Tidying Before Domain Rules", "Never reject ' mbarara ' just because of whitespace or lowercase noise");
      rect(50, 102, 280, 138, {f:C.rustL, s:C.rust, r:8});
      txt("Wrong Order (Validate First)", 190, 130, {a:"center", s:13, w:700, c:C.rust});
      txt("' mbarara ' in allowed_centres? ✗ False", 190, 160, {a:"center", mono:true, s:11});
      txt("45 valid deliveries rejected!", 190, 185, {a:"center", s:12, c:C.rust, w:600});

      rect(390, 102, 280, 138, {f:C.sageL, s:C.sage, r:8});
      txt("Correct Order (Tidy First)", 530, 130, {a:"center", s:13, w:700, c:C.sage});
      txt("s.str.strip().str.title() → 'Mbarara'", 530, 160, {a:"center", mono:true, s:11});
      txt("'Mbarara' in allowed_centres? ✓ True", 530, 185, {a:"center", s:12, c:C.sage, w:600});
      formulaBar("clean_milk(df) returns (clean_df, rejected_df) with 100% row conservation");
    }
  },
  /* 8 — Practical Test 02 (dsc3103_test_02): Milk Star Schema & Analytics */
  (ci, p, t) => {
    if (ci <= 2){
      heading("Star Schema with 6 Unregistered Farmers (dsc3103_test_02)", "20,000 deliveries · 294 known farmers · 6 unregistered farmers = 408 deliveries");
      // Fact Delivery box in center
      rect(230, 96, 260, 150, {f:C.navyL, s:C.navy, lw:2, r:8});
      txt("fact_delivery (20,000 rows)", 360, 124, {a:"center", s:13, w:700, c:C.navy});
      txt("delivery_key, date_key", 360, 148, {a:"center", mono:true, s:11});
      txt("farmer_key, centre_key", 360, 168, {a:"center", mono:true, s:11});
      txt("litres, fat_content, price_ugx, revenue_ugx", 360, 188, {a:"center", mono:true, s:10});
      txt("Zero NULL keys · 100% FK integrity", 360, 218, {a:"center", s:11.5, w:600, c:C.sage});

      // dim_farmer left
      rect(20, 110, 180, 120, {f:C.goldXL, s:C.gold, r:8});
      txt("dim_farmer (295 rows)", 110, 136, {a:"center", s:12, w:700, c:C.goldD});
      txt("farmer_key = 0 ('Unknown')", 110, 162, {a:"center", mono:true, s:10.5, c:C.rust, w:700});
      txt("1..294: registered farmers", 110, 184, {a:"center", s:11, c:C.ink2});
      txt("COALESCE(f.key, 0) maps 408 rows", 110, 206, {a:"center", s:10.5, c:C.goldD});
      arrow(200, 165, 230, 165, C.gold, 2);

      // dim_centre right
      rect(520, 110, 180, 120, {f:C.sageL, s:C.sage, r:8});
      txt("dim_centre (5 rows)", 610, 136, {a:"center", s:12, w:700, c:C.sage});
      txt("Kiruhura: 950 L/day", 610, 162, {a:"center", s:11});
      txt("Masaka:   750 L/day", 610, 182, {a:"center", s:11});
      txt("Mbarara, Mbale, Gulu", 610, 202, {a:"center", s:11});
      arrow(520, 165, 490, 165, C.sage, 2);

      formulaBar("LEFT JOIN dim_farmer f ON raw.farmer_id = f.farmer_id  →  COALESCE(f.farmer_key, 0)");
    } else {
      heading("Two-Stage Aggregation: Days Over Daily Capacity", "Sum deliveries per day FIRST · Single delivery is ~24 L, capacity is 300–950 L");
      const centres = [
        ["Kiruhura", 950, 41, 1203.5, C.rust],
        ["Masaka",   750, 36,  997.0, C.rust],
        ["Mbale",    400, 32,  702.0, C.goldD],
        ["Gulu",     300, 28,  471.8, C.goldD],
        ["Mbarara",  750, 23,  989.6, C.sage]
      ];
      centres.forEach(([cName, cap, days, peak, col], i) => {
        const y = 98 + i * 32;
        txt(`${cName} (cap ${cap} L/d):`, 40, y + 16, {s:12, w:600});
        rect(220, y + 2, days * 7.5, 20, {f:col, r:4});
        txt(`${days} days over capacity (peak ${peak} L)`, 228 + days*7.5, y + 16, {mono:true, s:11, w:600, c:C.ink});
      });
      formulaBar("WITH daily AS (SELECT centre_key, date_key, SUM(litres) AS tot GROUP BY 1,2) SELECT ... WHERE tot > cap");
    }
  }
  ],

  labs: [
  /* Lab 0: Data Profiling, Validation & Cleaning */
  {
    title: "Data Profiler, Tukey Outlier Gate & Median Imputer",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Interactive Cleaning Funnel (Lab 2)</h3>
        <p class="small muted">Adjust raw batch characteristics from <code>market_prices_dirty.csv</code> and inspect how validation & deduplication filter rows.</p>
        <div class="field"><div class="range-head"><span>Raw ingested rows</span><output id="ds0-ro">5000</output></div><input type="range" id="ds0-r" min="1000" max="20000" step="500" value="5000"></div>
        <div class="field"><div class="range-head"><span>Missing primary-key rate (%)</span><output id="ds0-ko">6</output></div><input type="range" id="ds0-k" min="0" max="25" step="1" value="6"></div>
        <div class="field"><div class="range-head"><span>Duplicate business-key rate (%)</span><output id="ds0-do">10</output></div><input type="range" id="ds0-d" min="0" max="30" step="1" value="10"></div>
        <div class="stat-row" id="ds0-stats"></div>
        <pre class="code"><span class="c"># src/pipeline/clean.py</span>
df = df.dropna(subset=[<span class="s">"date"</span>, <span class="s">"market"</span>, <span class="s">"commodity"</span>])
df = df.drop_duplicates(subset=[<span class="s">"date"</span>, <span class="s">"market"</span>, <span class="s">"commodity"</span>])
df[<span class="s">"price_ugx"</span>] = df.groupby(<span class="s">"commodity"</span>)[<span class="s">"price_ugx"</span>].transform(
    <span class="k">lambda</span> s: s.fillna(s.median())
)</pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Tukey IQR Fence & Skewed Imputation</h3>
        <p class="small muted">See why per-commodity <b>median</b> beats mean when a single typo outlier enters a market batch.</p>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Q1 (UGX)</span><input type="number" id="ds0-q1" value="2200" step="100"></label>
          <label class="field"><span>Q3 (UGX)</span><input type="number" id="ds0-q3" value="3400" step="100"></label>
          <label class="field"><span>Outlier sample</span><input type="number" id="ds0-out" value="9700" step="100"></label>
        </div>
        <div class="result"><div class="k">Tukey 1.5×IQR Fences</div><div class="v" id="ds0-fence"></div><div class="s" id="ds0-iqr-work"></div></div>
        <div class="stat-row" id="ds0-imp"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const r = +$("ds0-r").value, k = +$("ds0-k").value, d = +$("ds0-d").value;
        $("ds0-ro").textContent = r; $("ds0-ko").textContent = k + "%"; $("ds0-do").textContent = d + "%";
        const afterKey = Math.round(r * (1 - k/100));
        const clean = Math.round(afterKey * (1 - d/100));
        $("ds0-stats").innerHTML = [
          ["After key check", afterKey.toLocaleString()],
          ["Duplicates dropped", (afterKey - clean).toLocaleString()],
          ["Clean rows", clean.toLocaleString()],
          ["Retention", ((clean/r)*100).toFixed(1) + "%"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        const q1 = num("ds0-q1")||0, q3 = num("ds0-q3")||0, out = num("ds0-out")||0;
        const iqr = Math.max(0, q3 - q1), low = q1 - 1.5*iqr, high = q3 + 1.5*iqr;
        $("ds0-fence").textContent = `[${low.toLocaleString()},  ${high.toLocaleString()}] UGX`;
        $("ds0-iqr-work").textContent = `IQR = ${q3} − ${q1} = ${iqr}  →  Q3 + 1.5·IQR = ${q3} + ${1.5*iqr} = ${high}`;
        const sample = [1800, 1900, 2000, 2100, out].sort((a,b)=>a-b);
        const med = sample[2], mean = sample.reduce((a,b)=>a+b,0)/5;
        $("ds0-imp").innerHTML = [
          ["Sample Median", med.toFixed(0) + " UGX"],
          ["Sample Mean", mean.toFixed(0) + " UGX"],
          ["Mean − Median Bias", (mean - med).toFixed(0) + " UGX"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
      };
      ["ds0-r","ds0-k","ds0-d","ds0-q1","ds0-q3","ds0-out"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 1: Pipelines: ETL vs ELT, Parquet & Idempotency */
  {
    title: "Parquet Columnar I/O & Idempotency Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · CSV vs Parquet Columnar Scan Calculator</h3>
        <p class="small muted">Compare full-table row scans in CSV against column pruning + Snappy compression in Parquet.</p>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>CSV Size (MB)</span><input type="number" id="ds1-mb" value="240"></label>
          <label class="field"><span>Total Columns</span><input type="number" id="ds1-tc" value="10"></label>
          <label class="field"><span>Queried Cols</span><input type="number" id="ds1-qc" value="2"></label>
        </div>
        <div class="field"><div class="range-head"><span>Parquet Compression Ratio</span><output id="ds1-cro">3.0×</output></div><input type="range" id="ds1-cr" min="1" max="8" step="0.5" value="3"></div>
        <div class="result"><div class="k">Bytes Scanned by DuckDB</div><div class="v" id="ds1-out"></div><div class="s" id="ds1-work"></div></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Idempotent Upsert vs Broken Append</h3>
        <p class="small muted">Simulate retrying a failed pipeline load multiple times.</p>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>Existing DB Rows</span><input type="number" id="ds1-base" value="10000"></label>
          <label class="field"><span>Batch Rows</span><input type="number" id="ds1-batch" value="1500"></label>
          <label class="field"><span>Overlap w/ Existing</span><input type="number" id="ds1-ov" value="200"></label>
          <label class="field"><span>Total Runs (Retries)</span><input type="number" id="ds1-runs" value="3" min="1" max="10"></label>
        </div>
        <div class="stat-row" id="ds1-idem"></div>
        <div class="hint" id="ds1-msg"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const mb = num("ds1-mb")||0, tc = Math.max(1, num("ds1-tc")||1), qc = clamp(num("ds1-qc")||1, 1, tc), cr = +$("ds1-cr").value;
        $("ds1-cro").textContent = cr.toFixed(1) + "×";
        const scanned = (mb * (qc / tc)) / cr;
        $("ds1-out").textContent = `${scanned.toFixed(2)} MB  (vs ${mb} MB CSV)`;
        $("ds1-work").textContent = `${mb} MB × (${qc}/${tc} cols) ÷ ${cr}× compression = ${(mb/scanned).toFixed(1)}× less I/O`;
        const base = num("ds1-base")||0, batch = num("ds1-batch")||0, ov = Math.min(batch, num("ds1-ov")||0), runs = Math.max(1, num("ds1-runs")||1);
        const upsertRows = base + (batch - ov);
        const appendRows = base + runs * batch;
        $("ds1-idem").innerHTML = [
          ["Idempotent Upsert", upsertRows.toLocaleString()],
          [`Naive Append (${runs}×)`, appendRows.toLocaleString()],
          ["Excess Corrupt Rows", (appendRows - upsertRows).toLocaleString()]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        $("ds1-msg").textContent = `Upsert inserts ${batch - ov} net-new rows and updates ${ov} existing keys regardless of how many times Airflow retries the task.`;
      };
      ["ds1-mb","ds1-tc","ds1-qc","ds1-cr","ds1-base","ds1-batch","ds1-ov","ds1-runs"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 2: Analytical Star Schemas & DuckDB */
  {
    title: "Star Schema Grain & Fan-Trap Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Star Schema Cardinality & Space Savings</h3>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Markets</span><input type="number" id="ds2-m" value="8" min="1"></label>
          <label class="field"><span>Commodities</span><input type="number" id="ds2-c" value="6" min="1"></label>
          <label class="field"><span>Days</span><input type="number" id="ds2-d" value="90" min="1"></label>
        </div>
        <div class="result"><div class="k">Fact Table Rows (fact_market_prices)</div><div class="v" id="ds2-fact"></div><div class="s" id="ds2-grain"></div></div>
        <pre class="code"><span class="k">SELECT</span> m.region, c.commodity_name, <span class="k">AVG</span>(f.price_ugx)
<span class="k">FROM</span> fact_market_prices f
<span class="k">JOIN</span> dim_market m <span class="k">ON</span> f.market_key = m.market_key
<span class="k">JOIN</span> dim_commodity c <span class="k">ON</span> f.commodity_key = c.commodity_key
<span class="k">GROUP BY</span> 1, 2;</pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Dimension Duplicate Fan-Trap Detector</h3>
        <p class="small muted">What happens to <code>SUM(price_ugx)</code> when a dimension table has duplicate keys (violating 1-to-many grain)?</p>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>True Fact Observation (UGX)</span><input type="number" id="ds2-p" value="4000" step="100"></label>
          <label class="field"><span>Matching Rows in dim_market</span><input type="number" id="ds2-dup" value="3" min="1" max="10"></label>
        </div>
        <div class="stat-row" id="ds2-fan"></div>
        <div class="hint" id="ds2-warn"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const m = num("ds2-m")||0, c = num("ds2-c")||0, d = num("ds2-d")||0;
        const rows = m * c * d;
        $("ds2-fact").textContent = `${rows.toLocaleString()} fact rows`;
        $("ds2-grain").textContent = `Grain: ${m} markets × ${c} commodities × ${d} days | dim rows = ${m + c + d}`;
        const p = num("ds2-p")||0, dup = Math.max(1, num("ds2-dup")||1);
        $("ds2-fan").innerHTML = [
          ["True Value", p.toLocaleString() + " UGX"],
          ["Joined Rows", dup],
          ["SQL SUM(price_ugx)", (p * dup).toLocaleString() + " UGX"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        $("ds2-warn").textContent = dup > 1 ? `Fan-trap alert! Un-deduplicated dimension key multiplied the metric by ${dup}×.` : `1:1 dimension key match — zero fan-out distortion.`;
      };
      ["ds2-m","ds2-c","ds2-d","ds2-p","ds2-dup"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 3: Workflow Orchestration with Apache Airflow */
  {
    title: "Airflow DAG Retry Backoff & Critical Path Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Exponential Backoff Calculator</h3>
        <p class="small muted">Configure retry behaviour for transient network failures on <code>ingest</code>.</p>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>Retries (R)</span><input type="number" id="ds3-r" value="3" min="1" max="8"></label>
          <label class="field"><span>Initial retry_delay (sec)</span><input type="number" id="ds3-d" value="20" min="5" step="5"></label>
        </div>
        <label class="row small"><input type="checkbox" id="ds3-exp" checked> Enable exponential backoff (×2 per attempt)</label>
        <div class="result"><div class="k">Total Wait Time Across All Retries</div><div class="v" id="ds3-wait"></div><div class="s" id="ds3-seq"></div></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · DAG Critical Path & Backfill Planner</h3>
        <p class="small muted"><code>ingest</code> → parallel <code>(validate_schema || profile_stats)</code> → <code>clean</code> → <code>store</code></p>
        <div class="grid-2" style="gap:10px">
          <label class="field"><span>ingest (s)</span><input type="number" id="ds3-t1" value="12"></label>
          <label class="field"><span>validate_schema (s)</span><input type="number" id="ds3-t2" value="8"></label>
          <label class="field"><span>profile_stats (s)</span><input type="number" id="ds3-t3" value="25"></label>
          <label class="field"><span>clean + store (s)</span><input type="number" id="ds3-t4" value="25"></label>
        </div>
        <div class="stat-row" id="ds3-cp"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const r = Math.max(1, num("ds3-r")||1), d = Math.max(1, num("ds3-d")||1), exp = $("ds3-exp").checked;
        const waits = [...Array(r)].map((_,i) => exp ? d * Math.pow(2, i) : d);
        const tot = waits.reduce((a,b)=>a+b, 0);
        $("ds3-wait").textContent = `${tot} seconds`;
        $("ds3-seq").textContent = `Schedule: ${waits.map((w,i)=>`Retry ${i+1}: ${w}s`).join("  ·  ")}`;
        const t1 = num("ds3-t1")||0, t2 = num("ds3-t2")||0, t3 = num("ds3-t3")||0, t4 = num("ds3-t4")||0;
        const crit = t1 + Math.max(t2, t3) + t4;
        const serial = t1 + t2 + t3 + t4;
        $("ds3-cp").innerHTML = [
          ["Critical Path", crit + "s"],
          ["Serial Sum", serial + "s"],
          ["Parallel Savings", (serial - crit) + "s"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
      };
      ["ds3-r","ds3-d","ds3-exp","ds3-t1","ds3-t2","ds3-t3","ds3-t4"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 4: Distributed Batch Processing with PySpark */
  {
    title: "PySpark Partition Waves, Shuffle & Cache Break-Even",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Partition Waves & Partial Shuffle Reduction</h3>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>Partitions (P)</span><input type="number" id="ds4-p" value="20" min="1"></label>
          <label class="field"><span>Executor Cores (C)</span><input type="number" id="ds4-c" value="8" min="1"></label>
          <label class="field"><span>Task Duration (s)</span><input type="number" id="ds4-t" value="4" min="1"></label>
          <label class="field"><span>Distinct Group Keys (K)</span><input type="number" id="ds4-k" value="6" min="1"></label>
        </div>
        <div class="stat-row" id="ds4-waves"></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · When Does <code>.cache()</code> Actually Pay Off? (Lab 8)</h3>
        <p class="small muted">Compare total runtime across <b>N actions</b> with and without <code>df.cache()</code>.</p>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Uncached / act (s)</span><input type="number" id="ds4-u" value="3.0" step="0.5"></label>
          <label class="field"><span>Cache build (s)</span><input type="number" id="ds4-b" value="4.5" step="0.5"></label>
          <label class="field"><span>Cached read (s)</span><input type="number" id="ds4-r" value="0.5" step="0.1"></label>
        </div>
        <div class="field"><div class="range-head"><span>Number of Actions (N)</span><output id="ds4-no">2</output></div><input type="range" id="ds4-n" min="1" max="8" value="2"></div>
        <div class="result"><div class="k">Uncached vs Cached Runtime</div><div class="v" id="ds4-cout"></div><div class="s" id="ds4-cwork"></div></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const P = Math.max(1, num("ds4-p")||1), C = Math.max(1, num("ds4-c")||1), T = num("ds4-t")||1, K = Math.max(1, num("ds4-k")||1);
        const waves = Math.ceil(P / C), stageSec = waves * T, shuffled = P * K;
        $("ds4-waves").innerHTML = [
          ["Core Waves", waves],
          ["Stage Runtime", stageSec + "s"],
          ["Max Shuffled Rows", shuffled.toLocaleString()]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        const u = num("ds4-u")||0, b = num("ds4-b")||0, r = num("ds4-r")||0, n = +$("ds4-n").value;
        $("ds4-no").textContent = n;
        const tUncached = n * u;
        const tCached = (u + b) + Math.max(0, n - 1) * r;
        const win = tCached < tUncached;
        $("ds4-cout").textContent = `Uncached: ${tUncached.toFixed(1)}s  ·  Cached: ${tCached.toFixed(1)}s`;
        $("ds4-cwork").textContent = win ? `✓ Caching wins at N=${n} actions (saves ${(tUncached - tCached).toFixed(1)}s)` : `✗ Caching is SLOWER at N=${n} actions (overhead costs +${(tCached - tUncached).toFixed(1)}s, just like Lab 8!)`;
      };
      ["ds4-p","ds4-c","ds4-t","ds4-k","ds4-u","ds4-b","ds4-r","ds4-n"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 5: Streaming, Event-Time Windows & Watermarks */
  {
    title: "Event-Time Tumbling Window & Watermark Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Watermark & Late-Event Router (Lab 9.1)</h3>
        <p class="small muted">Test how our stateful consumer classifies incoming market events.</p>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Max Seen ts (s)</span><input type="number" id="ds5-max" value="1240"></label>
          <label class="field"><span>Lateness L (s)</span><input type="number" id="ds5-l" value="5"></label>
          <label class="field"><span>Window Size (s)</span><input type="number" id="ds5-w" value="10"></label>
        </div>
        <div class="field"><div class="range-head"><span>Incoming event_ts (s)</span><output id="ds5-eo">1238</output></div><input type="range" id="ds5-e" min="1210" max="1250" step="0.5" value="1238"></div>
        <div class="result"><div class="k">Event Classification & Window Assignment</div><div class="v" id="ds5-out"></div><div class="s" id="ds5-work"></div></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Stream Accounting (Duplicates & Stragglers)</h3>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Total Emitted</span><input type="number" id="ds5-tot" value="250"></label>
          <label class="field"><span>Duplicate IDs</span><input type="number" id="ds5-dup" value="18"></label>
          <label class="field"><span>Late Events</span><input type="number" id="ds5-late" value="12"></label>
        </div>
        <div class="stat-row" id="ds5-stats"></div>
        <pre class="code"><span class="c"># src/stream/consumer.py</span>
watermark = max_event_ts - allowed_lateness
<span class="k">if</span> event_id <span class="k">in</span> seen_ids:
    route_to(<span class="s">"duplicate_events.jsonl"</span>)
<span class="k">elif</span> event_ts < watermark:
    route_to(<span class="s">"late_events.jsonl"</span>)
<span class="k">else</span>:
    w_start = (<span class="k">int</span>(event_ts) // 10) * 10</pre>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const mx = num("ds5-max")||0, L = num("ds5-l")||0, W = Math.max(1, num("ds5-w")||10), ev = +$("ds5-e").value;
        $("ds5-eo").textContent = ev.toFixed(1);
        const wm = Math.max(mx, ev) - L;
        const wStart = Math.floor(ev / W) * W, wEnd = wStart + W;
        const isLate = ev < (mx - L);
        $("ds5-out").textContent = isLate ? `LATE EVENT → late_events.jsonl` : `ACCEPTED → Window [${wStart}, ${wEnd})`;
        $("ds5-work").textContent = `Watermark W(t) = ${mx} − ${L} = ${mx - L}s  ·  event_ts ${ev.toFixed(1)} is ${isLate ? "<" : "≥"} ${mx - L}s`;
        const tot = num("ds5-tot")||0, dup = num("ds5-dup")||0, late = num("ds5-late")||0;
        const valid = Math.max(0, tot - dup - late);
        $("ds5-stats").innerHTML = [
          ["Valid Windowed", valid],
          ["Dropped Dupes", dup],
          ["Late Side-Output", late]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
      };
      ["ds5-max","ds5-l","ds5-w","ds5-e","ds5-tot","ds5-dup","ds5-late"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 6: From Model to Data Product: FastAPI & Docker */
  {
    title: "FastAPI Model Serving & Training-Serving Skew Lab",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Training-Serving Skew Simulator (Lab 9.2 Step 8)</h3>
        <p class="small muted">Compare prediction output when the API uses the shared <code>make_features()</code> threshold (<code>rainfall > 5.0</code>) vs a skewed threshold (<code>rainfall > 10.0</code>).</p>
        <div class="field"><div class="range-head"><span>Input rainfall_mm</span><output id="ds6-ro">8.2</output></div><input type="range" id="ds6-r" min="0" max="20" step="0.2" value="8.2"></div>
        <div class="stat-row" id="ds6-skew"></div>
        <div class="hint" id="ds6-msg"></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Startup Load vs Per-Request Load Benchmark</h3>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Disk Load (ms)</span><input type="number" id="ds6-dl" value="150"></label>
          <label class="field"><span>Predict (ms)</span><input type="number" id="ds6-inf" value="5"></label>
          <label class="field"><span>Requests (N)</span><input type="number" id="ds6-n" value="200"></label>
        </div>
        <div class="result"><div class="k">Total Serving Time Comparison</div><div class="v" id="ds6-lat"></div><div class="s" id="ds6-lwork"></div></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const rain = +$("ds6-r").value;
        $("ds6-ro").textContent = rain.toFixed(1) + " mm";
        const trainRainy = rain > 5.0 ? 1 : 0;
        const skewRainy = rain > 10.0 ? 1 : 0;
        const truePred = 2889.58 + trainRainy * 37.67;
        const skewPred = 2889.58 + skewRainy * 37.67;
        const diff = Math.abs(truePred - skewPred);
        $("ds6-skew").innerHTML = [
          ["Shared features.py", truePred.toFixed(2) + " UGX"],
          ["Skewed API (>10mm)", skewPred.toFixed(2) + " UGX"],
          ["Silent Drift", diff.toFixed(2) + " UGX"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        $("ds6-msg").textContent = diff > 0
          ? `⚠️ Training-serving skew active! For rainfall = ${rain.toFixed(1)} mm (between 5.0 and 10.0 mm), is_rainy flips from 1 to 0, shifting the prediction by 37.67 UGX with zero HTTP errors.`
          : `At rainfall = ${rain.toFixed(1)} mm, both thresholds agree on is_rainy = ${trainRainy} — hiding the latent bug until rainfall enters (5.0, 10.0]!`;
        const dl = num("ds6-dl")||0, inf = num("ds6-inf")||0, n = Math.max(1, num("ds6-n")||1);
        const perReqMs = n * (dl + inf), startupMs = dl + n * inf;
        $("ds6-lat").textContent = `${(startupMs/1000).toFixed(2)}s (startup)  vs  ${(perReqMs/1000).toFixed(2)}s (per-request)`;
        $("ds6-lwork").textContent = `Saves ${((perReqMs - startupMs)/1000).toFixed(2)} seconds across ${n} requests (${(perReqMs/startupMs).toFixed(1)}× speedup)`;
      };
      ["ds6-r","ds6-dl","ds6-inf","ds6-n"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 7: Practice Exam (sample_qtn): Milk Validation & Collisions */
  {
    title: "Milk Validation Funnel, Rule Ordering & Collision Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Row Conservation & Collision Accounting (sample_qtn)</h3>
        <p class="small muted">Simulate <code>clean_milk(df) -&gt; (clean_df, rejected_df)</code>. See how removing exact duplicates differs from rejecting conflicting record_id collisions.</p>
        <div class="grid-2" style="gap:10px">
          <label class="field"><span>Raw batch size</span><input type="number" id="ds7-raw" value="500"></label>
          <label class="field"><span>Exact duplicate copies</span><input type="number" id="ds7-exact" value="14"></label>
          <label class="field"><span>Colliding record_ids</span><input type="number" id="ds7-col" value="6"></label>
          <label class="field"><span>Domain errors (litres/date)</span><input type="number" id="ds7-dom" value="24"></label>
        </div>
        <div class="stat-row" id="ds7-cons"></div>
        <pre class="code"><span class="c"># Exact duplicates vs Collisions invariant</span>
exact_dupes = df.duplicated(keep=<span class="s">'first'</span>)
clean = df[~exact_dupes].copy()
collisions = clean.duplicated(subset=[<span class="s">'record_id'</span>], keep=<span class="k">False</span>)
<span class="k">assert</span> rows_in == <span class="k">len</span>(clean_df) + <span class="k">len</span>(rejected_df) + exact_removed</pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Rule Ordering: Tidying Before Validation</h3>
        <p class="small muted">See why tidying centre names <b>before</b> running <code>rule_unknown_centre</code> saves valid farmer deliveries from being thrown into rejected.</p>
        <div class="field"><div class="range-head"><span>Untidied whitespace rows (' mbarara ')</span><output id="ds7-wo">45</output></div><input type="range" id="ds7-w" min="0" max="100" step="5" value="45"></div>
        <div class="stat-row" id="ds7-tidy"></div>
        <div class="hint" id="ds7-msg"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        const raw = num("ds7-raw")||0, exact = num("ds7-exact")||0, colKeys = num("ds7-col")||0, dom = num("ds7-dom")||0;
        const colRows = colKeys * 2;
        const rejected = colRows + dom;
        const clean = Math.max(0, raw - exact - rejected);
        $("ds7-cons").innerHTML = [
          ["Clean Deliveries", clean],
          ["Rejected Rows", rejected],
          ["Exact Removed", exact],
          ["Row Conservation", (clean + rejected + exact === raw) ? "✓ Preserved (100%)" : "✗ Invariant Failed"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

        const untidy = +$("ds7-w").value;
        $("ds7-wo").textContent = untidy;
        const wrongRejected = untidy + 9;
        const correctRejected = 9;
        $("ds7-tidy").innerHTML = [
          ["Validate First", `${wrongRejected} rejected ✗`],
          ["Tidy First", `${correctRejected} rejected ✓`],
          ["Saved Deliveries", `+${untidy} valid rows`]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        $("ds7-msg").textContent = `Running .str.strip().str.title() first rescues ${untidy} deliveries that only had casing/whitespace differences.`;
      };
      ["ds7-raw","ds7-exact","ds7-col","ds7-dom","ds7-w"].forEach(id=>$(id).oninput=upd);
      upd();
    }
  },
  /* Lab 8: Practical Test 02 (dsc3103_test_02): Milk Star Schema & Analytics */
  {
    title: "Milk Star Schema Warehouse & Two-Stage Analytics Simulator",
    html: () => `
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>1 · Unknown Farmer Dimensional Mapping (dsc3103_test_02)</h3>
        <p class="small muted">In the real test dataset, 6 unregistered farmers made 408 deliveries. Inspect how <code>COALESCE(f.farmer_key, 0)</code> preserves fact table row count and referential integrity.</p>
        <div class="grid-2" style="gap:10px">
          <label class="field"><span>Raw milk rows</span><input type="number" id="ds8-raw" value="20000" disabled></label>
          <label class="field"><span>Registered farmers</span><input type="number" id="ds8-known" value="294" disabled></label>
          <label class="field"><span>Total distinct farmers</span><input type="number" id="ds8-distinct" value="300" disabled></label>
          <label class="field"><span>Unregistered deliveries</span><input type="number" id="ds8-unreg" value="408" disabled></label>
        </div>
        <div class="stat-row" id="ds8-star-stats"></div>
        <pre class="code"><span class="c"># src/build_star.py</span>
dim_farmer: farmer_key=0 -&gt; (-1, <span class="s">'Unknown'</span>, <span class="k">None</span>, <span class="k">None</span>)
COALESCE(f.farmer_key, 0) <span class="k">AS</span> farmer_key  <span class="c"># 0 NULL keys, 20,000 rows retained</span></pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>2 · Two-Stage Capacity Overrun vs Row-by-Row Fallacy</h3>
        <p class="small muted">Select a cooperative centre from the actual test to compare row-by-row filtering (fails: max single delivery is 46.8 L) against daily grouped aggregation.</p>
        <div class="field">
          <span>Choose Centre</span>
          <select class="mini" id="ds8-sel" style="width:100%;padding:8px">
            <option value="Kiruhura,950,41,1203.5">Kiruhura (Capacity: 950 L/day · Ground Truth: 41 days over)</option>
            <option value="Masaka,750,36,997.0">Masaka (Capacity: 750 L/day · Ground Truth: 36 days over)</option>
            <option value="Mbale,400,32,702.0">Mbale (Capacity: 400 L/day · Ground Truth: 32 days over)</option>
            <option value="Gulu,300,28,471.8">Gulu (Capacity: 300 L/day · Ground Truth: 28 days over)</option>
            <option value="Mbarara,750,23,989.6">Mbarara (Capacity: 750 L/day · Ground Truth: 23 days over)</option>
          </select>
        </div>
        <div class="stat-row" id="ds8-cap-stats"></div>
        <div class="hint" id="ds8-cap-msg"></div>
      </div>
    </div>`,
    init(){
      const upd = () => {
        $("ds8-star-stats").innerHTML = [
          ["fact_delivery Rows", "20,000"],
          ["Unmatched Deliveries", "408 (farmer_key = 0)"],
          ["FK Match Rate", "100.0% (0 NULLs)"],
          ["Partition Pruning", "3,201 rows in Apr 2026"]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

        const [cName, cap, days, peak] = $("ds8-sel").value.split(",");
        $("ds8-cap-stats").innerHTML = [
          ["Naive Row Check", "0 days (delivery &lt; 47L) ✗"],
          ["Two-Stage Grouping", `${days} days over capacity ✓`],
          ["Peak Daily Volume", `${peak} L (${(peak - cap).toFixed(1)} L over)`]
        ].map(([a,b])=>`<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        $("ds8-cap-msg").textContent = `${cName} exceeded its ${cap} L daily capacity on ${days} of the 184 days. Aggregating by (centre_key, date_key) first is essential!`;
      };
      $("ds8-sel").onchange = upd;
      upd();
    }
  }
  ]
};
window.COURSE_DS.syllabus.forEach((s, i) => {
  s.id = i;
  s.badge = `Module ${i + 1}`;
  s.duration = s.captions[s.captions.length - 1].time + 22;
});
