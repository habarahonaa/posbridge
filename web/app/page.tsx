import { CodeBlock } from "./components/code-block";
import { ArchDiagram } from "./components/arch-diagram";

const REPO = "https://github.com/habarahonaa/posbridge";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <Hero />
      <Diagram />
      <Story />
      <Quickstart />
      <Anatomy />
      <ApiTable />
      <Faq />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <header className="mb-20 sm:mb-28">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>v0.1.0 · macOS 13+</span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight text-neutral-50">
        Print receipts and Brother QL labels from a web app on macOS.
      </h1>
      <p className="mt-6 text-lg sm:text-xl leading-relaxed text-neutral-400">
        POSBridge is a tiny native menubar helper that exposes ESC/POS receipt
        printers and Brother QL label printers to a hosted web app over
        localhost HTTP. No Tauri shell. No Brother SDK. No print server. One
        small Swift binary on the cashier&apos;s Mac.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={REPO}
          className="rounded-md bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
        >
          View on GitHub →
        </a>
        <a
          href="#quickstart"
          className="rounded-md border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:text-neutral-50"
        >
          Quick start
        </a>
        <a
          href="#why"
          className="rounded-md border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:text-neutral-50"
        >
          Why this exists
        </a>
      </div>
    </header>
  );
}

function Diagram() {
  return (
    <section className="mb-20 sm:mb-28">
      <ArchDiagram />
      <p className="mt-6 text-sm text-neutral-500 leading-relaxed">
        The browser cannot talk to USB printers. POSBridge sits on the
        user&apos;s Mac, exposes a tiny localhost HTTP API, and translates JSON
        jobs into the byte-level protocol each printer speaks. Your web app
        makes one <code className="text-neutral-300">fetch</code> per print.
      </p>
    </section>
  );
}

function Story() {
  return (
    <section id="why" className="mb-20 sm:mb-28">
      <SectionLabel>The thing that took weeks to find out</SectionLabel>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50">
        b-PAC isn&apos;t the answer on macOS. P-touch Template is.
      </h2>
      <div className="mt-6 space-y-5 text-neutral-300 leading-relaxed">
        <p>
          If you&apos;ve tried to print Brother QL labels from a web app on
          macOS, you&apos;ve probably found the b-PAC SDK, seen it claims to
          support template field-fill, and assumed it was the answer.
        </p>
        <p>
          It isn&apos;t. <strong className="text-neutral-50">b-PAC is Windows-only.</strong>{" "}
          Brother&apos;s macOS download is for older OS versions. The framework
          everyone references on Stack Overflow (
          <code className="text-neutral-200">bpac.framework</code>) does not
          exist on current macOS. Mac developers get routed to{" "}
          &ldquo;Brother Print SDK for Mac,&rdquo; which does raster printing
          but not field-fill. AppleScript hooks in P-touch Editor for Mac have
          been removed across recent versions. Several GitHub projects claim
          to bridge b-PAC to the Mac and quietly don&apos;t.
        </p>
        <p>
          The actual answer is <strong className="text-neutral-50">P-touch Template</strong>,
          a printer-side feature that almost no blog post leads with:
        </p>
      </div>

      <ol className="mt-8 space-y-4 text-neutral-300">
        <Step n={1}>
          Design your label visually in P-touch Editor, naming each text and
          barcode object (<code>customerName</code>, <code>tracking</code>, …).
        </Step>
        <Step n={2}>
          Upload the design <em>into the printer&apos;s flash memory</em> with
          Transfer Express. The printer assigns it a number.
        </Step>
        <Step n={3}>
          From any OS, send a small ASCII command stream over USB. The
          firmware does the substitution.
        </Step>
      </ol>

      <div className="mt-8">
        <CodeBlock language="text">
{`^II                          # initialize
^TS<n>                       # select stored template by index
^ON<name>\\^DI<value>\\        # for each named object: select, then insert
^FF                          # start print`}
        </CodeBlock>
      </div>

      <p className="mt-6 text-neutral-300 leading-relaxed">
        No SDK on the host machine. No Brother framework. Pure bytes piped
        through CUPS in raw mode. POSBridge is, in essence, a small Swift
        program that builds those streams. The receipt path uses the same
        idea with ESC/POS instead.
      </p>
    </section>
  );
}

