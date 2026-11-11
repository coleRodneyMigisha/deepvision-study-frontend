import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders study Markdown (notes, buddy replies). Raw HTML is ignored for safety. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-study", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Inline text that may contain only <b>, <i>, <code>, <br> tags (used by challenge questions). */
export function Rich({ html, className }: { html: string; className?: string }) {
  const safe = html
    .replace(/[&<>"']/g, (c) => ESC[c])
    .replace(/&lt;(\/?)(b|i|code|br)\s*\/?&gt;/g, "<$1$2>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  return <span className={cn("rich", className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}
