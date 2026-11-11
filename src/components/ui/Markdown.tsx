import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { hasMath } from "@/lib/math";
import { cn } from "@/lib/utils";
import { BLOCK, richText } from "./markdown-shared";

// KaTeX lives in its own chunk, fetched only when a string with real math is rendered. Prerendered pages already have
// the math in their HTML; text that first appears in the browser (e.g. a buddy reply) waits a moment for the chunk.
const MathMarkdown = dynamic(() => import("./MathRender").then((m) => m.MathMarkdown));
const MathInline = dynamic(() => import("./MathRender").then((m) => m.MathInline));
const MathRich = dynamic(() => import("./MathRender").then((m) => m.MathRich));

/** Renders study Markdown (notes, buddy replies), with LaTeX math when present. Raw HTML is ignored for safety. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-study", className)}>
      {hasMath(children) ? (
        <MathMarkdown>{children}</MathMarkdown>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={BLOCK}>
          {children}
        </ReactMarkdown>
      )}
    </div>
  );
}

/** A short plain-text string (answers, hints, explanations) that may contain math, rendered inline. */
export function MathText({ children }: { children: string | number | null | undefined }) {
  const text = children == null ? "" : String(children);
  return hasMath(text) ? <MathInline>{text}</MathInline> : <>{text}</>;
}

/** Inline text that may contain only <b>, <i>, <code>, <br> tags (used by challenge questions), plus math. */
export function Rich({ html, className }: { html: string; className?: string }) {
  return (
    <span className={cn("rich", className)}>
      {hasMath(html) ? <MathRich html={html} /> : <span dangerouslySetInnerHTML={{ __html: richText(html) }} />}
    </span>
  );
}
