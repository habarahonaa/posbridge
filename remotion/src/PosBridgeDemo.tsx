import { AbsoluteFill, useCurrentFrame, useVideoConfig, Easing, interpolate, spring } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: SERIF } = loadSerif();
const { fontFamily: MONO } = loadMono();

// ----- timing -----

export const DEMO_FPS = 30;
const TYPING_FRAMES = 270; // 9.0s typing
const HOLD_FRAMES = 24;    // 0.8s pause on completed code
const LABEL_FRAMES = 90;   // 3.0s label drop + hold
const TAIL_FRAMES = 36;    // 1.2s final hold for loop breath
export const DEMO_DURATION_FRAMES = TYPING_FRAMES + HOLD_FRAMES + LABEL_FRAMES + TAIL_FRAMES;

// ----- script (5 logical lines × multiple segments per line) -----
//
// The wire protocol *can* be one big stream, but reading it in five logical
// lines — init / select / fill object 1 / fill object 2 / print — makes the
// shape land in a glance instead of demanding scanning. Each line is a list
// of typed segments; trailing comments fade in once the line completes.

type SegKind = "cmd" | "name" | "value" | "delim";
type Segment = { text: string; kind: SegKind };
type Line = { segs: Segment[]; comment?: string };

const SCRIPT: Line[] = [
  {
    segs: [{ text: "^II", kind: "cmd" }],
    comment: "initialize",
  },
  {
    segs: [
      { text: "^TS", kind: "cmd" },
      { text: "\\x01", kind: "value" },
    ],
    comment: "select stored template",
  },
  {
    segs: [
      { text: "^ON", kind: "cmd" },
      { text: " ", kind: "delim" },
      { text: "customerName", kind: "name" },
      { text: " \\ ", kind: "delim" },
      { text: "^DI", kind: "cmd" },
      { text: " ", kind: "delim" },
      { text: "Hollman Barahona", kind: "value" },
      { text: " \\", kind: "delim" },
    ],
  },
  {
    segs: [
      { text: "^ON", kind: "cmd" },
      { text: " ", kind: "delim" },
      { text: "tracking", kind: "name" },
      { text: "     \\ ", kind: "delim" },
      { text: "^DI", kind: "cmd" },
      { text: " ", kind: "delim" },
      { text: "CM-12345", kind: "value" },
      { text: "        \\", kind: "delim" },
    ],
  },
  {
    segs: [{ text: "^FF", kind: "cmd" }],
    comment: "start print  →  label drops",
  },
];

const TOTAL_CHARS = SCRIPT.reduce(
  (acc, line) => acc + line.segs.reduce((s, seg) => s + seg.text.length, 0),
  0
);

const SEG_COLOR: Record<SegKind, string> = {
  cmd: "#6ee7b7",      // emerald-300
  name: "#f5e9d3",     // paper-100
  value: "#fde68a",    // amber-200
  delim: "#525252",    // neutral-600
};
const COMMENT_COLOR = "#737373"; // neutral-500

// ----- composition -----

export function PosBridgeDemo() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Progress through the typing — char-driven, ease-out so it doesn't feel mechanical.
  const typingProgress = interpolate(frame, [0, TYPING_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.2, 0.7, 0.4, 1),
  });
  const charsToShow = Math.round(typingProgress * TOTAL_CHARS);

  // Label drop animation kicks off after typing + hold.
  const labelStart = TYPING_FRAMES + HOLD_FRAMES;
  const labelDrop = spring({
    frame: frame - labelStart,
    fps: DEMO_FPS,
    config: { damping: 14, stiffness: 90, mass: 0.9 },
    durationInFrames: 60,
  });

  return (
    <AbsoluteFill style={{ background: "#0a0a09", fontFamily: MONO }}>
      <Grain />
      <DotGrid />

      <AbsoluteFill
        style={{
          padding: 56,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 22,
        }}
      >
        <Header frame={frame} />

        <Terminal>
          <ScanlineOverlay />
          <TypedScript charsToShow={charsToShow} />
        </Terminal>

        {/* Reserve space for the label from frame 0 so the column doesn't
            reflow when the drop animation starts. */}
        <div style={{ minHeight: 160, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <LabelOutput drop={labelDrop} width={width} />
        </div>

        <Footer frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ----- pieces -----

function Header({ frame }: { frame: number }) {
  const fade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  return (
    <div
      style={{
        opacity: fade,
        transform: `translateY(${interpolate(fade, [0, 1], [8, 0])}px)`,
        display: "flex",
        alignItems: "baseline",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: SERIF,
          color: "#f5e9d3",
          fontSize: 44,
          letterSpacing: -0.5,
        }}
      >
        POSBridge
      </span>
      <span
        style={{
          color: "#737373",
          fontSize: 14,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        wire — bytes to the QL-800
      </span>
    </div>
  );
}

function Terminal({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        border: "1px solid rgba(245, 233, 211, 0.12)",
        background: "rgba(8, 8, 7, 0.7)",
        boxShadow: "0 30px 80px -30px rgba(0, 0, 0, 0.7)",
        overflow: "hidden",
      }}
    >
      <TerminalChrome />
      <div style={{ padding: "28px 36px", minHeight: 380 }}>{children}</div>
      <TerminalStatus />
    </div>
  );
}

function TerminalChrome() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        background: "rgba(0,0,0,0.3)",
        borderBottom: "1px solid rgba(245, 233, 211, 0.05)",
      }}
    >
      <div style={{ display: "flex", gap: 7 }}>
        <Dot color="#404040" />
        <Dot color="#404040" />
        <Dot color="#404040" />
      </div>
      <span
        style={{
          color: "#525252",
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        POSBridge — 127.0.0.1:9999 · /print/label
      </span>
      <div style={{ width: 60 }} />
    </div>
  );
}

function TerminalStatus() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        borderTop: "1px solid rgba(245, 233, 211, 0.05)",
        fontSize: 11,
        color: "#737373",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.6)",
          }}
        />
        listening
      </span>
      <span>P-touch Template</span>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
      }}
    />
  );
}

