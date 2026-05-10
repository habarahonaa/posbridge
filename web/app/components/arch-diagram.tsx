export function ArchDiagram() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 sm:p-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch">
        <Node
          title="Web app"
          subtitle="Vercel · Netlify · anywhere HTTPS"
          accent="emerald"
        >
          <code className="text-xs text-neutral-400">fetch(&apos;/print/&hellip;&apos;)</code>
        </Node>
        <Node
          title="POSBridge"
          subtitle="127.0.0.1:9999 · Swift menubar"
          accent="amber"
        >
          <code className="text-xs text-neutral-400">→ CUPS raw / ESC&middot;POS / P-touch</code>
        </Node>
        <Node
          title="Printers"
          subtitle="Receipt + Brother QL · USB"
          accent="rose"
        >
          <code className="text-xs text-neutral-400">+ cash drawer pulse</code>
        </Node>
      </div>
      <div className="mt-6 hidden sm:flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-neutral-600">
        <span>HTTPS</span>
        <span className="flex-1 mx-3 h-px bg-neutral-800" />
        <span>localhost HTTP</span>
        <span className="flex-1 mx-3 h-px bg-neutral-800" />
        <span>USB</span>
      </div>
    </div>
  );
}

function Node({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: "emerald" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const dot = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[accent];
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {subtitle}
        </span>
      </div>
      <div className="text-base font-medium text-neutral-50">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
