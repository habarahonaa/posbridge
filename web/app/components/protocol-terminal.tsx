"use client";

import { useEffect, useState } from "react";

// Each token is a labeled segment of the byte stream. The terminal types them
// in order, color-coding by role so the reader can *see* the protocol's
// shape — initialize, select, fill, fill, fill, print — without reading docs.
type TokenKind = "cmd" | "name" | "value" | "delim" | "comment";

type Token = { text: string; kind: TokenKind; comment?: string };

const SCRIPT: Token[] = [
  { text: "^II", kind: "cmd", comment: "initialize" },
  { text: "^TS", kind: "cmd", comment: "select template 1" },
  { text: "\\x01", kind: "value" },
  { text: "^ON", kind: "cmd", comment: "fill object 'customerName'" },
  { text: "customerName", kind: "name" },
  { text: "\\", kind: "delim" },
  { text: "^DI", kind: "cmd" },
  { text: "Hollman Barahona", kind: "value" },
  { text: "\\", kind: "delim" },
  { text: "^ON", kind: "cmd", comment: "fill object 'tracking'" },
  { text: "tracking", kind: "name" },
  { text: "\\", kind: "delim" },
  { text: "^DI", kind: "cmd" },
  { text: "CM-12345", kind: "value" },
  { text: "\\", kind: "delim" },
  { text: "^FF", kind: "cmd", comment: "start print → label drops" },
];

const TOKEN_COLOR: Record<TokenKind, string> = {
  cmd: "text-emerald-300",
  name: "text-paper-100",
  value: "text-amber-200",
  delim: "text-neutral-600",
  comment: "text-neutral-500 italic",
};

const CHAR_DELAY = 22;
const TOKEN_GAP = 90;
const LOOP_PAUSE = 2400;

export function ProtocolTerminal() {
  const [tokenIdx, setTokenIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        setTokenIdx(0);
        setCharIdx(0);
        setDone(false);
      }, LOOP_PAUSE);
      return () => clearTimeout(t);
    }
    const current = SCRIPT[tokenIdx];
    if (!current) {
      setDone(true);
      return;
    }
    if (charIdx < current.text.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), CHAR_DELAY);
      return () => clearTimeout(t);
    }
    if (tokenIdx < SCRIPT.length - 1) {
      const t = setTimeout(() => {
        setTokenIdx((i) => i + 1);
        setCharIdx(0);
      }, TOKEN_GAP);
      return () => clearTimeout(t);
    }
    setDone(true);
  }, [tokenIdx, charIdx, done]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-paper-100/10 bg-[#08080766] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-[2px]">
      <Chrome />
      <div className="scanline">
        <pre className="px-5 sm:px-7 py-6 sm:py-8 text-[13px] sm:text-sm leading-7 overflow-x-auto">
          <code className="block whitespace-pre-wrap break-all">
            {SCRIPT.slice(0, tokenIdx + 1).map((t, i) => {
              const isCurrent = i === tokenIdx;
              const visible = isCurrent ? t.text.slice(0, charIdx) : t.text;
              if (!visible) return null;
              return (
                <span key={i}>
                  <span className={TOKEN_COLOR[t.kind]}>{visible}</span>
                  {t.comment && (!isCurrent || charIdx === t.text.length) ? (
                    <span className="text-neutral-700">
                      {"  "}
                      <span className="text-neutral-600">/* {t.comment} */</span>
                    </span>
                  ) : null}
                  {(!isCurrent || charIdx === t.text.length) && i !== SCRIPT.length - 1 ? (
                    "\n"
                  ) : null}
                </span>
              );
            })}
            <span
              className="ml-0.5 inline-block h-4 w-[7px] -mb-0.5 bg-paper-100/90 align-middle animate-caret-blink"
              aria-hidden
            />
          </code>
        </pre>
      </div>
      <div className="flex items-center justify-between border-t border-paper-100/5 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-glow-emerald" />
          POSBridge · 127.0.0.1:9999
        </span>
        <span className="hidden sm:inline">P-touch Template · /print/label</span>
      </div>
    </div>
  );
}

function Chrome() {
  return (
    <div className="flex items-center justify-between border-b border-paper-100/5 bg-black/30 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
        wire — bytes to QL-800
      </span>
      <span className="w-12" />
    </div>
  );
}
