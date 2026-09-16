import { Logo } from "../Logo";

export function TitleScreen({ sceneReady, onPlay }: { sceneReady: boolean; onPlay: () => void }) {
  return (
    <section className="title-screen" aria-label="Boas-vindas a Eco City">
      <h1><Logo /></h1>
      <div className="title-dock">
        <button className="play-button" disabled={!sceneReady} onClick={onPlay}>JOGAR</button>
        {!sceneReady && <p role="status">Preparando a cidade…</p>}
      </div>
    </section>
  );
}
