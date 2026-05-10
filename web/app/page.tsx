import { CodeBlock } from "./components/code-block";
import { ArchDiagram } from "./components/arch-diagram";
import { ProtocolTerminal } from "./components/protocol-terminal";

const REPO = "https://github.com/habarahonaa/posbridge";

export default function HomePage() {
  return (
    <>
      <div className="grain" aria-hidden />

      {/* Hero plate — full bleed dot grid behind the opening fold only. */}
      <div className="relative">
        <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />
        <main className="relative mx-auto max-w-4xl px-6 pt-16 sm:pt-24 pb-10">
          <Hero />
        </main>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-16 sm:pb-24">
        <Diagram />
        <Story />
        <Quickstart />
        <Anatomy />
        <ApiLog />
        <Faq />
        <Footer />
      </main>
    </>
  );
}

function Hero() {
  return (
    <header className="relative">
      <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-neutral-500 animate-fade-up">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-glow-emerald" />
        <span>v0.1.0</span>
        <Sep />
        <span>macOS 13+</span>
        <Sep />
        <span>MIT</span>
      </div>

      <h1 className="font-serif text-[44px] leading-[1.04] sm:text-[68px] tracking-[-0.01em] text-paper-50 animate-fade-up [animation-delay:80ms]">
        A bridge between{" "}
        <span className="italic text-paper-100">your web app</span>
        <br className="hidden sm:block" /> and the{" "}
        <span className="italic text-paper-100">printers it can&apos;t reach.</span>
      </h1>

      <p className="mt-7 max-w-2xl text-[15px] sm:text-base leading-relaxed text-neutral-400 animate-fade-up [animation-delay:160ms]">
        POSBridge is a tiny native menubar helper that exposes ESC/POS receipt
        printers and Brother QL label printers to a hosted web app over
        localhost HTTP. No Tauri shell. No Brother SDK. No print server.{" "}
        <span className="text-neutral-200">One small Swift binary.</span>
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:240ms]">
        <a
          href={REPO}
          className="group inline-flex items-center gap-2 rounded-md bg-paper-100 px-4 py-2 text-sm font-medium text-[#0a0a09] transition hover:bg-paper-50"
        >
          View on GitHub
          <span className="transition group-hover:translate-x-0.5">→</span>
        </a>
        <a
          href="#why"
          className="rounded-md border border-paper-100/15 px-4 py-2 text-sm text-neutral-300 transition hover:border-paper-100/40 hover:text-paper-50"
        >
          The b-PAC story
        </a>
        <a
          href="#quickstart"
          className="text-sm text-neutral-500 transition hover:text-neutral-200"
        >
          Quick start ↓
        </a>
      </div>

      <div className="mt-14 sm:mt-16 animate-fade-up [animation-delay:340ms]">
        <ProtocolTerminal />
        <p className="mt-4 text-[12px] uppercase tracking-[0.22em] text-neutral-600">
          live · the bytes a single label print writes to USB
        </p>
      </div>
    </header>
  );
}

function Diagram() {
  return (
    <section className="mt-24 sm:mt-32">
      <SectionLabel>Architecture</SectionLabel>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight text-paper-50">
        One <span className="italic">fetch</span>, three hops.
      </h2>
      <div className="mt-8">
        <ArchDiagram />
      </div>
      <p className="mt-6 max-w-2xl text-sm text-neutral-500 leading-relaxed">
        The browser cannot talk to USB printers. POSBridge sits on the
        user&apos;s Mac, exposes a tiny localhost HTTP API, and translates JSON
        jobs into the byte-level protocol each printer speaks.
      </p>
    </section>
  );
}

