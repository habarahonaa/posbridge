"use client";

import { useState } from "react";

export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-paper-100/10 bg-[#0c0b0966]">
      {language ? (
        <div className="flex items-center justify-between border-b border-paper-100/5 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-paper-100/60" />
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 transition group-hover:opacity-100 text-neutral-400 hover:text-paper-100"
            aria-label="Copy code"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      ) : null}
      <div className="scanline">
        <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed text-neutral-200">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}