function TypedScript({ charsToShow }: { charsToShow: number }) {
  // We emit text + explicit "\n" inside a <pre>, so the trailing <Caret/>
  // naturally lands at the end of the last typed line (no <div> per row).
  const nodes: React.ReactNode[] = [];
  let charsRemaining = charsToShow;
  let key = 0;

  outer: for (let i = 0; i < SCRIPT.length; i++) {
    const line = SCRIPT[i];
    let lineFullyTyped = true;
    let lineHadAnyChars = false;

    for (let s = 0; s < line.segs.length; s++) {
      const seg = line.segs[s];
      const visibleLen = Math.min(seg.text.length, Math.max(0, charsRemaining));
      const visible = seg.text.slice(0, visibleLen);
      if (visible.length > 0) {
        nodes.push(
          <span key={key++} style={{ color: SEG_COLOR[seg.kind] }}>
            {visible}
          </span>
        );
        lineHadAnyChars = true;
      }
      charsRemaining -= visibleLen;
      if (visibleLen < seg.text.length) {
        lineFullyTyped = false;
        break;
      }
    }

    if (!lineHadAnyChars) break outer;

    if (line.comment && lineFullyTyped) {
      nodes.push(
        <span
          key={key++}
          style={{ color: COMMENT_COLOR, fontStyle: "italic" }}
        >
          {"   /* "}
          {line.comment}
          {" */"}
        </span>
      );
    }

    if (!lineFullyTyped) break outer;
    if (i < SCRIPT.length - 1) {
      nodes.push(<span key={key++}>{"\n"}</span>);
    }
  }

  return (
    <pre
      style={{
        margin: 0,
        fontFamily: MONO,
        fontSize: 22,
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
        color: "#e5e5e5",
      }}
    >
      <code>
        {nodes}
        <Caret />
      </code>
    </pre>
  );
}

function Caret() {
  // Inline blinking caret rendered via frame parity — no CSS needed under Remotion.
  const frame = useCurrentFrame();
  const visible = Math.floor(frame / 12) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 11,
        height: 24,
        background: "#f5e9d3",
        verticalAlign: "middle",
        marginLeft: 4,
        marginBottom: -2,
        opacity: visible ? 0.95 : 0,
      }}
    />
  );
}

function LabelOutput({ drop, width }: { drop: number; width: number }) {
  const translateY = interpolate(drop, [0, 1], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(drop, [0, 0.4, 1], [0, 0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <Label width={Math.min(640, width * 0.55)} />
    </div>
  );
}

function Label({ width }: { width: number }) {
  return (
    <div
      style={{
        width,
        background: "#f5e9d3",
        color: "#0a0a09",
        padding: "20px 28px",
        borderRadius: 6,
        boxShadow: "0 18px 40px -8px rgba(0, 0, 0, 0.6), 0 4px 0 rgba(0,0,0,0.3)",
        position: "relative",
        // Dashed bottom edge to suggest a perforation / tear-line.
        borderBottom: "2px dashed rgba(10, 10, 9, 0.25)",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#525252",
          marginBottom: 8,
        }}
      >
        Brother QL-800 · 62mm
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 30,
          lineHeight: 1.05,
          color: "#0a0a09",
        }}
      >
        Hollman Barahona
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 16,
          color: "#404040",
          marginTop: 8,
        }}
      >
        Managua, Nicaragua
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 13,
          color: "#737373",
          marginTop: 14,
          letterSpacing: "0.18em",
        }}
      >
        TRACKING · CM-12345
      </div>
    </div>
  );
}

function Footer({ frame }: { frame: number }) {
  const fade = interpolate(frame, [DEMO_DURATION_FRAMES - 60, DEMO_DURATION_FRAMES - 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: fade,
        textAlign: "center",
        color: "#737373",
        fontFamily: SERIF,
        fontSize: 22,
        fontStyle: "italic",
      }}
    >
      from web fetch to printed label — pure bytes.
    </div>
  );
}

// ----- atmosphere -----

function Grain() {
  // Render via SVG fractal noise; mix-blend-mode approximated through opacity.
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.06, mixBlendMode: "soft-light" }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
}

function DotGrid() {
  return (
    <AbsoluteFill
      style={{
        backgroundImage:
          "radial-gradient(rgba(245, 233, 211, 0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        maskImage:
          "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 95%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 95%)",
      }}
    />
  );
}

function ScanlineOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(245, 233, 211, 0.012) 0, rgba(245, 233, 211, 0.012) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}
