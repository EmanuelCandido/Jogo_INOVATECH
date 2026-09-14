import { useEffect, useRef } from "react";
import { Logo } from "../Logo";

export function TitleScreen({ sceneReady, onPlay }: { sceneReady: boolean; onPlay: () => void }) {
  const play = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (sceneReady) play.current?.focus({ preventScroll: true }); }, [sceneReady]);
  return (
    <section className="title-screen" aria-label="Boas-vindas a Eco City">
      <h1><Logo /></h1>
      <div className="title-dock">
        <button ref={play} className="play-button" disabled={!sceneReady} onClick={onPlay}>JOGAR</button>
        <p role={sceneReady ? undefined : "status"}>
          {sceneReady ? "Uma cidade melhor começa com você." : "Preparando a cidade…"}
        </p>
      </div>
    </section>
  );
}
