"use client";

import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Underline, Undo2, Redo2, RemoveFormatting } from "lucide-react";
import { useEffect, useRef } from "react";

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "underline", icon: Underline, label: "Underline" },
  { cmd: "formatBlock", arg: "h2", icon: Heading2, label: "Heading" },
  { cmd: "formatBlock", arg: "h3", icon: Heading3, label: "Subheading" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
  { cmd: "formatBlock", arg: "blockquote", icon: Quote, label: "Quote" },
  { cmd: "createLink", icon: Link2, label: "Link" },
  { cmd: "removeFormat", icon: RemoveFormatting, label: "Clear formatting" },
  { cmd: "undo", icon: Undo2, label: "Undo" },
  { cmd: "redo", icon: Redo2, label: "Redo" },
] as const;

/**
 * Lightweight rich text editor (contentEditable). Output HTML is sanitized
 * server-side with an allow-list before it is stored.
 */
export function RichText({ value, onChange, id, minHeight = 220 }: { value: string; onChange: (html: string) => void; id?: string; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && document.activeElement !== ref.current) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    if (cmd === "createLink") {
      const url = prompt("Link URL (https://…)");
      if (!url || !/^https?:\/\//i.test(url)) return;
      document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, arg);
    }
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <div className="flex flex-wrap gap-0.5 border-b border-line bg-cream/60 p-1.5" role="toolbar" aria-label="Formatting">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t.cmd, "arg" in t ? t.arg : undefined)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose prose-sm prose-slate max-w-none px-4 py-3 focus:outline-none dark:prose-invert"
        style={{ minHeight }}
      />
    </div>
  );
}
