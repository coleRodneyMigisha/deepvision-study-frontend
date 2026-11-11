/**
 * Finding the LaTeX in study text (course YAML and AI replies), without mistaking prices for math.
 *
 * Supported delimiters: $…$ and \(…\) inline, $$…$$ and \[…\] display. A single $ only opens math
 * when the next character isn't a space, and only closes it when the character before isn't a space
 * and the character after isn't a digit (Pandoc's rule). So "$2.40 × 0.25 = $0.60" stays as
 * text, while "$\mu \approx 0.485$" becomes math.
 */
export type Segment = { kind: "text"; value: string } | { kind: "code"; value: string } | { kind: "math"; value: string; display: boolean };

const CODE = /(```[\s\S]*?```|`[^`\n]+`)/;

export function segments(input: string): Segment[] {
  const out: Segment[] = [];
  const text = (value: string) => {
    if (!value) return;
    const last = out[out.length - 1];
    if (last?.kind === "text") last.value += value;
    else out.push({ kind: "text", value });
  };
  input.split(CODE).forEach((part, i) => {
    if (i % 2) return void out.push({ kind: "code", value: part });
    let i0 = 0;
    let plain = "";
    while (i0 < part.length) {
      const rest = part.slice(i0);
      const m =
        /^\$\$([\s\S]+?)\$\$/.exec(rest) ??
        /^\\\[([\s\S]+?)\\\]/.exec(rest) ??
        /^\\\(([\s\S]+?)\\\)/.exec(rest) ??
        inlineDollar(rest);
      if (m && part[i0 - 1] !== "\\") {
        text(plain);
        plain = "";
        const display = rest.startsWith("$$") || rest.startsWith("\\[");
        out.push({ kind: "math", value: m[1].trim(), display });
        i0 += m[0].length;
      } else {
        plain += part[i0];
        i0 += 1;
      }
    }
    text(plain);
  });
  return out;
}

function inlineDollar(s: string): [string, string] | null {
  if (s[0] !== "$" || !s[1] || /\s|\$/.test(s[1])) return null;
  for (let j = 2; j < s.length; j++) {
    if (s[j] === "\n" && s[j + 1] === "\n") return null; // never span paragraphs
    if (s[j] === "$" && s[j - 1] !== "\\") {
      // The first unescaped $ decides: a valid closer ends the math, anything else means this was a price.
      if (/\s/.test(s[j - 1]) || /\d/.test(s[j + 1] ?? "")) return null;
      return [s.slice(0, j + 1), s.slice(1, j)];
    }
  }
  return null;
}

/** Rewrites text for remark-math: real math gets $ / $$ delimiters, every other $ is escaped. */
export function mathToMarkdown(input: string): string {
  return segments(input)
    .map((s) => {
      if (s.kind === "code") return s.value;
      if (s.kind === "text") return s.value.replace(/\\?\$/g, (m) => (m.length === 2 ? m : "\\$"));
      return s.display ? `\n\n$$\n${s.value}\n$$\n\n` : `$${s.value}$`;
    })
    .join("");
}

/** True only when the text contains real math (a price like "$5" doesn't count). Cheap: no KaTeX needed. */
export const hasMath = (input: string) =>
  (input.includes("$") || input.includes("\\(") || input.includes("\\[")) && segments(input).some((s) => s.kind === "math");
