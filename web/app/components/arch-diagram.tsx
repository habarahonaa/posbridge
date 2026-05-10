"use client";

/**
 * Three nodes connected by a single horizontal SVG path.
 * A pulse glyph travels along the path on a 2.4s loop, hinting at the
 * fact-pattern of a print job: web app → bridge → printer.
 *
 * Mobile collapses to a vertical stack with a downward path; the same SVG
 * primitives drive both layouts via two <path>s and CSS visibility.
 */
export function ArchDiagram() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-paper-100/10 bg-[#0c0b0966] p-6 sm:p-10">
      {/* Decorative corner ticks — subtle technical-drawing flavor. */}
      <CornerTicks />

      <div className="relative">
        {/* Horizontal flow on >= sm */}
        <div className="hidden sm:block">
          <svg
            viewBox="0 0 600 80"
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 w-full pointer-events-none"
            aria-hidden
          >
            <defs>
              <linearGradient id="flow-h" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(245,233,211,0.0)" />
                <stop offset="50%" stopColor="rgba(245,233,211,0.35)" />
                <stop offset="100%" stopColor="rgba(245,233,211,0.0)" />
              </linearGradient>
              <radialGradient id="pulse" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#f5e9d3" stopOpacity="1" />
                <stop offset="40%" stopColor="#f5e9d3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f5e9d3" stopOpacity="0" />
              </radialGradient>
            </defs>

            <line
              x1="60"
              y1="40"
              x2="540"
              y2="40"
              stroke="url(#flow-h)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />

            {/* The pulse — travels along the line via SMIL animateMotion (no JS). */}
            <circle r="6" fill="url(#pulse)">
              <animateMotion
                dur="2.4s"
                repeatCount="indefinite"
                path="M60,40 L540,40"
              />
            </circle>
          </svg>

          <div className="relative grid grid-cols-3 gap-6">
            <Node title="Web app" subtitle="HTTPS · anywhere" accent="emerald" align="start">
              <code className="text-[11px] text-neutral-400">fetch(&apos;/print/&hellip;&apos;)</code>
            </Node>
            <Node title="POSBridge" subtitle="Swift · localhost:9999" accent="paper" align="center">
              <code className="text-[11px] text-neutral-400">→ CUPS raw / ESC&middot;POS / P-touch</code>
            </Node>
            <Node title="Printers" subtitle="USB · receipt + QL" accent="rose" align="end">
              <code className="text-[11px] text-neutral-400">+ cash drawer pulse</code>
            </Node>
          </div>
        </div>

        {/* Vertical flow on mobile */}
        <div className="sm:hidden flex flex-col gap-6 relative">
          <div
            className="absolute left-[22px] top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-paper-100/30 to-transparent"
            aria-hidden
          />
          <Node title="Web app" subtitle="HTTPS · anywhere" accent="emerald" align="start">
            <code className="text-[11px] text-neutral-400">fetch(&apos;/print/&hellip;&apos;)</code>
          </Node>
          <Node title="POSBridge" subtitle="Swift · localhost:9999" accent="paper" align="start">
            <code className="text-[11px] text-neutral-400">CUPS raw / ESC&middot;POS / P-touch</code>
          </Node>
          <Node title="Printers" subtitle="USB · receipt + QL" accent="rose" align="start">
            <code className="text-[11px] text-neutral-400">+ cash drawer pulse</code>
          </Node>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-neutral-600">
        <span>HTTPS</span>
        <span className="hidden sm:inline">localhost HTTP</span>
        <span>USB</span>
      </div>
    </div>
  );
}

function Node({
  title,
  subtitle,
  accent,
  align,
  children,
}: {
  title: string;
  subtitle: string;
  accent: "emerald" | "paper" | "rose";
  align: "start" | "center" | "end";
  children: React.ReactNode;
}) {
  const dotClass = {
    emerald: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]",
    paper: "bg-paper-100 shadow-[0_0_12px_rgba(245,233,211,0.5)]",
    rose: "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.5)]",
  }[accent];
  const alignClass = {
    start: "items-start text-left",
    center: "items-center text-center sm:items-center sm:text-center",
    end: "items-start text-left sm:items-end sm:text-right",
  }[align];

  return (
    <div className={`relative z-10 flex flex-col gap-2 ${alignClass}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          {subtitle}
        </span>
      </div>
      <div className="font-serif text-[22px] sm:text-[26px] leading-none text-paper-50 mt-1">
        {title}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function CornerTicks() {
  const tick = "absolute h-3 w-3 border-paper-100/15";
  return (
    <>
      <span className={`${tick} top-2 left-2 border-t border-l`} />
      <span className={`${tick} top-2 right-2 border-t border-r`} />
      <span className={`${tick} bottom-2 left-2 border-b border-l`} />
      <span className={`${tick} bottom-2 right-2 border-b border-r`} />
    </>
  );
}
