// @ts-nocheck — canvas drawing code ported verbatim from the original StudyRoom lessons.
// New scenes can be written in typed TypeScript; see src/lib/scene/kit.ts.
/* eslint-disable */
import type { Scene } from "@/lib/scene/kit";

/** One scene per module id; `ci` is the lesson step index. */
export const scenes: Record<string, Scene> = {
  "data-cleaning": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "pipelines-parquet": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "star-schemas": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "airflow": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "pyspark": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "streaming": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "model-serving": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "milk-validation": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "milk-warehouse": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  },
};
