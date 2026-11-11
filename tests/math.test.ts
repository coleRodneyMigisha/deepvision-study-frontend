import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mathToMarkdown, segments } from "../src/lib/math.ts";

const maths = (s: string) => segments(s).filter((x) => x.kind === "math").map((x) => x.value);

describe("math segments", () => {
  it("finds inline and display LaTeX", () => {
    assert.deepEqual(maths("($\\mu \\approx [0.485, 0.456, 0.406]$ and $\\sigma \\approx [0.229, 0.224, 0.225]$)"), [
      "\\mu \\approx [0.485, 0.456, 0.406]",
      "\\sigma \\approx [0.229, 0.224, 0.225]",
    ]);
    assert.deepEqual(maths("so \\(x^2\\) and $$\\sum_i A_i$$ and \\[E=mc^2\\]"), ["x^2", "\\sum_i A_i", "E=mc^2"]);
  });

  it("leaves prices alone", () => {
    for (const s of [
      "Spot price = $2.40 × (1 − 0.75) = $0.60/hour. For 10 hours: 10 × $0.60 = $6.00.",
      "About $70.56 on Spot vs $252 on-demand.",
      "costs $5 and $ 6",
    ]) {
      assert.deepEqual(maths(s), [], s);
      assert.ok(!/(^|[^\\])\$/.test(mathToMarkdown(s)), "every $ escaped: " + mathToMarkdown(s));
    }
  });

  it("ignores dollars inside code", () => {
    assert.deepEqual(maths("run `echo $HOME$` then\n```\nx=$a$\n```"), []);
    assert.equal(mathToMarkdown("`echo $a$`"), "`echo $a$`");
  });

  it("mixes math and prices", () => {
    assert.deepEqual(maths("Cost $3 per hour, so $C = 3t$ dollars."), ["C = 3t"]);
  });
});
