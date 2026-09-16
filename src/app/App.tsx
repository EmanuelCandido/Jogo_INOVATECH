import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from "react";
import { useGame } from "../stores/gameStore";
import { GameUI } from "../ui/GameUI";
const World = lazy(() => import("./World"));
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error" role="alert">
        Não foi possível carregar a cena 3D. Verifique o suporte a WebGL e
        recarregue a página.
        <button onClick={() => location.reload()}>Tentar novamente</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const settings = useGame((s) => s.progress.settings);
  const selected = useGame((s) => s.progress.selectedProblem);
  const phase = useGame((s) => s.progress.phase);
  return (
    <main
      className={`game ${settings.reducedMotion ? "reduced-motion" : ""} ${selected && phase!=="RETURNING" ? "focused" : ""}`}
    >
      <div className="world" aria-label="Diorama 3D da Praça do Encontro">
        <SceneBoundary>
          <Suspense
            fallback={<div className="loading">Preparando a cidade…</div>}
          >
            <World onReady={onSceneReady} interactive={sceneReady} />
          </Suspense>
        </SceneBoundary>
      </div>
      <GameUI sceneReady={sceneReady} />
    </main>
  );
}