function Story() {
  return (
    <section id="why" className="mt-24 sm:mt-32 relative">
      <SectionLabel>The discovery</SectionLabel>

      {/* Editorial pull-quote: serif italic on a left rule, breaks the section
          rhythm so the *most interesting* content gets the most distinct
          treatment on the page. */}
      <blockquote className="mt-3 border-l border-paper-100/30 pl-6 sm:pl-10 py-2">
        <p className="font-serif text-2xl sm:text-[32px] leading-[1.25] text-paper-50">
          <span className="italic">b-PAC</span> isn&apos;t the answer on macOS.
          <br />
          <span className="italic">P-touch Template</span> is.
        </p>
      </blockquote>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,2fr)] gap-x-10 gap-y-6">
        {/* Margin column — editorial annotation cue. */}
        <aside className="lg:pt-1.5 text-[11px] uppercase tracking-[0.2em] text-neutral-600 lg:text-right leading-relaxed">
          <span className="text-paper-100/70">§ 1</span>
          <br />
          What everyone tries first. Why it doesn&apos;t exist.
        </aside>
        <div className="space-y-5 text-neutral-300 leading-relaxed">
          <p>
            If you&apos;ve tried to print Brother QL labels from a web app on
            macOS, you&apos;ve probably found the b-PAC SDK, seen it claims to
            support template field-fill, and assumed it was the answer.
          </p>
          <p>
            It isn&apos;t.{" "}
            <strong className="text-paper-50">b-PAC is Windows-only.</strong>{" "}
            Brother&apos;s macOS download is for older OS versions. The
            framework everyone references on Stack Overflow (
            <code className="text-paper-100">bpac.framework</code>) does not
            exist on current macOS. Mac developers get routed to{" "}
            &ldquo;Brother Print SDK for Mac,&rdquo; which does raster
            printing but not field-fill. AppleScript hooks in P-touch Editor
            for Mac have been removed across recent versions. Several GitHub
            projects claim to bridge b-PAC to the Mac and quietly don&apos;t.
          </p>
        </div>

        <aside className="lg:pt-1.5 text-[11px] uppercase tracking-[0.2em] text-neutral-600 lg:text-right leading-relaxed">
          <span className="text-paper-100/70">§ 2</span>
          <br />
          What actually works. Documented byte-level.
        </aside>
        <div className="space-y-5 text-neutral-300 leading-relaxed">
          <p>
            The actual answer is{" "}
            <strong className="text-paper-50">P-touch Template</strong>, a
            printer-side feature that almost no blog post leads with:
          </p>
          <ol className="space-y-3">
            <Step n={1}>
              Design your label in P-touch Editor, naming each text and
              barcode object (<code>customerName</code>,{" "}
              <code>tracking</code>, …).
            </Step>
            <Step n={2}>
              Upload the design{" "}
              <em className="font-serif italic text-paper-50">
                into the printer&apos;s flash memory
              </em>{" "}
              with Transfer Express. The printer assigns it a number.
            </Step>
            <Step n={3}>
              From any OS, send a small ASCII command stream over USB. The
              firmware does the substitution.
            </Step>
          </ol>

          <div className="pt-2">
            <CodeBlock language="byte stream">
{`^II                          # initialize
^TS<n>                       # select stored template by index
^ON<name>\\^DI<value>\\        # for each named object: select, then insert
^FF                          # start print`}
            </CodeBlock>
          </div>
          <p>
            No SDK on the host machine. No Brother framework. Pure bytes piped
            through CUPS in raw mode. POSBridge is, in essence, a small Swift
            program that builds those streams. The receipt path uses the same
            idea with ESC/POS instead.
          </p>
        </div>
      </div>
    </section>
  );
}

function Quickstart() {
  return (
    <section id="quickstart" className="mt-24 sm:mt-32">
      <SectionLabel>Quick start</SectionLabel>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight text-paper-50">
        Three steps to a <span className="italic">printed receipt.</span>
      </h2>

      <div className="mt-10 space-y-10">
        <NumberedStep n="01" title="Install printers in macOS">
          <p className="text-neutral-400 mb-3">
            System Settings → Printers & Scanners. Add your receipt printer,
            rename the queue to <code>Receipt</code>. Add your Brother QL,
            rename it to <code>Label</code>.
          </p>
          <CodeBlock language="bash">{`lpstat -p Receipt Label`}</CodeBlock>
        </NumberedStep>

        <NumberedStep n="02" title="Build and run">
          <CodeBlock language="bash">
{`git clone https://github.com/habarahonaa/posbridge.git
cd posbridge
swift run`}
          </CodeBlock>
          <p className="mt-3 text-neutral-500 text-sm">
            First launch: right-click the binary in Finder → Open once to get
            past Gatekeeper. After that it&apos;s silent.
          </p>
        </NumberedStep>

        <NumberedStep n="03" title="Print from your web app">
          <CodeBlock language="ts">
{`await fetch("http://127.0.0.1:9999/print/receipt", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    storeName: "My Store",
    saleId: "TEST-1",
    occurredAt: new Date().toISOString(),
    lines: [
      { name: "Coffee", quantity: 1, unitPriceCents: 450, totalCents: 450 },
    ],
    subtotalCents: 450,
    totalCents: 450,
    currency: "USD",
    paymentMethod: "Cash",
    openDrawer: true,
  }),
});`}
          </CodeBlock>
        </NumberedStep>
      </div>
    </section>
  );
}

