/* =====================================================================
   COURSE: AI MODEL DEPLOYMENT & SCALING (CSC3119)
   Uganda Christian University · Lecturer: Stephen Kalyesubula
   Covers: Data Prep & Imbalance (SMOTE), Model Persistence (Pickle/Joblib),
   FastAPI Serving, Cloud Computing & Sizing, Docker Containerization,
   Load Balancing & Canary Releases, ONNX & INT8 Quantization,
   Observability & Drift (PSI), and Referral Hospital Stroke Capstone (XAI).
   ===================================================================== */
window.COURSE_AI = {
  id: "ai",
  code: "CSC3119",
  title: "AI Model Deployment and Scaling",
  shortTitle: "AI Deployment",
  subtitle: "9 modules · 9 interactive MLOps simulators · 3 variations + AI challenges · Uganda Clinical Capstone",
  syllabus: [
    {
      title: "Data Preparation, Preprocessing Leaks & Clinical Imbalance",
      subtitle: "Turn messy clinical hospital registries into leak-free deployable pipelines",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "A trained machine learning model is only as dependable as the data engineering feeding it. In the Uganda Regional Referral Hospital stroke dataset, we face missing BMI values, string encodings, and extreme class imbalance." },
        { time: 16, text: "The cardinal sin of ML deployment is data leakage: computing scalers (StandardScaler) or imputation statistics over the entire dataset before splitting into train and test sets." },
        { time: 32, text: "When you fit a scaler on all rows, test set distribution metrics leak into training weights, giving falsely inflated validation accuracy that collapses the moment new patients arrive at triage." },
        { time: 46, text: "Checkpoint: why does evaluating an imbalanced hospital dataset with raw accuracy fail, and why must SMOTE or scaling only be applied to the training split?" },
        { time: 66, text: "In stroke risk triage, only ~4.9% of patients experience a cerebrovascular accident. A trivial model predicting 'No Stroke' achieves 95.1% accuracy while killing every high-risk patient by missing 100% of cases." },
        { time: 86, text: "To protect production validity, bundle transformers into an sklearn Pipeline or ColumnTransformer. Fit strictly on X_train, and apply SMOTE synthetic oversampling only to training instances." }
      ],
      checkpoint: {
        question: "Why is accuracy a dangerous metric for clinical triage with 5% positive cases, and why must data scalers and SMOTE oversampling never touch the test set?",
        hint: "Consider what a dummy classifier achieves by guessing 0 for everyone. Contrast accuracy with Recall/F2 score, and explain why fitting transformations on the full dataset corrupts out-of-sample evaluation.",
        keywords: ["accuracy", "imbalance", "recall", "false negative", "leakage", "split", "train", "test", "fit_transform", "smote", "generalization"],
        idealAnswer: "With a 5% positive stroke prevalence, a naive model that predicts negative for every patient achieves 95.1% accuracy but has zero clinical utility because Recall is 0%. In medical triage, False Negatives can be fatal, so we prioritize Recall and PR-AUC over raw accuracy. Scalers and SMOTE must only touch the training split: fitting scalers on the full dataset leaks test distribution parameters (mean and variance) into the model, and applying SMOTE across test data creates synthetic evaluation targets, destroying the statistical independence required for valid real-world generalization."
      },
      terms: [
        ["Data Leakage", "Accidentally sharing information from outside the training dataset (e.g. test set statistics) when building a model."],
        ["Class Imbalance", "Severe disparity in outcome classes (e.g. 95% non-stroke vs 5% stroke in clinical screening)."],
        ["SMOTE", "Synthetic Minority Over-sampling Technique: creates synthetic interpolated examples between k-nearest minority neighbors."],
        ["ColumnTransformer", "An scikit-learn estimator that executes distinct preprocessing pipelines (numeric scalers, categorical encoders) on specific column subsets."],
        ["Recall (Sensitivity)", "True Positives divided by (True Positives + False Negatives); measures the proportion of actual clinical stroke cases caught."]
      ],
      quiz: [
        { q: "In a hospital cohort of 2,000 patients, 100 experience a stroke. A baseline model predicts 'No Stroke' for all 2,000. What is its accuracy and recall?", o: ["Accuracy 95%, Recall 0%", "Accuracy 5%, Recall 95%", "Accuracy 50%, Recall 50%", "Accuracy 95%, Recall 100%"], a: 0, e: "The model is correct on 1,900 of 2,000 patients (95% accuracy), but catches 0 of the 100 stroke patients (0% recall)." },
        { q: "Which preprocessing step causes data leakage if executed before train_test_split?", o: ["StandardScaler.fit()", "Dropping patient ID column", "Stripping whitespace from strings", "Writing raw data to read-only storage"], a: 0, e: "Fitting StandardScaler computes global mean and standard deviation across both splits, leaking future test distribution characteristics into training features." }
      ],
      fact: {
        title: "The Silent Killer of Production ML: Train-Serve Skew",
        desc: "Google's landmark paper on ML technical debt notes that differences between training data pipelines and real-time inference code account for over 60% of production prediction failures. Bundling ColumnTransformers directly into model artifacts eliminates manual feature recreation bugs."
      }
    },
    {
      title: "Model Persistence: Pickle vs Joblib & Pipeline Packaging",
      subtitle: "Serialize trained estimators, scalers, and encoders safely for zero-downtime serving",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "Once an ML model is trained in memory, it will disappear as soon as the Python script terminates. Model serialization converts live Python objects into byte streams for disk storage or network transfer." },
        { time: 17, text: "Python's standard library provides pickle, but for models containing large numerical NumPy arrays (like Random Forests or SVMs), joblib is dramatically faster and more space-efficient." },
        { time: 33, text: "Joblib implements optimized memory-mapping (mmap) and efficient array compression (zlib, lz4). However, saving just the classifier object (model.predict) is a fatal operational anti-pattern." },
        { time: 48, text: "Checkpoint: why must preprocessing scalers and encoders be saved together with the model, and what security danger exists when unpickling untrusted files?" },
        { time: 68, text: "If you only serialize the XGBoost classifier, incoming raw JSON from a hospital API lacks scaling and one-hot encoding, producing garbage predictions or immediate runtime dimension crashes." },
        { time: 88, text: "Furthermore, pickle and joblib execute arbitrary bytecode via the __reduce__ method. Never load untrusted model files from unknown public URLs without cryptographic checksums or signed registries." }
      ],
      checkpoint: {
        question: "Explain why saving an isolated model estimator without its preprocessing pipeline breaks production deployments, and describe the security vulnerability inherent in Python pickle deserialization.",
        hint: "Recall train-serve skew and categorical alignment. Then consider the pickle __reduce__ protocol and how unpickling malicious payloads can execute arbitrary OS commands.",
        keywords: ["pipeline", "train-serve skew", "preprocessor", "scaler", "encoder", "pickle", "joblib", "security", "arbitrary code", "reduce", "vulnerability"],
        idealAnswer: "Saving an isolated estimator without its preprocessing pipeline introduces train-serve skew. Raw API payloads cannot be ingested directly: numerical features must be normalized by the exact training scaler parameters, and categorical features must be transformed using the exact one-hot encoder categories. Bundling everything into an end-to-end `Pipeline` object guarantees identical preprocessing. Regarding security, Python's pickle format is not secure: deserialization executes arbitrary constructor logic defined in `__reduce__`, allowing an attacker to run malicious shell commands or reverse shells simply by having your server call `pickle.load()` on an untrusted file."
      },
      terms: [
        ["Serialization", "Converting in-memory Python object graphs into a persistent byte sequence (file or stream)."],
        ["Joblib", "SciPy-optimized serialization library tailored for large NumPy ndarrays and scikit-learn models using memory-mapping."],
        ["Train-Serve Skew", "Discrepancy between how features are computed during training versus real-time serving."],
        ["Arbitrary Code Execution", "A critical security flaw where unpickling unvalidated binary data executes attacker-controlled system calls."],
        ["End-to-End Pipeline", "A composite object linking Imputer → Scaler → OneHotEncoder → Classifier into a single serializable artifact."]
      ],
      quiz: [
        { q: "Why is joblib preferred over standard pickle for saving large Random Forest classifiers?", o: ["Joblib encrypts the weights", "Joblib is optimized for NumPy arrays and supports efficient multi-threading and disk compression", "Pickle cannot save trees", "Joblib converts Python code to C++"], a: 1, e: "Joblib specializes in numerical arrays, serializing large NumPy buffers with minimal memory copies and optional compression (zlib/lz4)." },
        { q: "What should you do to prevent malicious remote code execution when loading saved ML models?", o: ["Only load model files from authenticated, signed registries and verify SHA-256 hashes", "Rename .pkl files to .txt", "Use Python 2 instead of Python 3", "Disable garbage collection"], a: 0, e: "Because pickle allows arbitrary code execution during deserialization, model artifacts must come from trusted, version-controlled storage with verified SHA-256 checksums." }
      ],
      fact: {
        title: "Pickle Security in Production",
        desc: "Major AI platforms like Hugging Face and PyTorch now recommend SafeTensors and ONNX over raw pickles because hundreds of public CVEs have demonstrated arbitrary remote code execution via poisoned pickle files."
      }
    },
    {
      title: "API Engineering with FastAPI, Pydantic & Async Workers",
      subtitle: "Build ultra-low latency, strongly typed prediction endpoints with input contracts",
      checkpointTime: 47,
      captions: [
        { time: 0, text: "A serialized model sitting on disk cannot diagnose patients. We wrap it in a REST API so web clients, hospital electronic health record (EHR) systems, and mobile apps can request predictions over HTTP." },
        { time: 16, text: "FastAPI is the industry standard for Python ML serving. Built on Starlette and Pydantic, it provides asynchronous request handling, automatic JSON serialization, and OpenAPI documentation." },
        { time: 32, text: "With Pydantic schemas, every incoming patient attribute is strictly validated at the API perimeter: age must be between 0 and 120, avg_glucose_level must be positive, and categorical fields must match enum choices." },
        { time: 47, text: "Checkpoint: why should ML inference endpoints run under asynchronous web frameworks, and how does Pydantic protect downstream model code from crashing?" },
        { time: 67, text: "Pydantic catches type errors, missing attributes, and domain boundary violations before your model code is touched, returning a clean HTTP 422 Unprocessable Entity error instead of a server crash." },
        { time: 88, text: "To maximize throughput, distinguish between I/O-bound tasks (database logging, async audit trails) and CPU-bound tensor inference, using multi-worker Uvicorn processes or threadpools." }
      ],
      checkpoint: {
        question: "How does Pydantic schema validation enforce data contracts at the API boundary, and why is this critical for maintaining 99.9% uptime in production healthcare ML?",
        hint: "Consider what happens when a client sends a string instead of a float for BMI, or a negative glucose level. How does early boundary validation prevent 500 Internal Server Errors?",
        keywords: ["pydantic", "schema", "validation", "data contract", "type enforcement", "422", "boundary", "uptime", "crash", "sanitization"],
        idealAnswer: "Pydantic enforces strict data contracts at the network boundary before payloads ever reach model logic. It verifies data types (converting string numbers to floats where valid), rejects malformed keys, and validates domain rules (e.g. `Field(..., ge=0, le=125)` for age, or allowed smoking enums). If invalid data arrives, FastAPI instantly returns a structured HTTP 422 response with exact field-level error messages. In production healthcare ML, this prevents unhandled Python exceptions (like ValueError in scikit-learn), avoids silent NaN corruption, shields backend logs from crashing, and guarantees 99.9% service reliability."
      },
      terms: [
        ["FastAPI", "High-performance, modern Python web framework for building APIs with Starlette and Pydantic."],
        ["Pydantic BaseModel", "Data validation and settings management class using Python type annotations to validate payloads."],
        ["HTTP 422", "Unprocessable Entity: client status code indicating the request body was well-formed JSON but failed semantic schema validation."],
        ["Uvicorn", "Lightning-fast ASGI web server implementation for Python, running asynchronous event loops via uvloop."],
        ["Throughput (QPS)", "Queries Per Second: the volume of inference requests successfully completed by the server per unit of time."]
      ],
      quiz: [
        { q: "A hospital client sends {'age': -5, 'bmi': 'obese'} to a FastAPI endpoint requiring float bmi and age > 0. What happens?", o: ["The server crashes with 500 Internal Server Error", "FastAPI automatically catches validation errors and returns 422 Unprocessable Entity", "The model converts -5 to 0 and predicts anyway", "The request hangs indefinitely"], a: 1, e: "Pydantic validates input schemas immediately upon receipt, blocking invalid fields and returning a descriptive 422 response without invoking model code." },
        { q: "What is Little's Law relating Concurrency (L), Throughput (λ), and Latency (W)?", o: ["L = λ × W", "L = λ / W", "L = λ + W", "W = L × λ²"], a: 0, e: "Little's Law states that the average number of concurrent requests in a stable system equals the arrival throughput multiplied by the average request latency: L = λ × W." }
      ],
      fact: {
        title: "FastAPI + Pydantic v2 Performance",
        desc: "Pydantic v2 was completely rewritten in Rust, delivering 5× to 50× faster JSON parsing and validation. This allows a single FastAPI worker to validate thousands of patient payloads per second with sub-millisecond CPU overhead."
      }
    },
    {
      title: "Cloud Computing Concepts, Service Models & Hardware Sizing",
      subtitle: "Understand NIST cloud characteristics, IaaS/PaaS/SaaS/MLaaS, and GPU/CPU cost modeling",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "Running model deployment on a personal laptop or physical on-premise server is fraught with power cuts, network drops, and fixed compute limitations. Cloud computing provides elastic, on-demand compute infrastructure." },
        { time: 17, text: "The NIST standard defines five essential characteristics of cloud computing: on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service." },
        { time: 34, text: "We categorize services into IaaS (raw virtual machines like EC2/Compute Engine), PaaS (managed platforms like App Engine or Render), SaaS (end-user apps), and MLaaS (specialized AI platforms like SageMaker and Vertex AI)." },
        { time: 48, text: "Checkpoint: what is the cost and latency difference between CPU and GPU inference, and how do Spot/Preemptible instances save up to 80% on training costs?" },
        { time: 68, text: "Tabular models like Random Forests and XGBoost run fast and cheaply on modern CPUs (20ms latency at pennies per month). Massive deep neural nets require GPUs, whose high hourly cost demands auto-scaling to zero when idle." },
        { time: 88, text: "Spot instances utilize spare cloud data center capacity at a 70% to 90% discount. They can be reclaimed with a 2-minute warning, making them ideal for checkpointed model training and fault-tolerant batch scoring." }
      ],
      checkpoint: {
        question: "Differentiate IaaS, PaaS, and MLaaS in the context of deploying an ML model, and explain how Spot instances reduce cloud costs while managing termination risk.",
        hint: "Think about who manages the OS and runtime versus the model artifact. Explain the trade-off between price discount and preemptible termination warnings.",
        keywords: ["iaas", "paas", "mlaas", "spot", "preemptible", "cost", "cloud", "elasticity", "checkpoint", "gpu"],
        idealAnswer: "IaaS (Infrastructure as a Service) provides raw VMs where you manage the OS, CUDA drivers, Docker, and networking. PaaS (Platform as a Service, e.g. Render) abstracts the VM: you provide code/Docker and the platform manages uptime and SSL. MLaaS (Machine Learning as a Service, e.g. AWS SageMaker) provides managed model endpoints, auto-scaling, model registries, and drift monitoring. Spot (Preemptible) instances offer surplus cloud capacity at a 70–90% discount. To mitigate termination risk, workloads must be stateless or save model checkpoints frequently to durable object storage (S3/GCS), allowing jobs to resume automatically when new capacity is provisioned."
      },
      terms: [
        ["NIST Cloud Characteristics", "The 5 foundational pillars: On-demand self-service, Broad network access, Resource pooling, Rapid elasticity, Measured service."],
        ["IaaS", "Infrastructure as a Service: rent virtual machines, raw storage, and virtual networks."],
        ["PaaS", "Platform as a Service: deploy containerized web services without managing underlying operating system updates."],
        ["MLaaS", "Machine Learning as a Service: end-to-end cloud platforms dedicated to ML training, registries, and autoscaling inference."],
        ["Spot / Preemptible VM", "Discounted cloud instances that the provider may terminate with short notice when capacity is needed elsewhere."]
      ],
      quiz: [
        { q: "Which cloud service model requires you to configure the Linux kernel, install Nvidia GPU drivers, and manage Docker security updates yourself?", o: ["SaaS", "PaaS", "IaaS", "MLaaS"], a: 2, e: "In IaaS (Infrastructure as a Service), you are responsible for managing the operating system, drivers, security patches, and runtime environments." },
        { q: "If an on-demand GPU VM costs $2.40/hour and a spot instance offers a 75% discount, what is the cost of running a 10-hour training job on Spot?", o: ["$24.00", "$6.00", "$18.00", "$1.80"], a: 1, e: "Spot price = $2.40 × (1 − 0.75) = $0.60/hour. For 10 hours: 10 × $0.60 = $6.00." }
      ],
      fact: {
        title: "Latency Realities in East Africa",
        desc: "A client in Kampala making API calls to an EU-West (Ireland) data center incurs a minimum physical speed-of-light round-trip latency of ~130ms. Deploying on African edge locations (af-south-1 in Cape Town or local CDNs) drops network latency to under 35ms."
      }
    },
    {
      title: "Containerization, Multi-Stage Docker & Security Hardening",
      subtitle: "Package microservices with lightweight base images, layer caching, and rootless users",
      checkpointTime: 46,
      captions: [
        { time: 0, text: "A web API that works on your developer laptop often fails when deployed to cloud servers due to mismatched Python versions, missing C-libraries, or differing OS packages. Docker solves this." },
        { time: 16, text: "A Docker image is a standalone, executable software package bundling code, runtime, system tools, and libraries into immutable, layered container images." },
        { time: 32, text: "A naive Dockerfile starts from a bloated 1GB Ubuntu image and installs build compilers (gcc, g++) that linger in the final container, creating huge attack surfaces and slow deployment times." },
        { time: 46, text: "Checkpoint: why are multi-stage Docker builds essential for Python ML APIs, and why should containers never run as root in production?" },
        { time: 66, text: "Multi-stage builds use a heavy build environment with compilers to compile Python wheels, then copy only the compiled packages into a pristine, minimal python:3.11-slim base image, slashing size by 80%." },
        { time: 86, text: "Running as non-root (USER appuser) ensures that if an attacker exploits a code vulnerability or malicious pickle file, they cannot break out to modify root system files or mount host drives." }
      ],
      checkpoint: {
        question: "Explain the architecture of a multi-stage Docker build for a Python ML serving image, and detail two security best practices for production container deployment.",
        hint: "Describe the 'builder' stage versus the final 'runner' stage. Mention image size reduction, compiler elimination, non-root users, and .dockerignore.",
        keywords: ["multi-stage", "docker", "builder", "slim", "root", "user", "security", "attack surface", "layer", "caching"],
        idealAnswer: "A multi-stage Docker build splits compilation from execution. The first stage (`FROM python:3.11 AS builder`) installs build tools (`gcc`, `g++`, `libpq-dev`) to compile heavy Python dependencies and generate wheels. The final production stage (`FROM python:3.11-slim`) copies only the pre-compiled wheels and application code, discarding compiler binaries, header files, and build cache. This shrinks image size from ~1.2GB down to ~160MB, accelerating container startup and scaling. Two critical security best practices are: 1) Enforcing a dedicated non-root user (`RUN useradd -m appuser && USER appuser`) to block host privilege escalation if a vulnerability is exploited; and 2) Using a strict `.dockerignore` file to exclude virtualenvs, test datasets, git history, and secrets."
      },
      terms: [
        ["Docker Image Layer", "A read-only filesystem diff created by instructions (RUN, COPY, ADD) in a Dockerfile, cached for fast rebuilds."],
        ["Multi-Stage Build", "A Docker feature allowing developers to use multiple FROM statements, copying only necessary artifacts between stages."],
        ["Base Image", "The foundational container image (e.g. python:3.11-slim) providing OS userland and runtime dependencies."],
        ["Rootless Container", "Running the main container application process as an unprivileged user (UID >= 1000) rather than root."],
        [".dockerignore", "Configuration file specifying files and directories to omit when sending the build context to the Docker daemon."]
      ],
      quiz: [
        { q: "Why place 'COPY requirements.txt .' and 'RUN pip install' before 'COPY . .' in a Dockerfile?", o: ["To enable Docker layer caching so pip install isn't re-run every time application code changes", "To make Python run faster", "Docker syntax requires dependencies first", "To encrypt requirements.txt"], a: 0, e: "Docker caches image layers from top to bottom. If requirements.txt has not changed, Docker reuses the cached pip layer, making subsequent code-only builds complete in seconds." },
        { q: "Which base image provides the best balance of minimal size and compatibility for PyTorch/Scikit-Learn microservices?", o: ["ubuntu:22.04 (850MB)", "python:3.11-slim (140MB)", "alpine:latest (5MB, musl libc)", "python:3.11-full (1.2GB)"], a: 1, e: "python:3.11-slim uses standard glibc (compatible with all C-extensions and pre-compiled wheels) while removing unnecessary system packages." }
      ],
      fact: {
        title: "Why Alpine Linux Can Slow Python Builds",
        desc: "Alpine Linux uses musl libc instead of glibc. Because most scientific Python packages (NumPy, SciPy, pandas) publish pre-compiled wheels for glibc (manylinux), Alpine forces slow compilation from source during build, often taking 20+ minutes and creating larger final images than python-slim."
      }
    },
    {
      title: "Serving Architectures, Load Balancing & Canary Traffic Routing",
      subtitle: "Implement zero-downtime upgrades, blue-green environments, and canary error budgets",
      checkpointTime: 47,
      captions: [
        { time: 0, text: "In mission-critical hospital systems, you cannot take an AI prediction service offline for 15 minutes whenever an updated model checkpoint is released. We require zero-downtime deployment strategies." },
        { time: 16, text: "A reverse proxy and load balancer (such as Nginx, Traefik, or AWS ALB) acts as the single public entry point, distributing incoming traffic across multiple healthy container replicas." },
        { time: 33, text: "In Blue/Green deployment, two identical production environments exist. Blue runs v1; we deploy v2 to Green, verify health checks, and instantaneously switch router traffic from Blue to Green." },
        { time: 47, text: "Checkpoint: how does a Canary deployment mitigate risk compared to Blue/Green, and what metrics trigger an automated instant rollback?" },
        { time: 67, text: "In Canary routing, we route a small fraction (e.g. 5%) of real traffic to v2 while 95% remains on v1. We monitor error rates, latency p99, and prediction anomalies." },
        { time: 88, text: "If the Canary error rate breaches an error budget threshold (e.g. >1.5% 5xx errors or 300ms p99 latency), the router immediately drops Canary traffic back to 0% with zero clinical disruption." }
      ],
      checkpoint: {
        question: "Compare Blue/Green and Canary deployment strategies for machine learning models. How do you configure health checks and error budgets to automate rollbacks?",
        hint: "Discuss traffic percentage splits, blast radius of model regressions, liveness vs readiness probes, and automated threshold alerts.",
        keywords: ["canary", "blue green", "traffic", "rollback", "error budget", "health check", "readiness probe", "blast radius", "latency"],
        idealAnswer: "Blue/Green deployment maintains two identical full environments; once Green is validated, router traffic flips 100% all at once. While fast, if a subtle bug or edge-case regression exists, 100% of incoming users are affected immediately. In contrast, Canary deployment routes a tiny initial fraction (e.g. 5% to 10%) of live traffic to the new model (v2) while 90% stays on stable v1, drastically minimizing the blast radius. Health checks use readiness probes (checking if model weights are loaded in memory) and liveness probes (verifying the HTTP loop responds). Automated rollbacks monitor an error budget: if the Canary's HTTP 5xx rate exceeds 1% or p99 latency spikes above 250ms over a 2-minute rolling window, the ingress controller shifts 100% of traffic back to v1 automatically."
      },
      terms: [
        ["Canary Deployment", "Routing a small percentage of live production traffic to a new version to validate performance before wide rollout."],
        ["Blue/Green Deployment", "Maintaining two identical environments, flipping router traffic entirely from the active to the standby environment."],
        ["Blast Radius", "The scope and severity of damage or user impact if a new deployment experiences bugs or downtime."],
        ["Readiness Probe", "A container check ensuring the application has finished initializing (e.g. loaded model weights) before receiving traffic."],
        ["Error Budget", "The maximum allowable threshold of errors or degraded latency permitted before deployment gates halt and roll back."]
      ],
      quiz: [
        { q: "An ingress router directs 10% of traffic to a new model v2. Within 5 minutes, v2 has an error rate of 8% while v1 has 0.05%. What should happen?", o: ["Route 100% traffic to v2 to see if it fixes itself", "Trigger an automated rollback, dropping v2 traffic to 0% and alerting on-call engineers", "Restart the entire cluster", "Ignore the error since it is under 10% total traffic"], a: 1, e: "An error budget breach (8% error rate) on a canary deployment must immediately trigger an automated rollback to protect production stability." },
        { q: "What is the primary difference between a Liveness Probe and a Readiness Probe in container orchestration?", o: ["Liveness checks if the container is running; Readiness checks if the application is ready to accept incoming user requests", "Liveness is for databases only", "Readiness checks disk space", "There is no difference"], a: 0, e: "A liveness probe restarts a deadlocked container; a readiness probe holds traffic until heavy assets (like 1GB ML models) have fully loaded into RAM." }
      ],
      fact: {
        title: "Shadow Deployments (Dark Traffic)",
        desc: "In ultra-high stakes domains like medical diagnosis or autonomous driving, companies use Shadow Deployments: real production requests are asynchronously mirrored to the new model in the background, testing predictions against ground truth without exposing end users to any risk."
      }
    },
    {
      title: "Inference Performance: ONNX, Pruning & INT8 Quantization",
      subtitle: "Accelerate prediction throughput, shrink model sizes, and reduce server operational costs",
      checkpointTime: 48,
      captions: [
        { time: 0, text: "Training throughput focuses on processing millions of samples in parallel batches across days. Inference latency, however, is about serving a single patient prediction in under 15 milliseconds." },
        { time: 17, text: "Python is dynamically typed and carries significant interpreter overhead. Frameworks like ONNX (Open Neural Network Exchange) compile model compute graphs into highly optimized C++ runtimes." },
        { time: 33, text: "Standard machine learning model weights are stored as 32-bit floating point numbers (FP32). Post-training quantization converts these weights into 8-bit integers (INT8)." },
        { time: 48, text: "Checkpoint: how does 8-bit integer quantization achieve a 4x reduction in model memory footprint, and how does INT8 accelerate CPU vector operations?" },
        { time: 68, text: "Because INT8 uses only 1 byte per parameter instead of 4 bytes in FP32, model size immediately shrinks by 75%. Furthermore, modern CPU SIMD registers (AVX-512, VNNI) process four times as many INT8 operations per clock cycle." },
        { time: 88, text: "Coupled with weight pruning (zeroing out redundant tree branches or tiny weights), quantization yields dramatic speedups with less than 0.5% drop in clinical ROC-AUC." }
      ],
      checkpoint: {
        question: "Explain the mathematical principle of post-training quantization from FP32 to INT8. Why does it shrink memory by 4x, and what hardware acceleration does INT8 leverage?",
        hint: "Recall byte sizes (32 bits = 4 bytes vs 8 bits = 1 byte). Mention affine scaling (q = round(r/S) + Z), memory bandwidth bottlenecks, and SIMD instruction sets.",
        keywords: ["quantization", "fp32", "int8", "memory", "4x", "scale", "zero point", "simd", "latency", "bandwidth"],
        idealAnswer: "Post-training quantization maps continuous 32-bit floating point values (FP32) into discrete 8-bit integers (INT8) via linear affine transformation: $q = \\text{round}(r / S) + Z$, where $S$ is a scale factor and $Z$ is the zero-point offset. Because FP32 requires 4 bytes per parameter while INT8 requires only 1 byte, the model's disk and RAM memory footprint is reduced by exactly 4× (75% savings). In production inference, memory bandwidth is often the primary bottleneck; transferring 4× fewer bytes from RAM to CPU cache significantly speeds up execution. Additionally, modern CPUs utilize SIMD vector extensions (Intel AVX-512 VNNI, ARM NEON) that execute multiple INT8 multiply-accumulate operations in a single clock cycle, often yielding a 2× to 4× reduction in inference latency with negligible degradation in accuracy."
      },
      terms: [
        ["FP32", "32-bit single-precision floating point format; standard default for training ML models."],
        ["INT8 Quantization", "Converting 32-bit floats to 8-bit signed/unsigned integers to reduce memory bandwidth and accelerate arithmetic."],
        ["ONNX Runtime", "A cross-platform, high-performance scoring engine for Open Neural Network Exchange models."],
        ["Weight Pruning", "Removing redundant parameters or decision branches with near-zero weights to sparsify models."],
        ["SIMD / VNNI", "Single Instruction Multiple Data / Vector Neural Network Instructions: hardware-level parallelism for ultra-fast integer matrix dot products."]
      ],
      quiz: [
        { q: "A deep learning ensemble model has a serialized file size of 240 MB in standard FP32. What will its approximate size be after INT8 quantization?", o: ["120 MB", "60 MB", "24 MB", "480 MB"], a: 1, e: "INT8 uses 1 byte per weight compared to 4 bytes for FP32: 240 MB / 4 = 60 MB (a 75% reduction in size)." },
        { q: "What is the primary benefit of exporting a scikit-learn or PyTorch model to ONNX format?", o: ["It makes the model run in web browsers and optimized C++ runtimes independent of Python", "It automatically gathers more training data", "It eliminates the need for unit testing", "It prevents model drift"], a: 0, e: "ONNX provides an open graph format executed by native C++ inference engines (ONNX Runtime), eliminating Python runtime overhead and supporting multi-platform deployment." }
      ],
      fact: {
        title: "Inference is Memory-Bound, Not Compute-Bound",
        desc: "For small-batch or single-instance model inference, modern CPUs spend over 70% of time waiting for weights to be fetched from DRAM into CPU cache. Shrinking weights with INT8 quantization directly cuts DRAM bus traffic by 4×, creating massive real-world speedups even on budget cloud VMs."
      }
    },
    {
      title: "Observability, Covariate Drift & Population Stability Index (PSI)",
      subtitle: "Detect data distribution changes and performance degradation before models fail patients",
      checkpointTime: 47,
      captions: [
        { time: 0, text: "Software systems fail visibly with stack traces and crash logs. Machine learning models fail silently: the API continues returning HTTP 200 with clean JSON, but predictions quietly lose real-world validity." },
        { time: 16, text: "We distinguish between Data Drift (covariate shift, where the input distribution P(X) changes over time) and Concept Drift (where the relationship P(Y given X) between features and target changes)." },
        { time: 33, text: "For instance, if our Uganda hospital opens a pediatric or geriatric wing, the patient age and BMI distributions shift dramatically from the training population." },
        { time: 47, text: "Checkpoint: how does the Population Stability Index (PSI) quantify covariate drift, and what mathematical threshold dictates when to trigger automated retraining?" },
        { time: 67, text: "PSI divides a continuous feature into reference bins (typically 10 quantiles) and compares the expected training proportion E to actual production proportion A: sum of (A minus E) times ln(A over E)." },
        { time: 88, text: "A PSI below 0.1 indicates stability. PSI between 0.1 and 0.25 flags moderate drift for monitoring. A PSI of 0.25 or greater indicates significant drift requiring an automated retraining and recalibration pipeline." }
      ],
      checkpoint: {
        question: "Define Data Drift versus Concept Drift with clinical examples, and explain how the Population Stability Index (PSI) is calculated and interpreted.",
        hint: "P(X) vs P(Y|X). State the PSI formula: sum of (Actual - Expected) * ln(Actual / Expected), and the standard thresholds (<0.1, 0.1-0.25, >0.25).",
        keywords: ["data drift", "concept drift", "psi", "population stability index", "actual", "expected", "threshold", "retraining", "covariate shift"],
        idealAnswer: "Data Drift (covariate shift) occurs when the input feature distribution $P(X)$ changes over time while the true relationship remains the same—e.g., if hospital outreach causes the proportion of elderly patients (age > 65) to double from training baseline. Concept Drift occurs when the underlying statistical relationship between features and target $P(Y|X)$ changes—e.g., if a new preventative hypertension medication decouples high blood pressure from subsequent stroke incidence. The Population Stability Index (PSI) quantifies covariate shift by partitioning features into reference bins (quantiles) and calculating: $\\text{PSI} = \\sum_{i=1}^k (A_i - E_i) \\times \\ln(A_i / E_i)$, where $E_i$ is expected baseline frequency and $A_i$ is actual production frequency. Standard industry interpretation: PSI < 0.1 means no significant change; 0.1 ≤ PSI < 0.25 indicates moderate drift; and PSI ≥ 0.25 indicates severe drift, automatically alerting engineering and triggering retraining pipelines."
      },
      terms: [
        ["Data Drift (Covariate Shift)", "Change in the marginal distribution of input features P(X) between training and production inference."],
        ["Concept Drift", "Change in the conditional distribution P(Y|X); the relationship between inputs and ground-truth targets fundamentally changes."],
        ["Population Stability Index (PSI)", "A symmetric metric derived from Kullback-Leibler divergence measuring the shift between two probability distributions."],
        ["Kolmogorov-Smirnov (KS) Test", "A non-parametric statistical hypothesis test comparing continuous cumulative distributions to detect significant divergence."],
        ["Automated Retraining Trigger", "A monitored workflow (e.g. in Airflow) that automatically initiates model training when drift or performance metrics breach thresholds."]
      ],
      quiz: [
        { q: "In a production monitoring dashboard, the PSI for patient glucose distribution over the last 30 days is measured at 0.32. What action should be taken?", o: ["Do nothing because 0.32 is negligible", "PSI >= 0.25 indicates significant drift; alert the team, inspect demographic shifts, and trigger model retraining", "Delete the model file", "Scale up container replicas"], a: 1, e: "A PSI value of 0.25 or greater indicates substantial distribution drift, demanding root-cause investigation and pipeline retraining." },
        { q: "During COVID-19, patient symptoms and travel patterns changed radically, altering how ML models predicted respiratory risk. What type of drift is this?", o: ["Concept drift and covariate data drift simultaneously", "Hardware drift", "RAM drift", "Compiler drift"], a: 0, e: "Sudden systemic shifts change both input feature patterns (covariate shift) and the disease dynamics/relationships (concept drift)." }
      ],
      fact: {
        title: "Evidently AI & Prometheus in Production",
        desc: "Modern MLOps stacks export statistical drift metrics (PSI, Wasserstein distance, KS p-values) from Evidently AI directly into Prometheus and Grafana dashboards, firing automated Slack/PagerDuty alerts before degraded model predictions affect patients."
      }
    },
    {
      title: "Capstone: Regional Referral Hospital Stroke Risk Pipeline & Explainable AI (XAI)",
      subtitle: "Deploy the Ministry of Health stroke predictor with threshold calibration and SHAP feature attributions",
      checkpointTime: 49,
      captions: [
        { time: 0, text: "We unite all eight preceding modules into our comprehensive capstone: deploying the Cerebrovascular Accident Risk Predictor for a high-volume Regional Referral Hospital in Uganda." },
        { time: 17, text: "Per the Ministry of Health service integration guidelines of June 2025, high-risk patients identified at hospital triage are automatically enrolled in the chronic care clinic." },
        { time: 33, text: "Because only ~5% of patients suffer strokes, the default 0.5 classification threshold is catastrophic. By calibrating the decision threshold to 0.22, we maximize clinical Recall while controlling triage capacity." },
        { time: 49, text: "Checkpoint: why is a 'black-box' prediction unacceptable to a referral physician, and how do SHAP values provide mathematically grounded local explanations?" },
        { time: 69, text: "Physicians will not trust or act upon an unexplained numerical probability. Explainable AI (XAI) with SHAP (SHapley Additive exPlanations) calculates each feature's exact marginal contribution to the patient's risk score." },
        { time: 89, text: "An attending doctor sees immediately: 'Base hospital risk is 5%. This patient is predicted at 42% risk (+18% due to Age 68, +12% due to Hypertension, +7% due to Glucose 220 mg/dL)'. Explainability turns predictions into clinical action." }
      ],
      checkpoint: {
        question: "Why must clinical classification thresholds be calibrated away from the default 0.5, and how does SHAP (Shapley Additive exPlanations) establish clinical trust for attending doctors?",
        hint: "Contrast symmetric classification cost with asymmetric clinical cost (missing a stroke vs ordering an extra test). Mention game theory, local feature attributions, and actionable medical insight.",
        keywords: ["threshold", "calibration", "recall", "shap", "shapley", "explainability", "xai", "clinical trust", "feature attribution", "asymmetric cost"],
        idealAnswer: "The default 0.5 probability threshold assumes symmetric misclassification costs (a False Positive equals a False Negative). In clinical triage, a False Negative (missing a high-risk stroke patient who then suffers permanent disability or death) is catastrophic, whereas a False Positive (an extra diagnostic evaluation or chronic clinic check) is low-cost. We calibrate the decision threshold down (e.g. to 0.20–0.25) to achieve 85%+ Recall. SHAP values, rooted in cooperative game theory, establish clinical trust by decomposing the final prediction into exact, additive feature attributions: $\\text{Prediction} = \\text{Base Risk} + \\sum \\phi_i$. Rather than seeing an untrusted black-box probability, the doctor sees precisely which risk factors (e.g., Age +16%, Hypertension +14%, Glucose +8%) drove the prediction, validating clinical plausibility and guiding immediate therapeutic intervention."
      },
      terms: [
        ["Threshold Calibration", "Adjusting the classification decision boundary away from 0.5 to optimize clinical utility under asymmetric error costs."],
        ["Explainable AI (XAI)", "Methods and techniques in machine learning that make the outputs and internal reasoning of models interpretable to humans."],
        ["SHAP (SHapley Additive exPlanations)", "Game-theoretic approach to explain individual predictions by computing the average marginal contribution of each feature across all subsets."],
        ["Local Feature Attribution", "Quantifying how much each specific input feature value shifted the prediction for an individual patient relative to the dataset average."],
        ["Chronic Clinic Integration", "Uganda Ministry of Health June 2025 protocol integrating predictive risk triage to refer high-risk cardiovascular patients into longitudinal care."]
      ],
      quiz: [
        { q: "A hospital model outputs stroke probability = 0.28. If the threshold is 0.5, the patient is flagged negative; if threshold is 0.20, flagged positive. Why choose 0.20?", o: ["0.20 lowers false negatives, ensuring critical stroke-risk patients receive urgent preventative care", "0.20 uses less computer memory", "0.20 is required by Python", "0.20 guarantees 100% precision"], a: 0, e: "Lowering the decision threshold prioritizes sensitivity/recall, capturing life-threatening conditions where missing a patient is far costlier than a false alarm." },
        { q: "What property guarantees that the sum of all SHAP values plus the baseline expected value equals the model's exact prediction for a patient?", o: ["Efficiency (Additivity) property of Shapley values", "Bayes theorem", "The Central Limit Theorem", "Occam's Razor"], a: 0, e: "The Efficiency (Additivity) axiom from Shapley game theory proves that the sum of feature attributions exactly equals the difference between the model output and the expected base rate." }
      ],
      fact: {
        title: "Uganda MOH 2025 Integrated Non-Communicable Disease Guidelines",
        desc: "In Sub-Saharan Africa, cerebrovascular accidents occur at younger median ages (often under 55) due to undiagnosed hypertension. Integrating predictive MLOps pipelines with explainable SHAP dashboards in regional referral hospitals allows early preventative intervention before catastrophic acute events."
      }
    }
  ],

  examQuestions: [
    {
      prompt: "Explain why data leakage occurs when standard scaling or imputation is applied to an entire dataset prior to splitting, and describe how an scikit-learn Pipeline prevents this in production.",
      topic: "Data Preparation & Pipeline Architecture",
      keywords: ["leakage", "split", "fit", "fit_transform", "train", "test", "pipeline", "statistics", "generalization"],
      modelAnswer: "Data leakage happens when information from outside the training partition leaks into the model. If you apply `StandardScaler().fit_transform(X)` before `train_test_split`, the mean and variance computed reflect the test set, creating overly optimistic validation metrics that degrade in production. An `sklearn.pipeline.Pipeline` wraps preprocessing and estimators together: calling `pipeline.fit(X_train, y_train)` computes scaling parameters solely from training data, and `pipeline.predict(X_test)` applies those stored parameters without learning anything new from incoming inference samples.",
      tip: "Emphasize: 'Fit on train, transform on test'—never compute parameters across the full dataset."
    },
    {
      q: "Compare Python's built-in pickle with joblib for machine learning persistence. When is joblib preferred, and why is unpickling untrusted files a critical security risk?",
      topic: "Model Serialization & Security",
      keywords: ["pickle", "joblib", "numpy", "array", "memory map", "mmap", "security", "arbitrary code execution", "reduce", "vulnerability"],
      modelAnswer: "While `pickle` is Python's standard object serializer, `joblib` is preferred for machine learning because it is optimized for large NumPy numerical arrays, utilizing disk compression and memory-mapping (mmap) to prevent duplicate RAM copies across child worker processes. However, both pickle and joblib deserialize objects via the `__reduce__` protocol, which can execute arbitrary bytecode and shell commands. Ingesting an unauthenticated model file from the public internet can instantly grant an attacker a reverse root shell on your inference server.",
      tip: "Structure your answer into 3 parts: serialization performance, NumPy memory mapping, and the __reduce__ arbitrary code execution vulnerability."
    },
    {
      q: "How does FastAPI combined with Pydantic handle incoming inference payloads, and why is boundary validation vital for maintaining high API availability?",
      topic: "API Serving & Input Validation",
      keywords: ["fastapi", "pydantic", "schema", "validation", "422", "boundary", "uptime", "contract", "exceptions"],
      modelAnswer: "FastAPI utilizes Pydantic `BaseModel` classes to define and enforce strict data contracts at the network boundary. Incoming JSON payloads are parsed and validated against expected data types and domain constraints (such as positive glucose and valid blood pressure ranges). If a payload is malformed, FastAPI automatically generates an HTTP 422 Unprocessable Entity error and halts execution before any model code is called. This protects downstream estimators from uncaught exceptions, avoids silent data corruption, and ensures the service maintains 99.9% uptime without crashing.",
      tip: "Highlight that boundary validation catches errors before compute-heavy model operations are triggered."
    },
    {
      q: "Define the five essential characteristics of Cloud Computing according to NIST, and explain why elasticity is particularly crucial for machine learning inference services.",
      topic: "Cloud Infrastructure & Sizing",
      keywords: ["nist", "on-demand self-service", "broad network access", "resource pooling", "rapid elasticity", "measured service", "scaling", "autoscaling"],
      modelAnswer: "The five NIST cloud characteristics are: 1) On-demand self-service, 2) Broad network access, 3) Resource pooling, 4) Rapid elasticity, and 5) Measured service. Rapid elasticity is critical for ML serving because inference request volume is heavily diurnal and unpredictable. During peak hospital triage hours, traffic may jump from 5 to 500 requests per second. Elastic autoscaling provisions additional container replicas to absorb spikes without dropping requests or breaching SLA latency, then scales compute down to zero during nighttime to minimize cloud spend.",
      tip: "List the 5 NIST traits cleanly before diving into the specific benefits of rapid elasticity for traffic spikes."
    },
    {
      q: "Explain how multi-stage Docker builds reduce container image size and minimize the security attack surface for a Python ML microservice.",
      topic: "Containerization & Security Hardening",
      keywords: ["multi-stage", "docker", "builder", "slim", "attack surface", "compilers", "cve", "wheels"],
      modelAnswer: "A multi-stage Docker build uses separate `FROM` instructions to isolate the build environment from the final execution runtime. In the builder stage, heavy tools like `gcc`, `g++`, and header packages compile Python wheels. The final production stage starts from a minimal `python:3.11-slim` image and copies only the compiled wheels and application code, omitting compilers, package managers, and build artifacts. This slashes image size from ~1.2 GB to ~150 MB, speeds up deployment pulls across cloud nodes, and drastically shrinks the attack surface by eliminating vulnerable OS binaries.",
      tip: "Contrast the 'builder' environment with the lean 'runtime' image to demonstrate architectural clarity."
    },
    {
      q: "Contrast Blue/Green deployment with Canary routing for releasing an updated AI model. How do you configure automated rollbacks using error budgets?",
      topic: "Traffic Routing & Zero-Downtime Serving",
      keywords: ["canary", "blue-green", "traffic", "rollback", "error budget", "blast radius", "p99", "latency"],
      modelAnswer: "Blue/Green deployment maintains two complete identical environments and switches 100% of user traffic instantaneously from Blue to Green. While fast, any unseen bug affects all incoming users immediately. In Canary deployment, the ingress load balancer sends a small percentage (e.g. 5%) of live traffic to the new model (v2) while 95% remains on v1, drastically limiting the blast radius. Automated rollbacks monitor an error budget: if the Canary's HTTP 5xx error rate exceeds 1% or p99 latency exceeds 250ms over a rolling evaluation window, the router immediately sets Canary traffic to 0%, preserving production stability.",
      tip: "Define 'blast radius' and explain how canary traffic splitting minimizes risk to real users."
    },
    {
      q: "Describe the mechanics of INT8 post-training quantization. Why does it produce an immediate 4x memory savings, and how does it accelerate CPU inference?",
      topic: "Inference Performance & Quantization",
      keywords: ["quantization", "int8", "fp32", "4x", "scale", "zero-point", "simd", "memory bandwidth", "latency"],
      modelAnswer: "Post-training quantization maps continuous 32-bit floating-point weights (FP32) into 8-bit integers (INT8) through a linear affine equation: q = round(r/S) + Z, where S is the scale and Z is the zero-point offset. Because an INT8 number occupies 1 byte while FP32 requires 4 bytes, memory footprint is reduced by exactly 4x (75% savings). In inference, single-sample latency is typically memory-bandwidth bound; loading 4x fewer bytes from RAM into CPU caches eliminates bus stalls. Modern CPUs also feature SIMD vector extensions (AVX-512 VNNI) that execute four INT8 matrix operations in parallel per clock cycle.",
      tip: "Mention both the storage benefit (4 bytes to 1 byte) and the compute benefit (SIMD integer vectorization)."
    },
    {
      q: "What is the difference between Data Drift (covariate shift) and Concept Drift? How does the Population Stability Index (PSI) detect data drift in production?",
      topic: "Model Observability & Drift Detection",
      keywords: ["data drift", "covariate shift", "concept drift", "psi", "population stability index", "actual", "expected", "retraining"],
      modelAnswer: "Data Drift (covariate shift) is a change in the input feature distribution P(X) while the target relationship remains constant—such as a hospital opening an elderly clinic and shifting the age distribution. Concept Drift is a change in the conditional relationship P(Y|X) between inputs and outputs—such as a medical breakthrough that decouples hypertension from stroke. The Population Stability Index (PSI) quantifies drift by binning features into quantiles and calculating: sum of (Actual_i - Expected_i) * ln(Actual_i / Expected_i). A PSI < 0.1 indicates no drift; 0.1 to 0.25 indicates moderate drift; and PSI >= 0.25 flags severe drift requiring pipeline retraining.",
      tip: "Be explicit: PSI < 0.1 is clean, 0.1–0.25 needs monitoring, and >= 0.25 requires immediate model retraining."
    },
    {
      q: "In the Uganda Referral Hospital stroke risk dataset, why is raw accuracy misleading, and how do you calibrate the classification decision threshold for clinical utility?",
      topic: "Clinical Threshold Calibration & Metrics",
      keywords: ["accuracy", "stroke", "imbalance", "threshold", "calibration", "false negative", "recall", "cost-sensitive"],
      modelAnswer: "With ~5% positive stroke prevalence in clinical registries, a naive model predicting 'No Stroke' for all patients scores 95% accuracy while achieving 0% recall, missing every single life-threatening event. In medical triage, misclassification costs are highly asymmetric: a False Negative can cause death or permanent disability, while a False Positive results in a low-cost preventative exam. By calibrating the decision threshold down from the default 0.5 to around 0.20–0.25, we boost Recall to over 85%, ensuring high-risk patients are successfully routed into the chronic care clinic as mandated by Ministry of Health guidelines.",
      tip: "Ground your answer in real clinical consequences: false negatives kill patients; false positives trigger extra checkups."
    },
    {
      q: "Explain how SHAP (SHapley Additive exPlanations) values establish clinical trust for physicians acting on AI recommendations at hospital triage.",
      topic: "Explainable AI (XAI) & Clinical Adoption",
      keywords: ["shap", "shapley", "xai", "explainable", "attribution", "game theory", "trust", "waterfall", "physician"],
      modelAnswer: "Doctors rightly reject 'black-box' probabilities because they cannot verify the clinical reasoning or justify treatments to patients. SHAP values, grounded in cooperative game theory, provide mathematically guaranteed local feature attributions that satisfy the efficiency axiom: the patient's predicted risk exactly equals the population base rate plus the sum of all individual feature effects. A clinician sees an intuitive breakdown—e.g., base hospital risk 5%, plus 18% from age 68, plus 12% from chronic hypertension, plus 7% from elevated glucose. This transparency allows doctors to validate that predictions align with medical pathophysiology and focus treatment on actionable risk factors.",
      tip: "State that SHAP decomposes predictions additively: Base Rate + Sum of Feature Effects = Final Probability."
    }
  ],

  formulas: [
    ["Little's Law (API Concurrency)", "L = λ × W  (concurrency = arrival rate × latency)"],
    ["INT8 Quantization Memory", "Size(INT8) = Size(FP32) / 4 = 0.25 × Size(FP32)"],
    ["Population Stability Index (PSI)", "PSI = Σ (A_i − E_i) × ln(A_i / E_i)"],
    ["Clinical Recall (Sensitivity)", "Recall = TP / (TP + FN)  (proportion of strokes flagged)"],
    ["Precision (Positive Predictive Value)", "Precision = TP / (TP + FP)  (proportion of alerts true)"],
    ["F-Beta Score (Clinical Emphasis on Recall)", "F_β = (1 + β²) × (Precision × Recall) / ((β² × Precision) + Recall)"],
    ["Quantization Affine Mapping", "q = round(r / S) + Z  (scale S, zero-point Z)"],
    ["Tukey IQR Outlier Fences", "[Q1 − 1.5×IQR, Q3 + 1.5×IQR]  (IQR = Q3 − Q1)"],
    ["Error Budget Depletion Rate", "Burn Rate = Observed Error Rate / Allowable Error Rate"],
    ["Spot Instance Cost Savings", "Savings% = (1 − Spot Price / On-Demand Price) × 100"],
    ["SHAP Additive Efficiency Property", "f(x) = φ_0 + Σ φ_i  (base risk + feature attributions)"],
    ["Amdahl's Law for Inference Parallelism", "Speedup = 1 / ((1 − p) + p / s)"],
    ["Cross-Entropy Loss with Focal Weighting", "FL(p_t) = −α_t (1 − p_t)^γ ln(p_t)"]
  ],

  labVariations: [
    /* Lab 0: Clinical Feature Preparation, Scaler Leakage & Imbalance */
    [
      {
        title: "Stroke Class Imbalance Minority Count",
        q: "In a regional hospital dataset of <b>5,000 patients</b>, stroke prevalence is exactly <b>4.8%</b>. How many patients in this cohort have suffered a stroke (the positive minority class)?",
        answer: 240,
        tol: 0,
        hint: "Multiply 5,000 by 0.048.",
        explain: "5,000 × 0.048 = 240 stroke patients. The remaining 4,760 patients are stroke-free, demonstrating a 20:1 clinical class imbalance."
      },
      {
        title: "Tukey IQR Upper Outlier Fence for BMI",
        q: "In the stroke registry, patient BMI has <b>Q1 = 23.5</b> and <b>Q3 = 31.5</b>. Using Tukey's rule (<code>Q3 + 1.5 × IQR</code>), what is the upper outlier boundary cutoff?",
        answer: 43.5,
        tol: 0.1,
        hint: "First calculate IQR = Q3 − Q1 = 31.5 − 23.5 = 8.0. Then add 1.5 × 8.0 to Q3.",
        explain: "IQR = 31.5 − 23.5 = 8.0. Upper fence = 31.5 + 1.5 × 8.0 = 31.5 + 12.0 = 43.5. Any BMI value exceeding 43.5 is flagged for clinical review or robust winsorization."
      },
      {
        title: "Train-Test Leakage Scaling Discrepancy",
        q: "An incoming patient has average glucose level <b>220 mg/dL</b>. The training set has <b>μ = 105</b> and <b>σ = 30</b>. What is the correctly scaled z-score <code>(x − μ) / σ</code> using strictly training statistics? (2 decimals)",
        answer: 3.83,
        tol: 0.02,
        hint: "Compute (220 − 105) / 30.",
        explain: "z = (220 − 105) / 30 = 115 / 30 = 3.833... ≈ 3.83 standard deviations above the training baseline mean."
      }
    ],
    /* Lab 1: Model Persistence, Serialization & Packaging */
    [
      {
        title: "NumPy Array Serialization: Pickle vs Joblib",
        q: "A feature matrix of <b>1,000,000 float64 elements</b> occupies <b>8.0 MB</b> in raw pickle. Serialized with <code>joblib.dump(..., compress=3)</code>, it achieves a <b>62% size reduction</b>. What is the compressed file size in <b>MB</b>? (2 decimals)",
        answer: 3.04,
        tol: 0.05,
        hint: "Multiply 8.0 MB by (1 − 0.62) = 0.38.",
        explain: "Compressed size = 8.0 × (1 − 0.62) = 8.0 × 0.38 = 3.04 MB. Joblib's native compression significantly reduces storage and cloud deployment bundle sizes."
      },
      {
        title: "Cold-Start Deserialization Latency Reduction",
        q: "Deserializing an uncompressed pickle model takes <b>45.0 ms</b> on serverless cold starts. Switching to memory-mapped Joblib (<code>mmap_mode='r'</code>) cuts model load time to <b>1.5 ms</b>. How many <b>milliseconds</b> are saved per cold start?",
        answer: 43.5,
        tol: 0.1,
        hint: "Subtract 1.5 ms from 45.0 ms.",
        explain: "45.0 − 1.5 = 43.5 ms saved. Memory mapping avoids reading the entire weight matrix into Python heap memory at startup."
      },
      {
        title: "Pipeline Preprocessor Feature Alignment",
        q: "A production <code>ColumnTransformer</code> takes raw patient dictionaries, imputes 2 missing fields, one-hot encodes 3 categorical features (generating <b>8 binary columns</b>), and passes <b>3 numerical columns</b> unchanged. How many total columns enter the classifier?",
        answer: 11,
        tol: 0,
        hint: "Add 8 encoded columns + 3 numerical columns.",
        explain: "8 one-hot columns + 3 scaled numerical columns = 11 final feature columns fed into the estimator."
      }
    ],
    /* Lab 2: FastAPI, Pydantic & Async Workers */
    [
      {
        title: "Little's Law API Concurrency Capacity",
        q: "A stroke screening endpoint handles an arrival rate <b>λ = 250 requests/sec</b> with average model inference latency <b>W = 40 ms (0.040s)</b>. According to Little's Law (<code>L = λ × W</code>), how many concurrent requests are in flight on the server?",
        answer: 10,
        tol: 0.1,
        hint: "Multiply 250 req/s by 0.040s.",
        explain: "L = 250 × 0.040 = 10 concurrent requests in flight. This dictates the minimum worker pool sizing needed to prevent request queuing."
      },
      {
        title: "FastAPI Uvicorn Concurrency Sizing",
        q: "A Uvicorn worker process handles up to <b>50 concurrent async requests</b>. To support a peak concurrent capacity of <b>200 active requests</b> without queuing, how many worker processes must be spawned via Gunicorn?",
        answer: 4,
        tol: 0,
        hint: "Divide 200 by 50.",
        explain: "200 / 50 = 4 workers. Typically, 2 to 4 workers per CPU core maximize asynchronous I/O throughput."
      },
      {
        title: "Edge Pydantic Validation CPU Savings",
        q: "Pydantic rejects an invalid payload (e.g., negative glucose) at the API boundary in <b>1.2 ms</b>. If unvalidated, passing the bad input into scikit-learn causes a crash after <b>18.5 ms</b> of pipeline execution. How many <b>ms</b> of CPU execution time are saved per bad request?",
        answer: 17.3,
        tol: 0.1,
        hint: "Subtract 1.2 ms from 18.5 ms.",
        explain: "18.5 − 1.2 = 17.3 ms saved per rejected request, shielding CPU inference workers from wasted compute."
      }
    ],
    /* Lab 3: Docker Containerization */
    [
      {
        title: "Multi-Stage Docker Image Footprint Reduction",
        q: "A single-stage Docker image containing build tools, GCC, and pip cache measures <b>1,280 MB</b>. Rebuilding with multi-stage compilation and <code>python:3.11-slim</code> produces a production image of <b>190 MB</b>. How many <b>MB</b> are trimmed from the image?",
        answer: 1090,
        tol: 0,
        hint: "Subtract 190 MB from 1,280 MB.",
        explain: "1,280 − 190 = 1,090 MB saved (an 85% reduction), drastically lowering network transfer times and attack surface."
      },
      {
        title: "Container Cold-Start Pull Duration",
        q: "On a hospital edge gateway with a <b>100 Mbps (12.5 MB/s)</b> network link, pulling an unoptimized <b>1,250 MB</b> container image took 100 seconds. How many seconds does it take to pull the optimized <b>150 MB</b> multi-stage container?",
        answer: 12,
        tol: 0.5,
        hint: "Divide 150 MB by 12.5 MB/s.",
        explain: "150 / 12.5 = 12 seconds. In auto-scaling and failover scenarios, 12 seconds vs 100 seconds is the difference between seamless scaling and service degradation."
      },
      {
        title: "Docker Container Memory Ceiling Headroom",
        q: "A container is allocated <b>512 MB</b> memory. Base OS and Python runtime consume <b>116 MB</b>. If each concurrent batch inference thread uses <b>22 MB</b>, how many concurrent threads can run before risking an OOM (Out Of Memory) kill?",
        answer: 18,
        tol: 0,
        hint: "Subtract 116 from 512, then take the integer floor of dividing by 22.",
        explain: "Available memory = 512 − 116 = 396 MB. Threads = ⌊396 / 22⌋ = 18 concurrent requests."
      }
    ],
    /* Lab 4: Cloud Infrastructure & Cost Optimization */
    [
      {
        title: "AWS EC2 On-Demand vs Spot Cost Delta",
        q: "An <code>m5.xlarge</code> instance costs <b>$0.192 per hour</b> On-Demand. For fault-tolerant batch stroke retraining, AWS Spot instances offer a <b>72% discount</b>. What is the Spot price per hour in dollars? (3 decimals)",
        answer: 0.054,
        tol: 0.003,
        hint: "Multiply $0.192 by (1 − 0.72) = 0.28.",
        explain: "$0.192 × 0.28 = $0.05376 ≈ $0.054/hr. Over a 720-hour month, this saves ~$100 per instance."
      },
      {
        title: "Auto-Scaling Target Group Sizing",
        q: "Peak clinical triage volume reaches <b>1,800 requests/minute</b>. If one container replica reliably serves <b>150 requests/minute</b> at < 50ms latency, what is the minimum number of instances required in the Auto-Scaling Group?",
        answer: 12,
        tol: 0,
        hint: "Divide 1,800 by 150.",
        explain: "1,800 / 150 = 12 instances required to handle peak surge without request buffering or SLA breach."
      },
      {
        title: "Monthly Serverless Cost vs Reserved VM",
        q: "A small clinic makes <b>50,000 API calls/month</b>. AWS Lambda charges $0.20/1M calls + compute, totaling <b>$0.15/month</b>, while a reserved VM costs <b>$15.00/month</b>. How many <b>dollars</b> does the clinic save per month by adopting serverless?",
        answer: 14.85,
        tol: 0.1,
        hint: "Subtract $0.15 from $15.00.",
        explain: "$15.00 − $0.15 = $14.85 saved per month (a 99% cost reduction for intermittent rural clinic workloads)."
      }
    ],
    /* Lab 5: CI/CD & Deployment Strategies (Canary / Blue-Green) */
    [
      {
        title: "Canary Deployment Initial Traffic Allocation",
        q: "A hospital network processes <b>8,000 diagnostic queries</b> per day. During the first phase of a canary release, <b>5%</b> of traffic is shifted to Model v2. Exactly how many patient requests are routed to the canary model on day one?",
        answer: 400,
        tol: 0,
        hint: "Multiply 8,000 by 0.05.",
        explain: "8,000 × 0.05 = 400 requests. This limited sample validates production metrics while bounding potential failure exposure to just 5% of users."
      },
      {
        title: "Error Budget Depletion Rate Gate",
        q: "During canary testing, <b>36 out of 20,000 requests</b> return HTTP 500 server errors. What is the observed error rate in <b>percent</b>?",
        answer: 0.18,
        tol: 0.01,
        hint: "Compute (36 / 20,000) × 100%.",
        explain: "(36 / 20,000) × 100% = 0.18%. If the SLA error budget is 0.10% (99.9% availability), this 0.18% burn triggers an automatic deployment abort."
      },
      {
        title: "Blue-Green Instant DNS Rollback",
        q: "When a canary fault is detected, a Blue-Green router flips 100% of traffic back to the healthy Blue environment in <b>0.45 seconds</b>. If a full redeployment would have taken <b>180 seconds</b>, how many seconds of critical patient service disruption are prevented?",
        answer: 179.55,
        tol: 0.5,
        hint: "Subtract 0.45 from 180.",
        explain: "180 − 0.45 = 179.55 seconds of downtime avoided by having an idle, pre-warmed Blue deployment standing by."
      }
    ],
    /* Lab 6: Inference Optimization, Quantization & ONNX */
    [
      {
        title: "INT8 Model Weight Compression",
        q: "An FP32 deep neural network contains <b>24 million parameters</b> (4 bytes each = 96 MB). Quantized to INT8 (1 byte per parameter), what is the new weight size in <b>MB</b>?",
        answer: 24,
        tol: 0,
        hint: "Multiply 24 million parameters by 1 byte, or divide 96 MB by 4.",
        explain: "96 MB / 4 = 24 MB. INT8 quantization cuts memory footprint by 75% with typically < 0.5% drop in F1 score."
      },
      {
        title: "ONNX Runtime Graph Fusion Speedup Factor",
        q: "Baseline PyTorch Python runtime executes patient inference in <b>28.5 ms</b>. Exporting to ONNX Runtime with operator fusion and ConstantFolding drops latency to <b>9.5 ms</b>. What is the speedup factor (<code>Latency_base / Latency_onnx</code>)?",
        answer: 3,
        tol: 0.1,
        hint: "Divide 28.5 ms by 9.5 ms.",
        explain: "28.5 / 9.5 = 3.0× speedup. Graph fusion combines BatchNorm and Conv layers into a single fused kernel, eliminating memory bandwidth hops."
      },
      {
        title: "Quantized DRAM Bus Bandwidth Savings",
        q: "At batch size 1, an FP32 model reads <b>80 MB</b> of weights from RAM per inference. Quantized to INT8, it reads only <b>20 MB</b>. Across a batch of <b>50 sequential inferences</b>, how many total <b>MB</b> are transferred across the memory bus for the INT8 model?",
        answer: 1000,
        tol: 0,
        hint: "Multiply 20 MB by 50 requests.",
        explain: "20 MB × 50 = 1,000 MB (1.0 GB) compared to 4,000 MB for FP32, reducing memory controller saturation by 3 GB."
      }
    ],
    /* Lab 7: Observability, Covariate Drift & PSI */
    [
      {
        title: "Population Stability Index (PSI) Bin Contribution",
        q: "In baseline training data, age bin [60–70] contained <b>20%</b> of patients (E = 0.20). In recent production traffic, this bin jumped to <b>32%</b> (A = 0.32). What is the PSI contribution of this single bin: <code>(A − E) × ln(A / E)</code>? (3 decimals)",
        answer: 0.056,
        tol: 0.004,
        hint: "Calculate (0.32 − 0.20) × ln(0.32 / 0.20) = 0.12 × ln(1.6).",
        explain: "Δ = 0.12. ln(1.6) = 0.47000. PSI_bin = 0.12 × 0.47000 = 0.0564 ≈ 0.056. Summing across all bins yields the total feature PSI."
      },
      {
        title: "Critical Covariate Drift Feature Count",
        q: "An MLOps drift monitor evaluates 8 clinical features. Their calculated PSI values are: <b>[0.04, 0.08, 0.28, 0.06, 0.12, 0.03, 0.26, 0.05]</b>. Using the standard threshold where <code>PSI ≥ 0.25</code> indicates critical drift requiring automated retraining, how many features are in critical drift?",
        answer: 2,
        tol: 0,
        hint: "Count how many values in the list are greater than or equal to 0.25.",
        explain: "Features with PSI = 0.28 and 0.26 exceed the 0.25 threshold (2 features). This automatically alerts on-call ML engineers."
      },
      {
        title: "Concept Drift F1 Degradation Percentage",
        q: "At deployment, the stroke triage model achieved an <b>F1 score of 0.80</b>. Due to seasonal disease distribution changes over 9 months without retraining, F1 dropped to <b>0.68</b>. What is the percentage decrease in F1 score? (1 decimal)",
        answer: 15,
        tol: 0.2,
        hint: "Compute ((0.80 − 0.68) / 0.80) × 100%.",
        explain: "(0.12 / 0.80) × 100% = 15.0% performance degradation, demonstrating why automated drift monitoring is essential."
      }
    ],
    /* Lab 8: Capstone: Hospital Stroke Risk Pipeline & Explainable AI (XAI) */
    [
      {
        title: "Decision Threshold Calibration for Clinical Recall",
        q: "At the default 0.50 probability threshold, the classifier flags 30 out of 50 stroke cases (60% recall). Calibrating the decision threshold down to <b>0.22</b> enables the model to detect <b>46 out of 50 stroke cases</b>. What is the new clinical Recall in <b>percent</b>?",
        answer: 92,
        tol: 0.5,
        hint: "Compute (46 / 50) × 100%.",
        explain: "(46 / 50) × 100% = 92.0% Recall. Lowering the threshold prioritizes catching life-threatening stroke events at the expense of a minor increase in false alerts."
      },
      {
        title: "SHAP Additive Log-Odds Attribution Sum",
        q: "A stroke risk model has baseline log-odds <b>φ_0 = −2.80</b>. For an admitted patient, SHAP local attributions are: Age: <b>+0.95</b>, Glucose: <b>+0.65</b>, Hypertension: <b>+0.40</b>, BMI: <b>−0.20</b>. According to the SHAP efficiency property <code>f(x) = φ_0 + Σ φ_i</code>, what is the final model log-odds output?",
        answer: -1,
        tol: 0.05,
        hint: "Add −2.80 + 0.95 + 0.65 + 0.40 − 0.20.",
        explain: "−2.80 + (0.95 + 0.65 + 0.40 − 0.20) = −2.80 + 1.80 = −1.00. The doctor can clearly see how each biomarker pushed the risk score upward."
      },
      {
        title: "Hospital Stroke Bed Triage Allocation",
        q: "A regional hospital has <b>24 high-dependency beds</b>. An alert threshold is chosen so that <b>120 suspected stroke patients</b> are flagged each month with a <b>20% Positive Predictive Value (Precision)</b>. Exactly how many true stroke cases will be admitted?",
        answer: 24,
        tol: 0,
        hint: "Multiply 120 by 0.20.",
        explain: "120 × 0.20 = 24 confirmed stroke patients admitted, matching the hospital's high-dependency unit bed capacity."
      }
    ]
  ],

  visuals: [
    /* Visual 0: Clinical Data Prep & SMOTE Imbalance */
    (ci, p, t) => {
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

    /* Visual 1: Serialization Engine: Pickle vs Joblib */
    (ci, p, t) => {
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

    /* Visual 2: FastAPI Async Event Loop & Pydantic Validation */
    (ci, p, t) => {
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

    /* Visual 3: Cloud Infrastructure: 5 NIST Characteristics & Sizing */
    (ci, p, t) => {
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

    /* Visual 4: Docker Multi-Stage Build & Layer Optimization */
    (ci, p, t) => {
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

    /* Visual 5: Canary Release Traffic Splitting */
    (ci, p, t) => {
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

    /* Visual 6: Quantization Precision & Inference Speedup */
    (ci, p, t) => {
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

    /* Visual 7: Observability & Population Stability Index (PSI) */
    (ci, p, t) => {
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

    /* Visual 8: Capstone: Uganda Referral Hospital Stroke Prediction & SHAP */
    (ci, p, t) => {
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
    }
  ],
  labs: [
    /* Lab 0: Clinical Feature Preparation, Scaler Leakage & Imbalance */
    {
      title: "Clinical Feature Preparation, Scaler Leakage & Imbalance Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Dataset Splitting & Preprocessing Gate</h3>
          <p class="small muted">Simulate the Uganda Referral Hospital stroke cohort. Toggle scaler leakage to observe artificial validation inflation versus true production generalization.</p>
          <div class="field"><div class="range-head"><span>Patient Cohort Size (N)</span><output id="ai0-no">3000</output></div><input type="range" id="ai0-n" min="1000" max="8000" step="500" value="3000"></div>
          <div class="field"><div class="range-head"><span>Missing BMI Rate (%)</span><output id="ai0-mo">12</output></div><input type="range" id="ai0-m" min="2" max="30" step="1" value="12"></div>
          <div class="field"><div class="range-head"><span>Stroke Prevalence (%)</span><output id="ai0-po">5</output></div><input type="range" id="ai0-p" min="2" max="20" step="1" value="5"></div>
          <div class="row" style="margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai0-leak"> <b>Simulate Scaler Leakage</b> (Fit on full dataset)</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai0-smote" checked> <b>Apply SMOTE</b> (Train split only)</label>
          </div>
          <div class="stat-row" id="ai0-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Pipeline Validation & Clinical Metrics</h3>
          <p class="small muted">Compare naive baseline accuracy with clinical Recall and F2 score for early triage intervention.</p>
          <div class="result">
            <div class="k">Triage Performance Verdict</div>
            <div class="v" id="ai0-verdict"></div>
            <div class="s" id="ai0-sub"></div>
          </div>
          <div class="stat-row" id="ai0-metrics"></div>
          <pre class="code"><span class="c"># Safe production pipeline (zero leakage)</span>
pipeline = Pipeline([
  (<span class="s">"preprocessor"</span>, ColumnTransformer([
    (<span class="s">"num"</span>, Pipeline([
      (<span class="s">"imputer"</span>, SimpleImputer(strategy=<span class="s">"median"</span>)),
      (<span class="s">"scaler"</span>, StandardScaler())
    ]), [<span class="s">"age"</span>, <span class="s">"avg_glucose_level"</span>, <span class="s">"bmi"</span>]),
    (<span class="s">"cat"</span>, OneHotEncoder(handle_unknown=<span class="s">"ignore"</span>), [<span class="s">"work_type"</span>, <span class="s">"smoking_status"</span>])
  ])),
  (<span class="s">"classifier"</span>, XGBClassifier(scale_pos_weight=18.0))
])</pre>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const n = +$("ai0-n").value, m = +$("ai0-m").value, p = +$("ai0-p").value;
          const leak = $("ai0-leak").checked, smote = $("ai0-smote").checked;
          $("ai0-no").textContent = n.toLocaleString();
          $("ai0-mo").textContent = m + "%";
          $("ai0-po").textContent = p + "%";

          const strokeCount = Math.round(n * (p / 100));
          const nonStroke = n - strokeCount;
          const trainN = Math.round(n * 0.8);
          const testN = n - trainN;

          $("ai0-stats").innerHTML = [
            ["Stroke Cases (y=1)", strokeCount.toLocaleString()],
            ["Non-Stroke (y=0)", nonStroke.toLocaleString()],
            ["Train / Test", `${trainN} / ${testN}`],
            ["Missing BMI rows", Math.round(n * (m / 100)).toLocaleString()]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

          let recall = smote ? 0.86 : 0.44;
          let prec = smote ? 0.32 : 0.65;
          let acc = (100 - p) * 0.95;
          if (leak) {
            recall += 0.08;
            acc += 2.5;
          }
          recall = Math.min(0.98, recall);

          const f2 = (5 * prec * recall) / (4 * prec + recall);

          $("ai0-verdict").textContent = smote ? `Recall ${Math.round(recall * 100)}% · F2 Score ${f2.toFixed(2)}` : "High False Negatives! (Recall < 50%)";
          $("ai0-sub").textContent = leak
            ? "⚠️ WARNING: Scaler leakage detected! Validation scores are artificially inflated and will fail on unseen hospital arrivals."
            : "✓ Zero data leakage: preprocessor fitted exclusively on training fold.";

          $("ai0-metrics").innerHTML = [
            ["Clinical Recall", `${(recall * 100).toFixed(1)}%`],
            ["Precision", `${(prec * 100).toFixed(1)}%`],
            ["F2 Score (Recall-weighted)", f2.toFixed(3)],
            ["Apparent Accuracy", `${acc.toFixed(1)}%`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai0-n", "ai0-m", "ai0-p", "ai0-leak", "ai0-smote"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 1: Model Serialization Benchmark: Pickle vs Joblib */
    {
      title: "Model Serialization Benchmark: Pickle vs Joblib & Pipeline Packaging",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Model Complexity & Compression Controls</h3>
          <p class="small muted">Evaluate model serialization size, save latency, and RAM memory footprint across serialization formats.</p>
          <div class="field"><div class="range-head"><span>Ensemble Estimators (Trees)</span><output id="ai1-to">150</output></div><input type="range" id="ai1-t" min="20" max="600" step="20" value="150"></div>
          <div class="field"><div class="range-head"><span>Max Tree Depth</span><output id="ai1-do">12</output></div><input type="range" id="ai1-d" min="4" max="24" step="2" value="12"></div>
          <div class="field"><div class="range-head"><span>Compression Level (0=None, 9=Max)</span><output id="ai1-co">3</output></div><input type="range" id="ai1-c" min="0" max="9" step="1" value="3"></div>
          <div class="field">
            <span>Serialization Format</span>
            <select id="ai1-fmt" class="text-in">
              <option value="joblib" selected>joblib (SciPy Optimized + mmap)</option>
              <option value="joblib_lz4">joblib with LZ4 Compression</option>
              <option value="pickle">Standard Python pickle</option>
            </select>
          </div>
          <div class="stat-row" id="ai1-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Benchmark Metrics & Persistence Security</h3>
          <div class="result">
            <div class="k">Serialized Artifact Footprint</div>
            <div class="v" id="ai1-size"></div>
            <div class="s" id="ai1-ram"></div>
          </div>
          <div class="stat-row" id="ai1-metrics"></div>
          <div class="hint">
            <b>Security Rule:</b> Python unpickling executes constructor code in <code>__reduce__</code>. Never deserialize unknown model files from unauthenticated endpoints.
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const t = +$("ai1-t").value, d = +$("ai1-d").value, c = +$("ai1-c").value;
          const fmt = $("ai1-fmt").value;
          $("ai1-to").textContent = t;
          $("ai1-do").textContent = d;
          $("ai1-co").textContent = c;

          const rawMb = (t * Math.pow(2, Math.min(12, d)) * 32) / (1024 * 1024);
          let compRatio = 1.0;
          let saveSpeed = 1.0;
          if (fmt === "joblib") {
            compRatio = 1.0 / (1.2 + c * 0.35);
            saveSpeed = 1.1 + c * 0.15;
          } else if (fmt === "joblib_lz4") {
            compRatio = 1.0 / (1.4 + c * 0.4);
            saveSpeed = 0.8 + c * 0.08;
          } else {
            compRatio = 1.05;
            saveSpeed = 1.8;
          }

          const finalMb = Math.max(0.4, +(rawMb * compRatio).toFixed(2));
          const saveMs = Math.round(rawMb * 8 * saveSpeed);
          const loadMs = Math.round(saveMs * (fmt.includes("joblib") ? 0.35 : 0.85));

          $("ai1-size").textContent = `${finalMb} MB (${fmt})`;
          $("ai1-ram").textContent = fmt.includes("joblib")
            ? `Zero-copy mmap enabled · Read latency ~${loadMs} ms`
            : `Full RAM duplication per worker · Read latency ~${loadMs} ms`;

          $("ai1-stats").innerHTML = [
            ["Uncompressed Estimator", `${rawMb.toFixed(1)} MB`],
            ["Compression Ratio", `${(1 / compRatio).toFixed(1)}×`],
            ["Save Time", `${saveMs} ms`],
            ["Load Time", `${loadMs} ms`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

          $("ai1-metrics").innerHTML = [
            ["Memory Mapping", fmt.includes("joblib") ? "Enabled (mmap)" : "Disabled"],
            ["Pipeline Bundling", "Full Preprocessor"],
            ["Save Throughput", `${Math.round(finalMb / (saveMs / 1000))} MB/s`],
            ["Security Risk", "CVE-level if untrusted"]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai1-t", "ai1-d", "ai1-c", "ai1-fmt"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 2: FastAPI Model Serving & Pydantic Validation */
    {
      title: "FastAPI Model Serving, Pydantic Schema Validation & Latency Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · FastAPI Live Request Tester</h3>
          <p class="small muted">Send sample clinical payloads to the simulated <code>/predict</code> endpoint and inspect Pydantic contract filtering.</p>
          <div class="field"><div class="range-head"><span>Inference Load (Queries Per Second)</span><output id="ai2-qo">60</output></div><input type="range" id="ai2-q" min="10" max="300" step="10" value="60"></div>
          <div class="field"><div class="range-head"><span>Simulated Worker Concurrency</span><output id="ai2-co">4</output></div><input type="range" id="ai2-c" min="1" max="16" step="1" value="4"></div>
          <div class="field">
            <span>Sample Patient Request Payload</span>
            <select id="ai2-payload" class="text-in">
              <option value="valid">Valid Patient (Age 64, Glucose 140, BMI 28.4)</option>
              <option value="invalid_age">Invalid Age (-12) ──▶ Expect HTTP 422</option>
              <option value="invalid_bmi">Malformed BMI ("obese" string instead of float)</option>
              <option value="missing_glucose">Missing Required Field (avg_glucose_level)</option>
            </select>
          </div>
          <button class="btn btn-primary" id="ai2-send" style="width:100%">Dispatch Test Request</button>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Response Status & Little's Law Metrics</h3>
          <div class="result">
            <div class="k">Endpoint Status & Latency</div>
            <div class="v" id="ai2-res">HTTP 200 OK (8.2 ms)</div>
            <div class="s" id="ai2-sub">Pydantic validation passed · Model prediction returned</div>
          </div>
          <div class="stat-row" id="ai2-stats"></div>
          <pre class="code" id="ai2-json" style="max-height:140px;overflow:auto"></pre>
        </div>
      </div>`,
      init() {
        const sendReq = () => {
          const qps = +$("ai2-q").value, conc = +$("ai2-c").value;
          const pType = $("ai2-payload").value;
          $("ai2-qo").textContent = qps;
          $("ai2-co").textContent = conc;

          const baseLat = Math.max(4, Math.round(6 + (qps / conc) * 0.45));
          const p99 = Math.round(baseLat * 1.8);

          if (pType === "valid") {
            $("ai2-res").textContent = `HTTP 200 OK (${baseLat} ms)`;
            $("ai2-res").style.color = "#4f9a6a";
            $("ai2-sub").textContent = "Pydantic contract satisfied · Inference completed successfully";
            $("ai2-json").textContent = JSON.stringify({
              status: "success",
              patient_id: "UG-7491",
              stroke_probability: 0.384,
              triage_action: "Referral to Chronic Care Clinic",
              risk_tier: "HIGH"
            }, null, 2);
          } else {
            $("ai2-res").textContent = "HTTP 422 Unprocessable Entity (1.1 ms)";
            $("ai2-res").style.color = "#c1351e";
            $("ai2-sub").textContent = "Rejected at network boundary: invalid data contract caught by Pydantic schema";
            let errDetail = [];
            if (pType === "invalid_age") errDetail = [{ loc: ["body", "age"], msg: "Input should be greater than 0", type: "greater_than" }];
            else if (pType === "invalid_bmi") errDetail = [{ loc: ["body", "bmi"], msg: "Input should be a valid number, unable to parse string as float", type: "float_parsing" }];
            else errDetail = [{ loc: ["body", "avg_glucose_level"], msg: "Field required", type: "missing" }];
            $("ai2-json").textContent = JSON.stringify({ detail: errDetail }, null, 2);
          }

          $("ai2-stats").innerHTML = [
            ["Mean Latency", `${baseLat} ms`],
            ["P99 Latency", `${p99} ms`],
            ["Effective Throughput", `${Math.min(qps, conc * 45)} req/s`],
            ["Queue Utilization", `${Math.min(100, Math.round((qps / (conc * 40)) * 100))}%`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        $("ai2-send").onclick = sendReq;
        ["ai2-q", "ai2-payload"].forEach(id => $(id).oninput = $(id).onchange = sendReq);
        sendReq();
      }
    },

    /* Lab 3: Cloud Infrastructure & Spot Cost Sizing */
    {
      title: "Cloud ML Sizing, Spot Cost & Latency Architecture Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Cloud Compute & Region Configuration</h3>
          <p class="small muted">Size compute infrastructure for Uganda clinical inference and model retraining workloads.</p>
          <div class="field">
            <span>Hardware Architecture</span>
            <select id="ai3-hw" class="text-in">
              <option value="cpu2">Standard CPU (2 vCPU, 4GB RAM) — $0.04/hr</option>
              <option value="cpu8" selected>Heavy CPU (8 vCPU, 16GB RAM) — $0.16/hr</option>
              <option value="t4">Nvidia T4 GPU (16GB VRAM) — $0.60/hr</option>
              <option value="a100">Nvidia A100 GPU (40GB VRAM) — $3.20/hr</option>
            </select>
          </div>
          <div class="field">
            <span>Cloud Region Deployment</span>
            <select id="ai3-reg" class="text-in">
              <option value="local">Local On-Premises Edge (Kampala) — 8ms latency</option>
              <option value="af_south" selected>AWS Cape Town (af-south-1) — 42ms latency</option>
              <option value="eu_west">Render / AWS Ireland (eu-west-1) — 135ms latency</option>
            </select>
          </div>
          <div class="field"><div class="range-head"><span>Monthly Request Volume (Thousands)</span><output id="ai3-vo">200</output></div><input type="range" id="ai3-v" min="20" max="2000" step="50" value="200"></div>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai3-spot" checked> <b>Use Spot / Preemptible VM</b> (Up to 75% savings for retraining)</label>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Monthly Sizing & Latency Breakdown</h3>
          <div class="result">
            <div class="k">Estimated Monthly Cloud Spend</div>
            <div class="v" id="ai3-cost"></div>
            <div class="s" id="ai3-lat"></div>
          </div>
          <div class="stat-row" id="ai3-stats"></div>
          <div class="hint">
            <b>African Context:</b> For real-time clinical triage at referral hospitals, hosting model endpoints in <code>af-south-1</code> or regional edge caches saves ~90ms network round-trip time compared to European data centers.
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const hw = $("ai3-hw").value, reg = $("ai3-reg").value;
          const volK = +$("ai3-v").value, spot = $("ai3-spot").checked;
          $("ai3-vo").textContent = `${volK.toLocaleString()}k`;

          const rates = { cpu2: 0.04, cpu8: 0.16, t4: 0.60, a100: 3.20 };
          const netLats = { local: 8, af_south: 42, eu_west: 135 };
          const computeLats = { cpu2: 24, cpu8: 9, t4: 3.2, a100: 1.1 };

          let hourly = rates[hw];
          if (spot) hourly *= 0.28;
          const monthly = Math.round(hourly * 730);
          const totalLat = netLats[reg] + computeLats[hw];

          $("ai3-cost").textContent = `$${monthly.toLocaleString()} / month`;
          $("ai3-lat").textContent = `End-to-End Latency: ${totalLat.toFixed(1)} ms (${netLats[reg]}ms network + ${computeLats[hw]}ms compute)`;

          $("ai3-stats").innerHTML = [
            ["Hourly Rate", `$${hourly.toFixed(3)}/hr`],
            ["Spot Discount", spot ? "72% Saved" : "0% (On-Demand)"],
            ["Cost per 10k Reqs", `$${((monthly / (volK * 1000)) * 10000).toFixed(2)}`],
            ["Network Distance", reg === "local" ? "Kampala LAN" : reg === "af_south" ? "South Africa" : "Europe"]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai3-hw", "ai3-reg", "ai3-v", "ai3-spot"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 4: Docker Multi-Stage Optimization */
    {
      title: "Docker Multi-Stage Build & Image Layer Optimizer",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Dockerfile Layer Strategy</h3>
          <p class="small muted">Configure container build options to eliminate compiler vulnerabilities and optimize pull latency.</p>
          <div class="field">
            <span>Base Image Selection</span>
            <select id="ai4-base" class="text-in">
              <option value="slim" selected>python:3.11-slim (Recommended)</option>
              <option value="ubuntu">ubuntu:22.04 (Full OS)</option>
              <option value="alpine">alpine:3.19 (musl libc - slow wheels)</option>
            </select>
          </div>
          <div class="row" style="margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai4-multi" checked> <b>Multi-Stage Build</b></label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai4-rootless" checked> <b>Run as Non-Root (appuser)</b></label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai4-cache" checked> <b>Cache requirements.txt Layer</b></label>
          </div>
          <div class="stat-row" id="ai4-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Security Score & Size Audit</h3>
          <div class="result">
            <div class="k">Final Container Image Size</div>
            <div class="v" id="ai4-size"></div>
            <div class="s" id="ai4-sub"></div>
          </div>
          <div class="stat-row" id="ai4-metrics"></div>
          <pre class="code"><span class="c"># Production multi-stage Dockerfile</span>
<span class="k">FROM</span> python:3.11-slim <span class="k">AS</span> builder
<span class="k">WORKDIR</span> /app
<span class="k">RUN</span> apt-get update && apt-get install -y --no-install-recommends gcc
<span class="k">COPY</span> requirements.txt .
<span class="k">RUN</span> pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

<span class="k">FROM</span> python:3.11-slim <span class="k">AS</span> runner
<span class="k">RUN</span> useradd -u 1001 -m appuser
<span class="k">WORKDIR</span> /app
<span class="k">COPY</span> --from=builder /app/wheels /wheels
<span class="k">RUN</span> pip install --no-index --find-links=/wheels /wheels/* && rm -rf /wheels
<span class="k">COPY</span> . .
<span class="k">USER</span> appuser
<span class="k">CMD</span> [<span class="s">"uvicorn"</span>, <span class="s">"main:app"</span>, <span class="s">"--host"</span>, <span class="s">"0.0.0.0"</span>, <span class="s">"--port"</span>, <span class="s">"8000"</span>]</pre>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const base = $("ai4-base").value;
          const multi = $("ai4-multi").checked, rootless = $("ai4-rootless").checked, cache = $("ai4-cache").checked;

          let baseMb = base === "slim" ? 140 : base === "ubuntu" ? 850 : 60;
          let toolMb = multi ? 15 : 420;
          let appMb = 45;
          let totalMb = baseMb + toolMb + appMb;
          let buildTime = cache ? 18 : 110;
          if (base === "alpine") buildTime += 240;

          $("ai4-size").textContent = `${totalMb} MB`;
          $("ai4-sub").textContent = rootless
            ? "✓ Hardened: Non-root execution blocks host privilege escalation"
            : "⚠️ HIGH RISK: Running as root inside container violates CIS Docker benchmarks";

          $("ai4-stats").innerHTML = [
            ["Base OS Layer", `${baseMb} MB`],
            ["Build Tools Retained", multi ? "0 MB (Purged)" : `${toolMb} MB (Compilers!)`],
            ["Code & Model Weights", `${appMb} MB`],
            ["Build Time", `${buildTime}s`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

          $("ai4-metrics").innerHTML = [
            ["Security Grade", rootless && multi ? "Grade A+" : multi ? "Grade B" : "Grade D (Bloated)"],
            ["Layer Caching", cache ? "Optimized" : "Rebuilding every line"],
            ["Cold Pull Latency", `${(totalMb / 25).toFixed(1)}s (at 200 Mbps)`],
            ["Compilers in Image", multi ? "None (Clean)" : "gcc / g++ exposed"]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai4-base", "ai4-multi", "ai4-rootless", "ai4-cache"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 5: Canary Release & Traffic Splitting */
    {
      title: "Canary Release & Traffic Splitting Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Ingress Routing & Traffic Controls</h3>
          <p class="small muted">Direct live hospital traffic between Stable (v1) and Canary (v2). Trigger automated rollback when Canary error budget is exhausted.</p>
          <div class="field"><div class="range-head"><span>Canary Traffic Allocation (%)</span><output id="ai5-co">10</output></div><input type="range" id="ai5-c" min="0" max="100" step="5" value="10"></div>
          <div class="field"><div class="range-head"><span>Incoming Traffic (QPS)</span><output id="ai5-qo">120</output></div><input type="range" id="ai5-q" min="20" max="500" step="20" value="120"></div>
          <div class="field"><div class="range-head"><span>Simulated v2 Error Rate (%)</span><output id="ai5-eo">0.5</output></div><input type="range" id="ai5-e" min="0" max="10" step="0.5" value="0.5"></div>
          <div class="stat-row" id="ai5-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Circuit Breaker & Error Budget Status</h3>
          <div class="result">
            <div class="k">Deployment Health & Rollback Gate</div>
            <div class="v" id="ai5-gate">CANARY HEALTHY</div>
            <div class="s" id="ai5-sub">Error budget intact · Traffic progressing safely</div>
          </div>
          <div class="stat-row" id="ai5-metrics"></div>
          <div class="hint">
            <b>Rollback Policy:</b> If Canary HTTP 5xx error rate breaches 1.5%, ingress immediately resets Canary traffic to 0% to prevent patient triage interruptions.
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const canary = +$("ai5-c").value, qps = +$("ai5-q").value, err = +$("ai5-e").value;
          $("ai5-co").textContent = canary + "%";
          $("ai5-qo").textContent = qps;
          $("ai5-eo").textContent = err + "%";

          const v1Qps = Math.round(qps * (1 - canary / 100));
          const v2Qps = qps - v1Qps;
          const v2Errors = Math.round(v2Qps * (err / 100));
          const breached = err >= 1.5 && canary > 0;

          if (breached) {
            $("ai5-gate").textContent = "CIRCUIT BREAKER TRIGGERED";
            $("ai5-gate").style.color = "#c1351e";
            $("ai5-sub").textContent = `Error rate (${err}%) breached 1.5% threshold! Automated rollback initiated: traffic dropping to 0%.`;
          } else {
            $("ai5-gate").textContent = canary === 0 ? "100% STABLE (No Canary Active)" : "CANARY HEALTHY";
            $("ai5-gate").style.color = "#4f9a6a";
            $("ai5-sub").textContent = `Canary handling ${v2Qps} QPS safely within allowable SLA boundaries.`;
          }

          $("ai5-stats").innerHTML = [
            ["Stable v1 Traffic", `${v1Qps} QPS (${100 - canary}%)`],
            ["Canary v2 Traffic", `${v2Qps} QPS (${canary}%)`],
            ["Canary 5xx Errors", `${v2Errors} errors/s`],
            ["Total Ingress", `${qps} req/s`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

          $("ai5-metrics").innerHTML = [
            ["Error Budget Used", `${Math.min(100, Math.round((err / 1.5) * 100))}%`],
            ["Max Allowable 5xx", "1.5%"],
            ["Automated Action", breached ? "Instant Rollback" : "Continue Rollout"],
            ["Customer Impact", breached ? "Protected by Canary Split" : "Zero Errors Observed"]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai5-c", "ai5-q", "ai5-e"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 6: ONNX & INT8 Quantization Speedup */
    {
      title: "ONNX & INT8 Quantization Speedup Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Precision & Runtime Parameters</h3>
          <p class="small muted">Compare standard 32-bit floating point models with post-training INT8 quantization and ONNX runtime acceleration.</p>
          <div class="field"><div class="range-head"><span>Model Parameter Count (Millions)</span><output id="ai6-po">25</output></div><input type="range" id="ai6-p" min="5" max="100" step="5" value="25"></div>
          <div class="field">
            <span>Quantization Precision</span>
            <select id="ai6-prec" class="text-in">
              <option value="fp32">FP32 (Standard 32-bit Float - Baseline)</option>
              <option value="fp16">FP16 (Half-precision 16-bit Float)</option>
              <option value="int8" selected>INT8 (8-bit Quantized Integer - 4x smaller)</option>
            </select>
          </div>
          <div class="row" style="margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai6-onnx" checked> <b>Use ONNX Runtime Engine</b> (C++ execution)</label>
          </div>
          <div class="stat-row" id="ai6-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · Latency & Memory Footprint Metrics</h3>
          <div class="result">
            <div class="k">Inference Performance Verdict</div>
            <div class="v" id="ai6-res"></div>
            <div class="s" id="ai6-sub"></div>
          </div>
          <div class="stat-row" id="ai6-metrics"></div>
          <div class="hint">
            <b>Hardware Note:</b> INT8 utilizes hardware AVX-512 VNNI vector instructions on x86 CPUs, achieving 3× to 4× throughput speedup for single-patient triage lookups.
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const p = +$("ai6-p").value, prec = $("ai6-prec").value;
          const onnx = $("ai6-onnx").checked;
          $("ai6-po").textContent = `${p}M`;

          const bytesPerParam = prec === "fp32" ? 4 : prec === "fp16" ? 2 : 1;
          const memMb = Math.round(p * bytesPerParam);

          let baseLat = p * 1.2;
          if (prec === "fp16") baseLat *= 0.65;
          if (prec === "int8") baseLat *= 0.28;
          if (onnx) baseLat *= 0.6;
          const latMs = Math.max(1.2, +baseLat.toFixed(1));

          const speedup = +( (p * 1.2) / latMs ).toFixed(1);

          $("ai6-res").textContent = `${latMs} ms (${speedup}× faster)`;
          $("ai6-sub").textContent = `Memory: ${memMb} MB · Reduction: ${( (1 - bytesPerParam/4)*100 ).toFixed(0)}% saved`;

          $("ai6-stats").innerHTML = [
            ["Weight Size", `${memMb} MB`],
            ["Bytes per Weight", `${bytesPerParam} byte(s)`],
            ["Estimated Latency", `${latMs} ms`],
            ["Inference Engine", onnx ? "ONNX Runtime (C++)" : "Python Default"]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");

          $("ai6-metrics").innerHTML = [
            ["Throughput", `${Math.round(1000 / latMs)} samples/sec`],
            ["ROC-AUC Delta", prec === "int8" ? "-0.002 (Preserved)" : "0.000"],
            ["SIMD Acceleration", prec === "int8" ? "AVX-512 / VNNI Active" : "Standard FPU"],
            ["RAM Bus Traffic", `${(bytesPerParam * 25).toFixed(0)}% of Baseline`]
          ].map(([a, b]) => `<div class="stat"><div class="k">${a}</div><div class="v">${b}</div></div>`).join("");
        };
        ["ai6-p", "ai6-prec", "ai6-onnx"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 7: Population Stability Index (PSI) Drift */
    {
      title: "Population Stability Index (PSI) & Covariate Drift Detector",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Production Feature Distribution Shifter</h3>
          <p class="small muted">Simulate covariate shift in patient features (age, glucose) between baseline training data and production hospital intake.</p>
          <div class="field"><div class="range-head"><span>Age Mean Shift (Years)</span><output id="ai7-ao">0</output></div><input type="range" id="ai7-a" min="0" max="25" step="1" value="0"></div>
          <div class="field"><div class="range-head"><span>Glucose Mean Shift (mg/dL)</span><output id="ai7-go">0</output></div><input type="range" id="ai7-g" min="0" max="60" step="2" value="0"></div>
          <div class="field"><div class="range-head"><span>Production Inference Window (Patients)</span><output id="ai7-wo">1000</output></div><input type="range" id="ai7-w" min="200" max="3000" step="200" value="1000"></div>
          <div class="stat-row" id="ai7-stats"></div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · PSI Drift Metric & Retraining Trigger</h3>
          <div class="result">
            <div class="k">Population Stability Index (PSI)</div>
            <div class="v" id="ai7-psi">0.024</div>
            <div class="s" id="ai7-status">Distribution Stable · Model healthy in production</div>
          </div>
          <div class="stat-row" id="ai7-bins"></div>
          <div class="hint">
            <b>Standard Thresholds:</b> PSI &lt; 0.10: Stable | 0.10 ≤ PSI &lt; 0.25: Moderate shift | PSI ≥ 0.25: Severe drift (Trigger automated Airflow retraining).
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const a = +$("ai7-a").value, g = +$("ai7-g").value, w = +$("ai7-w").value;
          $("ai7-ao").textContent = `+${a} yrs`;
          $("ai7-go").textContent = `+${g} mg/dL`;
          $("ai7-wo").textContent = w.toLocaleString();

          const shiftFactor = (a / 25) * 0.22 + (g / 60) * 0.26;
          const psi = +(0.015 + shiftFactor * 1.1).toFixed(3);

          $("ai7-psi").textContent = `PSI = ${psi}`;
          if (psi < 0.10) {
            $("ai7-psi").style.color = "#4f9a6a";
            $("ai7-status").textContent = "✓ Stable Distribution: Production patient attributes match training baseline.";
          } else if (psi < 0.25) {
            $("ai7-psi").style.color = "#d9a441";
            $("ai7-status").textContent = "⚠ Moderate Drift Detected: Schedule feature recalibration.";
          } else {
            $("ai7-psi").style.color = "#c1351e";
            $("ai7-status").textContent = "🚨 SEVERE DRIFT (PSI ≥ 0.25): Automated pipeline triggered! Model retraining required.";
          }

          $("ai7-stats").innerHTML = [
            ["Baseline Population", "5,110 Patients"],
            ["Production Batch", `${w} Patients`],
            ["Age Shift", `+${a} years`],
            ["Glucose Shift", `+${g} mg/dL`]
          ].map(([x, y]) => `<div class="stat"><div class="k">${x}</div><div class="v">${y}</div></div>`).join("");

          $("ai7-bins").innerHTML = [
            ["Age PSI Component", (psi * 0.45).toFixed(3)],
            ["Glucose PSI Component", (psi * 0.55).toFixed(3)],
            ["Action Trigger", psi >= 0.25 ? "Retrain Now" : psi >= 0.1 ? "Flag for Review" : "Pass"],
            ["Statistical Significance", psi >= 0.1 ? "p < 0.001" : "p = 0.42"]
          ].map(([x, y]) => `<div class="stat"><div class="k">${x}</div><div class="v">${y}</div></div>`).join("");
        };
        ["ai7-a", "ai7-g", "ai7-w"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    },

    /* Lab 8: Clinical Stroke Risk, Threshold Calibration & SHAP Attribution */
    {
      title: "Clinical Stroke Risk, Threshold Calibration & SHAP Feature Attribution Simulator",
      html: () => `
      <div class="lab-grid">
        <div class="card card-pad stack" style="gap:14px">
          <h3>1 · Patient Diagnostic Profile (Referral Triage)</h3>
          <p class="small muted">Configure an incoming patient's clinical markers and calibrate the hospital classification threshold.</p>
          <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
            <label class="field"><span>Age (Years)</span><input type="number" id="ai8-age" value="67" min="18" max="100"></label>
            <label class="field"><span>Avg Glucose (mg/dL)</span><input type="number" id="ai8-glu" value="228" min="50" max="350"></label>
            <label class="field"><span>BMI (kg/m²)</span><input type="number" id="ai8-bmi" value="34.2" min="15" max="60" step="0.1"></label>
          </div>
          <div class="row" style="margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai8-hyp" checked> <b>Hypertension</b></label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" id="ai8-hd" checked> <b>Heart Disease</b></label>
          </div>
          <div class="field" style="margin-top:6px">
            <div class="range-head"><span>Clinical Decision Threshold</span><output id="ai8-to">0.22</output></div>
            <input type="range" id="ai8-t" min="0.05" max="0.80" step="0.01" value="0.22">
          </div>
        </div>
        <div class="card card-pad stack" style="gap:14px">
          <h3>2 · SHAP Local Feature Attribution & Referral Triage</h3>
          <div class="result">
            <div class="k">Predicted Stroke Probability vs Threshold</div>
            <div class="v" id="ai8-prob">48.2% (HIGH RISK)</div>
            <div class="s" id="ai8-action">Enroll in Chronic Care Clinic (MOH June 2025 Protocol)</div>
          </div>
          <div id="ai8-shap" class="stack" style="gap:6px"></div>
          <div class="hint">
            <b>Explainable AI:</b> Base hospital risk is 4.9%. SHAP values explain exactly how each clinical attribute shifted this patient's prediction above the decision threshold.
          </div>
        </div>
      </div>`,
      init() {
        const upd = () => {
          const age = +$("ai8-age").value || 50;
          const glu = +$("ai8-glu").value || 100;
          const bmi = +$("ai8-bmi").value || 25;
          const hyp = $("ai8-hyp").checked, hd = $("ai8-hd").checked;
          const thresh = +$("ai8-t").value;
          $("ai8-to").textContent = thresh.toFixed(2);

          const baseLogit = -2.95;
          const ageLogit = (age - 50) * 0.055;
          const gluLogit = (glu - 100) * 0.012;
          const bmiLogit = (bmi - 25) * 0.035;
          const hypLogit = hyp ? 0.85 : 0;
          const hdLogit = hd ? 0.65 : 0;

          const totalLogit = baseLogit + ageLogit + gluLogit + bmiLogit + hypLogit + hdLogit;
          const prob = 1 / (1 + Math.exp(-totalLogit));
          const probPct = +(prob * 100).toFixed(1);

          const isHigh = prob >= thresh;

          $("ai8-prob").textContent = `${probPct}% (${isHigh ? "HIGH RISK" : "STANDARD RISK"})`;
          $("ai8-prob").style.color = isHigh ? "#c1351e" : "#4f9a6a";
          $("ai8-action").textContent = isHigh
            ? `P (${probPct}%) ≥ Threshold (${(thresh*100).toFixed(0)}%) ──▶ Immediate referral to chronic clinic`
            : `P (${probPct}%) < Threshold (${(thresh*100).toFixed(0)}%) ──▶ Routine preventative follow-up`;

          const factors = [
            ["Patient Age", +(ageLogit * 12).toFixed(1)],
            ["Hypertension", +(hypLogit * 14).toFixed(1)],
            ["Average Blood Glucose", +(gluLogit * 10).toFixed(1)],
            ["Heart Disease", +(hdLogit * 11).toFixed(1)],
            ["Body Mass Index (BMI)", +(bmiLogit * 8).toFixed(1)]
          ].sort((a, b) => b[1] - a[1]);

          $("ai8-shap").innerHTML = `
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--muted)">SHAP Feature Risk Impact</div>` +
            factors.map(([name, impact]) => {
              const pos = impact >= 0;
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding:4px 8px;border-radius:6px;background:${pos ? 'rgba(193,53,30,0.08)' : 'rgba(79,154,106,0.08)'}">
                  <span><b>${name}</b></span>
                  <span class="mono" style="font-weight:600;color:${pos ? '#c1351e' : '#4f9a6a'}">${pos ? '+' : ''}${impact}%</span>
                </div>`;
            }).join("");
        };
        ["ai8-age", "ai8-glu", "ai8-bmi", "ai8-hyp", "ai8-hd", "ai8-t"].forEach(id => $(id).oninput = $(id).onchange = upd);
        upd();
      }
    }
  ]

};

window.COURSE_AI.syllabus.forEach((s, i) => {
  s.id = i;
  s.badge = `Module ${i + 1}`;
  s.duration = s.captions[s.captions.length - 1].time + 22;
});
