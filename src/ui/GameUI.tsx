import { useState } from "react";
import { useGame } from "../stores/gameStore";
import { story } from "../content/story";
import { DialogueStage } from "./dialogue/DialogueStage";
import { QuestPanel } from "./hud/QuestPanel";
import { SettingsPanel } from "./menus/SettingsPanel";
import { MapControls } from "./hud/MapControls";
import {PerformanceReadout} from './hud/PerformanceReadout';
import { Logo } from './Logo';
import { TitleScreen } from './menus/TitleScreen';
export function GameUI({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, notice } = useGame();
  const [menu, setMenu] = useState(false);
  // The title is presentation state; opening it must never reset a saved game.
  const [showTitle, setShowTitle] = useState(() => s.phase === 'INTRO' && s.introIndex === 0);
  return (
    <div className={`interface${showTitle ? ' on-title' : ''}`}>
      <header className="topbar">
        {!showTitle && <a className="brand" href="./" aria-label="Eco City início"><Logo compact /></a>}
        {!showTitle && <>
        <div className="chapter-badge">
          <span>01</span>
          <div>
            VILA ESPERANÇA<small>O começo da mudança</small>
          </div>
        </div>
        </>}
        <div className="header-actions">
          {!showTitle && <div className="balance" aria-label={s.coins + " Moedas da Cidade"}>
            <span className="coin" aria-hidden="true">✦</span>
            <div>
              <b>{s.coins.toLocaleString("pt-BR")}</b>
              <small>MOEDAS DA CIDADE</small>
            </div>
          </div>}
          <button
            className="icon-button"
            onClick={() => setMenu(!menu)}
            aria-label="Configurações"
            aria-expanded={menu}
          >
            ☰
          </button>
        </div>
      </header>
      {menu ? (
        <SettingsPanel close={() => setMenu(false)} />
      ) : showTitle ? (
        <TitleScreen sceneReady={sceneReady} onPlay={() => setShowTitle(false)} />
      ) : (
        <>
          <QuestPanel sceneReady={sceneReady} />
          {s.phase === "OVERVIEW" && (
            <>
              <MapControls />
              <div className="map-instruction">
                <span>♧</span>
                <div>
                  <b>
                    {s.tutorialCompleted
                      ? "A cidade guarda novas histórias."
                      : "Um lugar precisa de você."}
                  </b>
                  <p>
                    {s.tutorialCompleted
                      ? story.overview
                      : story.tutorial.marker}
                  </p>
                </div>
              </div>
            </>
          )}
          <DialogueStage sceneReady={sceneReady} />
          {["FOCUSING", "RETURNING"].includes(s.phase) && (
            <div className="camera-status" role="status">
              {s.phase === "FOCUSING"
                ? "Vamos olhar mais de perto…"
                : "Voltando à cidade…"}
            </div>
          )}
        </>
      )}
      {notice && (
        <div className="notice" role="alert">
          {notice}
        </div>
      )}
      {!showTitle && <footer className="footer">
        <span>CADA ESCOLHA DEIXA UMA MARCA.</span>
        <span>{notice ? "○ Verifique o aviso" : "✓ Progresso automático"}</span>
      </footer>}
      <PerformanceReadout/>
    </div>
  );
}
