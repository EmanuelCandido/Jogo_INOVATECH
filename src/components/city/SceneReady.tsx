import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";

/** Signal after the loaded scene has had a chance to render, including on reload. */
export function SceneReady({ onReady }: { onReady: () => void }) {
  const active = useProgress((s) => s.active);
  const loaded = useProgress((s) => s.loaded);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active || loaded === 0) return;
    let secondFrame = 0;
    invalidate();
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (!useProgress.getState().active) onReady();
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [active, loaded, invalidate, onReady]);
  return null;
}
