// The heavy half of the math support: KaTeX, its CSS and fonts. Markdown.tsx loads this module only when the
// text being rendered actually contains math, so pages without formulas never download it.
import "katex/dist/katex.min.css";
import katex from "katex";
import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { mathToMarkdown, segments } from "@/lib/math";
import { BLOCK, richText } from "./markdown-shared";

const renderMath = (tex: string, display: boolean) =>
  katex.renderToString(tex, { displayMode: display, throwOnError: false, output: "htmlAndMathml" });

export function MathMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={BLOCK}>
      {mathToMarkdown(children)}
    </ReactMarkdown>
  );
}

export function MathInline({ children }: { children: string }) {
  return (
    <>
      {segments(children).map((s, i) =>
        s.kind === "math" ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(s.value, s.display) }} />
        ) : (
          <Fragment key={i}>{s.value.replace(/\\\$/g, "$")}</Fragment>
        ),
      )}
    </>
  );
}

export function MathRich({ html }: { html: string }) {
  const safe = segments(html)
    .map((s) => (s.kind === "math" ? renderMath(s.value, s.display) : richText(s.value)))
    .join("");
  return <span dangerouslySetInnerHTML={{ __html: safe }} />;
}