function Quickstart() {
  return (
    <section id="quickstart" className="mb-20 sm:mb-28">
      <SectionLabel>Quick start</SectionLabel>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50">
        Three steps to a printed receipt.
      </h2>

      <div className="mt-8 space-y-8">
        <NumberedStep n={1} title="Install printers in macOS">
          <p className="text-neutral-400 mb-3">
            System Settings → Printers & Scanners. Add your receipt printer,
            rename the queue to <code>Receipt</code>. Add your Brother QL,
            rename it to <code>Label</code>.
          </p>
          <CodeBlock language="bash">{`lpstat -p Receipt Label`}</CodeBlock>
        </NumberedStep>

        <NumberedStep n={2} title="Build and run">
          <CodeBlock language="bash">
{`git clone https://github.com/habarahonaa/posbridge.git
cd posbridge
swift run`}
          </CodeBlock>
          <p className="mt-3 text-neutral-400 text-sm">
            First launch: right-click the binary in Finder → Open once to get
            past Gatekeeper. After that it&apos;s silent.
          </p>
        </NumberedStep>

        <NumberedStep n={3} title="Print from your web app">
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
    <section className="mb-20 sm:mb-28">
      <SectionLabel>What it actually is</SectionLabel>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50">
        A small thing on purpose.
      </h2>
      <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
        <Fact label="Language">Swift 5.9 · single dep on Swifter</Fact>
        <Fact label="Runtime">macOS 13+, menubar LSUIElement</Fact>
        <Fact label="Network">127.0.0.1 only · port configurable</Fact>
        <Fact label="Receipt">
          Generic ESC/POS · Epson, Star, Citizen, Volcora, generic OEMs
        </Fact>
        <Fact label="Label">
          Brother QL series · QL-800 / 810W / 820NWB / 1100 / 1110NWB
        </Fact>
        <Fact label="Drawer">ESC/POS pulse via the receipt printer&apos;s RJ-11</Fact>
        <Fact label="Runtime deps on the Mac">
          None · no driver SDK, no node, no Brother framework
        </Fact>
        <Fact label="License">MIT</Fact>
      </dl>
    </section>
  );
}

function ApiTable() {
  return (
    <section className="mb-20 sm:mb-28">
      <SectionLabel>API</SectionLabel>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50">
        Four endpoints. JSON in, JSON out.
      </h2>
      <div className="mt-8 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-900/60 text-neutral-400">
            <tr>
              <Th>Method</Th>
              <Th>Path</Th>
              <Th>Body</Th>
              <Th>Returns</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-neutral-200">
            <Row method="GET" path="/health" body="—" returns="BridgeStatus" />
            <Row method="POST" path="/print/receipt" body="ReceiptPayload" returns="{ ok: true }" />
            <Row method="POST" path="/print/label" body="LabelPayload" returns="{ ok: true }" />
            <Row method="POST" path="/drawer/kick" body="DrawerPayload" returns="{ ok: true }" />
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        Errors are HTTP 400 with{" "}
        <code className="text-neutral-300">
          {`{ ok: false, code, message }`}
        </code>
        . Full payload schemas in the README.
      </p>
    </section>
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
    <section className="mb-20 sm:mb-28">
      <SectionLabel>FAQ</SectionLabel>
      <div className="mt-6 divide-y divide-neutral-900 border-y border-neutral-900">
        {items.map((it) => (
          <details key={it.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base text-neutral-100">
              <span>{it.q}</span>
              <span className="mt-1 text-neutral-600 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-3 text-sm leading-relaxed text-neutral-400">
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
    <footer className="mt-24 border-t border-neutral-900 pt-8 text-sm text-neutral-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span>POSBridge · MIT</span>
        <div className="flex gap-5">
          <a href={REPO} className="hover:text-neutral-200">GitHub</a>
          <a href={`${REPO}/issues`} className="hover:text-neutral-200">Issues</a>
          <a
            href="https://download.brother.com/welcome/docp100307/cv_ql820_eng_ptemp_102.pdf"
            className="hover:text-neutral-200"
          >
            P-touch Template spec
          </a>
        </div>
      </div>
    </footer>
  );
}

// ----- shared bits -----

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
      {children}
    </p>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 leading-relaxed">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-xs text-neutral-400">
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
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-3 text-base font-medium text-neutral-100">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-800 text-sm text-neutral-400">
          {n}
        </span>
        {title}
      </h3>
      <div className="mt-3 pl-10">{children}</div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-neutral-200">{children}</dd>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 font-medium text-xs uppercase tracking-[0.15em]">
      {children}
    </th>
  );
}

function Row({
  method,
  path,
  body,
  returns,
}: {
  method: string;
  path: string;
  body: string;
  returns: string;
}) {
  const methodColor =
    method === "GET" ? "text-emerald-400" : "text-amber-400";
  return (
    <tr className="hover:bg-neutral-900/40">
      <td className={`px-4 py-3 font-medium ${methodColor}`}>{method}</td>
      <td className="px-4 py-3 text-neutral-100">{path}</td>
      <td className="px-4 py-3 text-neutral-400">{body}</td>
      <td className="px-4 py-3 text-neutral-400">{returns}</td>
    </tr>
  );
}
