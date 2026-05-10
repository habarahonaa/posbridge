export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
      {language ? (
        <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          <span>{language}</span>
        </div>
      ) : null}
      <pre className="overflow-x-auto px-4 py-4 text-sm leading-relaxed text-neutral-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}
