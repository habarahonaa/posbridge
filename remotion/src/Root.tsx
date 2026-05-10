import { Composition } from "remotion";
import { PosBridgeDemo, DEMO_DURATION_FRAMES, DEMO_FPS } from "./PosBridgeDemo";

export function Root() {
  return (
    <>
      <Composition
        id="PosBridgeDemo"
        component={PosBridgeDemo}
        durationInFrames={DEMO_DURATION_FRAMES}
        fps={DEMO_FPS}
        width={1280}
        height={720}
      />
    </>
  );
}
