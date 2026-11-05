/* =====================================================================
   COURSE 1: COMPUTER VISION & DEEP LEARNING (CSC3104)
   ===================================================================== */
window.COURSE_CV = {
  id: "cv",
  code: "CSC3104",
  mark: "CV",
  name: "DeepVision",
  subtitle: "Computer Vision & Deep Learning · oral exam & lab prep",
  examTitle: "Ten minutes, one Computer Vision examiner",
  syllabus: [
    {
      title: "Images as Data",
      subtitle: "Represent, inspect & transform image inputs",
      checkpointTime: 40,
      captions: [
        { time: 0, text: "To a computer, an image is not a picture — it is a grid of numbers. A colour image is a 3D tensor of shape height × width × channels, and each value is usually an integer from 0 (dark) to 255 (bright)." },
        { time: 15, text: "RGB channels are strongly correlated: a shadow lowers red, green and blue together. Converting to HSV separates colour (hue, saturation) from brightness (value), which helps when lighting changes." },
        { time: 30, text: "Before training we normalise: scale pixels to 0–1, then subtract a mean and divide by a standard deviation per channel. Centred, similarly-scaled inputs make gradient descent far more stable." },
        { time: 40, text: "Checkpoint: why do we normalise with the ImageNet mean and standard deviation when using a pretrained network?" },
        { time: 60, text: "Classic filters are just small grids of weights. A 3×3 Sobel kernel subtracts left pixels from right pixels, so it lights up wherever intensity changes sharply — an edge." },
        { time: 80, text: "Data augmentation — random crops, flips, colour jitter — creates new training views of the same image. It acts as a regulariser and teaches invariance to things that shouldn't change the label." },
        { time: 98, text: "Not every camera makes frames. Event cameras fire per-pixel events whenever brightness changes, with microsecond timing — no motion blur and huge dynamic range." }
      ],
      checkpoint: {
        question: "Why do we normalise image pixels using the ImageNet mean and standard deviation before feeding them into a pretrained CNN?",
        hint: "Think: what distribution did the pretrained weights see? What happens to activations and gradients if the input scale is different?",
        keywords: ["distribution", "imagenet", "mean", "standard deviation", "pretrained", "scale", "gradient", "weights", "match", "centre", "center"],
        idealAnswer: "A pretrained network's weights were tuned on inputs normalised with ImageNet's per-channel mean and std. Normalising our images the same way puts them in the distribution the network expects, so early-layer activations sit in the range the filters were trained for. Mechanically, centring and scaling makes features comparable in magnitude, which keeps gradients well-behaved. If you skip it, the input distribution shifts and accuracy drops, or fine-tuning becomes unstable."
      },
      terms: [
        ["Tensor (H, W, C)", "A multi-dimensional array. PyTorch uses (C, H, W); NumPy/OpenCV use (H, W, C) — and OpenCV loads as BGR!"],
        ["Channel", "One 2D slice of the image, e.g. the red values. Grayscale has 1, RGB has 3."],
        ["Normalisation", "x′ = (x/255 − μ)/σ per channel. ImageNet μ ≈ (0.485, 0.456, 0.406), σ ≈ (0.229, 0.224, 0.225)."],
        ["Kernel / filter", "A small weight grid slid across the image; Sobel finds edges, Gaussian blurs."],
        ["Augmentation", "Random label-preserving transforms applied only at training time."]
      ],
      quiz: [
        { q: "A 224×224 RGB image is stored as uint8. How many numbers is that?", o: ["50,176", "150,528", "224", "672"], a: 1, e: "224 × 224 × 3 = 150,528 values, each 0–255." },
        { q: "Which augmentation is a BAD idea for digit recognition (MNIST)?", o: ["Small rotations", "Random crops", "Vertical flips", "Brightness jitter"], a: 2, e: "Flipping turns a 6 into a 9-like shape — it changes the label. Augmentations must preserve the label." }
      ],
      fact: { title: "Event cameras see in microseconds", desc: "Neuromorphic sensors (e.g. Prophesee, Sony IMX636) have no frame rate. Each pixel independently reports brightness changes with microsecond latency and >120 dB dynamic range — useful for drones, robotics and high-speed inspection where normal cameras blur." }
    },
    {
      title: "Convolutional Neural Networks",
      subtitle: "Understand convolution, pooling & feature maps",
      checkpointTime: 45,
      captions: [
        { time: 0, text: "Why not a plain fully connected network? Flattening a 224×224×3 image gives 150,528 inputs. Connect that to just 1,000 neurons and you already have 150 million weights — slow, and it overfits." },
        { time: 15, text: "CNNs use two smart assumptions, called inductive biases. Local connectivity: each neuron looks at a small patch. Parameter sharing: the same small kernel slides across the whole image." },
        { time: 30, text: "Sharing weights gives translation equivariance: if the cat moves 10 pixels right, its activation in the feature map also moves right. The detector works anywhere." },
        { time: 45, text: "Checkpoint: does max pooling have learnable parameters — and what is the difference between equivariance and invariance?" },
        { time: 62, text: "Max pooling keeps the largest value in each window, for example 2×2 with stride 2. It halves height and width, has zero learnable parameters, and gives a little invariance to small shifts." },
        { time: 82, text: "Stack layers and features build up: early layers find edges and colours, middle layers textures and patterns, deep layers object parts like eyes and wheels." },
        { time: 102, text: "Memorise the output size formula: output = floor((W − K + 2P) / S) + 1. For W = 32, K = 3, P = 1, S = 1 you get 32 — a ‘same’ convolution." }
      ],
      checkpoint: {
        question: "Does max pooling have any learnable parameters? And what is the difference between translation equivariance and translation invariance?",
        hint: "Pooling is a fixed rule. Equivariance: output shifts WITH the input. Invariance: output stays the SAME.",
        keywords: ["zero", "no parameters", "fixed", "maximum", "equivariant", "equivariance", "invariant", "invariance", "shift", "convolution", "pooling"],
        idealAnswer: "Max pooling has zero learnable parameters: it's a fixed operation that outputs the maximum in each window, used to downsample and cut computation. Convolution is translation equivariant — shift the input and the feature map shifts by the same amount. Pooling adds local translation invariance — small shifts inside a window don't change the output. The trade-off is lost precise position information, which hurts dense tasks like segmentation."
      },
      terms: [
        ["Receptive field", "The region of the input that affects one output neuron; grows with depth."],
        ["Stride", "How many pixels the kernel jumps each step. Stride 2 halves the size."],
        ["Padding", "Zeros added around the border so edges get processed and size can be kept."],
        ["Feature map", "The output of one filter across the image: ‘where is this pattern?’"],
        ["Parameters per conv", "(K·K·C_in + 1)·C_out — the +1 is the bias."]
      ],
      quiz: [
        { q: "A conv layer: 3×3 kernel, 64 input channels, 128 output channels, with bias. How many parameters?", o: ["1,152", "73,856", "8,192", "589,824"], a: 1, e: "(3·3·64 + 1)·128 = 577·128 = 73,856." },
        { q: "Input 64×64, kernel 5, padding 0, stride 1. Output size?", o: ["64", "62", "60", "59"], a: 2, e: "(64 − 5 + 0)/1 + 1 = 60." }
      ],
      fact: { title: "CNNs fought back: ConvNeXt", desc: "In 2022, Meta's ConvNeXt modernised a plain ResNet with transformer-era tricks — 7×7 depthwise convolutions, LayerNorm, GELU, fewer activations — and matched Swin Transformers on ImageNet without any self-attention. ConvNeXt V2 (2023) added masked-autoencoder pretraining." }
    },
    {
      title: "Training & Evaluation",
      subtitle: "Train, validate & diagnose classifier behaviour",
      checkpointTime: 50,
      captions: [
        { time: 0, text: "Training is a loop: forward pass to get predictions, compute a loss such as cross-entropy, backpropagate gradients, and update the weights with an optimiser like SGD or AdamW. Repeat for many epochs." },
        { time: 18, text: "Split data into train, validation and test. Tune on validation; touch test once at the end. Watch for leakage — for example, the same patient's scans in both train and test." },
        { time: 34, text: "Diagnose with curves. Training loss keeps falling but validation loss turns upward? The model is memorising — overfitting, high variance. Both stay high? Underfitting, high bias." },
        { time: 50, text: "Checkpoint: why does batch normalisation behave differently in training mode versus evaluation mode?" },
        { time: 70, text: "Fight overfitting with more or augmented data, dropout, weight decay, and early stopping — keep the weights from the epoch with the best validation loss." },
        { time: 90, text: "Accuracy lies on imbalanced data. If 99% of patients are healthy, a model that always says ‘healthy’ scores 99% and catches zero cancers." },
        { time: 106, text: "Use precision — of my positive predictions, how many were right — and recall — of real positives, how many did I find. F1 is their harmonic mean. Look at the confusion matrix." }
      ],
      checkpoint: {
        question: "Why does Batch Normalization behave differently during training versus evaluation mode?",
        hint: "Training: statistics from the current mini-batch. Evaluation: what does it use when there might be only one image?",
        keywords: ["mini-batch", "batch", "running", "moving average", "mean", "variance", "evaluation", "eval", "inference", "deterministic", "model.eval"],
        idealAnswer: "BatchNorm normalises activations using a mean and variance. In training it uses the statistics of the current mini-batch, and also updates running averages of them. In evaluation mode it uses those stored running averages instead, because at inference the batch may be a single image and predictions must be deterministic and independent of other samples. Forgetting model.eval() is a classic bug: outputs depend on the batch and accuracy drops."
      },
      terms: [
        ["Epoch", "One full pass over the training set."],
        ["Overfitting", "Train performance ≫ validation performance; the model memorised noise."],
        ["Precision", "TP / (TP + FP) — how trustworthy a positive prediction is."],
        ["Recall", "TP / (TP + FN) — how many real positives were found."],
        ["Data leakage", "Test information sneaking into training, making scores unrealistically high."]
      ],
      quiz: [
        { q: "Train loss 0.02, validation loss 1.9 and rising. Best first fix?", o: ["Train longer", "Bigger model", "More augmentation / regularisation", "Higher learning rate"], a: 2, e: "That's overfitting. Add data/augmentation, dropout, weight decay or stop early." },
        { q: "Cancer screening: what matters most if missing a cancer is very costly?", o: ["Precision", "Recall", "Accuracy", "Training loss"], a: 1, e: "Missed cancers are false negatives; recall = TP/(TP+FN) measures how many you catch." }
      ],
      fact: { title: "Soft labels beat hard ones", desc: "Mixup blends two images and their labels; CutMix pastes a patch of one image onto another and mixes labels by area (e.g. 0.7 cat, 0.3 dog). Combined with label smoothing, these are standard in modern ImageNet training recipes and reduce over-confident predictions." }
    },
    {
      title: "Transfer Learning",
      subtitle: "Adapt pretrained models to a new problem",
      checkpointTime: 45,
      captions: [
        { time: 0, text: "Training a big vision model from scratch needs millions of labelled images. Transfer learning reuses a network already trained on a large dataset like ImageNet, and adapts it to your task." },
        { time: 18, text: "Why it works: early layers learn general things — edges, colours, textures — that are useful for almost any images. Only the last layers are specific to the original 1,000 classes." },
        { time: 32, text: "Small dataset similar to ImageNet? Freeze the backbone — set requires_grad to False — and train only a new classification head. This is called a linear probe or feature extraction." },
        { time: 45, text: "Checkpoint: what is catastrophic forgetting, and when should you freeze the backbone versus fine-tune everything?" },
        { time: 64, text: "Catastrophic forgetting: fine-tune with a large learning rate and big, noisy gradients from the new task overwrite the useful pretrained features." },
        { time: 84, text: "So fine-tune gently: small learning rates, often smaller for early layers and larger for the head — discriminative learning rates — and unfreeze from the top down." },
        { time: 104, text: "Today's backbones are foundation models: self-supervised models like DINOv2 learn features so general they work for classification, segmentation and depth with only a light head." }
      ],
      checkpoint: {
        question: "What is catastrophic forgetting during fine-tuning, and under what dataset conditions would you freeze the backbone versus fine-tune the whole network?",
        hint: "Small + similar data → freeze. Large or very different data → fine-tune, but with a small learning rate.",
        keywords: ["catastrophic", "forgetting", "overwrite", "freeze", "backbone", "small", "large", "learning rate", "overfitting", "similar", "different", "head"],
        idealAnswer: "Catastrophic forgetting is when fine-tuning with large updates overwrites the pretrained weights, destroying the general features that made transfer useful. If the target dataset is small and similar to the source, freeze the backbone and train only a new head — fewer trainable parameters means less overfitting. If the dataset is large or quite different (e.g. medical images), fine-tune more layers but with a small, often layer-wise learning rate. The trade-off is adaptation versus stability."
      },
      terms: [
        ["Backbone", "The pretrained feature extractor (e.g. ResNet-50 without its final layer)."],
        ["Head", "The new task-specific layer(s) on top, e.g. Linear(2048 → num_classes)."],
        ["Linear probe", "Freeze everything; train only a linear classifier on the features."],
        ["Fine-tuning", "Continue training some or all pretrained layers on the new data."],
        ["Domain shift", "Source and target images look different (photos vs X-rays)."]
      ],
      quiz: [
        { q: "You have 300 labelled bird photos. Best starting strategy?", o: ["Train ResNet-50 from scratch", "Freeze backbone, train new head", "Fine-tune all layers at LR 0.1", "Remove all pretrained layers"], a: 1, e: "Tiny dataset, similar domain (natural photos): freeze the backbone and train the head." },
        { q: "Why use a smaller learning rate for early layers?", o: ["They are slower to compute", "Their general features are already good", "They have no gradients", "To speed up training"], a: 1, e: "Early layers hold generic edges/textures — change them gently to avoid forgetting." }
      ],
      fact: { title: "DINOv2 → DINOv3", desc: "Meta's DINOv2 (2023) learned from 142M curated images with no labels at all; its features support segmentation and depth with simple linear heads. DINOv3 (2025) scaled self-supervised training to about 1.7 billion images and a 7-billion-parameter model." }
    },
    {
      title: "Object Detection",
      subtitle: "Find object classes & locations",
      checkpointTime: 55,
      captions: [
        { time: 0, text: "Classification asks ‘what is in the image?’ Detection asks ‘what, and where?’ — for every object it outputs a class, a confidence score, and a bounding box (x, y, width, height)." },
        { time: 18, text: "Two-stage detectors like Faster R-CNN first propose candidate regions with a Region Proposal Network, then classify and refine each one. Accurate, but slower." },
        { time: 36, text: "One-stage detectors like YOLO predict boxes and classes in a single pass over a grid of cells. Very fast — the standard choice for real-time video." },
        { time: 55, text: "Checkpoint: explain Non-Maximum Suppression step by step, and define IoU." },
        { time: 75, text: "IoU — intersection over union — is the overlap area divided by the combined area of two boxes. 1 means identical, 0 means no overlap. IoU ≥ 0.5 is a common ‘correct detection’ threshold." },
        { time: 95, text: "Detectors fire many overlapping boxes on one object. NMS sorts boxes by confidence, keeps the best, deletes any remaining box overlapping it above an IoU threshold, and repeats." },
        { time: 115, text: "Detection is evaluated with mean Average Precision, mAP. And one-stage detectors face extreme imbalance — most anchors are background — which focal loss fixes by down-weighting easy examples." }
      ],
      checkpoint: {
        question: "Walk me through how Non-Maximum Suppression (NMS) works, and explain why it is necessary in object detection.",
        hint: "Duplicates → sort by confidence → keep top box → compute IoU with the rest → suppress above threshold → repeat.",
        keywords: ["duplicate", "overlap", "confidence", "sort", "highest", "iou", "intersection over union", "threshold", "suppress", "remove", "repeat", "greedy"],
        idealAnswer: "Detectors output many overlapping boxes for the same object, so NMS removes the duplicates. First drop boxes below a confidence threshold. Sort the rest by confidence, keep the highest, compute its IoU — intersection area over union area — with every remaining box of that class, and suppress any above a threshold like 0.5. Repeat with the next highest until none remain. Trade-off: too low a threshold deletes real objects in crowds; too high leaves duplicates."
      },
      terms: [
        ["Bounding box", "(x, y, w, h) or (x1, y1, x2, y2) rectangle around an object."],
        ["IoU", "Area of overlap / area of union between two boxes."],
        ["NMS", "Greedy removal of duplicate boxes using confidence and IoU."],
        ["Anchor box", "Pre-defined box shapes the detector refines into predictions."],
        ["mAP", "Mean of per-class Average Precision (area under the precision–recall curve)."]
      ],
      quiz: [
        { q: "Box A and B are both 10×10 and overlap in a 5×10 strip. IoU?", o: ["0.5", "0.25", "0.33", "0.67"], a: 2, e: "Intersection 50, union 100 + 100 − 50 = 150 → 50/150 ≈ 0.33." },
        { q: "Raising the NMS IoU threshold from 0.3 to 0.8 will…", o: ["Remove more boxes", "Keep more (possibly duplicate) boxes", "Change class labels", "Have no effect"], a: 1, e: "A box is only suppressed if its IoU exceeds the threshold, so a higher threshold suppresses less." }
      ],
      fact: { title: "Detectors that skip NMS", desc: "DETR (2020) treated detection as set prediction with Hungarian matching — no NMS needed. YOLOv10 (2024) brought NMS-free training to YOLO with consistent dual assignments, and Ultralytics' YOLO26 continues the end-to-end, NMS-free design for faster, more predictable edge deployment." }
    },
    {
      title: "Segmentation",
      subtitle: "Predict pixel-level regions",
      checkpointTime: 50,
      captions: [
        { time: 0, text: "Segmentation is dense prediction: instead of one label per image or one box per object, the model assigns a class to every single pixel." },
        { time: 15, text: "Semantic segmentation labels classes — all sheep are ‘sheep’. Instance segmentation separates individuals — sheep 1, sheep 2. Mask R-CNN does this by adding a mask head to Faster R-CNN." },
        { time: 32, text: "Panoptic segmentation unifies both: countable ‘things’ like people and cars get instance IDs, and amorphous ‘stuff’ like sky and road gets semantic labels." },
        { time: 50, text: "Checkpoint: why are skip connections essential in U-Net, and what happens if you remove them?" },
        { time: 70, text: "U-Net's encoder repeatedly convolves and pools: the image gets smaller and the features get more semantic — it knows WHAT is there, but loses exactly WHERE." },
        { time: 90, text: "The decoder upsamples back to full size. Skip connections copy high-resolution encoder features across and concatenate them with the decoder's, restoring sharp boundaries." },
        { time: 110, text: "Evaluate with IoU per class — averaged as mean IoU — or the Dice coefficient, 2 × overlap divided by the total size of both masks. Dice is popular in medical imaging." }
      ],
      checkpoint: {
        question: "Why are skip connections indispensable in U-Net? What happens to the output mask if you remove them?",
        hint: "Pooling throws away spatial detail. Where can the decoder get that detail back?",
        keywords: ["skip", "pooling", "downsampling", "spatial", "resolution", "detail", "boundary", "boundaries", "localisation", "localization", "encoder", "decoder", "concatenate", "blurry"],
        idealAnswer: "The U-Net encoder downsamples with pooling to capture semantic context, but that discards fine spatial detail. Skip connections pass the high-resolution feature maps from each encoder level directly to the matching decoder level, where they're concatenated with the upsampled features. This gives the decoder both 'what' from deep layers and 'where' from shallow layers. Without them, the decoder must reconstruct detail from a coarse bottleneck, so masks come out blurry with inaccurate boundaries."
      },
      terms: [
        ["Semantic seg.", "Class label per pixel; instances are not separated."],
        ["Instance seg.", "Separate mask per object instance (e.g. Mask R-CNN)."],
        ["Panoptic seg.", "Things (instances) + stuff (semantic) in one output."],
        ["Dice", "2|A∩B| / (|A|+|B|) = 2·IoU / (1 + IoU)."],
        ["Transposed conv", "Learnable upsampling used in decoders (alt: bilinear + conv)."]
      ],
      quiz: [
        { q: "Counting individual cars in a parking lot needs…", o: ["Semantic segmentation", "Instance segmentation", "Image classification", "Edge detection"], a: 1, e: "Semantic segmentation merges all cars into one ‘car’ region; instance segmentation separates them." },
        { q: "A mask has IoU = 0.5 with ground truth. Its Dice score is…", o: ["0.5", "0.25", "0.67", "1.0"], a: 2, e: "Dice = 2·IoU/(1+IoU) = 1/1.5 ≈ 0.67. Dice is always ≥ IoU." }
      ],
      fact: { title: "Segment Anything, now with words", desc: "SAM (2023) segmented any object from a click. SAM 2 (2024) extended this to video with a streaming memory that follows the object across frames. SAM 3 (late 2025) adds concept prompts — type ‘yellow school bus’ and it segments every instance." }
    },
    {
      title: "ViTs + Multimodal",
      subtitle: "Use image–text & transformer-based vision",
      checkpointTime: 50,
      captions: [
        { time: 0, text: "A Vision Transformer treats an image like a sentence. It cuts a 224×224 image into 16×16 patches — a 14 × 14 grid, so 196 patches — and treats each patch as a word." },
        { time: 18, text: "Each patch is flattened and linearly projected into a token embedding. A learnable [CLS] token is added at the front, and position embeddings tell the model where each patch came from." },
        { time: 34, text: "Self-attention lets every token look at every other token: attention = softmax(Q·Kᵀ / √d) · V. A patch of a dog's ear can directly attend to the tail on the other side of the image." },
        { time: 50, text: "Checkpoint: why do ViTs need much more training data than CNNs? And how does CLIP do zero-shot classification?" },
        { time: 70, text: "CNNs build in locality and translation equivariance. ViTs have weak inductive bias — they must learn from data that nearby patches are related. With huge pretraining data, that flexibility wins." },
        { time: 90, text: "CLIP trains an image encoder and a text encoder together on 400 million image–caption pairs, with a contrastive loss that pulls matching pairs together and pushes mismatches apart." },
        { time: 108, text: "For zero-shot classification, embed prompts like ‘a photo of a dog’ for each class, embed the image, and pick the class with the highest cosine similarity — no task-specific training." }
      ],
      checkpoint: {
        question: "Why do Vision Transformers need significantly more training data than CNNs to reach peak performance? And how does CLIP perform zero-shot classification?",
        hint: "Inductive bias (locality, equivariance) vs learning it from data. CLIP: two encoders, a shared embedding space, cosine similarity with text prompts.",
        keywords: ["inductive bias", "locality", "equivariance", "data", "learn", "clip", "contrastive", "text encoder", "image encoder", "cosine", "similarity", "prompt", "embedding", "zero-shot"],
        idealAnswer: "CNNs hard-code inductive biases — locality and translation equivariance — so they learn efficiently from less data. ViTs split the image into patch tokens and use global self-attention with very weak spatial bias, so they must learn spatial structure from data, which requires large-scale pretraining. CLIP learns a shared embedding space for images and text via contrastive training on image–caption pairs. For zero-shot classification, it embeds a text prompt per class, embeds the image, and predicts the class with the highest cosine similarity."
      },
      terms: [
        ["Patch embedding", "Flatten a P×P×C patch and project it to a D-dim token."],
        ["[CLS] token", "Extra learnable token whose final state is used for classification."],
        ["Self-attention", "Each token mixes information from all tokens, weighted by Q·K similarity."],
        ["Inductive bias", "Built-in assumptions (e.g. locality) that help learn from less data."],
        ["Contrastive loss", "Pull matching image–text pairs together, push others apart."]
      ],
      quiz: [
        { q: "ViT with 224×224 input and 16×16 patches: sequence length including [CLS]?", o: ["196", "197", "256", "224"], a: 1, e: "(224/16)² = 14² = 196 patches + 1 [CLS] = 197 tokens." },
        { q: "Self-attention cost grows with the number of tokens N as…", o: ["N", "N log N", "N²", "constant"], a: 2, e: "Every token attends to every token: an N×N attention matrix. Halving patch size quadruples N and ×16 the attention cost." }
      ],
      fact: { title: "Vision-language-action models", desc: "Google DeepMind's RT-2 (2023) treated robot actions as text tokens, so a vision-language model could output motor commands. Gemini Robotics (2025) pushed this further: robots following open-ended instructions in scenes they had never seen." }
    },
    {
      title: "Video + Tracking",
      subtitle: "Connect detections across time",
      checkpointTime: 45,
      captions: [
        { time: 0, text: "Video adds time: a clip is a tensor of shape frames × height × width × channels. Neighbouring frames are very similar, so there's lots of redundancy to exploit." },
        { time: 18, text: "Most multi-object trackers use tracking-by-detection: run a detector on every frame, then link detections over time into tracks with stable IDs." },
        { time: 32, text: "SORT uses a Kalman filter to predict where each tracked object will be in the next frame, assuming roughly constant velocity, then corrects the estimate with the new detection." },
        { time: 45, text: "Checkpoint: what does the Hungarian algorithm do in SORT, and why did DeepSORT add a re-identification network?" },
        { time: 64, text: "The Hungarian algorithm solves the assignment problem: given a cost matrix — for example 1 − IoU between predictions and detections — it finds the optimal one-to-one matching." },
        { time: 84, text: "With motion and IoU only, SORT swaps IDs when objects cross or are occluded. DeepSORT adds an appearance embedding from a re-ID CNN, so it can recognise the same person after occlusion." },
        { time: 104, text: "Without boxes, optical flow estimates a motion vector for every pixel between two frames. RAFT is a well-known deep optical-flow model." }
      ],
      checkpoint: {
        question: "Explain the roles of the Kalman filter and the Hungarian algorithm in SORT. Why was DeepSORT developed?",
        hint: "Kalman: predict + update motion state. Hungarian: optimal matching of predictions to detections. DeepSORT: appearance features for occlusions and ID switches.",
        keywords: ["kalman", "predict", "velocity", "motion", "hungarian", "assignment", "matching", "cost", "iou", "deepsort", "appearance", "re-id", "re-identification", "occlusion", "id switch"],
        idealAnswer: "In SORT, a Kalman filter keeps a motion state for each track — position, box size and velocity — predicts where it will be in the next frame, then updates with the matched detection. The Hungarian algorithm finds the optimal one-to-one assignment between predicted tracks and new detections using an IoU-based cost. SORT relies only on motion and overlap, so occlusions and crossings cause ID switches. DeepSORT adds a deep appearance (re-ID) embedding to the matching cost so identities survive occlusion."
      },
      terms: [
        ["Tracklet / track", "A sequence of detections linked as one object over time."],
        ["Kalman filter", "Predict → update loop for a state with uncertainty (here: position + velocity)."],
        ["Hungarian algorithm", "Optimal one-to-one assignment for a cost matrix, O(n³)."],
        ["ID switch", "Tracker swaps identities of two objects — a key MOT error."],
        ["Optical flow", "Per-pixel motion field between consecutive frames."]
      ],
      quiz: [
        { q: "In SORT, what fills the Hungarian cost matrix?", o: ["Class probabilities", "1 − IoU between predicted and detected boxes", "Pixel colours", "Optical flow"], a: 1, e: "SORT uses IoU distance between Kalman-predicted boxes and new detections." },
        { q: "Two pedestrians cross and SORT swaps their IDs. DeepSORT's fix?", o: ["Higher frame rate", "Appearance (re-ID) embeddings", "Larger NMS threshold", "Grayscale input"], a: 1, e: "Appearance features let the tracker tell the two people apart after overlap." }
      ],
      fact: { title: "RAFT changed optical flow", desc: "RAFT (ECCV 2020 best paper) builds a 4D correlation volume between all pixel pairs of two frames, then refines a flow field iteratively with a recurrent unit. Its iterative-refinement design influenced later trackers and point-tracking models like CoTracker." }
    },
    {
      title: "Deployment & Responsible Vision",
      subtitle: "Package, benchmark & explain limitations",
      checkpointTime: 50,
      captions: [
        { time: 0, text: "A model in a notebook helps no one. Deployment means running it on real hardware — phones, edge cameras, cloud GPUs — within limits on latency, memory and power." },
        { time: 15, text: "Make models smaller and faster. Quantisation stores weights as 8-bit integers instead of 32-bit floats — four times less memory. Pruning removes weights that barely matter." },
        { time: 34, text: "Export to an inference runtime: ONNX as the common format, TensorRT for NVIDIA GPUs, OpenVINO for Intel, TFLite or Core ML for phones. Benchmark latency, throughput and accuracy on the target device." },
        { time: 50, text: "Checkpoint: how does Grad-CAM explain a CNN's prediction, and how do you audit a vision model for bias?" },
        { time: 68, text: "Grad-CAM takes the gradient of the class score with respect to the last conv feature maps, averages it into a weight per channel, sums the weighted maps, and applies ReLU — a heatmap of what mattered." },
        { time: 88, text: "Responsible vision means measuring who it fails for. The Gender Shades study found commercial gender classifiers erred up to 35% on darker-skinned women but under 1% on lighter-skinned men." },
        { time: 106, text: "So report disaggregated metrics per subgroup, document limitations in a model card, and test robustness: tiny adversarial perturbations or stickers can flip a prediction." }
      ],
      checkpoint: {
        question: "How does Grad-CAM produce an interpretable visual explanation of a CNN prediction? And how do you audit a vision model for demographic bias?",
        hint: "Gradients → channel weights (global average pool) → weighted sum of feature maps → ReLU → heatmap. Audit: metrics per subgroup, not just overall.",
        keywords: ["grad-cam", "gradient", "feature map", "last conv", "channel", "weight", "global average", "relu", "heatmap", "bias", "subgroup", "disaggregated", "demographic", "audit", "dataset"],
        idealAnswer: "Grad-CAM computes the gradient of the target class score with respect to the last convolutional layer's feature maps, global-average-pools those gradients into one importance weight per channel, takes the weighted sum of the feature maps and applies ReLU. Upsampled, this is a heatmap of the regions that pushed the prediction toward that class. To audit for bias, evaluate disaggregated metrics — accuracy, false positive and false negative rates — separately for each demographic subgroup, check the training data's representation, and document gaps; a high overall accuracy can hide large subgroup failures."
      },
      terms: [
        ["Quantisation", "FP32 → INT8 (or FP16) weights/activations; ~4× smaller, faster on supporting hardware."],
        ["Pruning", "Removing low-importance weights or channels."],
        ["ONNX", "Open, framework-neutral model format for inference runtimes."],
        ["Latency vs throughput", "Time per input vs inputs per second (batching trades one for the other)."],
        ["Model card", "Documentation of intended use, data, metrics by subgroup and limitations."]
      ],
      quiz: [
        { q: "A 25M-parameter model in FP32 is about 100 MB. After INT8 quantisation?", o: ["50 MB", "25 MB", "12.5 MB", "100 MB"], a: 1, e: "FP32 = 4 bytes/param, INT8 = 1 byte/param: 25M × 1 B ≈ 25 MB." },
        { q: "A Grad-CAM heatmap for ‘husky’ highlights snow, not the dog. This suggests…", o: ["The model is perfect", "A spurious correlation in training data", "Quantisation broke it", "Grad-CAM is wrong by definition"], a: 1, e: "Classic ‘right for the wrong reason’ — the model learned the background. Fix the data." }
      ],
      fact: { title: "Stickers that fool stop signs", desc: "Eykholt et al. (CVPR 2018) put a few black-and-white stickers on a real stop sign; a road-sign classifier then read it as ‘Speed Limit 45’ in most test frames, from different distances and angles. Physical adversarial robustness is now part of safety testing for automotive vision." }
    }
  ],

  examQuestions: [
    {
      prompt: "Let's start simple. Explain the difference between image classification, object detection and semantic segmentation.",
      topic: "Foundations",
      keywords: ["classification", "single label", "detection", "bounding box", "where", "segmentation", "pixel", "every pixel", "instance"],
      idealAnswer: "Classification gives one label for the whole image, with no location. Detection outputs a class, confidence and bounding box for each object — what and where. Semantic segmentation classifies every pixel, giving exact shapes but not separating instances of the same class. Cost and annotation effort increase from classification to segmentation."
    },
    {
      prompt: "Why do convolutional networks outperform fully connected networks on images? Name the two key inductive biases.",
      topic: "CNNs",
      keywords: ["local connectivity", "locality", "parameter sharing", "weight sharing", "translation equivariance", "fewer parameters", "overfitting"],
      idealAnswer: "CNNs exploit local connectivity — each neuron sees a small receptive field — and parameter sharing — the same kernel slides across the image. This cuts parameters massively and gives translation equivariance, so a feature is detected anywhere. A fully connected net flattens the image, ignores spatial structure, needs millions of weights and overfits."
    },
    {
      prompt: "Your training accuracy is 99% but validation accuracy is 72%. What's happening, and what would you do?",
      topic: "Training",
      keywords: ["overfitting", "variance", "augmentation", "regularisation", "dropout", "weight decay", "early stopping", "more data", "leakage"],
      idealAnswer: "That gap means overfitting — high variance; the model memorises training data instead of generalising. I'd add data augmentation, regularisation like weight decay or dropout, use early stopping on validation loss, simplify the model or use transfer learning. I'd also check the split for leakage or distribution differences between train and validation."
    },
    {
      prompt: "You have 500 medical X-ray images. How would you apply transfer learning from an ImageNet-pretrained ResNet-50? Explain your freezing strategy and learning rates.",
      topic: "Transfer learning",
      keywords: ["freeze", "backbone", "new head", "classifier", "small learning rate", "fine-tune", "catastrophic forgetting", "overfitting", "domain shift", "augmentation"],
      idealAnswer: "With 500 images, training all 25M parameters would overfit. I'd replace the final layer with a new head for my classes, freeze the backbone and train the head first. Because X-rays differ from ImageNet photos, I'd then unfreeze the top blocks and fine-tune with a small learning rate, around 1e-5 to 1e-4, smaller for earlier layers, to avoid catastrophic forgetting — plus augmentation and careful validation."
    },
    {
      prompt: "How does Non-Maximum Suppression eliminate redundant bounding boxes? What metric does it rely on?",
      topic: "Detection",
      keywords: ["iou", "intersection over union", "confidence", "sort", "highest", "suppress", "threshold", "greedy", "duplicate"],
      idealAnswer: "NMS relies on confidence scores and IoU. Sort boxes by confidence, keep the top box, compute IoU between it and each remaining box of the same class, and remove those above a threshold such as 0.5. Repeat with the next highest box. The threshold trades off duplicates against wrongly suppressing nearby objects in crowded scenes."
    },
    {
      prompt: "In segmentation, what is the difference between IoU and Dice, and why are skip connections used in U-Net?",
      topic: "Segmentation",
      keywords: ["iou", "dice", "intersection", "union", "overlap", "skip", "encoder", "decoder", "resolution", "boundary", "concatenate"],
      idealAnswer: "IoU is intersection over union; Dice is twice the intersection over the sum of both mask sizes, so Dice = 2·IoU/(1+IoU) and is always higher. Both measure mask overlap. U-Net's skip connections concatenate high-resolution encoder features into the decoder, recovering spatial detail lost by pooling, which gives sharp boundaries."
    },
    {
      prompt: "Why do Vision Transformers need far larger pretraining datasets than CNNs to be competitive?",
      topic: "ViTs",
      keywords: ["inductive bias", "locality", "translation equivariance", "global attention", "patches", "learn spatial", "data"],
      idealAnswer: "CNNs build in locality and translation equivariance. A ViT treats the image as a sequence of patch tokens with global self-attention and almost no built-in spatial assumptions, so it has to learn that neighbouring patches are related from data. With small data it underperforms; with large-scale pretraining its flexibility and global context let it match or beat CNNs."
    },
    {
      prompt: "In multi-object tracking, why is a Kalman filter paired with the Hungarian algorithm in SORT? What limitation led to DeepSORT?",
      topic: "Tracking",
      keywords: ["kalman", "predict", "velocity", "hungarian", "assignment", "matching", "iou", "deepsort", "re-id", "appearance", "occlusion", "id switch"],
      idealAnswer: "The Kalman filter predicts each track's next position from a constant-velocity motion model. The Hungarian algorithm then finds the optimal one-to-one assignment between predictions and new detections using IoU cost. SORT relies only on motion and overlap, so occlusions and crossings cause ID switches. DeepSORT adds appearance embeddings from a re-ID network to the matching."
    },
    {
      prompt: "Your model must run on a phone. How would you make it deployable, and what would you report about its limitations?",
      topic: "Deployment",
      keywords: ["quantisation", "quantization", "int8", "pruning", "distillation", "onnx", "tflite", "core ml", "latency", "benchmark", "subgroup", "bias", "model card"],
      idealAnswer: "I'd shrink the model with INT8 quantisation, pruning or knowledge distillation into a mobile backbone, export via ONNX or directly to TFLite or Core ML, and benchmark latency, memory and accuracy on the actual device. For limitations I'd write a model card: intended use, training data, and accuracy broken down by subgroup and condition — lighting, skin tone, camera — plus known failure modes."
    }
  ],

  formulas: [
    ["Conv output size", "O = ⌊(W − K + 2P) / S⌋ + 1"],
    ["Conv parameters", "(K · K · C_in + 1) · C_out"],
    ["Normalisation", "x′ = (x / 255 − μ) / σ"],
    ["Cross-entropy", "L = − Σ y_c · log p_c"],
    ["Precision / Recall", "P = TP/(TP+FP),  R = TP/(TP+FN)"],
    ["F1", "F1 = 2PR / (P + R)"],
    ["IoU", "|A ∩ B| / |A ∪ B|"],
    ["Dice", "2|A ∩ B| / (|A| + |B|) = 2·IoU / (1 + IoU)"],
    ["Focal loss", "FL = −α (1 − p_t)^γ · log p_t"],
    ["ViT tokens", "N = (H/P) · (W/P)  (+1 for [CLS])"],
    ["Self-attention", "softmax(Q Kᵀ / √d_k) · V"],
    ["Model size", "params × bytes/param (FP32 = 4, FP16 = 2, INT8 = 1)"],
    ["Quantisation", "q = round(x / s) + z,  s = (max − min) / 255"]
  ],

  /* Multi-variation challenges for every CV lab (plus dynamic daily seed generator) */
  labVariations: [
    [
      { title: "Red Channel Max Normalisation", q: "A <b>red</b>-channel pixel has raw value <b>255</b> (μ = 0.485, σ = 0.229). What is it after <code>ToTensor()</code> + ImageNet <code>Normalize()</code>? (2 decimals)", answer: 2.25, tol: 0.015, hint: "First divide 255 by 255 to get 1.0, then subtract 0.485 and divide by 0.229.", explain: "255/255 = 1.0 → (1.0 − 0.485) / 0.229 = 0.515 / 0.229 = 2.2489 ≈ 2.25." },
      { title: "Green Channel Mid-Tone Normalisation", q: "A <b>green</b>-channel pixel has raw value <b>102</b> (μ = 0.456, σ = 0.224). What is its normalised value after <code>ToTensor()</code> + ImageNet <code>Normalize()</code>? (2 decimals)", answer: -0.25, tol: 0.015, hint: "Compute x = 102 / 255 = 0.40, then (0.40 − 0.456) / 0.224.", explain: "102 / 255 = 0.40 → (0.40 − 0.456) / 0.224 = −0.056 / 0.224 = −0.25." },
      { title: "Luminance Grayscale Conversion", q: "An RGB pixel has values <b>(R=200, G=100, B=50)</b>. Using the ITU-R BT.601 luminance formula <code>Y = 0.299R + 0.587G + 0.114B</code>, what is its grayscale intensity <b>Y</b>? (2 decimals)", answer: 124.2, tol: 0.05, hint: "Multiply each channel by its perceptual weight and sum them.", explain: "Y = 0.299(200) + 0.587(100) + 0.114(50) = 59.8 + 58.7 + 5.7 = 124.20." }
    ],
    [
      { title: "ResNet Stem Spatial Output", q: "ResNet's first layer: input <b>224×224</b>, kernel <b>7×7</b>, padding <b>3</b>, stride <b>2</b>. What is the output spatial width?", answer: 112, tol: 0, hint: "Apply O = floor((W − K + 2P) / S) + 1.", explain: "⌊(224 − 7 + 2·3) / 2⌋ + 1 = ⌊223/2⌋ + 1 = 111 + 1 = 112." },
      { title: "Conv Layer Parameter Count", q: "A <code>Conv2d</code> layer has <b>C_in = 32</b>, <b>C_out = 64</b>, kernel <b>3×3</b>, with bias enabled. How many total learnable parameters does it have?", answer: 18496, tol: 0, hint: "Each of the 64 filters has 3 × 3 × 32 weights plus 1 bias.", explain: "Parameters = (3 · 3 · 32 + 1) × 64 = 289 × 64 = 18,496." },
      { title: "ConvNeXt 7×7 Depthwise-Style Output", q: "An input feature map is <b>56×56</b>. We apply a <b>7×7</b> convolution with padding <b>2</b> and stride <b>2</b>. What is the output height?", answer: 27, tol: 0, hint: "Compute floor((56 − 7 + 4) / 2) + 1.", explain: "⌊(56 − 7 + 2·2) / 2⌋ + 1 = ⌊53 / 2⌋ + 1 = 26 + 1 = 27." }
    ],
    [
      { title: "Harmonic Mean F1 Score", q: "On a medical test set: <b>TP = 40, FP = 10, FN = 20, TN = 930</b>. What is the <b>F1 score</b> (as a decimal between 0 and 1, rounded to 2 decimals)?", answer: 0.73, tol: 0.01, hint: "Compute Precision = TP/(TP+FP) and Recall = TP/(TP+FN), then F1 = 2PR/(P+R).", explain: "Precision = 40/50 = 0.80, Recall = 40/60 = 0.6667 → F1 = 2(0.80)(0.6667)/(1.4667) = 0.727 ≈ 0.73." },
      { title: "Imbalanced Recall Trap", q: "In a defect detector: <b>TP = 18, FP = 2, FN = 42, TN = 938</b> (overall accuracy is 95.6%!). What is the actual <b>Recall</b> as a percentage (0–100)?", answer: 30, tol: 0.1, hint: "Recall = TP / (TP + FN) × 100.", explain: "Total real positives = TP + FN = 18 + 42 = 60. Recall = 18 / 60 = 0.30 = 30%." },
      { title: "Specificity vs False Positive Rate", q: "A screening model produces <b>TP = 90, FN = 10, FP = 50, TN = 450</b>. What is its <b>Precision</b> (as a decimal 0–1, to 2 decimals)?", answer: 0.64, tol: 0.01, hint: "Precision = TP / (TP + FP).", explain: "Precision = 90 / (90 + 50) = 90 / 140 = 0.6428 ≈ 0.64." }
    ],
    [
      { title: "Linear Probe Trainable Weights", q: "You replace ResNet-50's final layer with <code>nn.Linear(2048, 5)</code> and freeze the entire backbone. How many <b>trainable</b> parameters are there?", answer: 10245, tol: 0, hint: "A linear layer has in_features × out_features weights plus out_features biases.", explain: "2048 × 5 weights + 5 biases = 10,240 + 5 = 10,245." },
      { title: "Bottleneck MLP Head Parameters", q: "You freeze a ViT-Base backbone (768-d embedding) and attach a 2-layer head: <code>Linear(768, 128)</code> → ReLU → <code>Linear(128, 10)</code> (both with bias). How many trainable parameters are in the head?", answer: 99722, tol: 0, hint: "Sum (768×128 + 128) + (128×10 + 10).", explain: "Layer 1: 768×128 + 128 = 98,432. Layer 2: 128×10 + 10 = 1,290. Total = 98,432 + 1,290 = 99,722." },
      { title: "Discriminative LR Ratio", q: "Your classification head uses learning rate <b>1e-3</b> and you decay the learning rate by a factor of <b>0.2</b> per stage across 3 stages down to stem. What is the learning rate of the earliest stage in units of <b>1e-6</b>?", answer: 8, tol: 0.01, hint: "Multiply 1000 (in units of 1e-6) by 0.2 three times: 1000 × 0.2³.", explain: "1e-3 × (0.2)³ = 1e-3 × 0.008 = 8e-6 → 8 (in units of 1e-6)." }
    ],
    [
      { title: "Horizontal Strip Overlap IoU", q: "Box A = <code>(0, 0, 10, 10)</code> and Box B = <code>(5, 0, 15, 10)</code> in <code>(x1, y1, x2, y2)</code> form. What is their <b>IoU</b>? (2 decimals)", answer: 0.33, tol: 0.01, hint: "Intersection width = 10 − 5 = 5, height = 10. Union = Area(A) + Area(B) − Intersection.", explain: "Intersection = 5 × 10 = 50. Union = 100 + 100 − 50 = 150. IoU = 50 / 150 = 0.333 ≈ 0.33." },
      { title: "2D Corner Overlap IoU", q: "Box A = <code>(0, 0, 20, 20)</code> and Box B = <code>(10, 10, 30, 30)</code>. Compute their exact <b>IoU</b> (to 2 decimals).", answer: 0.14, tol: 0.01, hint: "Overlap is from (10,10) to (20,20) → 10×10 = 100. Each box has area 400.", explain: "Intersection = 10 × 10 = 100. Union = 400 + 400 − 100 = 700. IoU = 100 / 700 = 0.1428 ≈ 0.14." },
      { title: "NMS Surviving Box Count", q: "Four 'car' boxes have confidences <b>0.92, 0.85, 0.70, 0.25</b>. Confidence threshold is <b>0.30</b>, NMS IoU threshold is <b>0.50</b>. The top box (0.92) has IoU <b>0.68</b> with the 0.85 box and IoU <b>0.15</b> with the 0.70 box. How many boxes survive NMS?", answer: 2, tol: 0, hint: "Drop <0.30 first, keep 0.92, check which remaining boxes exceed IoU 0.50 with it.", explain: "0.25 is dropped (<0.30). 0.92 is kept. 0.85 is suppressed (IoU 0.68 > 0.50). 0.70 survives (IoU 0.15 ≤ 0.50). Total surviving = 2." }
    ],
    [
      { title: "IoU to Dice Conversion", q: "A predicted segmentation mask has <b>IoU = 0.50</b> with the ground truth. What is its <b>Dice coefficient</b>? (2 decimals)", answer: 0.67, tol: 0.01, hint: "Use Dice = 2 · IoU / (1 + IoU).", explain: "Dice = 2(0.5) / (1 + 0.5) = 1.0 / 1.5 = 0.6667 ≈ 0.67." },
      { title: "Pixel Count Dice Score", q: "A predicted lesion mask has <b>120</b> pixels, the ground-truth mask has <b>180</b> pixels, and they overlap on <b>90</b> pixels (TP = 90). What is the <b>Dice score</b>? (2 decimals)", answer: 0.6, tol: 0.01, hint: "Dice = 2 × |P ∩ G| / (|P| + |G|).", explain: "Dice = 2 × 90 / (120 + 180) = 180 / 300 = 0.60." },
      { title: "Dice to IoU Inverse", q: "A medical segmentation paper reports a <b>Dice score of 0.80</b>. What is the corresponding <b>IoU</b> (Jaccard index)? (2 decimals)", answer: 0.67, tol: 0.01, hint: "Invert Dice = 2·IoU/(1+IoU) → IoU = Dice / (2 − Dice).", explain: "IoU = 0.80 / (2 − 0.80) = 0.80 / 1.20 = 0.6667 ≈ 0.67." }
    ],
    [
      { title: "ViT-Base Sequence Length", q: "A ViT takes <b>224×224</b> images with <b>16×16</b> patches and prepends 1 <code>[CLS]</code> token. What is the total token sequence length <b>L</b>?", answer: 197, tol: 0, hint: "Compute (224/16)² + 1.", explain: "(224/16)² = 14 × 14 = 196 patch tokens, plus 1 [CLS] token = 197." },
      { title: "High-Res ViT Attention Matrix Size", q: "If you feed a <b>384×384</b> image into a ViT with <b>16×16</b> patches (no [CLS] token), how many patch tokens <b>N</b> are produced?", answer: 576, tol: 0, hint: "Grid width = 384 / 16 = 24. Total patches = 24².", explain: "(384 / 16)² = 24 × 24 = 576 tokens (nearly 3× more tokens and ~8.5× larger attention matrix than 224×224!)." },
      { title: "Patch Linear Projection Weights", q: "For RGB images (<b>C = 3</b>), patch size <b>P = 16</b>, and embedding dimension <b>D = 768</b>, how many values are in a single flattened patch vector before projection?", answer: 768, tol: 0, hint: "Flattened patch dimension = P × P × C.", explain: "16 × 16 × 3 = 768 numbers per patch." }
    ],
    [
      { title: "Constant-Velocity Kalman Step", q: "A tracked pedestrian is at <b>x = 100 px</b> moving at a constant velocity of <b>12 px/frame</b>. Where does the Kalman filter predict the box after <b>3</b> frames?", answer: 136, tol: 0, hint: "x_pred = x + vx · Δt.", explain: "x̂ = 100 + 12 × 3 = 136 px." },
      { title: "Optimal Hungarian Assignment Cost", q: "Two tracks (T1, T2) and two detections (D1, D2) have cost matrix <code>[[0.15, 0.80], [0.25, 0.40]]</code>. What is the minimum total assignment cost found by the Hungarian algorithm? (2 decimals)", answer: 0.55, tol: 0.01, hint: "Compare diagonal (T1→D1, T2→D2) vs off-diagonal (T1→D2, T2→D1).", explain: "Diagonal: 0.15 + 0.40 = 0.55. Off-diagonal: 0.80 + 0.25 = 1.05. Minimum total cost = 0.55." },
      { title: "DeepSORT Combined Matching Cost", q: "For a track–detection pair, motion cost (1 − IoU) is <b>0.40</b> and cosine appearance distance is <b>0.10</b>. With blending weight <b>λ = 0.5</b>, what is the combined cost? (2 decimals)", answer: 0.25, tol: 0.01, hint: "Cost = λ(0.40) + (1 − λ)(0.10).", explain: "0.5 × 0.40 + 0.5 × 0.10 = 0.20 + 0.05 = 0.25." }
    ],
    [
      { title: "FP32 Weight Memory Footprint", q: "A vision model has <b>25 million</b> parameters. How many <b>MB</b> (1 MB = 10⁶ bytes) do its weights occupy in <b>FP32</b>?", answer: 100, tol: 0.5, hint: "FP32 uses 4 bytes per parameter.", explain: "25,000,000 × 4 bytes = 100,000,000 bytes = 100 MB." },
      { title: "Affine INT8 Quantisation", q: "A weight tensor has range <b>[min = −1.0, max = 1.55]</b>. Using scale <code>s = (max − min)/255</code> and zero-point <code>z = round(−min/s)</code>, what integer <code>q</code> is weight <b>x = 0.50</b> quantised to?", answer: 150, tol: 1, hint: "Compute s = 2.55 / 255 = 0.01, z = round(1.0 / 0.01) = 100, then q = round(0.50 / 0.01) + 100.", explain: "s = (1.55 − (−1.0)) / 255 = 0.01. z = round(1.0 / 0.01) = 100. q = round(0.50 / 0.01) + 100 = 50 + 100 = 150." },
      { title: "Disaggregated Subgroup Error Gap", q: "A classifier achieves <b>99.2%</b> accuracy on Subgroup A (err = 0.8%) and <b>65.3%</b> accuracy on Subgroup B. What is the error-rate gap (in percentage points) between Subgroup B and Subgroup A?", answer: 33.9, tol: 0.1, hint: "Error rate on B = 100 − 65.3 = 34.7%. Subtract 0.8%.", explain: "Error(B) = 34.7%, Error(A) = 0.8% → Gap = 34.7 − 0.8 = 33.9 percentage points (the Gender Shades gap)." }
    ]
  ],

  visuals: [
  /* 0 — Images as data */
  (ci, p, t) => {
    const n = 8, cs = 26, gx = 40, gy = 92;
    if (ci === 0){
      heading("An image is a grid of numbers", "8 × 8 grayscale crop · each cell is one pixel, 0 = black, 255 = white");
      grid(gx, gy, n, cs, (r,c)=>pixVal(r,c,n), {nums:true});
      const k = Math.floor(t*2) % (n*n), r = Math.floor(k/n), c = k%n;
      rect(gx+c*cs, gy+r*cs, cs, cs, {s:C.gold, lw:3, r:2});
      txt(`pixel[${r}][${c}] = ${pixVal(r,c,n)}`, 300, 130, {mono:true, s:15, w:600, c:C.goldD});
      txt("Colour image → 3 stacked grids", 300, 175, {s:14, w:600});
      ["R","G","B"].forEach((ch,i)=>{ const col=[C.rustL,C.sageL,C.skyL][i], sc=[C.rust,C.sage,C.sky][i];
        rect(300+i*22, 195+i*16, 110, 70, {f:col, s:sc, r:4}); txt(ch, 310+i*22, 213+i*16, {w:700, c:sc}); });
      txt("NumPy / OpenCV: (H, W, C)", 470, 220, {mono:true, s:12.5, c:C.ink2});
      txt("PyTorch: (C, H, W)", 470, 242, {mono:true, s:12.5, c:C.ink2});
      txt("OpenCV loads BGR, not RGB!", 470, 270, {s:12, c:C.rust, w:600});
      formulaBar("224 × 224 × 3 = 150,528 numbers per image");
    } else if (ci === 1){
      heading("RGB vs HSV colour spaces", "HSV separates colour from brightness, so shadows mostly change V");
      const cols = 12;
      for (let i=0;i<cols;i++){ const h=i*30; ctx.fillStyle=`hsl(${h},70%,55%)`; ctx.fillRect(40+i*22, 100, 22, 40); }
      txt("Hue — which colour (0–360°)", 40, 160, {s:12.5, c:C.ink2});
      for (let i=0;i<cols;i++){ ctx.fillStyle=`hsl(10,${i*9}%,55%)`; ctx.fillRect(40+i*22, 180, 22, 30); }
      txt("Saturation — how vivid", 40, 228, {s:12.5, c:C.ink2});
      const shade = 0.5 + 0.5*Math.sin(t*1.5);
      for (let i=0;i<cols;i++){ ctx.fillStyle=`hsl(10,70%,${8+i*6}%)`; ctx.fillRect(40+i*22, 248, 22, 30); }
      txt("Value — how bright", 40, 296, {s:12.5, c:C.ink2});
      txt("Same red apple, moving shadow", 400, 100, {s:14, w:600});
      const v = 0.35 + 0.6*shade, R=Math.round(200*v), G=Math.round(50*v), B=Math.round(40*v);
      circle(470, 170, 40, {f:`rgb(${R},${G},${B})`});
      txt(`RGB = (${R}, ${G}, ${B})`, 540, 160, {mono:true, s:12.5, c:C.rust});
      txt(`all three change`, 540, 178, {s:12, c:C.muted});
      txt(`HSV = (4°, 80%, ${Math.round(v*78)}%)`, 540, 210, {mono:true, s:12.5, c:C.sage});
      txt(`only V changes`, 540, 228, {s:12, c:C.muted});
    } else if (ci === 2 || ci === 3){
      heading("Normalisation: centre and scale", ci===3 ? "Checkpoint — why match the ImageNet statistics?" : "Raw pixels sit in [0, 255]; the network expects roughly mean 0, std 1");
      const e = ease(p*1.6), ox = 60, oy = 270, w = 600;
      line(ox, oy, ox+w, oy, C.line2, 1.5);
      const zero = ox + w*0.5;
      line(zero, oy-150, zero, oy+6, C.gold, 1.5, [4,4]); txt("0", zero, oy+20, {mono:true, a:"center", c:C.goldD});
      const rawC = ox + w*0.82, rawW = 120, normW = 70;
      const cx = rawC + (zero - rawC)*e, bw = rawW + (normW-rawW)*e;
      for (let i=-12;i<=12;i++){ const x = cx + i*bw/12, hgt = 130*Math.exp(-(i*i)/40);
        rect(x-bw/26, oy-hgt, bw/13-1, hgt, {f: e>0.98 ? C.gold : C.sky, r:2}); }
      txt(e < 0.5 ? "raw pixel histogram (mean ≈ 120)" : "normalised (mean 0, std 1)", cx, oy-150, {a:"center", s:12.5, w:600, c: e<0.5?C.sky:C.goldD});
      formulaBar("x′ = (x/255 − μ) / σ    μ = (0.485, 0.456, 0.406)   σ = (0.229, 0.224, 0.225)");
    } else if (ci === 4){
      heading("A 3×3 Sobel kernel finds vertical edges", "Multiply the 9 pixels by the kernel, add up, write one output value");
      const img = (r,c) => c < 4 ? 40 : 220;
      grid(40, 88, n, 24, img, {});
      const steps = 6*6, k = Math.floor(p*steps*1.999) % steps, r = Math.floor(k/6), c = k%6;
      rect(40+c*24, 88+r*24, 72, 72, {s:C.gold, lw:3, r:3});
      const K = [[-1,0,1],[-2,0,2],[-1,0,1]];
      txt("Sobel-x", 290, 100, {s:12.5, w:600, c:C.goldD});
      K.forEach((row,i)=>row.forEach((v,j)=>{ rect(290+j*30, 110+i*30, 28, 28, {f:C.goldXL, s:C.goldL, r:3}); txt(String(v), 304+j*30, 129+i*30, {mono:true, a:"center", w:600}); }));
      arrow(400, 155, 450, 155, C.gold);
      for (let rr=0; rr<6; rr++) for (let cc=0; cc<6; cc++){
        const idx = rr*6+cc; if (idx > k) continue;
        let sum=0; for(let i=0;i<3;i++) for(let j=0;j<3;j++) sum += K[i][j]*img(rr+i, cc+j);
        const v = clamp(Math.abs(sum)/720*255, 0, 255);
        ctx.fillStyle = `rgb(${255-v*0.87},${253-v*0.8},${248-v*0.7})`; ctx.fillRect(470+cc*30, 95+rr*30, 30, 30);
      }
      rect(470, 95, 180, 180, {s:C.line2, r:2});
      txt("edge map: dark = strong edge", 470, 295, {s:12, c:C.muted});
    } else if (ci === 5){
      heading("Data augmentation", "Same label, new views — only applied during training");
      const aug = ["original","h-flip","crop","rotate","colour jitter"];
      aug.forEach((a,i)=>{
        const x = 40 + i*132, y = 110; rect(x, y, 112, 112, {f:"#fff", s:C.line2, r:8});
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, 112, 112); ctx.clip();
        ctx.translate(x+56, y+56);
        if (a==="h-flip") ctx.scale(-1,1);
        if (a==="crop") ctx.scale(1.5,1.5);
        if (a==="rotate") ctx.rotate(0.3*Math.sin(t*2));
        const hue = a==="colour jitter" ? 30 + 30*Math.sin(t*3) : 30;
        circle(-8, 6, 30, {f:`hsl(${hue},55%,55%)`}); circle(-22,-18,9,{f:`hsl(${hue},55%,45%)`}); circle(6,-18,9,{f:`hsl(${hue},55%,45%)`});
        rect(14, 22, 26, 8, {f:C.navy, r:3});
        ctx.restore();
        txt(a, x+56, y+136, {a:"center", s:12.5, w:600, c: i===0?C.ink:C.goldD});
        txt('label: "cat"', x+56, y+154, {a:"center", s:11.5, c:C.muted});
      });
    } else {
      heading("Frames vs events", "A normal camera samples everything at fixed times; an event camera reports only changes");
      line(60, 140, 660, 140, C.line2); line(60, 260, 660, 260, C.line2);
      txt("frame camera, 30 fps", 60, 110, {s:12.5, w:600}); txt("event camera", 60, 230, {s:12.5, w:600});
      for (let i=0;i<8;i++) rect(80+i*72, 120, 40, 40, {f:C.skyL, s:C.sky, r:3});
      for (let i=0;i<70;i++){ const x = 70 + ((i*37.3 + t*40) % 590), y = 260 + Math.sin(i*1.7)*16; circle(x, y, 2.6, {f: i%3 ? C.gold : C.navy}); }
      txt("each dot = (x, y, time µs, polarity ±)", 360, 312, {a:"center", mono:true, s:12, c:C.goldD});
    }
  },
  /* 1 — CNNs */
  (ci, p, t) => {
    if (ci === 0){
      heading("Fully connected layers explode", "Every input pixel connects to every neuron");
      rect(40, 95, 120, 120, {f:C.skyL, s:C.sky, r:6}); txt("224×224×3", 100, 160, {a:"center", mono:true, s:12, c:C.sky});
      arrow(170, 155, 220, 155);
      const ins = 14, outs = 8;
      for (let i=0;i<ins;i++) for (let j=0;j<outs;j++) line(250, 85+i*11, 420, 105+j*17, `rgba(176,141,60,${0.08+0.12*((i+j+Math.floor(t*3))%5===0)})`, 1);
      for (let i=0;i<ins;i++) circle(250, 85+i*11, 3.5, {f:C.sky});
      for (let j=0;j<outs;j++) circle(420, 105+j*17, 5, {f:C.gold});
      txt("150,528 inputs", 250, 255, {a:"center", s:12, c:C.muted}); txt("1,000 neurons", 420, 255, {a:"center", s:12, c:C.muted});
      const shown = Math.round(150528*1000*ease(p*2));
      txt(shown.toLocaleString(), 570, 150, {a:"center", mono:true, s:22, w:600, c:C.rust});
      txt("weights in ONE layer", 570, 175, {a:"center", s:12.5, c:C.ink2});
      formulaBar("150,528 × 1,000 ≈ 150 million parameters → slow and overfits");
    } else if (ci === 1){
      heading("Convolution: one small kernel, slid everywhere", "Local connectivity + parameter sharing — the same 9 weights for every position");
      const n=7, cs=30, gx=40, gy=82, val=(r,c)=>((r*3+c*5)%7)*30+40;
      grid(gx, gy, n, cs, val, {colorFn:v=>`rgb(${255-v*0.35},${255-v*0.3},${255-v*0.15})`});
      const steps=25, k=Math.floor(p*steps*2)%steps, r=Math.floor(k/5), c=k%5;
      rect(gx+c*cs, gy+r*cs, cs*3, cs*3, {f:"rgba(176,141,60,.18)", s:C.gold, lw:2.5, r:3});
      arrow(gx+n*cs+20, gy+n*cs/2, gx+n*cs+80, gy+n*cs/2, C.gold);
      txt("3×3 kernel", gx+n*cs+50, gy+n*cs/2-12, {a:"center", s:11.5, c:C.goldD});
      const fx = 380, fy = 112;
      for (let rr=0;rr<5;rr++) for(let cc=0;cc<5;cc++){ const idx=rr*5+cc; rect(fx+cc*30, fy+rr*30, 29, 29, {f: idx<k?C.goldL: idx===k?C.gold:"#fff", s:C.line2, r:2}); }
      txt("feature map 5×5", fx+75, fy-12, {a:"center", s:12, w:600});
      txt("7 − 3 + 1 = 5", fx+75, fy+175, {a:"center", mono:true, s:12, c:C.muted});
      formulaBar("same 9 weights + 1 bias reused at all 25 positions");
    } else if (ci === 2){
      heading("Translation equivariance", "Shift the input → the feature map shifts the same way");
      const sh = Math.round(2 + 2*Math.sin(t*1.2));
      txt("input", 345, 135, {s:12.5, w:600, c:C.navy});
      for (let c=0;c<10;c++) rect(40+c*30, 100, 29, 60, {f: (c===sh||c===sh+1) ? C.navy : "#fff", s:C.line2, r:2});
      txt("feature map", 345, 243, {s:12.5, w:600, c:C.goldD});
      for (let c=0;c<10;c++) rect(40+c*30, 218, 29, 40, {f: (c===sh||c===sh+1) ? C.gold : "#fff", s:C.line2, r:2});
      arrow(40+sh*30+30, 165, 40+sh*30+30, 212, C.gold);
      txt("Equivariance: f(shift(x)) = shift(f(x))", 440, 140, {s:13.5, w:600});
      txt("Convolution detects the pattern wherever it is,", 440, 168, {s:12.5, c:C.ink2});
      txt("and the output remembers WHERE it was.", 440, 186, {s:12.5, c:C.ink2});
      txt("Invariance (pooling, global avg): output", 440, 222, {s:12.5, c:C.ink2});
      txt("stays the SAME under small shifts.", 440, 240, {s:12.5, c:C.ink2});
    } else if (ci === 3 || ci === 4){
      heading("Max pooling 2×2, stride 2", ci===3 ? "Checkpoint — any learnable parameters here?" : "Keep the biggest value in each window · 0 parameters");
      const M = [[1,3,2,4],[5,6,1,2],[7,2,9,0],[1,8,3,4]], cols=[C.goldL,C.skyL,C.sageL,C.rustL], sc=[C.gold,C.sky,C.sage,C.rust];
      const active = Math.floor(p*8)%4;
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){
        const w = Math.floor(r/2)*2+Math.floor(c/2);
        rect(60+c*48, 90+r*48, 46, 46, {f: w===active ? cols[w] : "#fff", s: w===active ? sc[w] : C.line2, r:4, lw: w===active?2:1});
        txt(String(M[r][c]), 83+c*48, 119+r*48, {mono:true, a:"center", s:16, w:600});
      }
      arrow(270, 186, 340, 186, C.gold); txt("max", 305, 176, {a:"center", s:12, c:C.goldD});
      const out = [[6,4],[8,9]];
      for (let r=0;r<2;r++) for (let c=0;c<2;c++){
        const w=r*2+c; rect(360+c*56, 138+r*56, 52, 52, {f: w<=active ? cols[w] : "#fff", s: sc[w], r:4, lw:2});
        if (w<=active) txt(String(out[r][c]), 386+c*56, 171+r*56, {mono:true, a:"center", s:18, w:700});
      }
      txt("4×4 → 2×2", 418, 278, {a:"center", mono:true, s:12.5, c:C.muted});
      txt("✓ halves H and W", 520, 150, {s:13, c:C.sage, w:600}); txt("✓ zero parameters", 520, 175, {s:13, c:C.sage, w:600});
      txt("✓ small-shift invariance", 520, 200, {s:13, c:C.sage, w:600}); txt("✗ loses exact position", 520, 225, {s:13, c:C.rust, w:600});
    } else if (ci === 5){
      heading("A hierarchy of features", "Deeper layers combine simpler patterns into object parts");
      const L = [["Layer 1","edges, colours"],["Layer 2","textures, corners"],["Layer 3","patterns, motifs"],["Layer 5","parts: eyes, wheels"]];
      L.forEach(([a,b],i)=>{ const x=40+i*168, on = p*4.5 > i;
        rect(x, 95, 148, 150, {f:on?"#fff":C.paper, s:on?C.gold:C.line, r:10, lw:on?2:1});
        ctx.save(); ctx.translate(x+74, 160);
        if (i===0){ for(let k=0;k<5;k++) line(-40+k*20, -30, -30+k*20, 30, C.navy, 2.5); }
        if (i===1){ for(let a1=0;a1<4;a1++) for(let b1=0;b1<4;b1++) rect(-36+a1*18,-36+b1*18,14,14,{f:(a1+b1)%2?C.sky:C.skyL,r:2}); }
        if (i===2){ for(let k=0;k<6;k++) circle(Math.cos(k)*26, Math.sin(k)*26, 8, {s:C.sage, lw:2.5}); }
        if (i===3){ circle(-18,-6,14,{s:C.ink,lw:2.5}); circle(18,-6,14,{s:C.ink,lw:2.5}); circle(-18,-6,5,{f:C.ink}); circle(18,-6,5,{f:C.ink}); }
        ctx.restore();
        txt(a, x+74, 270, {a:"center", s:13, w:600}); txt(b, x+74, 288, {a:"center", s:12, c:C.muted});
        if (i<3) arrow(x+150, 170, x+166, 170, C.gold);
      });
    } else if (ci === 6){
      heading("Output size formula", "Work it out in your head — examiners love asking this");
      const ex = [[32,3,1,1],[224,7,3,2],[64,5,0,1],[28,2,0,2]][Math.floor(t/4)%4];
      const [w,k,pd,st] = ex, o = Math.floor((w-k+2*pd)/st)+1;
      txt("O = ⌊(W − K + 2P) / S⌋ + 1", W/2, 130, {a:"center", mono:true, s:24, w:600, c:C.goldD});
      txt(`W = ${w}   K = ${k}   P = ${pd}   S = ${st}`, W/2, 190, {a:"center", mono:true, s:16, c:C.ink2});
      txt(`⌊(${w} − ${k} + ${2*pd}) / ${st}⌋ + 1 = ${o}`, W/2, 240, {a:"center", mono:true, s:20, w:600});
      formulaBar("params = (K·K·C_in + 1) · C_out");
    }
  },
  /* 2 — Training */
  (ci, p, t) => {
    if (ci === 0){
      heading("The training loop", "Repeat thousands of times");
      const steps = [["Forward","predict ŷ"],["Loss","compare ŷ to y"],["Backward","∂loss/∂w"],["Update","w ← w − η·∇"]];
      const cx = 230, cy = 200, R = 105;
      steps.forEach(([a,b],i)=>{ const ang = -Math.PI/2 + i*Math.PI/2, x = cx+R*Math.cos(ang), y = cy+R*Math.sin(ang);
        const act = Math.floor(t*1.2)%4===i;
        rect(x-58, y-24, 116, 48, {f: act?C.gold:"#fff", s:C.gold, r:10, lw:1.5});
        txt(a, x, y-2, {a:"center", s:13.5, w:600, c: act?"#fff":C.ink}); txt(b, x, y+15, {a:"center", s:11, mono:true, c: act?"#fff":C.muted}); });
      const ang = -Math.PI/2 + (t*1.2%4)*Math.PI/2; circle(cx+(R-42)*Math.cos(ang+0.6), cy+(R-42)*Math.sin(ang+0.6), 5, {f:C.navy});
      txt("Cross-entropy loss", 440, 140, {s:14, w:600}); txt("L = −Σ y·log(p)", 440, 165, {mono:true, s:13, c:C.goldD});
      txt("confident & right → small loss", 440, 195, {s:12.5, c:C.ink2}); txt("confident & wrong → huge loss", 440, 215, {s:12.5, c:C.ink2});
      txt("Optimiser: SGD + momentum, AdamW", 440, 250, {s:12.5, c:C.ink2});
    } else if (ci === 1){
      heading("Train / validation / test split", "Tune on validation, report on test — once");
      const x0=60, w=600; const parts=[["Train 70%",.7,C.gold],["Val 15%",.15,C.sky],["Test 15%",.15,C.navy]]; let x=x0;
      parts.forEach(([n,f,c])=>{ rect(x, 110, w*f-4, 50, {f:c, r:6}); txt(n, x+(w*f-4)/2, 141, {a:"center", s:13, w:600, c:"#fff"}); x+=w*f; });
      txt("Leakage example", 60, 210, {s:14, w:600, c:C.rust});
      rect(60, 225, 600, 70, {f:C.rustL, r:8});
      txt("Patient #17's scans appear in train AND test → the model recognises the patient,", 76, 252, {s:12.5, c:C.ink2});
      txt("not the disease. Split by patient (group), not by image.", 76, 274, {s:12.5, c:C.ink2});
    } else if (ci >= 2 && ci <= 4){
      heading("Diagnosing with loss curves", ci===3 ? "Checkpoint — BatchNorm: train vs eval" : ci===4 ? "Early stopping keeps the best-validation weights" : "Training keeps improving; validation turns up = overfitting");
      const ox=70, oy=300, cw=420, ch=210;
      line(ox, oy-ch, ox, oy, C.line2, 1.5); line(ox, oy, ox+cw, oy, C.line2, 1.5);
      txt("epochs →", ox+cw-50, oy+18, {s:11.5, c:C.muted}); txt("loss", ox-38, oy-ch+10, {s:11.5, c:C.muted});
      const reveal = ci===2 ? ease(p*1.3) : 1;
      const tr = x => 0.1 + 0.85*Math.exp(-x*3.5), va = x => 0.28 + 0.65*Math.exp(-x*4) + Math.max(0, x-0.38)*0.75;
      const Y = v => oy - v*ch;
      [[tr,C.sage,"train"],[va,C.rust,"validation"]].forEach(([f,c,n])=>{ ctx.beginPath(); for(let i=0;i<=100*reveal;i++){ const x=i/100; const px=ox+x*cw, py=Y(f(x)); i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.strokeStyle=c; ctx.lineWidth=2.5; ctx.stroke(); });
      txt("— train", ox+20, oy-ch+6, {s:12, w:600, c:C.sage}); txt("— validation", ox+90, oy-ch+6, {s:12, w:600, c:C.rust});
      if (reveal > 0.45){ const xb=0.38; line(ox+xb*cw, oy-ch+20, ox+xb*cw, oy, C.gold, 1.5, [5,4]); txt("best epoch", ox+xb*cw+6, oy-ch+34, {s:11.5, c:C.goldD, w:600}); }
      if (ci === 3){
        rect(520, 100, 170, 180, {f:C.goldXL, s:C.goldL, r:10});
        txt("BatchNorm", 536, 126, {s:14, w:600});
        txt("train(): batch μ, σ²", 536, 156, {mono:true, s:11.5, c:C.sage}); txt("+ update running avg", 536, 174, {s:11.5, c:C.muted});
        txt("eval(): running μ, σ²", 536, 212, {mono:true, s:11.5, c:C.navy}); txt("deterministic,", 536, 230, {s:11.5, c:C.muted}); txt("works for batch = 1", 536, 248, {s:11.5, c:C.muted});
      } else {
        const tips = ci===4 ? ["more / augmented data","dropout","weight decay (L2)","early stopping","smaller model / transfer"] : ["train ↓ val ↓ : good","train ↓ val ↑ : overfit","both high : underfit"];
        tips.forEach((s,i)=>tag(s, 520, 120+i*32, {f: ci===4?C.sageL:C.goldL, c: ci===4?C.sage:C.goldD}));
      }
    } else {
      heading(ci===5 ? "Accuracy lies on imbalanced data" : "Precision, recall, F1", "1,000 patients, 10 have cancer");
      const M = [["TP","5",C.sageL],["FN","5",C.rustL],["FP","10",C.rustL],["TN","980",C.sageL]];
      txt("predicted +", 175, 98, {a:"center", s:12, c:C.muted}); txt("predicted −", 285, 98, {a:"center", s:12, c:C.muted});
      txt("actual +", 70, 145, {s:12, c:C.muted}); txt("actual −", 70, 225, {s:12, c:C.muted});
      [[0,0,0],[1,0,1],[0,1,2],[1,1,3]].forEach(([c,r,i])=>{ rect(120+c*110, 108+r*80, 104, 74, {f:M[i][2], r:8}); txt(M[i][0], 172+c*110, 136+r*80, {a:"center", s:12, w:600, c:C.ink2}); txt(M[i][1], 172+c*110, 162+r*80, {a:"center", mono:true, s:20, w:600}); });
      const stats = ci===5 ? [["Accuracy","98.5%",C.rust,"looks great…"],["“Always healthy”","99.0%",C.rust,"…catches 0 cancers"]] : [["Precision","5/15 = 33%",C.navy,"TP/(TP+FP)"],["Recall","5/10 = 50%",C.navy,"TP/(TP+FN)"],["F1","40%",C.goldD,"2PR/(P+R)"]];
      stats.forEach(([a,b,c,d],i)=>{ txt(a, 400, 125+i*58, {s:13, w:600}); txt(b, 400, 148+i*58, {mono:true, s:18, w:600, c}); txt(d, 560, 148+i*58, {s:12, mono:true, c:C.muted}); });
    }
  },
  /* 3 — Transfer learning */
  (ci, p, t) => {
    const layers = ["conv1","block1","block2","block3","block4","head"], desc=["edges","textures","patterns","parts","objects","your classes"];
    function stack(frozenUpTo, opts={}){
      layers.forEach((n,i)=>{ const x=40+i*110, y=120, frozen = i < frozenUpTo, isHead = i===layers.length-1;
        const jitter = opts.noise && !frozen ? Math.sin(t*20+i)*2 : 0;
        rect(x, y+jitter, 96, 110, {f: isHead ? C.gold : frozen ? C.navyL : C.goldL, s: isHead ? C.goldD : frozen ? C.navy : C.gold, r:10, lw:1.5});
        txt(n, x+48, y+42+jitter, {a:"center", s:13, w:600, c: isHead?"#fff":C.ink});
        txt(desc[i], x+48, y+62+jitter, {a:"center", s:11.5, c: isHead?"#fff":C.muted});
        txt(frozen ? "❄ frozen" : "trainable", x+48, y+92+jitter, {a:"center", s:11.5, w:600, c: isHead?"#fff": frozen?C.navy:C.goldD});
        if (opts.lr) { const h = 8 + i*14; rect(x+28, 300-h, 40, h, {f:C.gold, r:3}); txt(opts.lr[i], x+48, 318, {a:"center", mono:true, s:11, c:C.ink2}); }
        if (i<layers.length-1) arrow(x+97, y+55, x+108, y+55, C.line2);
      });
    }
    if (ci === 0){
      heading("Reuse what a big model already learned", "Source: ImageNet (1.28M images, 1,000 classes) → Target: your small dataset");
      rect(60, 110, 230, 150, {f:C.skyL, s:C.sky, r:12}); txt("ImageNet", 175, 150, {a:"center", s:16, w:600, c:C.sky}); txt("1.28M photos", 175, 175, {a:"center", s:12.5, c:C.ink2});
      for(let i=0;i<24;i++) rect(80+(i%8)*25, 195+Math.floor(i/8)*18, 20, 14, {f:`hsl(${i*15},40%,${70-(i%3)*8}%)`, r:2});
      const e=ease(p*1.5); arrow(300, 185, 300+120*e, 185, C.gold, 2.5); txt("pretrained weights", 360, 172, {a:"center", s:12, c:C.goldD, w:600});
      rect(430, 110, 230, 150, {f:C.goldXL, s:C.gold, r:12}); txt("Your task", 545, 150, {a:"center", s:16, w:600, c:C.goldD}); txt("500 chest X-rays", 545, 175, {a:"center", s:12.5, c:C.ink2});
      for(let i=0;i<6;i++) rect(470+i*26, 200, 20, 26, {f:`rgb(${60+i*12},${60+i*12},${70+i*12})`, r:2});
    } else if (ci === 1){ heading("Early layers are general, late layers are specific", "Edges and textures are useful for almost any image"); stack(0); }
    else if (ci === 2 || ci === 3){ heading(ci===2?"Feature extraction: freeze the backbone":"Freeze vs fine-tune", ci===3?"Checkpoint — what is catastrophic forgetting?":"for p in backbone.parameters(): p.requires_grad = False"); stack(5);
      const x = 40 + 5*110 + 48; for(let i=0;i<3;i++){ const yy = 250 + ((t*40 + i*20) % 60); txt("∇", x, yy, {a:"center", s:14, w:700, c:C.goldD}); }
      txt("gradients only update the head", 560+48, 345-16, {a:"center", s:11.5, c:C.goldD}); }
    else if (ci === 4){ heading("Catastrophic forgetting", "High learning rate → big noisy updates scramble the pretrained features"); stack(0, {noise:true});
      rect(40, 270, 640, 40, {f:C.rustL, r:8}); txt("lr = 1e-2 on everything → general edge/texture filters are overwritten", 360, 295, {a:"center", s:12.5, c:C.rust, w:600}); }
    else if (ci === 5){ heading("Discriminative learning rates", "Tiny steps for early layers, bigger for the head — unfreeze top-down"); stack(0, {lr:["1e-6","1e-5","1e-5","1e-4","1e-4","1e-3"]}); }
    else {
      heading("Foundation models as backbones", "Self-supervised features (DINOv2, CLIP) + a light head for many tasks");
      rect(270, 140, 180, 80, {f:C.gold, r:12}); txt("Foundation model", 360, 177, {a:"center", s:14, w:600, c:"#fff"}); txt("frozen features", 360, 197, {a:"center", s:12, c:"#fff"});
      const tasks=[["classify",120,120],["segment",120,250],["depth",560,120],["retrieve",560,250],["detect",330,320]];
      tasks.forEach(([n,x,y])=>{ arrow(360+(x-330)*0.3, 180+(y-180)*0.3, x+30-(x-330)*0.12, y-6-(y-180)*0.12, C.line2); tag(n, x, y); });
    }
  },
  /* 4 — Detection */
  (ci, p, t) => {
    function scene(x=40, y=80, w=360, h=240){
      rect(x, y, w, h, {f:"#F3EEE2", r:8});
      rect(x, y+h*0.72, w, h*0.28, {f:"#E4DCC9", r:0});
      rect(x+40, y+120, 150, 55, {f:C.sky, r:12}); rect(x+70, y+95, 90, 35, {f:C.sky, r:10}); circle(x+75, y+178, 16, {f:C.ink}); circle(x+160, y+178, 16, {f:C.ink});
      circle(x+275, y+70, 16, {f:C.rust}); rect(x+258, y+88, 34, 70, {f:C.rust, r:8}); rect(x+262, y+156, 10, 40, {f:C.rust, r:3}); rect(x+278, y+156, 10, 40, {f:C.rust, r:3});
      return {car:[x+30, y+88, 172, 108], person:[x+250, y+50, 50, 150]};
    }
    function box(b, label, c=C.gold, lw=2.5, dash){ rect(b[0], b[1], b[2], b[3], {s:c, lw, r:3, dash}); if (label){ tag(label, b[0], b[1]-6, {f:c, c:"#fff"}); } }
    if (ci === 0){
      heading("Detection = what + where", "One class, confidence and box per object");
      const o = scene(); const e = ease(p*2);
      if (e>0.2) box(o.car, "car 0.94", C.gold); if (e>0.6) box(o.person, "person 0.91", C.navy);
      txt("box = (x, y, w, h)", 440, 130, {mono:true, s:15, w:600, c:C.goldD});
      txt("classification: “car”  (one label)", 440, 175, {s:13, c:C.ink2});
      txt("detection: every object + location", 440, 200, {s:13, c:C.ink2});
      txt("output per box: class, score, 4 coords", 440, 225, {s:13, c:C.ink2});
    } else if (ci === 1){
      heading("Two-stage: Faster R-CNN", "Propose regions first, then classify each");
      const st = [["Image",C.skyL,C.sky],["Backbone CNN",C.navyL,C.navy],["RPN proposals",C.goldL,C.goldD],["RoI head",C.goldL,C.goldD],["Boxes + classes",C.sageL,C.sage]];
      st.forEach(([n,f,c],i)=>{ const x=30+i*136, on = p*6 > i; rect(x, 150, 116, 64, {f:on?f:"#fff", s:c, r:10}); txt(n, x+58, 187, {a:"center", s:12.5, w:600, c}); if(i<4) arrow(x+118, 182, x+134, 182, C.line2); });
      txt("~2,000 → ~300 candidate regions, each pooled to a fixed size (RoIAlign)", 360, 260, {a:"center", s:12.5, c:C.muted});
      txt("accurate · slower", 360, 285, {a:"center", s:12.5, w:600, c:C.goldD});
    } else if (ci === 2){
      heading("One-stage: YOLO", "Split the image into an S×S grid; each cell predicts boxes + classes in one pass");
      const o = scene(); const S=6, cw=360/S, chh=240/S;
      for (let i=0;i<=S;i++){ line(40+i*cw, 80, 40+i*cw, 320, "rgba(34,48,74,.25)", 1); line(40, 80+i*chh, 400, 80+i*chh, "rgba(34,48,74,.25)", 1); }
      const cc = [40+2*cw, 80+3*chh]; rect(cc[0], cc[1], cw, chh, {f:"rgba(176,141,60,.3)", s:C.gold, lw:2, r:0});
      circle(o.car[0]+o.car[2]/2, o.car[1]+o.car[3]/2, 4, {f:C.gold});
      box(o.car, "car", C.gold, 2.5);
      txt("the cell containing the object's", 440, 140, {s:13, c:C.ink2}); txt("centre is responsible for it", 440, 160, {s:13, c:C.ink2});
      txt("single forward pass → real-time", 440, 200, {s:13, w:600, c:C.goldD});
      txt("YOLO, SSD, RetinaNet, RT-DETR", 440, 230, {s:12.5, mono:true, c:C.muted});
    } else if (ci === 3 || ci === 4){
      heading("Intersection over Union", ci===3 ? "Checkpoint — explain NMS and define IoU" : "How much do two boxes agree? 0 = no overlap, 1 = identical");
      const dx = 50 + 70*Math.sin(t*0.7);
      const A=[100,110,180,150], B=[100+dx,130,180,150];
      const ix1=Math.max(A[0],B[0]), iy1=Math.max(A[1],B[1]), ix2=Math.min(A[0]+A[2],B[0]+B[2]), iy2=Math.min(A[1]+A[3],B[1]+B[3]);
      const iw=Math.max(0,ix2-ix1), ih=Math.max(0,iy2-iy1), inter=iw*ih, uni=A[2]*A[3]*2-inter, iou=inter/uni;
      rect(A[0],A[1],A[2],A[3],{f:"rgba(34,48,74,.08)", s:C.navy, lw:2, r:2}); rect(B[0],B[1],B[2],B[3],{f:"rgba(176,141,60,.08)", s:C.gold, lw:2, r:2});
      if (iw>0&&ih>0) rect(ix1,iy1,iw,ih,{f:"rgba(176,141,60,.45)", r:0});
      txt("A", A[0]+8, A[1]+18, {w:700, c:C.navy}); txt("B", B[0]+B[2]-18, B[1]+B[3]-8, {w:700, c:C.goldD});
      txt("IoU = overlap / union", 480, 140, {s:15, w:600});
      txt(`= ${inter.toFixed(0)} / ${uni.toFixed(0)}`, 480, 175, {mono:true, s:14, c:C.ink2});
      txt(`= ${iou.toFixed(2)}`, 480, 215, {mono:true, s:26, w:600, c: iou>=0.5?C.sage:C.rust});
      txt(iou>=0.5 ? "≥ 0.5 → counts as a match" : "< 0.5 → not a match", 480, 245, {s:12.5, c:C.muted});
    } else if (ci === 5){
      heading("Non-Maximum Suppression", "Keep the most confident box, delete its overlapping duplicates, repeat");
      const o = scene();
      const cands = [[o.car[0]-6,o.car[1]-4,o.car[2]+12,o.car[3]+8,0.81],[o.car[0]+10,o.car[1]+6,o.car[2]-8,o.car[3]-4,0.72],[o.car[0],o.car[1],o.car[2],o.car[3],0.94],[o.person[0]-4,o.person[1]+4,o.person[2]+8,o.person[3]-6,0.91],[o.person[0]+3,o.person[1]-6,o.person[2]-2,o.person[3]+6,0.67]];
      const stage = Math.floor(p*5.5);
      cands.forEach((b,i)=>{ const isWinner = i===2||i===3; const removed = !isWinner && stage >= (i<2?2:3);
        if (removed) return; box(b, stage>=1 ? b[4].toFixed(2) : "", isWinner && stage>=1 ? (i===2?C.gold:C.navy) : C.muted, isWinner&&stage>=1?2.8:1.4, isWinner&&stage>=1?null:[5,4]); });
      const steps = ["1. drop boxes with score < 0.25","2. sort: 0.94, 0.91, 0.81, 0.72, 0.67","3. keep 0.94 → remove car boxes IoU > 0.5","4. keep 0.91 → remove person dupes","5. done: one box per object"];
      steps.forEach((s,i)=>txt(s, 430, 120+i*30, {s:12.5, w: i===Math.min(stage,4)?600:400, c: i<=stage ? C.ink : C.line2}));
    } else {
      heading("Evaluation & class imbalance", "mAP for evaluation · focal loss for training");
      txt("mAP@0.5:0.95 — average precision over classes", 40, 110, {s:13.5, w:600}); txt("and IoU thresholds 0.5 … 0.95 (COCO)", 40, 130, {s:13, c:C.ink2});
      const ox=60, oy=292, cw=300, ch=135;
      line(ox, oy-ch, ox, oy, C.line2); line(ox, oy, ox+cw, oy, C.line2); txt("p (true class)", ox+cw-80, oy+16, {s:11, c:C.muted});
      [[0,C.sky,"CE (γ=0)"],[2,C.gold,"focal γ=2"]].forEach(([g,c,n],k)=>{ ctx.beginPath(); for(let i=1;i<=100;i++){ const pp=i/100, v=-Math.pow(1-pp,g)*Math.log(pp); const x=ox+pp*cw, y=oy-Math.min(1,v/3)*ch; i>1?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.strokeStyle=c; ctx.lineWidth=2.5; ctx.stroke(); txt(n, ox+cw+12, oy-ch+20+k*20, {s:12, w:600, c}); });
      txt("easy, confident examples (p → 1)", 440, 230, {s:12.5, c:C.ink2}); txt("contribute ~0 loss with focal loss", 440, 250, {s:12.5, c:C.ink2});
      formulaBar("FL(p_t) = −α (1 − p_t)^γ · log(p_t)");
    }
  },
  /* 5 — Segmentation */
  (ci, p, t) => {
    const n=12, cs=18;
    const shapeA=(r,c)=>Math.hypot(r-6,c-4)<3.4, shapeB=(r,c)=>Math.hypot(r-5,c-8.5)<2.8;
    if (ci === 0){
      heading("A label for every pixel", "Dense prediction: output has the same H × W as the input");
      grid(60, 90, n, cs, (r,c)=>shapeA(r,c)||shapeB(r,c)?120:225, {colorFn:(v,r,c)=> shapeA(r,c)?"#C7A86B":shapeB(r,c)?"#9AA7BD":"#F1ECE0"});
      arrow(290, 198, 360, 198, C.gold);
      const k = Math.floor(ease(p*1.4)*n*n);
      for (let r=0;r<n;r++) for (let c=0;c<n;c++){ const idx=r*n+c; const col = idx>k ? "#fff" : (shapeA(r,c)||shapeB(r,c)) ? C.gold : C.skyL; ctx.fillStyle=col; ctx.fillRect(390+c*cs, 90+r*cs, cs-1, cs-1); }
      txt("class map", 390+n*cs/2, 330, {a:"center", s:12, c:C.muted}); txt("image", 60+n*cs/2, 330, {a:"center", s:12, c:C.muted});
    } else if (ci === 1 || ci === 2){
      heading(ci===1?"Semantic vs instance":"Panoptic = things + stuff", ci===1 ? "Semantic: both sheep share one label · Instance: sheep 1 vs sheep 2" : "Things get instance IDs; stuff (sky, ground) gets a class");
      const panels = [["semantic",(r,c)=>shapeA(r,c)||shapeB(r,c)?C.gold:null],["instance",(r,c)=>shapeA(r,c)?C.gold:shapeB(r,c)?C.navy:null],["panoptic",(r,c)=>shapeA(r,c)?C.gold:shapeB(r,c)?C.navy:r<4?C.skyL:"#DCD3BF"]];
      panels.forEach(([nm,fn],i)=>{ const x=40+i*228; const on = ci===2 || i<2; ctx.globalAlpha = on?1:0.3;
        for(let r=0;r<n;r++) for(let c=0;c<n;c++){ ctx.fillStyle = fn(r,c) || "#F6F2E9"; ctx.fillRect(x+c*cs*0.95, 92+r*cs*0.95, cs*0.95-1, cs*0.95-1); }
        ctx.globalAlpha=1; txt(nm, x+n*cs*0.475, 325, {a:"center", s:13, w:600, c: on?C.ink:C.line2}); });
    } else if (ci >= 3 && ci <= 5){
      heading("U-Net: encoder, decoder, skip connections", ci===3 ? "Checkpoint — what do the skips do?" : ci===4 ? "Encoder: smaller maps, richer meaning — loses WHERE" : "Skips copy high-res detail across and concatenate");
      const lv = [[40,90,40,80],[90,150,34,60],[140,205,28,42]], bott=[300,250,120,36];
      lv.forEach(([x,y,w,h],i)=>{ rect(x, y, 90-i*8, h, {f:C.navyL, s:C.navy, r:6}); txt(`${224>>i}²`, x+(90-i*8)/2, y+h/2+4, {a:"center", mono:true, s:11, c:C.navy}); });
      rect(...bott, {f:C.navy, r:8}); txt("bottleneck 28²", 360, 273, {a:"center", s:12, w:600, c:"#fff"});
      lv.forEach(([x,y,w,h],i)=>{ const dx = W - x - (90-i*8); rect(dx, y, 90-i*8, h, {f:C.goldL, s:C.gold, r:6}); txt(`${224>>i}²`, dx+(90-i*8)/2, y+h/2+4, {a:"center", mono:true, s:11, c:C.goldD}); });
      arrow(180, 247, 296, 262, C.navy); arrow(424, 262, W-182, 247, C.gold);
      if (ci !== 4) lv.forEach(([x,y,w,h],i)=>{ const x1=x+(90-i*8), x2=W-x-(90-i*8), yy=y+h/2; line(x1+4, yy, x2-4, yy, C.gold, 2, [6,5]);
        const fx = x1 + ((t*80 + i*40) % (x2-x1)); circle(fx, yy, 4, {f:C.gold}); });
      txt("encoder ↓ (what)", 90, 330, {s:12.5, w:600, c:C.navy}); txt("decoder ↑ (where)", W-200, 330, {s:12.5, w:600, c:C.goldD});
    } else {
      heading("IoU and Dice for masks", "Compare predicted mask P with ground truth G");
      const d = 40 + 30*Math.sin(t*0.8);
      ctx.globalAlpha=.55; circle(200, 200, 80, {f:C.navy}); circle(200+d, 200, 80, {f:C.gold}); ctx.globalAlpha=1;
      txt("G", 150, 205, {w:700, c:"#fff", s:16}); txt("P", 250+d, 205, {w:700, c:"#fff", s:16});
      const r=80, dd=Math.abs(d); const inter = dd>=2*r?0: 2*r*r*Math.acos(dd/(2*r)) - (dd/2)*Math.sqrt(4*r*r-dd*dd); const A=Math.PI*r*r;
      const iou = inter/(2*A-inter), dice = 2*inter/(2*A);
      txt("IoU = |P∩G| / |P∪G|", 440, 140, {mono:true, s:14, w:600}); txt(iou.toFixed(2), 440, 172, {mono:true, s:24, w:600, c:C.navy});
      txt("Dice = 2|P∩G| / (|P|+|G|)", 440, 220, {mono:true, s:14, w:600}); txt(dice.toFixed(2), 440, 252, {mono:true, s:24, w:600, c:C.goldD});
      txt("Dice = 2·IoU / (1 + IoU) ≥ IoU", 440, 290, {s:12.5, c:C.muted});
    }
  },
  /* 6 — ViT + multimodal */
  (ci, p, t) => {
    const pcol = (i) => `hsl(${(i*37)%360},38%,${62+(i%3)*6}%)`;
    if (ci === 0){
      heading("Cut the image into patches", "224×224 image, 16×16 patches → 14×14 = 196 patches (shown 4×4 here)");
      const e = ease(p*1.5), gap = 10*e;
      for (let r=0;r<4;r++) for (let c=0;c<4;c++) rect(80+c*(48+gap), 90+r*(48+gap), 48, 48, {f:pcol(r*4+c), r:2});
      txt("N = (H/P) × (W/P)", 470, 150, {mono:true, s:16, w:600, c:C.goldD}); txt("= (224/16)² = 196", 470, 180, {mono:true, s:15, c:C.ink2});
      txt("each patch = 16·16·3 = 768 numbers", 470, 220, {s:13, c:C.ink2});
    } else if (ci === 1){
      heading("Patches become tokens", "Flatten → linear projection → add position embedding; prepend [CLS]");
      const k = Math.floor(ease(p*1.4)*10);
      rect(40, 160, 62, 60, {f:C.gold, r:8}); txt("[CLS]", 71, 195, {a:"center", mono:true, s:12, w:600, c:"#fff"});
      for (let i=0;i<9;i++){ const on = i<k; rect(112+i*62, 160, 54, 60, {f: on?pcol(i):"#fff", s:C.line2, r:8}); if(on){ txt(`p${i+1}`, 139+i*62, 187, {a:"center", mono:true, s:11, w:600}); txt(`+pos${i+1}`, 139+i*62, 205, {a:"center", mono:true, s:9.5, c:C.ink2}); } }
      txt("…197 tokens of dimension D (768 in ViT-Base) → Transformer encoder", W/2, 270, {a:"center", s:13, c:C.ink2});
    } else if (ci === 2 || ci === 3){
      heading("Self-attention: every patch sees every patch", ci===3 ? "Checkpoint — why do ViTs need so much data?" : "Query patch (gold) attends most to related patches");
      const q = Math.floor(t/2.5)%16, qr=Math.floor(q/4), qc=q%4;
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){ const x=80+c*56, y=90+r*56; rect(x, y, 50, 50, {f:pcol(r*4+c), r:3}); }
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){ if (r===qr&&c===qc) continue; const w = Math.exp(-((r-qr)**2+(c-qc)**2)/3) * (0.4+0.6*Math.abs(Math.sin(r*3+c))); line(80+qc*56+25, 90+qr*56+25, 80+c*56+25, 90+r*56+25, `rgba(176,141,60,${0.15+0.8*w})`, 1+4*w); }
      rect(80+qc*56, 90+qr*56, 50, 50, {s:C.gold, lw:3.5, r:3});
      txt("Attention(Q,K,V) =", 380, 140, {mono:true, s:14, w:600}); txt("softmax(QKᵀ / √d) · V", 380, 166, {mono:true, s:15, w:600, c:C.goldD});
      txt("global from layer 1 · cost ∝ N²", 380, 205, {s:13, c:C.ink2});
      if (ci===3) txt("no built-in locality → must learn it", 380, 235, {s:13, w:600, c:C.rust});
    } else if (ci === 4){
      heading("Inductive bias: CNN vs ViT", "Built-in assumptions trade flexibility for data efficiency");
      txt("CNN: local 3×3 window", 80, 100, {s:13.5, w:600, c:C.navy}); txt("ViT: global attention", 420, 100, {s:13.5, w:600, c:C.goldD});
      for (let r=0;r<6;r++) for (let c=0;c<6;c++){ const inW = Math.abs(r-2.5)<=1.5&&Math.abs(c-2.5)<=1.5&&r>0&&c>0&&r<5&&c<5 && r>=2&&r<=4&&c>=2&&c<=4; rect(80+c*34, 115+r*34, 32, 32, {f: inW?C.navy:C.navyL, r:3}); rect(420+c*34, 115+r*34, 32, 32, {f:C.gold, r:3}); }
      txt("strong bias → efficient with less data", 80, 340, {s:12, c:C.ink2}); txt("weak bias → needs huge data, scales better", 420, 340, {s:12, c:C.ink2});
    } else {
      heading(ci===5 ? "CLIP: contrastive image–text training" : "CLIP zero-shot classification", ci===5 ? "400M (image, caption) pairs · matching pairs pulled together" : "Pick the prompt with the highest cosine similarity");
      rect(40, 100, 110, 90, {f:"#EADFC6", r:8}); circle(85, 150, 22, {f:"#B88A4A"}); circle(70,128,8,{f:"#9C6F35"}); circle(100,128,8,{f:"#9C6F35"});
      arrow(155, 145, 195, 145); rect(200, 115, 110, 60, {f:C.navy, r:10}); txt("image enc.", 255, 150, {a:"center", s:12, w:600, c:"#fff"});
      const prompts = ["a photo of a dog","a photo of a cat","a photo of a car"], sims = [0.31, 0.24, 0.12];
      const e = ease(p*1.6);
      prompts.forEach((pr,i)=>{ const y=230+i*36; txt(`“${pr}”`, 40, y+5, {s:12.5, mono:true}); arrow(205, y, 225, y, C.line2); rect(230, y-14, 80, 26, {f:C.goldL, r:6}); txt("text enc.", 270, y+4, {a:"center", s:11, w:600, c:C.goldD});
        const bw = 200*sims[i]/0.31*e; rect(400, y-10, bw, 20, {f: i===0?C.gold:C.line2, r:4}); txt(`cos ${sims[i].toFixed(2)}`, 410+bw, y+5, {mono:true, s:11.5, c:C.ink2}); });
      txt("similarity to the image embedding", 400, 210, {s:12, c:C.muted});
      if (ci===6 && e>0.9) tag("prediction: dog", 400, 140, {f:C.sage, c:"#fff"});
    }
  },
  /* 7 — Video + tracking */
  (ci, p, t) => {
    if (ci === 0){
      heading("Video is a stack of frames", "shape (T, H, W, C) · consecutive frames are nearly identical");
      for (let i=6;i>=0;i--){ const x=60+i*30, y=90+i*16; rect(x, y, 200, 130, {f:"#fff", s:C.line2, r:6}); circle(x+60+i*10+8*Math.sin(t), y+70, 18, {f:i===0?C.gold:C.goldL}); }
      txt("T = 7 frames", 500, 140, {mono:true, s:15, w:600, c:C.goldD}); txt("30 fps → 1,800 frames / min", 500, 168, {s:12.5, c:C.ink2}); txt("neighbouring frames ≈ identical", 500, 196, {s:12.5, c:C.ink2}); txt("→ exploit redundancy", 500, 214, {s:12.5, c:C.ink2});
      return;
    }
    const sx=40, sy=80, sw=420, sh=240;
    rect(sx, sy, sw, sh, {f:"#F3EEE2", r:8});
    const ph = (t*0.35) % 1;
    const A = {x: sx+30 + ph*320, y: sy+60}, B = {x: sx+350 - ph*320, y: sy+120};
    const occl = ci===5; const occX = sx+170;
    if (occl) rect(occX, sy+30, 70, 200, {f:"#CFC6B2", r:6});
    const hiddenA = occl && A.x+20>occX && A.x<occX+70, hiddenB = occl && B.x+20>occX && B.x<occX+70;
    if (!hiddenA) { circle(A.x+18, A.y+15, 10, {f:C.sky}); rect(A.x+6, A.y+26, 24, 40, {f:C.sky, r:6}); }
    if (!hiddenB) { circle(B.x+18, B.y+15, 10, {f:C.rust}); rect(B.x+6, B.y+26, 24, 40, {f:C.rust, r:6}); }
    const crossed = ph > 0.5;
    const idA = (ci===5 && crossed) ? "ID 2" : "ID 1", idB = (ci===5 && crossed) ? "ID 1" : "ID 2";
    if (ci >= 1){
      if (!hiddenA){ rect(A.x, A.y, 36, 70, {s:C.navy, lw:2, r:3}); tag(idA, A.x, A.y-6, {f:C.navy, c:"#fff"}); }
      if (!hiddenB){ rect(B.x, B.y, 36, 70, {s:C.goldD, lw:2, r:3}); tag(idB, B.x, B.y-6, {f:C.gold, c:"#fff"}); }
    }
    if (ci === 2 || ci === 3){
      rect(A.x+26, A.y, 36, 70, {s:C.navy, lw:1.5, r:3, dash:[5,4]}); arrow(A.x+36, A.y+80, A.x+62, A.y+80, C.navy);
      rect(B.x-26, B.y, 36, 70, {s:C.goldD, lw:1.5, r:3, dash:[5,4]}); arrow(B.x, B.y+80, B.x-26, B.y+80, C.goldD);
    }
    const rx = 490;
    if (ci === 1){ heading("Tracking-by-detection", "Detect in every frame, then link detections into tracks");
      ["1. detector → boxes per frame","2. predict where tracks move","3. match predictions ↔ detections","4. update / create / delete tracks"].forEach((s,i)=>txt(s, rx, 120+i*30, {s:12.5, c:C.ink2})); }
    if (ci === 2 || ci === 3){ heading("Kalman filter: predict, then update", ci===3 ? "Checkpoint — Hungarian algorithm & DeepSORT" : "Dashed box = predicted position (constant velocity)");
      txt("state = [x, y, s, r, ẋ, ẏ, ṡ]", rx, 120, {mono:true, s:12, c:C.goldD}); txt("predict: x̂ = x + ẋ·Δt", rx, 150, {mono:true, s:12}); txt("update: blend prediction", rx, 180, {s:12.5, c:C.ink2}); txt("with the matched detection", rx, 198, {s:12.5, c:C.ink2}); }
    if (ci === 4){ heading("Hungarian matching", "Optimal one-to-one assignment on cost = 1 − IoU");
      const M=[[0.1,0.9],[0.85,0.2]];
      [["","det a","det b"],["trk 1",M[0][0],M[0][1]],["trk 2",M[1][0],M[1][1]]].forEach((row,r)=>row.forEach((v,c)=>{ const x=rx+c*68, y=110+r*40; if(r&&c){ rect(x, y, 62, 34, {f: v<0.5?C.goldL:"#fff", s:C.line2, r:4}); } txt(String(v), x+31, y+22, {a:"center", mono:true, s:12.5, w: v<0.5&&r&&c?700:500}); }));
      txt("min total cost: 1→a, 2→b", rx, 250, {s:12.5, w:600, c:C.sage}); }
    if (ci === 5){ heading("Occlusion → ID switch", "SORT uses motion only; DeepSORT adds appearance");
      txt(crossed ? "SORT: IDs swapped ✗" : "objects about to cross…", rx, 130, {s:13, w:600, c: crossed?C.rust:C.ink2});
      txt("DeepSORT: re-ID embedding", rx, 175, {s:13, w:600, c:C.sage}); txt("cost = λ·motion + (1−λ)·appearance", rx, 198, {mono:true, s:10.5, c:C.ink2});
      rect(rx, 215, 26, 26, {f:C.sky, r:4}); rect(rx+32, 215, 26, 26, {f:C.rust, r:4}); txt("kept apart", rx+66, 233, {s:11.5, c:C.muted}); }
    if (ci === 6){ heading("Optical flow", "A motion vector for every pixel between frames");
      for (let gx=0; gx<9; gx++) for (let gy=0; gy<6; gy++){ const x=sx+25+gx*45, y=sy+25+gy*38; const near=Math.hypot(x-(A.x+18), y-(A.y+40))<60; if (near) arrow(x, y, x+18, y, C.navy, 1.8); else circle(x,y,1.5,{f:C.line2}); }
      txt("RAFT: all-pairs correlation", rx, 130, {s:13, w:600}); txt("+ iterative refinement", rx, 152, {s:12.5, c:C.ink2}); }
  },
  /* 8 — Deployment */
  (ci, p, t) => {
    if (ci === 0){
      heading("From notebook to device", "Real constraints: latency, memory, power, cost");
      rect(40, 130, 140, 100, {f:"#fff", s:C.line2, r:8}); txt("model.ipynb", 110, 185, {a:"center", mono:true, s:12});
      const devs=[["phone","< 30 ms"],["edge camera","~2 W"],["cloud GPU","$/hour"]];
      devs.forEach(([n,c],i)=>{ const y=95+i*70; arrow(185, 180, 330, y+25, C.gold); rect(340, y, 150, 52, {f:C.goldXL, s:C.gold, r:8}); txt(n, 415, y+24, {a:"center", s:13, w:600}); txt(c, 415, y+41, {a:"center", mono:true, s:11, c:C.goldD}); });
    } else if (ci === 1){
      heading("Quantisation & pruning", "Fewer bits per weight, fewer weights");
      const rows=[["FP32",100,"4 bytes",C.navy],["FP16",50,"2 bytes",C.sky],["INT8",25,"1 byte",C.gold]], e=ease(p*1.5);
      rows.forEach(([n,v,b,c],i)=>{ const y=110+i*55; txt(n, 40, y+14, {mono:true, s:14, w:600}); txt(b, 40, y+30, {s:11, c:C.muted}); rect(120, y, 260*(v/100)*e, 30, {f:c, r:5}); txt(`${v} MB`, 128+260*(v/100)*e, y+20, {s:12, mono:true, c:C.ink2}); });
      txt("pruning", 560, 105, {a:"center", s:13, w:600});
      for (let r=0;r<6;r++) for (let c=0;c<6;c++){ const pr = ((r*7+c*3)%5===0) || ((r+c)%4===0); const zero = pr && p>0.4; rect(500+c*20, 120+r*20, 18, 18, {f: zero?"#fff":C.goldL, s: zero?C.line2:C.gold, r:3}); }
      txt("zero out weights that barely matter", 560, 260, {a:"center", s:11.5, c:C.muted});
    } else if (ci === 2){
      heading("Export to an inference runtime", "One trained model, many targets — then benchmark on the real device");
      rect(40, 150, 110, 56, {f:C.navy, r:10}); txt("PyTorch", 95, 183, {a:"center", s:13, w:600, c:"#fff"});
      arrow(155, 178, 215, 178, C.gold); rect(220, 150, 110, 56, {f:C.gold, r:10}); txt("ONNX", 275, 183, {a:"center", s:14, w:700, c:"#fff"});
      [["TensorRT","NVIDIA GPU"],["OpenVINO","Intel CPU"],["TFLite","Android / MCU"],["Core ML","Apple"]].forEach(([a,b],i)=>{ const y=88+i*58; arrow(335, 178, 420, y+22, C.line2); rect(425, y, 150, 46, {f:"#fff", s:C.line2, r:8}); txt(a, 440, y+20, {s:13, w:600}); txt(b, 440, y+37, {s:11, c:C.muted}); });
      txt("measure: latency (p50/p95), throughput, memory, accuracy drop", W/2, 340, {a:"center", s:12, c:C.goldD});
    } else if (ci === 3 || ci === 4){
      heading("Grad-CAM: where did the model look?", ci===3 ? "Checkpoint — Grad-CAM & bias auditing" : "Gradients → channel weights → weighted sum of feature maps → ReLU");
      rect(40, 90, 230, 230, {f:"#EFE8D8", r:8});
      circle(150, 210, 60, {f:"#B88A4A"}); circle(115,165,18,{f:"#9C6F35"}); circle(185,165,18,{f:"#9C6F35"}); circle(130,205,6,{f:C.ink}); circle(170,205,6,{f:C.ink}); rect(220, 270, 40, 30, {f:"#8FA88F", r:4});
      const e = ease(p*1.5);
      const g = ctx.createRadialGradient(150, 200, 5, 150, 200, 95);
      g.addColorStop(0, `rgba(181,82,59,${0.75*e})`); g.addColorStop(0.5, `rgba(176,141,60,${0.45*e})`); g.addColorStop(1, "rgba(176,141,60,0)");
      ctx.fillStyle = g; ctx.fillRect(40, 90, 230, 230);
      const steps = ["1. forward → class score y^c","2. ∂y^c / ∂A^k  (last conv maps)","3. α_k = global-avg-pool of gradients","4. L = ReLU( Σ_k α_k · A^k )","5. upsample & overlay heatmap"];
      steps.forEach((s,i)=>txt(s, 310, 120+i*36, {mono:true, s:12.5, c: i <= Math.floor(p*6) ? C.ink : C.line2, w: i===Math.min(4,Math.floor(p*6))?600:400}));
    } else if (ci === 5){
      heading("Disaggregated evaluation", "Gender Shades (2018): error rate by subgroup, commercial classifiers");
      const g=[["lighter men",0.8],["lighter women",7.1],["darker men",12.0],["darker women",34.7]], e=ease(p*1.5);
      g.forEach(([n,v],i)=>{ const y=105+i*52; txt(n, 40, y+20, {s:13, w:600}); rect(190, y, 420*(v/35)*e, 30, {f: v>20?C.rust:v>5?C.gold:C.sage, r:5}); txt(`${v}%`, 200+420*(v/35)*e, y+20, {mono:true, s:12.5, w:600}); });
      txt("overall accuracy looked high — subgroup metrics revealed the gap", W/2, 335, {a:"center", s:12.5, c:C.ink2});
    } else {
      heading("Adversarial robustness", "Tiny, targeted changes can flip a prediction");
      rect(40, 110, 140, 140, {f:"#EFE8D8", r:8}); circle(110, 180, 40, {f:"#B88A4A"});
      txt("+  ε ·", 210, 186, {mono:true, s:16, w:600});
      for (let i=0;i<14;i++) for (let j=0;j<14;j++){ const v = (Math.sin(i*12.9898+j*78.233+Math.floor(t*4))*43758.5453)%1; ctx.fillStyle=`hsl(${Math.abs(v)*360},45%,60%)`; ctx.fillRect(270+i*10, 110+j*10, 10, 10); }
      txt("=", 430, 186, {mono:true, s:20, w:600});
      rect(460, 110, 140, 140, {f:"#EFE8D8", r:8}); circle(530, 180, 40, {f:"#B88A4A"});
      tag("“panda” 57%", 40, 285, {f:C.sageL, c:C.sage}); tag("“gibbon” 99%", 460, 285, {f:C.rustL, c:C.rust});
      txt("FGSM: x′ = x + ε · sign(∇ₓ loss)", W/2, 330, {a:"center", mono:true, s:12.5, c:C.goldD});
    }
  }
  ],

  labs: [
  { title:"Pixels & normalisation",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Normalise one pixel</h3>
        <p class="small muted">Exactly what <code>ToTensor()</code> + <code>Normalize()</code> do to a single value.</p>
        <div class="field"><span>Channel</span><select id="l0-ch"><option value="0">Red (μ 0.485, σ 0.229)</option><option value="1">Green (μ 0.456, σ 0.224)</option><option value="2">Blue (μ 0.406, σ 0.225)</option></select></div>
        <div class="field"><div class="range-head"><span>Raw pixel value</span><output id="l0-vo">128</output></div><input type="range" id="l0-v" min="0" max="255" value="128"></div>
        <div class="result"><div class="k">Normalised value</div><div class="v" id="l0-out"></div><div class="s" id="l0-work"></div></div>
        <pre class="code"><span class="k">from</span> torchvision <span class="k">import</span> transforms
tf = transforms.Compose([
    transforms.ToTensor(),   <span class="c"># HWC uint8 [0,255] → CHW float [0,1]</span>
    transforms.Normalize(mean=[<span class="s">0.485, 0.456, 0.406</span>],
                         std=[<span class="s">0.229, 0.224, 0.225</span>]),
])</pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Brightness, contrast & grayscale</h3>
        <canvas id="l0-cv" class="lab-canvas" width="320" height="200"></canvas>
        <div class="field"><div class="range-head"><span>Brightness (add)</span><output id="l0-bo">0</output></div><input type="range" id="l0-b" min="-100" max="100" value="0"></div>
        <div class="field"><div class="range-head"><span>Contrast (multiply)</span><output id="l0-co">1.0</output></div><input type="range" id="l0-c" min="0.2" max="2.5" step="0.1" value="1"></div>
        <label class="row small"><input type="checkbox" id="l0-g"> Grayscale: Y = 0.299R + 0.587G + 0.114B</label>
        <div class="small muted" id="l0-stat"></div>
      </div>
    </div>`,
    init(){
      const M=[0.485,0.456,0.406], S=[0.229,0.224,0.225];
      const upd = () => { const ch=+$("l0-ch").value, v=+$("l0-v").value, x=v/255, n=(x-M[ch])/S[ch];
        $("l0-vo").textContent=v; $("l0-out").textContent=n.toFixed(3); $("l0-work").textContent=`(${v}/255 − ${M[ch]}) / ${S[ch]} = (${x.toFixed(3)} − ${M[ch]}) / ${S[ch]}`; };
      ["l0-ch","l0-v"].forEach(id=>$(id).oninput=upd); upd();
      const cv=$("l0-cv"), g=cv.getContext("2d");
      const base=(x,y)=>{ const r=170+60*Math.sin(x/30), gg=120+80*Math.cos(y/25), b=90+70*Math.sin((x+y)/40); return [r,gg,b]; };
      const draw = () => { const b=+$("l0-b").value, c=+$("l0-c").value, gs=$("l0-g").checked; $("l0-bo").textContent=b; $("l0-co").textContent=c.toFixed(1);
        const img=g.createImageData(320,200); let sum=0, clip=0;
        for(let y=0;y<200;y++) for(let x=0;x<320;x++){ let [r,gg,bb]=base(x,y); if (Math.hypot(x-160,y-100)<55){ r=230; gg=190; bb=70; }
          let px=[r,gg,bb].map(v=>(v-128)*c+128+b); if (gs){ const Y=0.299*px[0]+0.587*px[1]+0.114*px[2]; px=[Y,Y,Y]; }
          px=px.map(v=>{ if(v<0||v>255) clip++; return clamp(v,0,255); }); const i=(y*320+x)*4; img.data[i]=px[0]; img.data[i+1]=px[1]; img.data[i+2]=px[2]; img.data[i+3]=255; sum+=(px[0]+px[1]+px[2])/3; }
        g.putImageData(img,0,0); $("l0-stat").textContent=`mean intensity ${(sum/64000).toFixed(1)} · ${(clip/(64000*3)*100).toFixed(1)}% of values clipped to [0, 255]`; };
      ["l0-b","l0-c","l0-g"].forEach(id=>$(id).oninput=draw); draw();
    }
  },
  { title:"Convolution arithmetic",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Output size & parameter count</h3>
        <div class="grid-3" style="grid-template-columns:repeat(3,1fr)">
          <label class="field"><span>Input W</span><input type="number" id="c-w" value="224"></label>
          <label class="field"><span>Kernel K</span><input type="number" id="c-k" value="3"></label>
          <label class="field"><span>Padding P</span><input type="number" id="c-p" value="1"></label>
          <label class="field"><span>Stride S</span><input type="number" id="c-s" value="1"></label>
          <label class="field"><span>C_in</span><input type="number" id="c-ci" value="3"></label>
          <label class="field"><span>C_out</span><input type="number" id="c-co" value="64"></label>
        </div>
        <div class="result"><div class="k">Output tensor</div><div class="v" id="c-out"></div><div class="s" id="c-work"></div></div>
        <div class="stat-row"><div class="stat"><div class="k">Parameters</div><div class="v" id="c-par"></div></div><div class="stat"><div class="k">Multiply-adds</div><div class="v" id="c-mac"></div></div></div>
        <div class="small muted" id="c-par-w"></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Kernel playground</h3>
        <div class="field"><span>Kernel</span><select id="k-sel"><option value="sx">Sobel-x (vertical edges)</option><option value="sy">Sobel-y (horizontal edges)</option><option value="blur">Box blur</option><option value="sharp">Sharpen</option><option value="id">Identity</option></select></div>
        <div class="row" style="align-items:flex-start;gap:16px">
          <div><div class="small muted">input</div><canvas id="k-in" class="lab-canvas" width="160" height="160"></canvas></div>
          <div><div class="small muted">output</div><canvas id="k-out" class="lab-canvas" width="160" height="160"></canvas></div>
          <div><div class="small muted">weights</div><table class="mx" id="k-mx" style="width:auto"></table></div>
        </div>
        <p class="small muted">Click or drag on the input to paint white pixels and watch the output change.</p>
      </div>
    </div>`,
    init(){
      const upd = () => { const w=num("c-w"),k=num("c-k"),p=num("c-p"),s=num("c-s"),ci=num("c-ci"),co=num("c-co");
        if ([w,k,p,s,ci,co].some(isNaN) || s<=0){ $("c-out").textContent="—"; return; }
        const o=Math.floor((w-k+2*p)/s)+1, par=(k*k*ci+1)*co;
        $("c-out").textContent = o>0 ? `${o} × ${o} × ${co}` : "invalid (kernel too big)";
        $("c-work").textContent = `⌊(${w} − ${k} + 2·${p}) / ${s}⌋ + 1 = ${o}`;
        $("c-par").textContent = par.toLocaleString(); $("c-mac").textContent = o>0 ? (o*o*k*k*ci*co).toLocaleString() : "—";
        $("c-par-w").textContent = `(${k}·${k}·${ci} + 1)·${co} — independent of image size, thanks to parameter sharing`; };
      ["c-w","c-k","c-p","c-s","c-ci","c-co"].forEach(id=>$(id).oninput=upd); upd();
      const N=16, img=[...Array(N)].map((_,r)=>[...Array(N)].map((_,c)=> (c>=5&&c<=10&&r>=4&&r<=11) ? 1 : 0));
      const K={sx:[[-1,0,1],[-2,0,2],[-1,0,1]], sy:[[-1,-2,-1],[0,0,0],[1,2,1]], blur:[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]], sharp:[[0,-1,0],[-1,5,-1],[0,-1,0]], id:[[0,0,0],[0,1,0],[0,0,0]]};
      const ci=$("k-in").getContext("2d"), co=$("k-out").getContext("2d"), cs=10;
      const render = () => { const k=K[$("k-sel").value];
        $("k-mx").innerHTML = k.map(r=>`<tr>${r.map(v=>`<td>${Number.isInteger(v)?v:v.toFixed(2)}</td>`).join("")}</tr>`).join("");
        for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const v=img[r][c]*235+20; ci.fillStyle=`rgb(${v},${v},${v})`; ci.fillRect(c*cs,r*cs,cs,cs);
          let s=0; for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const rr=r+i, cc=c+j; s += k[i+1][j+1]*((rr>=0&&rr<N&&cc>=0&&cc<N)?img[rr][cc]:0); }
          const isEdge = $("k-sel").value[0]==="s" && $("k-sel").value!=="sharp";
          const val = isEdge ? clamp(Math.abs(s)/4) : clamp(s);
          if (isEdge){ ctx2(co, c*cs, r*cs, cs, val); } else { const g=val*235+20; co.fillStyle=`rgb(${g},${g},${g})`; co.fillRect(c*cs,r*cs,cs,cs); } } };
      function ctx2(g,x,y,s,v){ g.fillStyle=`rgb(${255-v*79},${253-v*112},${248-v*188})`; g.fillRect(x,y,s,s); }
      let painting=false;
      const paint = e => { const rc=$("k-in").getBoundingClientRect(); const c=Math.floor((e.clientX-rc.left)/rc.width*N), r=Math.floor((e.clientY-rc.top)/rc.height*N); if(r>=0&&r<N&&c>=0&&c<N){ img[r][c]=1; render(); } };
      $("k-in").onpointerdown = e => { painting=true; paint(e); }; $("k-in").onpointermove = e => painting && paint(e); window.addEventListener("pointerup", ()=>painting=false);
      $("k-sel").onchange = render; render();
    }
  },
  { title:"Metrics from a confusion matrix",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Confusion matrix</h3>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>True positives (TP)</span><input type="number" id="m-tp" value="40" min="0"></label>
          <label class="field"><span>False negatives (FN)</span><input type="number" id="m-fn" value="20" min="0"></label>
          <label class="field"><span>False positives (FP)</span><input type="number" id="m-fp" value="10" min="0"></label>
          <label class="field"><span>True negatives (TN)</span><input type="number" id="m-tn" value="930" min="0"></label>
        </div>
        <div class="row"><button class="btn btn-sm" id="m-imb">Load “always negative” model</button><button class="btn btn-sm" id="m-rst">Reset</button></div>
        <div class="stat-row" id="m-stats"></div>
        <div class="small" id="m-note" style="color:var(--ink-2)"></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Read the curves</h3>
        <p class="small muted">Pick a scenario and diagnose it like an examiner would.</p>
        <div class="field"><select id="m-sc"><option value="ok">Healthy training</option><option value="over">Overfitting</option><option value="under">Underfitting</option><option value="lr">Learning rate too high</option></select></div>
        <canvas id="m-cv" class="lab-canvas" width="420" height="220"></canvas>
        <div class="hint" id="m-dx"></div>
      </div>
    </div>`,
    init(){
      const upd = () => { const tp=num("m-tp")||0, fn=num("m-fn")||0, fp=num("m-fp")||0, tn=num("m-tn")||0, n=tp+fn+fp+tn;
        const acc=n?(tp+tn)/n:0, P=tp+fp?tp/(tp+fp):0, R=tp+fn?tp/(tp+fn):0, F=P+R?2*P*R/(P+R):0, spec=tn+fp?tn/(tn+fp):0;
        $("m-stats").innerHTML = [["Accuracy",acc],["Precision",P],["Recall",R],["F1",F],["Specificity",spec]].map(([k,v])=>`<div class="stat"><div class="k">${k}</div><div class="v">${(v*100).toFixed(1)}%</div></div>`).join("");
        $("m-note").textContent = acc>0.9 && R<0.5 ? "High accuracy but low recall: the model is missing most positives — accuracy is misleading here." : `Positives make up ${(100*(tp+fn)/(n||1)).toFixed(1)}% of the data.`; };
      ["m-tp","m-fn","m-fp","m-tn"].forEach(id=>$(id).oninput=upd);
      $("m-imb").onclick=()=>{ $("m-tp").value=0; $("m-fn").value=60; $("m-fp").value=0; $("m-tn").value=940; upd(); };
      $("m-rst").onclick=()=>{ $("m-tp").value=40; $("m-fn").value=20; $("m-fp").value=10; $("m-tn").value=930; upd(); }; upd();
      const g=$("m-cv").getContext("2d");
      const SC={ ok:[x=>0.1+0.85*Math.exp(-x*4), x=>0.18+0.8*Math.exp(-x*3.6), "Both losses fall and level off close together. Good fit — keep the final (or best-validation) checkpoint."],
        over:[x=>0.05+0.9*Math.exp(-x*4.5), x=>0.3+0.6*Math.exp(-x*5)+Math.max(0,x-0.3)*0.9, "Training loss keeps falling while validation rises after ~30% of training: overfitting (high variance). Use augmentation, regularisation, early stopping, or more data."],
        under:[x=>0.62+0.3*Math.exp(-x*3), x=>0.66+0.3*Math.exp(-x*3), "Both losses stay high and close: underfitting (high bias). Use a bigger model, train longer, lower regularisation, or better features."],
        lr:[x=>0.5+0.25*Math.abs(Math.sin(x*30))*(1-x*0.3), x=>0.55+0.28*Math.abs(Math.sin(x*27+1)), "Loss jumps around and never settles: the learning rate is too high. Lower it or use a warm-up + cosine schedule."] };
      const drawC = () => { const [tr,va,dx]=SC[$("m-sc").value]; g.clearRect(0,0,420,220); g.fillStyle="#FFFDF8"; g.fillRect(0,0,420,220);
        g.strokeStyle="#D8CFBA"; g.beginPath(); g.moveTo(40,10); g.lineTo(40,190); g.lineTo(410,190); g.stroke();
        [[tr,"#3E7B5B","train"],[va,"#B5523B","validation"]].forEach(([f,c,n],k)=>{ g.beginPath(); for(let i=0;i<=200;i++){ const x=i/200, px=40+x*370, py=190-clamp(f(x))*170; i?g.lineTo(px,py):g.moveTo(px,py);} g.strokeStyle=c; g.lineWidth=2.2; g.stroke(); g.fillStyle=c; g.font="600 12px Inter"; g.fillText(n, 300, 24+k*16); });
        g.fillStyle="#8A8476"; g.font="11px Inter"; g.fillText("epochs →", 350, 210); g.fillText("loss", 6, 20);
        $("m-dx").textContent = dx; };
      $("m-sc").onchange=drawC; drawC();
    }
  },
  { title:"Freeze or fine-tune?",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Strategy picker</h3>
        <div class="field"><span>Target dataset size</span><select id="t-size"><option value="small">Small (hundreds – few thousand)</option><option value="large">Large (tens of thousands +)</option></select></div>
        <div class="field"><span>Similarity to ImageNet</span><select id="t-sim"><option value="sim">Similar (natural photos)</option><option value="diff">Different (X-rays, satellite, microscopy)</option></select></div>
        <div class="result"><div class="k">Recommended</div><div class="v" style="font-size:19px;font-family:var(--sans)" id="t-rec"></div><div class="s" style="font-family:var(--sans)" id="t-why"></div></div>
        <pre class="code" id="t-code"></pre>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>How many parameters will train?</h3>
        <p class="small muted">ResNet-50: ~23.5M backbone parameters, 2,048-d features into the head.</p>
        <div class="field"><div class="range-head"><span>Number of classes</span><output id="t-co">5</output></div><input type="range" id="t-c" min="2" max="1000" value="5"></div>
        <div class="field"><span>Unfrozen part</span><select id="t-unf"><option value="0">Head only (linear probe)</option><option value="1">Head + layer4 (~15M)</option><option value="2">Everything</option></select></div>
        <div class="stat-row"><div class="stat"><div class="k">Trainable</div><div class="v" id="t-tr"></div></div><div class="stat"><div class="k">Frozen</div><div class="v" id="t-fr"></div></div><div class="stat"><div class="k">% trainable</div><div class="v" id="t-pc"></div></div></div>
      </div>
    </div>`,
    init(){
      const R={ "small-sim":["Freeze backbone, train new head","Little data + familiar features → a linear probe avoids overfitting.","model = resnet50(weights=\"IMAGENET1K_V2\")\nfor p in model.parameters():\n    p.requires_grad = False\nmodel.fc = nn.Linear(2048, num_classes)  # only this trains\nopt = AdamW(model.fc.parameters(), lr=1e-3)"],
        "small-diff":["Head first, then fine-tune top blocks gently","Features don't fully match the domain, but data is scarce: unfreeze only upper layers with a small LR + strong augmentation.","# stage 1: train head (backbone frozen)\n# stage 2: unfreeze layer4\nopt = AdamW([\n  {\"params\": model.layer4.parameters(), \"lr\": 1e-5},\n  {\"params\": model.fc.parameters(),     \"lr\": 1e-4},\n])"],
        "large-sim":["Fine-tune the whole network","Plenty of data → adapt all layers; pretrained weights give a great starting point.","for p in model.parameters():\n    p.requires_grad = True\nopt = AdamW(model.parameters(), lr=1e-4, weight_decay=0.05)\nsched = CosineAnnealingLR(opt, T_max=epochs)"],
        "large-diff":["Fine-tune everything (or even train longer / from a domain model)","Lots of data and a different domain → full fine-tuning with discriminative LRs; consider a domain-specific pretrained model.","opt = AdamW([\n  {\"params\": model.layer1.parameters(), \"lr\": 1e-5},\n  {\"params\": model.layer4.parameters(), \"lr\": 1e-4},\n  {\"params\": model.fc.parameters(),     \"lr\": 1e-3},\n])"] };
      const upd = () => { const [a,b,c]=R[$("t-size").value+"-"+$("t-sim").value]; $("t-rec").textContent=a; $("t-why").textContent=b; $("t-code").textContent=c; };
      $("t-size").onchange=upd; $("t-sim").onchange=upd; upd();
      const up2 = () => { const k=+$("t-c").value, u=+$("t-unf").value, head=2048*k+k, bb=23508032, l4=14964736;
        const tr = head + (u===1?l4:u===2?bb:0), tot=bb+head; $("t-co").textContent=k;
        $("t-tr").textContent=tr.toLocaleString(); $("t-fr").textContent=(tot-tr).toLocaleString(); $("t-pc").textContent=(100*tr/tot).toFixed(2)+"%"; };
      $("t-c").oninput=up2; $("t-unf").onchange=up2; up2();
    }
  },
  { title:"IoU & NMS simulator",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Run NMS yourself</h3>
        <canvas id="n-cv" class="lab-canvas" width="440" height="300"></canvas>
        <div class="field"><div class="range-head"><span>IoU threshold</span><output id="n-io">0.50</output></div><input type="range" id="n-iou" min="0.1" max="0.9" step="0.05" value="0.5"></div>
        <div class="field"><div class="range-head"><span>Confidence threshold</span><output id="n-co">0.30</output></div><input type="range" id="n-conf" min="0" max="0.9" step="0.05" value="0.3"></div>
        <div class="small muted">Solid = kept · dashed = suppressed · faded = below confidence threshold</div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Step-by-step log</h3>
        <ol id="n-log" class="small" style="margin:0;padding-left:18px;line-height:1.8;color:var(--ink-2)"></ol>
        <h3 style="margin-top:6px">Pairwise IoU</h3>
        <table class="mx" id="n-mx"></table>
      </div>
    </div>`,
    init(){
      const B=[{n:"A",b:[60,70,210,220],s:0.95,c:"car"},{n:"B",b:[80,85,230,230],s:0.82,c:"car"},{n:"C",b:[45,60,190,200],s:0.64,c:"car"},{n:"D",b:[260,50,330,250],s:0.91,c:"person"},{n:"E",b:[270,70,345,260],s:0.55,c:"person"},{n:"F",b:[350,180,420,260],s:0.22,c:"dog"}];
      const iou=(a,b)=>{ const x1=Math.max(a[0],b[0]), y1=Math.max(a[1],b[1]), x2=Math.min(a[2],b[2]), y2=Math.min(a[3],b[3]); const i=Math.max(0,x2-x1)*Math.max(0,y2-y1); const u=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-i; return u?i/u:0; };
      $("n-mx").innerHTML = `<tr><th></th>${B.map(b=>`<th>${b.n}</th>`).join("")}</tr>` + B.map(a=>`<tr><th>${a.n}</th>${B.map(b=>`<td class="${a!==b&&a.c===b.c&&iou(a.b,b.b)>0?"hit":""}">${a===b?"—":iou(a.b,b.b).toFixed(2)}</td>`).join("")}</tr>`).join("");
      const g=$("n-cv").getContext("2d"); const col={car:"#B08D3C",person:"#22304A",dog:"#3E7B5B"};
      const run = () => { const th=+$("n-iou").value, ct=+$("n-conf").value; $("n-io").textContent=th.toFixed(2); $("n-co").textContent=ct.toFixed(2);
        const log=[], state={}; const cand=B.filter(b=>{ if (b.s<ct){ state[b.n]="low"; log.push(`Drop ${b.n} (${b.s}) — below confidence ${ct.toFixed(2)}`); return false;} return true; }).sort((a,b)=>b.s-a.s);
        const rest=[...cand];
        while(rest.length){ const top=rest.shift(); state[top.n]="keep"; log.push(`<b>Keep ${top.n}</b> (${top.c}, ${top.s}) — highest remaining`);
          for (let i=rest.length-1;i>=0;i--){ const o=rest[i]; if (o.c!==top.c) continue; const v=iou(top.b,o.b); if (v>th){ state[o.n]="sup"; log.push(`Suppress ${o.n}: IoU with ${top.n} = ${v.toFixed(2)} > ${th.toFixed(2)}`); rest.splice(i,1);} } }
        $("n-log").innerHTML = log.map(l=>`<li>${l}</li>`).join("");
        g.clearRect(0,0,440,300); g.fillStyle="#F3EEE2"; g.fillRect(0,0,440,300);
        B.forEach(b=>{ const st=state[b.n]; g.globalAlpha = st==="low"?0.25:1; g.strokeStyle=col[b.c]; g.lineWidth = st==="keep"?3:1.5; g.setLineDash(st==="keep"?[]:[6,4]);
          g.strokeRect(b.b[0],b.b[1],b.b[2]-b.b[0],b.b[3]-b.b[1]); g.setLineDash([]); g.fillStyle=col[b.c]; g.font="600 11px Inter"; g.fillText(`${b.n} ${b.c} ${b.s}`, b.b[0]+3, b.b[1]-4); g.globalAlpha=1; }); };
      $("n-iou").oninput=run; $("n-conf").oninput=run; run();
    }
  },
  { title:"Paint a mask: IoU vs Dice",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Paint your prediction</h3>
        <p class="small muted">The dashed outline is the ground-truth mask. Click/drag to paint, hold <b>Shift</b> (or switch the mode) to erase.</p>
        <canvas id="s-cv" class="lab-canvas" width="360" height="360"></canvas>
        <div class="row"><select class="mini" id="s-mode"><option value="1">Paint</option><option value="0">Erase</option></select><button class="btn btn-sm" id="s-clear">Clear</button><button class="btn btn-sm" id="s-perfect">Fill ground truth</button><button class="btn btn-sm" id="s-blob">Sloppy blob</button></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Scores</h3>
        <div class="stat-row" id="s-stats"></div>
        <div class="result"><div class="k">Check the identity</div><div class="v" style="font-size:18px" id="s-id"></div><div class="s">Dice = 2·IoU / (1 + IoU)</div></div>
        <p class="small" style="color:var(--ink-2)">Dice weights the overlap twice, so it is always ≥ IoU and is a little more forgiving. Both punish false positives (painted outside) and false negatives (missed inside).</p>
      </div>
    </div>`,
    init(){
      const N=18, cs=20, gt=(r,c)=>Math.hypot(r-8.5,c-9)<5.5 || (r>=11&&r<=15&&c>=4&&c<=8);
      let pred=[...Array(N)].map(()=>Array(N).fill(0));
      const g=$("s-cv").getContext("2d");
      const render = () => { let tp=0,fp=0,fn=0;
        g.fillStyle="#FFFDF8"; g.fillRect(0,0,360,360);
        for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const G=gt(r,c), P=pred[r][c]; if(G&&P)tp++; else if(P)fp++; else if(G)fn++;
          g.fillStyle = G&&P ? "#B08D3C" : P ? "#E9B6A6" : G ? "#EEF1F6" : "#FFFDF8"; g.fillRect(c*cs, r*cs, cs-1, cs-1); }
        g.strokeStyle="#22304A"; g.lineWidth=1.5; g.setLineDash([4,3]);
        for(let r=0;r<N;r++) for(let c=0;c<N;c++){ if(!gt(r,c)) continue; if(!(r>0&&gt(r-1,c))) {g.beginPath();g.moveTo(c*cs,r*cs);g.lineTo(c*cs+cs,r*cs);g.stroke();} if(!(r<N-1&&gt(r+1,c))){g.beginPath();g.moveTo(c*cs,r*cs+cs);g.lineTo(c*cs+cs,r*cs+cs);g.stroke();} if(!(c>0&&gt(r,c-1))){g.beginPath();g.moveTo(c*cs,r*cs);g.lineTo(c*cs,r*cs+cs);g.stroke();} if(!(c<N-1&&gt(r,c+1))){g.beginPath();g.moveTo(c*cs+cs,r*cs);g.lineTo(c*cs+cs,r*cs+cs);g.stroke();} }
        g.setLineDash([]);
        const I=tp/((tp+fp+fn)||1), D=2*tp/((2*tp+fp+fn)||1);
        $("s-stats").innerHTML=[["TP (gold)",tp],["FP (pink)",fp],["FN (blue)",fn],["IoU",I.toFixed(3)],["Dice",D.toFixed(3)]].map(([k,v])=>`<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
        $("s-id").textContent = `2·${I.toFixed(3)} / (1 + ${I.toFixed(3)}) = ${(2*I/(1+I)).toFixed(3)}`; };
      let down=false, paintVal=1;
      const at = e => { const rc=$("s-cv").getBoundingClientRect(); return [Math.floor((e.clientY-rc.top)/rc.height*N), Math.floor((e.clientX-rc.left)/rc.width*N)]; };
      const paint = e => { const [r,c]=at(e); if(r>=0&&r<N&&c>=0&&c<N){ pred[r][c]=paintVal; render(); } };
      $("s-cv").onpointerdown = e => { down=true; paintVal = e.shiftKey ? 0 : +$("s-mode").value; paint(e); };
      $("s-cv").onpointermove = e => down && paint(e); window.addEventListener("pointerup", ()=>down=false);
      $("s-clear").onclick=()=>{ pred=pred.map(r=>r.map(()=>0)); render(); };
      $("s-perfect").onclick=()=>{ pred=pred.map((row,r)=>row.map((_,c)=>gt(r,c)?1:0)); render(); };
      $("s-blob").onclick=()=>{ pred=pred.map((row,r)=>row.map((_,c)=>Math.hypot(r-7,c-11)<6?1:0)); render(); };
      $("s-blob").click();
    }
  },
  { title:"ViT tokens & CLIP zero-shot",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Patch & token calculator</h3>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>Image size (H = W)</span><input type="number" id="v-h" value="224"></label>
          <label class="field"><span>Patch size P</span><input type="number" id="v-p" value="16"></label>
          <label class="field"><span>Channels C</span><input type="number" id="v-c" value="3"></label>
          <label class="field"><span>Embedding dim D</span><input type="number" id="v-d" value="768"></label>
        </div>
        <div class="stat-row" id="v-stats"></div>
        <div class="small" style="color:var(--ink-2)" id="v-note"></div>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>CLIP zero-shot: similarities → probabilities</h3>
        <p class="small muted">Cosine similarities between one image and each text prompt, turned into probabilities with a softmax. CLIP uses a learned temperature (logit scale ≈ 100).</p>
        <div id="v-sims" class="stack" style="gap:10px"></div>
        <div class="field"><div class="range-head"><span>Logit scale (1 / temperature)</span><output id="v-to">100</output></div><input type="range" id="v-t" min="1" max="100" value="100"></div>
        <div id="v-probs" class="stack" style="gap:6px"></div>
      </div>
    </div>`,
    init(){
      const upd = () => { const h=num("v-h"), p=num("v-p"), c=num("v-c"), d=num("v-d"); if([h,p,c,d].some(isNaN)||p<=0) return;
        const g=Math.floor(h/p), N=g*g, L=N+1, pd=p*p*c, proj=pd*d+d;
        $("v-stats").innerHTML=[["Grid",`${g}×${g}`],["Patches N",N],["Seq. length",L],["Patch vector",pd],["Attn matrix",`${L}²=${(L*L).toLocaleString()}`],["Projection params",proj.toLocaleString()]].map(([k,v])=>`<div class="stat"><div class="k">${k}</div><div class="v" style="font-size:16px">${v}</div></div>`).join("");
        $("v-note").textContent = h%p ? `${h} isn't divisible by ${p}: images are resized/cropped so it is.` : `Halving the patch size to ${p/2} would give ${(2*g)**2} patches — 4× tokens and ~16× attention cost.`; };
      ["v-h","v-p","v-c","v-d"].forEach(id=>$(id).oninput=upd); upd();
      const P=[["a photo of a dog",0.31],["a photo of a cat",0.26],["a photo of a car",0.12]];
      $("v-sims").innerHTML = P.map((x,i)=>`<label class="field"><div class="range-head"><span>cos(image, “${x[0]}”)</span><output id="v-so${i}">${x[1]}</output></div><input type="range" id="v-s${i}" min="-0.2" max="0.5" step="0.01" value="${x[1]}"></label>`).join("");
      const up2 = () => { const T=+$("v-t").value; $("v-to").textContent=T; const s=P.map((_,i)=>{ const v=+$("v-s"+i).value; $("v-so"+i).textContent=v.toFixed(2); return v*T; });
        const m=Math.max(...s), e=s.map(v=>Math.exp(v-m)), z=e.reduce((a,b)=>a+b,0);
        $("v-probs").innerHTML = P.map((x,i)=>`<div><div class="row small" style="justify-content:justify-between"><span>${x[0]}</span><b class="mono">${(100*e[i]/z).toFixed(1)}%</b></div><div class="bar"><i style="width:${100*e[i]/z}%"></i></div></div>`).join(""); };
      P.forEach((_,i)=>$("v-s"+i).oninput=up2); $("v-t").oninput=up2; up2();
    }
  },
  { title:"Kalman prediction & matching",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Two people crossing</h3>
        <canvas id="k-cv" class="lab-canvas" width="440" height="240"></canvas>
        <div class="field"><div class="range-head"><span>Frame</span><output id="k-fo">0</output></div><input type="range" id="k-f" min="0" max="40" value="0"></div>
        <label class="row small"><input type="checkbox" id="k-occ"> Add an occluder (pillar) in the middle</label>
        <label class="row small"><input type="checkbox" id="k-app" checked> Use appearance features (DeepSORT)</label>
        <button class="btn btn-sm" id="k-play" style="align-self:flex-start">Play</button>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Matching this frame</h3>
        <p class="small muted">Cost = 1 − IoU between Kalman-predicted boxes and detections (+ appearance distance with DeepSORT). The Hungarian algorithm picks the lowest total cost.</p>
        <table class="mx" id="k-mx"></table>
        <div class="hint" id="k-msg"></div>
      </div>
    </div>`,
    init(){
      const g=$("k-cv").getContext("2d"); let timer=null;
      const pos = (f) => [{x:30+f*9, y:70, col:"#3B6EA8", app:0}, {x:390-f*9, y:95, col:"#B5523B", app:1}];
      const iou=(a,b)=>{ const w=36,h=70; const ix=Math.max(0,Math.min(a.x+w,b.x+w)-Math.max(a.x,b.x)), iy=Math.max(0,Math.min(a.y+h,b.y+h)-Math.max(a.y,b.y)); const i=ix*iy; return i/(2*w*h-i); };
      const step = () => { const f=+$("k-f").value, occ=$("k-occ").checked, app=$("k-app").checked; $("k-fo").textContent=f;
        let tracks=[{id:1,x:30,y:70,vx:9,app:0,lost:0},{id:2,x:390,y:95,vx:-9,app:1,lost:0}], switched=false, lastRows=[], lastMsg="";
        for (let k=1;k<=f;k++){
          const dets = pos(k).filter(d=>!(occ && d.x+36>190 && d.x<250));
          const pred = tracks.map(tr=>({...tr, x:tr.x+tr.vx}));
          const cost = pred.map(p=>dets.map(d=>{ let c=1-iou(p,d); if (app) c = 0.5*c + 0.5*(p.app===d.app?0:1); return c; }));
          let best=null; const perms = dets.length===2 ? [[0,1],[1,0]] : dets.length===1 ? [[0,-1],[-1,0]] : [[-1,-1]];
          perms.forEach(pm=>{ let s=0; pm.forEach((dj,ti)=>{ s += dj<0 ? 0.9 : cost[ti][dj]; }); if(!best||s<best.s) best={s,pm}; });
          pred.forEach((p,ti)=>{ const dj=best.pm[ti]; if (dj>=0 && cost[ti][dj] < 0.85){ const d=dets[dj]; p.vx = (d.x - tracks[ti].x); p.x=d.x; p.y=d.y; if (p.app!==d.app) switched=true; p.app=d.app; p.lost=0; } else p.lost++; });
          tracks = pred;
          if (k===f){ lastRows = cost.map((r,ti)=>({id:tracks[ti].id, r, pick:best.pm[ti]})); lastMsg = dets.length<2 ? "One person is hidden: their track keeps moving on the Kalman prediction alone." : ""; }
        }
        g.fillStyle="#F3EEE2"; g.fillRect(0,0,440,240); if (occ){ g.fillStyle="#CFC6B2"; g.fillRect(190,20,60,200); }
        pos(f).forEach(d=>{ if (occ && d.x+36>190 && d.x<250) return; g.fillStyle=d.col; g.beginPath(); g.arc(d.x+18,d.y+12,10,0,7); g.fill(); g.fillRect(d.x+6,d.y+24,24,42); });
        tracks.forEach(tr=>{ g.strokeStyle= tr.id===1?"#22304A":"#B08D3C"; g.lineWidth=2; g.setLineDash(tr.lost?[5,4]:[]); g.strokeRect(tr.x,tr.y,36,70); g.setLineDash([]); g.fillStyle=g.strokeStyle; g.font="600 12px Inter"; g.fillText("ID "+tr.id, tr.x, tr.y-5); });
        $("k-mx").innerHTML = lastRows.length ? `<tr><th>track</th>${lastRows[0].r.map((_,j)=>`<th>det ${j+1}</th>`).join("")}</tr>` + lastRows.map(row=>`<tr><th>ID ${row.id}</th>${row.r.map((c,j)=>`<td class="${row.pick===j?"hit":""}">${c.toFixed(2)}</td>`).join("")}</tr>`).join("") : `<tr><td>Move the frame slider</td></tr>`;
        const sw = switched; $("k-msg").innerHTML = (lastMsg ? lastMsg + "<br>" : "") + (sw ? "<b style='color:var(--rust)'>ID switch!</b> Without appearance features the tracker swapped identities after the crossing/occlusion." : f>20 ? "<b style='color:var(--sage)'>IDs preserved</b> through the crossing." : "Watch what happens when the two people cross (~frame 20).");
      };
      ["k-f","k-occ","k-app"].forEach(id=>$(id).oninput=step);
      $("k-play").onclick=()=>{ if (timer){ clearInterval(timer); timer=null; $("k-play").textContent="Play"; return; } $("k-play").textContent="Pause"; if (+$("k-f").value>=40) $("k-f").value=0; timer=setInterval(()=>{ const v=+$("k-f").value+1; if (v>40 || !document.body.contains($("k-cv"))){ clearInterval(timer); timer=null; if($("k-play")) $("k-play").textContent="Play"; return; } $("k-f").value=v; step(); }, 120); };
      $("k-occ").checked = true; $("k-app").checked = false; step();
    }
  },
  { title:"Quantisation & model size",
    html:()=>`
    <div class="lab-grid">
      <div class="card card-pad stack" style="gap:14px">
        <h3>Model size by precision</h3>
        <div class="field"><div class="range-head"><span>Parameters (millions)</span><output id="d-po">25</output></div><input type="range" id="d-p" min="1" max="300" value="25"></div>
        <div id="d-bars" class="stack" style="gap:8px"></div>
        <p class="small muted">Weights only — activations, the runtime and batch size add memory at inference.</p>
      </div>
      <div class="card card-pad stack" style="gap:14px">
        <h3>Quantise one weight to INT8</h3>
        <p class="small muted">Asymmetric (affine) quantisation over a tensor's range [min, max].</p>
        <div class="grid-2" style="gap:12px">
          <label class="field"><span>Tensor min</span><input type="number" id="d-min" value="-1.2" step="0.1"></label>
          <label class="field"><span>Tensor max</span><input type="number" id="d-max" value="0.8" step="0.1"></label>
        </div>
        <div class="field"><div class="range-head"><span>Weight x</span><output id="d-xo">0.3</output></div><input type="range" id="d-x" min="-1.2" max="0.8" step="0.001" value="0.3"></div>
        <div class="result"><div class="k">Stored as</div><div class="v" id="d-q"></div><div class="s" id="d-work"></div></div>
      </div>
    </div>`,
    init(){
      const up = () => { const p=+$("d-p").value; $("d-po").textContent=p;
        $("d-bars").innerHTML=[["FP32",4],["FP16 / BF16",2],["INT8",1],["INT4",0.5]].map(([n,b])=>`<div><div class="row small" style="justify-content:space-between"><span>${n}</span><b class="mono">${(p*b).toFixed(p*b<10?1:0)} MB</b></div><div class="bar"><i style="width:${b*25}%"></i></div></div>`).join(""); };
      $("d-p").oninput=up; up();
      const uq = () => { let mn=num("d-min"), mx=num("d-max"); if (isNaN(mn)||isNaN(mx)||mx<=mn) return; $("d-x").min=mn; $("d-x").max=mx; const x=clamp(+$("d-x").value, mn, mx); $("d-xo").textContent=x.toFixed(3);
        const s=(mx-mn)/255, z=Math.round(-mn/s), q=clamp(Math.round(x/s)+z, 0, 255), dq=(q-z)*s;
        $("d-q").textContent=`q = ${q}  →  ${dq.toFixed(4)}`; $("d-work").innerHTML=`scale s = (${mx} − ${mn})/255 = ${s.toFixed(5)}, zero-point z = ${z}<br>q = round(${x.toFixed(3)}/s) + z = ${q} · error = ${Math.abs(dq-x).toExponential(2)}`; };
      ["d-min","d-max","d-x"].forEach(id=>$(id).oninput=uq); uq();
    }
  }
  ]
};
window.COURSE_CV.syllabus.forEach((s, i) => {
  s.id = i;
  s.badge = `Module ${i + 1}`;
  s.duration = s.captions[s.captions.length - 1].time + 22;
});

