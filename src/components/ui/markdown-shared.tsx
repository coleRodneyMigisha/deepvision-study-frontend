import type { Components } from "react-markdown";

const link: Components["a"] = (p) => <a {...p} target="_blank" rel="noreferrer" />;
export const BLOCK: Components = { a: link };

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text, then re-allows only <b>, <i>, <code>, <br> and `backtick code`. */
export const richText = (text: string) =>
  text
    .replace(/\\\$/g, "$")
    .replace(/[&<>"']/g, (c) => ESC[c])
    .replace(/&lt;(\/?)(b|i|code|br)\s*\/?&gt;/g, "<$1$2>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
