import {publicAsset} from '../assets/publicAsset';
import { useEffect, useState } from "react";
import { useGame } from "../stores/gameStore";
import { story } from "../content/story";
import { DialogueStage } from "./dialogue/DialogueStage";
import { QuestPanel } from "./hud/QuestPanel";
import { JourneyNav } from './hud/JourneyNav';
import { Shop } from './wardrobe/Shop';
import { SettingsPanel } from "./menus/SettingsPanel";
import {PerformanceReadout} from './hud/PerformanceReadout';
import { TitleScreen } from './menus/TitleScreen';
export function GameUI({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, notice, leave, overlay, refreshMissions } = useGame();
  const [menu, setMenu] = useState(false);
  // The title is presentation state; opening it must never reset a saved game.
  const [showTitle, setShowTitle] = useState(() => s.phase === 'INTRO' && s.introIndex === 0);
  const showHeader = menu || (!showTitle && !['INTRO', 'FOCUSING', 'COMMENT', 'CONTEXT'].includes(s.phase));
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (useGame.getState().overlay) return;
      if (event.key === 'Escape') { event.preventDefault(); setMenu(open => !open); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => {
    const timer=window.setInterval(refreshMissions,60000);
    return ()=>window.clearInterval(timer);
  },[refreshMissions]);
  return (
    <div className={`interface${showTitle ? ' on-title' : ''}`}>
      <div className="game-hud" inert={Boolean(overlay)}>
      {showHeader && <header className="topbar">
        <div className="header-actions">
          {!showTitle && <div className="balance" aria-label={s.coins + " Moedas da Cidade"}>
            <span className="coin" aria-hidden="true"><img src={publicAsset('/assets/ui/figma/coin.webp')} alt="" /></span>
            <b>{s.coins.toLocaleString("pt-BR")}</b>
          </div>}
          <button
            className="icon-button"
            onClick={() => setMenu(!menu)}
            aria-label="Configurações"
            aria-expanded={menu}
          >
            <img src={publicAsset('/assets/ui/figma/menu.svg')} alt="" />
          </button>
        </div>
      </header>}
      {menu ? (
        <div className="menu-scrim"><SettingsPanel close={() => setMenu(false)} sceneReady={sceneReady} /></div>
      ) : showTitle ? (
        <TitleScreen sceneReady={sceneReady} onPlay={() => setShowTitle(false)} />
      ) : (
        <>
          {s.selectedProblem && ['FOCUSING', 'COMMENT', 'CONTEXT', 'QUESTION', 'RESULT'].includes(s.phase) && (
            <button className="back-to-map" onClick={leave} aria-label="Voltar ao mapa">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18" /></svg>
              Voltar
            </button>
          )}
          {s.phase === 'OVERVIEW' && <JourneyNav />}
          {s.phase === "OVERVIEW" && (
            <>
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
            <div className={s.phase === 'FOCUSING' ? 'camera-preview-status' : 'camera-status'} role="status">
              {s.phase === "FOCUSING"
                ? "Observe o problema. O diálogo aparecerá em instantes…"
                : "Voltando à cidade…"}
            </div>
          )}
        </>
      )}
      {!showTitle && s.phase === 'OVERVIEW' && <footer className="footer">
        <span>CADA ESCOLHA DEIXA UMA MARCA.</span>
        <span>{notice ? "○ Verifique o aviso" : "✓ Progresso automático"}</span>
      </footer>}
      <PerformanceReadout/>
      </div>
      {overlay==='missions' && <QuestPanel sceneReady={sceneReady}/>}
      {overlay==='shop' && <Shop/>}
      {notice && <div className="notice" role="alert">{notice}</div>}
    </div>
  );
}