function Anatomy() {
  return (
    <section className="mt-24 sm:mt-32">
      <SectionLabel>Anatomy</SectionLabel>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight text-paper-50">
        A small thing <span className="italic">on purpose.</span>
      </h2>
      <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7 text-sm">
        <Fact label="Language">Swift 5.9 · single dep on Swifter</Fact>
        <Fact label="Runtime">macOS 13+, menubar LSUIElement</Fact>
        <Fact label="Network">127.0.0.1 only · port configurable</Fact>
        <Fact label="Receipt">
          Generic ESC/POS · Epson, Star, Citizen, Volcora, generic OEMs
        </Fact>
        <Fact label="Label">
          Brother QL series · QL-800 / 810W / 820NWB / 1100 / 1110NWB
        </Fact>
        <Fact label="Drawer">
          ESC/POS pulse via the receipt printer&apos;s RJ-11
        </Fact>
        <Fact label="Runtime deps on the Mac">
          None · no driver SDK, no node, no Brother framework
        </Fact>
        <Fact label="License">MIT</Fact>
      </dl>
    </section>
  );
}

function ApiLog() {
  const rows: Array<{
    method: "GET" | "POST";
    path: string;
    body: string;
    returns: string;
  }> = [
    { method: "GET", path: "/health", body: "—", returns: "BridgeStatus" },
    { method: "POST", path: "/print/receipt", body: "ReceiptPayload", returns: "{ ok: true }" },
    { method: "POST", path: "/print/label", body: "LabelPayload", returns: "{ ok: true }" },
    { method: "POST", path: "/drawer/kick", body: "DrawerPayload", returns: "{ ok: true }" },
  ];
  return (
    <section className="mt-24 sm:mt-32">
      <SectionLabel>API</SectionLabel>
      <h2 className="mt-2 font-serif text-3xl sm:text-4xl tracking-tight text-paper-50">
        Four endpoints. <span className="italic">JSON in, JSON out.</span>
      </h2>

      <div className="mt-10 overflow-hidden rounded-lg border border-paper-100/10 bg-[#0c0b0966]">
        <div className="flex items-center justify-between border-b border-paper-100/5 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-paper-100/60" />
            api · 127.0.0.1:9999
          </span>
          <span className="hidden sm:inline">log feed</span>
        </div>
        <div className="scanline divide-y divide-paper-100/5">
          {rows.map((r) => (
            <ApiRow key={r.path} {...r} />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Errors → HTTP 400 ·{" "}
        <code className="text-neutral-300">
          {`{ ok: false, code, message }`}
        </code>
        . Full payload schemas in the README.
      </p>
    </section>
  );
}

function ApiRow({
  method,
  path,
  body,
  returns,
}: {
  method: "GET" | "POST";
  path: string;
  body: string;
  returns: string;
}) {
  const ledColor = method === "GET" ? "bg-emerald-400" : "bg-amber-300";
  const ledGlow =
    method === "GET"
      ? "shadow-[0_0_8px_rgba(52,211,153,0.6)]"
      : "shadow-[0_0_8px_rgba(252,211,77,0.6)]";
  return (
    <div className="grid grid-cols-[auto_3.5rem_1fr_auto] sm:grid-cols-[auto_3.5rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 sm:gap-4 px-4 py-3 text-[13px] hover:bg-paper-100/[0.025] transition">
      <span className={`h-1.5 w-1.5 rounded-full ${ledColor} ${ledGlow}`} />
      <span
        className={`text-[11px] tracking-[0.1em] font-medium ${
          method === "GET" ? "text-emerald-300" : "text-amber-200"
        }`}
      >
        {method}
      </span>
      <span className="text-paper-50 truncate">{path}</span>
      <span className="hidden sm:inline text-neutral-500 truncate">→ {body}</span>
      <span className="text-neutral-400 truncate text-right sm:text-left">
        {returns}
      </span>
    </div>
  );
}

function Faq() {
  const items: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "Can I use this with non-Brother label printers?",
      a: (
        <>
          Receipts: yes — ESC/POS is universal. Labels: only Brother QL for
          now, because the field-fill story is specific to their P-touch
          Template firmware. PRs welcome for Zebra, Dymo, etc.
        </>
      ),
    },
    {
      q: "Why CUPS raw instead of writing to /dev/usb directly?",
      a: (
        <>
          CUPS already handles USB enumeration, hot-plug, and IOKit. Bypassing
          it means re-implementing all of that and fighting macOS for the USB
          interface. CUPS in raw mode is a five-line subprocess and the right
          answer.
        </>
      ),
    },
    {
      q: "Is the localhost endpoint a security risk?",
      a: (
        <>
          It&apos;s bound to 127.0.0.1, so other machines can&apos;t reach it.
          Local apps on the same Mac could call it, but the only things they
          can do are print and pop the cash drawer — no filesystem access, no
          exfiltration surface.
        </>
      ),
    },
    {
      q: "Windows or Linux?",
      a: (
        <>
          Not yet. macOS only. The codebase is AppKit and shells out to CUPS;
          a Linux port is mostly swapping the menubar story.
        </>
      ),
    },
  ];

  return (
    <section className="mt-24 sm:mt-32">
      <SectionLabel>FAQ</SectionLabel>
      <div className="mt-6 divide-y divide-paper-100/5 border-y border-paper-100/5">
        {items.map((it) => (
          <details key={it.q} className="group py-5 marker:hidden">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base text-paper-50">
              <span className="font-serif text-[19px] sm:text-[21px] leading-snug">
                {it.q}
              </span>
              <span className="mt-1.5 text-neutral-600 transition group-open:rotate-45 text-lg leading-none">
                +
              </span>
            </summary>
            <div className="mt-3 pr-10 text-sm leading-relaxed text-neutral-400">
              {it.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-28 border-t border-paper-100/5 pt-10 text-sm text-neutral-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
        <div>
          <Monogram />
          <div className="mt-4 leading-relaxed">
            POSBridge — built by{" "}
            <a
              href="https://habarahonaa.com"
              className="text-paper-100 underline-offset-4 hover:underline"
            >
              Hollman Barahona
            </a>{" "}
            while wiring print hardware into a real Next.js POS deployment.
            <br />
            If it saves you a weekend of fighting Brother&apos;s docs,
            that&apos;s the goal.
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 text-xs uppercase tracking-[0.2em]">
          <a href={REPO} className="hover:text-paper-50">GitHub →</a>
          <a href={`${REPO}/issues`} className="hover:text-paper-50">Issues →</a>
          <a
            href="https://habarahonaa.com"
            className="hover:text-paper-50"
          >
            Portfolio →
          </a>
          <a
            href="https://download.brother.com/welcome/docp100307/cv_ql820_eng_ptemp_102.pdf"
            className="hover:text-paper-50"
          >
            P-touch spec →
          </a>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.25em] text-neutral-700">
        <span>v0.1.0 · MIT</span>
        <span className="font-serif italic text-neutral-600">— a small thing on purpose</span>
      </div>
    </footer>
  );
}

// ----- shared bits -----

function Monogram() {
  return (
    <a
      href="https://habarahonaa.com"
      aria-label="Hollman Barahona"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-paper-100/15 font-serif text-[20px] text-paper-50 transition hover:border-paper-100/40"
    >
      H
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500 flex items-center gap-3">
      <span className="h-px w-6 bg-paper-100/30" />
      {children}
    </p>
  );
}

function Sep() {
  return <span className="text-neutral-700">·</span>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 leading-relaxed">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-paper-100/20 text-xs text-paper-100/80">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function NumberedStep({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8">
      <div className="font-serif text-[28px] leading-none text-paper-100/40 pt-1">
        {n}
      </div>
      <div>
        <h3 className="font-serif text-[22px] sm:text-[24px] leading-tight text-paper-50">
          {title}
        </h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-paper-100/10 pt-3">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-paper-50/90 leading-relaxed">{children}</dd>
    </div>
  );
}
