"use client";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";

/** CodeMirror editor; follows the site's light/dark theme. Loaded client-side only. */
export default function CodeEditor({
  value,
  onChange,
  language,
  onRun,
}: {
  value: string;
  onChange: (v: string) => void;
  language: "python" | "sql" | "review";
  onRun?: () => void;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return (
    <div
      className="overflow-hidden rounded-2xl border border-line-2 text-[13.5px] focus-within:border-accent"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && onRun) {
          e.preventDefault();
          onRun();
        }
      }}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={dark ? "dark" : "light"}
        minHeight="260px"
        maxHeight="560px"
        extensions={language === "sql" ? [sql()] : language === "python" ? [python()] : []}
        basicSetup={{ foldGutter: false, highlightActiveLine: true, tabSize: 4 }}
      />
    </div>
  );
}
