import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from "react";
import { useGame } from "../stores/gameStore";
import { GameUI } from "../ui/GameUI";
import { useLoadingScreen } from "../ui/useLoadingScreen";
import { useGameAudio } from "../audio/useGameAudio";
const World = lazy(() => import("./World"));
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onError = useCallback(() => setFailed(true), []);
  const settings = useGame((s) => s.progress.settings);
  const selected = useGame((s) => s.progress.selectedProblem);
  const phase = useGame((s) => s.progress.phase);
  const overlay = useGame((s) => s.overlay);
  const revealed = useLoadingScreen(sceneReady, failed, settings.reducedMotion);
  useGameAudio(revealed);
  return (
    <main
      className={`game ${settings.reducedMotion ? "reduced-motion" : ""} ${selected && phase!=="RETURNING" ? "focused" : ""}`}
    >
      <div className="world" inert={!revealed || Boolean(overlay)} aria-hidden={!revealed} aria-label="Diorama 3D da Praça do Encontro">
        <SceneBoundary onError={onError}>
          <Suspense fallback={null}>
            <World onReady={onSceneReady} interactive={revealed && !overlay} />
          </Suspense>
        </SceneBoundary>
      </div>
      {revealed && <GameUI sceneReady={sceneReady} />}
    </main>
  );
}
