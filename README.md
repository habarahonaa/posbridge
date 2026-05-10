# POSBridge

A tiny native macOS menubar app that prints **Brother QL labels** with firmware-level template field-fill — plus ESC/POS receipts and a cash-drawer kick on the side — straight from a browser-based POS, without giving up on hosted web tooling.

```
   ┌───────────────────────┐        ┌──────────────────────────┐        ┌────────────┐
   │  Your POS web app     │  HTTPS │  POSBridge.app           │  USB   │  Receipt + │
   │  (Vercel, Netlify…)   │ ─────▶ │  127.0.0.1:9999          │ ─────▶ │  QL label  │
   │  fetch('/print/…')    │        │  Swift menubar helper    │        │  printers  │
   └───────────────────────┘        └──────────────────────────┘        └────────────┘
```

The browser cannot talk to USB printers. POSBridge sits on the user's Mac, exposes a tiny localhost HTTP API, and translates JSON jobs into the byte-level protocol each printer speaks. Your web app makes one `fetch` per print. That's it.

---

## The thing that took me weeks to find out, written down so you don't repeat it

If you've tried to print Brother QL labels from a web app on macOS, you've probably found the [Brother b-PAC SDK](https://support.brother-usa.com/app/answers/detail/a_id/80303), seen it claims to support template field-fill workflows, and assumed it was the answer.

It isn't. **b-PAC is Windows-only.** The macOS download Brother lists is for older OS versions, and the framework everyone references on Stack Overflow (`bpac.framework`) does not exist on current macOS. Brother's developer pages quietly route Mac users to "Brother Print SDK for Mac", which does raster printing but does *not* expose b-PAC's `SetText("fieldName", value)` template-fill API. AppleScript hooks in P-touch Editor for Mac have been removed across recent versions. Several projects on GitHub claim to bridge b-PAC to the Mac and quietly don't.

The actual answer is **P-touch Template**, a printer-side feature most blog posts skip past:

1. You design your label visually in P-touch Editor, naming each text/barcode object (`customerName`, `addressLine1`, `tracking`, …).
2. You upload the design **into the printer's flash memory** with Transfer Express. The printer assigns it a number.
3. At runtime, from any OS, you send a small ASCII command stream over USB:

   ```
   ^II ^TS<n> ^ON<name>\^DI<value>\ … ^FF
   ```

   `^II` resets, `^TS<n>` selects the stored template by index, each `^ON<name>\^DI<value>\` pair fills one named object, `^FF` triggers print. The QL-800 firmware itself does the substitution. **No SDK on the host machine. No Brother framework. Pure bytes.**

POSBridge is, in essence, a small Swift program that builds those byte streams and pipes them through CUPS in raw mode. The receipt path is the same idea with ESC/POS instead.

This README leads with that story because it's the part you can't find by Googling. The rest is implementation.

---

## What POSBridge actually is

| | |
|---|---|
| Language | Swift 5.9, single dependency on [`Swifter`](https://github.com/httpswift/swifter) for HTTP |
| Runtime | macOS 13+, runs as a menubar `LSUIElement` (no Dock icon) |
| Network | Localhost-only HTTP server on 127.0.0.1:9999 (configurable) |
| Receipt | Generic ESC/POS over CUPS raw — works with Epson, Star, Citizen, Volcora, generic OEMs |
| Label | Brother QL series via P-touch Template — QL-800, QL-810W, QL-820NWB, QL-1100, QL-1110NWB |
| Drawer | ESC/POS pulse through the receipt printer's RJ-11 jack |
| Dependencies on the cashier's Mac at runtime | **None.** No driver SDK, no Brother framework, no node runtime |

It is **not** a Tauri shell. It is **not** a print server you expose to the network. It is **not** a wrapper around someone else's binary. It runs alongside Chrome and exposes the printers Chrome cannot reach.

---

## Why localhost HTTP and not WebUSB / Tauri / a print queue / …

| Approach | Why not |
|---|---|
| **WebUSB from the browser** | Brittle on macOS — CUPS claims the USB interface and the browser can't pry it loose without removing the printer from System Settings. Doesn't work for QL-800 raster anyway. |
| **Tauri shell wrapping the web app** | Forces every cashier to run a desktop build of your POS. Defeats the point of Vercel hosting. |
| **A print server on the LAN** | Makes one Mac responsible for everyone, introduces auth, exposes more surface. Overkill for a single store. |
| **`window.print()` to CUPS** | Works, but fights you on margins, dialogs, latency, and gives no programmatic access to the cash drawer. |
| **QZ Tray / commercial bridges** | Solid, but the unsigned-runtime warning on every print without a paid certificate makes them awkward to ship. |

A localhost helper is the smallest thing that works. Chrome treats `http://127.0.0.1` as a secure context, so an HTTPS-hosted web app can `fetch` the bridge directly with no mixed-content warnings and no self-signed cert dance.

---

## Quick start

### 1. Install printers in macOS

Open **System Settings → Printers & Scanners**.

- Add your receipt printer. Rename the queue to `Receipt` (or whatever you set in `settings.json`).
- Add your Brother QL. Rename the queue to `Label`.

Confirm both are reachable:

```bash
lpstat -p Receipt Label
```

### 2. Build and run

```bash
git clone https://github.com/habarahonaa/posbridge.git
cd posbridge
swift run
```

First launch: macOS will warn it's an unidentified developer. Right-click the binary in Finder → Open once. After that it runs silently.

A printer icon appears in the menubar. Click it to confirm both queues are detected — the icon turns green when they are.

### 3. Print from your web app

The primary use case — a Brother QL label with field substitution done by the printer's firmware:

```ts
await fetch("http://127.0.0.1:9999/print/label", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    template: "shipping",
    fields: {
      customerName: "Hollman Barahona",
      addressLine1: "Managua, Nicaragua",
      tracking: "CM-12345",
    },
  }),
});
```

This requires a one-time template upload — see [**Setting up the QL label workflow**](#setting-up-the-ql-label-workflow) below for the visual P-touch Editor → Transfer Express dance. After that, every label is one fetch.

The receipt path is the same shape and needs no setup beyond the CUPS queue:

```ts
await fetch("http://127.0.0.1:9999/print/receipt", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    storeName: "My Store",
    saleId: "TEST-1",
    occurredAt: new Date().toISOString(),
    lines: [{ name: "Coffee", quantity: 1, unitPriceCents: 450, totalCents: 450 }],
    subtotalCents: 450,
    totalCents: 450,
    currency: "USD",
    paymentMethod: "Cash",
    openDrawer: true,
  }),
});
```

The cash drawer pops via `openDrawer: true` on a receipt, or a direct `POST /drawer/kick`.

---

## API

All endpoints are JSON. CORS is open (`*`) since the bridge is bound to localhost and unreachable externally.

### `GET /health`

```json
{
  "ok": true,
  "version": "0.1.0",
  "printers": {
    "receipt": { "detected": true,  "name": "Receipt", "detail": "via CUPS raw" },
    "label":   { "detected": false, "name": null,      "detail": "Add your Brother QL printer …" }
  }
}
```

### `POST /print/receipt`

```ts
{
  storeName: string;
  storeFooter?: string;
  saleId: string;
  cashier?: string;
  occurredAt: string;        // ISO8601
  lines: Array<{
    name: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  subtotalCents: number;
  taxCents?: number;
  totalCents: number;
  paymentMethod?: string;
  amountTenderedCents?: number;
  changeCents?: number;
  currency: string;          // "USD", "EUR", "NIO", …
  openDrawer?: boolean;      // pop the cash drawer after printing
}
```

### `POST /print/label`

```ts
{
  template: string;                    // friendly name from templates.json
  fields: Record<string, string>;      // matches Object Names in P-touch Editor
  copies?: number;                     // 1..99, default 1
}
```

### `POST /drawer/kick`

```ts
{ pin?: 2 | 5 }   // RJ-11 pin to pulse, default 2
```

### Errors

```json
{
  "ok": false,
  "code": "printer_not_found" | "template_not_found" | "template_field_missing" |
          "print_failed"      | "invalid_payload"    | "internal",
  "message": "Human-readable explanation."
}
```

---

## Setting up the QL label workflow

This is the only fiddly part of the install, because Brother's macOS tooling for template upload is dated. Worth doing once.

1. **Install the Brother QL driver** from [support.brother.com](https://support.brother.com).
2. **Install P-touch Editor for Mac** (App Store or Brother's site).
3. **Author your template:**
   - File → New → pick the QL-800 + your label width.
   - Drop in text/barcode objects.
   - For each one, open the inspector and set its **Object Name** (e.g. `customerName`). This is the key your web app will fill at runtime.
   - Save.
4. **Export the template:** File → Transfer Template → Transfer. Editor produces a `.blf` file.
5. **Upload to the printer:** Open Transfer Express, point it at the `.blf`, transfer to the connected QL. Note the assigned template number.
6. **Switch the printer into P-touch Template mode** with Brother's `P-touch Template Settings` utility (installs alongside the driver):
   - Default Command Mode: `P-touch Template`
   - Default Template Number: `1`
   - Command Prefix Character: `^`
   - Character Code Table: `Windows 1252`
   - Click **Set**.
7. **Edit `templates.json`** so POSBridge knows the friendly name → number mapping:

   ```json
   {
     "shipping": {
       "number": 1,
       "description": "Shipping label",
       "requiredFields": ["customerName", "addressLine1", "tracking"]
     }
   }
   ```

8. Restart POSBridge. Menubar → "Test label print" should produce a label using whatever default text the BLF has.

Reference: [Brother — Software Developer's Manual: P-touch Template Command Reference (PDF)](https://download.brother.com/welcome/docp100307/cv_ql820_eng_ptemp_102.pdf).

---

## Configuration

`settings.json` (next to the binary in dev, or `~/Library/Application Support/POSBridge/settings.json` once installed):

```json
{
  "port": 9999,
  "receiptPrinter": {
    "cupsQueueName": "Receipt",
    "lineWidth": 48,
    "characterCodepage": "PC858"
  },
  "labelPrinter": {
    "cupsQueueName": "Label"
  },
  "store": {
    "name": "My Store",
    "footer": "Thank you!"
  }
}
```

Override locations via env vars: `POSBRIDGE_SETTINGS=/path/to/settings.json`, `POSBRIDGE_TEMPLATES=/path/to/templates.json`.

---

## Packaging as a `.app`

For "set it and forget it" auto-launch on a cashier Mac:

```bash
swift build -c release
mkdir -p POSBridge.app/Contents/MacOS POSBridge.app/Contents/Resources
cp .build/release/POSBridge POSBridge.app/Contents/MacOS/
cp Resources/Info.plist POSBridge.app/Contents/
codesign --sign - --deep POSBridge.app   # ad-hoc signing; survives Gatekeeper after first right-click→Open
```

Move `POSBridge.app` to `/Applications`, add it to **System Settings → General → Login Items**, and put your production `settings.json` and `templates.json` at `~/Library/Application Support/POSBridge/`.

Without an Apple Developer Program account, the first launch on each Mac needs a one-time right-click → Open to get past Gatekeeper. After that, no warnings.

---

## FAQ

**Can I use this with a non-Brother label printer?**
Receipts: yes, almost certainly — ESC/POS is universal. Labels: only Brother QL series for now, because the field-fill story is specific to their P-touch Template firmware. PRs welcome for Zebra, Dymo, etc.

**Why CUPS raw instead of writing to `/dev/usb/...` directly?**
CUPS already handles USB enumeration, hot-plug, and the IOKit dance. Bypassing it means re-implementing all of that and fighting macOS for the USB interface. CUPS in raw mode is a five-line subprocess and the right answer.

**Can I run this without P-touch Editor for Mac?**
For receipt printing and the cash drawer — yes. For labels with field-fill — no, because P-touch Editor is the only tool that produces `.lbx` / `.blf` template files in the format the QL firmware expects.

**Is the localhost endpoint a security risk?**
It's bound to 127.0.0.1, so other machines on the network can't reach it. Any local app on the same Mac could call it, but the only things it can do are print stuff and pop the cash drawer — no filesystem access, no exfiltration surface.

**Does this work on Windows or Linux?**
No. macOS only. The codebase uses AppKit (NSStatusItem) and shells out to CUPS. A Windows port would be cleaner-slate; a Linux port is just CUPS plus a different menubar story.

**Why the default `printer.fill` SF Symbol and not a custom icon?**
Because shipping a working tool beats waiting for a custom icon. It's on the roadmap.

---

## Roadmap

- [ ] Custom monochrome menubar icon
- [ ] First-run onboarding window (CUPS queue picker, sample print)
- [ ] Print log window
- [ ] Generic raster fallback for non-Brother label printers
- [ ] Signed + notarized release builds

---

## Contributing

Issues and PRs welcome. Run the test suite locally:

```bash
swift test
```

Code style: stdlib over dependencies, comments explain *why* and not *what*, no premature abstraction.

---

## License

MIT. See [`LICENSE`](./LICENSE).

---

Built by **[Hollman Barahona](https://habarahonaa.com)** while wiring print hardware into a real Next.js POS deployment. If POSBridge saves you a weekend of fighting with Brother's docs, that's the goal.
