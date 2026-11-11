// @ts-nocheck — canvas drawing code ported verbatim from the original StudyRoom lessons.
// New scenes can be written in typed TypeScript; see src/lib/scene/kit.ts.
/* eslint-disable */
import type { Scene } from "@/lib/scene/kit";

/** One scene per module id; `ci` is the lesson step index. */
export const scenes: Record<string, Scene> = {
  "images-as-data": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "cnns": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "training-evaluation": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "transfer-learning": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "object-detection": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "segmentation": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "vits-multimodal": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "video-tracking": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  "deployment-responsible": (kit, ci, p, t) => {
    const { ctx, W, H, C, clamp, ease, txt, rect, line, arrow, circle, heading, tag, formulaBar, pixVal, grid } = kit;
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
  },
};
