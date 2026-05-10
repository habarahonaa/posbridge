# remotion/

Renders the protocol-typing demo clip used in the project README. The live React terminal in `web/` covers the landing page; markdown on GitHub strips JS, so the README needs a video file.

## Output

- `assets/posbridge-demo.gif` (~1.1 MB) — embedded at the top of the project README via `![]()`.
- `assets/posbridge-demo.mp4` (~0.4 MB) — same composition, for social posts / portfolio pieces.

Only `assets/` is committed to git. `remotion/out/` and `remotion/node_modules/` are gitignored.

## Re-rendering

```bash
cd remotion
npm install
npm run render        # full render: PNG sequence → MP4 (uses system ffmpeg)
npm run gif           # MP4 → optimized loopable GIF
cp out/posbridge-demo.{mp4,gif} ../assets/
```

## Why we don't use Remotion's bundled ffmpeg

The arm64 Remotion compositor links against SDL2 from `/opt/homebrew/`, which is the native arm64 Homebrew path. If your Homebrew lives at `/usr/local/` (Rosetta / x86_64), the bundled ffmpeg refuses to start. So we render to a PNG sequence with `--sequence` and let the system ffmpeg stitch the frames.

## Composition

`src/PosBridgeDemo.tsx` — a single 14s composition at 30 fps, 1280×720:

| Beat              | Frames     | What happens                                             |
| ----------------- | ---------- | -------------------------------------------------------- |
| Header fade-in    | 0–20       | "POSBridge — wire — bytes to the QL-800" appears         |
| Protocol typing   | 0–270      | 5 logical lines of P-touch Template byte stream type out |
| Hold              | 270–294    | Pause on completed code                                  |
| Label drop        | 294–384    | A receipt-paper-cream label springs in below the terminal |
| Tail              | 384–420    | Footer tagline fades in: "from web fetch to printed label — pure bytes." |

Tokens are color-coded by role: commands in emerald-300, object names in paper-100, values in amber-200, delimiters in neutral-600. Comments fade in italic-gray once the line they belong to finishes typing.

The aesthetic mirrors the Next.js landing terminal (`web/app/components/protocol-terminal.tsx`) — same fonts (Instrument Serif + JetBrains Mono via `@remotion/google-fonts`), same scanline overlay, same paper-cream accent.
