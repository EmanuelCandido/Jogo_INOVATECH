import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import {useLoadingSnapshot} from '../../game/useLoadingActive';
import {useShaderGate} from './ShaderGate';

/** Signal after the loaded scene has had a chance to render, including on reload. */
export function SceneReady({ onReady }: { onReady: () => void }) {
  const {active,loaded}=useLoadingSnapshot();
  const invalidate = useThree((s) => s.invalidate);
  const shaders = useShaderGate((s) => s.state);
  useEffect(() => {
    if (active || loaded === 0 || shaders !== 'ready') return;
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
  }, [active, loaded, shaders, invalidate, onReady]);
  return null;
}
